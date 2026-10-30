// v0.9: the mailbox around the mail exercises (mail.js): folders, star, archive, spam reporting, replies and new messages.
const test = require("node:test");
const assert = require("node:assert/strict");
const M = require("../public/assets/mail.js");
const G = require("../public/assets/growth.js");
const W = require("../public/assets/world.js");
const SCENARIOS = require("../public/assets/scenarios.js");
const byId = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

test("folders: everything starts in the inbox, newest first; move, star, archive and back", () => {
  let st = M.normalise(null);
  const inbox = M.list(st, "inbox");
  assert.equal(inbox.length, G.MAIL.length);
  for (let i = 1; i < inbox.length; i++) assert.ok(inbox[i - 1].day + inbox[i - 1].time >= inbox[i].day + inbox[i].time, "newest first");
  st = M.toggleStar(st, "maintenance");
  assert.deepEqual(M.list(st, "starred").map((m) => m.id), ["maintenance"]);
  st = M.move(st, "maintenance", "archive");
  assert.equal(M.folderOf(st, "maintenance"), "archive");
  assert.ok(!M.list(st, "inbox").some((m) => m.id === "maintenance"));
  assert.deepEqual(M.list(st, "archive").map((m) => m.id), ["maintenance"]);
  assert.deepEqual(M.list(st, "starred").map((m) => m.id), ["maintenance"], "starred shows it wherever it is");
  st = M.toggleStar(st, "maintenance");
  assert.equal(M.list(st, "starred").length, 0);
  st = M.move(st, "maintenance", "inbox");
  assert.equal(M.folderOf(st, "maintenance"), "inbox");
  assert.equal(M.move(st, "maintenance", "nowhere"), st, "unknown folder: nothing changes");
  const c = M.counts(st, ["maintenance"]);
  assert.equal(c.inbox, G.MAIL.length);
  assert.equal(c.unread, G.MAIL.length - 1);
  // unknown messages and folders are dropped from a saved state
  const n = M.normalise({ at: { maintenance: "spam", gone: "archive", "ceo-phish": "bad" }, star: ["gone", "cab-reminder"], sent: [{ id: "s-1", body: "x" }, 4], seq: 0 });
  assert.deepEqual(n.at, { maintenance: "spam" });
  assert.deepEqual(n.star, ["cab-reminder"]);
  assert.equal(n.sent.length, 1);
  assert.equal(n.seq, 1);
});

test("report as spam or phishing: moves to Spam and answers the exercise with its report option", () => {
  let st = M.normalise(null);
  for (const id of ["ceo-phish", "courier-phish"]) {
    const r = M.report(st, G.mail(id));
    assert.equal(r.result, "correct", id);
    assert.equal(r.answer, "report");
    st = r.state;
    assert.equal(M.folderOf(st, id), "spam");
  }
  const legit = M.report(st, G.mail("courier-pickup"));
  assert.equal(legit.result, "partial", "a genuine message reported is only partly right");
  st = legit.state;
  assert.deepEqual(M.list(st, "spam").map((m) => m.id).sort(), ["ceo-phish", "courier-phish", "courier-pickup"]);
  st = M.toggleStar(st, "courier-pickup");
  assert.equal(M.list(st, "starred").length, 0, "spam does not show in Starred");
  st = M.notSpam(st, "courier-pickup");
  assert.equal(M.folderOf(st, "courier-pickup"), "inbox");
  assert.equal(M.counts(st, []).spam, 2);
  // every message can be reported (the exercises all have a report option)
  for (const m of G.MAIL) assert.ok(G.grade(m, "report"), m.id + " report option");
});

