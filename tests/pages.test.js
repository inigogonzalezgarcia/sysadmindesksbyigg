// The static pages (about, help, FAQ, terms, privacy): both languages, the same strict CSP as the app, no inline code,
// and every local link pointing at a file that exists.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const PUB = path.join(__dirname, "..", "public");
const PAGES = ["about.html", "help.html", "faq.html", "terms.html", "privacy.html"];
const read = (f) => fs.readFileSync(path.join(PUB, f), "utf8");
const CSP = "default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self'; img-src 'self' data: https://*.google-analytics.com https://www.googletagmanager.com; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com; base-uri 'none'; form-action 'none'";

test("every static page has both languages, the strict CSP and no inline code", () => {
  for (const f of PAGES) {
    const h = read(f);
    assert.ok(h.includes(`content="${CSP}"`), f + " CSP");
    assert.ok(/<article class="es" lang="es">[\s\S]*<h1>/.test(h), f + " Spanish article");
    assert.ok(/<article class="en" lang="en" id="en">[\s\S]*<h1>/.test(h), f + " English article");
    assert.ok(h.includes('<script src="assets/doc.js" defer></script>'), f + " doc.js");
    assert.ok(!/<script>(?!<\/script>)/.test(h) && !/<script(?![^>]*\bsrc=)[^>]*>/.test(h), f + " inline script");
    assert.ok(!/\sstyle=|<style/.test(h), f + " inline style");
    assert.ok(!/\son[a-z]+=/.test(h), f + " inline handler");
    assert.ok(!/mailto:/.test(h), f + " no email address");
    assert.ok(h.includes("about.html?tema=sysadmindesks#contacto"), f + " report link");
  }
});

test("local links on the static pages and in the app point at files that exist", () => {
  const files = PAGES.concat(["index.html"]);
  for (const f of files) {
    const h = read(f);
    for (const m of h.matchAll(/href="([^"#:?]+\.(?:html|svg|css))(?:[#?][^"]*)?"/g)) {
      assert.ok(fs.existsSync(path.join(PUB, m[1])), `${f} -> ${m[1]}`);
    }
    for (const m of h.matchAll(/href="#([a-z][\w-]*)"/g)) {
      assert.ok(h.includes(`id="${m[1]}"`), `${f} -> #${m[1]}`);
    }
  }
  const order = ["engine", "scenarios", "world", "growth", "app"].map((n) => read("index.html").indexOf(`<script src="assets/${n}.js"></script>`));
  assert.ok(order.every((x, i) => x > 0 && (!i || x > order[i - 1])), "index.html loads growth.js before app.js");
  const app = fs.readFileSync(path.join(PUB, "assets", "app.js"), "utf8");
  for (const f of PAGES) assert.ok(app.includes(`"${f}"`), "app links " + f);
});

test("the terms and the privacy policy agree on the minimum age and link to each other", () => {
  assert.ok(read("terms.html").includes("14 años") && read("terms.html").includes("14 years old"));
  assert.ok(read("privacy.html").includes("14 años") && read("privacy.html").includes("at least 14"));
  assert.ok(read("terms.html").includes('href="privacy.html"') && read("privacy.html").includes('href="terms.html"'));
});

test("cookies: analytics only through consent.js, with a valid or empty ID, on every page", () => {
  const c = fs.readFileSync(path.join(PUB, "assets", "consent.js"), "utf8");
  const id = c.match(/var GA_ID = "([^"]*)";/);
  assert.ok(id && (id[1] === "" || /^G-[A-Z0-9]{6,12}$/.test(id[1])), "GA_ID empty or G-XXXXXXXX");
  assert.ok(c.includes('analytics_storage: "denied"') && c.includes("allow_google_signals: false"), "consent mode denied by default, no signals");
  for (const f of PAGES.concat(["index.html"])) assert.ok(read(f).includes('src="assets/consent.js"'), f + " loads consent.js");
  assert.ok(read("privacy.html").includes('id="cookies"') && read("privacy.html").includes("_ga"), "privacy explains the cookies");
});
