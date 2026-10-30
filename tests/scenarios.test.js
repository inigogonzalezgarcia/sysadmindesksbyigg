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
  assert.equal(SCENARIOS.length, 24);
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
