import { supabase } from './supabase';

type ProfileFormSnapshot = {
  name?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  cityOfBirth?: string;
  currentCity?: string;
  nationality?: string;
  phoneNumber?: string;
  educationLevel?: string;
  degreeeName?: string;
  profession?: string;
  aboutMe?: string;
  profileStrength?: number;
  // Physical & Health
  height?: string;
  weight?: string;
  bodyType?: string;
  skinColour?: string;
  eyeColour?: string;
  bloodGroup?: string;
  exerciseFrequency?: string;
  smokerDrugs?: string;
  // Career
  employmentStatus?: string;
  monthlyIncome?: string;
  futureCareerPlans?: string;
  // Financial
  ownsProperty?: string;
  ancestralLand?: string;
  savings?: string;
  debts?: string;
  ownsCar?: string;
  moneyManagement?: string;
  // Religious
  prayerFrequency?: string;
  fastRamadan?: string;
  givesZakat?: string;
  religionImportance?: string;
  spouseReligiosity?: string;
  // Values
  importantValue?: string;
  handleDisagreements?: string;
  genderRoles?: string;
  polygamyView?: string;
  // Family
  familyStructure?: string;
  familyCloseness?: string;
  liveWithInlaws?: string;
  socializeFrequency?: string;
  celebrateCustoms?: string;
  // Emotional
  handleStress?: string;
  personality?: string;
  forgivenessLevel?: string;
  loveLanguage?: string;
  showAffection?: string;
  // Lifestyle
  outlook?: string;
  tradModernOutlook?: string;
  musicPreference?: string;
  hobbies?: string;
  // Marriage
  wantToMarryWhen?: string;
  preferredSpouseAge?: string;
  preferredEducation?: string;
  preferredProfession?: string;
  preferWorkingSpouse?: string;
  expectedKids?: string;
  idealMarriage?: string;
};

const MARITAL_STATUS_MAP: Record<string, 'never_married' | 'married' | 'divorced' | 'widowed' | 'separated'> = {
  Single: 'never_married',
  Married: 'married',
  Divorced: 'divorced',
  Widowed: 'widowed',
  Separated: 'separated',
};

const MARITAL_STATUS_DISPLAY: Record<string, string> = Object.fromEntries(
  Object.entries(MARITAL_STATUS_MAP).map(([display, dbValue]) => [dbValue, display])
);

const EDUCATION_LEVEL_MAP: Record<string, 'high_school' | 'bachelors' | 'masters' | 'phd' | 'diploma'> = {
  'High School': 'high_school',
  Bachelors: 'bachelors',
  Masters: 'masters',
  PhD: 'phd',
  Diploma: 'diploma',
};

export const EDUCATION_LEVEL_DISPLAY: Record<string, string> = Object.fromEntries(
  Object.entries(EDUCATION_LEVEL_MAP).map(([display, dbValue]) => [dbValue, display])
);

// ============================================================================
// EXTENDED PROFILE FIELD MAPS (Physical/Career/Financial/Religious/Values/
// Family/Emotional/Lifestyle/Marriage sections)
//
// Same two-map pattern as MARITAL_STATUS/EDUCATION_LEVEL above, for every
// enum-backed column the full ~90-field form collects but
// upsertCurrentUserProfile previously dropped on the floor (only ~12 core
// fields were ever persisted - see CLAUDE.md). The UI's option label sets
// and the Postgres enums' value sets were defined independently and don't
// always line up 1:1 - where a UI label has no sensible matching enum
// value, it maps to `null` (profile_strength/compatibility scoring just
// treats that as "not answered") rather than guessing a wrong one. This is
// a one-way judgment call per field, not a mechanical transform - documented
// inline wherever it isn't obvious.
// ============================================================================

export function yesNoToBool(value?: string): boolean | null {
  if (value === 'Yes') return true;
  if (value === 'No') return false;
  return null;
}

export function boolToYesNo(value: boolean | null | undefined): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return '';
}

// Height: UI collects a fixed feet'inches" string, DB wants an exact cm
// integer. Parsing feet/inches to cm is exact; going back, we snap to
// whichever of the UI's own fixed options is numerically closest, since the
// DB never stores the original string.
const HEIGHT_OPTIONS = ['4\'10"', '4\'11"', '5\'0"', '5\'2"', '5\'4"', '5\'6"', '5\'8"', '5\'10"', '6\'0"', '6\'2"', '6\'4"'];
export function heightLabelToCm(label?: string): number | null {
  const match = /^(\d+)'(\d+)"?$/.exec((label || '').trim());
  if (!match) return null;
  const feet = parseInt(match[1], 10);
  const inches = parseInt(match[2], 10);
  return Math.round(feet * 30.48 + inches * 2.54);
}
export function cmToHeightLabel(cm?: number | null): string {
  if (typeof cm !== 'number') return '';
  let closest = HEIGHT_OPTIONS[0];
  let smallestDiff = Infinity;
  for (const label of HEIGHT_OPTIONS) {
    const labelCm = heightLabelToCm(label);
    if (labelCm === null) continue;
    const diff = Math.abs(labelCm - cm);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closest = label;
    }
  }
  return closest;
}

// Weight: UI collects a bucket ("70-80kg"), DB wants an exact numeric kg -
// there's no single correct exact value for a bucket, so this stores the
// bucket's midpoint as a deliberate, documented approximation (reasonable
// for a soft compatibility signal, not an exact measurement). Going back,
// snap to whichever bucket contains the stored value.
const WEIGHT_BUCKETS: { label: string; min: number; max: number; midpoint: number }[] = [
  { label: 'Under 50kg', min: 0, max: 50, midpoint: 45 },
  { label: '50-60kg', min: 50, max: 60, midpoint: 55 },
  { label: '60-70kg', min: 60, max: 70, midpoint: 65 },
  { label: '70-80kg', min: 70, max: 80, midpoint: 75 },
  { label: '80-90kg', min: 80, max: 90, midpoint: 85 },
  { label: '90-100kg', min: 90, max: 100, midpoint: 95 },
  { label: '100kg+', min: 100, max: Infinity, midpoint: 105 },
];
export function weightLabelToKg(label?: string): number | null {
  const bucket = WEIGHT_BUCKETS.find((b) => b.label === label);
  return bucket ? bucket.midpoint : null;
}
export function kgToWeightLabel(kg?: number | null): string {
  if (typeof kg !== 'number') return '';
  const bucket = WEIGHT_BUCKETS.find((b) => kg >= b.min && kg < b.max) || WEIGHT_BUCKETS[WEIGHT_BUCKETS.length - 1];
  return bucket.label;
}

