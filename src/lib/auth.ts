import { supabase } from './supabase';
import { AuthError } from '@supabase/supabase-js';

export interface AuthCredentials {
  email?: string;
  phone?: string;
  password?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: any;
  session?: any;
  error?: AuthError | Error;
}

/**
 * Sign up with email
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: { gender_preference?: string }
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, user: data.user, session: data.session };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/**
 * Sign in with email
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, user: data.user, session: data.session };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/**
 * Sign up with phone (OTP)
 */
export async function signUpWithPhone(
  phone: string
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/**
 * Verify OTP
 */
export async function verifyOtp(
  phone: string,
  token: string
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, user: data.user, session: data.session };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/**
 * Sign in with Google (OAuth)
 */
export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'exp://localhost:8081',
      },
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return { success: false, user: null, error };
    }

    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, user: null, error: error as Error };
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { success: false, session: null, error };
    }

    return { success: true, session: data.session };
  } catch (error) {
    return { success: false, session: null, error: error as Error };
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return subscription;
}

/**
 * Update user profile
 */
export async function updateUserProfile(metadata: Record<string, any>) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata,
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'exp://localhost:8081/reset-password',
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
