// IndexNow: tell Bing, Yandex, Seznam and the other IndexNow engines which public pages changed, so they recrawl them without
// waiting (and without the 100 URLs a day of Bing's manual submission). The key is public by design: it is the file
// public/<key>.txt, which proves the site is ours.
//   node scripts/indexnow.mjs --all                         every URL in the sitemap
//   node scripts/indexnow.mjs --since 2026-11-13            URLs whose sitemap lastmod is that day or later
//   node scripts/indexnow.mjs public/faq.html public/tickets/ad-lockout.html ...   the pages for these files
//   add --dry-run to print the URLs without sending them
// The GitHub Actions workflow .github/workflows/indexnow.yml runs it after every push that changes public/.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUB = join(ROOT, "public");
export const SITE = "https://sysadmindesksbyigg.pages.dev";
export const HOST = new URL(SITE).host;

export function key() {
  const f = readdirSync(PUB).filter((x) => /^[0-9a-f]{32}\.txt$/.test(x));
  if (f.length !== 1) throw new Error("expected one IndexNow key file public/<32 hex>.txt, found " + f.length);
  const k = readFileSync(join(PUB, f[0]), "utf8").trim();
  if (k + ".txt" !== f[0]) throw new Error(f[0] + " must contain only its own name without .txt");
  return k;
}

export function sitemap() {
  const x = readFileSync(join(PUB, "sitemap.xml"), "utf8");
  return [...x.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod><\/url>/g)].map((m) => ({ loc: m[1], lastmod: m[2] }));
}

// a file in public/ -> the clean URL Cloudflare Pages serves it at (only the pages in the sitemap)
export function urlFor(file) {
  const p = file.replace(/\\/g, "/").replace(/^public\//, "");
  if (!p.endsWith(".html")) return null;
  const path = p === "index.html" ? "/" : p.endsWith("/index.html") ? "/" + p.slice(0, -"index.html".length) : "/" + p.slice(0, -5);
  const url = SITE + path;
  return sitemap().some((u) => u.loc === url) ? url : null;
}

export function urls(argv) {
  if (argv.includes("--all")) return sitemap().map((u) => u.loc);
  const i = argv.indexOf("--since");
  if (i >= 0) return sitemap().filter((u) => u.lastmod >= argv[i + 1]).map((u) => u.loc);
  return [...new Set(argv.filter((a) => !a.startsWith("--")).map(urlFor).filter(Boolean))];
}

export function body(list) {
  const k = key();
  return { host: HOST, key: k, keyLocation: `${SITE}/${k}.txt`, urlList: list };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const argv = process.argv.slice(2);
  const list = urls(argv);
  if (!list.length) { console.log("IndexNow: no public page changed, nothing to send."); process.exit(0); }
  if (argv.includes("--dry-run")) { console.log(list.join("\n")); process.exit(0); }
  // IndexNow takes up to 10,000 URLs per request
  for (let n = 0; n < list.length; n += 10000) {
    const part = list.slice(n, n + 10000);
    const res = await fetch("https://api.indexnow.org/indexnow", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body(part)) });
    console.log(`IndexNow: ${part.length} URLs → HTTP ${res.status}`);
    if (res.status !== 200 && res.status !== 202) { console.error(await res.text()); process.exit(1); }
  }
}