// Preferred spouse age: same bucket-range shape as weight, but split across
// two integer columns (min/max) rather than one approximate value - no
// precision is lost here, "18-25" means exactly min=18/max=25.
export function ageRangeLabelToMinMax(label?: string): { min: number | null; max: number | null } {
  if (!label || label === 'No preference') return { min: null, max: null };
  const plusMatch = /^(\d+)\+$/.exec(label);
  if (plusMatch) return { min: parseInt(plusMatch[1], 10), max: null };
  const rangeMatch = /^(\d+)-(\d+)$/.exec(label);
  if (rangeMatch) return { min: parseInt(rangeMatch[1], 10), max: parseInt(rangeMatch[2], 10) };
  return { min: null, max: null };
}
const AGE_RANGE_OPTIONS = ['18-25', '25-30', '30-35', '35-40', '40+', 'No preference'];
export function minMaxToAgeRangeLabel(min?: number | null, max?: number | null): string {
  if (min == null && max == null) return 'No preference';
  for (const label of AGE_RANGE_OPTIONS) {
    const parsed = ageRangeLabelToMinMax(label);
    if (parsed.min === min && parsed.max === max) return label;
  }
  return 'No preference';
}

const BODY_TYPE_MAP: Record<string, string> = {
  Slim: 'slim', Athletic: 'athletic', Average: 'average', Curvy: 'curvy',
  // 'Heavyset' has no matching DB enum value (slim/average/athletic/muscular/curvy) - left unmapped.
};
const BODY_TYPE_DISPLAY = invert(BODY_TYPE_MAP);

const EXERCISE_FREQUENCY_MAP: Record<string, string> = {
  Never: 'never', '1-2x/week': '1-2x_week', '3-4x/week': '3-4x_week', Daily: 'daily',
  // '5-6x/week' has no matching DB enum value - left unmapped.
};
const EXERCISE_FREQUENCY_DISPLAY = invert(EXERCISE_FREQUENCY_MAP);

const EMPLOYMENT_STATUS_MAP: Record<string, string> = {
  Employed: 'employed', Student: 'student', Retired: 'retired',
  // 'Self-Employed'/'Business Owner'/'Freelancer'/'Homemaker' have no clean 1:1 DB
  // equivalent among student/employed/self_employed/unemployed/retired - left unmapped
  // rather than guessing (e.g. Homemaker != unemployed).
};
const EMPLOYMENT_STATUS_DISPLAY = invert(EMPLOYMENT_STATUS_MAP);

const PRAYER_FREQUENCY_MAP: Record<string, string> = {
  '5 times daily': '5_times_daily', Sometimes: 'sometimes', Never: 'never',
  // '3-4 times daily'/'1-2 times daily'/'Rarely' have no matching DB enum value.
};
const PRAYER_FREQUENCY_DISPLAY = invert(PRAYER_FREQUENCY_MAP);

const RELIGION_IMPORTANCE_MAP: Record<string, string> = {
  'Very Important': 'very_important', Important: 'somewhat', Moderate: 'somewhat', 'Not Important': 'not_important',
};
const RELIGION_IMPORTANCE_DISPLAY = invert(RELIGION_IMPORTANCE_MAP, 'Important');

const GENDER_ROLES_MAP: Record<string, string> = {
  Traditional: 'traditional', Modern: 'modern', Balanced: 'balanced',
  // 'No preference' has no matching DB enum value.
};
const GENDER_ROLES_DISPLAY = invert(GENDER_ROLES_MAP);

const POLYGAMY_VIEW_MAP: Record<string, string> = {
  Acceptable: 'acceptable', 'Not acceptable': 'unacceptable', Situational: 'acceptable_with_conditions',
  // 'No preference' has no matching DB enum value.
};
const POLYGAMY_VIEW_DISPLAY = invert(POLYGAMY_VIEW_MAP);

const FAMILY_CLOSENESS_MAP: Record<string, string> = {
  'Very Close': 'very_close', Close: 'normal', Moderate: 'normal', Distant: 'distant',
};
const FAMILY_CLOSENESS_DISPLAY = invert(FAMILY_CLOSENESS_MAP, 'Close');

const INLAW_LIVING_MAP: Record<string, string> = { Yes: 'yes', No: 'no' };

const SOCIALIZE_FREQUENCY_MAP: Record<string, string> = {
  'Very often': 'very_often', Often: 'often', Sometimes: 'sometimes', Rarely: 'rarely',
  // 'Never' has no matching DB enum value (rarely/sometimes/often/very_often).
};
const SOCIALIZE_FREQUENCY_DISPLAY = invert(SOCIALIZE_FREQUENCY_MAP);

const FORGIVENESS_LEVEL_MAP: Record<string, string> = {
  'Very forgiving': 'very_forgiving', Forgiving: 'often', Moderate: 'sometimes',
  'Hold grudges': 'rarely', 'Very difficult to forgive': 'rarely',
};
const FORGIVENESS_LEVEL_DISPLAY = invert(FORGIVENESS_LEVEL_MAP, 'Hold grudges');

const SHOW_AFFECTION_MAP: Record<string, string> = {
  'Very openly': 'expressive', Openly: 'expressive', Moderate: 'moderate', Reserved: 'reserved',
};
const SHOW_AFFECTION_DISPLAY = invert(SHOW_AFFECTION_MAP, 'Openly');

const TRAD_MODERN_OUTLOOK_MAP: Record<string, string> = {
  Traditional: 'traditional', Modern: 'modern', Balanced: 'balanced',
};
const TRAD_MODERN_OUTLOOK_DISPLAY = invert(TRAD_MODERN_OUTLOOK_MAP);

const MARRIAGE_TIMING_MAP: Record<string, string> = {
  Immediately: 'immediately', '1-3 months': 'within_6_months', '3-6 months': 'within_6_months',
  '6-12 months': 'within_1_year', '1-2 years': 'later', 'No rush': 'later',
};
const MARRIAGE_TIMING_DISPLAY = invert(MARRIAGE_TIMING_MAP, '1-3 months');

const KIDS_PREFERENCE_MAP: Record<string, string> = {
  '0': '0', '1': '1', '2': '2', '3': '3+', '3+': '3+', Undecided: 'undecided',
};
const KIDS_PREFERENCE_DISPLAY = invert(KIDS_PREFERENCE_MAP, '3');

// Builds a DB-value -> UI-label reverse lookup from a UI-label -> DB-value
// map. Several maps above intentionally send more than one UI label to the
// same DB value (e.g. Forgiving/Moderate -> often/sometimes is fine, but
// collisions do happen) - `preferredDisplay`, if given, wins when a DB value
// has more than one possible UI label, so re-opening the form shows the more
// likely original choice rather than whichever label happened to be last in
// object-key order.
function invert(map: Record<string, string>, preferredDisplay?: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [display, dbValue] of Object.entries(map)) {
    if (!(dbValue in result) || display === preferredDisplay) {
      result[dbValue] = display;
    }
  }
  return result;
}

