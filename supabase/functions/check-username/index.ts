const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing Supabase service credentials.' }, 500);
  }

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const username = String(body?.username ?? '').trim();

    if (!username) {
      return jsonResponse({ error: 'Missing username.' }, 400);
    }

    const { data, error } = await admin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      return jsonResponse({ error: error.message || 'Failed to check username.' }, 500);
    }

    return jsonResponse({ taken: Boolean(data) });
  } catch (error) {
    console.error('check-username failed:', error);
    return jsonResponse({ error: 'Failed to check username.' }, 500);
  }
});
