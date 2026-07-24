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
-- Migration 002: Create profiles and profile_photos tables
-- Purpose: Store complete matrimonial profile data (80+ fields) and photo metadata

-- Create additional ENUM types needed for profiles
CREATE TYPE body_type_enum AS ENUM ('slim', 'average', 'athletic', 'muscular', 'curvy');
CREATE TYPE blood_group_enum AS ENUM ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-');
CREATE TYPE exercise_frequency_enum AS ENUM ('never', 'occasionally', '1-2x_week', '3-4x_week', 'daily');
CREATE TYPE education_level_enum AS ENUM ('high_school', 'bachelors', 'masters', 'phd', 'diploma');
CREATE TYPE employment_status_enum AS ENUM ('student', 'employed', 'self_employed', 'unemployed', 'retired');
CREATE TYPE income_source_enum AS ENUM ('salary', 'business', 'investment', 'family', 'other');
CREATE TYPE work_timings_enum AS ENUM ('9_to_5', 'shifts', 'flexible', 'freelance');
CREATE TYPE prayer_frequency_enum AS ENUM ('never', 'sometimes', '5_times_daily', 'jummah_only');
CREATE TYPE religion_importance_enum AS ENUM ('not_important', 'somewhat', 'very_important', 'essential');
CREATE TYPE religion_differences_enum AS ENUM ('unacceptable', 'okay', 'flexible');
CREATE TYPE gender_roles_enum AS ENUM ('traditional', 'modern', 'balanced');
CREATE TYPE polygamy_view_enum AS ENUM ('unacceptable', 'acceptable_with_conditions', 'acceptable');
CREATE TYPE family_closeness_enum AS ENUM ('distant', 'normal', 'very_close');
CREATE TYPE inlaw_living_enum AS ENUM ('no', 'temporarily', 'yes', 'would_consider');
CREATE TYPE socialize_frequency_enum AS ENUM ('rarely', 'sometimes', 'often', 'very_often');
CREATE TYPE forgiveness_level_enum AS ENUM ('rarely', 'sometimes', 'often', 'very_forgiving');
CREATE TYPE affection_enum AS ENUM ('reserved', 'moderate', 'expressive');
CREATE TYPE tradmodern_outlook_enum AS ENUM ('very_traditional', 'traditional', 'balanced', 'modern', 'very_modern');
CREATE TYPE sleep_schedule_enum AS ENUM ('early_bird', 'night_owl', 'flexible');
CREATE TYPE weekend_spending_enum AS ENUM ('home', 'casual', 'social', 'adventurous');
CREATE TYPE living_preference_enum AS ENUM ('city', 'suburbs', 'countryside', 'any');
CREATE TYPE marriage_timing_enum AS ENUM ('immediately', 'within_6_months', 'within_1_year', 'later');
CREATE TYPE kids_preference_enum AS ENUM ('0', '1', '2', '3+', 'undecided');
CREATE TYPE photo_type_enum AS ENUM ('profile_picture', 'gallery');