export function toArrayOrNull(value?: string | null): string[] | null {
  const trimmed = (value || '').trim();
  if (!trimmed || trimmed === 'No preference' || trimmed === 'Any') return null;
  return [trimmed];
}

// Hobbies is a single free-text textarea in the UI but an array column in
// the DB - split on commas/newlines into individual trimmed tags.
export function hobbiesTextToArray(value?: string): string[] | null {
  const parts = (value || '')
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : null;
}
export function hobbiesArrayToText(value?: string[] | null): string {
  return Array.isArray(value) ? value.join(', ') : '';
}

function normalizeDateOfBirth(value?: string): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  // Keep a valid adult fallback date to satisfy DB constraints.
  return '1995-01-01';
}

function normalizeMaritalStatus(value?: string): 'never_married' | 'married' | 'divorced' | 'widowed' | 'separated' {
  return MARITAL_STATUS_MAP[value || ''] || 'never_married';
}

function normalizeEducationLevel(value?: string): 'high_school' | 'bachelors' | 'masters' | 'phd' | 'diploma' | null {
  return EDUCATION_LEVEL_MAP[value || ''] || null;
}

export async function ensureCurrentUserRecord(gender: 'male' | 'female' = 'male') {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  const user = authData.user;

  // Supabase Auth returns '' (not null/undefined) for the phone/email a user
  // didn't sign up with - e.g. an email/password user has user.phone === ''.
  // Both columns are UNIQUE, so upserting that '' as-is collides with every
  // other email-only (or phone-only) user's row after the first one claims
  // it, and the whole upsert - and therefore the profile save that depends
  // on it - fails with a duplicate-key error for everyone after that.
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        id: user.id,
        email: user.email || null,
        phone: user.phone || null,
        gender_preference: gender,
        is_active: true,
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  return { data, error };
}

export async function upsertCurrentUserProfile(
  formData: ProfileFormSnapshot,
  selectedGender: 'male' | 'female' = 'male'
) {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  const ensured = await ensureCurrentUserRecord(selectedGender);
  if (ensured.error) {
    return { data: null, error: ensured.error };
  }

  const payload: Record<string, unknown> = {
    user_id: authData.user.id,
    full_name: (formData.name || 'New User').trim(),
    date_of_birth: normalizeDateOfBirth(formData.dateOfBirth),
    marital_status: normalizeMaritalStatus(formData.maritalStatus),
    city_of_birth: (formData.cityOfBirth || '').trim() || null,
    current_city: (formData.currentCity || '').trim() || 'Not set',
    nationality: (formData.nationality || '').trim() || null,
    phone_number: (formData.phoneNumber || '').trim() || null,
    education_level: normalizeEducationLevel(formData.educationLevel),
    degree_name: (formData.degreeeName || '').trim() || null,
    profession: (formData.profession || '').trim() || null,
    about_me: (formData.aboutMe || '').trim() || null,

    // Physical & Health
    height_cm: heightLabelToCm(formData.height),
    weight_kg: weightLabelToKg(formData.weight),
    body_type: BODY_TYPE_MAP[formData.bodyType || ''] || null,
    skin_colour: (formData.skinColour || '').trim() || null,
    eye_colour: (formData.eyeColour || '').trim() || null,
    blood_group: (formData.bloodGroup || '').trim() || null,
    exercise_frequency: EXERCISE_FREQUENCY_MAP[formData.exerciseFrequency || ''] || null,
    smoker_or_drugs: yesNoToBool(formData.smokerDrugs),

    // Career
    employment_status: EMPLOYMENT_STATUS_MAP[formData.employmentStatus || ''] || null,
    monthly_income: (formData.monthlyIncome || '').trim() || null,
    future_career_plans: (formData.futureCareerPlans || '').trim() || null,

    // Financial - ownsProperty/ownsCar are real boolean columns; ancestralLand/
    // savings/debts are varchar columns, so the raw Yes/No string is stored as-is.
    owns_property: yesNoToBool(formData.ownsProperty),
    ancestral_land: (formData.ancestralLand || '').trim() || null,
    savings: (formData.savings || '').trim() || null,
    debts: (formData.debts || '').trim() || null,
    owns_car: yesNoToBool(formData.ownsCar),
    money_management: (formData.moneyManagement || '').trim() || null,

    // Religious
    prayer_frequency: PRAYER_FREQUENCY_MAP[formData.prayerFrequency || ''] || null,
    fast_ramadan: yesNoToBool(formData.fastRamadan),
    gives_zakat: yesNoToBool(formData.givesZakat),
    religion_importance: RELIGION_IMPORTANCE_MAP[formData.religionImportance || ''] || null,
    spouse_religiosity: (formData.spouseReligiosity || '').trim() || null,

    // Values
    important_values: toArrayOrNull(formData.importantValue),
    handle_disagreements: (formData.handleDisagreements || '').trim() || null,
    gender_roles: GENDER_ROLES_MAP[formData.genderRoles || ''] || null,
    polygamy_view: POLYGAMY_VIEW_MAP[formData.polygamyView || ''] || null,

    // Family
    family_structure: (formData.familyStructure || '').trim() || null,
    family_closeness: FAMILY_CLOSENESS_MAP[formData.familyCloseness || ''] || null,
    live_with_inlaws: INLAW_LIVING_MAP[formData.liveWithInlaws || ''] || null,
    socialize_frequency: SOCIALIZE_FREQUENCY_MAP[formData.socializeFrequency || ''] || null,
    celebrate_customs: yesNoToBool(formData.celebrateCustoms),

    // Emotional
    handle_stress: (formData.handleStress || '').trim() || null,
    personality: (formData.personality || '').trim() || null,
    forgiveness_level: FORGIVENESS_LEVEL_MAP[formData.forgivenessLevel || ''] || null,
    love_language: (formData.loveLanguage || '').trim() || null,
    show_affection: SHOW_AFFECTION_MAP[formData.showAffection || ''] || null,

    // Lifestyle
    outlook: (formData.outlook || '').trim() || null,
    tradmodern_outlook: TRAD_MODERN_OUTLOOK_MAP[formData.tradModernOutlook || ''] || null,
    music_preference: (formData.musicPreference || '').trim() || null,
    hobbies: hobbiesTextToArray(formData.hobbies),

    // Marriage & Future Vision
    want_to_marry_when: MARRIAGE_TIMING_MAP[formData.wantToMarryWhen || ''] || null,
    preferred_education: toArrayOrNull(formData.preferredEducation),
    preferred_profession: toArrayOrNull(formData.preferredProfession),
    prefer_working_spouse:
      formData.preferWorkingSpouse === 'Working' ? true : formData.preferWorkingSpouse === 'Homemaker' ? false : null,
    expected_kids: KIDS_PREFERENCE_MAP[formData.expectedKids || ''] || null,
    ideal_marriage_description: (formData.idealMarriage || '').trim() || null,
  };

  const ageRange = ageRangeLabelToMinMax(formData.preferredSpouseAge);
  payload.preferred_spouse_age_min = ageRange.min;
  payload.preferred_spouse_age_max = ageRange.max;

  if (typeof formData.profileStrength === 'number') {
    payload.profile_strength_percentage = Math.max(0, Math.min(100, Math.round(formData.profileStrength)));
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  return { data, error };
}

// Guarantees a public.users row exists, without ever touching one that
// already does - unlike ensureCurrentUserRecord's upsert (which
// intentionally overwrites gender_preference with whatever this session's
// onboarding gender-picker holds, matching upsertCurrentUserProfile's
// existing behavior), this must not run on every sign-in and flip a
// returning user's real gender back to a stale/default value. Supabase
// fires SIGNED_IN both for a fresh login and for a persisted session
// restored at app boot, and selectedGender is null at boot time (the user
// hasn't clicked through ChooseGender again yet this launch) - so a
// blanket upsert there would overwrite real data with 'male' on every
// reopen. This only creates the row if missing; several tables
// (conversations, likes, connections, ...) have a hard FK to
// public.users(id) and would 409 for a user who authenticated but never
// saved a profile yet.
export async function ensureUserRowExists(gender: 'male' | 'female' = 'male') {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  const user = authData.user;

  const { data: existing } = await supabase.from('users').select('id').eq('id', user.id).maybeSingle();
  if (existing) {
    return { data: existing, error: null };
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      id: user.id,
      email: user.email || null,
      phone: user.phone || null,
      gender_preference: gender,
      is_active: true,
    })
    .select()
    .single();

  // A race with another concurrent call already having inserted this exact
  // row (23505) means the row exists now, which is all this function
  // promises - not a real failure.
  if (error && (error as any).code === '23505') {
    return { data: existing, error: null };
  }

  return { data, error };
}

