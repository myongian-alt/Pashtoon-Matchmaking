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
  };

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
