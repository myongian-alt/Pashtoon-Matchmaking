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
