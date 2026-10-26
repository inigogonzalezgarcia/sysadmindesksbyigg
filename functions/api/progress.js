import { currentUser, db, DESK_ID, fail, json, readJson, sameOrigin } from "../_lib/auth.js";
import { progressOf } from "./me.js";

// save the best result of one or more desks: {results: {deskId: {points, stars}}}
export async function onRequestPut({ request, env }) {
  if (!sameOrigin(request)) return fail("origin", 403);
  const body = await readJson(request);
  if (!body || typeof body.results !== "object" || !body.results) return fail("bad_request");
  const DB = await db(env);
  const user = await currentUser(request, DB);
  if (!user) return fail("signed_out", 401);
  const now = Date.now();
  const stmts = [];
  for (const [desk, r] of Object.entries(body.results).slice(0, 100)) {
    const points = Math.round(Number(r && r.points));
    const stars = Math.round(Number(r && r.stars));
    if (!DESK_ID.test(desk) || !(points >= 0 && points <= 100) || !(stars >= 0 && stars <= 3)) continue;
    stmts.push(DB.prepare(
      `INSERT INTO progress (user_id, desk_id, points, stars, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (user_id, desk_id) DO UPDATE SET points = excluded.points, stars = excluded.stars, updated_at = excluded.updated_at
       WHERE excluded.points > progress.points`).bind(user.id, desk, points, stars, now));
  }
  if (stmts.length) await DB.batch(stmts);
  return json({ progress: await progressOf(DB, user.id) });
}