/**
 * Inverse of the upsertCurrentUserProfile payload mapping above - maps a saved
 * profiles row back into the subset of ProfileFormData fields it can populate.
 */
export function mapProfileRowToFormSnapshot(row: any): ProfileFormSnapshot & { profilePhoto?: string } {
  return {
    name: row.full_name || '',
    dateOfBirth: row.date_of_birth || '',
    maritalStatus: MARITAL_STATUS_DISPLAY[row.marital_status] || '',
    cityOfBirth: row.city_of_birth || '',
    currentCity: row.current_city && row.current_city !== 'Not set' ? row.current_city : '',
    nationality: row.nationality || '',
    phoneNumber: row.phone_number || '',
    educationLevel: EDUCATION_LEVEL_DISPLAY[row.education_level] || '',
    degreeeName: row.degree_name || '',
    profession: row.profession || '',
    aboutMe: row.about_me || '',
    profileStrength: row.profile_strength_percentage || 0,

    // Physical & Health
    height: cmToHeightLabel(row.height_cm),
    weight: kgToWeightLabel(row.weight_kg),
    bodyType: BODY_TYPE_DISPLAY[row.body_type] || '',
    skinColour: row.skin_colour || '',
    eyeColour: row.eye_colour || '',
    bloodGroup: row.blood_group || '',
    exerciseFrequency: EXERCISE_FREQUENCY_DISPLAY[row.exercise_frequency] || '',
    smokerDrugs: boolToYesNo(row.smoker_or_drugs),

    // Career
    employmentStatus: EMPLOYMENT_STATUS_DISPLAY[row.employment_status] || '',
    monthlyIncome: row.monthly_income || '',
    futureCareerPlans: row.future_career_plans || '',

    // Financial
    ownsProperty: boolToYesNo(row.owns_property),
    ancestralLand: row.ancestral_land || '',
    savings: row.savings || '',
    debts: row.debts || '',
    ownsCar: boolToYesNo(row.owns_car),
    moneyManagement: row.money_management || '',

    // Religious
    prayerFrequency: PRAYER_FREQUENCY_DISPLAY[row.prayer_frequency] || '',
    fastRamadan: boolToYesNo(row.fast_ramadan),
    givesZakat: boolToYesNo(row.gives_zakat),
    religionImportance: RELIGION_IMPORTANCE_DISPLAY[row.religion_importance] || '',
    spouseReligiosity: row.spouse_religiosity || '',

    // Values
    importantValue: Array.isArray(row.important_values) ? row.important_values[0] || '' : '',
    handleDisagreements: row.handle_disagreements || '',
    genderRoles: GENDER_ROLES_DISPLAY[row.gender_roles] || '',
    polygamyView: POLYGAMY_VIEW_DISPLAY[row.polygamy_view] || '',

    // Family
    familyStructure: row.family_structure || '',
    familyCloseness: FAMILY_CLOSENESS_DISPLAY[row.family_closeness] || '',
    liveWithInlaws: row.live_with_inlaws === 'yes' ? 'Yes' : row.live_with_inlaws === 'no' ? 'No' : '',
    socializeFrequency: SOCIALIZE_FREQUENCY_DISPLAY[row.socialize_frequency] || '',
    celebrateCustoms: boolToYesNo(row.celebrate_customs),

    // Emotional
    handleStress: row.handle_stress || '',
    personality: row.personality || '',
    forgivenessLevel: FORGIVENESS_LEVEL_DISPLAY[row.forgiveness_level] || '',
    loveLanguage: row.love_language || '',
    showAffection: SHOW_AFFECTION_DISPLAY[row.show_affection] || '',

    // Lifestyle
    outlook: row.outlook || '',
    tradModernOutlook: TRAD_MODERN_OUTLOOK_DISPLAY[row.tradmodern_outlook] || '',
    musicPreference: row.music_preference || '',
    hobbies: hobbiesArrayToText(row.hobbies),

    // Marriage & Future Vision
    wantToMarryWhen: MARRIAGE_TIMING_DISPLAY[row.want_to_marry_when] || '',
    preferredSpouseAge: minMaxToAgeRangeLabel(row.preferred_spouse_age_min, row.preferred_spouse_age_max),
    preferredEducation: Array.isArray(row.preferred_education) ? row.preferred_education[0] || '' : '',
    preferredProfession: Array.isArray(row.preferred_profession) ? row.preferred_profession[0] || '' : '',
    preferWorkingSpouse:
      row.prefer_working_spouse === true ? 'Working' : row.prefer_working_spouse === false ? 'Homemaker' : '',
    expectedKids: KIDS_PREFERENCE_DISPLAY[row.expected_kids] || '',
    idealMarriage: row.ideal_marriage_description || '',
  };
}

