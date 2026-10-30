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
    assert.ok(W.computer(u.device), `${u.sam}: device ${u.device}`);
  }
  W.GROUPS.forEach((g) => assert.ok(g.desc.en && g.desc.es && ous.has(g.ou), g.name));
  W.COMPUTERS.forEach((c) => assert.ok(ous.has(c.ou) && (!c.user || sams.has(c.user)), c.name));
  W.SERVERS.forEach((s) => assert.ok(s.role.en && s.role.es && s.location.es && s.owner.es && /^10\.20\./.test(s.ip), s.id));
  W.PRINTERS.forEach((p) => assert.ok(p.model.es && p.location.es && W.SERVERS.some((s) => s.id === p.queue), p.id));
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
  assert.deepEqual(SCENARIOS.filter((s) => s.desktop).map((s) => s.id).sort(), ["disk-full", "dns-intranet", "intune-bitlocker"]);
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
