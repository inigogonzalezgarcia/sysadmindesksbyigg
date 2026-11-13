// The shared world (v0.3): the directory and its PowerShell, the inventory, what the tickets say about them, and the desktops.
const test = require("node:test");
const assert = require("node:assert/strict");
const W = require("../public/assets/world.js");
const E = require("../public/assets/engine.js");
const SCENARIOS = require("../public/assets/scenarios.js");

const byId = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));
const run = (w, cmd, lang = "en") => W.run(w, cmd, lang);
function play(sc, cmds, lang = "en") {
  const sess = E.createSession(sc, lang);
  cmds.forEach((c) => E.run(sess, c));
  return sess;
}

test("the directory data hangs together", () => {
  const ous = new Set(W.OUS.map((o) => o.id));
  W.OUS.forEach((o) => assert.ok(o.parent === null || ous.has(o.parent), "OU parent " + o.id));
  const sams = new Set();
  for (const u of W.USERS) {
    assert.ok(!sams.has(u.sam), "duplicate " + u.sam);
    sams.add(u.sam);
    assert.ok(ous.has(u.ou), u.sam + " OU");
    assert.ok(u.title.en && u.title.es, u.sam + " title");
    u.groups.forEach((g) => assert.ok(W.group(g), `${u.sam}: group ${g}`));
    if (u.enabled !== false) assert.ok(W.computer(u.device), `${u.sam}: device ${u.device}`);   // a leaver's account has no device
  }
  W.GROUPS.forEach((g) => assert.ok(g.desc.en && g.desc.es && ous.has(g.ou), g.name));
  W.COMPUTERS.forEach((c) => assert.ok(ous.has(c.ou) && (!c.user || sams.has(c.user)), c.name));
  // servers in the head office ranges (10.20.x.x), Azure (10.70.x.x) or AWS (10.120.x.x)
  W.SERVERS.forEach((s) => assert.ok(s.role.en && s.role.es && s.location.es && s.owner.es && /^10\.(20|70|120)\./.test(s.ip), s.id));
  W.PRINTERS.forEach((p) => assert.ok(p.model.es && p.location.es && (p.queue === null || W.SERVERS.some((s) => s.id === p.queue)), p.id));
  W.DEVICES.forEach((d) => assert.ok(d.kind && d.model && d.location.en && d.location.es, d.id));
  assert.equal(W.ouPath("finance"), "OU=Finance,OU=Users,DC=contoso,DC=local");
  assert.deepEqual(W.tasks(W.createWorld(), "es").map((x) => x.done), [false, false, false, false]);
});

test("every button runs the same command you can type, with the same result", () => {
  const pairs = [
    [W.CMD.unlock("eromero"), "Unlock-ADAccount eromero"],
    [W.CMD.reset("dlopez"), "set-adaccountpassword dlopez -reset"],
    [W.CMD.mustChange("dlopez", true), "Set-ADUser dlopez -ChangePasswordAtLogon:$true"],
    [W.CMD.disable("lnavarro"), "Disable-ADAccount -Identity 'lnavarro'"],
    [W.CMD.enable("lnavarro"), "Enable-ADAccount lnavarro"],
    [W.CMD.addGroup("psanchez", "GG-VPN-Users"), "Add-ADGroupMember GG-VPN-Users -Members psanchez"],
    [W.CMD.removeGroup("lnavarro", "GG-Finance"), "Remove-ADGroupMember -Identity \"GG-Finance\" -Members lnavarro -Confirm:$false"],
  ];
  for (const [button, typed] of pairs) {
    const a = W.createWorld();
    const b = W.createWorld();
    const ra = run(a, button);
    const rb = run(b, typed);
    assert.ok(ra.changed && rb.changed, button);
    assert.deepEqual(W.snapshot(a), W.snapshot(b), button + " vs " + typed);
    assert.ok(!ra.lines.some((l) => l.kind === "err"), button);
  }
});

