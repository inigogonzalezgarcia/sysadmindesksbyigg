import { cookie, currentUser, db, fail, json, publicUser, sameOrigin, SESSION_COOKIE } from "../_lib/auth.js";

export async function progressOf(DB, userId) {
  const { results } = await DB.prepare("SELECT desk_id, points, stars, updated_at FROM progress WHERE user_id = ?").bind(userId).all();
  const out = {};
  for (const r of results || []) out[r.desk_id] = { points: r.points, stars: r.stars, date: new Date(r.updated_at).toISOString().slice(0, 10) };
  return out;
}

// who is signed in, with their progress ({user: null} when nobody is)
export async function onRequestGet({ request, env }) {
  const DB = await db(env);
  const user = await currentUser(request, DB);
  if (!user) return json({ user: null });
  return json({ user: publicUser(user), progress: await progressOf(DB, user.id) });
}

// delete the account, its sessions and its progress
export async function onRequestDelete({ request, env }) {
  if (!sameOrigin(request)) return fail("origin", 403);
  const DB = await db(env);
  const user = await currentUser(request, DB);
  if (!user) return fail("signed_out", 401);
  await DB.batch([
    DB.prepare("DELETE FROM progress WHERE user_id = ?").bind(user.id),
    DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id),
    DB.prepare("DELETE FROM users WHERE id = ?").bind(user.id),
  ]);
  return json({ ok: true }, 200, { "set-cookie": cookie(SESSION_COOKIE, "", { maxAge: 0 }) });
}
