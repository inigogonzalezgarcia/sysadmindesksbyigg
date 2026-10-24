// Runs with: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("../public/assets/engine.js");
const SCENARIOS = require("../public/assets/scenarios.js");

const byId = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

function play(sc, cmds, lang = "en") {
  const sess = E.createSession(sc, lang);
  const results = cmds.map((c) => E.run(sess, c));
  return { sess, results, text: results.flatMap((r) => r.lines.map((l) => l.text)).join("\n") };
}

test("every scenario is complete in English and Spanish", () => {
  const ids = new Set();
  for (const sc of SCENARIOS) {
    assert.ok(!ids.has(sc.id), "duplicate id " + sc.id);
    ids.add(sc.id);
    for (const key of ["title", "topic", "intro", "resolved"]) {
      assert.ok(sc[key].en && sc[key].es, `${sc.id}.${key} needs en and es`);
    }
    assert.ok(sc.ticket.subject.en && sc.ticket.subject.es && sc.ticket.body.en && sc.ticket.body.es, sc.id + " ticket");
    assert.ok(sc.hints.length >= 3 && sc.hints.every((h) => h.en && h.es), sc.id + " hints");
    assert.ok(sc.note.length >= 3 && sc.note.every((n) => n.label.en && n.label.es && n.any.length), sc.id + " note");
    assert.ok(/^https:\/\/inigogonzalezgarcia\.github\.io\/guias\/.+\.html$/.test(sc.guide), sc.id + " guide link");
    const keys = new Set(Object.keys(sc.state));
    for (const k of Object.keys(sc.goal)) assert.ok(keys.has(k), `${sc.id}: goal key ${k} not in state`);
    for (const st of sc.stages) for (const k of Object.keys(st.when)) assert.ok(keys.has(k), `${sc.id}: stage key ${k} not in state`);
    for (const r of sc.commands) {
      assert.ok(r.match instanceof RegExp || typeof r.match === "string", `${sc.id}/${r.id} match`);
      for (const k of Object.keys(Object.assign({}, r.when, r.unless, r.set))) assert.ok(keys.has(k), `${sc.id}/${r.id}: key ${k} not in state`);
      if (r.say && typeof r.say !== "string") assert.ok(r.say.en && r.say.es, `${sc.id}/${r.id} say needs en and es`);
    }
  }
  assert.equal(SCENARIOS.length, 6);
});

test("the reference solution resolves every scenario, in both languages, and the sample note scores 100", () => {
  for (const sc of SCENARIOS) {
    for (const lang of ["en", "es"]) {
      const { sess, results } = play(sc, sc.solution, lang);
      assert.ok(sess.resolved, `${sc.id} (${lang}) not resolved; state ${JSON.stringify(sess.state)}`);
      assert.equal(results.filter((r) => r.resolvedNow).length, 1, sc.id + " resolves once");
      assert.equal(sess.resolvedAt, sc.solution.length, sc.id + ": resolved only at the last step of the solution");
      assert.ok(E.stages(sess).every((s) => s.done), sc.id + " all stages done");
      assert.equal(sess.unknown, 0, sc.id + " solution uses only known commands");
      assert.ok(sc.sampleNote.en && sc.sampleNote.es, sc.id + " sample note in both languages");
      const note = E.checkNote(sc, sc.sampleNote[lang], lang);
      assert.deepEqual(note.missing, [], `${sc.id} sample note misses ${note.missing}`);
      assert.deepEqual(E.score(sess, note), { points: 100, stars: 3 });
    }
  }
});

test("built-ins: help, hints, clear, ticket and unknown commands", () => {
  const sc = byId["dns-intranet"];
  const sess = E.createSession(sc, "es");
  assert.match(E.run(sess, "help").lines[0].text, /simulación guiada/);
  assert.match(E.run(sess, "hint").lines[0].text, /^Pista 1\/4: /);
  assert.equal(sess.hints, 1);
  assert.ok(E.run(sess, "cls").clear);
  assert.ok(E.run(sess, "TICKET").ticket);
  const r = E.run(sess, "Get-Coffee -Strong");
  assert.equal(r.lines[0].kind, "err");
  assert.match(r.lines[0].text, /The term 'Get-Coffee' is not recognized/);
  for (let i = 0; i < 5; i++) E.run(sess, "hint");
  assert.equal(sess.hints, 4, "hints stop at the last one");
  assert.deepEqual(E.score(sess, null), { points: 60, stars: 1 });
});

