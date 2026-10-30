// v0.6.2 SEO: the generated pages are up to date (npm run pages), every public page has its canonical, Open Graph and Twitter
// tags, the JSON-LD is valid and the FAQ one matches the visible FAQ, the home page has a static intro, the ticket pages exist
// for every desk and do not give the solution away, and the sitemap lists the clean URLs.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build, SCENARIOS, STATIC, SITE, ticketMeta, faqItems } from "../scripts/build-ticket-pages.mjs";
import { TICKET_SEO } from "../scripts/ticket-pages-data.mjs";

const PUB = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const read = (f) => readFileSync(join(PUB, f), "utf8");
const attr = (h, re) => (h.match(re) || [])[1];
const jsonLd = (h) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const PAGES = Object.entries(STATIC).map(([f, m]) => [f, m.path])
  .concat([["tickets/index.html", "/tickets/"]], SCENARIOS.map((sc) => [`tickets/${sc.id}.html`, "/tickets/" + sc.id]));

test("the generated pages and head blocks are up to date (npm run pages)", () => {
  for (const [rel, content] of Object.entries(build())) assert.equal(read(rel), content, rel + " is stale: run npm run pages");
});

test("every public page: Spanish title and description, canonical, Open Graph and Twitter card", () => {
  for (const [f, p] of PAGES) {
    const h = read(f);
    const title = attr(h, /<title>([^<]+)<\/title>/), desc = attr(h, /<meta name="description" content="([^"]+)">/);
    assert.ok(title && desc && desc.length <= 160, f + " title and description");
    assert.ok(h.includes('<html lang="es" data-title-en="'), f + " lang es with an English title for doc.js/app.js");
    assert.equal(attr(h, /<link rel="canonical" href="([^"]+)">/), SITE + p, f + " canonical");
    assert.equal(attr(h, /<meta property="og:url" content="([^"]+)">/), SITE + p, f + " og:url");
    for (const k of ["og:type", "og:title", "og:description", "og:image", "og:locale", "og:locale:alternate"]) assert.ok(h.includes(`<meta property="${k}" content="`), f + " " + k);
    assert.ok(h.includes('<meta property="og:locale" content="es_ES">') && h.includes('<meta property="og:locale:alternate" content="en_GB">'), f + " locales");
    assert.ok(h.includes('<meta name="twitter:card" content="summary_large_image">'), f + " twitter card");
    assert.equal(h.match(/<title>/g).length, 1, f + " one title");
  }
  const png = readFileSync(join(PUB, "assets", "og.png"));
  assert.equal(png.toString("ascii", 1, 4), "PNG");
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1200, 630], "og.png is 1200x630");
  assert.equal(STATIC["help.html"].title, "Ayuda · cómo practicar soporte IT en SysAdmin Desks");
});

test("JSON-LD: WebApplication on the home page, FAQPage with exactly the visible Spanish FAQ", () => {
  const [app] = jsonLd(read("index.html"));
  assert.equal(app["@type"], "WebApplication");
  assert.equal(app.applicationCategory, "EducationalApplication");
  assert.deepEqual(app.inLanguage, ["es", "en"]);
  assert.equal(app.offers.price, "0");
  assert.equal(app.offers.priceCurrency, "EUR");
  assert.equal(app.isAccessibleForFree, true);
  assert.equal(app.author.name, "Iñigo González García");
  const faq = read("faq.html");
  const [ld] = jsonLd(faq);
  const visible = faqItems(faq);
  const shown = (faq.split('<article class="en"')[0].match(/<details class="faq">/g) || []).length;
  assert.ok(visible.length >= 19 && visible.length === shown, "every Spanish question");
  assert.equal(ld["@type"], "FAQPage");
  assert.deepEqual(ld.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]), visible.map((x) => [x.q, x.a]));
  assert.equal(ld.mainEntity[0].name, "¿Es gratis?");
  for (const f of ["about.html", "help.html", "terms.html", "privacy.html", "tickets/index.html"]) assert.equal(jsonLd(read(f)).length, 0, f + " no JSON-LD");
});

