// Progress and knowledge (v0.4): knowledge base articles from the user's own note, Markdown and versions, the day streak, the weekly
// goal (ISO week), the badges and the mail exercises, with the data checked in both languages.
const test = require("node:test");
const assert = require("node:assert/strict");
const G = require("../public/assets/growth.js");
const E = require("../public/assets/engine.js");
const W = require("../public/assets/world.js");
const SCENARIOS = require("../public/assets/scenarios.js");

const byId = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));
function play(sc, lang = "en") {
  const sess = E.createSession(sc, lang);
  sc.solution.forEach((c) => E.run(sess, c));
  return sess;
}

test("every note element says which article section it fills", () => {
  for (const sc of SCENARIOS) {
    for (const n of sc.note) assert.ok(G.ROLES.includes(n.kb), `${sc.id}: note element "${n.label.en}" has no kb role`);
    for (const r of ["cause", "fix", "verify"]) assert.ok(sc.note.some((n) => n.kb === r), `${sc.id}: no ${r} element`);
  }
});

test("a resolved ticket with a complete note becomes an article built from the user's own sentences", () => {
  for (const sc of SCENARIOS) {
    for (const lang of ["en", "es"]) {
      const sess = play(sc, lang);
      const text = sc.sampleNote[lang];
      const note = E.checkNote(sc, text, lang);
      const v = E.verdict(sess, note, { code: sc.codes[0], minutes: 5 });
      assert.equal(v.level, "resolved", sc.id);
      assert.ok(G.qualifies(v.level, note), sc.id + " qualifies");
      const { kb, entry, changed } = G.saveArticle({}, { deskId: sc.id, ticketId: sc.ticket.id, note: text, code: sc.codes[0], points: v.points, lang, day: "2026-10-28" });
      assert.ok(changed && kb[sc.id] === entry && entry.version === "1.0");
      const a = G.buildArticle(sc, entry, lang, E.codeLabel);
      assert.equal(a.title, sc.title[lang]);
      assert.equal(a.symptom.subject, sc.ticket.subject[lang]);
      assert.equal(a.code, E.codeLabel(sc.codes[0], lang));
      assert.ok(a.environment.some((x) => x.value === sc.requester.device), sc.id + " device");
      assert.equal(a.guide, sc.guide);
      // nothing invented: every sentence of every section is in the note, and every sentence of the note is somewhere
      const all = a.sections.flatMap((s) => s.text);
      all.forEach((x) => assert.ok(text.includes(x), `${sc.id}/${lang}: "${x}" is not in the note`));
      G.splitNote(text).forEach((x) => assert.ok(all.includes(x), `${sc.id}/${lang}: "${x}" was lost`));
      for (const r of ["cause", "fix", "verify"]) assert.ok(a.sections.find((s) => s.role === r).text.length, `${sc.id}/${lang}: empty ${r}`);
    }
  }
});

test("an incomplete note or an unresolved ticket is not saved", () => {
  const sc = byId["ad-lockout"];
  const sess = play(sc);
  const short = E.checkNote(sc, "Unlocked the account for the user.", "en");
  assert.ok(!G.qualifies(E.verdict(sess, short, { code: sc.codes[0], minutes: 3 }).level, short));
  const full = E.checkNote(sc, sc.sampleNote.en, "en");
  const fresh = E.createSession(sc, "en");
  assert.ok(!G.qualifies(E.verdict(fresh, full, { code: sc.codes[0], minutes: 3 }).level, full));
  assert.ok(G.qualifies("observations", full), "resolved with observations still counts when the note is complete");
});

test("labelled notes go to their sections and the label is dropped", () => {
  const sc = byId["ad-lockout"];
  const s = G.structure(sc, "Causa: la tarea programada de FS-SCAN01 con la contraseña antigua.  Cambio: deshabilité la tarea y desbloqueé la cuenta. Comprobación: LockedOut False.\nSeguimiento: pedir una cuenta de servicio.");
  assert.deepEqual(s.cause, ["la tarea programada de FS-SCAN01 con la contraseña antigua."]);
  assert.deepEqual(s.fix, ["deshabilité la tarea y desbloqueé la cuenta."]);
  assert.deepEqual(s.verify, ["LockedOut False."]);
  assert.deepEqual(s.followup, ["pedir una cuenta de servicio."]);
  assert.deepEqual(G.structure(sc, "Coffee was cold this morning.").other, ["Coffee was cold this morning."]);
});