// ============================================================================
// PROFILE PHOTOS
// ============================================================================

export async function getProfilePhotos(userId: string) {
  const { data, error } = await supabase
    .from('profile_photos')
    .select('id, photo_url, photo_type, display_order')
    .eq('user_id', userId)
    .order('display_order', { ascending: true });

  return { data, error };
}

/**
 * Replaces the profile_picture row and all gallery rows for a user with the
 * uploaded photo URLs currently held in form state. Only called with photos
 * that have already been uploaded to Storage (http(s) URLs) - stock avatar
 * sentinel values ('male-avatar' / 'female-avatar') are skipped since those
 * render client-side and are never stored as photo rows.
 */
export async function syncProfilePhotos(
  userId: string,
  profileId: string,
  photos: { profilePhoto?: string; galleryPhotos?: string[] }
) {
  const isUploadedUrl = (value?: string) =>
    typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));

  await supabase.from('profile_photos').delete().eq('user_id', userId).eq('photo_type', 'profile_picture');

  if (isUploadedUrl(photos.profilePhoto)) {
    await supabase.from('profile_photos').insert([
      {
        user_id: userId,
        profile_id: profileId,
        photo_url: photos.profilePhoto,
        photo_type: 'profile_picture',
        display_order: 0,
      },
    ]);
  }

  await supabase.from('profile_photos').delete().eq('user_id', userId).eq('photo_type', 'gallery');

  const galleryRows = (Array.isArray(photos.galleryPhotos) ? photos.galleryPhotos : [])
    .map((uri, index) => ({ uri, index }))
    .filter(({ uri }) => isUploadedUrl(uri))
    .slice(0, 5)
    .map(({ uri, index }) => ({
      user_id: userId,
      profile_id: profileId,
      photo_url: uri,
      photo_type: 'gallery' as const,
      display_order: index + 1,
    }));

  if (galleryRows.length > 0) {
    await supabase.from('profile_photos').insert(galleryRows);
  }
}

// ============================================================================
// PROFILES
// ============================================================================

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return { data, error };
}

export async function updateProfile(userId: string, updates: any) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  return { data, error };
}

export async function createProfile(profileData: any) {
  const { data, error } = await supabase
    .from('profiles')
    .insert([profileData])
    .select()
    .single();

  return { data, error };
}