test("the four directory requests can be done from PowerShell", () => {
  const w = W.createWorld();
  ["Search-ADAccount -LockedOut", "Unlock-ADAccount eromero", "Add-ADGroupMember -Identity GG-VPN-Users -Members psanchez",
    "Set-ADAccountPassword -Identity dlopez -Reset", "Set-ADUser -Identity dlopez -ChangePasswordAtLogon $true",
    "Disable-ADAccount lnavarro", "Remove-ADGroupMember -Identity GG-Finance -Members lnavarro -Confirm:$false"].forEach((c) => run(w, c));
  assert.deepEqual(W.tasks(w, "en").map((x) => x.done), [true, true, true, true]);
  assert.equal(W.view(w, "dlopez").pwdLastSet, "26/10/2026 09:40");
  // the saved copy brings the same state back, and ignores what it does not know
  const back = W.restore(W.snapshot(w).concat([{ sam: "nobody" }, { sam: "eromero", groups: ["GG-Imaginary", "GG-Marketing"] }]));
  assert.deepEqual(W.tasks(back, "en").map((x) => x.done), [true, true, true, true]);
  assert.deepEqual(W.user(back, "eromero").groups, ["GG-Marketing"]);
});

test("the directory answers mistakes like PowerShell does, and changes nothing", () => {
  const w = W.createWorld();
  const before = JSON.stringify(W.snapshot(w));
  assert.match(run(w, "Get-ADUser jperez").lines[0].text, /Cannot find an object with identity: 'jperez'/);
  assert.match(run(w, "Add-ADGroupMember GG-Nope -Members psanchez").lines[0].text, /Cannot find an object with identity: 'GG-Nope'/);
  const noReset = run(w, "Set-ADAccountPassword dlopez", "es");
  assert.equal(noReset.lines[0].kind, "err");
  assert.match(noReset.lines[1].text, /-Reset/);
  assert.match(run(w, "Get-ADUser -Filter {Enabled -eq $false}").lines[0].text, /Error parsing query/);
  assert.equal(run(w, "Add-ADGroupMember GG-Sales -Members psanchez", "es").lines[1].text, "(Ya es miembro: no hay nada que hacer.)");
  assert.match(run(w, "Get-Coffee -Strong").lines[0].text, /not recognized/);
  assert.equal(JSON.stringify(W.snapshot(w)), before);
  const list = run(w, "Get-ADUser -Filter * -SearchBase \"OU=Users,DC=contoso,DC=local\"").lines.map((l) => l.text).join("\n");
  assert.match(list, /mgarcia/);
  assert.doesNotMatch(list, /svc-scan|recepcion/, "only the users under that OU");
  assert.ok(run(w, "help", "es").lines.length > 5);
});

