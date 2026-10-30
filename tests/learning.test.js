// v0.8 «Learning»: the documentation library (library.js), the labs by area (labs.js) and the profile and career path (profile.js).
const test = require("node:test");
const assert = require("node:assert/strict");
const Lib = require("../public/assets/library.js");
const Lb = require("../public/assets/labs.js");
const P = require("../public/assets/profile.js");
const Wd = require("../public/assets/world.js");
const NN = require("../public/assets/netcli.js");
const E = require("../public/assets/engine.js");
const SCENARIOS = require("../public/assets/scenarios.js");
// the guides published on inigogonzalezgarcia.github.io/guias/ (from the website's guides.py; refresh it when guides are added)
const SLUGS = new Set(require("./guide-slugs.json"));
const DESKS = new Set(SCENARIOS.map((s) => s.id));
const LABS = new Set(Lb.LABS.map((l) => l.id));
const both = (v) => v && typeof v.en === "string" && typeof v.es === "string" && v.en.trim() && v.es.trim() && v.en !== v.es;
const has = (v) => v && typeof v.en === "string" && typeof v.es === "string" && v.en.trim() && v.es.trim();
const bothList = (v) => v && Array.isArray(v.en) && Array.isArray(v.es) && v.en.length && v.en.length === v.es.length && v.en.every((x) => x.trim()) && v.es.every((x) => x.trim());

/* ---------- the library */
test("library: one article per area, every text in Spanish and English", () => {
  assert.equal(Lib.AREAS.length, 10);
  assert.deepEqual(Lib.ARTICLES.map((a) => a.id).sort(), Lib.AREAS.map((a) => a.id).sort());
  for (const ar of Lib.AREAS) assert.ok(has(ar.name), ar.id + " name");
  for (const a of Lib.ARTICLES) {
    assert.ok(has(a.title) && both(a.summary), a.id + " title/summary");
    assert.ok(bothList(a.what) && bothList(a.causes) && bothList(a.tips), a.id + " what/causes/tips");
    assert.ok(a.tools.length >= 4, a.id + " tools");
    for (const x of a.tools) assert.ok(x.cmd && both(x.what), a.id + " tool " + x.cmd);
    assert.ok(a.tags.length >= 5, a.id + " tags");
  }
});

