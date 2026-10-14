import { Platform } from 'react-native';
import { supabase } from './supabase';
import { AuthError } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

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

function extractSessionTokensFromUrl(url: string) {
  const fragmentIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const paramsString =
    fragmentIndex >= 0 ? url.slice(fragmentIndex + 1) : queryIndex >= 0 ? url.slice(queryIndex + 1) : '';

  const params = new URLSearchParams(paramsString);
  return {
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
  };
}

/**
 * Sign in with Google. The app never touches a Google client ID/secret -
 * that's configured entirely in the Supabase Dashboard (Authentication >
 * Providers > Google), which must be enabled first or this fails with a
 * "provider is not enabled" error from Supabase.
 *
 * Web: supabase-js does a full-page redirect to Google itself (no
 * skipBrowserRedirect), and the session comes back through
 * detectSessionInUrl (supabase.ts) + the SIGNED_IN listener in UserContext -
 * same path a normal email/password sign-in resolves through, so there's
 * nothing further to do here once the redirect fires.
 *
 * Native: there's no window to redirect, so this opens the OAuth URL in an
 * in-app browser tab (expo-web-browser) and waits for it to redirect back to
 * the app's own scheme, then extracts the tokens by hand and calls
 * setSession() - the same shape as the PASSWORD_RECOVERY deep-link handling
 * in authDeepLink.ts, just triggered by an awaited call instead of a
 * passive Linking listener.
 */
export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    if (Platform.OS === 'web') {
      // Linking.createURL('/') on web does not reliably resolve to the
      // page's actual current origin (confirmed live - it produced
      // http://localhost:3000 while the app was being served from a phone
      // hitting the Mac's LAN IP on a different port, sending the OAuth
      // redirect to a dead address). window.location.origin is the actual
      // origin this page is being served from, unambiguously.
      const redirectTo = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });

      if (error) {
        return { success: false, error };
      }

      // The page is navigating to Google right now - there's no session to
      // report back yet.
      return { success: true };
    }

    const redirectTo = Linking.createURL('/');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });

    if (error || !data?.url) {
      return { success: false, error: error || new Error('Could not start Google sign-in') };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type !== 'success' || !result.url) {
      return { success: false, error: new Error('Sign-in was cancelled') };
    }

    const { accessToken, refreshToken } = extractSessionTokensFromUrl(result.url);
    if (!accessToken || !refreshToken) {
      return { success: false, error: new Error('Google did not return a valid session') };
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      return { success: false, error: sessionError };
    }

    return { success: true, user: sessionData.user, session: sessionData.session };
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
      options: {
        shouldCreateUser: true,
      },
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
 * Change the signed-in user's email. Supabase sends a confirmation link to
 * the new address (and, depending on project settings, the old one too) -
 * the change only takes effect once confirmed.
 */
export async function updateEmail(newEmail: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.updateUser({ email: newEmail });

    if (error) {
      return { success: false, error };
    }

    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/**
 * Change the signed-in user's phone number. Depending on project settings
 * this may require OTP confirmation before it takes effect.
 */
export async function updatePhone(newPhone: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.updateUser({ phone: newPhone });

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
      redirectTo: Linking.createURL('/reset-password'),
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
 * Set a new password - used to complete the forgot-password flow once the
 * user has a valid recovery session (from clicking the emailed reset link),
 * and also reusable for a logged-in user changing their password directly.
 */
export async function updatePassword(newPassword: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      return { success: false, error };
    }

    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