test("tickets show up in the directory and the inventory, and the directory can hand a command to the ticket", () => {
  const kinds = { user: (id) => W.user(W.createWorld(), id), server: (id) => W.SERVERS.find((s) => s.id === id), printer: (id) => W.PRINTERS.find((p) => p.id === id),
    network: (id) => require("../public/assets/netcli.js").createNet().devices[id] };   // v0.7a: switches, the router and the firewall
  for (const sc of SCENARIOS) {
    const keys = new Set(Object.keys(sc.state));
    for (const b of sc.bind || []) {
      assert.ok(kinds[b.kind] && kinds[b.kind](b.id), `${sc.id}: ${b.kind} ${b.id} exists in the world`);
      assert.ok(!b.states[b.states.length - 1].when, sc.id + ": last bind state is the default");
      b.states.forEach((st) => { Object.keys(st.when || {}).forEach((k) => assert.ok(keys.has(k), `${sc.id}: bind key ${k}`)); if (st.note) assert.ok(st.note.en && st.note.es); });
    }
  }
  const ad = byId["ad-lockout"];
  assert.deepEqual(E.bound(E.createSession(ad, "en"))[0], { kind: "user", id: "mgarcia", set: { locked: true, badPwd: 5 }, note: "" });
  assert.equal(E.bound(play(ad, ad.solution))[0].set.locked, false);
  const found = E.bound(play(ad, ad.solution.slice(0, 3), "es"))[1];
  assert.equal(found.set.status, "warn");
  assert.match(found.note, /ScanToFinance/);
  const pq = byId["print-queue"];
  assert.equal(E.bound(E.createSession(pq, "en"))[0].set.status, "bad");
  assert.equal(E.bound(play(pq, pq.solution))[0].set.status, "ok");

  // the directory shows the open ticket's state, and an unlock typed in the directory goes to the ticket (and falls into its trap)
  const sess = E.createSession(ad, "en");
  const w = W.createWorld();
  const route = (cmd, p) => (p.id && p.id.toLowerCase() === "mgarcia" && E.matches(sess, cmd) ? E.run(sess, cmd) : null);
  w.overlay.mgarcia = E.bound(sess)[0].set;
  assert.equal(W.view(w, "mgarcia").locked, true);
  assert.match(W.run(w, "Search-ADAccount -LockedOut", "en").lines.map((l) => l.text).join(" "), /mgarcia/);
  W.run(w, W.CMD.unlock("mgarcia"), "en", route);
  assert.equal(sess.state.relock, true, "the ticket's trap: the cause is still there");
  assert.equal(W.user(w, "mgarcia").locked, false, "the directory's own copy was not touched");
  assert.equal(E.matches(sess, "Add-ADGroupMember GG-Finance -Members mgarcia"), null, "commands the ticket does not know stay in the directory");
});

test("every desktop app and action is understood whenever it is offered, and the desktop shows the fix", () => {
  for (const sc of SCENARIOS.filter((s) => s.desktop)) {
    const keys = new Set(Object.keys(sc.state));
    for (const a of sc.desktop.apps) {
      assert.ok(a.title.en && a.title.es, `${sc.id}/${a.id} title`);
      for (const x of a.actions || []) { assert.ok(x.label.en && x.label.es && x.cmd); Object.keys(x.when || {}).forEach((k) => assert.ok(keys.has(k), `${sc.id}/${a.id}/${x.id}: ${k}`)); }
      for (const f of a.fields || []) for (const st of f.states || []) Object.keys(st.when || {}).forEach((k) => assert.ok(keys.has(k), `${sc.id}/${a.id}: ${k}`));
    }
    (sc.desktop.log || []).forEach((e) => { assert.ok(e.text.en && e.text.es && e.source && e.id, sc.id + " log"); Object.keys(e.when || {}).forEach((k) => assert.ok(keys.has(k))); });
    for (let i = 0; i <= sc.solution.length; i++) {
      const d = E.desktop(play(sc, sc.solution.slice(0, i)));
      for (const app of d.apps) {
        if (app.look) { const s = play(sc, sc.solution.slice(0, i)); E.deskOpen(s, app.id); assert.equal(s.unknown, 0, `${sc.id}/${app.id} look after step ${i}`); }
        for (const x of app.actions.filter((y) => y.enabled)) {
          const s = play(sc, sc.solution.slice(0, i));
          const r = E.deskAct(s, app.id, x.id);
          assert.equal(s.unknown, 0, `${sc.id}/${app.id}/${x.id} after step ${i}`);
          assert.equal(r.command, x.cmd);
        }
      }
    }
    for (const lang of ["en", "es"]) {
      const start = E.desktop(E.createSession(sc, lang));
      const end = E.desktop(play(sc, sc.solution, lang));
      assert.ok(start.apps.some((a) => a.fields.some((f) => f.tone === "bad") || (a.page && a.page.tone === "bad")), sc.id + " shows the problem");
      assert.ok(!end.apps.some((a) => a.fields.some((f) => f.tone === "bad") || (a.page && a.page.tone === "bad")), sc.id + " shows the fix");
      assert.ok(start.log.length || start.logNote, sc.id + " event log or a note");
    }
  }
  assert.deepEqual(SCENARIOS.filter((s) => s.desktop).map((s) => s.id).sort(), ["anyconnect-hotel", "disk-full", "dns-intranet", "epm-elevation", "gpo-drive-missing", "intune-bitlocker", "store-label-printer", "teams-no-audio", "usb-blocked-camera", "win-temp-profile", "win-update-rollback"]);
});

