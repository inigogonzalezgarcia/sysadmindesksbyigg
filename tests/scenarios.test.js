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
      // v0.7a: network desks also have rules that react to what a device did (`on`, a pattern for the device's tags)
      assert.ok(r.match instanceof RegExp || typeof r.match === "string" || ((sc.net || sc.ship) && r.on instanceof RegExp), `${sc.id}/${r.id} match`);
      for (const k of Object.keys(Object.assign({}, r.when, r.unless, r.set))) assert.ok(keys.has(k), `${sc.id}/${r.id}: key ${k} not in state`);
      if (r.say && typeof r.say !== "string") assert.ok(r.say.en && r.say.es, `${sc.id}/${r.id} say needs en and es`);
    }
  }
  assert.equal(SCENARIOS.length, 157);
});

test("every scenario has a career level (levels.js) from 0 to 10, and the level-0 queue is first line only", () => {
  for (const sc of SCENARIOS) {
    assert.ok(Number.isInteger(sc.career) && sc.career >= 0 && sc.career <= 10, `${sc.id}: career ${sc.career}`);
    assert.ok(sc.level === 1 || sc.level === 2, sc.id + " level");
  }
  const zero = SCENARIOS.filter((s) => s.career === 0);
  assert.ok(zero.length >= 4 && zero.every((s) => s.level === 1), "level 0 has first-line tickets to start with");
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

test("VPN: reinstalling the client does not help; the clock must be right before the tunnel and the domain time can sync", () => {
  const sc = byId["vpn-anyconnect"];
  const vpn = '& "C:\\Program Files (x86)\\Cisco\\Cisco Secure Client\\vpncli.exe" connect vpn.contoso.com';
  const { sess, text } = play(sc, ["msiexec /fa C:\\Temp\\cisco-secure-client-win-5.1.6.103-core-vpn-predeploy-k9.msi /qn", vpn, "w32tm /resync"]);
  assert.match(text, /Certificate Validation Failure[\s\S]*Certificate Validation Failure/);
  assert.match(text, /no time data was available/);
  assert.equal(sess.resolved, false);
  ["Set-Date -Date '28/10/2026 09:44'", vpn, "w32tm /resync"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("M365 licence: a direct licence needs a usage location and still finds no free seat, and must not stay on top of the group", () => {
  const sc = byId["m365-licence"];
  const add = "Set-MgUserLicense -UserId svidal@contoso.com -AddLicenses @{SkuId='05e9a617-0261-4cee-bb44-138d3ef5d965'} -RemoveLicenses @()";
  const { sess, results } = play(sc, ["Get-MgUser -UserId svidal@contoso.com", "Connect-MgGraph", add, "Update-MgUser -UserId svidal@contoso.com -UsageLocation ES", add,
    "Invoke-MgLicenseUser -UserId svidal@contoso.com"]);
  assert.match(results[0].lines[0].text, /Connect-MgGraph/);
  assert.match(results[2].lines[0].text, /invalid usage location/);
  assert.match(results[4].lines[0].text, /does not have any available licenses/);
  ["Set-MgUserLicense -UserId rgomez@contoso.com -AddLicenses @() -RemoveLicenses @('05e9a617-0261-4cee-bb44-138d3ef5d965')", add,
   "Invoke-MgLicenseUser -UserId svidal@contoso.com", "Get-MgUserLicenseDetail -UserId svidal@contoso.com"].forEach((c) => E.run(sess, c));
  assert.equal(sess.resolved, false, "not resolved with a direct licence on top");
  E.run(sess, "Set-MgUserLicense -UserId svidal@contoso.com -AddLicenses @() -RemoveLicenses @('05e9a617-0261-4cee-bb44-138d3ef5d965')");
  E.run(sess, "Get-MgUserLicenseDetail -UserId svidal@contoso.com");
  assert.ok(sess.resolved);
});

test("Shared mailbox: Send As again or a folder permission does not open it; Full Access does", () => {
  const sc = byId["shared-mailbox"];
  const { sess, text } = play(sc, ["Connect-ExchangeOnline", "Add-RecipientPermission facturas -Trustee lperez@contoso.com -AccessRights SendAs",
    "Add-MailboxFolderPermission facturas:\\Inbox -User lperez@contoso.com -AccessRights Reviewer", "Get-MailboxPermission facturas -User lperez@contoso.com"]);
  assert.match(text, /already had Send As/);
  assert.equal(sess.resolved, false);
  E.run(sess, "Add-MailboxPermission facturas -User lperez@contoso.com -AccessRights FullAccess -AutoMapping:$false");
  E.run(sess, "Get-MailboxPermission facturas -User lperez@contoso.com");
  assert.ok(sess.resolved);
  assert.equal(sess.state.automap, false);
});

test("Entra Connect: full syncs do not widen the scope; after the move, wait for the cycle to finish", () => {
  const sc = byId["aadc-sync"];
  const { sess, text } = play(sc, ["Start-ADSyncSyncCycle -PolicyType Initial", "Start-ADSyncSyncCycle -PolicyType Initial", "Get-MgUser -UserId mgil@contoso.com"]);
  assert.match(text, /still not there/);
  assert.match(text, /does not exist/);
  assert.equal(sess.resolved, false);
  ["Get-ADUser mgil | Move-ADObject -TargetPath 'OU=Legal,OU=Users,DC=contoso,DC=local'", "Start-ADSyncSyncCycle -PolicyType Delta"].forEach((c) => E.run(sess, c));
  assert.equal(E.run(sess, "Get-MgUser -UserId mgil@contoso.com").lines[0].kind, "err", "not there while the cycle runs");
  E.run(sess, "Get-ADSyncConnectorRunStatus");
  E.run(sess, "Get-MgUser -UserId mgil@contoso.com");
  assert.ok(sess.resolved);
});

test("Veeam: retrying fails again, and removing the orphan without -FromDisk frees nothing", () => {
  const sc = byId["veeam-job"];
  const { sess, text } = play(sc, ["Get-VBRJob -Name 'FS01 Nightly' | Start-VBRJob -RetryBackup", "Get-VBRBackup -Name 'FS01 Weekly' | Remove-VBRBackup -Confirm:$false",
    "Get-VBRBackupRepository -Name REPO01", "Get-VBRBackup -Name 'FS01 Weekly' | Remove-VBRBackup -FromDisk"]);
  assert.match(text, /Failed/);
  assert.match(text, /only removes the backup from the configuration/);
  assert.match(text, /REPO01\s+E:\\Backups\s+41/);
  assert.match(text, /argument is null/);
  assert.equal(sess.state.freed, false);
  ["Remove-Item 'E:\\Backups\\FS01 Weekly' -Recurse -Force", "Start-VBRJob -Job 'FS01 Nightly'", "Get-VBRBackup -Name 'FS01 Nightly' | Get-VBRRestorePoint"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("MECM: updating the content changes nothing, and the evaluation needs the new policy first", () => {
  const sc = byId["mecm-app"];
  const { sess, text } = play(sc, ["Update-CMDistributionPoint -ApplicationName 'Contoso Expenses' -DeploymentTypeName 'Expenses 4.2 MSI'",
    "Invoke-CMClientAction -DeviceName PC-FIN-027 -ActionType ClientNotificationAppDeplEvalNow", "Get-CMDeployment -SoftwareName 'Contoso Expenses'",
    "Set-CMMsiDeploymentType -ApplicationName 'Contoso Expenses' -DeploymentTypeName 'Expenses 4.2 MSI' -ProductCode '{9C2E7F10-42A8-4B3D-9E61-7D2B4A6C8E42}'",
    "Invoke-CMClientAction -DeviceName PC-FIN-027 -ActionType ClientNotificationAppDeplEvalNow"]);
  assert.match(text, /\s14\s+0\s+14/);
  assert.match(text, /revision 4, the one it has/);
  assert.equal(sess.resolved, false);
  ["Invoke-WmiMethod -ComputerName PC-FIN-027 -Namespace root\\ccm -Class SMS_Client -Name TriggerSchedule -ArgumentList '{00000000-0000-0000-0000-000000000021}'",
   "Invoke-WmiMethod -ComputerName PC-FIN-027 -Namespace root\\ccm -Class SMS_Client -Name TriggerSchedule -ArgumentList '{00000000-0000-0000-0000-000000000121}'",
   "Get-Content \\\\PC-FIN-027\\c$\\Windows\\CCM\\Logs\\AppDiscovery.log -Tail 5"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("RHEL: restarting with /var full fails, and deleting the open log does not free the space until nginx reopens it", () => {
  const sc = byId["rhel-var-full"];
  const { sess, results, text } = play(sc, ["systemctl restart timesheets", "rm -f /var/log/timesheets/access.log", "df -h", "lsof +L1"]);
  assert.equal(results[0].lines[0].kind, "err");
  assert.match(text, /rhel-var\s+20G\s+20G\s+0 100%/);
  assert.match(text, /access\.log \(deleted\)/);
  ["systemctl reload nginx", "systemctl restart timesheets", "curl -I http://localhost"].forEach((c) => E.run(sess, c));
  assert.equal(sess.state.freed, true);
  assert.equal(sess.resolved, false, "the rotation is still broken");
  E.run(sess, "sudo sed -i 's#timesheet/#timesheets/#' /etc/logrotate.d/timesheets");
  E.run(sess, "curl -I https://timesheets.contoso.local");
  assert.ok(sess.resolved);
});

test("Citrix: the logoff does not reach an unregistered VDA, and a password reset does not help", () => {
  const sc = byId["citrix-session"];
  const { sess, text } = play(sc, ["Set-ADAccountPassword psanchez -Reset", "Get-BrokerSession -UserName CONTOSO\\psanchez | Stop-BrokerSession",
    "Get-BrokerSession -UserName CONTOSO\\psanchez", "Restart-Computer CTX-VDA03"]);
  assert.match(text, /not his credentials/);
  assert.match(text, /SessionState\s+: Disconnected/);
  assert.match(text, /11 users/);
  assert.equal(sess.state.sessionGone, false);
  ["Get-Service BrokerAgent -ComputerName CTX-VDA03 | Restart-Service", "Stop-BrokerSession -InputObject (Get-BrokerSession -UserName CONTOSO\\psanchez)",
   "Get-BrokerSession -UserName CONTOSO\\psanchez"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("Conditional Access: the policy cannot be edited, MFA resets do not help and a permanent member is not the fix", () => {
  const sc = byId["ca-blocked"];
  const { sess, results } = play(sc, ["Connect-MgGraph", "Update-MgIdentityConditionalAccessPolicy -ConditionalAccessPolicyId x -BodyParameter $p",
    "Revoke-MgUserSignInSession -UserId psanchez@contoso.com", "Get-MgAuditLogSignIn -Filter \"userPrincipalName eq 'psanchez@contoso.com'\""]);
  assert.equal(results[1].lines[0].kind, "err");
  assert.match(results[3].lines.map((l) => l.text).join(" "), /53003/);
  E.run(sess, "New-MgGroupMember -GroupId 5f2d8c1e-7a43-4b9e-9c61-2e8f0a7d4b13 -DirectoryObjectId 8b41c7e2-3d5f-4a6b-b2e9-71c0d4f8a925");
  E.run(sess, "Get-MgAuditLogSignIn -Filter \"userPrincipalName eq 'psanchez@contoso.com'\"");
  assert.equal(sess.resolved, false, "a permanent membership does not resolve it");
  E.run(sess, "$params = @{ accessId = 'member'; principalId = 'x'; groupId = 'y'; action = 'adminAssign' }");
  assert.equal(E.run(sess, "New-MgIdentityGovernancePrivilegedAccessGroupAssignmentScheduleRequest -BodyParameter $params").lines[0].kind, "err", "no end date");
  E.run(sess, "Remove-MgGroupMemberByRef -GroupId 5f2d8c1e-7a43-4b9e-9c61-2e8f0a7d4b13 -DirectoryObjectId 8b41c7e2-3d5f-4a6b-b2e9-71c0d4f8a925");
  E.run(sess, "$params = @{ accessId = 'member'; scheduleInfo = @{ expiration = @{ type = 'afterDateTime'; endDateTime = '2026-11-07T00:00:00Z' } } }");
  E.run(sess, "New-MgIdentityGovernancePrivilegedAccessGroupAssignmentScheduleRequest -BodyParameter $params");
  E.run(sess, "Get-MgAuditLogSignIn -Filter \"userPrincipalName eq 'psanchez@contoso.com'\"");
  assert.ok(sess.resolved);
});

test("SAML SSO: a brand-new certificate is not trusted by the app; the uploaded one is", () => {
  const sc = byId["sso-saml"];
  const id = "3e9b7a21-6c4d-4f80-9a15-d2c8e07b4f6a";
  const { sess, text } = play(sc, ["Connect-MgGraph", `Add-MgServicePrincipalTokenSigningCertificate -ServicePrincipalId ${id} -DisplayName 'CN=Contoso Expenses'`,
    `Update-MgServicePrincipal -ServicePrincipalId ${id} -PreferredTokenSigningKeyThumbprint D27B30E9A41C5F86B2D7E03C91A4F65B8E0C19AF`,
    "Start-Process https://expenses.contoso.com", "Remove-MgServicePrincipal -ServicePrincipalId " + id]);
  assert.match(text, /is not trusted/);
  assert.equal(sess.resolved, false);
  E.run(sess, `Update-MgServicePrincipal -ServicePrincipalId ${id} -PreferredTokenSigningKeyThumbprint 4C1E8A0D93F27B5C6E1D04A8B39F7C25D0E862B7`);
  E.run(sess, "Start-Process https://expenses.contoso.com");
  assert.ok(sess.resolved);
});

test("Linux SSSD: rejoining fails with the same clock skew, and starting chronyd without enabling it is not enough", () => {
  const sc = byId["linux-sssd"];
  const { sess, results } = play(sc, ["sss_cache -E", "realm leave", "realm join contoso.local -U Administrator", "kinit -k"]);
  assert.match(results[2].lines.map((l) => l.text).join(" "), /Clock skew too great/);
  assert.equal(results[3].lines[0].kind, "err");
  ["systemctl start chronyd", "realm join contoso.local -U Administrator", "kinit -k"].forEach((c) => E.run(sess, c));
  assert.equal(sess.resolved, false, "chronyd is still disabled at boot");
  E.run(sess, "systemctl enable chronyd");
  E.run(sess, "kinit -k");
  assert.ok(sess.resolved);
});

test("SQL log full: SIMPLE and shrinking break or skip the fix; the chain needs a differential", () => {
  const sc = byId["sql-log-full"];
  const q = (x) => `sqlcmd -S SQL-ERP01 -E -Q "${x}"`;
  const { sess, results } = play(sc, [q("DBCC SHRINKFILE (ERP_PROD_log, 1024)"), q("ALTER DATABASE ERP_PROD SET RECOVERY SIMPLE"),
    q("BACKUP LOG ERP_PROD TO DISK = N'\\\\FS01\\SQLBackup\\x.trn'"), q("ALTER DATABASE ERP_PROD SET RECOVERY FULL"),
    q("BACKUP LOG ERP_PROD TO DISK = N'\\\\FS01\\SQLBackup\\x.trn'")]);
  assert.match(results[0].lines[0].text, /Cannot shrink log file/);
  assert.match(results[2].lines.map((l) => l.text).join(" "), /Msg 4208/);
  assert.match(results[4].lines.map((l) => l.text).join(" "), /Msg 4214/);
  [q("EXEC msdb.dbo.sp_update_jobstep @job_name = N'ERP_PROD - Log backup', @step_id = 1, @command = N'... FS01 ...'"),
   q("EXEC msdb.dbo.sp_start_job @job_name = N'ERP_PROD - Log backup'"), q("DBCC SQLPERF(LOGSPACE)")].forEach((c) => E.run(sess, c));
  assert.equal(sess.resolved, false, "not resolved while the chain is broken");
  E.run(sess, q("BACKUP DATABASE ERP_PROD TO DISK = N'\\\\FS01\\SQLBackup\\ERP_PROD_DIFF.bak' WITH DIFFERENTIAL"));
  E.run(sess, q("EXEC msdb.dbo.sp_start_job @job_name = N'ERP_PROD - Log backup'"));
  E.run(sess, q("DBCC SQLPERF(LOGSPACE)"));
  assert.ok(sess.resolved);
});

/* ---------- v0.10: the career level 0 desks */
test("New laptops: the damaged unit must not go into stock; checking all twelve in does not close it", () => {
  const sc = byId["new-laptops-intake"];
  const all = "ship mark 1QV5HT4,2QV5HT4,3QV5HT4,4QV5HT4,5QV5HT4,6QV5HT4,7QV5HT4,8QV5HT4,9QV5HT4,BQV5HT4,CQV5HT4,DQV5HT4 stock";
  const { sess, text } = play(sc, ["ship delivery PO-2026-0418", all, "ship delivery PO-2026-0418"]);
  assert.match(text, /LAPTOP-0407\s+7QV5HT4\s+In stock/);
  assert.equal(sess.state.goodStocked, true);
  assert.equal(sess.state.badStocked, true);
  assert.equal(sess.state.markedBad, true);
  assert.equal(sess.resolved, false, "twelve in stock, one of them broken");
  assert.equal(E.run(sess, "bench open LAPTOP-0407").lines[2].text.includes("lid"), true);
  // the RMA requested after the mark takes the unit out of stock; the remark stays
  ["ship new rma --serial 7QV5HT4 --vendor dell --fault \"Broken screen\" --evidence \"IMG_0407-1\" --carrier vendor --from hq-it --to dell-depot --data none",
   "ship submit SHP-20661-1"].forEach((c) => E.run(sess, c));
  assert.equal(sess.state.badStocked, false);
  assert.equal(E.SHIP().deviceState([sess.ships], "7QV5HT4"), "rma");
  E.run(sess, "ship delivery PO-2026-0418");
  assert.ok(sess.resolved);
  const v = E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "hardware", minutes: 5 });
  assert.equal(v.level, "observations");
  assert.ok(v.reasons.some((x) => /damaged laptop was recorded in stock/.test(x)));
  // an RMA without the photos is not enough evidence for the vendor
  const thin = play(sc, sc.solution.map((c) => c.replace(", IMG_0407-1, IMG_0407-2", ""))).sess;
  assert.equal(thin.state.badRma, false);
  assert.equal(thin.resolved, false);
});

test("New starter: a password reset changes nothing while the account is disabled; both the account and the group are needed", () => {
  const sc = byId["starter-desk-ready"];
  const { sess, text } = play(sc, ["Set-ADAccountPassword nprieto -Reset", "Unlock-ADAccount nprieto", "Get-ADUser nprieto"]);
  assert.match(text, /Enabled\s+: False/);
  assert.equal(sess.state.pwdReset, true);
  assert.equal(sess.resolved, false);
  E.run(sess, "Enable-ADAccount nprieto");
  E.run(sess, "Get-ADUser nprieto -Properties MemberOf");
  assert.equal(sess.resolved, false, "enabled, but still without her team's group");
  E.run(sess, "Add-ADGroupMember -Identity GG-Legal -Members nprieto");
  assert.match(E.run(sess, "Get-ADUser nprieto -Properties MemberOf").lines.map((l) => l.text).join("\n"), /CN=GG-Legal/);
  assert.ok(sess.resolved);
  assert.deepEqual(E.bound(sess)[0].set, { enabled: true, groups: ["GG-Legal", "GG-M365-E3", "GG-Printers-HQ"] });
  assert.equal(E.bound(E.createSession(sc, "en"))[0].set.enabled, false, "the directory shows the account disabled while the ticket is open");
});

test("Teams audio: restarting or resetting Teams keeps the wrong default microphone", () => {
  const sc = byId["teams-no-audio"];
  const { sess, text } = play(sc, ["Stop-Process -Name ms-teams -Force", "Get-AppxPackage MSTeams | Reset-AppxPackage", "Write-AudioDevice -RecordingMeter"]);
  assert.match(text, /Microphone Array \(Realtek\(R\) Audio\)/);
  assert.equal(sess.state.teamsRestarted, true);
  assert.equal(sess.resolved, false);
  E.run(sess, "Set-AudioDevice -Index 2");
  assert.equal(sess.state.headsetDefault, false, "a playback device is not the fix");
  E.deskAct(sess, "sound", "headset");
  E.deskAct(sess, "sound", "test");
  assert.ok(sess.resolved);
});

test("Meeting room: restarting the console or power-cycling the display leaves the display on the other input", () => {
  const sc = byId["room-no-display"];
  const { sess, text } = play(sc, ["Restart-Computer MTR-SALA2", "display power SALA2-DISPLAY cycle", "display status SALA2-DISPLAY"]);
  assert.match(text, /Input\s+: HDMI 2/);
  assert.equal(sess.state.rebooted, true);
  assert.equal(sess.resolved, false);
  E.run(sess, "display input SALA2-DISPLAY hdmi2");
  assert.equal(sess.state.inputOk, false);
  E.run(sess, "display input SALA2-DISPLAY hdmi1");
  E.run(sess, "display status SALA2-DISPLAY");
  assert.ok(sess.resolved);
});

/* ---------- v0.11: career batch 2 (levels 1-3) */
test("Temporary profile: restarting changes nothing, the .bak key cannot be renamed over the TEMP one, and deleting the profile loses it", () => {
  const sc = byId["win-temp-profile"];
  const PL = "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\ProfileList\\S-1-5-21-1844237615-3127845531-2384927163-1187";
  const { sess, results } = play(sc, ["Restart-Computer -Force", "Get-CimInstance Win32_UserProfile", `Rename-Item '${PL}.bak' -NewName 'S-1-5-21-1844237615-3127845531-2384927163-1187'`]);
  assert.match(results[1].lines.map((l) => l.text).join("\n"), /C:\\Users\\TEMP\s+True\s+1/);
  assert.equal(results[2].lines[0].kind, "err");
  assert.equal(sess.resolved, false);
  const wiped = play(sc, ["Remove-Item C:\\Users\\dlopez -Recurse -Force"].concat(sc.solution)).sess;
  assert.equal(wiped.state.broken, true);
  assert.equal(wiped.resolved, false, "a deleted profile cannot be brought back by fixing the registry");
  // State and RefCount can be set on the .bak key before renaming it, too
  const early = play(sc, sc.solution.slice(0, 3).concat([`Set-ItemProperty '${PL}.bak' -Name State -Value 0`, `reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\ProfileList\\S-1-5-21-1844237615-3127845531-2384927163-1187.bak" /v RefCount /t REG_DWORD /d 0 /f`,
    `Remove-Item '${PL}'`, `Rename-Item '${PL}.bak' -NewName 'S-1-5-21-1844237615-3127845531-2384927163-1187'`, "logoff 2", "Get-CimInstance Win32_UserProfile"])).sess;
  assert.ok(early.resolved);
});

test("GPO drive: net use is refused, a sign-in before the group changes nothing, and gpupdate alone does not apply the new group", () => {
  const sc = byId["gpo-drive-missing"];
  const { sess, results } = play(sc, ["net use P: \\\\FS01\\Proyectos", "logoff", "Add-ADGroupMember GG-Projects -Members smolina", "klist purge", "gpupdate /force", "net use"]);
  assert.match(results[0].lines.map((l) => l.text).join(" "), /Access is denied/);
  assert.doesNotMatch(results[5].lines.map((l) => l.text).join("\n"), /P:/);
  assert.equal(sess.state.driveOk, false);
  E.run(sess, "net use P: \\\\FS01\\Proyectos");
  assert.equal(sess.state.byHand, true, "with the group and fresh tickets, mapping by hand works, but it is not the GPO");
  E.run(sess, "logoff");
  E.run(sess, "gpresult /r");
  assert.ok(sess.resolved);
  assert.deepEqual(E.bound(sess)[0].set.groups, ["GG-Marketing", "GG-Projects", "GG-M365-E3", "GG-Printers-HQ"]);
});

test("EPM: local admin is undone by Intune and leaves a remark; a rule by file name only is refused; the rule needs a sync", () => {
  const sc = byId["epm-elevation"];
  const { sess, results } = play(sc, ["Add-LocalGroupMember -Group Administrators -Member AzureAD\\pherrero@contoso.com", "Get-LocalGroupMember Administrators",
    "intune epm rule add --policy \"EPM rules - Projects\" --file TrazaCAD_Setup_2026.1.exe"]);
  assert.match(results[1].lines.map((l) => l.text).join(" "), /Account protection/);
  assert.doesNotMatch(results[1].lines.map((l) => l.text).join(" "), /pherrero/);
  assert.equal(results[2].lines[0].kind, "err");
  E.run(sess, sc.solution[2]);
  assert.equal(E.run(sess, sc.solution[4]).lines[0].kind, "err", "not on the laptop until it syncs");
  E.run(sess, "intune device sync LAPTOP-0281");
  E.run(sess, sc.solution[4]);
  assert.ok(sess.resolved);
  const v = E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 });
  assert.ok(v.reasons.some((x) => /local Administrators/.test(x)));
});

test("Deleted AD account: a new account blocks the restore until it is removed, and the restore keeps the groups", () => {
  const sc = byId["ad-deleted-user"];
  const restore = sc.solution[2];
  const { sess, results } = play(sc, ["New-ADUser -Name 'Hugo Serrano' -SamAccountName hserrano", "Get-ADPrincipalGroupMembership hserrano", restore]);
  assert.doesNotMatch(results[1].lines.map((l) => l.text).join(" "), /GG-Sales/);
  assert.equal(results[2].lines[0].kind, "err");
  assert.equal(sess.state.restored, false);
  ["Remove-ADUser hserrano -Confirm:$false", restore, "Get-ADUser hserrano -Properties MemberOf", sc.solution[4]].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  const v = E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 });
  assert.ok(v.reasons.some((x) => /new account/.test(x)));
  assert.equal(play(sc, ["Get-ADObject -Filter 'isDeleted -eq $true' -IncludeDeletedObjects | Restore-ADObject"]).sess.state.restored, false, "restoring everything is not run");
});

test("DHCP: a fixed IP and the BAD_ADDRESS leases alone are not enough, and the range has no room to grow", () => {
  const sc = byId["dhcp-scope-full"];
  const { sess } = play(sc, ["onsite static 10.20.16.199", "Remove-DhcpServerv4Lease -ComputerName DC01 -ScopeId 10.20.16.0 -BadLeases",
    "Set-DhcpServerv4Scope -ComputerName DC01 -ScopeId 10.20.16.0 -EndRange 10.20.16.230", "Set-DhcpServerv4Scope -ComputerName DC01 -ScopeId 10.20.16.0 -LeaseDuration 1.00:00:00",
    "Get-DhcpServerv4ScopeStatistics -ComputerName DC01"]);
  assert.equal(sess.state.room, false);
  assert.equal(sess.resolved, false);
  E.run(sess, "Get-DhcpServerv4Lease -ComputerName DC01 -ScopeId 10.20.16.0 | Where-Object HostName -like 'PC-MKT-*' | Remove-DhcpServerv4Lease");
  E.run(sess, "onsite ipconfig");
  assert.ok(sess.resolved);
  const v = E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "capacity", minutes: 5 });
  assert.ok(v.reasons.some((x) => /fixed IP/.test(x)));
  assert.equal(play(sc, ["Set-DhcpServerv4Scope -ComputerName DC01 -ScopeId 10.20.16.0 -LeaseDuration 4.00:00:00"]).sess.state.leaseShort, false);
});

test("NTFS: Full control for Laura only fixes Laura, Everyone is a remark, and inheritance plus removing the auditors' entry also works", () => {
  const sc = byId["ntfs-access-denied"];
  const P = "D:\\Shares\\Contabilidad\\Cierres2026";
  const { sess, results } = play(sc, [`icacls ${P} /grant CONTOSO\\lperez:(OI)(CI)F`, `accesschk.exe -d CONTOSO\\irey ${P}`, `icacls ${P}`]);
  assert.match(results[1].lines.map((l) => l.text).join(" "), /No matching objects/);
  assert.match(results[2].lines.map((l) => l.text).join("\n"), /CONTOSO\\lperez:\(OI\)\(CI\)\(F\)/);
  assert.equal(sess.resolved, false);
  const other = play(sc, [`icacls ${P}`, "icacls D:\\Shares\\Contabilidad", `icacls ${P} /inheritance:e`, `accesschk.exe -d CONTOSO\\lperez ${P}`]).sess;
  assert.equal(other.resolved, false, "the auditors' Modify entry is still there");
  E.run(other, `icacls ${P} /remove ext.auditor01`);
  E.run(other, `accesschk.exe -d CONTOSO\\lperez ${P}`);
  assert.ok(other.resolved);
  const all = play(sc, [`icacls ${P} /grant Everyone:(OI)(CI)F`].concat(sc.solution.slice(0, 2), [`icacls ${P} /inheritance:e`, `icacls ${P} /remove ext.auditor01`, sc.solution[3]])).sess;
  assert.ok(all.resolved);
  assert.ok(E.verdict(all, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons.some((x) => /Everyone/.test(x)));
});

test("UPS: the self-test passes and new batteries change nothing; the tests fail until the settings point at what exists", () => {
  const sc = byId["ups-no-alert"];
  const { sess, results } = play(sc, ["ups selftest UPS-RACKB", "ups replace-battery UPS-RACKB", "ups test-email UPS-RACKB", "ups simulate-outage UPS-RACKB",
    "ups smtp UPS-RACKB --server mail02.contoso.local", "pcns FS01 set-nmc 10.20.99.30"]);
  assert.match(results[0].lines.map((l) => l.text).join(" "), /Passed/);
  assert.equal(results[2].lines[0].kind, "err");
  assert.match(results[3].lines.map((l) => l.text).join(" "), /no PowerChute clients/);
  assert.equal(results[4].lines[0].kind, "err");
  assert.equal(results[5].lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons.some((x) => /Batteries were ordered/.test(x)));
});

/* ---------- v0.12: career batch 3 (closing level 1) */
test("Android: reinstalling Company Portal changes nothing, wipe is refused for a personal work profile, and enrolling needs the old record retired", () => {
  const sc = byId["android-work-profile"];
  const { sess, results } = play(sc, ["onsite reinstall-portal", "onsite clear-cache", "intune app StockTienda", "Clear-MgDeviceManagementManagedDevice -ManagedDeviceId 3b7e1c94-5d2a-4f08-9c6e-81a4d07f2b53",
    "onsite enroll \"Contoso COPE - Stores\""]);
  assert.match(results[2].lines.map((l) => l.text).join(" "), /Not targeted/);
  assert.equal(results[3].lines[0].kind, "err");
  assert.equal(results[4].lines[0].kind, "err");
  assert.equal(sess.state.reenrolled, false);
  E.run(sess, sc.solution[2]);
  assert.equal(E.run(sess, "onsite enroll portal").lines[0].kind, "err", "Company Portal enrolls it as personal again");
  ["onsite enroll \"Contoso COPE - Stores\"", sc.solution[4], sc.solution[5]].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("iPhone: retiring and enrolling again leaves it personal; 'corporate' is not a valid owner type", () => {
  const sc = byId["iphone-no-policies"];
  const { sess, results } = play(sc, ["Invoke-MgRetireDeviceManagementManagedDevice -ManagedDeviceId c5a81e2f-7d34-4b96-a0e2-5f19b3d6e870", "onsite enroll",
    "Get-MgDeviceManagementManagedDevice -Filter \"userPrincipalName eq 'imontero@contoso.com'\"", "Sync-MgDeviceManagementManagedDevice -ManagedDeviceId c5a81e2f-7d34-4b96-a0e2-5f19b3d6e870",
    "Update-MgDeviceManagementManagedDevice -ManagedDeviceId c5a81e2f-7d34-4b96-a0e2-5f19b3d6e870 -ManagedDeviceOwnerType corporate"]);
  assert.match(results[2].lines.map((l) => l.text).join("\n"), /ManagedDeviceOwnerType : personal/);
  assert.equal(results[4].lines[0].kind, "err");
  assert.equal(sess.state.synced, false);
  assert.equal(sess.resolved, false);
  // a sync before the ownership change brings nothing; after it, it does
  sc.solution.slice(2).forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("Store new starter: every store's group does not open the app, another store's group is not the fix, and the store group needs a new sign-in", () => {
  const sc = byId["retail-new-starter"];
  const { sess, results } = play(sc, ["Add-ADGroupMember GG-Stores-All -Members amedina", "onsite signin", "stocktienda log --user amedina", "Add-ADGroupMember GG-Store-T07 -Members amedina"]);
  assert.match(results[2].lines.map((l) => l.text).join(" "), /DENIED/);
  assert.equal(sess.state.signedIn, false);
  ["Add-ADGroupMember GG-Store-T03 -Members amedina", "stocktienda log --user amedina"].forEach((c) => E.run(sess, c));
  assert.equal(sess.state.verified, false, "not until she signs in again");
  ["onsite signin", "stocktienda log --user amedina"].forEach((c) => E.run(sess, c));
  assert.equal(sess.resolved, false, "still in another store's group");
  E.run(sess, "Remove-ADGroupMember GG-Store-T07 -Members amedina -Confirm:$false");
  assert.ok(sess.resolved);
  assert.ok(E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons.some((x) => /all store staff/.test(x)));
  assert.deepEqual(E.bound(sess)[0].set.groups, ["GG-Store-T03", "GG-Stores-All", "GG-M365-F3"]);
});

test("Hotel VPN: reinstalling the client changes nothing, and the portal has to be opened before Carlos can accept it", () => {
  const sc = byId["anyconnect-hotel"];
  const { sess, results } = play(sc, ["msiexec /fa C:\\Temp\\cisco-secure-client-win-5.1.6.103-core-vpn-predeploy-k9.msi /qn", sc.solution[0], "onsite accept-portal", "Resolve-DnsName vpn.contoso.com"]);
  assert.match(results[1].lines.map((l) => l.text).join(" "), /restricting access/);
  assert.equal(results[2].lines[0].kind, "err");
  assert.match(results[3].lines.map((l) => l.text).join(" "), /10\.180\.0\.1/);
  assert.equal(E.run(sess, "Test-NetConnection intranet.contoso.local -Port 443").lines[0].kind, "err");
  ["Start-Process http://www.msftconnecttest.com/redirect", "onsite accept-portal", sc.solution[0], "Test-NetConnection intranet.contoso.local -Port 443"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("Label printer: a new roll and a restart change nothing, the driver must be added before it is set, and the size matters for the test page", () => {
  const sc = byId["store-label-printer"];
  const { sess, results } = play(sc, ["onsite new-roll", "onsite restart-printer", "stocktienda print-label", "Set-Printer -Name Etiquetas -DriverName \"ZDesigner ZD421-203dpi ZPL\"", "zebra label Etiquetas 50x30"]);
  assert.match(results[2].lines.map((l) => l.text).join(" "), /\^XA/);
  assert.equal(results[3].lines[0].kind, "err");
  assert.equal(results[4].lines[0].kind, "err");
  ["Add-PrinterDriver -Name \"ZDesigner ZD421-203dpi ZPL\"", "Set-Printer -Name Etiquetas -DriverName \"ZDesigner ZD421-203dpi ZPL\"", "rundll32 printui.dll,PrintUIEntry /k /n Etiquetas"].forEach((c) => E.run(sess, c));
  assert.equal(sess.state.testPage, false, "spread over five labels at 4 x 6 in");
  ["zebra label Etiquetas 50x30", "rundll32 printui.dll,PrintUIEntry /k /n Etiquetas", "stocktienda print-label"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("Poly room: restarting leaves the codec with no camera, and the camera cannot be selected until it is back on the codec", () => {
  const sc = byId["poly-room-no-camera"];
  const { sess, results } = play(sc, ["poly reboot G7500-CANTABRICO", "poly camera G7500-CANTABRICO primary eagleeye", "poly test-call G7500-CANTABRICO"]);
  assert.equal(results[1].lines[0].kind, "err");
  assert.match(results[2].lines.map((l) => l.text).join(" "), /no camera/);
  ["onsite move-camera", "poly camera G7500-CANTABRICO primary eagleeye", "poly test-call G7500-CANTABRICO"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("Lost phone: a password reset alone leaves the phone signed in, locate needs Lost Mode, and wiping first or retiring are remarks", () => {
  const sc = byId["mdm-lost-phone"];
  const { sess, results } = play(sc, ["Set-ADAccountPassword ribanez -Reset", "Get-MgAuditLogSignIn -Filter \"userPrincipalName eq 'ribanez@contoso.com'\" -Top 5", "intune device locate ZAR-IPH-0147"]);
  assert.doesNotMatch(results[1].lines.map((l) => l.text).join(" "), /50173/);
  assert.equal(results[2].lines[0].kind, "err");
  assert.equal(sess.resolved, false);
  const hasty = play(sc, ["Invoke-MgRetireDeviceManagementManagedDevice -ManagedDeviceId 71d0b9e4-2c6a-4e85-9f13-a64c8e2b5d07", "Clear-MgDeviceManagementManagedDevice -ManagedDeviceId 71d0b9e4-2c6a-4e85-9f13-a64c8e2b5d07",
    "intune device locate ZAR-IPH-0147"]);
  assert.equal(hasty.results[2].lines[0].kind, "err", "a wiped phone cannot be located");
  const done = play(sc, sc.solution.concat(["Invoke-MgRetireDeviceManagementManagedDevice -ManagedDeviceId 71d0b9e4-2c6a-4e85-9f13-a64c8e2b5d07"])).sess;
  assert.ok(E.verdict(done, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "cause-removed", minutes: 5 }).reasons.some((x) => /retired/.test(x)));
});

/* ---------- v0.13: career level 2 (batch 4) */
test("Confluence runbook: renaming the server alone breaks at step 2, and the page needs an owner and a review date", () => {
  const sc = byId["confluence-runbook-stale"];
  const { sess, results } = play(sc, ["confluence replace 4471 FS02 FS-NEW01", "onsite follow 4471", "confluence replace 4471 D: E:", "onsite follow 4471"]);
  assert.match(results[1].lines.map((l) => l.text).join(" "), /Cannot find path 'D:\\Archivo'/);
  assert.equal(sess.state.tested, true);
  assert.equal(sess.resolved, false, "no owner or review date yet");
  ["confluence owner 4471 sgil", "confluence review 4471 01/06/2027"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("Jamf: running the policy again finds nothing, and both the inventory and the criterion are needed", () => {
  const sc = byId["jamf-policy-not-running"];
  const { sess, results } = play(sc, ["sudo jamf policy", "sudo jamf recon", "sudo jamf policy"]);
  assert.match(results[0].lines.map((l) => l.text).join(" "), /No policies were found/);
  assert.match(results[2].lines.map((l) => l.text).join(" "), /No policies were found/, "the criterion is still misspelt");
  assert.equal(E.run(sess, "jamfpro group \"Marketing Macs\" --criterion \"Department is Mkt\"").lines[0].kind, "err");
  ["jamfpro group \"Marketing Macs\" --criterion \"Department is Marketing\"", "sudo jamf policy", "ls /Applications"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("PDQ: redeploying fails the same way, and Invoke-GPUpdate cannot reach the PCs until the rules are there", () => {
  const sc = byId["pdq-deploy-fails"];
  const { sess, results } = play(sc, ["pdq redeploy 1187 --failed", "Invoke-GPUpdate -Computer WH-PC-03 -Force", "Test-Path \\\\WH-PC-03\\ADMIN$"]);
  assert.match(results[0].lines.map((l) => l.text).join(" "), /12 Failed/);
  assert.equal(results[1].lines[0].kind, "err");
  assert.equal(results[2].lines[0].text, "False");
  sc.solution.slice(4).forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("SharePoint: deleting the file leaves the folder open, and a deleted file cannot be shared until it is restored", () => {
  const sc = byId["sharepoint-shared-everyone"];
  const link = sc.solution[sc.solution.length - 1];
  const { sess, results } = play(sc, ["Remove-PnPFile -ServerRelativeUrl \"/sites/Ventas/Shared Documents/Tarifas 2027/Tarifa-Norte-Distribucion-2027.xlsx\" -Recycle -Force", link]);
  assert.match(results[1].lines.map((l) => l.text).join(" "), /StatusCode : 200/);
  sc.solution.slice(2, 4).forEach((c) => E.run(sess, c));
  assert.equal(E.run(sess, sc.solution[4]).lines[0].kind, "err", "the file is in the recycle bin");
  ["Restore-PnPRecycleBinItem -Identity Tarifa-Norte-Distribucion-2027.xlsx -Force", sc.solution[4], link].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.equal(E.run(E.createSession(sc, "en"), "Remove-PnPFolderSharingLink -Folder \"Shared Documents/Tarifas 2027\" -Identity c0e9a4b2-17d8-4a3f-b6e5-9f2a1c8d7b40").lines[0].kind, "err", "not the organisation link");
});

test("Kitchen printer: reinstalling the POS changes nothing, and either the current address or the old one with a restart works", () => {
  const sc = byId["pos-kitchen-printer"];
  const { sess, results } = play(sc, ["onsite reinstall-pos", "hiopos test-print COCINA"]);
  assert.match(results[1].lines.map((l) => l.text).join(" "), /timed out/);
  assert.equal(sess.resolved, false);
  const old = play(sc, ["router dhcp reserve 64-EB-8C-3A-7F-21 192.168.10.50", "hiopos test-print COCINA", "onsite restart-printer", "hiopos test-print COCINA"]);
  assert.match(old.results[1].lines.map((l) => l.text).join(" "), /timed out/, "the reservation needs the printer to renew");
  assert.ok(old.sess.resolved);
  const loose = play(sc, ["hiopos printer COCINA --ip 192.168.10.112", "hiopos test-print COCINA"]).sess;
  assert.equal(loose.state.printed, true);
  assert.equal(loose.resolved, false, "it prints, but nothing keeps that address");
});

test("CashDro: an adjustment by hand explains nothing, and the manual cash must be counted after both tickets are corrected", () => {
  const sc = byId["cashdro-close-mismatch"];
  const { sess, results } = play(sc, ["hiopos cash-count --adjust 57,90", "hiopos close", "onsite count-drawer", "hiopos cash-count --manual 57,90"]);
  assert.equal(results[1].lines[0].kind, "err");
  assert.equal(results[3].lines[0].kind, "err", "the tickets still say CashDro");
  sc.solution.slice(4).forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons.some((x) => /adjusted by hand/.test(x)));
});

test("AS400: a new profile is a remark, enabling alone leaves the forgotten password, and unknown commands answer like IBM i", () => {
  const sc = byId["as400-user-disabled"];
  const { sess, results } = play(sc, ["WRKACTJOB", "CRTUSRPRF USRPRF(IREY2) PASSWORD(Temp1) PWDEXP(*YES)", "CHGUSRPRF USRPRF(IREY) STATUS(*ENABLED)", "onsite signon"]);
  assert.match(results[0].lines[0].text, /^CPD0030: Command WRKACTJOB in library \*LIBL not found\.$/);
  assert.match(results[3].lines.map((l) => l.text).join(" "), /CPF1120/);
  assert.equal(E.run(sess, "CHGUSRPRF USRPRF(IREY) PASSWORD(Temp2611X)").lines[0].kind, "err", "without PWDEXP(*YES) IT would know it");
  ["CHGUSRPRF USRPRF(IREY) PASSWORD(Temp2611X) PWDEXP(*YES)", "onsite signon", "DSPUSRPRF USRPRF(IREY)"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons.some((x) => /IREY2/.test(x)));
});

test("SAP: reinstalling SAP GUI and reprinting change nothing, IT cannot edit SPAD, and Basis must point at the right host", () => {
  const sc = byId["sap-printer-sap"];
  const { sess, results } = play(sc, ["onsite reinstall-sapgui", "sap sp01 reprint all", "sap spad ZALB --host PRT-SRV01", "basis change ZALB host PRT-SRV02"]);
  assert.match(results[1].lines.map((l) => l.text).join(" "), /PRT-SRV00/);
  assert.equal(results[2].lines[0].kind, "err");
  assert.equal(results[3].lines[0].kind, "err");
  ["basis change ZALB host PRT-SRV01", "sap sp01 reprint all", "Get-PrintJob -ComputerName PRT-SRV01 -PrinterName ALM-MFP-01"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("Crestron room: restarting the panel or the console keeps it signed out, and the password must not expire again", () => {
  const sc = byId["crestron-room-teams"];
  const { sess, results } = play(sc, ["crestron reboot TSW-CONSEJO", "mtr reboot MTR-CONSEJO", "mtr signin MTR-CONSEJO", "Set-ADAccountPassword sala.consejo -Reset", "mtr signin MTR-CONSEJO", "mtr test-join MTR-CONSEJO"]);
  assert.match(results[1].lines.map((l) => l.text).join(" "), /AADSTS50055/);
  assert.equal(results[2].lines[0].kind, "err");
  assert.equal(sess.resolved, false, "it would expire again in 90 days");
  E.run(sess, "Set-ADUser sala.consejo -PasswordNeverExpires $true");
  assert.ok(sess.resolved);
});

test("Store 4G: waiting and restarting the fibre box change nothing; the tills work once the backup is on", () => {
  const sc = byId["store-4g-failover"];
  const { sess } = play(sc, ["onsite wait", "onsite restart-ont", "onsite till-test", "onsite card-test", "rms failover RUT-T03 on", "onsite till-test", "onsite card-test"]);
  assert.equal(sess.state.tillOk && sess.state.cardOk, true);
  assert.equal(sess.resolved, false, "the fault with the operator is not open");
  E.run(sess, "isp report FTTH-0094412");
  assert.ok(sess.resolved);
});

test("Windows Update: SFC before DISM cannot repair, renaming needs the service stopped, and an unrepaired install is undone", () => {
  const sc = byId["win-update-rollback"];
  const { sess, results } = play(sc, ["sfc /scannow", "Rename-Item C:\\Windows\\SoftwareDistribution SoftwareDistribution.old", "Start-Process ms-settings:windowsupdate-action", "Restart-Computer"]);
  assert.match(results[0].lines.map((l) => l.text).join(" "), /unable to fix/);
  assert.equal(results[1].lines[0].kind, "err");
  assert.equal(sess.state.applied, false);
  const paused = play(sc, [sc.desktop.apps[0].actions.find((a) => a.id === "pause").cmd]).sess;
  assert.equal(E.desktop(paused).apps[0].actions.find((a) => a.id === "resume").enabled, true);
  sc.solution.forEach((c) => E.run(paused, c));
  assert.ok(paused.resolved);
  assert.equal(paused.state.paused, false, "checking for updates resumes them");
});

test("Restaurant DHCP: renewing keeps landing on the second server, a fixed IP is a remark, and the AP mode leaves one DHCP server", () => {
  const sc = byId["tplink-dhcp-clash"];
  const { sess, results } = play(sc, ["ipconfig /renew", "New-NetIPAddress -InterfaceAlias Wi-Fi -IPAddress 192.168.10.150 -PrefixLength 24 -DefaultGateway 192.168.10.1", "onsite card-test", "tplink 192.168.0.1 dhcp off", "ipconfig /renew"]);
  assert.match(results[0].lines.map((l) => l.text).join(" "), /192\.168\.0\.105/);
  assert.equal(sess.state.cardOk, false);
  assert.equal(results[4].lines[0].kind, "err", "DHCP is off on the adapter");
  ["Set-NetIPInterface -InterfaceAlias Wi-Fi -Dhcp Enabled", "router dhcp leases", "onsite card-test"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  const left = play(sc, ["New-NetIPAddress -InterfaceAlias Wi-Fi -IPAddress 192.168.10.150 -PrefixLength 24 -DefaultGateway 192.168.10.1"].concat(sc.solution.slice(0, 4), ["router dhcp leases", "onsite card-test"])).sess;
  assert.equal(left.resolved, false, "the fixed IP stays until DHCP is turned back on");
});

test("Squid: the provider's list cannot be edited, an exception needs a reload, and opening the category is a remark", () => {
  const sc = byId["squid-blocked-site"];
  const curl = sc.solution[6];
  const { sess, results } = play(sc, ["sed -i '/transnorte/d' /etc/squid/lists/gambling/domains", "echo \".transnorte.example\" >> /etc/squid/lists/exceptions.txt", curl, "systemctl restart squid"]);
  assert.equal(results[0].lines[0].kind, "err");
  assert.match(results[2].lines.map((l) => l.text).join(" "), /403 Forbidden/);
  assert.equal(results[3].lines[0].kind, "err");
  ["sed -i 's/^http_access deny cat_gambling/#&/' /etc/squid/squid.conf", "squid -k reconfigure", curl, "grep transnorte /var/log/squid/access.log"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons.some((x) => /gambling/.test(x)));
});

test("USB camera: blocking the HR users' OU changes nothing, the instance ID is refused, and value 1 must be kept", () => {
  const sc = byId["usb-blocked-camera"];
  const key = "HKLM\\Software\\Policies\\Microsoft\\Windows\\DeviceInstall\\Restrictions\\AllowDeviceIDs";
  const { sess, results } = play(sc, ["Set-GPInheritance -Target \"OU=HR,OU=Users,DC=contoso,DC=local\" -IsBlocked Yes", "Invoke-GPUpdate -Computer PC-RRHH-004 -Force", "onsite replug", "onsite import-photos",
    `Set-GPRegistryValue -Name "Workstations - USB control" -Key "${key}" -ValueName 2 -Type String -Value 'USB\\VID_04A9&PID_32E8\\8A2F0C113D4E'`]);
  assert.equal(sess.state.installed, false);
  assert.equal(results[4].lines[0].kind, "err");
  const over = play(sc, [`Set-GPRegistryValue -Name "Workstations - USB control" -Key "${key}" -ValueName 1 -Type String -Value 'USB\\VID_04A9&PID_32E8'`].concat(sc.solution.slice(4))).sess;
  assert.ok(over.resolved);
  assert.ok(E.verdict(over, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons.some((x) => /encrypted USB/.test(x)));
});

/* ---------- v0.14: career level 3, part 1 */
test("Disk check: cleaning up hides the gap, the fixed script reads df's own Use%, and deleting app files is a remark", () => {
  const sc = byId["bash-disk-check"];
  const { sess, results } = play(sc, ["/opt/scripts/check-disk.sh", "rm -rf /srv/docs-export/*", "/opt/scripts/check-disk.sh", "df -h /srv"]);
  assert.match(results[0].lines.map((l) => l.text).join(" "), /OK \/srv 86%/);
  assert.match(results[2].lines.map((l) => l.text).join(" "), /OK \/srv 63%/);
  assert.match(results[3].lines.map((l) => l.text).join(" "), /68% \/srv/);
  assert.equal(sess.resolved, false);
  sc.solution.slice(4).forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons.some((x) => /owner/.test(x)));
});

test("Git: the Recycle Bin copy changes nothing, the stash cannot be dropped, and a commit needs the change staged", () => {
  const sc = byId["git-script-overwritten"];
  const { sess, results } = play(sc, ["onsite restore-recyclebin", "git stash drop", "git stash pop", "git commit -m \"Starter: department group\"", "git push"]);
  assert.equal(results[1].lines[0].kind, "err");
  assert.equal(results[3].lines[0].kind, "err", "nothing staged");
  assert.match(results[4].lines[0].text, /Everything up-to-date/);
  ["git commit -am \"Starter: department group\"", "git push", "./New-StarterAccount.ps1 -Sam x -Department HR -WhatIf"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

const TEMPTING_INV = "Import-Csv C:\\Reports\\inventory.csv | Where-Object { $_.Serial } | Export-Csv C:\\Reports\\inventory-clean.csv -NoTypeInformation";
test("Inventory: removing the empty rows is a remark, the errors only reach the catch with -ErrorAction Stop, and the script must run again", () => {
  const sc = byId["ps-inventory-csv"];
  const { sess } = play(sc, [TEMPTING_INV, sc.solution[4], sc.solution[6]]);
  assert.equal(sess.state.verified, false, "the CSV is the old one until the inventory runs again");
  ["Start-ScheduledTask -TaskName 'Monthly inventory'", sc.solution[6]].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons.some((x) => /16 computers/.test(x)));
});

test("Ubuntu SSH: a rebuild repeats the lockout, the firewall cannot stay off, and SSH open to anyone is a remark", () => {
  const sc = byId["ubuntu-ssh-locked"];
  const { sess, results } = play(sc, ["onsite rebuild", "onsite ssh", "ufw allow 22/tcp", "sudo ufw disable", "onsite ssh", "sudo tail /var/log/auth.log"]);
  assert.match(results[1].lines[0].text, /Connection timed out/);
  assert.equal(results[2].lines[0].kind, "err", "not root");
  assert.equal(sess.resolved, false, "the firewall is off");
  ["sudo ufw allow ssh", "sudo ufw enable", "onsite ssh", "sudo tail /var/log/auth.log"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons.some((x) => /any address/.test(x)));
});

test("Print role: a restart lasts until the batch is relaunched, and the queues cannot be changed with the spooler down", () => {
  const sc = byId["winserver-role-eventlog"];
  const set = sc.solution[6];
  const { sess, results } = play(sc, [set, "Get-Printer", "Restart-Service Spooler", "onsite reprint", "Get-Service Spooler"]);
  assert.equal(results[0].lines[0].kind, "err");
  assert.equal(results[1].lines[0].kind, "err");
  assert.match(results[4].lines.map((l) => l.text).join(" "), /Stopped/);
  [ "Start-Service Spooler", set, "onsite reprint", "Get-Service Spooler"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("Graph MFA: the break-glass account is refused and a remark, and asking for write access is a remark too", () => {
  const sc = byId["graph-report-mfa"];
  const { sess, results } = play(sc, ["Get-Secret -Name GA-BreakGlass -Vault IT", "Connect-MgGraph -Scopes UserAuthenticationMethod.ReadWrite.All", ".\\Get-MfaReport.ps1", sc.solution[5]]);
  assert.equal(results[0].lines[0].kind, "err");
  assert.ok(sess.resolved);
  const reasons = E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons;
  assert.ok(reasons.some((x) => /break-glass/.test(x)) && reasons.some((x) => /Write access/.test(x)));
});

test("SolarWinds: muting the node is a remark, the wait must be sensible, and both changes are needed for the replay", () => {
  const sc = byId["solarwinds-alert-storm"];
  const { sess, results } = play(sc, ["orion node mute SW-ALM-01", "orion alert edit \"High interface utilisation\" --sustain 60m", "orion dependency add --parent SW-ALM-01 --child RTR-ALM-01"]);
  assert.equal(results[1].lines[0].kind, "err");
  assert.equal(results[2].lines[0].kind, "err");
  sc.solution.slice(4).forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons.some((x) => /muted/.test(x)));
});

test("PMS: the service will not start on the old address, and charges keyed by hand get posted twice", () => {
  const sc = byId["pms-room-charge"];
  const { sess, results } = play(sc, ["pms post-charge", "Start-Service PmsPosIfc", "hiopos pms resend"]);
  assert.equal(results[1].lines[0].kind, "err");
  assert.match(results[2].lines.map((l) => l.text).join(" "), /not reachable/);
  sc.solution.slice(5).forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons.some((x) => /twice/.test(x)));
});

test("IPTV: restarting the TVs changes nothing, IGMP goes on the VLAN, an unsaved change is not done, and unknown commands answer like ArubaOS", () => {
  const sc = byId["iptv-no-channels"];
  const { sess, results } = play(sc, ["onsite reboot-tvs", "onsite tv 412", "show igmp-snooping", "configure", "ip igmp", "vlan 40 ip igmp", "onsite tv 412", "show interfaces port-utilization"]);
  assert.equal(results[2].lines[0].text, "Invalid input: show");
  assert.equal(results[4].lines[0].kind, "err", "IGMP is per VLAN");
  assert.equal(sess.resolved, false, "not saved");
  E.run(sess, "write memory");
  assert.ok(sess.resolved);
});

test("Tape: new tapes do not read the old one, the drive must be cleaned with the tape out, and the restore goes next to the current file", () => {
  const sc = byId["tape-backup-unreadable"];
  const { sess, results } = play(sc, ["onsite order-tapes", "mtx -f /dev/sg3 load 24 0", "tar -tvf /dev/nst0", "tar -xvf /dev/nst0 -C /tmp/restore srv/finance/Nominas/Nominas-octubre-2026.xlsx"]);
  assert.equal(results[1].lines[0].kind, "err", "the drive is full");
  assert.equal(results[2].lines[0].kind, "err");
  assert.equal(results[3].lines[0].kind, "err");
  sc.solution.slice(5).forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("Veeam restore test: recording it as passed early is a remark, and the disk cannot change while FS01 runs", () => {
  const sc = byId["veeam-restore-test"];
  const { sess, results } = play(sc, ["testlog mark FS01 passed", sc.solution[4], "Get-VBRJob -Name 'FS01 Nightly' | Start-VBRJob", sc.solution[7]]);
  assert.equal(results[1].lines[0].kind, "err");
  assert.match(results[3].lines.map((l) => l.text).join(" "), /Failed/);
  ["Stop-VM FS01"].concat(sc.solution.slice(4)).forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  const reasons = E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons;
  assert.ok(reasons.some((x) => /before it passed/.test(x)) && reasons.some((x) => /without shutting/.test(x)));
});

/* ---------- v0.14: career level 3, part 2 */
const txt = (r) => r.lines.map((l) => l.text).join(" ");
test("Trading floor CA: the generic travel group changes nothing, excluding him from everything is a remark, and the fix needs a change number", () => {
  const sc = byId["ca-trading-block"];
  const { sess, results } = play(sc, ["Connect-MgGraph", "New-MgGroupMember -GroupId CA-Exception-Travel -DirectoryObjectId rlarrea@contoso.com", "onsite retry",
    ".\\Set-CaExclusion.ps1 -Policy CA050 -Group CA-Trading-Travel", ".\\Set-CaExclusion.ps1 -Policy All -User rlarrea -Change CHG-4441", "onsite retry", sc.solution[1]]);
  assert.match(txt(results[2]), /again/);
  assert.equal(results[3].lines[0].kind, "err", "no change number");
  assert.match(results[6].lines.map((l) => l.text).join(" "), /CA001 - Require MFA for all users\s+notApplied/);
  assert.equal(sess.resolved, false, "outside every policy");
  [".\\Set-CaExclusion.ps1 -Policy All -User rlarrea -Change CHG-4441 -Remove"].concat(sc.solution.slice(6)).forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons.some((x) => /every policy/.test(x)));
});

test("PIM: a permanent role is refused and a remark, too long an activation is refused, and the old Exchange session keeps failing", () => {
  const sc = byId["pim-role-expired"];
  const act = sc.solution[5];
  const { sess, results } = play(sc, ["New-MgRoleManagementDirectoryRoleAssignment -RoleDefinitionId 29232cdf-9323-42fd-ade2-1d097af3e4de -PrincipalId x -DirectoryScopeId '/'",
    act.replace("PT1H", "PT8H"), act, ".\\Convert-LeaverMailboxes.ps1"]);
  assert.equal(results[0].lines[0].kind, "err");
  assert.match(results[1].lines[0].text, /ExpirationRule/);
  assert.equal(results[3].lines[0].kind, "err", "the session was opened before the role was active");
  sc.solution.slice(6).forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons.some((x) => /permanent/.test(x)));
});

test("Device42: a delete asks first and is then refused, another position is refused, and the audit needs position and power", () => {
  const sc = byId["device42-rack-mismatch"];
  const { sess, results } = play(sc, ["d42 delete FS-SCAN01", "d42 delete FS-SCAN01 --confirm", "d42 move FS-SCAN01 --rack B --u 12", "d42 move FS-SCAN01 --rack B --u 20", "room audit"]);
  assert.match(results[0].lines.map((l) => l.text).join(" "), /--confirm/);
  assert.equal(results[1].lines[0].kind, "err");
  assert.equal(results[2].lines[0].kind, "err");
  assert.match(results[4].lines.map((l) => l.text).join(" "), /from PDU-A1\/7 in Device42/, "moved, the power still to correct");
  sc.solution.slice(7).forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons.some((x) => /Deleting/.test(x)));
});

test("Intune ring: Windows Update by hand is not the ring, and a sync before the group changes nothing", () => {
  const sc = byId["intune-ring-stuck"];
  const reg = sc.solution[8];
  const { sess, results } = play(sc, ["onsite windows-update", "Connect-MgGraph", "Sync-MgDeviceManagementManagedDevice -ManagedDeviceId x", reg]);
  assert.equal(sess.state.updated, false);
  assert.match(txt(results[3]), /No update policy/);
  sc.solution.slice(1).forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("iDRAC alerts: a reset keeps the settings, the test email needs SMTP and an address, and the test event needs every destination", () => {
  const sc = byId["idrac-no-alerts"];
  const { sess, results } = play(sc, ["racadm racreset", "racadm get iDRAC.IPMILan.AlertEnable", "racadm testemail -i 1", "racadm eventfilters test -i PSU0003", "racadm foo"]);
  assert.match(results[1].lines.map((l) => l.text).join(" "), /AlertEnable=Disabled/);
  assert.equal(results[2].lines[0].kind, "err");
  assert.equal(sess.state.eventTested, false);
  assert.equal(results[4].lines[0].text, "ERROR: Invalid subcommand specified.", "unknown commands answer like the racadm>> prompt");
  sc.solution.slice(5, 11).forEach((c) => E.run(sess, c));
  E.run(sess, "racadm eventfilters test -i PSU0003");
  assert.ok(sess.resolved);
});

test("UPS runtime: unplugging leaves 9 minutes, an old battery cannot be calibrated, and the battery alone gives 11", () => {
  const sc = byId["ups-runtime-low"];
  const { sess, results } = play(sc, ["onsite unplug", "ups status UPS-HTL-01", "ups calibrate UPS-HTL-01", "onsite fit-battery", "ups replace-battery UPS-HTL-01", "onsite fit-battery", "onsite move-to-group1", "ups calibrate UPS-HTL-01"]);
  assert.match(results[1].lines.map((l) => l.text).join(" "), /9 min/);
  assert.equal(results[2].lines[0].kind, "err");
  assert.match(txt(results[3]), /no battery kit/);
  assert.match(results[7].lines.map((l) => l.text).join(" "), /11 min/);
  assert.equal(sess.resolved, false, "group 1 does not shed yet");
  ["ups outlet-group UPS-HTL-01 --group 1 --shed-after 2m", "ups calibrate UPS-HTL-01"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("Zabbix: watching the screen is a remark, a Warning trigger is never sent, and the test needs the template trigger", () => {
  const sc = byId["zabbix-pos-down"];
  const { sess, results } = play(sc, ["onsite watch-screen", "zbx trigger create --template \"Contoso Restaurant ICMP\" --name x --expression \"max(/Contoso Restaurant ICMP/icmpping,#3)=0\" --severity warning",
    "onsite pull-cable", "zbx problems --host TPV-RIB-01"]);
  assert.match(txt(results[1]), /High and above/);
  assert.match(txt(results[2]), /silent/);
  assert.match(results[3].lines.map((l) => l.text).join(" "), /No problems/);
  sc.solution.slice(6).forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons.some((x) => /watch/.test(x)));
});

test("Omada: a new password is a remark, and the VLAN alone still lets guests reach the PMS", () => {
  const sc = byId["omada-guest-wifi"];
  const { sess, results } = play(sc, ["omada wlan set Ribera-Guests --password Nuevo-2026", "onsite guest-test", "omada wlan set Ribera-Guests --vlan 63", "onsite guest-test"]);
  assert.match(results[1].lines.map((l) => l.text).join(" "), /10\.20\.61\.163/);
  assert.match(results[3].lines.map((l) => l.text).join(" "), /PMS login page/);
  assert.equal(sess.state.tested, false);
  ["omada wlan set Ribera-Guests --guest-network on", "onsite guest-test", "omada clients --ssid Ribera-Guests"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons.some((x) => /password/.test(x)));
});

test("AD report: lastLogon lists active people and is a remark, and LastLogonDate without the property lists everyone", () => {
  const sc = byId["ps-ad-weekly-report"];
  const { sess, results } = play(sc, [sc.solution[1], "(Get-Content .\\Weekly-ADReport.ps1) -replace 'lastLogonTimestamp', 'lastLogon' | Set-Content .\\Weekly-ADReport.ps1", sc.solution[1],
    "(Get-Content .\\Weekly-ADReport.ps1) -replace '\\$_\\.lastLogonTimestamp', '$_.LastLogonDate' | Set-Content .\\Weekly-ADReport.ps1", sc.solution[1]]);
  assert.match(results[0].lines[0].text, /Could not compare/);
  assert.match(results[2].lines.map((l) => l.text).join(" "), /Inactive \(90 days\)\s+: 41/);
  assert.match(results[4].lines.map((l) => l.text).join(" "), /Inactive \(90 days\)\s+: 312/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons.some((x) => /lastLogon/.test(x)));
});

test("Server RMA: Dell asks for the collection, the reseller's PSU stays amber, and no disk can be swapped before the case", () => {
  const sc = byId["server-psu-rma"];
  const { sess, results } = play(sc, ["dell case open --tag 7XKQ2M3", "racadm supportassist uploadlastcollection", "onsite order-parts", "onsite fit-psu", "racadm getsensorinfo", "onsite swap-disk"]);
  assert.match(results[0].lines.map((l) => l.text).join(" "), /asks for a SupportAssist collection/);
  assert.equal(results[1].lines[0].kind, "err");
  assert.match(results[4].lines.map((l) => l.text).join(" "), /Input lost/);
  assert.match(txt(results[5]), /no replacement/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "hardware", minutes: 5 }).reasons.some((x) => /before the diagnosis/.test(x)));
});

test("Apache: deleting the default page shows 'Index of /' and is a remark, and enabling the site needs a reload", () => {
  const sc = byId["apache-default-page"];
  const { sess, results } = play(sc, ["rm /var/www/html/index.html", "sudo rm /var/www/html/index.html", "curl -s http://reservas.contoso.local | grep -i '<title>'", "sudo a2ensite reservas", "onsite open"]);
  assert.equal(results[0].lines[0].kind, "err");
  assert.match(results[2].lines[0].text, /Index of/);
  assert.match(txt(results[4]), /Index of/);
  ["sudo systemctl reload apache2", "curl -s http://reservas.contoso.local | grep -i '<title>'", "onsite open"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 5 }).reasons.some((x) => /index\.html/.test(x)));
});

/* ---------- v0.14: career level 3, part 3 */
const verdictOf = (sc, sess) => E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: sc.codes[0], minutes: 5 });

test("Zabbix agent: the agent runs but rejects the new server, a fix needs a restart, and taking the host out of its group is a remark", () => {
  const sc = byId["zabbix-agent-unreachable"];
  const { sess, results } = play(sc, ["zbx host groups DOCS-LNX01 --remove \"Linux servers\"", "systemctl status zabbix-agent2", "tail /var/log/zabbix/zabbix_agent2.log", sc.solution[3], sc.solution[5], "zbx host DOCS-LNX01"]);
  assert.match(txt(results[1]), /active \(running\)/);
  assert.equal(results[2].lines[0].kind, "err", "the log needs sudo");
  assert.match(txt(results[3]), /rejected, allowed hosts: "10\.20\.9\.60"/);
  assert.match(txt(results[5]), /unavailable/, "not until the agent is restarted");
  sc.solution.slice(6).forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /Linux servers/.test(x)));
});

test("Hotspot: the second device is refused, a free trial is a remark, and unknown commands answer like RouterOS", () => {
  const sc = byId["hotspot-vouchers"];
  const { sess, results } = play(sc, ["/ip hotspot profile set hsprof-guests login-by=http-chap,trial", "onsite voucher 214", "/ip hotspot user profile set guest-2026 shared-users=1", "onsite voucher 214", "foo"]);
  assert.match(txt(results[1]), /no more sessions/);
  assert.match(txt(results[3]), /no more sessions/);
  assert.equal(results[4].lines[0].text, "bad command name foo (line 1 column 1)");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /trial/.test(x)));
});

test("GPO MSI: a restart before the permissions changes nothing, and installing by hand is a remark", () => {
  const sc = byId["gpo-msi-not-installed"];
  const { sess, results } = play(sc, ["onsite restart", sc.solution[1], "onsite install-by-hand", "onsite open"]);
  assert.match(txt(results[0]), /No Contoso Firma/);
  assert.match(txt(results[1]), /Access is denied/);
  assert.equal(sess.state.userOk, false, "a copy by hand is not the deployment");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /by hand/.test(x)));
});

test("Aruba voice VLAN: VLAN 30 untagged moves the PC too, the policy on a few ports is not enough, and the fix needs saving", () => {
  const sc = byId["aruba-voice-vlan"];
  const { sess, results } = play(sc, ["configure", "vlan 30 untagged 12", "onsite phone 3.12", "lldp config 12 medTlvEnable network-policy"]);
  assert.match(txt(results[2]), /10\.20\.30\.90/);
  assert.match(txt(results[3]), /only some/);
  ["vlan 20 untagged 12", "lldp config 1-44 medTlvEnable network-policy", "onsite phone 3.12", "show mac-address vlan 30"].forEach((c) => E.run(sess, c));
  assert.equal(sess.resolved, false, "not saved");
  E.run(sess, "write memory");
  assert.ok(sess.resolved);
  assert.equal(verdictOf(sc, sess).reasons.some((x) => /untagged/.test(x)), false, "port 12 was put back");
});

test("CBW guest Wi-Fi: opening the SSID changes nothing, 'allowed vlan 50' without add breaks the AP, and unknown commands answer like IOS", () => {
  const sc = byId["wap-guest-portal"];
  const { sess, results } = play(sc, ["cbw wlan set Contoso-Visitas --security open", "onsite guest-phone", "configure terminal", "interface Gi1/0/24", "switchport trunk allowed vlan 50", "switchport trunk allowed vlan add 50", "onsite guest-phone", "foo"]);
  assert.match(txt(results[1]), /169\.254/);
  assert.match(txt(results[4]), /replaced/);
  assert.match(txt(results[6]), /169\.254/, "the AP lost VLANs 20 and 99");
  assert.equal(results[7].lines[0].text, "% Invalid input detected at '^' marker.");
  ["switchport trunk allowed vlan 20,50,99", "end", "write memory", "onsite guest-phone", "show mac address-table vlan 50"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /open/.test(x)));
});

test("Cacti: v1 has no 64-bit counters, the template needs v2c first, and rebuilding the poller cache keeps the graph flat", () => {
  const sc = byId["cacti-graph-flat"];
  const { sess, results } = play(sc, ["sudo -u www-data php /usr/share/cacti/cli/rebuild_poller_cache.php", sc.solution[4], sc.solution[7], sc.solution[8], "cacti graph 112 --today"]);
  assert.match(txt(results[1]), /noSuchName/);
  assert.equal(results[2].lines[0].kind, "err");
  assert.doesNotMatch(txt(results[4]), /871/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("Nagios: muting the till is a remark, and the edits only count once Nagios is reloaded", () => {
  const sc = byId["nagios-flapping"];
  const { sess, results } = play(sc, [TEMPTING_NAGIOS, sc.solution[4], sc.solution[5], sc.solution[8]]);
  assert.match(txt(results[0]), /really goes down/);
  assert.match(txt(results[3]), /HARD;1/, "not reloaded yet");
  ["sudo systemctl reload nagios", sc.solution[8]].forEach((c) => E.run(sess, c));
  assert.equal(sess.resolved, false, "the configuration was never checked");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /notifications/.test(x)));
});
const TEMPTING_NAGIOS = "printf \"[%lu] DISABLE_HOST_NOTIFICATIONS;TPV-T07-01\\n\" $(date +%s) > /usr/local/nagios/var/rw/nagios.cmd";

test("RDP: turning NLA off gives no right and is a remark, and the new group needs fresh Kerberos tickets", () => {
  const sc = byId["rdp-nla-denied"];
  const { sess, results } = play(sc, ["Invoke-Command -ComputerName PRT-SRV01 { Set-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp' -Name UserAuthentication -Value 0 }",
    "onsite rdp PRT-SRV01", "Add-ADGroupMember GG-Server-RDP -Members GG-IT-Admins", "onsite rdp PRT-SRV01"]);
  assert.match(txt(results[1]), /right to sign in/);
  assert.match(txt(results[3]), /Kerberos/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /Network Level Authentication/.test(x)));
});

test("Firewall GPO: turning the firewall off stays a local wish, and a local rule is ignored like the vendor's", () => {
  const sc = byId["firewall-gpo-app"];
  const { sess, results } = play(sc, ["Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False", "onsite scan", "New-NetFirewallRule -DisplayName x -Direction Inbound -LocalPort 8443 -Protocol TCP -Action Allow", "gpupdate /force", "onsite scan"]);
  assert.match(txt(results[1]), /not reachable/);
  assert.match(txt(results[2]), /local rule/);
  assert.match(txt(results[4]), /not reachable/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /firewall off/.test(x)));
});

test("Chrome GPO: reinstalling Chrome is a remark, and overwriting value 1 of the allowlist is one too", () => {
  const sc = byId["chrome-extension-gpo"];
  const set1 = sc.solution[5].replace("-ValueName 3", "-ValueName 1");
  const { sess, results } = play(sc, ["onsite reinstall-chrome", "onsite add-extension", set1]);
  assert.match(txt(results[1]), /Blocked/);
  assert.match(txt(results[2]), /replaced/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  const reasons = verdictOf(sc, sess).reasons;
  assert.ok(reasons.some((x) => /reinstalled/.test(x)) && reasons.some((x) => /overwritten/.test(x)));
});

test("NFS: a mount by hand is lost at the next reboot, and _netdev alone does not finish the fix", () => {
  const sc = byId["ubuntu-nfs-mount"];
  const { sess, results } = play(sc, ["sudo mount -a", "onsite invoices", "sudo reboot", "findmnt /srv/scans", "sudo sed -i 's/defaults/defaults,_netdev/' /etc/fstab", "sudo mount -a"]);
  assert.match(txt(results[1]), /37/);
  assert.match(txt(results[3]), /Nothing is mounted/);
  assert.match(txt(results[5]), /daemon-reload/);
  assert.equal(sess.state.nofail, false);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

/* v0.15: career level 4, part 1 */
test("Horizon: restarting the broker frees nothing, and the policy alone leaves the stale sessions", () => {
  const sc = byId["horizon-pool-error"];
  const { sess, results } = play(sc, ["Restart-Service wsbroker", "hvctl pool set CALL-W11 --logoff-after-disconnect 30", "onsite login"]);
  assert.match(txt(results[0]), /sessions live on the desktops/);
  assert.match(txt(results[2]), /currently busy/);
  E.run(sess, "hvctl sessions logoff CALL-W11 --state disconnected");
  ["hvctl pool show CALL-W11", "hvctl sessions CALL-W11", "hvctl pool show CALL-W11", "onsite login"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("Docker: docker restart and compose without the new password keep the old environment", () => {
  const sc = byId["docker-container-restarting"];
  const { sess, results } = play(sc, ["docker restart hr-portal", "cd /opt/hr-portal && docker compose up -d", "docker ps"]);
  assert.match(txt(results[0]), /environment the container was created with/);
  assert.match(txt(results[1]), /Running/);
  assert.match(txt(results[2]), /Restarting/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("ELK: restarting Elasticsearch changes nothing and is a remark; the events go to the old index", () => {
  const sc = byId["elk-no-logs"];
  const { sess, results } = play(sc, ["ssh elk01 sudo systemctl restart elasticsearch", "sudo systemctl restart elasticsearch", "onsite kibana"]);
  assert.match(txt(results[1]), /not found/);
  assert.match(txt(results[2]), /No results/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /Elasticsearch was restarted/.test(x)));
});

test("Hyper-V: the disk cannot grow, and resuming before the merge pauses the VM again", () => {
  const sc = byId["hyperv-checkpoint-disk"];
  const { sess, results } = play(sc, ["Resize-VHD -Path D:\\Hyper-V\\ZAR-MES01\\ZAR-MES01.vhdx -SizeBytes 2TB", "Resume-VM ZAR-MES01", "Get-VM ZAR-MES01"]);
  assert.equal(results[0].lines[0].kind, "err");
  assert.match(txt(results[2]), /Paused-Critical again/);
  assert.equal(E.run(sess, "Remove-Item D:\\Hyper-V\\ZAR-MES01\\x.avhdx").lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("NDES: the Contoso-Legacy key is a remark, and syncing before the root CA is assigned brings nothing", () => {
  const sc = byId["ndes-wifi-cert"];
  const { sess, results } = play(sc, ["onsite legacy", "onsite sync", "onsite wifi"]);
  assert.match(txt(results[1]), /nothing new/);
  assert.match(txt(results[2]), /Can't connect/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /Contoso-Legacy/.test(x)));
});

test("Landscape: unattended-upgrades is not the cause, a daytime window is refused and patching cannot stay off", () => {
  const sc = byId["landscape-patch-window"];
  const { sess, results } = play(sc, ["ssh wh-ubu-03 sudo systemctl disable --now unattended-upgrades", "lsctl profile set warehouse-auto --window 10:00-12:00", "lsctl profile disable warehouse-auto"]);
  assert.match(txt(results[0]), /not coming from it/);
  assert.equal(results[1].lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.equal(sess.resolved, false, "not resolved with the profile disabled");
  E.run(sess, "lsctl profile enable warehouse-auto");
  ["lsctl profile preview warehouse-auto", "lsctl computers --tag warehouse"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /unattended-upgrades/.test(x)));
});

test("vCenter: a new datastore leaves DS-PROD-01 full, and deleting every snapshot takes Operations' one too", () => {
  const sc = byId["vcenter-snapshot-aged"];
  const { sess, results } = play(sc, ["New-Datastore -VMHost VMH-01 -Name DS-PROD-02 -Path naa.600508b1001c3a2f -Vmfs", "Get-Datastore DS-PROD-01", "Get-VM | Get-Snapshot | Remove-Snapshot -Confirm:$false"]);
  assert.match(txt(results[1]), /97 %/);
  assert.match(txt(results[2]), /WMS01/);
  ["Get-VM | Get-Snapshot | Select VM,Name,Created,SizeGB,Description", "Get-Datastore DS-PROD-01"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  const reasons = verdictOf(sc, sess).reasons;
  assert.ok(reasons.some((x) => /WMS01/.test(x)) && reasons.some((x) => /spare LUN/.test(x)));
});

test("Nutanix: rebooting the node leaves the disk dead, and the spare only goes in once the disk is removed", () => {
  const sc = byId["nutanix-disk-failed"];
  const { sess, results } = play(sc, ["onsite restart", "onsite replace-disk", "ncc health_checks hardware_checks disk_checks run_all"]);
  assert.match(txt(results[0]), /still dead/);
  assert.match(txt(results[1]), /marked it ready to remove yet/);
  assert.match(txt(results[2]), /FAIL/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /resiliency at 0/.test(x)));
});

test("Purview: switching the label's encryption off does not open the copy already sent", () => {
  const sc = byId["purview-label-cant-open"];
  const { sess, results } = play(sc, ["Get-Label", "Connect-IPPSSession", "Set-Label -Identity Confidential-Internal -EncryptionEnabled $false", "onsite supplier", "onsite relabel"]);
  assert.equal(results[0].lines[0].kind, "err");
  assert.match(txt(results[3]), /credentials/);
  assert.match(txt(results[4]), /only have Public/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /Encryption was switched off/.test(x)));
});

test("Licences: an inherited E3 cannot be removed user by user, nor the user taken out of the synced store group", () => {
  const sc = byId["o365-wrong-licence"];
  const { sess, results } = play(sc, ["Connect-MgGraph", "Set-MgUserLicense -UserId rcampos@contoso.com -AddLicenses @() -RemoveLicenses @('05e9a617-0261-4cee-bb44-138d3ef5d965')",
    "Remove-MgGroupMemberByRef -GroupId c41d8e27-5b9a-4f63-b210-8e7a3d6c95f4 -DirectoryObjectId x"]);
  assert.match(txt(results[1]), /inherited from a group/);
  assert.match(txt(results[2]), /on-premises mastered/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("Citrix: the app is visible to the ward, but a local install cannot reach the database", () => {
  const sc = byId["citrix-clinical-app"];
  const { sess, results } = play(sc, ["onsite install-local", "onsite open", "onsite workspace"]);
  assert.match(txt(results[1]), /connection refused/);
  assert.match(txt(results[2]), /No apps available/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /installed locally/.test(x)));
});

test("RHEL: a reboot or a service restart only buys time; the update without a restart does nothing yet", () => {
  const sc = byId["rhel-slow-io"];
  const { sess, results } = play(sc, ["sudo reboot", "vmstat 1 5", "sudo dnf update contoso-reports", "vmstat 1 5", "sudo dnf update"]);
  assert.match(txt(results[1]), /swapping again/);
  assert.match(txt(results[3]), /4120/);
  assert.equal(results[4].lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /rebooted/.test(x)));
});

// v0.15: career level 4, part 2
test("Cluster patching: both nodes at once cuts the share, and the GPO needs both nodes moved before gpupdate", () => {
  const sc = byId["winserver-patch-cluster"];
  const { sess, results } = play(sc, ["Get-CauReport -ClusterName CL-ZAR-FS -Last", sc.solution[4], sc.solution[6], "Invoke-Command -ComputerName ZAR-FSN01,ZAR-FSN02 { Install-WindowsUpdate -AcceptAll -AutoReboot }"]);
  assert.equal(results[0].lines[0].kind, "err");
  assert.equal(sess.state.gpApplied, false, "one node moved is not enough");
  assert.match(txt(results[3]), /nine minutes/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /same time/.test(x)));
});

test("WAN QoS: a bigger bandwidth figure changes nothing, and MARK-LAN on the WAN side marks the wrong traffic", () => {
  const sc = byId["wan-site-slow"];
  const { sess, results } = play(sc, ["configure terminal", "interface Gi0/0/0", "bandwidth 50000", "service-policy input MARK-LAN", "end", "show policy-map interface Gi0/0/0", "onsite erp"]);
  assert.match(txt(results[2]), /still 20/);
  assert.equal(sess.state.lanFixed, false);
  assert.match(txt(results[5]), /0 packets/);
  assert.match(txt(results[6]), /Twelve seconds/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("SQL point in time: over production loses the morning, the copy needs new file names, and the import deletes again if left on", () => {
  const sc = byId["sql-restore-pit"];
  const pit = "Restore-DbaDatabase -SqlInstance SQL-ERP01 -Path \\\\FS01\\SQLBackup\\ERP_PROD -DatabaseName ERP_PROD_PIT -RestoreTime '2026-11-12 09:12:00'";
  const { sess, results } = play(sc, [pit, pit + " -ReplaceDbNameInFile", sc.solution[5], sc.solution[0]]);
  assert.equal(results[0].lines[0].kind, "err");
  assert.match(txt(results[2]), /1248 rows/);
  assert.match(txt(results[3]), /2964/, "the hourly import deleted them again");
  const over = play(sc, ["Restore-DbaDatabase -SqlInstance SQL-ERP01 -Path \\\\FS01\\SQLBackup\\ERP_PROD -RestoreTime '2026-11-12 09:12:00' -WithReplace"]).sess;
  assert.equal(over.state.overwritten, true);
  sc.solution.forEach((c) => E.run(over, c));
  assert.ok(over.resolved);
  assert.ok(verdictOf(sc, over).reasons.some((x) => /over production/.test(x)));
});

test("vSphere maintenance: one blocker removed is not enough, and powering the VMs off is a remark", () => {
  const sc = byId["vmware-host-maint"];
  const { sess, results } = play(sc, [sc.solution[5], "Set-VMHost VMH-02 -State Maintenance", "Move-VM SCADA-GW01 -Destination VMH-01", "Stop-VM -VM LIC-SRV01,SCADA-GW01 -Confirm:$false"]);
  assert.equal(results[1].lines[0].kind, "err");
  assert.match(txt(results[2]), /affinity rule/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /powered off/.test(x)));
});

test("Trading loop: reloading brings it back, BPDU Guard alone err-disables the port, and one port is not the floor", () => {
  const sc = byId["trading-switch-loop"];
  const { sess, results } = play(sc, ["reload", "show logging", "configure terminal", "interface Gi1/0/23", "spanning-tree bpduguard enable", "end", sc.solution[5], sc.solution[6], sc.solution[7], sc.solution[8], "end", "write memory", "show logging"]);
  assert.match(txt(results[1]), /13:02/);
  assert.match(txt(results[4]), /one socket/);
  assert.match(txt(results[12]), /err-disable/);
  assert.equal(sess.state.logOk, false, "the cable is still there");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /reloaded/.test(x)));
});

test("Tanium: a fleet reinstall never reaches the silent client, and a restart without removing the proxy changes nothing", () => {
  const sc = byId["tanium-stale-endpoint"];
  const { sess, results } = play(sc, ["tanium deploy reinstall-client --target \"All Windows\"", "Invoke-Command -ComputerName LAPTOP-0217 { Restart-Service 'Tanium Client' }", "tanium endpoint LAPTOP-0217"]);
  assert.match(txt(results[0]), /waiting \(not registered: LAPTOP-0217/);
  assert.match(txt(results[2]), /22 days/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /whole fleet/.test(x)));
});

test("Python report: the system pip is refused, a fresh token only fixes today, and the new code needs its dependency", () => {
  const sc = byId["python-report-fails"];
  const { sess, results } = play(sc, ["sudo pip install -r /opt/reports/requirements.txt", "sudo systemctl start refresh-token", "sudo systemctl start sales-report", "sudo -u reports git -C /opt/reports pull", "sudo systemctl start sales-report"]);
  assert.match(txt(results[0]), /externally-managed-environment/);
  assert.match(txt(results[2]), /next Monday/);
  assert.match(txt(results[4]), /tenacity/);
  assert.equal(sess.state.runOk, false);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("NTLM baseline: unlinking it does not undo the setting, and Kerberos needs the server's name", () => {
  const sc = byId["gpo-ntlm-pilot"];
  const { sess, results } = play(sc, ["Remove-GPLink -Name 'SEC - Baseline 2026' -Target 'OU=Servers,DC=contoso,DC=local'", "Invoke-GPUpdate -Computer FS01 -Force", "onsite scan", "mfp ALM-MFP-01 set smb-auth kerberos --realm CONTOSO.LOCAL", "mfp ALM-MFP-01 test-smb"]);
  assert.match(txt(results[1]), /stays set/);
  assert.match(txt(results[2]), /1102/);
  assert.match(txt(results[4]), /KDC_ERR_S_PRINCIPAL_UNKNOWN/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /unlinked/.test(x)));
});

test("Defender ASR: a local change is overridden, a folder or global exclusion is refused, and turning the rule off is a remark", () => {
  const sc = byId["defender-asr-block"];
  const { sess, results } = play(sc, [TEMPT_ASR, "onsite macro", "intune asr exclude --path \\\\fs01.contoso.local\\Contabilidad", "intune asr exclude --rule 92e97fa1-2edf-4476-bdd6-9dd0b4dddc7b --path \\\\fs01\\Contabilidad\\*", "intune asr rule 92e97fa1-2edf-4476-bdd6-9dd0b4dddc7b --mode off"]);
  assert.match(txt(results[0]), /come from Intune/);
  assert.match(txt(results[1]), /again/);
  assert.equal(results[2].lines[0].kind, "err");
  assert.equal(results[3].lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /turned off/.test(x)));
});
const TEMPT_ASR = "Invoke-Command -ComputerName PC-FIN-036 { Set-MpPreference -AttackSurfaceReductionRules_Ids 92e97fa1-2edf-4476-bdd6-9dd0b4dddc7b -AttackSurfaceReductionRules_Actions Disabled }";

test("Nginx 502: restarting reads the same file, the app answers on 8081, and the fix needs a test before it counts", () => {
  const sc = byId["nginx-502"];
  const { sess, results } = play(sc, ["sudo systemctl restart nginx", "curl -I https://portal.contoso.local", "curl -s -I http://127.0.0.1:8081", sc.solution[4], "sudo systemctl reload nginx", "curl -I https://portal.contoso.local", "onsite portal"]);
  assert.match(txt(results[1]), /502/);
  assert.match(txt(results[2]), /200/);
  assert.match(txt(results[5]), /200/);
  assert.equal(sess.resolved, false, "nginx -t was never run");
  E.run(sess, "sudo nginx -t");
  assert.ok(sess.resolved);
});

test("IIS 503: iisreset and a new password for the old account leave the pool down", () => {
  const sc = byId["iis-503"];
  const { sess, results } = play(sc, ["iisreset", "Set-ADAccountPassword svc-intranet -Reset", "Start-WebAppPool IntranetPool", "Invoke-WebRequest https://intranet.contoso.local -UseBasicParsing", sc.solution[6], "Start-WebAppPool IntranetPool"]);
  assert.match(txt(results[1]), /old one/);
  assert.match(txt(results[2]), /5021/);
  assert.equal(results[3].lines[0].kind, "err");
  assert.equal(results[5].lines[0].kind, "err", "the gMSA is tested first");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("WordPress plugin: recreating the containers keeps the plugin, WP-CLI needs --skip-plugins, and down -v is refused", () => {
  const sc = byId["wordpress-plugin-down"];
  const { sess, results } = play(sc, ["docker compose up -d --force-recreate", "curl -I https://www.contoso.com", "docker compose run --rm wpcli wp plugin list", "docker compose down -v"]);
  assert.match(txt(results[0]), /still there/);
  assert.match(txt(results[1]), /500/);
  assert.match(txt(results[2]), /readonly/);
  assert.equal(results[3].lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /recreated/.test(x)));
});

/* v0.15: career level 4, part 3 */
test("gMSA: a user account is denied logon as a service, and the group needs the computer's tickets purged", () => {
  const sc = byId["gmsa-service-fails"];
  const { sess, results } = play(sc, ["sc.exe config ContosoReportSvc obj= CONTOSO\\it.admin password= x", "Start-Service ContosoReportSvc", "Add-ADGroupMember GG-gMSA-Reports -Members RPT-WIN02",
    "Add-ADGroupMember GG-gMSA-Reports -Members RPT-WIN02$", "Test-ADServiceAccount gmsa-reports$"]);
  assert.match(txt(results[1]), /logon type/);
  assert.equal(results[2].lines[0].kind, "err");
  assert.match(txt(results[4]), /False/);
  E.run(sess, "sc.exe config ContosoReportSvc obj= CONTOSO\\gmsa-reports$");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("IIS first request: more memory changes nothing, and the fix only shows after a restart", () => {
  const sc = byId["iis-first-request-slow"];
  const { sess, results } = play(sc, ["onsite ram", "Restart-WebAppPool PedidosPool", "Measure-Command { Invoke-WebRequest https://pedidos.contoso.local -UseBasicParsing }"]);
  assert.match(txt(results[2]), /41\./);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /never short/.test(x)));
});

test("Restore test: recording it as passed early is a remark, and a dump without routines still fails the restore", () => {
  const sc = byId["db-restore-test"];
  const { sess, results } = play(sc, ["drtest pass stock", "sudo sed -i 's/--single-transaction/--single-transaction --routines/' /usr/local/sbin/db-dump.sh", "sudo systemctl start db-dump", "sudo /usr/local/sbin/restore-test.sh"]);
  assert.match(txt(results[0]), /evidence: \(none\)/);
  assert.match(txt(results[3]), /FAILED/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /recorded as passed/.test(x)));
});

test("MySQL: a restart cuts the calls and is a remark; the index alone does not satisfy the booking centre", () => {
  const sc = byId["mysql-slow-queries"];
  const { sess, results } = play(sc, ["sudo systemctl restart mysql", "sudo mysql reservas -e \"CREATE INDEX idx_bookings_guest_email ON bookings (guest_email)\"", "onsite search"]);
  assert.match(txt(results[0]), /Lost connection/);
  assert.match(txt(results[2]), /Fifteen/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /restarted/.test(x)));
});

test("Double hop: CredSSP to * changes nothing and is a remark, and the delegation needs the tickets purged", () => {
  const sc = byId["ps-remoting-double-hop"];
  const { sess, results } = play(sc, ["Enable-WSManCredSSP -Role Client -DelegateComputer *", "Set-ADComputer FS01 -PrincipalsAllowedToDelegateToAccount (Get-ADComputer PRT-SRV01)", "C:\\Scripts\\Install-PrintDriver.ps1",
    "Set-ADComputer PRT-SRV01 -TrustedForDelegation $true"]);
  assert.match(txt(results[2]), /15 minutes/);
  assert.equal(results[3].lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /CredSSP/.test(x)));
});

test("Zabbix switch: a ping template brings no interfaces, and SNMPv2 gets no answer", () => {
  const sc = byId["zabbix-switch-snmp"];
  const { sess, results } = play(sc, ["zbx host template SW-ACC-5F --add \"ICMP Ping\"", "zbx discovery SW-ACC-5F --now", "zbx host snmp SW-ACC-5F --version 2 --community contoso-ro", "zbx latest SW-ACC-5F"]);
  assert.match(txt(results[1]), /not supported/);
  assert.doesNotMatch(txt(results[3]), /Interface/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("Zabbix services: removing the exclusion first floods the on-call phone and is a remark", () => {
  const sc = byId["zabbix-service-down"];
  const { sess, results } = play(sc, ["zbx action condition \"Notify IT on-call\" --remove B", "onsite review", "zbx template macro \"Contoso Windows\" --set '{$SERVICE.STARTUPTYPE.MATCHES}=.*'"]);
  assert.match(txt(results[0]), /214/);
  assert.match(txt(results[1]), /muted/);
  assert.equal(results[2].lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /214/.test(x)));
});

test("Zabbix UPS: disabling the host frees the iDRAC but leaves the UPS unwatched, and the card needs the community Zabbix uses", () => {
  const sc = byId["zabbix-ups-ipmi"];
  const { sess, results } = play(sc, ["zbx host disable UPS-SALA-A", "onsite psu-test", "nmc UPS-SALA-A snmp set --v1 enable --community public --access read --nms 10.20.1.60", "zbx host delete UPS-SALA-A"]);
  assert.match(txt(results[1]), /isn't in Zabbix/);
  assert.equal(results[2].lines[0].kind, "err");
  assert.equal(results[3].lines[0].kind, "err");
  E.run(sess, "zbx host enable UPS-SALA-A");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("Cisco AAA: no aaa new-model leaves only the shared account, and RADIUS back without a fallback is not enough", () => {
  const sc = byId["cisco-aaa-lockout"];
  const { sess, results } = play(sc, ["configure terminal", "no aaa new-model", "end", "onsite ssh", "onsite start-nps", "configure terminal", "aaa new-model", "end", "onsite ssh", "reload"]);
  assert.match(txt(results[3]), /Only netadmin/);
  assert.match(txt(results[8]), /locked out again/);
  assert.equal(results[9].lines[0].kind, "err");
  assert.equal(sess.resolved, false);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("Port-channel: shutting the member down hides it and keeps 1 Gb; the VLAN on another interface changes nothing", () => {
  const sc = byId["cisco-portchannel-member"];
  const { sess, results } = play(sc, ["configure terminal", "interface Gi1/0/48", "shutdown", "end", "show etherchannel summary", "onsite copy", "configure terminal", "interface Gi1/0/47", "switchport trunk allowed vlan add 50"]);
  assert.match(txt(results[4]), /Gi1\/0\/48\(D\)/);
  assert.match(txt(results[5]), /Nine/);
  assert.match(txt(results[8]), /already has the right list/);
  E.run(sess, "end");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("WireGuard: opening the firewall changes nothing and is a remark; allowed-address without head office is refused", () => {
  const sc = byId["mikrotik-wireguard"];
  const { sess, results } = play(sc, ["/ip firewall filter add chain=forward action=accept place-before=0", "/ping 10.20.1.88 count=3", "/interface wireguard peers set 0 allowed-address=10.255.0.1/32"]);
  assert.match(txt(results[1]), /packet-loss=100%/);
  assert.equal(results[2].lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /firewall/.test(x)));
});

/* v0.15: career level 4, part 4 */
test("pfSense: a rule to the WAN address never matches and is a remark; pass any to any is refused", () => {
  const sc = byId["pfsense-nat-rule"];
  const { sess, results } = play(sc, ["fwctl rule add wan pass any to \"WAN address\"", "grep 8443 /var/log/filter.log", "onsite channel", "fwctl rule add wan pass any any"]);
  assert.match(txt(results[1]), /block,in/);
  assert.equal(results[3].lines[0].kind, "err");
  assert.equal(sess.state.userOk, false);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /WAN address/.test(x)));
});

test("OPNsense: a firewall rule changes nothing, IPS off downloads but does not resolve, and the exception needs apply", () => {
  const sc = byId["opnsense-ips-block"];
  const { sess, results } = play(sc, ["fwctl rule add lan pass tcp from LAN to 198.51.100.25 port 80", "onsite update", "ipsctl ips off", "onsite update", "ipsctl rule 2018959 --action alert"]);
  assert.equal(sess.state.userOk, false);
  assert.equal(results[4].lines[0].kind, "err");
  E.run(sess, "ipsctl ips on");
  E.run(sess, "ipsctl userrule add --action pass --src 198.51.100.25 --desc x");
  E.run(sess, "onsite update");
  assert.equal(sess.state.userOk, false, "not applied yet");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /IPS was switched off/.test(x)));
});

test("FreeRADIUS: a restart keeps the expired certificate, the certificate without its key will not start, and WPA2-Personal is a remark", () => {
  const sc = byId["radius-peap-fail"];
  const { sess, results } = play(sc, ["sudo systemctl restart freeradius", "sudo eapol_test -c /root/peap-test.conf -s testing123", "sudo cp /root/certs/radius-2027.pem /etc/freeradius/3.0/certs/server.pem",
    "sudo systemctl restart freeradius", "wlc ssid Contoso-Corp --security wpa2-psk --psk Welcome2026"]);
  assert.match(txt(results[1]), /FAILURE/);
  assert.equal(results[3].lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.equal(sess.resolved, false, "the laptops cannot join a shared key network");
  E.run(sess, "wlc ssid Contoso-Corp --security wpa2-enterprise");
  E.run(sess, "onsite connect");
  assert.ok(sess.resolved);
});

test("Asterisk: a restart is refused again, and the portal alone registers the trunk with no audio", () => {
  const sc = byId["asterisk-trunk-down"];
  const { sess, results } = play(sc, ["sudo systemctl restart asterisk", "sudo asterisk -rx \"pjsip show registrations\"", "voipportal trunk set --allowed-ip 203.0.113.77",
    "sudo asterisk -rx \"pjsip send register trunk-voip\"", "onsite call"]);
  assert.match(txt(results[1]), /Rejected/);
  assert.equal(sess.state.registered, true);
  assert.equal(sess.state.userOk, false, "no audio with the old external address");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /restarted/.test(x)));
});

test("Audit: the laptop never has 4740, the legacy setting is ignored, and unlocking before the source is removed does not hold", () => {
  const sc = byId["audit-4740-missing"];
  const { sess, results } = play(sc, ["Get-WinEvent -ComputerName LAPTOP-0217 -FilterHashtable @{LogName='Security';Id=4740}", "gpoctl legacy-audit \"Default Domain Controllers Policy\" --category \"Audit account management\" --success --failure",
    "gpoctl eventlog \"Default Domain Controllers Policy\" --log Security --max-size 20MB", "gpupdate /force", "auditpol /get /subcategory:\"User Account Management\"", "Unlock-ADAccount jruiz"]);
  assert.equal(results[0].lines[0].kind, "err");
  assert.match(txt(results[1]), /ignored/);
  assert.equal(results[2].lines[0].kind, "err");
  assert.match(txt(results[4]), /No Auditing/);
  assert.equal(sess.state.unlocked, false);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /laptop/.test(x)));
});

test("Domain time: Set-Date lasts seconds, a resync with the host provider changes nothing, and the PDC needs its own peers", () => {
  const sc = byId["ad-time-skew"];
  const { sess, results } = play(sc, ["Set-Date (Get-Date).AddMinutes(7)", "w32tm /stripchart /computer:DC01 /samples:3 /dataonly", "Restart-Service w32time", "w32tm /query /source",
    "w32tm /config /manualpeerlist:\"0.es.pool.ntp.org,0x8\" /syncfromflags:manual /update"]);
  assert.match(txt(results[1]), /\+421/);
  assert.match(txt(results[3]), /VM IC/);
  assert.equal(results[4].lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("Signed script: Bypass loses to the GPO, Set-ExecutionPolicy is overridden, and Bypass left in the task is a remark", () => {
  const sc = byId["ps-unsigned-script"];
  const { sess, results } = play(sc, ["Set-ExecutionPolicy Bypass", TEMPT_BYPASS, "Start-ScheduledTask -TaskName 'Contoso - Export timesheets'", "Get-ScheduledTaskInfo -TaskName 'Contoso - Export timesheets'", "Set-AuthenticodeSignature C:\\Scripts\\Export-Timesheets.ps1 $cert"]);
  assert.match(txt(results[0]), /overridden by a policy/);
  assert.match(txt(results[2]), /Bypass/);
  assert.match(txt(results[3]), /LastTaskResult\s+: 1/);
  assert.equal(results[4].lines[0].kind, "err", "no certificate in $cert yet");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /Bypass/.test(x)));
});
const TEMPT_BYPASS = "schtasks /change /tn \"Contoso - Export timesheets\" /tr \"powershell.exe -ExecutionPolicy Bypass -File C:\\Scripts\\Export-Timesheets.ps1\"";

test("PowerCLI: nothing before connecting, Format-Table to a file is text, and a CSV without the columns is not accepted", () => {
  const sc = byId["powercli-report"];
  const { sess, results } = play(sc, ["Get-VM", "Connect-VIServer vcenter01.contoso.local", "Get-VM | Format-Table | Out-File C:\\Audit\\VM-inventory.csv", "onsite send",
    "Get-VM | Select-Object Name,PowerState | Export-Csv C:\\Audit\\VM-inventory.csv", "Import-Csv C:\\Audit\\VM-inventory.csv", "onsite send"]);
  assert.equal(results[0].lines[0].kind, "err");
  assert.match(txt(results[5]), /#TYPE/);
  assert.equal(sess.state.userOk, false);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("ESXi: reconnecting fails while tmp is full, starting vpxa first does not last, and removing the host costs a relink", () => {
  const sc = byId["esxi-not-responding"];
  const { sess, results } = play(sc, ["Set-VMHost VMH-02 -State Connected", "ssh root@vmh-02 /etc/init.d/vpxa start", "ssh root@vmh-02 /etc/init.d/vpxa status", "Remove-VMHost VMH-02 -Confirm:$false", "Add-VMHost vmh-02.contoso.local -Location Contoso-DC -Force"]);
  assert.equal(results[0].lines[0].kind, "err");
  assert.match(txt(results[2]), /not running/);
  assert.equal(results[4].lines[0].kind, "err");
  ["ssh root@vmh-02 rm /tmp/vm-support-vmh-02-2026-11-11@17-38-02.tgz", "ssh root@vmh-02 /etc/init.d/vpxa start", "Add-VMHost vmh-02.contoso.local -Location Contoso-DC -Force", "Get-VMHost VMH-02", "onsite veeam"].forEach((c) => E.run(sess, c));
  assert.equal(sess.resolved, false, "the VMs came back with new IDs");
  E.run(sess, "onsite relink");
  E.run(sess, "onsite veeam");
  assert.ok(sess.resolved);
  const reasons = verdictOf(sc, sess).reasons;
  assert.ok(reasons.some((x) => /removed from the inventory/.test(x)) && reasons.some((x) => /support bundle/.test(x)));
});

test("Replication: /syncall again gives 8524 again, and the DC's own address first is refused", () => {
  const sc = byId["dc-no-replication"];
  const { sess, results } = play(sc, ["repadmin /syncall /AdeP", "repadmin /syncall /AdeP", "Set-DnsClientServerAddress -InterfaceAlias Ethernet0 -ServerAddresses 127.0.0.1,10.20.1.10"]);
  assert.match(txt(results[1]), /8524/);
  assert.equal(results[2].lines[0].kind, "err");
  assert.equal(sess.state.synced, false);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("Zabbix storm: disabling the action silences the line too and is a remark; the dependency gives one message", () => {
  const sc = byId["zabbix-alert-storm"];
  const { sess, results } = play(sc, ["zbx action disable \"Notify sites on-call\"", "zbx simulate --host FW-ZAR01 --unreachable", "zbx depend --group \"Zaragoza plant\" --on FW-ZAR01", "onsite review"]);
  assert.match(txt(results[1]), /nobody/);
  assert.equal(results[2].lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.equal(sess.resolved, false, "the action is still off");
  ["zbx action enable \"Notify sites on-call\"", "zbx simulate --host FW-ZAR01 --unreachable", "onsite review"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /disabled/.test(x)));
});

test("Sentinel: disabling the user changes no rule and is a remark, and the watchlist must exist before the rule uses it", () => {
  const sc = byId["sentinel-impossible-travel"];
  const { sess, results } = play(sc, ["Update-MgUser -UserId cmartin@contoso.com -AccountEnabled:$false", "sentinel rule edit \"Contoso - Impossible travel\" --exclude-watchlist ContosoEgress", "sentinel rule test \"Contoso - Impossible travel\" --last 7d"]);
  assert.equal(results[1].lines[0].kind, "err");
  assert.match(txt(results[2]), /23/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.equal(sess.resolved, false, "cmartin is still disabled");
  E.run(sess, "Update-MgUser -UserId cmartin@contoso.com -AccountEnabled:$true");
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /disabled/.test(x)));
});

test("Azure Monitor: a reinstalled agent still sends nothing; the association brings the heartbeat back", () => {
  const sc = byId["azmon-agent-silent"];
  const hb = sc.solution[0];
  const { sess, results } = play(sc, ["az connectedmachine extension create -g rg-stores-prod --machine-name APP-IIS01 -n AzureMonitorWindowsAgent", hb, "az monitor data-collection rule association create --name x --resource APP-IIS01"]);
  assert.match(txt(results[1]), /2026-11-06/);
  assert.equal(results[2].lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("CyberArk: a change fails until the OU delegation, a reset by hand breaks the vault and is a remark, and Domain Admins is refused", () => {
  const sc = byId["cyberark-cpm-fails"];
  const { sess, results } = play(sc, ["pvwa account change svc-erp-batch", "Set-ADAccountPassword svc-erp-batch -Reset", "pvwa account verify svc-erp-batch", "Add-ADGroupMember \"Domain Admins\" -Members svc-cpm-ad"]);
  assert.match(txt(results[0]), /Access is denied/);
  assert.match(txt(results[2]), /1326/);
  assert.equal(results[3].lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /by hand/.test(x)));
});

test("OpenShift: five replicas still have no endpoints, and the selector must match the pods' labels", () => {
  const sc = byId["openshift-route-503"];
  const { sess, results } = play(sc, ["oc scale deployment/cc-api --replicas=5 -n stores-cc", "oc get endpoints cc-api -n stores-cc", "oc set selector svc/cc-api app=cc-api-v2 -n stores-cc", "curl -sI https://cc-api-stores-cc.apps.ocp01.contoso.local/health"]);
  assert.match(txt(results[1]), /<none>/);
  assert.equal(results[2].lines[0].kind, "err");
  assert.match(txt(results[3]), /503/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /5 replicas/.test(x)));
});

test("Voice line: the backup only works after the failover, the mobiles are a remark, and failing back early is refused", () => {
  const sc = byId["voice-line-bank"];
  const { sess, results } = play(sc, ["turret line test PW-MERIDIANO-FX", "onsite mobiles", "turret line failover PW-MERIDIANO-FX --to backup", "turret line failover PW-MERIDIANO-FX --to primary"]);
  assert.match(txt(results[0]), /No answer/);
  assert.equal(results[3].lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.equal(sess.state.mobiles, false, "the desk is back on the turrets");
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /mobiles/.test(x)));
});

test("RabbitMQ: a purge loses the orders until SaludNet resends them, and the 37 rejected ones need the shovel", () => {
  const sc = byId["rabbitmq-queue-growing"];
  const { sess } = play(sc, ["sudo rabbitmqctl -p clinic purge_queue lab.orders", "sudo systemctl start lab-bridge", sc.solution[5], "sudo rabbitmqctl -p clinic list_queues name messages consumers", "onsite lab"]);
  assert.equal(sess.state.labOk, false, "this morning's orders are gone");
  ["onsite resend", "onsite lab"].forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /purged/.test(x)));
  const up = play(sc, ["sudo systemctl start lab-bridge", "onsite lab"]).results;
  assert.match(txt(up[1]), /37/);
});

test("Elasticsearch: lifting the block by hand lasts one command, and deleting an index stays above the watermark", () => {
  const sc = byId["es-read-only"];
  const { sess, results } = play(sc, ["curl -X PUT 'localhost:9200/_all/_settings' -H 'Content-Type: application/json' -d '{\"index.blocks.read_only_allow_delete\": null}'", "curl -s 'localhost:9200/logs-*/_count?q=@timestamp:>now-5m'", "curl -X DELETE 'localhost:9200/.ds-logs-windows.security-default-2026.10.13-000001'", "curl -s localhost:9200/_cat/allocation?v"]);
  assert.ok(results[1].lines.some((l) => l.kind === "event" && /read-only again/.test(l.text)));
  assert.match(txt(results[1]), /"count":0/);
  assert.match(txt(results[3]), /\b92 /);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  const reasons = verdictOf(sc, sess).reasons;
  assert.ok(reasons.some((x) => /deleted by hand/.test(x)) && reasons.some((x) => /lifted by hand/.test(x)));
});

test("Puppet: a new key makes a new request with a new fingerprint, sign --all is refused, and signing unchecked is a remark", () => {
  const sc = byId["puppet-cert-agent"];
  const { results } = play(sc, ["sudo puppetserver ca list", "ssh pos-rpt01 sudo rm -rf /etc/puppetlabs/puppet/ssl", "sudo puppetserver ca list", "sudo puppetserver ca sign --all"]);
  assert.match(txt(results[0]), /4F:1A/);
  assert.match(txt(results[2]), /B7:22/);
  assert.equal(results[3].lines[0].kind, "err");
  const blind = play(sc, ["sudo puppetserver ca sign --certname pos-rpt01.contoso.local", "ssh pos-rpt01 sudo puppet agent -t", "ssh pos-rpt01 systemctl is-active zabbix-agent2"]).sess;
  assert.ok(blind.resolved, "it works, but nobody checked whose request it was");
  assert.ok(verdictOf(sc, blind).reasons.some((x) => /fingerprint/.test(x)));
});

test("PostgreSQL: a plain VACUUM removes nothing while the old transaction lives, VACUUM FULL is a remark, and a server-wide timeout is refused", () => {
  const sc = byId["postgres-bloat"];
  const q = (sql) => "sudo -u postgres psql -d erp -c \"" + sql + "\"";
  const { sess, results } = play(sc, [q("VACUUM (VERBOSE, ANALYZE) stock_movements"), q("VACUUM FULL stock_movements"), q("ALTER SYSTEM SET idle_in_transaction_session_timeout = '15min'")]);
  assert.match(txt(results[0]), /0 removed/);
  assert.equal(results[2].lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /VACUUM FULL/.test(x)));
});

test("z/OS: resubmitting unchanged abends again, the edit needs the downloaded file, and a small primary is refused", () => {
  const sc = byId["zos-batch-abend"];
  const { sess, results } = play(sc, ["zowe jobs submit data-set \"CONTOSO.PROD.JCL(CTBNITE)\"", "(Get-Content .\\CTBNITE.jcl) -replace 'CYL,\\(20,5\\)','CYL,(150,50),RLSE' | Set-Content .\\CTBNITE.jcl",
    "zowe zos-files download data-set \"CONTOSO.PROD.JCL(CTBNITE)\" -f CTBNITE.jcl", "(Get-Content .\\CTBNITE.jcl) -replace 'CYL,\\(20,5\\)','CYL,(40,10)' | Set-Content .\\CTBNITE.jcl"]);
  assert.match(txt(results[0]), /ABEND B37/);
  assert.equal(results[1].lines[0].kind, "err");
  assert.equal(results[3].lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /resubmitted/.test(x)));
});

test("Keycloak: the bind credential cannot be updated before the AD reset, and local accounts are a remark", () => {
  const sc = byId["keycloak-ldap-login"];
  const { sess, results } = play(sc, ["kcadm.sh create users -r contoso -s username=imontero.tmp -s enabled=true", "onsite login", sc.solution[4]]);
  assert.match(txt(results[1]), /no access/);
  assert.equal(results[2].lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /local accounts/.test(x)));
});

/* v0.15: career level 5, part 2 */
test("pfSense HA: switching the primary off takes the hotel offline, maintenance mode waits for the sync, and the test needs pfsync on both nodes", () => {
  const sc = byId["pfsense-carp-failover"];
  const { sess, results } = play(sc, ["fwctl carp maintenance enter", "ssh fw-htl02 ifconfig | grep carp", "shutdown -p now", "fwctl ha show", "onsite power"]);
  assert.equal(results[0].lines[0].kind, "err");
  assert.doesNotMatch(txt(results[1]), /carp: \w+ vhid 1/);
  assert.match(txt(results[3]), /timed out/);
  ["fwctl ha set sync-password", "fwctl ha sync", "fwctl carp maintenance enter"].forEach((c) => E.run(sess, c));
  assert.match(txt(E.run(sess, "onsite test")), /failed/, "without pfsync the open payment drops");
  E.run(sess, "fwctl carp maintenance leave");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /switched off/.test(x)));
});

test("Redfish: no update without an inventory, 7.00 skips the two oldest until they go through 6.10.80.00, and racadm by hand is a remark", () => {
  const sc = byId["redfish-firmware"];
  const { sess, results } = play(sc, ["rfbatch update -f idrac-hosts.txt --image firmware/iDRAC_7.00.00.172_A00.exe", "racadm -r 10.20.99.55 -u root -p ******** update -f iDRAC_7.00.00.172_A00.exe",
    "rfbatch inventory -f idrac-hosts.txt", "rfbatch update -f idrac-hosts.txt --image firmware/iDRAC_7.00.00.172_A00.exe", "rfbatch update -f idrac-hosts.txt --image firmware/iDRAC_6.10.80.00_A00.exe"]);
  assert.equal(results[0].lines[0].kind, "err");
  assert.match(txt(results[1]), /6\.00\.30\.00/);
  assert.match(txt(results[3]), /2 failed/);
  assert.equal(results[4].lines[0].kind, "err", "6.10.80.00 for all would downgrade four");
  assert.equal(sess.state.part7, true);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /by hand/.test(x)));
});

test("PowerChute: pairing fails until the card has the phrase, a late start is refused, and a second UPS is a remark", () => {
  const sc = byId["powerchute-shutdown"];
  const { sess, results } = play(sc, ["onsite buy", "pcns pair --nmc 10.20.99.30", "ups simulate-outage UPS-SALA-A", "pcns set onbattery --shutdown-after 900"]);
  assert.match(txt(results[1]), /does not match/);
  assert.match(txt(results[2]), /No PowerChute/);
  assert.equal(results[3].lines[0].kind, "err");
  ["ups pcns-phrase UPS-SALA-A", "pcns pair --nmc 10.20.99.30"].forEach((c) => E.run(sess, c));
  assert.match(txt(E.run(sess, "ups simulate-outage UPS-SALA-A")), /low battery/, "paired but still too late");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /second UPS/.test(x)));
});

test("Nginx: one node hides the lost sessions but is slow, a reload needs nginx -t, and ip_hash waits for WEB-RES02 back", () => {
  const sc = byId["nginx-balancer-sticky"];
  const { sess, results } = play(sc, ["sudo sed -i '/10.20.1.151/s/^/#/' /etc/nginx/conf.d/reservas.conf", "sudo systemctl reload nginx", "sudo nginx -t", "sudo systemctl reload nginx", "onsite test",
    sc.solution[3]]);
  assert.equal(results[1].lines[0].kind, "err");
  assert.match(txt(results[4]), /502/);
  assert.equal(results[5].lines[0].kind, "err");
  E.run(sess, "sudo sed -i '/10.20.1.151/s/^#//' /etc/nginx/conf.d/reservas.conf");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /WEB-RES02/.test(x)));
});

test("Grafana: a copy of the dashboard leaves the overview without Wrocław, and the group must exist before massadd", () => {
  const sc = byId["grafana-site-panel"];
  const { sess, results } = play(sc, ["gfctl dash copy sites-overview --title \"Sites overview WRO\" --group \"Plants/Wroclaw\"", "onsite check", "zbx hostgroup massadd --group \"Sites/WRO\" --from \"Plants/Wroclaw\""]);
  assert.match(txt(results[1]), /still missing/);
  assert.equal(results[2].lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /copy/.test(x)));
  const clean = play(sc, ["gfctl dash copy sites-overview --title x", "gfctl dash delete 7Hk2pQz"].concat(sc.solution)).sess;
  assert.deepEqual(verdictOf(sc, clean).reasons, [], "a deleted copy leaves nothing behind");
});

test("Fleet: the policy change alone reaches nobody, the old server alone keeps them on revision 7, and reinstalling is a remark", () => {
  const sc = byId["fleet-agent-offline"];
  const off = sc.solution[0];
  const { sess, results } = play(sc, ["onsite reinstall", "sudo systemctl start elastic-agent", "sudo systemctl stop elastic-agent", off, sc.solution[3], off]);
  assert.match(txt(results[1]), /revision 7/);
  assert.match(txt(results[3]), /"total": 15/);
  assert.match(txt(results[5]), /"total": 15/, "revision 8 waits for an agent that cannot check in");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /reinstalled/.test(x)));
});

test("Splunk: the events moved index, only the allowed list is not enough, and a bigger licence is a remark", () => {
  const sc = byId["splunk-source-missing"];
  const { sess, results } = play(sc, [sc.solution[0], "onsite licence", "curl -sk -u admin https://localhost:8089/services/authorization/roles/soc_analyst -d srchIndexesAllowed=netfw", "onsite search"]);
  assert.match(txt(results[0]), /netfw/);
  assert.match(txt(results[3]), /Still nothing/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /licence/.test(x)));
});

test("Azure costs: nothing is deleted before the owner answers, and reservations are a remark", () => {
  const sc = byId["azure-bill-spike"];
  const { sess, results } = play(sc, ["onsite reserve", "az group delete -n rg-loadtest-oct --yes", "az group exists -n rg-loadtest-oct"]);
  assert.equal(results[1].lines[0].kind, "err");
  assert.match(txt(results[2]), /true/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /reservations/.test(x)));
  assert.equal(E.run(sess, "az resource list -g rg-loadtest-oct -o table").lines[0].kind, "err", "the group is gone");
});

test("AWS: opening the security group changes no route and is a remark until it is closed again", () => {
  const sc = byId["aws-no-share"];
  const tnc = sc.solution[0];
  const { sess, results } = play(sc, ["aws ec2 authorize-security-group-ingress --group-id sg-0f1a2b3c4d5e6f708 --protocol -1 --cidr 0.0.0.0/0", tnc, "aws ec2 enable-vgw-route-propagation --route-table-id rtb-0000 --gateway-id vgw-0000"]);
  assert.match(txt(results[1]), /False/);
  assert.equal(results[2].lines[0].kind, "err");
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /open to the whole internet/.test(x)));
  E.run(sess, "aws ec2 revoke-security-group-ingress --group-id sg-0f1a2b3c4d5e6f708 --protocol -1 --cidr 0.0.0.0/0");
  assert.deepEqual(verdictOf(sc, sess).reasons, []);
});

test("Graph report: 16 workers fail sooner, and paging or Retry-After alone is not enough", () => {
  const sc = byId["graph-429-report"];
  const [, , , paging, retry] = sc.solution;
  const { sess, results } = play(sc, ["python3 devices_report.py --workers 16", "wc -l devices.csv", paging, "python3 devices_report.py"]);
  assert.match(txt(results[1]), /^215 /);
  assert.match(txt(results[3]), /2340 managed devices[\s\S]*429/);
  E.run(sess, retry);
  assert.match(txt(E.run(sess, "python3 devices_report.py --workers 16")), /Wrote 2340/);
  const r = play(sc, [retry, "python3 devices_report.py"]).results;
  assert.match(txt(r[1]), /Wrote 1000/);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
});

test("Windows 365: reprovisioning before the DNS is back fails again, everything at once is a remark, and $failed must exist", () => {
  const sc = byId["cloudpc-no-connect"];
  const { sess, results } = play(sc, ["$failed | % { Invoke-MgGraphRequest -Method POST -Uri \"beta/deviceManagement/virtualEndpoint/cloudPCs/$($_.Id)/reprovision\" }", "Get-MgBetaDeviceManagementVirtualEndpointCloudPc | % { Invoke-MgGraphRequest -Method POST -Uri \"beta/deviceManagement/virtualEndpoint/cloudPCs/$($_.Id)/reprovision\" }",
    sc.solution[7], "$failed = Get-MgBetaDeviceManagementVirtualEndpointCloudPc -Filter \"status eq 'failed'\"", sc.solution[9]]);
  assert.equal(results[0].lines[0].kind, "err");
  assert.match(txt(results[2]), /fail at the same point/);
  assert.equal(sess.state.reprovOk, false);
  sc.solution.forEach((c) => E.run(sess, c));
  assert.ok(sess.resolved);
  assert.ok(verdictOf(sc, sess).reasons.some((x) => /40 internal/.test(x)));
});
