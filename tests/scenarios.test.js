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
  assert.equal(SCENARIOS.length, 56);
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