test("the desktop falls into the same traps as the console", () => {
  // emptying the update cache while Windows Update runs fails, from the Storage app too
  const disk = E.createSession(byId["disk-full"], "en");
  const r = E.deskAct(disk, "storage", "wu-cache");
  assert.equal(r.lines[0].kind, "err");
  assert.equal(disk.state.wuClean, false);
  E.deskAct(disk, "services", "stop");
  E.deskAct(disk, "storage", "wu-cache");
  assert.equal(disk.state.wuClean, true);
  assert.equal(E.desktop(disk).apps[1].actions.find((a) => a.id === "start").enabled, true, "and Windows Update has to be started again");
  // DNS back to automatic is not enough until the cache is flushed: the browser still fails
  const dns = E.createSession(byId["dns-intranet"], "es");
  E.deskAct(dns, "network", "dns-auto");
  E.deskOpen(dns, "browser");
  assert.equal(E.desktop(dns).apps[1].page.tone, "bad");
  E.run(dns, "ipconfig /flushdns");
  E.deskAct(dns, "browser", "reload");
  assert.equal(E.desktop(dns).apps[1].page.title, "Intranet de Contoso");
  assert.equal(E.desktop(dns).log.length, 3);
  // BitLocker turned on without a recovery password cannot be backed up to Entra ID
  const bl = E.createSession(byId["intune-bitlocker"], "en");
  E.run(bl, "manage-bde -on C:");
  assert.equal(E.deskAct(bl, "bitlocker", "backup").lines[0].kind, "err");
  E.deskAct(bl, "bitlocker", "add-rp");
  E.deskAct(bl, "bitlocker", "backup");
  assert.equal(bl.state.escrowed, true);
  assert.equal(E.desktop(bl).log[0].id, 845);
});

/* v0.18: Contoso is one coherent company. Every host with a Contoso-style name that a ticket, a document, a console, a card or a case
   file mentions, every requester's account and device, every machine a desk runs on, and every named person in the requesters, the
   contacts and the case files exists in the world (world.js; the network room's devices in netcli.js and the asset register in
   shipping.js count too, since the inventory shows them). What is mentioned but must NOT be in the world is listed here, with why. */
const NOT_IN_WORLD = {
  "ERPWEB01": "retired: replaced by ERPWEB02 in CHG-4471 (net-fortigate-branch)",
  "FS02": "retired: replaced by FS-NEW01 in October (confluence-runbook-stale)",
  "FS-OLD01": "retired: the old backup share that no longer exists, the cause of sql-log-full",
  "RPT-WIN01": "retired: replaced by RPT-WIN02 in CHG-4447",
  "PRT-SRV00": "retired: the old print server switched off on 10/11 (sap-printer-sap)",
  "FS-ZAR01": "the clustered file server role of CL-ZAR-FS (nodes ZAR-FSN01 and ZAR-FSN02), not a machine",
  "CALL-W11": "the Horizon pool's name (its desktops CALL-W11-01 to 30 are in the world)",
  "SW-DESK-214": "the unmanaged switch someone plugged in under a desk: the cause of net-err-disabled",
  "SQL-ERP02": "proposed by an option of the dr-erp-rto case, not built",
  "VMH-ZAR01": "proposed by an option of the dr-erp-rto case, not built",
  "ZAR-DMZ01": "proposed by an option of the ot-integration case, not built",
  "PC-SAL-03": "the clinic's paper contingency procedure, not a PC",
  "FIN-07": "a Finance policy number, not a host",
  "IDRAC-VMH01": "the iDRAC of VMH-01 (10.20.99.41, in its role)",
  "IDRAC-VMH02": "the iDRAC of VMH-02 (10.20.99.42, in its role)",
  "NTNX-HTL-N1-CVM": "the controller VM of NTNX-HTL-N1",
  "ERP-SA-2026-09": "the ERP vendor's security advisory in risky-change-close, not a host",
};

