// Records a contact-details request and emails the admin about it. Replaces
// the $30 payment paywall on ProfileDetailScreen's "View Contact Details"
// button, for now - see src/screens/ProfileDetailScreen.tsx.
//
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY are injected
// automatically into every deployed Edge Function - only RESEND_API_KEY and
// ADMIN_EMAIL need to be set explicitly (via `supabase secrets set`).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Missing authorization' }, 401);
  }

  const supabaseAsUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: authData, error: authError } = await supabaseAsUser.auth.getUser();
  if (authError || !authData.user) {
    return json({ error: 'Invalid session' }, 401);
  }

  const requesterId = authData.user.id;

  let targetUserId: string | undefined;
  try {
    ({ targetUserId } = await req.json());
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  if (!targetUserId || typeof targetUserId !== 'string') {
    return json({ error: 'targetUserId is required' }, 400);
  }

  if (targetUserId === requesterId) {
    return json({ error: 'Cannot request your own contact details' }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const [{ data: requesterProfile }, { data: targetProfile }, { data: requesterUser }] = await Promise.all([
    admin.from('profiles').select('full_name').eq('user_id', requesterId).maybeSingle(),
    admin.from('profiles').select('full_name').eq('user_id', targetUserId).maybeSingle(),
    admin.from('users').select('email').eq('id', requesterId).maybeSingle(),
  ]);

  const { error: insertError } = await admin
    .from('contact_requests')
    .upsert(
      { requester_id: requesterId, target_user_id: targetUserId, status: 'pending' },
      { onConflict: 'requester_id,target_user_id' }
    );

  if (insertError) {
    console.error('contact_requests upsert failed:', insertError.message);
    return json({ error: 'Could not record request' }, 500);
  }

  let emailSent = false;
  if (RESEND_API_KEY && ADMIN_EMAIL) {
    const requesterLabel = requesterProfile?.full_name || requesterUser?.email || requesterId;
    const targetLabel = targetProfile?.full_name || targetUserId;

    const emailResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Khpalwali <onboarding@resend.dev>',
        to: [ADMIN_EMAIL],
        subject: `Contact details request: ${requesterLabel} -> ${targetLabel}`,
        text: [
          `${requesterLabel} requested contact details for ${targetLabel}.`,
          '',
          `Requester email: ${requesterUser?.email || 'unknown'}`,
          `Requester user ID: ${requesterId}`,
          `Target user ID: ${targetUserId}`,
        ].join('\n'),
      }),
    });

    emailSent = emailResp.ok;
    if (!emailResp.ok) {
      console.error('Resend send failed:', emailResp.status, await emailResp.text());
    }
  } else {
    console.warn('RESEND_API_KEY/ADMIN_EMAIL not configured - request recorded but no email sent.');
  }

  return json({ success: true, emailSent });
});
