-- Migration 001: Create users and user_preferences tables
-- Purpose: Foundation layer - link Supabase Auth with app-specific user data

-- Create ENUM types
CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');
CREATE TYPE gender_seeking_enum AS ENUM ('male', 'female', 'both', 'any');
CREATE TYPE marital_status_enum AS ENUM ('never_married', 'divorced', 'widowed', 'separated');

-- ============================================================================
-- TABLE: users
-- Purpose: Extend Supabase auth.users with app-specific metadata
-- Linked to: auth.users (1:1 relationship via id)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  gender_preference gender_enum NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,

  CONSTRAINT users_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Add comment
COMMENT ON TABLE public.users IS 'Core user table, extended from Supabase auth.users. Every authenticated user has exactly one record here.';

-- Create indexes
CREATE INDEX idx_users_email ON public.users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_phone ON public.users(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_users_gender_preference ON public.users(gender_preference);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);

-- ============================================================================
-- TABLE: user_preferences
-- Purpose: Store search filters and matching criteria per user (1:1 with users)
-- Used for: Discovery queries, matching algorithm, filter application
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  gender_seeking gender_seeking_enum DEFAULT 'any',
  age_min INTEGER DEFAULT 18,
  age_max INTEGER DEFAULT 60,
  location_radius_km INTEGER DEFAULT 100,
  preferred_cities TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_marital_statuses TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_education_levels TEXT[] DEFAULT ARRAY[]::TEXT[],
  height_min_cm INTEGER,
  height_max_cm INTEGER,
  preferred_income_range VARCHAR(100),
  show_profile_to_all BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT age_min_max CHECK (age_min < age_max),
  CONSTRAINT height_min_max CHECK (height_min_cm IS NULL OR height_max_cm IS NULL OR height_min_cm < height_max_cm)
);

-- Add comment
COMMENT ON TABLE public.user_preferences IS 'Search criteria and discovery settings. One per user. Updated when user changes filters.';

-- Create indexes
CREATE INDEX idx_user_preferences_gender_seeking ON public.user_preferences(gender_seeking);
CREATE INDEX idx_user_preferences_age_range ON public.user_preferences(age_min, age_max);
CREATE INDEX idx_user_preferences_show_profile ON public.user_preferences(show_profile_to_all);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own record + public profile info
CREATE POLICY "users_own_profile_visible" ON public.users
  FOR SELECT
  USING (auth.uid() = id OR is_active = TRUE);

-- RLS Policy: Users can only update their own record
CREATE POLICY "users_own_update" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policy: Users can only insert their own record (handled by trigger + auth)
CREATE POLICY "users_own_insert" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Enable RLS on user_preferences table
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read/write their own preferences
CREATE POLICY "user_preferences_own_read_write" ON public.user_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at timestamp on users
CREATE OR REPLACE FUNCTION public.update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_users_updated_at();

-- Trigger: Update updated_at timestamp on user_preferences
CREATE OR REPLACE FUNCTION public.update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_preferences_updated_at();

-- Trigger: Auto-create user_preferences when user is created
CREATE OR REPLACE FUNCTION public.create_user_preferences_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, gender_seeking)
  VALUES (NEW.id, CASE WHEN NEW.gender_preference = 'male' THEN 'female' ELSE 'male' END);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_preferences
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_preferences_on_signup();

-- Grant permissions to authenticated users
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT SELECT, UPDATE ON public.user_preferences TO authenticated;
