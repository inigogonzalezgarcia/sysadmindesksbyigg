import { db, endSession, fail, json, sameOrigin } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return fail("origin", 403);
  const set = await endSession(request, await db(env));
  return json({ ok: true }, 200, { "set-cookie": set });
}