-- ============================================================================
-- TABLE: profiles
-- Purpose: Core matrimonial profile with 80+ fields across 10+ categories
-- Linked to: users (1:1)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,

  -- Basic Information (required)
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  marital_status marital_status_enum NOT NULL,
  has_kids BOOLEAN DEFAULT FALSE,
  kids_count INTEGER,
  city_of_birth VARCHAR(100),
  current_city VARCHAR(100) NOT NULL,
  nationality VARCHAR(100),
  languages TEXT[] DEFAULT ARRAY[]::TEXT[],
  sect VARCHAR(100),
  phone_number VARCHAR(20),

  -- Physical & Health
  height_cm INTEGER,
  weight_kg DECIMAL(5, 2),
  body_type body_type_enum,
  skin_colour VARCHAR(50),
  eye_colour VARCHAR(50),
  blood_group blood_group_enum,
  disabilities VARCHAR(255),
  wears_glasses BOOLEAN DEFAULT FALSE,
  smoker_or_drugs BOOLEAN DEFAULT FALSE,
  medical_conditions VARCHAR(500),
  exercise_frequency exercise_frequency_enum,

  -- Education & Career
  education_level education_level_enum,
  degree_name VARCHAR(100),
  employment_status employment_status_enum,
  business_details VARCHAR(500),
  profession VARCHAR(100),
  monthly_income VARCHAR(100),
  income_source income_source_enum,
  work_timings work_timings_enum,
  future_career_plans VARCHAR(500),

  -- Financial Status
  owns_property BOOLEAN DEFAULT FALSE,
  ancestral_land VARCHAR(500),
  savings VARCHAR(100),
  debts VARCHAR(500),
  owns_car BOOLEAN DEFAULT FALSE,
  money_management VARCHAR(50),

  -- Spiritual & Religious
  prayer_frequency prayer_frequency_enum,
  fast_ramadan BOOLEAN DEFAULT FALSE,
  gives_zakat BOOLEAN DEFAULT FALSE,
  religion_importance religion_importance_enum,
  spouse_religiosity VARCHAR(255),
  religion_differences religion_differences_enum,

  -- Moral & Values
  important_values TEXT[] DEFAULT ARRAY[]::TEXT[],
  handle_disagreements VARCHAR(255),
  gender_roles gender_roles_enum,
  polygamy_view polygamy_view_enum,
  truthfulness VARCHAR(50),

  -- Social & Family
  family_structure VARCHAR(100),
  family_closeness family_closeness_enum,
  live_with_inlaws inlaw_living_enum,
  socialize_frequency socialize_frequency_enum,
  celebrate_customs BOOLEAN DEFAULT FALSE,
  tribal_importance VARCHAR(50),

  -- Psychological & Emotional
  handle_stress VARCHAR(255),
  personality VARCHAR(255),
  forgiveness_level forgiveness_level_enum,
  love_language VARCHAR(255),
  show_affection affection_enum,
  emotional_support_importance VARCHAR(50),

  -- Personality & Lifestyle
  outlook VARCHAR(100),
  tradmodern_outlook tradmodern_outlook_enum,
  casual_dress_comfort BOOLEAN DEFAULT FALSE,
  shoe_style_comfort VARCHAR(100),
  weekend_spending weekend_spending_enum,
  living_preference living_preference_enum,
  sleep_schedule sleep_schedule_enum,
  music_preference VARCHAR(255),
  likes_pets BOOLEAN DEFAULT FALSE,
  travel_preference VARCHAR(255),
  hobbies TEXT[] DEFAULT ARRAY[]::TEXT[],
  favorite_food_books_music VARCHAR(500),

  -- Marriage & Future Vision
  want_to_marry_when marriage_timing_enum,
  preferred_spouse_age_min INTEGER,
  preferred_spouse_age_max INTEGER,
  preferred_spouse_height VARCHAR(50),
  preferred_education TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_profession TEXT[] DEFAULT ARRAY[]::TEXT[],
  prefer_working_spouse BOOLEAN,
  expected_kids kids_preference_enum,
  will_sponsor_spouse BOOLEAN DEFAULT FALSE,
  housing_situation VARCHAR(255),
  spouse_cooking VARCHAR(50),
  allow_spouse_work BOOLEAN DEFAULT FALSE,
  share_household_responsibilities BOOLEAN DEFAULT FALSE,
  ideal_marriage_description TEXT,

  -- About Me
  about_me TEXT,
  interests TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Profile Status & Metadata
  profile_strength_percentage INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  profile_completed_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT age_valid CHECK (DATE_PART('year', AGE(date_of_birth)) >= 18),
  CONSTRAINT height_valid CHECK (height_cm IS NULL OR (height_cm >= 100 AND height_cm <= 250)),
  CONSTRAINT weight_valid CHECK (weight_kg IS NULL OR (weight_kg > 0 AND weight_kg < 300)),
  CONSTRAINT age_range_valid CHECK (
    preferred_spouse_age_min IS NULL OR preferred_spouse_age_max IS NULL OR
    preferred_spouse_age_min < preferred_spouse_age_max
  )
);

-- Add comments
COMMENT ON TABLE public.profiles IS 'Complete matrimonial profile with 80+ fields. One per user. Single source of truth for profile data.';
COMMENT ON COLUMN public.profiles.profile_strength_percentage IS 'Calculated percentage of mandatory fields filled (0-100)';
COMMENT ON COLUMN public.profiles.profile_completed_percentage IS 'Overall completion percentage including optional fields';

-- Create indexes for discovery and filtering
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_marital_status ON public.profiles(marital_status);
CREATE INDEX idx_profiles_education_level ON public.profiles(education_level);
CREATE INDEX idx_profiles_current_city ON public.profiles(current_city);
CREATE INDEX idx_profiles_date_of_birth ON public.profiles(date_of_birth);
CREATE INDEX idx_profiles_is_verified ON public.profiles(is_verified);
CREATE INDEX idx_profiles_profile_strength ON public.profiles(profile_strength_percentage DESC);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX idx_profiles_employment ON public.profiles(employment_status);

-- ============================================================================
-- TABLE: profile_photos
-- Purpose: Photo metadata and storage paths (profile picture + gallery)
-- Linked to: users (N:1), profiles (N:1)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profile_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_url VARCHAR(500) NOT NULL,
  photo_type photo_type_enum NOT NULL DEFAULT 'gallery',
  display_order INTEGER DEFAULT 0,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_profile_picture_per_user UNIQUE (user_id) WHERE photo_type = 'profile_picture',
  CONSTRAINT display_order_non_negative CHECK (display_order >= 0),
  CONSTRAINT display_order_limit CHECK (display_order <= 4)
);

-- Add comments
COMMENT ON TABLE public.profile_photos IS 'Photo metadata for profile picture and gallery photos. Stores paths to Supabase Storage files.';
COMMENT ON COLUMN public.profile_photos.display_order IS '0 = main profile picture, 1-4 = gallery slots';

-- Create indexes
CREATE INDEX idx_profile_photos_user_id ON public.profile_photos(user_id);
CREATE INDEX idx_profile_photos_profile_id ON public.profile_photos(profile_id);
CREATE INDEX idx_profile_photos_type_order ON public.profile_photos(user_id, photo_type, display_order);
CREATE INDEX idx_profile_photos_verified ON public.profile_photos(is_verified);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own profile
CREATE POLICY "profiles_own_read" ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own profile
CREATE POLICY "profiles_own_update" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can insert only their own profile
CREATE POLICY "profiles_own_insert" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Verified profiles are readable by others (for discovery)
CREATE POLICY "profiles_verified_public" ON public.profiles
  FOR SELECT
  USING (is_verified = TRUE);