test("replies: ticket templates for requests, gaps must be filled, the Reply-To is used and phishing replies are flagged", () => {
  let st = M.normalise(null);
  const req = G.mail("printer-request");
  const sc = byId[req.ticket];
  for (const lang of ["en", "es"]) {
    const tpl = M.templates(req, lang, { ticket: sc.ticket.id, prio: sc.ticket.priority, me: "Alex" });
    assert.deepEqual(tpl.map((x) => x.id), ["ack", "info", "done", "thanks"]);
    assert.ok(tpl.every((x) => x.label && x.text.includes("Alex")), lang);
    assert.ok(tpl[0].text.includes("INC-20452") && !M.hasGap(tpl[0].text), "the acknowledgement is ready to send");
    assert.ok(M.hasGap(tpl[1].text), "the question has a gap to fill");
  }
  assert.deepEqual(M.templates(G.mail("maintenance"), "en", {}).map((x) => x.id), ["thanks"], "no ticket: a short thank-you only");
  assert.equal(M.reply(st, req, { text: "ok" }).error, "empty");
  assert.equal(M.reply(st, req, { text: "Hi, I need [what you need] please" }).error, "gaps");
  const ok = M.reply(st, req, { text: M.templates(req, "es", { ticket: "INC-20452" })[0].text, template: "ack", now: 1000 }, "es");
  assert.ok(ok.ok);
  assert.equal(ok.item.to, "recepcion@contoso.com");
  assert.equal(ok.item.subject, "RE: La impresora de recepción no imprime");
  assert.deepEqual(ok.item.flags, []);
  assert.equal(ok.item.id, "s-1");
  st = ok.state;
  assert.deepEqual(M.list(st, "sent").map((x) => x.id), ["s-1"]);
  assert.equal(M.repliesTo(st, "printer-request").length, 1);
  // phishing: the reply goes to the attacker's Reply-To and is flagged
  const ph = M.reply(st, G.mail("ceo-phish"), { text: "Hello Isabel, what list do you mean exactly?", now: 2000 }, "en");
  assert.equal(ph.item.to, "isabel.ferrer.ceo@freemail.example");
  assert.ok(ph.item.flags.includes("phish-reply"));
  assert.ok(M.reply(st, G.mail("mfa-reset"), { text: "Carlos, your new password is Winter2026!" }, "en").item.flags.join() === "phish-reply,password");
  assert.equal(ph.item.id, "s-2");
});

test("lint: passwords and one-time codes in a message are flagged", () => {
  assert.deepEqual(M.lint("Tu contraseña temporal es Contoso-2026"), ["password"]);
  assert.deepEqual(M.lint("password: Hunter22"), ["password"]);
  assert.deepEqual(M.lint("El código de verificación es 482913"), ["secret"]);
  assert.deepEqual(M.lint("Please reset your password from the portal, I will not send it by email."), []);
});

test("compose: to a fictional internal contact, with checks", () => {
  const people = W.createWorld().users;
  const list = M.contacts(people, "es");
  assert.ok(list.some((c) => c.address === "redes@contoso.com" && c.name === "Redes y Comunicaciones"));
  assert.ok(list.some((c) => c.id === "jruiz"));
  assert.ok(!list.some((c) => /^svc-|^it\.admin$/.test(c.id)), "no service or admin accounts");
  assert.ok(list.every((c) => /@contoso\.com$/.test(c.address)));
  let st = M.normalise(null);
  assert.deepEqual(M.compose(st, { to: "nobody", subject: "", body: "" }, list).errors, ["to", "subject", "empty"]);
  assert.deepEqual(M.compose(st, { to: "redes", subject: "Puerto", body: "El puerto [número] del 2F" }, list).errors, ["gaps"]);
  const r = M.compose(st, { to: "redes", subject: "Puerto Gi1/0/7 del 2F", body: "Hola, ¿podéis revisar el puerto Gi1/0/7? Gracias.", now: 3 }, list);
  assert.ok(r.ok);
  assert.equal(r.item.to, "redes@contoso.com");
  assert.equal(r.item.kind, "new");
  st = r.state;
  assert.equal(M.sentItem(st, r.item.id).subject, "Puerto Gi1/0/7 del 2F");
  assert.deepEqual(M.compose(st, { to: "jruiz", subject: "Acceso", body: "Javier, tu contraseña es Temporal-2026" }, list).item.flags, ["password"]);
});

test("the new v0.9 messages tie into the desks and stay fictional", () => {
  const ids = ["net-change", "vendor-rma", "courier-pickup", "cab-reminder", "courier-phish"];
  for (const id of ids) assert.ok(G.mail(id), id);
  assert.ok(byId["net-fortigate-branch"].intro.en.includes("CHG-4471") && G.mail("net-change").subject.en.includes("CHG-4471"), "the change of desk 21");
  assert.ok(/SR \d{9}/.test(G.mail("vendor-rma").subject.en), "an RMA (service request) number");
  assert.ok(/TIX\d{9}/.test(G.mail("courier-pickup").subject.en), "the carrier's tracking format");
  const fake = G.mail("courier-phish");
  assert.equal(fake.kind, "phishing");
  assert.ok(fake.links.every((l) => l.text !== l.href) && /transiberica-aduanas\.example/.test(fake.links[0].href));
  assert.notEqual(G.domainOf(fake.from.address), G.domainOf(G.mail("courier-pickup").from.address), "the look-alike is not the carrier");
  // external but genuine: their own domain, every check passes, links go where they say, reporting is not the answer
  for (const m of G.MAIL.filter((x) => x.kind === "external")) {
    assert.ok(/\.example$/.test(G.domainOf(m.from.address)) && m.dirNote, m.id);
    assert.deepEqual([m.headers.spf, m.headers.dkim, m.headers.dmarc], ["pass", "pass", "pass"], m.id);
    m.links.forEach((l) => assert.equal(l.text, l.href));
    assert.notEqual(G.grade(m, "report").result, "correct", m.id);
  }
});
