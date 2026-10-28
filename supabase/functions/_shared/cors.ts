export const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
};

export function jsonResponse(body: unknown, status = 200, allowedOrigin = 'http://localhost:5173') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Access-Control-Allow-Origin': allowedOrigin, 'Content-Type': 'application/json; charset=utf-8' },
  });
}