-- Enable RLS on profile_photos table
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read photos from their own profile
CREATE POLICY "profile_photos_own_read" ON public.profile_photos
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can manage their own photos
CREATE POLICY "profile_photos_own_write" ON public.profile_photos
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Verified profile photos are readable in discovery
CREATE POLICY "profile_photos_verified_public" ON public.profile_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = profile_photos.profile_id AND p.is_verified = TRUE
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at on profiles
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_photos TO authenticated;
-- Migration 003: Create social interaction tables
-- Purpose: Like/reject, connection requests, and matches

-- Create ENUM types
CREATE TYPE like_action_enum AS ENUM ('like', 'reject', 'shortlist');
CREATE TYPE connection_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'expired');
CREATE TYPE match_status_enum AS ENUM ('active', 'inactive', 'blocked');

-- ============================================================================
-- TABLE: likes
-- Purpose: Track all likes, rejections, and shortlists (one-way interactions)
-- Linked to: users (N:1 from both sides)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  liked_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action like_action_enum NOT NULL DEFAULT 'like',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT cannot_like_self CHECK (user_id != liked_user_id),
  CONSTRAINT unique_like_per_pair UNIQUE (user_id, liked_user_id)
);

-- Add comments
COMMENT ON TABLE public.likes IS 'One-way interactions: like, reject, or shortlist. Immutable history of user interactions.';
COMMENT ON COLUMN public.likes.action IS 'like = interested, reject = not interested, shortlist = saved for later';

-- Create indexes
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_likes_liked_user_id ON public.likes(liked_user_id);
CREATE INDEX idx_likes_action ON public.likes(action);
CREATE INDEX idx_likes_created_at ON public.likes(created_at DESC);
CREATE INDEX idx_likes_received ON public.likes(liked_user_id, action) WHERE action = 'like';

-- ============================================================================
-- TABLE: connections
-- Purpose: Interest/connection requests with state (formal two-way handshake)
-- Linked to: users (N:1 from both sides)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status connection_status_enum NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),

  CONSTRAINT cannot_request_self CHECK (requester_id != recipient_id),
  CONSTRAINT message_length CHECK (message IS NULL OR LENGTH(message) <= 500),
  CONSTRAINT unique_connection_per_pair UNIQUE (requester_id, recipient_id),
  CONSTRAINT accepted_date_after_created CHECK (accepted_at IS NULL OR accepted_at >= created_at),
  CONSTRAINT rejected_date_after_created CHECK (rejected_at IS NULL OR rejected_at >= created_at)
);

-- Add comments
COMMENT ON TABLE public.connections IS 'Formal interest requests with state tracking. Can be pending, accepted, rejected, or expire.';
COMMENT ON COLUMN public.connections.status IS 'pending = awaiting response, accepted = mutual interest, rejected = declined, expired = auto-expired after 30 days';
COMMENT ON COLUMN public.connections.message IS 'Optional personal note from requester (max 500 chars)';

-- Create indexes
CREATE INDEX idx_connections_requester_id ON public.connections(requester_id);
CREATE INDEX idx_connections_recipient_id ON public.connections(recipient_id);
CREATE INDEX idx_connections_status ON public.connections(status);
CREATE INDEX idx_connections_created_at ON public.connections(created_at DESC);
CREATE INDEX idx_connections_expires_at ON public.connections(expires_at);
CREATE INDEX idx_connections_pending_inbox ON public.connections(recipient_id, status) WHERE status = 'pending';
CREATE INDEX idx_connections_mutual ON public.connections(requester_id, status) WHERE status = 'accepted';

-- ============================================================================
-- TABLE: matches
-- Purpose: Confirmed bi-directional matches with compatibility score
-- Linked to: users (N:1 from both sides)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_score INTEGER DEFAULT 0,
  match_algorithm_version INTEGER DEFAULT 1,
  status match_status_enum DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT cannot_match_self CHECK (user_1_id != user_2_id),
  CONSTRAINT user_1_less_than_user_2 CHECK (user_1_id < user_2_id),
  CONSTRAINT match_score_valid CHECK (match_score >= 0 AND match_score <= 100),
  CONSTRAINT unique_match_pair UNIQUE (user_1_id, user_2_id)
);

-- Add comments
COMMENT ON TABLE public.matches IS 'Confirmed bi-directional matches. Controls who can message each other. Normalized: user_1_id < user_2_id always.';
COMMENT ON COLUMN public.matches.match_score IS 'Compatibility score (0-100) from matching algorithm';
COMMENT ON COLUMN public.matches.status IS 'active = ongoing, inactive = archived, blocked = one user blocked the other';

