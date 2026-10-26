import { fail } from "../_lib/auth.js";

// Any unexpected error (for example the D1 database not bound yet) becomes a JSON answer the app can show.
export async function onRequest({ next }) {
  try {
    return await next();
  } catch (e) {
    console.error(e && e.stack ? e.stack : e);
    return fail(String(e && e.message).includes("D1 binding") ? "unavailable" : "server", 503);
  }
}