test("library: every link goes to a desk, a lab and a guide that exist", () => {
  for (const a of Lib.ARTICLES) {
    assert.ok(a.desks.length, a.id + " desks");
    for (const d of a.desks) assert.ok(DESKS.has(d), `${a.id} -> desk ${d}`);
    for (const l of a.labs) assert.ok(LABS.has(l), `${a.id} -> lab ${l}`);
    assert.ok(a.guides.length >= 2, a.id + " guides");
    for (const g of a.guides) assert.ok(SLUGS.has(g), `${a.id} -> guide ${g}`);
    assert.equal(new Set(a.desks).size, a.desks.length, a.id + " no repeated desk");
  }
  // every lab has its article, and every desk is linked from at least one article
  for (const l of Lb.LABS) assert.ok(Lib.forLab(l.id).length, l.id + " has an article");
  for (const sc of SCENARIOS) assert.ok(Lib.forDesk(sc.id).length, sc.id + " is in the library");
  // the desks' own guide links point at guides that exist too
  for (const sc of SCENARIOS) assert.ok(SLUGS.has(sc.guide.replace(/^.*\/guias\//, "").replace(/\.html$/, "")), sc.id + " guide exists");
  assert.equal(Lib.guideUrl("bash-primer-script-de-comprobacion-de-un-servidor"), "https://inigogonzalezgarcia.github.io/guias/bash-primer-script-de-comprobacion-de-un-servidor.html");
});

// every command an article lists is understood where it says
const PAGES = ["#/", "#/mail", "#/kb", "#/progress", "#/shipping", "#/inventory", "#/directory", "#/network", "#/library", "#/labs", "#/profile"];
function understood(tool) {
  const where = Lib.toolPlace(tool);
  const line = tool.try || tool.cmd;
  if (where.kind === "page") return PAGES.includes(where.id);
  if (/<[a-z]/.test(line)) return false;          // a placeholder needs a `try`
  if (where.kind === "ad") return !Wd.run(Wd.createWorld(), line, "en").lines.some((l) => /is not recognized/.test(l.text));
  if (where.kind === "lab") { const s = Lb.create(where.id, "en"); const r = Lb.run(s, line, "en"); return !r.lines.some((l) => /not recognized|command not found/.test(l.text)) && (!s.sess || s.sess.unknown === 0); }
  if (where.kind === "desk") { const sc = SCENARIOS.find((x) => x.id === where.id); const c = E.norm(line); return Boolean(sc) && sc.commands.some((r) => r.match && new RegExp(r.match, "i").test(c)); }
  const net = NN.createNet([]);
  const term = NN.terminal(net);
  if (NN.exec(term, "ssh " + where.id).tags.every((x) => x.tag !== "connect")) return false;
  if (net.devices[where.id].os === "ios") NN.exec(term, "enable");
  return !NN.exec(term, line).unknown;
}
test("library: every command listed is understood by the console, lab, ticket or device the article names", () => {
  for (const a of Lib.ARTICLES) for (const x of a.tools) assert.ok(understood(x), `${a.id}: ${x.cmd} on ${x.on}`);
  // and the check itself fails for something the simulator does not know
  assert.equal(understood({ cmd: "Get-Coffee", on: "ad" }), false);
  assert.equal(understood({ cmd: "show coffee", on: "SW-ACC-2F" }), false);
  assert.equal(understood({ cmd: "Get-Coffee", on: "desk:ad-lockout" }), false);
  assert.equal(understood({ cmd: "brew coffee", on: "lab:linux" }), false);
});

// the root causes, fixes and traps of the desks: an article may teach the area, never give a desk away
const SPOILERS = ["FS-SCAN01", "ScanToFinance", "scheduled task", "tarea programada", "8.8.8.8", "ResetServerAddresses", "SoftwareDistribution", "spool\\PRINTERS",
  "ManagedFolderAssistant", "Enable-Mailbox", "Enable-BitLocker", "w32tm", "Set-Date", "system clock", "reloj del sistema", "svidal", "rgomez", "facturas", "OU=Legal", "Move-ADObject", "mgil",
  "FS01 Weekly", "Remove-VBRBackup", "ProductCode", "9c2e7f10", "logrotate", "timesheet", "BrokerAgent", "CA-Exception-Travel", "PIM", "thumbprint", "chrony", "FS-OLD01", "sp_update_jobstep",
  "SW-DESK-214", "small switch", "switch pequeño", "BPDU", "untagged 22", "a45d.360c.197e", "H-ERPWEB02", "10.20.1.51", "8KQ2TX3", "DTN2338A1QJ", "Autopilot Reset", "SIMPLE model", "modelo SIMPLE", "recovery simple", "a SIMPLE"];
test("library: no article gives a desk's root cause away", () => {
  for (const a of Lib.ARTICLES) for (const lang of ["en", "es"]) {
    const text = [Lib.t(a.title, lang), Lib.t(a.summary, lang)].concat(Lib.textOf(a, lang)).join("\n").toLowerCase();
    for (const w of SPOILERS) assert.ok(!text.includes(w.toLowerCase()), `${a.id} (${lang}) mentions "${w}"`);
  }
});

test("library: search and Markdown", () => {
  assert.equal(Lib.search("", "en").length, Lib.ARTICLES.length);
  assert.equal(Lib.search("err-disabled", "en")[0].article.id, "network");
  assert.equal(Lib.search("buzón compartido", "es")[0].article.id, "m365");
  assert.equal(Lib.search("journalctl", "es")[0].article.id, "linux");
  assert.equal(Lib.search("xyzzy", "en").length, 0);
  for (const lang of ["en", "es"]) {
    const md = Lib.toMarkdown(Lib.article("ad"), lang, (d) => "T:" + d, (l) => "L:" + l);
    assert.ok(md.startsWith("# " + Lib.t(Lib.article("ad").title, lang)));
    assert.ok(md.includes("`Search-ADAccount -LockedOut`") && md.includes("- T:ad-lockout") && md.includes("- L:ad"));
    assert.ok(md.includes(Lib.guideUrl("active-directory-alta-usuario-grupos")));
  }
});

/* ---------- the labs */
// one way to finish every task of each lab, in order
const WAY = {
  ad: ["Search-ADAccount -LockedOut", "Unlock-ADAccount jruiz", "Set-ADAccountPassword lperez -Reset", "Set-ADUser lperez -ChangePasswordAtLogon $true",
    "Add-ADGroupMember GG-VPN-Users -Members eromero", "Get-ADUser aortiz -Properties LastLogonDate"],
  network: ["ssh SW-CORE-01", "show mac address-table address 6c4b.9042.1a24", "exit", "ssh SW-ACC-2F", "enable", "show mac address-table address 6c4b.9042.1a24",
    "configure terminal", "interface gi1/0/16", "description FIN 2.16", "switchport access vlan 140", "no shutdown", "end", "write memory", "show interfaces status err-disabled", "ping 10.20.1.10"],
  windows: ["ipconfig /all", "nslookup intranet.contoso.local", "ipconfig /flushdns", "Get-Service Spooler", "Restart-Service Spooler", "Get-PSDrive C", "Get-WinEvent -LogName System -MaxEvents 20"],
  m365: ["Connect-MgGraph -Scopes User.Read.All", "Connect-ExchangeOnline", "Get-MgSubscribedSku", "Get-MgUserLicenseDetail -UserId eromero@contoso.com", "Get-EXOMailboxStatistics jruiz",
    "Add-MailboxPermission eventos -User aortiz -AccessRights FullAccess", "Get-MailboxPermission eventos", "Add-RecipientPermission eventos -Trustee aortiz -AccessRights SendAs"],
  linux: ["df -h", "sudo du -sh /var/*", "systemctl status nginx", "journalctl -u nginx", "sudo ss -tlnp", "sudo firewall-cmd --permanent --add-service=https", "sudo firewall-cmd --reload", "timedatectl"],
};
test("labs: five labs, 4-6 tasks each, both languages, an area with an article", () => {
  assert.deepEqual(Lb.LABS.map((l) => l.id), ["ad", "network", "windows", "m365", "linux"]);
  for (const l of Lb.LABS) {
    assert.ok(both(l.title) && both(l.summary), l.id);
    assert.ok(l.tasks.length >= 4 && l.tasks.length <= 6, l.id + " tasks");
    for (const x of l.tasks) assert.ok(both(x.label) && x.hint && typeof x.check === "function", `${l.id}.${x.id}`);
    assert.ok(Lib.area(l.area), l.id + " area");
  }
});

test("labs: nothing is done at the start, and one way through ticks every task", () => {
  for (const l of Lb.LABS) for (const lang of ["en", "es"]) {
    const s = Lb.create(l.id, lang);
    assert.ok(Lb.tasks(s, lang).every((x) => !x.done), l.id + " starts with nothing done");
    for (const c of WAY[l.id]) {
      const r = Lb.run(s, c, lang);
      assert.ok(!r.lines.some((x) => /not recognized|command not found|Invalid input/.test(x.text)), `${l.id}: ${c}`);
    }
    const st = Lb.tasks(s, lang);
    assert.ok(st.every((x) => x.done), `${l.id} (${lang}): ${st.filter((x) => !x.done).map((x) => x.id)}`);
    if (s.sess) assert.equal(s.sess.unknown, 0, l.id + " no unknown command");
  }
});

test("labs: each task checks the state, not just the command", () => {
  const done = (s) => Object.fromEntries(Lb.tasks(s, "en").map((x) => [x.id, x.done]));
  // AD: reading the wrong account, or a reset without "change at next sign-in"
  let s = Lb.create("ad");
  ["Get-ADUser jruiz", "Set-ADAccountPassword lperez -Reset", "Add-ADGroupMember GG-Sales -Members eromero", "Search-ADAccount -AccountDisabled"].forEach((c) => Lb.run(s, c));
  assert.deepEqual(done(s), { find: false, unlock: false, reset: false, group: false, lastlogon: false });
  // the AD lab is its own copy: the Directory's world is not touched
  assert.equal(Wd.user(Wd.createWorld(), "jruiz").locked, false);
  // network: the MAC found only on the core (the uplink) is not the port; a port changed but not saved; ping from the workstation
  s = Lb.create("network");
  ["ping 10.20.1.10", "ssh SW-CORE-01", "show mac address-table address 6c4b.9042.1a24", "exit", "ssh SW-ACC-2F", "enable", "configure terminal", "interface gi1/0/16",
    "switchport access vlan 140", "no shutdown", "end"].forEach((c) => Lb.run(s, c));
  assert.deepEqual(done(s), { mac: false, vlan: false, save: false, errdis: false, ping: false });
  ["configure terminal", "interface gi1/0/16", "description FIN 2.16", "end"].forEach((c) => Lb.run(s, c));
  assert.equal(done(s).vlan, true);
  assert.equal(done(s).save, false, "not saved yet");
  Lb.run(s, "write memory");
  assert.equal(done(s).save, true);
  // Windows: the spooler stopped and not started again; ipconfig without /all
  s = Lb.create("windows");
  ["ipconfig", "Get-Service Spooler", "Stop-Service Spooler", "nslookup erp.contoso.local"].forEach((c) => Lb.run(s, c));
  assert.equal(done(s).spooler, false); assert.equal(done(s).ip, false); assert.equal(done(s).dns, false);
  Lb.run(s, "Start-Service Spooler");
  assert.equal(done(s).spooler, true);
  // Microsoft 365: nothing works before connecting; permissions read before they are given
  s = Lb.create("m365");
  ["Get-MgSubscribedSku", "Get-EXOMailboxStatistics jruiz", "Connect-ExchangeOnline", "Get-MailboxPermission eventos", "Add-MailboxPermission eventos -User aortiz -AccessRights FullAccess"].forEach((c) => Lb.run(s, c));
  assert.equal(done(s).sku, false); assert.equal(done(s).size, false); assert.equal(done(s).fullaccess, false);
  Lb.run(s, "Get-MailboxPermission eventos");
  assert.equal(done(s).fullaccess, true);
  // Linux: du and ss without sudo, a firewall rule only at runtime (lost at the reload)
  s = Lb.create("linux");
  ["du -sh /var/*", "ss -tlnp", "firewall-cmd --add-service=https", "sudo firewall-cmd --add-service=https", "sudo firewall-cmd --reload"].forEach((c) => Lb.run(s, c));
  assert.deepEqual([done(s).du, done(s).port, done(s).firewall], [false, false, false]);
  Lb.run(s, "sudo firewall-cmd --permanent --add-service=https");
  assert.equal(done(s).firewall, false, "permanent but not active yet");
  Lb.run(s, "sudo firewall-cmd --reload");
  assert.equal(done(s).firewall, true);
});

test("labs: the consoles answer like the real tools", () => {
  const s = Lb.create("windows");
  const out = (c) => Lb.run(s, c).lines.map((l) => l.text).join("\n");
  assert.match(out("ipconfig /all"), /DNS Servers . . . . . . . . . . . : 10\.20\.1\.10\n\s+10\.20\.1\.11/);
  assert.match(out("nslookup nothing.contoso.local"), /can't find nothing\.contoso\.local: Non-existent domain/);
  assert.match(out("Get-Service nope"), /Cannot find any service with service name 'nope'/);
  assert.match(out("Test-NetConnection intranet.contoso.local -Port 443"), /RemotePort\s+: 443[\s\S]*TcpTestSucceeded : True/);
  const m = Lb.create("m365");
  assert.match(Lb.run(m, "Get-MgSubscribedSku").lines[0].text, /^Get-MgSubscribedSku: Authentication needed\. Please call Connect-MgGraph\.$/);
  const x = Lb.create("linux");
  assert.match(Lb.run(x, "firewall-cmd --list-services").lines[0].text, /^Authorization failed\./);
  assert.match(Lb.run(x, "systemctl status foo").lines[0].text, /^Unit foo\.service could not be found\.$/);
  assert.equal(Lb.prompt(x), "[it.admin@lab-lnx01 ~]$ ");
  const n = Lb.create("network");
  assert.equal(Lb.prompt(n), NN.WS_PROMPT);
  Lb.run(n, "ssh SW-ACC-1F");
  assert.equal(Lb.prompt(n), "SW-ACC-1F# ");
  assert.equal(Lb.run(Lb.create("ad"), "clear").clear, true);
});

test("labs: progress is kept per lab, only grows, and resets", () => {
  let r = Lb.record({}, "ad", ["find", "unlock"], "2026-10-26");
  assert.deepEqual(r.fresh, ["find", "unlock"]);
  assert.deepEqual(r.store.ad, { done: ["find", "unlock"], day: "2026-10-26", completed: null });
  r = Lb.record(r.store, "ad", ["find"], "2026-10-27");
  assert.deepEqual(r.fresh, []);
  assert.equal(r.store.ad.day, "2026-10-26", "nothing new: unchanged");
  r = Lb.record(r.store, "ad", ["reset", "group", "lastlogon"], "2026-10-28");
  assert.equal(r.completedNow, true);
  assert.equal(r.store.ad.completed, "2026-10-28");
  assert.deepEqual(Lb.progressOf(r.store, "ad"), { done: 5, total: 5, complete: true, completed: "2026-10-28" });
  assert.deepEqual(Lb.summary(r.store), { labs: 5, complete: 1, tasks: 5, totalTasks: 28 });
  assert.equal(Lb.progressOf(Lb.reset(r.store, "ad"), "ad").done, 0);
  // rubbish in the browser's storage is ignored
  assert.deepEqual(Lb.normalise({ ad: { done: ["find", "nope", 3] }, foo: { done: ["x"] }, linux: "x" }), { ad: { done: ["find"], day: null, completed: null } });
  assert.deepEqual(Lb.normalise(null), {});
});

/* ---------- profile and career */
test("profile: every desk is in one area and every desk and lab in one career step", () => {
  for (const sc of SCENARIOS) assert.ok(Lib.area(P.DESK_AREA[sc.id]), sc.id + " area");
  assert.equal(Object.keys(P.DESK_AREA).length, SCENARIOS.length);
  const desks = P.CAREER.flatMap((s) => s.desks);
  assert.deepEqual(desks.slice().sort(), SCENARIOS.map((s) => s.id).sort());
  assert.deepEqual(P.CAREER.flatMap((s) => s.labs).sort(), Lb.LABS.map((l) => l.id).sort());
  assert.deepEqual(P.CAREER.map((s) => s.id), ["l1", "l2", "sys", "netcloud"]);
  for (const s of P.CAREER) { assert.ok(both(s.title) && both(s.what), s.id); for (const a of s.areas) assert.ok(Lib.area(a), s.id + " " + a); }
  // level 1 desks belong to the first step
  for (const sc of SCENARIOS.filter((x) => x.level === 1)) assert.equal(P.CAREER.find((s) => s.desks.includes(sc.id)).id, "l1", sc.id);
});

const desks = SCENARIOS.map((s) => s.id);
const levels = Object.fromEntries(SCENARIOS.map((s) => [s.id, s.level]));
test("profile: progress per area from the results, the activity and the labs", () => {
  const empty = P.aggregate({ desks, progress: {}, activity: [], labs: {} });
  assert.equal(empty.totals.solved, 0);
  assert.equal(empty.totals.avgPoints, null);
  assert.ok(empty.areas.every((a) => a.skill === 0));
  const progress = { "ad-lockout": { points: 90, stars: 3, date: "2026-10-26" }, "aadc-sync": { points: 70, stars: 2, date: "2026-10-27" }, "net-err-disabled": { points: 100, stars: 3 } };
  const activity = [{ type: "ticket", id: "ad-lockout", userNote: 5 }, { type: "ticket", id: "ad-lockout", userNote: 3 }, { type: "ticket", id: "net-err-disabled", userNote: null }, { type: "mail", id: "x" }];
  const labs = Lb.record({}, "ad", ["find", "unlock", "reset", "group", "lastlogon"], "2026-10-26").store;
  const agg = P.aggregate({ desks, progress, activity, labs });
  const ad = agg.areas.find((a) => a.id === "ad");
  assert.deepEqual([ad.desks, ad.solved, ad.avgPoints, ad.comms, ad.labDone, ad.labTotal, ad.skill], [2, 2, 80, 4, 5, 5, 100]);
  const net = agg.areas.find((a) => a.id === "network");
  assert.deepEqual([net.desks, net.solved, net.avgPoints, net.comms, net.skill], [3, 1, 100, null, 25]);   // 1/3 × 75
  const vdi = agg.areas.find((a) => a.id === "vdi");
  assert.equal(vdi.labTotal, 0); assert.equal(vdi.skill, 0);
  assert.equal(agg.areas.find((a) => a.id === "itsm").skill, 80);   // notes to the user 4/5
  assert.deepEqual([agg.totals.solved, agg.totals.desks, agg.totals.avgPoints, agg.totals.comms, agg.totals.labsComplete, agg.totals.tasks], [3, 24, 87, 4, 1, 5]);
});

test("career: the current step and the recommended next step", () => {
  let c = P.career({ desks, levels, progress: {}, labs: {} });
  assert.equal(c.current, "l1");
  assert.deepEqual(c.next, { step: "l1", kind: "lab", id: "ad" }, "a new user starts with a lab");
  assert.ok(c.steps.every((s) => s.done === 0));
  c = P.career({ desks, levels, progress: { "ad-lockout": { points: 80 } }, labs: {} });
  assert.deepEqual(c.next, { step: "l1", kind: "desk", id: "dns-intranet" }, "then the step's unsolved tickets");
  const l1 = P.CAREER[0];
  const all = (ids) => Object.fromEntries(ids.map((d) => [d, { points: 90 }]));
  c = P.career({ desks, levels, progress: all(l1.desks), labs: {} });
  assert.deepEqual(c.next, { step: "l1", kind: "lab", id: "ad" }, "every ticket solved: the labs left");
  let labs = Lb.record({}, "ad", Lb.lab("ad").tasks.map((x) => x.id), "d").store;
  labs = Lb.record(labs, "windows", Lb.lab("windows").tasks.map((x) => x.id), "d").store;
  c = P.career({ desks, levels, progress: all(l1.desks), labs });
  assert.equal(c.steps[0].status, "done");
  assert.equal(c.current, "l2");
  assert.deepEqual(c.next, { step: "l2", kind: "lab", id: "m365" });
  assert.equal(c.steps[2].status, "later");
  for (const id of Lb.LABS.map((l) => l.id)) labs = Lb.record(labs, id, Lb.lab(id).tasks.map((x) => x.id), "d").store;
  c = P.career({ desks, levels, progress: all(desks), labs });
  assert.equal(c.current, null); assert.equal(c.next, null);
  assert.ok(c.steps.every((s) => s.status === "done" && s.pct === 100));
});

test("profile: the radar geometry", () => {
  const r = P.radar([100, 0, 50, 25], 200);
  assert.equal(r.center, 100);
  assert.equal(r.axes.length, 4);
  assert.deepEqual(r.axes[0].end, [100, 100 - r.radius]);           // the first axis points up
  assert.deepEqual(r.axes[1].end, [100 + r.radius, 100]);           // clockwise
  const pts = r.shape.split(" ").map((p) => p.split(",").map(Number));
  assert.deepEqual(pts[0], [100, 100 - r.radius]);
  assert.ok(Math.abs(pts[2][1] - (100 + r.radius / 2)) < 0.11);
  assert.equal(r.rings.length, 4);
  assert.ok(P.radar([150, -3]).shape.split(" ").every((p) => p.split(",").every((n) => Number.isFinite(Number(n)))));
});

test("profile: the Markdown summary says it is practice in a simulator", () => {
  const progress = { "ad-lockout": { points: 90, stars: 3, date: "2026-10-26" } };
  const labs = Lb.record({}, "network", ["mac"], "2026-10-26").store;
  const input = { desks, levels, progress, activity: [{ type: "ticket", id: "ad-lockout", userNote: 5 }], labs };
  const title = (id) => Lib.t(SCENARIOS.find((s) => s.id === id).title, "es");
  const es = P.toMarkdown(input, { lang: "es", name: "Alex", date: "2026-10-30", deskTitle: title, labTitle: (id) => Lib.t(Lb.lab(id).title, "es") });
  assert.ok(es.startsWith("# SysAdmin Desks · Resumen de práctica"));
  assert.ok(es.includes("**Práctica en un simulador, no experiencia laboral.**"));
  assert.ok(es.trim().endsWith("Práctica en un simulador, no experiencia laboral."));
  assert.ok(es.includes("- Técnico: Alex") && es.includes("- Fecha: 2026-10-30"));
  assert.ok(es.includes("- Tickets resueltos: 1 / 24") && es.includes("| Active Directory | 1 / 2 | 90 | 5 / 5 | 0 / 5 | 38 / 100 |"));
  assert.ok(es.includes(`- ${title("ad-lockout")}: 90 / 100 · 2026-10-26`));
  assert.ok(es.includes("- Laboratorio de red: 1 / 5"));
  assert.ok(es.includes("**Siguiente paso recomendado:** " + title("dns-intranet") + " (ticket)"));
  const en = P.toMarkdown(input, { lang: "en", date: "2026-10-30" });
  assert.ok(en.includes("**Practice in a simulator, not work experience.**") && en.includes("## By area") && !en.includes("Technician:"));
  assert.equal(P.fileName("2026-10-30"), "sysadmin-desks-practice-2026-10-30.md");
});

test("engine: {$n} in a rule's output is the group its match captured", () => {
  const sc = { machine: { prompt: "> " }, state: {}, goal: { x: true }, commands: [{ match: /^echo (\w+) (\w+)$/, out: ["{$2} {$1}"], say: { en: "said {$1}" } }] };
  const s = E.createSession(sc, "en");
  assert.deepEqual(E.run(s, "echo Hello World").lines.map((l) => l.text), ["World Hello", "said Hello"]);
});