-- Create indexes
CREATE INDEX idx_matches_user_1_id ON public.matches(user_1_id);
CREATE INDEX idx_matches_user_2_id ON public.matches(user_2_id);
CREATE INDEX idx_matches_match_score ON public.matches(match_score DESC);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_matches_created_at ON public.matches(created_at DESC);
CREATE INDEX idx_matches_active ON public.matches(status) WHERE status = 'active';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on likes table
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own likes
CREATE POLICY "likes_own_read" ON public.likes
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can see who liked them (to show notifications)
CREATE POLICY "likes_received_read" ON public.likes
  FOR SELECT
  USING (auth.uid() = liked_user_id AND action = 'like');

-- RLS Policy: Users can only write their own likes
CREATE POLICY "likes_own_write" ON public.likes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable RLS on connections table
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read connections they're part of
CREATE POLICY "connections_own_read" ON public.connections
  FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- RLS Policy: Users can only write connections they initiated
CREATE POLICY "connections_own_write" ON public.connections
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- RLS Policy: Recipients can update status of connections to them
CREATE POLICY "connections_recipient_update" ON public.connections
  FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Enable RLS on matches table
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read matches they're part of
CREATE POLICY "matches_own_read" ON public.matches
  FOR SELECT
  USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

-- RLS Policy: System/backend can write matches (admin operations)
-- Note: In production, would use service role or scheduled function
CREATE POLICY "matches_system_write" ON public.matches
  FOR INSERT
  WITH CHECK (TRUE);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at on matches
CREATE OR REPLACE FUNCTION public.update_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_matches_updated_at();

-- Trigger: Auto-accept mutual connections (if both sent requests)
CREATE OR REPLACE FUNCTION public.auto_accept_mutual_connections()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's a reverse connection from recipient to requester
  IF EXISTS (
    SELECT 1 FROM public.connections
    WHERE requester_id = NEW.recipient_id
      AND recipient_id = NEW.requester_id
      AND status = 'pending'
  ) THEN
    -- Both have requested each other - accept automatically
    UPDATE public.connections
    SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
    WHERE requester_id = NEW.recipient_id
      AND recipient_id = NEW.requester_id;
    
    UPDATE public.connections
    SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_accept_mutual_connections
  AFTER INSERT ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_accept_mutual_connections();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.likes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.connections TO authenticated;
GRANT SELECT ON public.matches TO authenticated;
-- Migration 004: Create messaging tables
-- Purpose: 1:1 conversations and individual messages

-- ============================================================================
-- TABLE: conversations
-- Purpose: 1:1 DM thread container with metadata
-- Linked to: users (N:1 from both sides), matches
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_message_preview VARCHAR(255),
  last_message_sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  CONSTRAINT cannot_message_self CHECK (user_1_id != user_2_id),
  CONSTRAINT user_1_less_than_user_2 CHECK (user_1_id < user_2_id),
  CONSTRAINT unique_conversation_pair UNIQUE (user_1_id, user_2_id),
  CONSTRAINT last_message_sender_valid CHECK (
    last_message_sender_id IS NULL OR
    last_message_sender_id = user_1_id OR
    last_message_sender_id = user_2_id
  )
);

-- Add comments
COMMENT ON TABLE public.conversations IS 'Chat threads between matched users. Normalized: user_1_id < user_2_id always. Metadata cached for performance.';
COMMENT ON COLUMN public.conversations.last_message_preview IS 'Cached preview of last message for inbox display (avoid JOIN on messages)';

-- Create indexes
CREATE INDEX idx_conversations_user_1_id ON public.conversations(user_1_id);
CREATE INDEX idx_conversations_user_2_id ON public.conversations(user_2_id);
CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX idx_conversations_active ON public.conversations(user_1_id, updated_at DESC);

-- ============================================================================
-- TABLE: messages
-- Purpose: Individual messages within conversations
-- Linked to: conversations (N:1), users (N:1 for sender)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE,
  edited_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT message_not_empty CHECK (LENGTH(TRIM(message_text)) > 0),
  CONSTRAINT message_length CHECK (LENGTH(message_text) <= 5000),
  CONSTRAINT read_after_created CHECK (read_at IS NULL OR read_at >= created_at),
  CONSTRAINT edited_after_created CHECK (edited_at IS NULL OR edited_at >= created_at)
);

-- Add comments
COMMENT ON TABLE public.messages IS 'Individual messages in conversations. read_at tracks when recipient read the message.';
COMMENT ON COLUMN public.messages.edited_at IS 'Timestamp of last edit (immutable edits, only timestamps updated)';

-- Create indexes
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_unread ON public.messages(conversation_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);

-- Partial index for unread messages per conversation
CREATE INDEX idx_messages_conversation_unread ON public.messages(conversation_id)
  WHERE read_at IS NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on conversations table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read conversations they're part of
CREATE POLICY "conversations_own_read" ON public.conversations
  FOR SELECT
  USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

-- RLS Policy: Conversations are created by system/matches only
-- (should not allow direct user inserts, only via trigger)
CREATE POLICY "conversations_system_insert" ON public.conversations
  FOR INSERT
  WITH CHECK (TRUE);

-- RLS Policy: Can only update metadata of conversations you're in
CREATE POLICY "conversations_own_update" ON public.conversations
  FOR UPDATE
  USING (auth.uid() = user_1_id OR auth.uid() = user_2_id)
  WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id);

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read messages from conversations they're part of
CREATE POLICY "messages_conversation_read" ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.user_1_id = auth.uid() OR c.user_2_id = auth.uid())
    )
  );

