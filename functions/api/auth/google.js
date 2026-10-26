import { cookie, fail, OAUTH_COOKIE, randomToken } from "../../_lib/auth.js";

// Start "Continue with Google": needs GOOGLE_CLIENT_ID (variable) and GOOGLE_CLIENT_SECRET (secret) in the Pages project.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return Response.redirect(`${url.origin}/?auth=google_off#/start`, 302);
  const state = randomToken(24);
  const q = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${url.origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return new Response(null, {
    status: 302,
    headers: { location: `https://accounts.google.com/o/oauth2/v2/auth?${q}`, "set-cookie": cookie(OAUTH_COOKIE, state, { maxAge: 600, path: "/api/auth" }),
      "cache-control": "no-store" },
  });
}

export function onRequestPost() {
  return fail("method", 405);
}