test("every Contoso host and named person in the tickets exists in the world", () => {
  const N = require("../public/assets/netcli.js");
  const SH = require("../public/assets/shipping.js");
  const known = W.names();
  Object.keys(N.createNet().devices).forEach((d) => known.add(d.toLowerCase()));
  SH.ASSETS.forEach((a) => known.add(a.id.toLowerCase()));
  const ok = (name) => known.has(String(name).toLowerCase()) || Object.prototype.hasOwnProperty.call(NOT_IN_WORLD, String(name).toUpperCase());
  // a Contoso host name: UPPER-CASE segments joined by hyphens ending in 2-4 digits (or LETTERS plus 2-3 digits), whose first
  // segment is a prefix the world uses (PC-, LAPTOP-, SW-, ZAR-, ORA-, VMH-, DC…), so model numbers and ticket ids are left out
  const prefix = (x) => x.split("-")[0].replace(/\d+$/, "");
  const PREFIXES = new Set([].concat(W.SERVERS.map((s) => s.id), W.PRINTERS.map((p) => p.id), W.DEVICES.map((d) => d.id),
    ...W.COMPUTERS.map((c) => [c.name].concat(c.also || []))).map(prefix));
  const HOST = /(?<![\w.\/\\@-])([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*)(?![\w-])/g;
  const missing = [];
  const walk = (v, id) => {
    if (typeof v === "string") {
      for (const m of v.matchAll(HOST)) {
        const h = m[1];
        if (!/\d{2,4}$/.test(h) || (!h.includes("-") && !/^[A-Z]{2,}\d{2,3}$/.test(h)) || !PREFIXES.has(prefix(h))) continue;
        if (!ok(h)) missing.push(`${id}: host ${h}`);
      }
    } else if (Array.isArray(v)) v.forEach((x) => walk(x, id));
    else if (v && typeof v === "object" && !(v instanceof RegExp)) Object.values(v).forEach((x) => walk(x, id));
  };
  const userNames = new Set(W.USERS.map((u) => u.name));
  const contactNames = new Set(W.CONTACTS.map((c) => c.name));
  for (const sc of SCENARIOS) {
    walk(sc, sc.id);
    if (sc.machine.shell !== "case" && sc.machine.host !== "cloudshell" && !ok(sc.machine.host)) missing.push(`${sc.id}: machine ${sc.machine.host}`);
    const r = sc.requester;
    if (r.device && !ok(r.device)) missing.push(`${sc.id}: requester's device ${r.device}`);
    const u = r.user && W.USERS.find((x) => x.sam === r.user);
    if (!u) missing.push(`${sc.id}: requester's account ${r.user}`);
    else if (typeof r.name === "string" && r.name !== u.name) missing.push(`${sc.id}: requester ${r.name} is ${u.name} in the directory`);
    if (sc.contact && sc.contact.who && !userNames.has(sc.contact.who.name)) missing.push(`${sc.id}: contact ${sc.contact.who.name}`);
    for (const p of (sc.case && sc.case.people) || []) {
      if (!userNames.has(p.name.replace(/^Dra?\.\s+/, "")) && !contactNames.has(p.name)) missing.push(`${sc.id}: case person ${p.name}`);
    }
  }
  assert.deepEqual(missing, [], "declare these in world.js (or explain them in NOT_IN_WORLD)");
  // the exceptions are still needed, and none of them is declared after all
  for (const name of Object.keys(NOT_IN_WORLD)) {
    assert.ok(!known.has(name.toLowerCase()), name + " is in the world: drop it from NOT_IN_WORLD");
    assert.ok(SCENARIOS.some((sc) => JSON.stringify(sc).toUpperCase().includes(name) || sc.machine.host.toUpperCase() === name), name + " is no longer mentioned");
  }
});

test("Contoso is a group of divisions, and everything in the world says its division", () => {
  const ids = W.COMPANY.divisions.map((d) => d.id);
  assert.deepEqual(ids, ["hospitality", "retail", "health", "markets", "corporate"]);
  for (const d of W.COMPANY.divisions) {
    assert.ok(d.name.en && d.name.es && d.what.en && d.what.es && d.sites.length, d.id);
    d.sites.forEach((s) => assert.ok(W.SITES.some((x) => x.id === s), `${d.id}: site ${s}`));
  }
  W.SITES.forEach((s) => assert.ok(ids.includes(s.division) && W.COMPANY.divisions.find((d) => d.id === s.division).sites.includes(s.id), s.id));
  [].concat(W.USERS, W.COMPUTERS, W.SERVERS, W.PRINTERS, W.DEVICES).forEach((x) => assert.ok(ids.includes(x.division), (x.sam || x.name || x.id) + " division"));
  // every id the division lists name exists (a typo would quietly leave it in corporate services)
  const known = W.names();
  Object.values(W.IN_DIVISION).flat().forEach((id) => assert.ok(known.has(id.toLowerCase()), "division list: " + id));
  assert.equal(W.divisionOf("rlarrea"), "markets");
  assert.equal(W.divisionOf("PMS-HTL01"), "hospitality");
  assert.equal(W.divisionOf("ORA-CLN01"), "health");
  assert.equal(W.divisionOf("TPV-T03-01"), "retail");
  assert.equal(W.divisionOf("DC01"), "corporate");
  // each division has people and machines
  for (const d of ids) assert.ok(W.USERS.some((u) => u.division === d) && W.SERVERS.concat(W.COMPUTERS).some((x) => x.division === d), d);
  // v0.19: the suppliers say their division too, and every contract a ticket names (CT-…) is declared with its supplier and division
  W.CONTACTS.forEach((c) => assert.ok(ids.includes(c.division) && c.role.en && c.role.es, c.id + " division"));
  const contracts = new Set(W.CONTRACTS.map((c) => c.id));
  W.CONTRACTS.forEach((c) => assert.ok(ids.includes(c.division) && W.CONTACTS.some((x) => x.id === c.supplier) && c.what.en && c.what.es && /^\d{2}\/\d{2}\/\d{4}$/.test(c.ends), c.id));
  const named = new Set();
  for (const sc of SCENARIOS) for (const m of JSON.stringify(sc).matchAll(/\bCT-[A-Z]+-\d{4}\b/g)) named.add(m[0]);
  named.forEach((id) => assert.ok(contracts.has(id), "contract " + id + " is not in world.js"));
  assert.deepEqual([...named].sort(), [...contracts].sort(), "every declared contract is used by a ticket");
  // v0.20: the same for the project portfolio (PRJ-…): declared with its division and a sponsor from the directory, and used by a ticket
  const projects = new Set(W.PROJECTS.map((p) => p.id));
  W.PROJECTS.forEach((p) => assert.ok(ids.includes(p.division) && W.USERS.some((u) => u.sam === p.sponsor) && p.name.en && p.name.es && /^PRJ-\d{3}$/.test(p.id), p.id));
  const named2 = new Set();
  for (const sc of SCENARIOS) for (const m of JSON.stringify(sc).matchAll(/\bPRJ-\d{3}\b/g)) named2.add(m[0]);
  assert.deepEqual([...named2].sort(), [...projects].sort(), "every project a ticket names is declared, and every declared one is used");
  // no two things share an address (the network room's devices included)
  const N = require("../public/assets/netcli.js");
  const seen = {};
  const add = (ip, who) => { if (!ip) return; assert.ok(!seen[ip], `${ip}: ${who} and ${seen[ip]}`); seen[ip] = who; };
  W.SERVERS.forEach((s) => add(s.ip, s.id));
  W.PRINTERS.forEach((p) => add(p.ip, p.id));
  W.DEVICES.forEach((d) => add(d.ip, d.id));
  Object.values(N.createNet().devices).forEach((d) => add(d.mgmt, d.id));
});