-- RLS Policy: Users can only send messages in conversations they're part of
CREATE POLICY "messages_own_send" ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.user_1_id = auth.uid() OR c.user_2_id = auth.uid())
    )
  );

-- RLS Policy: Users can update read_at on messages they received
CREATE POLICY "messages_mark_read" ON public.messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (
          (c.user_1_id = auth.uid() AND sender_id = c.user_2_id) OR
          (c.user_2_id = auth.uid() AND sender_id = c.user_1_id)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (
          (c.user_1_id = auth.uid() AND sender_id = c.user_2_id) OR
          (c.user_2_id = auth.uid() AND sender_id = c.user_1_id)
        )
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update conversation metadata when new message arrives
CREATE OR REPLACE FUNCTION public.update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET 
    updated_at = CURRENT_TIMESTAMP,
    last_message_preview = SUBSTRING(NEW.message_text, 1, 255),
    last_message_sender_id = NEW.sender_id
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_on_new_message();

-- Trigger: Auto-create conversation when match is created
CREATE OR REPLACE FUNCTION public.create_conversation_on_match()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.conversations (user_1_id, user_2_id)
  VALUES (NEW.user_1_id, NEW.user_2_id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_conversation_on_match
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.create_conversation_on_match();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
-- Migration 005: Create notifications table
-- Purpose: Activity feed and alerts for users

-- Create ENUM type for notification types
CREATE TYPE notification_type_enum AS ENUM (
  'like',
  'connection_request',
  'connection_accepted',
  'message',
  'match',
  'profile_verified',
  'payment_success',
  'payment_failed',
  'subscription_expired',
  'system'
);

-- ============================================================================
-- TABLE: notifications
-- Purpose: User activity feed with various notification types
-- Linked to: users (N:1 from both sides - recipient and source)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  notification_type notification_type_enum NOT NULL,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  action_url VARCHAR(500),
  action_object_id UUID,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),

  CONSTRAINT cannot_notify_self CHECK (user_id != source_user_id OR source_user_id IS NULL),
  CONSTRAINT title_not_empty CHECK (LENGTH(TRIM(title)) > 0)
);

-- Add comments
COMMENT ON TABLE public.notifications IS 'Activity feed. One per event. Auto-expires after 30 days. source_user_id nullable for system notifications.';
COMMENT ON COLUMN public.notifications.action_object_id IS 'ID of related object (connection_id, message_id, etc.) for deeplinks';
COMMENT ON COLUMN public.notifications.expires_at IS 'Auto-cleanup date. Notifications older than 30 days can be deleted.';

-- Create indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_source_user_id ON public.notifications(source_user_id);
CREATE INDEX idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX idx_notifications_expires_at ON public.notifications(expires_at);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_unread_count ON public.notifications(user_id, notification_type)
  WHERE read_at IS NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own notifications
CREATE POLICY "notifications_own_read" ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: System/backend can insert notifications
CREATE POLICY "notifications_system_insert" ON public.notifications
  FOR INSERT
  WITH CHECK (TRUE);

-- RLS Policy: Users can mark their own notifications as read
CREATE POLICY "notifications_own_update" ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own notifications
CREATE POLICY "notifications_own_delete" ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Create notification when user receives a like
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    source_user_id,
    notification_type,
    title,
    subtitle,
    action_object_id
  )
  SELECT
    NEW.liked_user_id,
    NEW.user_id,
    'like'::notification_type_enum,
    'New like received',
    'Someone liked your profile',
    NEW.id
  WHERE NEW.action = 'like';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_like
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_like();

