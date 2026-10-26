// Accounts for SysAdmin Desks: helpers shared by the Pages Functions in functions/api.
// Passwords: PBKDF2-SHA256 with a random salt. Sessions: a random token in an HttpOnly cookie; only its SHA-256 is stored.
// The D1 database is bound as env.DB; the tables are created on first use.

export const SESSION_COOKIE = "sd_session";
export const OAUTH_COOKIE = "sd_oauth";
export const SESSION_DAYS = 30;
export const PBKDF2_ITERATIONS = 100000;
export const AVATARS = ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8"];
export const DESK_ID = /^[a-z0-9-]{2,40}$/;
const LOCK_MINUTES = 15;
const LOCK_FAILS = 8;

const enc = new TextEncoder();

export function b64(bytes) {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s);
}
export function b64url(bytes) {
  return b64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unb64(s) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
export function randomToken(n = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(n)));
}
export async function sha256hex(text) {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i];
  return r === 0;
}

// ---------------------------------------------------------------- validation

export function normEmail(v) {
  return String(v || "").trim().toLowerCase();
}
export function validEmail(v) {
  return v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}
export function cleanName(v) {
  return String(v || "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim();
}
export function validName(v) {
  return v.length >= 2 && v.length <= 40;
}
// at least 8 characters, one capital letter and one number (shown live in the form)
export function passwordRules(p) {
  const s = String(p || "");
  return { length: s.length >= 8 && s.length <= 128, capital: /[A-ZÁÉÍÓÚÑ]/.test(s), number: /[0-9]/.test(s) };
}
export function validPassword(p) {
  const r = passwordRules(p);
  return r.length && r.capital && r.number;
}

// ---------------------------------------------------------------- passwords

export async function hashPassword(password, saltB64 = null, iterations = PBKDF2_ITERATIONS) {
  const salt = saltB64 ? unb64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return { hash: `pbkdf2$${iterations}$${b64(bits)}`, salt: b64(salt) };
}
export async function verifyPassword(password, stored, saltB64) {
  if (!stored || !saltB64) return false;
  const [, it, want] = stored.split("$");
  const { hash } = await hashPassword(password, saltB64, Number(it));
  return sameBytes(unb64(hash.split("$")[2]), unb64(want));
}

// ---------------------------------------------------------------- http

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}
export function fail(code, status = 400) {
  return json({ error: code }, status);
}
export function parseCookies(header) {
  const out = {};
  for (const part of String(header || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
export function cookie(name, value, { maxAge, path = "/" } = {}) {
  return `${name}=${encodeURIComponent(value)}; Path=${path}; HttpOnly; Secure; SameSite=Lax${maxAge != null ? `; Max-Age=${maxAge}` : ""}`;
}
// state-changing requests must come from this site (the session cookie is also SameSite=Lax)
export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  return !!origin && origin === new URL(request.url).origin;
}
export async function readJson(request) {
  if (!(request.headers.get("content-type") || "").includes("application/json")) return null;
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : null;
  } catch {
    return null;
  }
}
export function clientIp(request) {
  return request.headers.get("cf-connecting-ip") || "unknown";
}

// ---------------------------------------------------------------- database

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, avatar TEXT NOT NULL,
     pass_hash TEXT, pass_salt TEXT, google_sub TEXT UNIQUE, created_at INTEGER NOT NULL, consent_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id)`,
  `CREATE TABLE IF NOT EXISTS progress (user_id TEXT NOT NULL, desk_id TEXT NOT NULL, points INTEGER NOT NULL, stars INTEGER NOT NULL,
     updated_at INTEGER NOT NULL, PRIMARY KEY (user_id, desk_id))`,
  `CREATE TABLE IF NOT EXISTS attempts (k TEXT NOT NULL, ts INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS attempts_k ON attempts (k, ts)`,
];
const ready = new WeakSet();     // databases already migrated in this isolate
export async function db(env) {
  if (!env.DB) throw new Error("D1 binding DB is missing");
  if (!ready.has(env.DB)) {
    await env.DB.batch(SCHEMA.map((q) => env.DB.prepare(q)));
    ready.add(env.DB);
  }
  return env.DB;
}

export function publicUser(u) {
  return { name: u.name, email: u.email, avatar: u.avatar, google: !!u.google_sub, password: !!u.pass_hash };
}

export async function createSession(DB, userId) {
  const token = randomToken();
  const expires = Date.now() + SESSION_DAYS * 86400000;
  await DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").bind(await sha256hex(token), userId, expires).run();
  // drop this user's expired sessions while we are here
  await DB.prepare("DELETE FROM sessions WHERE user_id = ? AND expires_at < ?").bind(userId, Date.now()).run();
  return cookie(SESSION_COOKIE, token, { maxAge: SESSION_DAYS * 86400 });
}
export async function currentUser(request, DB) {
  const token = parseCookies(request.headers.get("cookie"))[SESSION_COOKIE];
  if (!token) return null;
  const row = await DB.prepare(
    "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?"
  ).bind(await sha256hex(token), Date.now()).first();
  return row || null;
}
export async function endSession(request, DB) {
  const token = parseCookies(request.headers.get("cookie"))[SESSION_COOKIE];
  if (token) await DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256hex(token)).run();
  return cookie(SESSION_COOKIE, "", { maxAge: 0 });
}

// failed sign-ins per email and per IP: after LOCK_FAILS in LOCK_MINUTES the next ones are refused
export async function locked(DB, keys) {
  const since = Date.now() - LOCK_MINUTES * 60000;
  for (const k of keys) {
    const r = await DB.prepare("SELECT COUNT(*) AS n FROM attempts WHERE k = ? AND ts > ?").bind(k, since).first();
    if (r && r.n >= LOCK_FAILS) return true;
  }
  return false;
}
export async function recordFail(DB, keys) {
  const now = Date.now();
  await DB.batch([
    ...keys.map((k) => DB.prepare("INSERT INTO attempts (k, ts) VALUES (?, ?)").bind(k, now)),
    DB.prepare("DELETE FROM attempts WHERE ts < ?").bind(now - 86400000),
  ]);
}
export function newId() {
  return crypto.randomUUID();
}