test("scoring and work notes", () => {
  const sc = byId["print-queue"];
  const sess = E.createSession(sc, "en");
  ["foo", "bar", "baz", "qux", "quux"].forEach((c) => E.run(sess, c));
  assert.equal(sess.unknown, 5);
  const weak = E.checkNote(sc, "Fixed the printer.", "en");
  assert.equal(weak.missing.length, 4);
  assert.deepEqual(E.score(sess, weak), { points: 46, stars: 1 });     // 100 - 4 (unknown) - 40 (missing) - 10 (short)
  const es = E.checkNote(sc, "Trabajo 312 atascado en 'Eliminando'. Paré el spooler (todas las colas paradas un minuto), borré la cola y salió la página de prueba.", "es");
  assert.deepEqual(es.missing, []);
});

test("AD lockout: unlocking before removing the cause locks the account again", () => {
  const sc = byId["ad-lockout"];
  const { sess, text } = play(sc, ["Unlock-ADAccount mgarcia", "Get-ADUser mgarcia -Properties LockedOut"]);
  assert.match(text, /locked again/);
  assert.match(text, /LockedOut\s+: True/);
  assert.equal(sess.resolved, false);
});

test("DNS: after fixing the servers, the name fails until the cache is flushed", () => {
  const sc = byId["dns-intranet"];
  const { sess, text } = play(sc, ["Set-DnsClientServerAddress -InterfaceAlias Ethernet -ResetServerAddresses", "ping intranet.contoso.local"]);
  assert.match(text, /could not find host/);
  assert.equal(sess.resolved, false);
  E.run(sess, "Clear-DnsClientCache");
  E.run(sess, "Test-NetConnection intranet.contoso.local -Port 443");
  assert.ok(sess.resolved);
});

test("Disk: the update cache cannot be deleted while Windows Update runs, and the service must be left running", () => {
  const sc = byId["disk-full"];
  const { sess, results } = play(sc, ["Remove-Item C:\\Windows\\SoftwareDistribution\\Download\\* -Recurse -Force"]);
  assert.equal(results[0].lines[0].kind, "err");
  ["del /s /q %TEMP%\\*", "net stop wuauserv", "Remove-Item C:\\Windows\\SoftwareDistribution\\Download\\* -Recurse", "Get-PSDrive C"].forEach((c) => E.run(sess, c));
  assert.equal(sess.resolved, false, "not resolved with Windows Update stopped");
  E.run(sess, "net start wuauserv");
  assert.ok(sess.resolved);
});

test("Printer: spool files are locked while the spooler runs; restarting alone does not help", () => {
  const sc = byId["print-queue"];
  const { sess, results, text } = play(sc, ["Restart-Service Spooler", "Remove-Item C:\\Windows\\System32\\spool\\PRINTERS\\*"]);
  assert.match(text, /loaded job 312 again/);
  assert.equal(results[1].lines[0].kind, "err");
  E.run(sess, "Stop-Service Spooler -Force");
  assert.equal(E.run(sess, "Get-Printer").lines[0].kind, "err");
  E.run(sess, "Remove-Item C:\\Windows\\System32\\spool\\PRINTERS\\* -Force");
  E.run(sess, "Start-Service Spooler");
  E.run(sess, '"Test" | Out-Printer -Name RECEPCION-MFP');
  assert.ok(sess.resolved);
});

test("Mailbox: cmdlets need a connection, the quota cannot be raised, and the archive alone is not enough", () => {
  const sc = byId["mailbox-full"];
  const { sess, results } = play(sc, ["Get-EXOMailboxStatistics cmartin", "Connect-ExchangeOnline -UserPrincipalName it.admin@contoso.com",
    "Set-Mailbox cmartin -ProhibitSendReceiveQuota 100GB", "Enable-Mailbox cmartin -Archive", "Get-EXOMailboxStatistics cmartin"]);
  assert.match(results[0].lines[0].text, /Connect-ExchangeOnline/);
  assert.match(results[2].lines[0].text, /maximum allowed/);
  assert.match(results[4].lines.map((l) => l.text).join(" "), /49\.98 GB/);
  assert.equal(sess.resolved, false);
  E.run(sess, "Start-ManagedFolderAssistant -Identity cmartin");
  E.run(sess, "Get-EXOMailboxStatistics cmartin");
  assert.ok(sess.resolved);
});

test("Intune: a TPM-only protector cannot be escrowed until a recovery password is added", () => {
  const sc = byId["intune-bitlocker"];
  const { sess, results } = play(sc, ["manage-bde -on C:", "BackupToAAD-BitLockerKeyProtector -MountPoint C: -KeyProtectorId x"]);
  assert.equal(results[1].lines[0].kind, "err");
  ["manage-bde -protectors -add C: -RecoveryPassword", "BackupToAAD-BitLockerKeyProtector -MountPoint C: -KeyProtectorId y",
   "Start-ScheduledTask -TaskName PushLaunch", "Get-MgDeviceManagementManagedDevice -Filter \"deviceName eq 'LAPTOP-0388'\""].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});
