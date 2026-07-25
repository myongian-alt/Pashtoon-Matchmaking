import { supabase } from './supabase';
import { EDUCATION_LEVEL_DISPLAY } from './database';

export type CoachTip = {
  key: string;
  title: string;
  description: string;
  cta: string;
  priority: number;
};

export type GentleNudge = {
  nudgeType: string;
  title: string;
  body: string;
  actionLabel?: string;
  actionRoute?: string;
};

export type RecommendationCandidate = {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  currentCity: string;
  location: string;
  education?: string;
  profession?: string;
  compatibility?: number;
  image?: any;
};

export type SmartMatchRecommendation = {
  profileId: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  location: string;
  image?: any;
  reason: string;
  score: number;
};

function hasValue(value: unknown) {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

function normalizeText(value: string | undefined) {
  return (value || '').trim().toLowerCase();
}

function ageWithinRange(age: number, min?: number | null, max?: number | null) {
  if (!age || age <= 0) {
    return false;
  }

  if (typeof min === 'number' && age < min) {
    return false;
  }

  if (typeof max === 'number' && age > max) {
    return false;
  }

  return true;
}

function buildReason(options: {
  sameCity: boolean;
  sameEducation: boolean;
  sameProfession: boolean;
  inPreferredAgeRange: boolean;
}) {
  if (options.sameCity) {
    return 'You both are in the same city.';
  }

  if (options.sameEducation) {
    return 'Similar education background.';
  }

  if (options.sameProfession) {
    return 'Profession is aligned with your profile.';
  }

  if (options.inPreferredAgeRange) {
    return 'Falls within your preferred age range.';
  }

  return 'Strong overall profile quality for your preferences.';
}

export async function getSmartMatchRecommendationsForCurrentUser(
  candidates: RecommendationCandidate[],
  maxRecommendations = 4
) {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { data: [] as SmartMatchRecommendation[], error: authError || new Error('Not authenticated') };
  }

  if (!candidates.length) {
    return { data: [] as SmartMatchRecommendation[], error: null };
  }

  const { data: me, error: meError } = await supabase
    .from('profiles')
    .select('current_city, education_level, profession, preferred_spouse_age_min, preferred_spouse_age_max')
    .eq('user_id', authData.user.id)
    .maybeSingle();

  if (meError) {
    return { data: [] as SmartMatchRecommendation[], error: meError };
  }

  const myCity = normalizeText(me?.current_city);
  // candidate.education is a display string (e.g. "Bachelors"); convert the
  // enum value the same way so the comparison actually lines up.
  const myEducation = normalizeText(EDUCATION_LEVEL_DISPLAY[me?.education_level || ''] || '');
  const myProfession = normalizeText(me?.profession);

  const ranked = candidates
    .map((candidate) => {
      const sameCity = myCity.length > 0 && normalizeText(candidate.currentCity) === myCity;
      const sameEducation =
        myEducation.length > 0 && normalizeText(candidate.education) === myEducation;
      const sameProfession =
        myProfession.length > 0 && normalizeText(candidate.profession) === myProfession;
      const inPreferredAgeRange = ageWithinRange(
        candidate.age,
        me?.preferred_spouse_age_min,
        me?.preferred_spouse_age_max
      );

      let score = 45;
      if (sameCity) score += 18;
      if (sameEducation) score += 12;
      if (sameProfession) score += 10;
      if (inPreferredAgeRange) score += 8;
      if (typeof candidate.compatibility === 'number') score += Math.round(candidate.compatibility * 0.08);

      const clamped = Math.max(50, Math.min(98, score));

      return {
        profileId: candidate.id,
        name: candidate.name,
        age: candidate.age,
        gender: candidate.gender,
        location: candidate.location,
        image: candidate.image,
        reason: buildReason({ sameCity, sameEducation, sameProfession, inPreferredAgeRange }),
        score: clamped,
      } as SmartMatchRecommendation;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxRecommendations);

  return { data: ranked, error: null };
}

export async function getProfileCoachTipsForCurrentUser(maxTips = 3) {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { data: [] as CoachTip[], error: authError || new Error('Not authenticated') };
  }

  const userId = authData.user.id;

  const [{ data: profile, error: profileError }, { data: photos, error: photosError }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, about_me, education_level, profession, current_city, nationality, profile_strength_percentage')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('profile_photos')
      .select('id, photo_type')
      .eq('user_id', userId),
  ]);

  if (profileError || photosError) {
    return { data: [] as CoachTip[], error: profileError || photosError };
  }

  const hasProfilePhoto = (photos || []).some((photo) => photo.photo_type === 'profile_picture');
  const galleryCount = (photos || []).filter((photo) => photo.photo_type === 'gallery').length;
  const tips: CoachTip[] = [];

  if (!hasProfilePhoto) {
    tips.push({
      key: 'profile-photo',
      title: 'Add a clear profile photo',
      description: 'Profiles with a main photo are usually reviewed faster by families.',
      cta: 'Upload photo',
      priority: 100,
    });
  }

  if (galleryCount < 2) {
    tips.push({
      key: 'gallery-photos',
      title: 'Add more gallery photos',
      description: 'Adding 2 to 3 photos helps build trust and improves profile quality.',
      cta: 'Add gallery photos',
      priority: 90,
    });
  }

  if (!hasValue(profile?.about_me)) {
    tips.push({
      key: 'about-me',
      title: 'Write a short About Me',
      description: 'A simple intro about values and family goals improves relevant matches.',
      cta: 'Add About Me',
      priority: 85,
    });
  }

  if (!hasValue(profile?.education_level)) {
    tips.push({
      key: 'education',
      title: 'Add education details',
      description: 'Education helps matching and improves recommendation quality.',
      cta: 'Add education',
      priority: 70,
    });
  }

  if (!hasValue(profile?.profession)) {
    tips.push({
      key: 'profession',
      title: 'Add profession details',
      description: 'Profession context helps families understand compatibility quickly.',
      cta: 'Add profession',
      priority: 65,
    });
  }

  if (!hasValue(profile?.current_city) || !hasValue(profile?.nationality)) {
    tips.push({
      key: 'location',
      title: 'Complete location info',
      description: 'City and country make local and practical matches easier.',
      cta: 'Update location',
      priority: 60,
    });
  }

  const strength = Number(profile?.profile_strength_percentage || 0);
  if (strength >= 75 && tips.length === 0) {
    tips.push({
      key: 'strong-profile',
      title: 'Great profile quality',
      description: 'Your profile looks strong. Keep it active and respond quickly to interests.',
      cta: 'View matches',
      priority: 10,
    });
  }

  const sorted = tips.sort((a, b) => b.priority - a.priority).slice(0, maxTips);
  return { data: sorted, error: null };
}
