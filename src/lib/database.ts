import { supabase } from './supabase';

type ProfileFormSnapshot = {
  name?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  cityOfBirth?: string;
  currentCity?: string;
  nationality?: string;
  phoneNumber?: string;
  profession?: string;
  aboutMe?: string;
};

const MARITAL_STATUS_MAP: Record<string, 'never_married' | 'divorced' | 'widowed' | 'separated'> = {
  Single: 'never_married',
  Divorced: 'divorced',
  Widowed: 'widowed',
  Separated: 'separated',
};

function normalizeDateOfBirth(value?: string): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  // Keep a valid adult fallback date to satisfy DB constraints.
  return '1995-01-01';
}

function normalizeMaritalStatus(value?: string): 'never_married' | 'divorced' | 'widowed' | 'separated' {
  return MARITAL_STATUS_MAP[value || ''] || 'never_married';
}

export async function ensureCurrentUserRecord(gender: 'male' | 'female' = 'male') {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  const user = authData.user;

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        phone: user.phone ?? null,
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

  const payload = {
    user_id: authData.user.id,
    full_name: (formData.name || 'New User').trim(),
    date_of_birth: normalizeDateOfBirth(formData.dateOfBirth),
    marital_status: normalizeMaritalStatus(formData.maritalStatus),
    city_of_birth: (formData.cityOfBirth || '').trim() || null,
    current_city: (formData.currentCity || '').trim() || 'Not set',
    nationality: (formData.nationality || '').trim() || null,
    phone_number: (formData.phoneNumber || '').trim() || null,
    profession: (formData.profession || '').trim() || null,
    about_me: (formData.aboutMe || '').trim() || null,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  return { data, error };
}

// ============================================================================
// PROFILES
// ============================================================================

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

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
      profession,
      marital_status,
      about_me,
      profile_strength_percentage,
      is_verified,
      users!inner(
        gender_preference
      ),
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
    .limit(filters?.limit || 20);

  if (filters?.gender_seeking === 'male' || filters?.gender_seeking === 'female') {
    query = query.eq('users.gender_preference', filters.gender_seeking);
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

  const { data, error } = await query;
  return { data, error };
}

// ============================================================================
// LIKES & INTERACTIONS
// ============================================================================

export async function likeProfile(likedUserId: string, action: 'like' | 'reject' | 'shortlist' = 'like') {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('likes')
    .upsert([
      {
        user_id: userData.user.id,
        liked_user_id: likedUserId,
        action,
      },
    ])
    .select()
    .single();

  return { data, error };
}

export async function getLikes(userId: string, action?: 'like' | 'reject' | 'shortlist') {
  let query = supabase.from('likes').select('*').eq('user_id', userId);

  if (action) {
    query = query.eq('action', action);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function getWhoLikedMe(userId: string) {
  const { data, error } = await supabase
    .from('likes')
    .select(
      `
      id,
      user_id,
      action,
      created_at,
      profiles:user_id(
        full_name,
        current_city,
        about_me,
        profile_photos(photo_url)
      )
    `
    )
    .eq('liked_user_id', userId)
    .eq('action', 'like');

  return { data, error };
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
    supabase.from('users').select('id, gender_preference').in('id', counterpartIds),
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
  const { data, error } = await supabase
    .from('conversations')
    .select(
      `
      id,
      user_1_id,
      user_2_id,
      last_message_preview,
      last_message_sender_id,
      updated_at,
      profiles:user_1_id(full_name)
    `
    )
    .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  return { data, error };
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

// ============================================================================
// PAYMENTS & SUBSCRIPTIONS
// ============================================================================

export async function getSubscriptionStatus(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  return { data, error };
}

export async function isUserPremium(userId: string) {
  const { data, error } = await supabase
    .rpc('is_user_premium', { user_id_param: userId });

  return { isPremium: data || false, error };
}

export async function getPaymentHistory(userId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
}

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
  return supabase
    .channel(`matches:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `or=(user_1_id.eq.${userId},user_2_id.eq.${userId})`,
      },
      callback
    )
    .subscribe();
}