export async function getProfileCompletionStatus(userId: string) {
  const { data, error } = await supabase
    .from('user_app_state')
    .select('profile_completed, completed_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  return { data, error };
}

export async function setProfileCompletionStatus(profileCompleted: boolean) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { data: null, error: userError || new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('user_app_state')
    .upsert(
      {
        user_id: userData.user.id,
        profile_completed: profileCompleted,
        completed_at: profileCompleted ? new Date().toISOString() : null,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  return { data, error };
}

// Separate, lighter flag from profile_completed above - tracks the short
// post-signup basics screen (name/age/marital status/location/education/
// profession/height/prayers/smoking/skin tone/income), not the full
// ~90-field ProfileForm. Same table, sibling columns (migration 038), same
// shape of pair so it's a drop-in parallel to the functions above.
export async function getBasicsCompletionStatus(userId: string) {
  const { data, error } = await supabase
    .from('user_app_state')
    .select('basics_completed, basics_completed_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  return { data, error };
}

export async function setBasicsCompletionStatus(basicsCompleted: boolean) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { data: null, error: userError || new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('user_app_state')
    .upsert(
      {
        user_id: userData.user.id,
        basics_completed: basicsCompleted,
        basics_completed_at: basicsCompleted ? new Date().toISOString() : null,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  return { data, error };
}

// Single source of truth for "where does a just-authenticated user land" -
// every auth-success call site (Google, email, phone OTP, password
// recovery) should route through this rather than hardcoding 'Tabs', so a
// user who hasn't done the basics screen yet always gets it once, exactly
// once, regardless of which auth method they used. Does a direct DB read
// rather than trusting UserContext's own (possibly not-yet-hydrated)
// basicsCompleted state, since this runs at the exact moment auth succeeds -
// before that context's own hydration effect is guaranteed to have resolved.
export async function resolvePostAuthRouteName(userId: string): Promise<'ProfileBasics' | 'Tabs'> {
  try {
    const { data } = await getBasicsCompletionStatus(userId);
    return data?.basics_completed ? 'Tabs' : 'ProfileBasics';
  } catch (error) {
    console.warn('resolvePostAuthRouteName failed, defaulting to ProfileBasics:', (error as Error)?.message);
    return 'ProfileBasics';
  }
}

// ============================================================================
// DISCOVERY & SEARCH
// ============================================================================

export async function getDiscoveryProfiles(
  currentUserId: string,
  filters?: {
    gender_seeking?: string;
    age_min?: number;
    age_max?: number;
    current_city?: string;
    limit?: number;
  }
) {
  const requestedLimit = filters?.limit || 20;
  const wantsGenderFilter = filters?.gender_seeking === 'male' || filters?.gender_seeking === 'female';
  // profiles no longer embeds users directly (public.users only exposes other
  // users' rows through the users_public view, which PostgREST can't embed
  // since it's not a real FK relationship) - fetch a larger batch when a
  // gender filter is requested so there's enough left after filtering client-side.
  const fetchLimit = wantsGenderFilter ? Math.min(requestedLimit * 4, 200) : requestedLimit;

  // Profiles the user already made a decision on (like or reject) shouldn't
  // keep reappearing in the deck. Blocked users are excluded automatically by
  // RLS (migration 018), so they don't need to be handled here.
  const { data: decidedRows } = await supabase
    .from('likes')
    .select('liked_user_id')
    .eq('user_id', currentUserId)
    .in('action', ['like', 'reject']);
  const decidedUserIds = (decidedRows || []).map((row: any) => row.liked_user_id);

  let query = supabase
    .from('profiles')
    .select(
      `
      id,
      user_id,
      full_name,
      date_of_birth,
      current_city,
      nationality,
      education_level,
      profession,
      marital_status,
      about_me,
      profile_strength_percentage,
      is_verified,
      profile_photos (
        id,
        photo_url,
        photo_type,
        display_order
      )
    `
    )
    .neq('user_id', currentUserId)
    .order('profile_strength_percentage', { ascending: false })
    .limit(fetchLimit);

  if (decidedUserIds.length > 0) {
    query = query.not('user_id', 'in', `(${decidedUserIds.join(',')})`);
  }

  if (filters?.current_city) {
    query = query.eq('current_city', filters.current_city);
  }

  if (filters?.age_min && filters?.age_max) {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - filters.age_min, today.getMonth(), today.getDate());
    const minDate = new Date(today.getFullYear() - filters.age_max, today.getMonth(), today.getDate());

    query = query
      .lte('date_of_birth', maxDate.toISOString().split('T')[0])
      .gte('date_of_birth', minDate.toISOString().split('T')[0]);
  }

  const { data: profiles, error: profilesError } = await query;

  if (profilesError || !profiles) {
    return { data: null, error: profilesError };
  }

  if (!wantsGenderFilter || profiles.length === 0) {
    return { data: profiles, error: null };
  }

  const userIds = profiles.map((profile: any) => profile.user_id);
  const { data: genders, error: gendersError } = await supabase
    .from('users_public')
    .select('id, gender_preference')
    .in('id', userIds);

  if (gendersError) {
    return { data: null, error: gendersError };
  }

  const genderByUserId = new Map((genders || []).map((row: any) => [row.id, row.gender_preference]));
  const filtered = profiles
    .filter((profile: any) => genderByUserId.get(profile.user_id) === filters?.gender_seeking)
    .slice(0, requestedLimit)
    .map((profile: any) => ({
      ...profile,
      users: { gender_preference: genderByUserId.get(profile.user_id) },
    }));

  return { data: filtered, error: null };
}

// ============================================================================
// LIKES & INTERACTIONS
// ============================================================================

export async function likeProfile(likedUserId: string, action: 'like' | 'reject' | 'shortlist' = 'like') {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('likes')
    .upsert(
      [
        {
          user_id: userData.user.id,
          liked_user_id: likedUserId,
          action,
        },
      ],
      { onConflict: 'user_id,liked_user_id' }
    )
    .select()
    .single();

  return { data, error };
}

export async function removeLike(likedUserId: string) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', userData.user.id)
    .eq('liked_user_id', likedUserId);

  return { error };
}

export async function getLikes(userId: string, action?: 'like' | 'reject' | 'shortlist') {
  let query = supabase.from('likes').select('*').eq('user_id', userId);

  if (action) {
    query = query.eq('action', action);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function getShortlistedProfiles(userId: string) {
  const { data: likes, error: likesError } = await supabase
    .from('likes')
    .select('liked_user_id, created_at')
    .eq('user_id', userId)
    .eq('action', 'shortlist')
    .order('created_at', { ascending: false });

  if (likesError || !likes) {
    return { data: null, error: likesError };
  }

  const userIds = likes.map((like) => like.liked_user_id);

  if (userIds.length === 0) {
    return { data: [], error: null };
  }

  const [{ data: profiles, error: profilesError }, { data: genders }] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        `
        user_id, full_name, date_of_birth, current_city, nationality, education_level, profession,
        profile_photos (photo_url, photo_type)
      `
      )
      .in('user_id', userIds),
    supabase.from('users_public').select('id, gender_preference').in('id', userIds),
  ]);

  if (profilesError) {
    return { data: null, error: profilesError };
  }

  const profilesByUserId = new Map((profiles || []).map((profile: any) => [profile.user_id, profile]));
  const genderByUserId = new Map((genders || []).map((row: any) => [row.id, row.gender_preference]));

  const enriched = likes
    .map((like) => {
      const profile: any = profilesByUserId.get(like.liked_user_id);
      if (!profile) {
        return null;
      }
      const primaryPhoto = (profile.profile_photos || []).find((p: any) => p.photo_type === 'profile_picture');

      return {
        userId: like.liked_user_id,
        fullName: profile.full_name,
        dateOfBirth: profile.date_of_birth,
        currentCity: profile.current_city,
        nationality: profile.nationality,
        educationLevel: profile.education_level,
        profession: profile.profession,
        gender: genderByUserId.get(like.liked_user_id) || 'male',
        photoUrl: primaryPhoto?.photo_url || profile.profile_photos?.[0]?.photo_url || null,
      };
    })
    .filter(Boolean);

  return { data: enriched, error: null };
}

export async function getWhoLikedMe(userId: string) {
  const { data: likes, error: likesError } = await supabase
    .from('likes')
    .select('id, user_id, action, created_at')
    .eq('liked_user_id', userId)
    .eq('action', 'like')
    .order('created_at', { ascending: false });

  if (likesError || !likes) {
    return { data: null, error: likesError };
  }

  // Someone the current user has already liked back or passed on shouldn't
  // keep showing up here - a like or reject means the decision is made.
  const { data: decidedRows } = await supabase
    .from('likes')
    .select('liked_user_id')
    .eq('user_id', userId)
    .in('action', ['like', 'reject']);
  const decidedUserIds = new Set((decidedRows || []).map((row: any) => row.liked_user_id));

  const undecidedLikes = likes.filter((like) => !decidedUserIds.has(like.user_id));
  const likerIds = Array.from(new Set(undecidedLikes.map((like) => like.user_id)));

  if (likerIds.length === 0) {
    return { data: [], error: null };
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select(
      `
      user_id,
      full_name,
      date_of_birth,
      current_city,
      nationality,
      about_me,
      profile_photos (photo_url)
    `
    )
    .in('user_id', likerIds);

  if (profilesError) {
    return { data: null, error: profilesError };
  }

  const profilesByUserId = new Map((profiles || []).map((profile) => [profile.user_id, profile]));

  const enriched = undecidedLikes.map((like) => ({
    ...like,
    profile: profilesByUserId.get(like.user_id) || null,
  }));

  return { data: enriched, error: null };
}

// ============================================================================
// PROFILE VIEWS ("WHO VIEWED ME")
// ============================================================================

export async function trackProfileView(viewedUserId: string) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user || userData.user.id === viewedUserId) {
    return { error: null };
  }

  const { error } = await supabase
    .from('profile_views')
    .upsert(
      [{ viewer_id: userData.user.id, viewed_user_id: viewedUserId, viewed_at: new Date().toISOString() }],
      { onConflict: 'viewer_id,viewed_user_id' }
    );

  return { error };
}

export async function getProfileViewers(userId: string) {
  const { data: views, error: viewsError } = await supabase
    .from('profile_views')
    .select('id, viewer_id, viewed_at')
    .eq('viewed_user_id', userId)
    .order('viewed_at', { ascending: false });

  if (viewsError || !views) {
    return { data: null, error: viewsError };
  }

  const viewerIds = Array.from(new Set(views.map((view) => view.viewer_id)));

  if (viewerIds.length === 0) {
    return { data: [], error: null };
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select(
      `
      user_id,
      full_name,
      date_of_birth,
      current_city,
      nationality,
      about_me,
      profile_photos (photo_url)
    `
    )
    .in('user_id', viewerIds);

  if (profilesError) {
    return { data: null, error: profilesError };
  }

  const profilesByUserId = new Map((profiles || []).map((profile) => [profile.user_id, profile]));

  const enriched = views.map((view) => ({
    ...view,
    profile: profilesByUserId.get(view.viewer_id) || null,
  }));

  return { data: enriched, error: null };
}

// ============================================================================
// CONNECTIONS (INTEREST REQUESTS)
// ============================================================================

export async function sendConnectionRequest(recipientId: string, message?: string) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('connections')
    .insert([
      {
        requester_id: userData.user.id,
        recipient_id: recipientId,
        message,
      },
    ])
    .select()
    .single();

  return { data, error };
}

export async function respondToConnectionRequest(connectionId: string, status: 'accepted' | 'rejected') {
  const { data, error } = await supabase
    .from('connections')
    .update({
      status,
      [status === 'accepted' ? 'accepted_at' : 'rejected_at']: new Date().toISOString(),
    })
    .eq('id', connectionId)
    .select()
    .single();

  return { data, error };
}

export async function getConnectionRequests(userId: string, status?: 'pending' | 'accepted' | 'rejected') {
  let query = supabase
    .from('connections')
    .select('*')
    .eq('recipient_id', userId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  return { data, error };
}

// ============================================================================
// MATCHES
// ============================================================================

export async function getMatches(userId: string) {
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('id, user_1_id, user_2_id, match_score, status, created_at')
    .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (matchesError || !matches) {
    return { data: null, error: matchesError };
  }

  const counterpartIds = Array.from(
    new Set(
      matches
        .map((match) => (match.user_1_id === userId ? match.user_2_id : match.user_1_id))
        .filter(Boolean)
    )
  );

  if (counterpartIds.length === 0) {
    return { data: [], error: null };
  }

  const [{ data: profiles, error: profilesError }, { data: users, error: usersError }] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        `
        user_id,
        full_name,
        date_of_birth,
        marital_status,
        current_city,
        nationality,
        education_level,
        profession,
        about_me,
        profile_strength_percentage,
        profile_photos (
          id,
          photo_url,
          photo_type,
          display_order
        )
      `
      )
      .in('user_id', counterpartIds),
    supabase.from('users_public').select('id, gender_preference').in('id', counterpartIds),
  ]);

  if (profilesError || usersError) {
    return { data: null, error: profilesError || usersError };
  }

  const profilesByUserId = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
  const usersById = new Map((users || []).map((user) => [user.id, user]));

  const enriched = matches.map((match) => {
    const counterpartId = match.user_1_id === userId ? match.user_2_id : match.user_1_id;
    return {
      ...match,
      counterpart_user_id: counterpartId,
      profile: profilesByUserId.get(counterpartId) || null,
      user: usersById.get(counterpartId) || null,
    };
  });

  return { data: enriched, error: null };
}