test("the home page has a static, bilingual intro with real desks and links, and no inline code", () => {
  const h = read("index.html");
  const intro = h.slice(h.indexOf('<main id="app"'), h.indexOf("</main>"));
  assert.ok(intro.includes("<h1>SysAdmin Desks: simulador gratuito de soporte IT</h1>"), "Spanish H1");
  assert.ok(intro.includes('<article class="en" lang="en" id="en">') && intro.includes("<h2>Qué tickets puedes practicar</h2>"));
  for (const sc of SCENARIOS) assert.ok(intro.includes(`<a href="/tickets/${sc.id}">`), "intro links " + sc.id);
  for (const href of ["/about", "/help", "/faq", "/tickets/", "https://inigogonzalezgarcia.github.io/guias.html"]) assert.ok(intro.includes(`href="${href}"`), "intro links " + href);
  const code = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/.test(code) && !/\sstyle=|<style/.test(code) && !/\son[a-z]+=/.test(code), "no inline code");
  assert.ok(read("about.html").includes('<h2 id="tickets">Tickets para practicar</h2>'), "about lists the tickets");
});

test("a public page per desk: title, description, CTA, guide, and nothing that gives the ticket away", () => {
  assert.deepEqual(Object.keys(TICKET_SEO).sort(), SCENARIOS.map((s) => s.id).sort(), "SEO copy for every desk and no other");
  const index = read("tickets/index.html");
  for (const sc of SCENARIOS) {
    const h = read(`tickets/${sc.id}.html`);
    const m = ticketMeta(sc);
    assert.equal(m.title, sc.title.es + " · práctica de soporte IT");
    for (const lang of ["es", "en"]) {
      const d = TICKET_SEO[sc.id][lang].desc;
      assert.ok(d.length <= 155, `${sc.id} ${lang} description ${d.length} > 155`);
      assert.ok(lang === "es" ? /^Practica cómo .+ y documentarlo en el ticket\.$/.test(d) : /^Practise how to .+ document it( in the ticket)?\.$/.test(d), `${sc.id} ${lang} description pattern`);
      assert.ok(TICKET_SEO[sc.id][lang].skills.length >= 3, sc.id + " skills");
      assert.ok(h.includes(`href="/?lang=${lang}#/desk/${sc.id}"`), `${sc.id} ${lang} CTA`);
    }
    assert.ok(h.includes("Practícalo gratis") && h.includes("Practise it free"));
    const plain = h.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    assert.ok(plain.includes(sc.ticket.body.es) && plain.includes(sc.ticket.body.en), sc.id + " the ticket as the requester tells it");
    assert.ok(h.includes(`href="${sc.guide}"`), sc.id + " guide");
    assert.ok(index.includes(`href="/tickets/${sc.id}"`), "index links " + sc.id);
    // no spoilers: the reference solution, the hints, the note elements and the sample note never appear
    const low = plain.toLowerCase();
    for (const cmd of sc.solution) assert.ok(!low.includes(cmd.toLowerCase()), `${sc.id} shows the command ${cmd}`);
    for (const x of sc.hints) for (const l of ["es", "en"]) assert.ok(!plain.includes(x[l]), `${sc.id} shows a hint`);
    for (const n of sc.note) for (const l of ["es", "en"]) assert.ok(!plain.includes(n.label[l]), `${sc.id} shows a note element`);
    for (const l of ["es", "en"]) assert.ok(!plain.includes(sc.sampleNote[l].slice(0, 60)), `${sc.id} shows the sample note`);
  }
});

test("sitemap: clean URLs, today's lastmod and every ticket page", () => {
  const x = read("sitemap.xml");
  const locs = [...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const [, p] of PAGES) assert.ok(locs.includes(SITE + p), "sitemap has " + p);
  assert.equal(locs.length, PAGES.length);
  assert.ok(!x.includes(".html"), "no .html in the sitemap");
  assert.equal((x.match(/<lastmod>2026-10-30<\/lastmod>/g) || []).length, locs.length);
});