test("versions: v1.0, then v1.1 for every newer approved note; the same note again changes nothing", () => {
  const sc = byId["print-queue"];
  const rec = (note, day) => ({ deskId: sc.id, ticketId: sc.ticket.id, note, code: "cause-removed", points: 100, lang: "en", day });
  let r = G.saveArticle({}, rec(sc.sampleNote.en, "2026-10-26"));
  assert.equal(r.entry.version, "1.0");
  const again = G.saveArticle(r.kb, rec(sc.sampleNote.en + "  ", "2026-10-27"));
  assert.equal(again.changed, false);
  assert.equal(again.entry.version, "1.0");
  r = G.saveArticle(r.kb, rec(sc.sampleNote.en + " Told reception.", "2026-10-27"));
  assert.equal(r.entry.version, "1.1");
  r = G.saveArticle(r.kb, rec(sc.sampleNote.en + " Told reception twice.", "2026-10-28"));
  assert.equal(r.entry.version, "1.2");
  assert.deepEqual(r.entry.history.map((h) => h.version), ["1.0", "1.1"]);
  const a = G.buildArticle(sc, r.entry, "en", E.codeLabel);
  assert.equal(G.fileName(a), "kb-INC-20452-v1.2.md");
});

test("the Markdown has the facts, every section and the user's text", () => {
  const sc = byId["mailbox-full"];
  for (const lang of ["en", "es"]) {
    const { entry } = G.saveArticle({}, { deskId: sc.id, ticketId: sc.ticket.id, note: sc.sampleNote[lang], code: "capacity", points: 100, lang, day: "2026-10-28" });
    const a = G.buildArticle(sc, entry, lang, E.codeLabel);
    const md = G.toMarkdown(a);
    const L = G.LABELS[lang];
    assert.ok(md.startsWith("# " + sc.title[lang] + "\n"));
    for (const k of ["symptom", "environment", "cause", "fix", "verify", "followup", "guide"]) assert.ok(md.includes("## " + L[k] + "\n"), `${lang}: ## ${L[k]}`);
    assert.ok(md.includes(`${L.ticket}: INC-20460`) && md.includes(`${L.version}: v1.0`) && md.includes(`${L.code}: ${E.codeLabel("capacity", lang)}`));
    assert.ok(md.includes(`<${sc.guide}>`));
    G.splitNote(sc.sampleNote[lang]).forEach((x) => assert.ok(md.includes(x)));
    assert.ok(!/undefined|null|\[object/.test(md), lang + " no empty values");
  }
});

test("search and topic filter in the knowledge base", () => {
  const arts = ["ad-lockout", "dns-intranet", "mailbox-full"].map((id) => {
    const sc = byId[id];
    return G.buildArticle(sc, G.saveArticle({}, { deskId: id, ticketId: sc.ticket.id, note: sc.sampleNote.es, code: sc.codes[0], points: 90, lang: "es", day: "2026-10-28" }).entry, "es", E.codeLabel);
  });
  assert.equal(G.searchKb(arts, "", "").length, 3);
  assert.deepEqual(G.searchKb(arts, "", "Red / DNS").map((a) => a.deskId), ["dns-intranet"]);
  assert.deepEqual(G.searchKb(arts, "scantofinance", "").map((a) => a.deskId), ["ad-lockout"]);
  assert.deepEqual(G.searchKb(arts, "INC-20460", "").map((a) => a.deskId), ["mailbox-full"]);
  assert.deepEqual(G.searchKb(arts, "cuota", "Red / DNS"), []);
});

test("local days and ISO weeks", () => {
  assert.equal(G.dayOf(new Date(2026, 9, 28, 0, 30)), "2026-10-28");
  assert.equal(G.dayOf(new Date(2026, 9, 27, 23, 59)), "2026-10-27");
  assert.equal(G.dayNum("2026-10-26") - G.dayNum("2026-10-25"), 1, "the day summer time ends is still one day");
  assert.equal(G.dayNum("2026-03-30") - G.dayNum("2026-03-29"), 1);
  assert.equal(G.isoWeek("2026-10-25"), "2026-W43");
  assert.equal(G.isoWeek("2026-10-26"), "2026-W44");
  assert.equal(G.isoWeek("2026-11-01"), "2026-W44");
  assert.equal(G.isoWeek("2026-12-31"), "2026-W53");
  assert.equal(G.isoWeek("2027-01-03"), "2026-W53");
  assert.equal(G.isoWeek("2027-01-04"), "2027-W01");
  assert.equal(G.isoWeek("2024-12-30"), "2025-W01");
  assert.equal(G.isoWeek("nonsense"), "");
});

test("streak: consecutive days, alive until the end of the next day, broken by a gap", () => {
  const act = (days) => days.map((day, i) => ({ type: "mail", id: "m" + i, day }));
  assert.deepEqual(G.streak([], "2026-10-28"), { current: 0, best: 0, today: false });
  const a = act(["2026-10-26", "2026-10-27", "2026-10-27", "2026-10-28"]);
  assert.deepEqual(G.streak(a, "2026-10-28"), { current: 3, best: 3, today: true });
  assert.deepEqual(G.streak(a, "2026-10-29"), { current: 3, best: 3, today: false }, "nothing yet today: yesterday's streak still counts");
  assert.deepEqual(G.streak(a, "2026-10-30"), { current: 0, best: 3, today: false }, "a missed day breaks it");
  const gap = act(["2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-25", "2026-10-26"]);
  assert.deepEqual(G.streak(gap, "2026-10-26"), { current: 2, best: 4, today: true });
  const months = act(["2026-10-30", "2026-10-31", "2026-11-01", "2026-12-31", "2027-01-01"]);
  assert.equal(G.streak(months, "2026-11-01").current, 3, "across a month");
  assert.equal(G.streak(months, "2027-01-01").current, 2, "across a year");
  assert.equal(G.streak(act(["2026-10-28", "bad", null]), "2026-10-28").current, 1, "ignores broken entries");
});

test("weekly goal: different tickets and exercises in this ISO week, target 1 to 7 (default 3)", () => {
  assert.equal(G.goalValue(undefined), 3);
  assert.equal(G.goalValue(0), 1);
  assert.equal(G.goalValue(12), 7);
  assert.equal(G.goalValue("5"), 5);
  const a = [
    { type: "ticket", id: "ad-lockout", day: "2026-10-25" },   // Sunday: last week
    { type: "ticket", id: "ad-lockout", day: "2026-10-26" },
    { type: "ticket", id: "ad-lockout", day: "2026-10-27" },   // same ticket again: counts once
    { type: "mail", id: "ceo-phish", day: "2026-10-28" },
    { type: "ticket", id: "dns-intranet", day: "2026-11-01" },  // Sunday: still this week
    { type: "ticket", id: "disk-full", day: "2026-11-02" },     // next Monday
  ];
  assert.deepEqual(G.week(a, "2026-10-28", 3), { week: "2026-W44", done: 3, target: 3, met: true });
  assert.deepEqual(G.week(a, "2026-11-02", 2), { week: "2026-W45", done: 1, target: 2, met: false });
  assert.equal(G.week([], "2026-10-28").target, 3);
});

test("badges: computed from the activity, earned once and kept with the day", () => {
  assert.ok(G.BADGES.length >= 8 && G.BADGES.length <= 10);
  for (const b of G.BADGES) assert.ok(b.name.en && b.name.es && b.rule.en && b.rule.es && b.icon, b.id);
  const desks = SCENARIOS.map((s) => s.id);
  const base = { progress: {}, desks, kb: {}, mail: {}, today: "2026-10-28" };
  const earned = (o) => G.BADGES.filter((b) => b.test(G.facts(Object.assign({}, base, o)))).map((b) => b.id);
  assert.deepEqual(earned({ activity: [] }), []);
  const close = (id, day, x) => Object.assign({ type: "ticket", id, day, level: "resolved", points: 100, hints: 0, slaOk: true, codeOk: true, noteComplete: true }, x);
  assert.deepEqual(earned({ activity: [close("ad-lockout", "2026-10-28", { hints: 1, noteComplete: false })] }), ["first-ticket"]);
  assert.ok(earned({ activity: [close("ad-lockout", "2026-10-28")] }).includes("spotless-note"));
  assert.ok(!earned({ activity: [close("ad-lockout", "2026-10-28"), close("ad-lockout", "2026-10-28")] }).includes("own-steam"), "three different tickets");
  const three = ["ad-lockout", "dns-intranet", "disk-full"].map((id, i) => close(id, "2026-10-2" + (6 + i)));
  const e3 = earned({ activity: three });
  assert.ok(e3.includes("own-steam") && e3.includes("streak-3") && !e3.includes("streak-7") && !e3.includes("on-time"));
  const all = desks.map((id, i) => close(id, "2026-10-" + (20 + i)));
  const eAll = earned({ activity: all });
  assert.ok(eAll.includes("full-shift") && eAll.includes("on-time"));
  assert.ok(earned({ activity: [], progress: Object.fromEntries(desks.map((d) => [d, { points: 80, stars: 2 }])) }).includes("full-shift"), "from the saved results too");
  const week = Array.from({ length: 7 }, (_, i) => ({ type: "mail", id: "maintenance", day: "2026-10-" + (20 + i) }));
  assert.ok(earned({ activity: week }).includes("streak-7"));
  assert.ok(earned({ activity: [], mail: { "ceo-phish": { result: "correct" } } }).includes("sharp-eye"));
  assert.ok(!earned({ activity: [], mail: { "ceo-phish": { result: "partial" } } }).includes("sharp-eye"));
  const kb5 = Object.fromEntries(desks.slice(0, 5).map((d) => [d, {}]));
  assert.deepEqual(earned({ activity: [], kb: kb5 }).filter((x) => /article|librarian/.test(x)), ["first-article", "librarian"]);
  // award keeps the first day and only reports the new ones
  const f1 = G.facts(Object.assign({}, base, { activity: [close("ad-lockout", "2026-10-27")] }));
  const r1 = G.award({}, f1, "2026-10-27");
  assert.deepEqual(r1.fresh, ["first-ticket", "spotless-note"]);
  const r2 = G.award(r1.awards, G.facts(Object.assign({}, base, { activity: [] })), "2026-10-28");
  assert.deepEqual(r2.fresh, []);
  assert.equal(r2.awards["first-ticket"], "2026-10-27", "earned badges stay earned");
  const shown = G.badges(r2.awards, "es");
  assert.equal(shown.find((b) => b.id === "first-ticket").day, "2026-10-27");
  assert.equal(shown.find((b) => b.id === "librarian").earned, false);
});

test("mail data: six messages, both languages, real tickets and directory entries, safe fictional addresses", () => {
  assert.equal(G.MAIL.length, 6);
  const kinds = G.MAIL.map((m) => m.kind);
  for (const k of ["phishing", "impersonation", "notice", "legit"]) assert.ok(kinds.includes(k), k);
  assert.equal(G.MAIL.filter((m) => m.kind === "request").length, 2);
  const ids = new Set();
  for (const m of G.MAIL) {
    assert.ok(!ids.has(m.id) && /^[a-z0-9-]+$/.test(m.id), m.id);
    ids.add(m.id);
    for (const lang of ["en", "es"]) {
      assert.ok(G.t(m.subject, lang) && G.t(m.from.name, lang), `${m.id} ${lang} subject/from`);
      assert.ok(m.body[lang].length >= 2 && m.clues[lang].length >= 2 && m.procedure[lang], `${m.id} ${lang} body/clues/procedure`);
      for (const p of m.body[lang]) G.paragraph(p).forEach((x) => assert.ok(x.text || m.links[x.link], `${m.id}: link ${x.link}`));
      for (const o of m.options) assert.ok(o.label[lang] && o.why[lang], `${m.id}/${o.id} ${lang}`);
    }
    assert.equal(m.body.en.join(" ").split("[[").length, m.body.es.join(" ").split("[[").length, m.id + " same links in both languages");
    assert.ok(m.options.length >= 3 && m.options.length <= 4, m.id + " 3-4 options");
    assert.equal(m.options.filter((o) => o.result === "correct").length, 1, m.id + " one correct answer");
    m.options.forEach((o) => assert.ok(["correct", "partial", "wrong"].includes(o.result)));
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(m.day) && /^\d{2}:\d{2}$/.test(m.time));
    for (const k of ["spf", "dkim", "dmarc"]) assert.ok(["pass", "fail", "none", "softfail"].includes(m.headers[k]), `${m.id} ${k}`);
    if (m.ticket) assert.ok(byId[m.ticket], `${m.id}: ticket ${m.ticket} exists`);
    if (m.directory) assert.ok(W.user(W.createWorld(), m.directory), `${m.id}: ${m.directory} in the directory`);
    if (m.claims) assert.ok(W.user(W.createWorld(), m.claims), `${m.id}: ${m.claims} in the directory`);
    // only fictional domains: contoso, the look-alike and reserved .example / documentation IPs
    const text = JSON.stringify(m);
    for (const d of text.match(/[\w.-]+@[\w.-]+\.[a-z]+/g) || []) assert.ok(/@(contoso\.com|([\w-]+\.)?contoso-it-support\.com|[\w.-]*\.example)$/.test(d), `${m.id}: ${d}`);
    for (const ip of text.match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g) || []) assert.ok(/^(10\.|203\.0\.113\.|198\.51\.100\.)/.test(ip), `${m.id}: ${ip}`);
  }
  // the two requests are tickets you can open, with a "create ticket" answer that is the right one
  for (const m of G.MAIL.filter((x) => x.kind === "request")) assert.equal(G.grade(m, "ticket").result, "correct", m.id);
  // phishing: look-alike domain, Reply-To mismatch, SPF and DMARC fail, a link whose target differs from its text
  const ph = G.MAIL.find((m) => m.kind === "phishing");
  assert.equal(G.domainOf(ph.from.address), "contoso-it-support.com");
  assert.notEqual(ph.headers.replyTo, ph.from.address);
  assert.equal(ph.headers.spf, "fail");
  assert.equal(ph.headers.dmarc, "fail");
  assert.ok(ph.links.length && ph.links.every((l) => l.text !== l.href));
  assert.equal(G.grade(ph, "report").result, "correct");
  assert.equal(G.grade(ph, "click").result, "wrong");
  // impersonation: a personal address claiming to be someone in the directory
  const im = G.MAIL.find((m) => m.kind === "impersonation");
  assert.ok(/\.example$/.test(G.domainOf(im.from.address)) && im.claims && !im.directory);
  // the legitimate ones pass every check from the internal domain (not everything is phishing)
  for (const m of G.MAIL.filter((x) => ["legit", "notice", "request"].includes(x.kind))) {
    assert.equal(G.domainOf(m.from.address), "contoso.com", m.id);
    assert.deepEqual([m.headers.spf, m.headers.dkim, m.headers.dmarc], ["pass", "pass", "pass"], m.id);
    assert.notEqual(G.grade(m, "report").result, "correct", m.id + ": reporting it is not the answer");
    m.links.forEach((l) => assert.equal(l.text, l.href));
  }
});

test("mail grading and score", () => {
  const m = G.mail("mfa-reset");
  assert.equal(G.grade(m, "do").result, "wrong");
  assert.equal(G.grade(m, "verify").result, "correct");
  assert.equal(G.grade(m, "nope"), null);
  assert.equal(G.mail("nope"), null);
  assert.deepEqual(G.paragraph("Open [[0]] now"), [{ text: "Open " }, { link: 0 }, { text: " now" }]);
  assert.deepEqual(G.mailScore({}), { total: 6, answered: 0, correct: 0, partial: 0, wrong: 0 });
  assert.deepEqual(G.mailScore({ "ceo-phish": { result: "correct" }, "mfa-reset": { result: "wrong" }, maintenance: { result: "partial" }, gone: { result: "correct" } }),
    { total: 6, answered: 3, correct: 1, partial: 1, wrong: 1 });
});
