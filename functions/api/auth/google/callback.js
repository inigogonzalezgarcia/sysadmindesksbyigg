import { AVATARS, cleanName, cookie, createSession, db, newId, normEmail, OAUTH_COOKIE, parseCookies } from "../../../_lib/auth.js";

function back(origin, extra = {}) {
  const h = new Headers({ location: `${origin}/${extra.query || ""}#/`, "cache-control": "no-store" });
  h.append("set-cookie", cookie(OAUTH_COOKIE, "", { maxAge: 0, path: "/api/auth" }));
  if (extra.session) h.append("set-cookie", extra.session);
  return new Response(null, { status: 302, headers: h });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const state = parseCookies(request.headers.get("cookie"))[OAUTH_COOKIE];
  const code = url.searchParams.get("code");
  if (!state || state !== url.searchParams.get("state") || !code || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return back(url.origin, { query: "?auth=google_error" });
  }
  const tok = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${url.origin}/api/auth/google/callback`, grant_type: "authorization_code" }),
  });
  if (!tok.ok) return back(url.origin, { query: "?auth=google_error" });
  const { access_token } = await tok.json();
  const info = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${access_token}` } });
  if (!info.ok) return back(url.origin, { query: "?auth=google_error" });
  const g = await info.json();
  const email = normEmail(g.email);
  if (!g.sub || !email || g.email_verified !== true) return back(url.origin, { query: "?auth=google_error" });
  const DB = await db(env);
  let user = await DB.prepare("SELECT * FROM users WHERE google_sub = ?").bind(g.sub).first()
    || await DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  if (user && !user.google_sub) {
    await DB.prepare("UPDATE users SET google_sub = ? WHERE id = ?").bind(g.sub, user.id).run();
  } else if (!user) {
    const now = Date.now();
    const name = cleanName(g.name || email.split("@")[0]).slice(0, 40) || "Technician";
    user = { id: newId() };
    await DB.prepare("INSERT INTO users (id, email, name, avatar, google_sub, created_at, consent_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(user.id, email, name, AVATARS[0], g.sub, now, now).run();
  }
  return back(url.origin, { session: await createSession(DB, user.id) });
}