// ============================================================================
// MESSAGES & CONVERSATIONS
// ============================================================================

export async function getConversations(userId: string) {
  const { data: conversations, error: conversationsError } = await supabase
    .from('conversations')
    .select('id, user_1_id, user_2_id, last_message_preview, last_message_sender_id, updated_at')
    .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (conversationsError || !conversations) {
    return { data: null, error: conversationsError };
  }

  const counterpartIds = Array.from(
    new Set(
      conversations.map((conversation) =>
        conversation.user_1_id === userId ? conversation.user_2_id : conversation.user_1_id
      )
    )
  );

  if (counterpartIds.length === 0) {
    return { data: [], error: null };
  }

  const [{ data: profiles, error: profilesError }, { data: genders }] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_id, full_name, profile_photos (photo_url, photo_type)')
      .in('user_id', counterpartIds),
    supabase.from('users_public').select('id, gender_preference').in('id', counterpartIds),
  ]);

  if (profilesError) {
    return { data: null, error: profilesError };
  }

  const profilesByUserId = new Map((profiles || []).map((profile: any) => [profile.user_id, profile]));
  const genderByUserId = new Map((genders || []).map((row: any) => [row.id, row.gender_preference]));

  const enriched = conversations.map((conversation) => {
    const counterpartId =
      conversation.user_1_id === userId ? conversation.user_2_id : conversation.user_1_id;
    const profile: any = profilesByUserId.get(counterpartId) || null;
    const primaryPhoto = (profile?.profile_photos || []).find((p: any) => p.photo_type === 'profile_picture');

    return {
      ...conversation,
      counterpart_user_id: counterpartId,
      profile,
      counterpart_gender: genderByUserId.get(counterpartId) || 'male',
      counterpart_photo_url: primaryPhoto?.photo_url || profile?.profile_photos?.[0]?.photo_url || null,
    };
  });

  return { data: enriched, error: null };
}

export async function getConversationWithUser(currentUserId: string, counterpartUserId: string) {
  const user1 = currentUserId < counterpartUserId ? currentUserId : counterpartUserId;
  const user2 = currentUserId < counterpartUserId ? counterpartUserId : currentUserId;

  const { data, error } = await supabase
    .from('conversations')
    .select('id, user_1_id, user_2_id')
    .eq('user_1_id', user1)
    .eq('user_2_id', user2)
    .maybeSingle();

  return { data, error };
}

// Premium members can message anyone, not just mutual matches - unlike
// getConversationWithUser (read-only, used by the matches list), this
// creates the conversation on first contact.
export async function getOrCreateConversation(currentUserId: string, counterpartUserId: string) {
  const existing = await getConversationWithUser(currentUserId, counterpartUserId);
  if (existing.data || existing.error) {
    return existing;
  }

  const user1 = currentUserId < counterpartUserId ? currentUserId : counterpartUserId;
  const user2 = currentUserId < counterpartUserId ? counterpartUserId : currentUserId;

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_1_id: user1, user_2_id: user2 })
    .select('id, user_1_id, user_2_id')
    .single();

  if (error) {
    // Someone else may have created the same pair between our read and
    // write (unique_conversation_pair) - re-fetch instead of failing.
    return getConversationWithUser(currentUserId, counterpartUserId);
  }

  return { data, error: null };
}

export async function getMessages(conversationId: string, limit = 50) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data?.reverse(), error };
}

export async function sendMessage(conversationId: string, messageText: string) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        conversation_id: conversationId,
        sender_id: userData.user.id,
        message_text: messageText,
      },
    ])
    .select()
    .single();

  return { data, error };
}

export async function markMessageAsRead(messageId: string) {
  const { data, error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId)
    .select()
    .single();

  return { data, error };
}