-- Trigger: Create notification when connection request is received
CREATE OR REPLACE FUNCTION public.notify_on_connection_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    source_user_id,
    notification_type,
    title,
    subtitle,
    action_object_id
  )
  VALUES (
    NEW.recipient_id,
    NEW.requester_id,
    'connection_request'::notification_type_enum,
    'Connection request received',
    'Someone is interested in connecting',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_connection_request
  AFTER INSERT ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_connection_request();

-- Trigger: Create notification when connection is accepted
CREATE OR REPLACE FUNCTION public.notify_on_connection_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (
      user_id,
      source_user_id,
      notification_type,
      title,
      subtitle,
      action_object_id
    )
    VALUES (
      NEW.requester_id,
      NEW.recipient_id,
      'connection_accepted'::notification_type_enum,
      'Connection accepted!',
      'Your interest was accepted',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_connection_accepted
  AFTER UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_connection_accepted();

-- Trigger: Create notification when new message arrives
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_id UUID;
BEGIN
  -- Determine recipient (the other user in conversation)
  SELECT CASE
    WHEN user_1_id = NEW.sender_id THEN user_2_id
    ELSE user_1_id
  END INTO v_recipient_id
  FROM public.conversations
  WHERE id = NEW.conversation_id;
  
  INSERT INTO public.notifications (
    user_id,
    source_user_id,
    notification_type,
    title,
    subtitle,
    action_object_id
  )
  VALUES (
    v_recipient_id,
    NEW.sender_id,
    'message'::notification_type_enum,
    'New message',
    SUBSTRING(NEW.message_text, 1, 100),
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_message();

-- Trigger: Create notification when new match is created
CREATE OR REPLACE FUNCTION public.notify_on_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify user_1
  INSERT INTO public.notifications (
    user_id,
    source_user_id,
    notification_type,
    title,
    subtitle,
    action_object_id
  )
  VALUES (
    NEW.user_1_id,
    NEW.user_2_id,
    'match'::notification_type_enum,
    'New match!',
    'You have a new match',
    NEW.id
  );
  
  -- Notify user_2
  INSERT INTO public.notifications (
    user_id,
    source_user_id,
    notification_type,
    title,
    subtitle,
    action_object_id
  )
  VALUES (
    NEW.user_2_id,
    NEW.user_1_id,
    'match'::notification_type_enum,
    'New match!',
    'You have a new match',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_match
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_match();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(user_id_param UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.notifications
  WHERE user_id = user_id_param
    AND read_at IS NULL
    AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days';
$$ LANGUAGE sql STABLE;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = CURRENT_TIMESTAMP
  WHERE user_id = user_id_param
    AND read_at IS NULL;
  
  RETURN FOUND::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read(UUID) TO authenticated;
-- Migration 006: Create payments and subscriptions tables
-- Purpose: Financial transactions and premium membership tracking

-- Create ENUM types
CREATE TYPE payment_method_enum AS ENUM ('card', 'bank_transfer', 'admin_contact', 'test');
CREATE TYPE payment_gateway_enum AS ENUM ('stripe', 'manual', 'admin_override');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE subscription_type_enum AS ENUM ('premium_one_time', 'premium_monthly');
CREATE TYPE subscription_status_enum AS ENUM ('active', 'expired', 'cancelled');

-- ============================================================================
-- TABLE: payments
-- Purpose: Immutable payment transaction history for audit & reconciliation
-- Linked to: users (N:1)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_usd DECIMAL(10, 2) NOT NULL,
  payment_method payment_method_enum NOT NULL,
  payment_gateway payment_gateway_enum NOT NULL,
  transaction_id VARCHAR(255),
  status payment_status_enum NOT NULL DEFAULT 'pending',
  currency VARCHAR(3) DEFAULT 'USD',
  failed_reason VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT amount_positive CHECK (amount_usd > 0),
  CONSTRAINT completed_after_created CHECK (completed_at IS NULL OR completed_at >= created_at)
);

-- Add comments
COMMENT ON TABLE public.payments IS 'Immutable payment records for audit trail and reconciliation. One per transaction.';
COMMENT ON COLUMN public.payments.transaction_id IS 'Reference from payment gateway (stripe charge ID, bank reference, etc.)';
COMMENT ON COLUMN public.payments.amount_usd IS 'Always stored in USD for reporting. Can accept PKR, convert to USD, store here.';

-- Create indexes
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX idx_payments_payment_method ON public.payments(payment_method);
CREATE INDEX idx_payments_gateway ON public.payments(payment_gateway);
CREATE INDEX idx_payments_transaction_id ON public.payments(transaction_id) WHERE transaction_id IS NOT NULL;

-- ============================================================================
-- TABLE: subscriptions
-- Purpose: Active premium membership status (mutable, linked to payments)
-- Linked to: users (N:1, UNIQUE active), payments (N:1)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  subscription_type subscription_type_enum NOT NULL,
  status subscription_status_enum NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT expires_after_started CHECK (expires_at > started_at)
);

-- Add comments
COMMENT ON TABLE public.subscriptions IS 'Active membership status per user. One per user. Tracks expiration for feature gating (contact details, messaging).';
COMMENT ON COLUMN public.subscriptions.status IS 'active = can access premium, expired = no access, cancelled = manually disabled';
COMMENT ON COLUMN public.subscriptions.payment_id IS 'FK to payment that created this subscription (immutable)';

-- Create indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON public.subscriptions(expires_at);
CREATE INDEX idx_subscriptions_active_check ON public.subscriptions(user_id, status, expires_at)
  WHERE status = 'active';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own payment history
CREATE POLICY "payments_own_read" ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: System/backend can insert payments
CREATE POLICY "payments_system_insert" ON public.payments
  FOR INSERT
  WITH CHECK (TRUE);

-- RLS Policy: System/backend can update payments (mark complete/failed)
CREATE POLICY "payments_system_update" ON public.payments
  FOR UPDATE
  USING (TRUE)
  WITH CHECK (TRUE);

-- Enable RLS on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own subscription
CREATE POLICY "subscriptions_own_read" ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: System/backend can insert/update subscriptions
CREATE POLICY "subscriptions_system_write" ON public.subscriptions
  FOR ALL
  WITH CHECK (TRUE);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at on subscriptions
CREATE OR REPLACE FUNCTION public.update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscriptions_updated_at();

-- Trigger: Create notification when payment succeeds
CREATE OR REPLACE FUNCTION public.notify_on_payment_success()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.notifications (
      user_id,
      notification_type,
      title,
      subtitle
    )
    VALUES (
      NEW.user_id,
      'payment_success'::notification_type_enum,
      'Payment successful!',
      'Your premium membership is now active. Our admin team will contact you soon.'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_payment_success
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_payment_success();

-- Trigger: Create notification when payment fails
CREATE OR REPLACE FUNCTION public.notify_on_payment_failed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    INSERT INTO public.notifications (
      user_id,
      notification_type,
      title,
      subtitle
    )
    VALUES (
      NEW.user_id,
      'payment_failed'::notification_type_enum,
      'Payment failed',
      'There was an issue processing your payment. Please try again or contact support.'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_payment_failed
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_payment_failed();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Check if user is active premium member
CREATE OR REPLACE FUNCTION public.is_user_premium(user_id_param UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1
      FROM public.subscriptions
      WHERE user_id = user_id_param
        AND status = 'active'
        AND expires_at > CURRENT_TIMESTAMP
    ),
    FALSE
  );
$$ LANGUAGE sql STABLE;

-- Function: Get user's subscription expiry date
CREATE OR REPLACE FUNCTION public.get_subscription_expiry(user_id_param UUID)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
  SELECT expires_at
  FROM public.subscriptions
  WHERE user_id = user_id_param
    AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Function: Create payment and subscription (transactional)
CREATE OR REPLACE FUNCTION public.process_payment(
  user_id_param UUID,
  amount_usd_param DECIMAL,
  payment_method_param payment_method_enum,
  transaction_id_param VARCHAR
)
RETURNS TABLE (payment_id UUID, subscription_id UUID) AS $$
DECLARE
  v_payment_id UUID;
  v_subscription_id UUID;
BEGIN
  -- Insert payment record
  INSERT INTO public.payments (
    user_id,
    amount_usd,
    payment_method,
    payment_gateway,
    transaction_id,
    status,
    completed_at
  )
  VALUES (
    user_id_param,
    amount_usd_param,
    payment_method_param,
    CASE payment_method_param
      WHEN 'card' THEN 'stripe'::payment_gateway_enum
      WHEN 'bank_transfer' THEN 'manual'::payment_gateway_enum
      WHEN 'admin_contact' THEN 'admin_override'::payment_gateway_enum
      WHEN 'test' THEN 'stripe'::payment_gateway_enum
    END,
    transaction_id_param,
    'completed'::payment_status_enum,
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_payment_id;

  -- Insert or update subscription
  INSERT INTO public.subscriptions (
    user_id,
    payment_id,
    subscription_type,
    status,
    expires_at
  )
  VALUES (
    user_id_param,
    v_payment_id,
    'premium_one_time'::subscription_type_enum,
    'active'::subscription_status_enum,
    CURRENT_TIMESTAMP + INTERVAL '365 days'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    payment_id = v_payment_id,
    status = 'active'::subscription_status_enum,
    expires_at = CURRENT_TIMESTAMP + INTERVAL '365 days',
    updated_at = CURRENT_TIMESTAMP
  RETURNING id INTO v_subscription_id;

  RETURN QUERY SELECT v_payment_id, v_subscription_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_premium(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscription_expiry(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_payment(UUID, DECIMAL, payment_method_enum, VARCHAR) TO authenticated;
-- Migration 007: Create verification and moderation tables
-- Purpose: Profile badges, verification tracking, and abuse reporting

-- Create ENUM types
CREATE TYPE verification_method_enum AS ENUM (
  'manual_admin',
  'id_document',
  'phone_verified',
  'email_verified',
  'none'
);
CREATE TYPE report_type_enum AS ENUM (
  'fake_profile',
  'inappropriate_content',
  'harassment',
  'scam',
  'catfish',
  'other'
);
CREATE TYPE report_status_enum AS ENUM ('open', 'under_review', 'resolved', 'dismissed');

-- ============================================================================
-- TABLE: profile_verification
-- Purpose: Track verification badges and admin approval status
-- Linked to: users (1:1)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profile_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_method verification_method_enum DEFAULT 'none',
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  verification_notes TEXT,
  needs_recheck BOOLEAN DEFAULT FALSE,
  recheck_requested_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT verified_at_required_if_verified CHECK (
    is_verified = FALSE OR verified_at IS NOT NULL
  ),
  CONSTRAINT notes_only_if_verified CHECK (
    is_verified = TRUE OR verification_notes IS NULL
  )
);

-- Add comments
COMMENT ON TABLE public.profile_verification IS 'Admin verification status and badge tracking. One per user. Separate from profile data for independent updates.';
COMMENT ON COLUMN public.profile_verification.is_verified IS 'Whether user has the verified badge';
COMMENT ON COLUMN public.profile_verification.verification_method IS 'How the user was verified (manual, ID doc, phone, email)';
COMMENT ON COLUMN public.profile_verification.needs_recheck IS 'Flag to request re-verification of existing verified profile';

-- Create indexes
CREATE INDEX idx_profile_verification_user_id ON public.profile_verification(user_id);
CREATE INDEX idx_profile_verification_is_verified ON public.profile_verification(is_verified);
CREATE INDEX idx_profile_verification_verified_at ON public.profile_verification(verified_at DESC);
CREATE INDEX idx_profile_verification_needs_recheck ON public.profile_verification(needs_recheck)
  WHERE needs_recheck = TRUE;

-- ============================================================================
-- TABLE: reports
-- Purpose: User-generated abuse/spam reports with admin workflow
-- Linked to: users (N:1 from both reporter and reported)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  reported_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  report_type report_type_enum NOT NULL,
  description TEXT NOT NULL,
  status report_status_enum DEFAULT 'open',
  resolution_notes TEXT,
  resolved_by_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT cannot_report_self CHECK (reported_by != reported_user_id),
  CONSTRAINT description_not_empty CHECK (LENGTH(TRIM(description)) > 0),
  CONSTRAINT resolution_notes_only_if_resolved CHECK (
    status = 'open' OR status = 'under_review' OR resolution_notes IS NOT NULL
  ),
  CONSTRAINT resolved_at_only_if_resolved CHECK (
    status IN ('open', 'under_review') OR resolved_at IS NOT NULL
  )
);

-- Add comments
COMMENT ON TABLE public.reports IS 'Abuse/spam reports submitted by users. Admin queue for investigation and action.';
COMMENT ON COLUMN public.reports.report_type IS 'Category of report for triage (fake, harassment, scam, catfish, inappropriate, other)';
COMMENT ON COLUMN public.reports.status IS 'open = new, under_review = admin investigating, resolved = action taken, dismissed = false report';

-- Create indexes
CREATE INDEX idx_reports_reported_user_id ON public.reports(reported_user_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX idx_reports_report_type ON public.reports(report_type);
CREATE INDEX idx_reports_open_queue ON public.reports(created_at DESC) WHERE status IN ('open', 'under_review');

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on profile_verification table
ALTER TABLE public.profile_verification ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own verification status
CREATE POLICY "profile_verification_own_read" ON public.profile_verification
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Verified status is public (everyone can see who's verified)
CREATE POLICY "profile_verification_public_read" ON public.profile_verification
  FOR SELECT
  USING (is_verified = TRUE);

-- RLS Policy: Admin/system only for write operations
CREATE POLICY "profile_verification_admin_write" ON public.profile_verification
  FOR ALL
  WITH CHECK (TRUE);

-- Enable RLS on reports table
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read reports they submitted
CREATE POLICY "reports_own_read" ON public.reports
  FOR SELECT
  USING (auth.uid() = reported_by);

-- RLS Policy: Reported users can see reports against them
CREATE POLICY "reports_target_read" ON public.reports
  FOR SELECT
  USING (auth.uid() = reported_user_id);

-- RLS Policy: Users can submit reports
CREATE POLICY "reports_own_write" ON public.reports
  FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

-- RLS Policy: Admin/system can read and update reports
CREATE POLICY "reports_admin_write" ON public.reports
  FOR ALL
  WITH CHECK (TRUE);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at on profile_verification
CREATE OR REPLACE FUNCTION public.update_profile_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profile_verification_updated_at
  BEFORE UPDATE ON public.profile_verification
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_verification_updated_at();

-- Trigger: Update profile is_verified flag when verification changes
CREATE OR REPLACE FUNCTION public.sync_profile_verified_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET is_verified = NEW.is_verified,
      updated_at = CURRENT_TIMESTAMP
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_profile_verified_status
  AFTER UPDATE ON public.profile_verification
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_verified_status();

-- Trigger: Create notification when profile is verified
CREATE OR REPLACE FUNCTION public.notify_on_profile_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_verified = TRUE AND OLD.is_verified = FALSE THEN
    INSERT INTO public.notifications (
      user_id,
      notification_type,
      title,
      subtitle
    )
    VALUES (
      NEW.user_id,
      'profile_verified'::notification_type_enum,
      'Profile verified!',
      'Your profile has been verified and now displays a badge'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_profile_verified
  AFTER UPDATE ON public.profile_verification
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_profile_verified();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get report count for a user (for profile health check)
CREATE OR REPLACE FUNCTION public.get_user_report_count(user_id_param UUID)
RETURNS TABLE (
  total_reports INTEGER,
  open_reports INTEGER,
  resolved_reports INTEGER
) AS $$
  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE status IN ('open', 'under_review'))::INTEGER,
    COUNT(*) FILTER (WHERE status = 'resolved')::INTEGER
  FROM public.reports
  WHERE reported_user_id = user_id_param;
$$ LANGUAGE sql STABLE;

-- Function: Check if user has critical reports (for automated suppression)
CREATE OR REPLACE FUNCTION public.has_critical_reports(user_id_param UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.reports
    WHERE reported_user_id = user_id_param
      AND status = 'resolved'
      AND report_type IN ('fake_profile', 'scam')
      AND resolved_at > CURRENT_TIMESTAMP - INTERVAL '90 days'
  );
$$ LANGUAGE sql STABLE;

-- Function: Flag profile for recheck
CREATE OR REPLACE FUNCTION public.flag_profile_for_recheck(user_id_param UUID, reason TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profile_verification
  SET 
    needs_recheck = TRUE,
    recheck_requested_at = CURRENT_TIMESTAMP,
    verification_notes = COALESCE(verification_notes || E'\n', '') || 'Recheck requested: ' || COALESCE(reason, 'Admin review')
  WHERE user_id = user_id_param;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON public.profile_verification TO authenticated;
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_report_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_critical_reports(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.flag_profile_for_recheck(UUID, TEXT) TO authenticated;
