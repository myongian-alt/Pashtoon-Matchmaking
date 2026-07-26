// Security audit finding #6: several screens were showing Supabase's raw
// AuthError/PostgrestError .message directly to the user, which can include
// backend implementation details (constraint names, internal error codes).
// Whitelist a small set of messages we've actually reviewed and want users
// to see verbatim; everything else falls back to a generic, safe message.
// A whitelist (not a blocklist) so a new/unexpected error can never leak
// through unreviewed.
const SAFE_AUTH_MESSAGES = new Set([
  'Invalid login credentials',
  'User already registered',
  'Email not confirmed',
  'Email rate limit exceeded',
  'Password should be at least 6 characters',
  'New password should be different from the old password',
  'A user with this email address has already been registered',
  'Token has expired or is invalid',
]);

export function toSafeErrorMessage(error: unknown, fallback: string): string {
  const raw = typeof error === 'string' ? error : (error as any)?.message;
  if (typeof raw === 'string' && SAFE_AUTH_MESSAGES.has(raw)) {
    return raw;
  }
  return fallback;
}
