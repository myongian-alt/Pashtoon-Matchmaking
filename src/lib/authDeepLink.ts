import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';
import { navigateTo } from '../navigation/navigationRef';

// Supabase's default (implicit) auth flow puts the recovery session in the
// URL fragment, e.g. ".../reset-password#access_token=...&refresh_token=...
// &type=recovery". On web, supabase-js reads window.location itself
// (detectSessionInUrl in supabase.ts) and fires a PASSWORD_RECOVERY event
// that UserContext listens for. There's no window.location on native, so
// incoming links have to be read via expo-linking and turned into a session
// by hand here - and since supabase.auth.setSession() always fires SIGNED_IN
// (never PASSWORD_RECOVERY, confirmed against @supabase/auth-js), this
// navigates to NewPassword directly rather than relying on the auth event.
function extractRecoveryTokens(url: string) {
  const fragmentIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const paramsString =
    fragmentIndex >= 0 ? url.slice(fragmentIndex + 1) : queryIndex >= 0 ? url.slice(queryIndex + 1) : '';

  const params = new URLSearchParams(paramsString);
  return {
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    type: params.get('type'),
  };
}

async function handleIncomingUrl(url: string | null) {
  if (!url) {
    return;
  }

  const { accessToken, refreshToken, type } = extractRecoveryTokens(url);
  if (type !== 'recovery' || !accessToken || !refreshToken) {
    return;
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (!error) {
    navigateTo('NewPassword');
  }
}

export function initAuthDeepLinkHandling() {
  if (Platform.OS === 'web') {
    // Handled by detectSessionInUrl + the PASSWORD_RECOVERY listener in
    // UserContext instead.
    return () => {};
  }

  Linking.getInitialURL().then(handleIncomingUrl);
  const subscription = Linking.addEventListener('url', ({ url }) => handleIncomingUrl(url));

  return () => subscription.remove();
}