export async function markConversationAsRead(conversationId: string, currentUserId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', currentUserId)
    .is('read_at', null);

  return { error };
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export async function getNotifications(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data, error };
}

export async function getUnreadNotificationsCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .is('read_at', null);

  return { count, error };
}

export async function markNotificationAsRead(notificationId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .select()
    .single();

  return { data, error };
}

export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  return { error };
}

export async function savePushToken(userId: string, expoPushToken: string, deviceType?: string) {
  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      [{ user_id: userId, expo_push_token: expoPushToken, device_type: deviceType, updated_at: new Date().toISOString() }],
      { onConflict: 'user_id,expo_push_token' }
    );

  return { error };
}

// ============================================================================
// PAYMENTS & SUBSCRIPTIONS
// ============================================================================

export async function getSubscriptionStatus(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  return { data, error };
}

export async function isUserPremium(userId: string) {
  const { data, error } = await supabase
    .rpc('is_user_premium', { user_id_param: userId });

  return { isPremium: data || false, error };
}

// Records a contact-details request and emails the admin about it (Edge
// Function does the actual writing/emailing with the service role - see
// supabase/functions/request-contact-details).
export async function requestContactDetails(targetUserId: string) {
  const { data, error } = await supabase.functions.invoke('request-contact-details', {
    body: { targetUserId },
  });

  if (error) {
    return { success: false, error };
  }

  return { success: true, emailSent: Boolean(data?.emailSent) };
}

export async function getPaymentHistory(userId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
}

// 'card' here is a manually-confirmed charge, not a real Stripe payment - no
// card details are actually collected or transmitted. Wiring up real Stripe
// billing needs, at minimum: a Stripe account + secret key held server-side
// only (a Supabase Edge Function, never the client), a PaymentIntent/Checkout
// Session created by that function, @stripe/stripe-react-native (Expo Go
// can't host native Stripe UI - this needs an EAS development/production
// build), and a webhook (Edge Function) that verifies the Stripe signature
// and calls process_payment() with transactionId set to the real Stripe
// charge/session ID. None of that exists yet; this function only records the
// transaction and grants access after the fact.
export async function processPayment(
  userId: string,
  amount: number,
  method: 'card' | 'bank_transfer' | 'admin_contact',
  transactionId?: string
) {
  const { data, error } = await supabase
    .rpc('process_payment', {
      user_id_param: userId,
      amount_usd_param: amount,
      payment_method_param: method,
      transaction_id_param: transactionId || 'manual_' + Date.now(),
    });

  return { data, error };
}

// ============================================================================
// PROFILE VERIFICATION
// ============================================================================

export async function getProfileVerificationStatus(userId: string) {
  const { data, error } = await supabase
    .from('profile_verification')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return { data, error };
}

// Deliberately not an upsert: Postgres requires table-level UPDATE privilege
// for the ON CONFLICT DO UPDATE branch even when every SET column has its
// own column-level grant, so this update-then-insert-fallback is the only
// way to keep is_verified column-locked (see migration 019/024) while still
// letting a user re-request verification more than once.
export async function requestProfileVerification() {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { data: null, error: userError || new Error('Not authenticated') };
  }

  const requestedAt = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from('profile_verification')
    .update({ verification_requested_at: requestedAt })
    .eq('user_id', userData.user.id)
    .select()
    .maybeSingle();

  if (updateError) {
    return { data: null, error: updateError };
  }

  if (updated) {
    return { data: updated, error: null };
  }

  const { data: inserted, error: insertError } = await supabase
    .from('profile_verification')
    .insert({ user_id: userData.user.id, verification_requested_at: requestedAt })
    .select()
    .single();

  return { data: inserted, error: insertError };
}

// ============================================================================
// MODERATION (blocking & reporting)
// ============================================================================

export type ReportType = 'fake_profile' | 'inappropriate_content' | 'harassment' | 'scam' | 'catfish' | 'other';

export async function submitReport(reportedUserId: string, reportType: ReportType, description: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { data: null, error: userError || new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('reports')
    .insert([
      {
        reported_by: userData.user.id,
        reported_user_id: reportedUserId,
        report_type: reportType,
        description,
      },
    ])
    .select()
    .single();

  return { data, error };
}

export async function blockUser(blockedUserId: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { data: null, error: userError || new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('blocked_users')
    .upsert(
      { blocker_id: userData.user.id, blocked_id: blockedUserId },
      { onConflict: 'blocker_id,blocked_id' }
    )
    .select()
    .single();

  return { data, error };
}

export async function unblockUser(blockedUserId: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: userError || new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', userData.user.id)
    .eq('blocked_id', blockedUserId);

  return { error };
}

export async function getBlockedUsers(userId: string) {
  const { data, error } = await supabase
    .from('blocked_users')
    .select('id, blocked_id, created_at')
    .eq('blocker_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
}

// ============================================================================
// DISCOVERY PREFERENCES
// ============================================================================

export type DiscoveryPreferences = {
  gender_seeking?: 'male' | 'female' | 'both' | 'any';
  age_min?: number;
  age_max?: number;
  preferred_cities?: string[];
  show_profile_to_all?: boolean;
};

export async function getUserPreferences(userId: string) {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return { data, error };
}

export async function upsertUserPreferences(userId: string, updates: DiscoveryPreferences) {
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
    .select()
    .single();

  return { data, error };
}

// ============================================================================
// ACCOUNT SETTINGS
// ============================================================================

export async function getAccountSettings(userId: string) {
  const { data, error } = await supabase
    .from('user_app_state')
    .select('notifications_enabled')
    .eq('user_id', userId)
    .maybeSingle();

  return { data, error };
}

export async function setNotificationsEnabled(enabled: boolean) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { data: null, error: userError || new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('user_app_state')
    .upsert({ user_id: userData.user.id, notifications_enabled: enabled }, { onConflict: 'user_id' })
    .select()
    .single();

  return { data, error };
}

export async function deactivateAccount(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', userId)
    .select()
    .single();

  return { data, error };
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export function subscribeToMessages(conversationId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      callback
    )
    .subscribe();
}

export function subscribeToNotifications(userId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

export function subscribeToMatches(userId: string, callback: (payload: any) => void) {
  // postgres_changes filters only support a single column=eq.value comparison,
  // so "or" across user_1_id/user_2_id needs two channels merged together.
  const channelAsUser1 = supabase
    .channel(`matches:${userId}:user_1`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `user_1_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();

  const channelAsUser2 = supabase
    .channel(`matches:${userId}:user_2`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `user_2_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();

  return {
    unsubscribe: () => {
      channelAsUser1.unsubscribe();
      channelAsUser2.unsubscribe();
    },
  };
}
