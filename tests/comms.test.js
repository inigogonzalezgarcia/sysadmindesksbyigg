// Communication (v0.6a): contacting the requester (scripted questions, clues, SLA cost, timeline, confirmation after the fix)
// and the note for the user (five transparent rules), plus the communication result. The existing verdicts do not change.
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../public/assets/comms.js");
const W = require("../public/assets/workflow.js");
const E = require("../public/assets/engine.js");
const G = require("../public/assets/growth.js");
const SCENARIOS = require("../public/assets/scenarios.js");

const byId = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));
const MIN = 60000;
const T0 = Date.UTC(2026, 9, 30, 9, 0, 0);
const at = (m) => T0 + m * MIN;
const play = (sc, cmds, lang = "en") => { const s = E.createSession(sc, lang); cmds.forEach((c) => E.run(s, c)); return s; };

// one way into each desk's tempting fix (it must not resolve the ticket, and the requester must say it still fails)
const TEMPTING = {
  "ad-lockout": ["Unlock-ADAccount mgarcia"],
  "dns-intranet": ["ipconfig /flushdns"],
  "disk-full": ["cleanmgr"],
  "print-queue": ["Restart-Service Spooler"],
  "mailbox-full": ["Connect-ExchangeOnline", "Start-ManagedFolderAssistant cmartin"],
  "intune-bitlocker": ["Get-ScheduledTask | ? TaskName -eq PushLaunch | Start-ScheduledTask"],
  "vpn-anyconnect": ["msiexec /fa C:\\Temp\\cisco-secure-client-win-5.1.6.103-core-vpn-predeploy-k9.msi /qn"],
  "m365-licence": ["Connect-MgGraph", "Invoke-MgLicenseUser -UserId svidal@contoso.com"],
  "shared-mailbox": ["Connect-ExchangeOnline", "Add-RecipientPermission facturas -Trustee lperez@contoso.com -AccessRights SendAs -Confirm:$false"],
  "aadc-sync": ["Start-ADSyncSyncCycle -PolicyType Delta"],
  "veeam-job": ["Get-VBRJob -Name 'FS01 Nightly' | Start-VBRJob -RetryBackup"],
  "mecm-app": ["Update-CMDistributionPoint -ApplicationName 'Contoso Expenses' -DeploymentTypeName 'Expenses 4.2 MSI'"],
  "rhel-var-full": ["systemctl restart timesheets"],
  "citrix-session": ["Get-BrokerSession -UserName CONTOSO\\psanchez | Stop-BrokerSession"],
  "ca-blocked": ["Connect-MgGraph", "Revoke-MgUserSignInSession -UserId psanchez@contoso.com"],
  "sso-saml": ["Connect-MgGraph", "Add-MgServicePrincipalTokenSigningCertificate -ServicePrincipalId 3e9b7a21-6c4d-4f80-9a15-d2c8e07b4f6a"],
  "linux-sssd": ["systemctl restart sssd"],
  "sql-log-full": ["sqlcmd -S SQL-ERP01 -E -Q \"DBCC SHRINKFILE(2, 1024)\""],
  // v0.7a: the network desks (bounce the port with the switch still there; an IP typed on the printer; an any-any rule, tried and removed)
  "net-err-disabled": ["ssh SW-ACC-2F", "enable", "configure terminal", "interface Gi1/0/14", "shutdown", "no shutdown", "end", "exit"],
  "net-wrong-vlan": ["onsite printer static 10.20.3.43"],
  "net-fortigate-branch": ["ssh FGT-HQ-01", "config firewall policy", "edit 0", "set srcintf to-VLC", "set dstintf port1", "set srcaddr all", "set dstaddr all",
    "set service ALL", "set action accept", "next", "delete 14", "end", "exit"],
  // v0.7b: the shipment desks (a new laptop instead of the warranty; the alarm acknowledged; the laptop marked returned before it arrives)
  "laptop-rma": ["vendor order Latitude 7450"],
  "net-psu-rma": ["alarm ack"],
  "leaver-return": ["ship mark 3FJ7WR3 stock"],
  // v0.10: career level 0 (a damaged laptop checked into stock; a password reset on a disabled account; restarting Teams; restarting the room console)
  "new-laptops-intake": ["ship mark 7QV5HT4 stock"],
  "starter-desk-ready": ["Set-ADAccountPassword nprieto -Reset"],
  "teams-no-audio": ["Stop-Process -Name ms-teams -Force"],
  "room-no-display": ["Restart-Computer -ComputerName MTR-SALA2 -Force"],
  // v0.11: career levels 1-3 (a restart over a temporary profile; P: mapped by hand; local admin; a new account over the deleted one, then removed;
  // a fixed IP on one laptop; Full control for one user; a self-test that passes)
  "win-temp-profile": ["Restart-Computer -Force"],
  "gpo-drive-missing": ["net use P: \\\\FS01\\Proyectos /persistent:yes"],
  "epm-elevation": ["Add-LocalGroupMember -Group Administrators -Member AzureAD\\pherrero@contoso.com"],
  "ad-deleted-user": ["New-ADUser -Name 'Hugo Serrano' -SamAccountName hserrano -Path 'OU=Sales,OU=Users,DC=contoso,DC=local' -Enabled $true", "Remove-ADUser hserrano -Confirm:$false"],
  "dhcp-scope-full": ["onsite static 10.20.16.199"],
  "ntfs-access-denied": ["icacls D:\\Shares\\Contabilidad\\Cierres2026 /grant CONTOSO\\lperez:(OI)(CI)F"],
  "ups-no-alert": ["ups selftest UPS-RACKB"],
  // v0.12: career level 1 (Company Portal reinstalled; the iPhone retired and enrolled again; every store's group; the VPN client reinstalled;
  // a new roll of labels; the room restarted; only the password changed)
  "android-work-profile": ["onsite reinstall-portal"],
  "iphone-no-policies": ["Invoke-MgRetireDeviceManagementManagedDevice -ManagedDeviceId c5a81e2f-7d34-4b96-a0e2-5f19b3d6e870", "onsite enroll"],
  "retail-new-starter": ["Add-ADGroupMember GG-Stores-All -Members amedina"],
  "anyconnect-hotel": ["msiexec /fa C:\\Temp\\cisco-secure-client-win-5.1.6.103-core-vpn-predeploy-k9.msi /qn"],
  "store-label-printer": ["onsite new-roll", "onsite restart-printer"],
  "poly-room-no-camera": ["poly reboot G7500-CANTABRICO"],
  "mdm-lost-phone": ["Set-ADAccountPassword ribanez -Reset"],
  // v0.13: career level 2 (only the server name changed; the policy run again; a redeploy; the file deleted and restored; the POS reinstalled;
  // the cash count adjusted by hand; a new AS400 profile; SAP GUI reinstalled; the panel restarted; waiting for the operator; updates paused;
  // a fixed IP, then DHCP back on; the proxy off in the browser; inheritance blocked on the HR users' OU)
  "confluence-runbook-stale": ["confluence replace 4471 FS02 FS-NEW01"],
  "jamf-policy-not-running": ["sudo jamf policy"],
  "pdq-deploy-fails": ["pdq redeploy 1187 --failed"],
  "sharepoint-shared-everyone": ["Remove-PnPFile -ServerRelativeUrl \"/sites/Ventas/Shared Documents/Tarifas 2027/Tarifa-Norte-Distribucion-2027.xlsx\" -Recycle -Force",
    "Restore-PnPRecycleBinItem -Identity Tarifa-Norte-Distribucion-2027.xlsx -Force"],
  "pos-kitchen-printer": ["onsite reinstall-pos"],
  "cashdro-close-mismatch": ["hiopos cash-count --adjust 57,90"],
  "as400-user-disabled": ["CRTUSRPRF USRPRF(IREY2) PASSWORD(Temp1) PWDEXP(*YES)"],
  "sap-printer-sap": ["onsite reinstall-sapgui"],
  "crestron-room-teams": ["crestron reboot TSW-CONSEJO"],
  "store-4g-failover": ["onsite wait"],
  "win-update-rollback": ["Set-ItemProperty -Path HKLM:\\SOFTWARE\\Microsoft\\WindowsUpdate\\UX\\Settings -Name PauseUpdatesExpiryTime -Value 2026-11-18T00:00:00Z"],
  "tplink-dhcp-clash": ["New-NetIPAddress -InterfaceAlias Wi-Fi -IPAddress 192.168.10.150 -PrefixLength 24 -DefaultGateway 192.168.10.1", "Set-NetIPInterface -InterfaceAlias Wi-Fi -Dhcp Enabled"],
  "squid-blocked-site": ["onsite no-proxy"],
  "usb-blocked-camera": ["Set-GPInheritance -Target \"OU=HR,OU=Users,DC=contoso,DC=local\" -IsBlocked Yes"],
  // v0.14: career level 3, part 1 (the app's files deleted; a September copy from a Recycle Bin; the empty rows removed; the VM rebuilt; the spooler
  // restarted; the break-glass account; the node muted; the charges keyed in by hand; the TVs restarted; new tapes ordered; the test recorded as passed)
  "bash-disk-check": ["rm -rf /srv/docs-export/*"],
  "git-script-overwritten": ["onsite restore-recyclebin"],
  "ps-inventory-csv": ["Import-Csv C:\\Reports\\inventory.csv | Where-Object { $_.Serial } | Export-Csv C:\\Reports\\inventory-clean.csv -NoTypeInformation"],
  "ubuntu-ssh-locked": ["onsite rebuild"],
  "winserver-role-eventlog": ["Restart-Service Spooler"],
  "graph-report-mfa": ["Get-Secret -Name GA-BreakGlass -Vault IT"],
  "solarwinds-alert-storm": ["orion node mute SW-ALM-01"],
  "pms-room-charge": ["pms post-charge"],
  "iptv-no-channels": ["onsite reboot-tvs"],
  "tape-backup-unreadable": ["onsite order-tapes"],
  "veeam-restore-test": ["testlog mark FS01 passed"],
  // v0.14: career level 3, part 2 (the generic travel group; a permanent role; deleting the record; Windows Update by hand; resetting the iDRAC;
  // unplugging from the UPS; someone watching the screen; a new Wi-Fi password; lastLogon from one DC; parts before the diagnosis; deleting index.html)
  "ca-trading-block": ["Connect-MgGraph", "New-MgGroupMember -GroupId CA-Exception-Travel -DirectoryObjectId rlarrea@contoso.com"],
  "pim-role-expired": ["New-MgRoleManagementDirectoryRoleAssignment -RoleDefinitionId 29232cdf-9323-42fd-ade2-1d097af3e4de -PrincipalId 5a1e93c7-0d4b-4f62-a8e1-7c3b2d9f6e05 -DirectoryScopeId '/'"],
  "device42-rack-mismatch": ["d42 delete FS-SCAN01"],
  "intune-ring-stuck": ["onsite windows-update"],
  "idrac-no-alerts": ["racadm racreset"],
  "ups-runtime-low": ["onsite unplug"],
  "zabbix-pos-down": ["onsite watch-screen"],
  "omada-guest-wifi": ["omada wlan set Ribera-Guests --password Ribera-2026-Nov"],
  "ps-ad-weekly-report": ["(Get-Content .\\Weekly-ADReport.ps1) -replace 'lastLogonTimestamp', 'lastLogon' | Set-Content .\\Weekly-ADReport.ps1", ".\\Weekly-ADReport.ps1"],
  "server-psu-rma": ["onsite order-parts", "onsite fit-psu"],
  "apache-default-page": ["sudo rm /var/www/html/index.html"],
  // v0.14: career level 3, part 3 (the host out of its group; a free trial; installed by hand; the voice VLAN untagged; the SSID opened; the poller cache
  // rebuilt; notifications off; NLA off; the firewall off; Chrome reinstalled; mounted by hand)
  "zabbix-agent-unreachable": ["zbx host groups DOCS-LNX01 --remove \"Linux servers\""],
  "hotspot-vouchers": ["/ip hotspot profile set hsprof-guests login-by=http-chap,trial"],
  "gpo-msi-not-installed": ["onsite install-by-hand"],
  "aruba-voice-vlan": ["configure", "vlan 30 untagged 12"],
  "wap-guest-portal": ["cbw wlan set Contoso-Visitas --security open"],
  "cacti-graph-flat": ["sudo -u www-data php /usr/share/cacti/cli/rebuild_poller_cache.php"],
  "nagios-flapping": ["printf \"[%lu] DISABLE_HOST_NOTIFICATIONS;TPV-T07-01\\n\" $(date +%s) > /usr/local/nagios/var/rw/nagios.cmd"],
  "rdp-nla-denied": ["Invoke-Command -ComputerName PRT-SRV01 { Set-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp' -Name UserAuthentication -Value 0 }"],
  "firewall-gpo-app": ["Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False"],
  "chrome-extension-gpo": ["onsite reinstall-chrome"],
  "ubuntu-nfs-mount": ["sudo mount -a"],
};

test("every desk has 5-7 questions in both languages: at least 2 useful with a clue, 1 bad, and one confirmation", () => {
  assert.equal(Object.keys(TEMPTING).length, SCENARIOS.length);
  for (const sc of SCENARIOS) {
    const qs = C.questionsOf(sc);
    assert.ok(qs.length >= 5 && qs.length <= 7, `${sc.id}: ${qs.length} questions`);
    const ids = new Set();
    for (const q of qs) {
      assert.ok(!ids.has(q.id), `${sc.id}: duplicate question ${q.id}`);
      ids.add(q.id);
      assert.ok(C.KINDS.includes(q.kind), `${sc.id}/${q.id} kind`);
      for (const lang of ["en", "es"]) {
        assert.ok(q.text[lang] && q.answer[lang], `${sc.id}/${q.id} text and answer in ${lang}`);
        if (q.clue) assert.ok(q.clue[lang], `${sc.id}/${q.id} clue in ${lang}`);
        if (q.why) assert.ok(q.why[lang], `${sc.id}/${q.id} why in ${lang}`);
        if (q.requires) assert.ok(q.failed && q.failed[lang] && q.failed[lang] !== q.answer[lang], `${sc.id}/${q.id} a different answer when it fails, in ${lang}`);
      }
      if (q.kind === "bad") assert.ok(q.why, `${sc.id}/${q.id}: a bad question says why`);
      if (q.kind === "useful" && !q.requires) assert.ok(q.clue, `${sc.id}/${q.id}: a useful question reveals a clue`);
      if (q.kind !== "useful") assert.ok(!q.clue, `${sc.id}/${q.id}: only useful questions give clues`);
    }
    const plain = qs.filter((q) => !q.requires);
    assert.ok(plain.filter((q) => q.kind === "useful").length >= 2, sc.id + " 2+ useful");
    assert.ok(plain.filter((q) => q.kind === "neutral").length >= 1, sc.id + " 1+ neutral");
    assert.ok(plain.filter((q) => q.kind === "bad").length >= 1, sc.id + " 1+ bad");
    assert.ok(qs.some((q) => q.password && q.kind === "bad"), sc.id + ": asking for the password is one of the bad options");
    assert.equal(qs.filter((q) => q.requires === "fixed").length, 1, sc.id + ": one confirmation question");
    // the tempting fix refers to real command rules, and the flags to real state keys
    const rules = new Set(sc.commands.map((r) => r.id));
    for (const id of sc.contact.tempting || []) assert.ok(rules.has(id), `${sc.id}: tempting rule ${id} does not exist`);
    const keys = new Set(Object.keys(sc.state));
    for (const k of Object.keys(Object.assign({}, sc.contact.temptingWhen, sc.contact.fixed))) assert.ok(keys.has(k), `${sc.id}: key ${k} not in state`);
    for (const lang of ["en", "es"]) assert.ok(C.who(sc, lang).name && C.who(sc, lang).first, `${sc.id} who (${lang})`);
  }
});

test("asking adds one minute of SLA and a timeline entry, and stores the conversation in the ticket record", () => {
  const sc = byId["ad-lockout"];
  const sess = E.createSession(sc, "es");
  let rec = W.assign(null, at(0));
  const r = C.ask(rec, sess, "scan", { now: at(2), lang: "es" });
  assert.ok(r.ok);
  assert.notEqual(r.rec, rec, "a new record");
  assert.equal(rec.contact, undefined, "the old record is not changed");
  assert.equal(r.entry.kind, "useful");
  assert.match(r.entry.a, /escaneo a carpeta/);
  assert.match(r.entry.clue, /escaneo a carpeta de Finanzas/);
  rec = W.normalise(r.rec);   // what the app stores and reads back
  assert.equal(rec.extraMs, MIN);
  assert.deepEqual(rec.contact.asked.map((a) => a.id), ["scan"]);
  assert.deepEqual(rec.timeline[rec.timeline.length - 1], { at: at(2), from: "progress", to: "progress", contact: "scan" });
  assert.equal(W.slaMinutesUsed(rec, at(2)), 3, "2 minutes of work + 1 minute talking");
  assert.equal(C.ask(rec, sess, "scan", { now: at(3) }).error, "asked", "a question is asked once");
  assert.equal(C.ask(rec, sess, "nope", { now: at(3) }).error, "unknown");
  rec = C.ask(rec, sess, "password", { now: at(4) }).rec;
  rec = C.ask(rec, sess, "restart", { now: at(5) }).rec;
  assert.equal(W.slaMinutesUsed(W.normalise(rec), at(5)), 8);
  assert.deepEqual(C.clues(rec, sc, "en"), [sc.contact.questions.find((q) => q.id === "scan").clue.en], "only useful questions add clues");
  assert.equal(C.questionText(sc, "password", "es"), "¿Me dices tu contraseña nueva para probarla yo?");
  assert.deepEqual(C.summary(rec, sc), { asked: 3, useful: 1, neutral: 1, bad: 1, password: true, confirmed: null, minutes: 3 });
  // the SLA keeps the extra minutes through a pause and a resume, and the pause itself is still not counted
  let p = W.transition(rec, "pending-user", { now: at(6), reason: "Waiting for the user to come back" }).rec;
  p = W.transition(p, "progress", { now: at(16) }).rec;
  assert.equal(W.slaMinutesUsed(p, at(16)), 9);
  assert.equal(p.contact.asked.length, 3);
});

test("the requester cannot be contacted unless the ticket is assigned and in progress", () => {
  const sc = byId["dns-intranet"];
  const sess = E.createSession(sc, "en");
  assert.equal(C.ask(null, sess, "hotel", { now: at(0) }).error, "unassigned");
  const rec = W.assign(null, at(0));
  const pending = W.transition(rec, "pending-user", { now: at(1), reason: "Waiting for the user to call back" }).rec;
  assert.equal(C.ask(pending, sess, "hotel", { now: at(2) }).error, "pending");
  assert.equal(C.ask(W.transition(rec, "pending-vendor", { now: at(1), reason: "Waiting for the ISP to answer" }).rec, sess, "hotel", { now: at(2) }).error, "pending");
  const unassigned = W.transition(rec, "new", { now: at(1) }).rec;
  assert.equal(C.ask(unassigned, sess, "hotel", { now: at(2) }).error, "unassigned");
  assert.equal(C.ask(W.transition(rec, "closed", { now: at(1) }).rec, sess, "hotel", { now: at(2) }).error, "closed");
  assert.deepEqual(C.canContact(rec), { ok: true, reason: null });
  assert.equal(pending.extraMs, undefined, "a refused question costs nothing");
});

test("the confirmation question appears only after a fix, and the answer differs for the tempting fix and the real one", () => {
  for (const sc of SCENARIOS) {
    const confirm = C.questionsOf(sc).find((q) => q.requires === "fixed");
    const start = E.createSession(sc, "en");
    const rec0 = W.assign(null, at(0));
    assert.equal(C.confirmState(sc, start), null, sc.id + ": nothing to confirm at the start");
    assert.equal(C.questions(sc, start, rec0, "en").find((q) => q.id === confirm.id).available, false, sc.id + ": hidden at the start");
    assert.equal(C.ask(rec0, start, confirm.id, { now: at(1) }).error, "asked", sc.id + ": cannot be asked before the fix");

    const tempted = play(sc, TEMPTING[sc.id]);
    assert.ok(!tempted.resolved, sc.id + ": the tempting path does not resolve the ticket");
    assert.equal(C.confirmState(sc, tempted), "failed", `${sc.id}: tempting fix -> fails again (${JSON.stringify(tempted.state)})`);
    const r1 = C.ask(rec0, tempted, confirm.id, { now: at(2), lang: "en" });
    assert.ok(r1.ok, sc.id);
    assert.equal(r1.entry.result, "failed");
    assert.equal(r1.entry.a, confirm.failed.en);
    assert.equal(C.ask(r1.rec, tempted, confirm.id, { now: at(3) }).error, "asked", sc.id + ": no point asking again while it still fails");

    const fixed = play(sc, TEMPTING[sc.id].concat(sc.solution));
    assert.ok(fixed.resolved, sc.id + ": the solution still resolves it after the tempting fix");
    assert.equal(C.confirmState(sc, fixed), "ok", sc.id + ": fixed -> it works");
    const r2 = C.ask(r1.rec, fixed, confirm.id, { now: at(4), lang: "es" });
    assert.ok(r2.ok, sc.id + ": asked again once it works");
    assert.equal(r2.entry.a, confirm.answer.es);
    assert.equal(C.summary(r2.rec, sc).confirmed, "ok");
    assert.equal(C.ask(r2.rec, fixed, confirm.id, { now: at(5) }).error, "asked");

    const direct = play(sc, sc.solution);
    assert.equal(C.confirmState(sc, direct), "ok", sc.id + ": the reference solution counts as fixed");
  }
});

test("contacting never changes the console: the session, the verdict and the score are the same with or without questions", () => {
  for (const sc of SCENARIOS) {
    const a = play(sc, sc.solution);
    const b = play(sc, sc.solution);
    let rec = W.assign(null, at(0));
    for (const q of C.questions(sc, b, rec, "en").filter((x) => x.available)) rec = C.ask(rec, b, q.id, { now: at(1) }).rec;
    assert.deepEqual(b.state, a.state, sc.id);
    const note = E.checkNote(sc, sc.sampleNote.en, "en");
    const va = E.verdict(a, note, { code: sc.codes[0], minutes: 5 });
    const vb = E.verdict(b, note, { code: sc.codes[0], minutes: 5 });
    assert.deepEqual(vb, va, sc.id + " verdict unchanged");
    assert.deepEqual([va.level, va.points], ["resolved", 100], sc.id);
  }
});

/* ---------- the note for the user */
const GOOD_ES = "Hola Marta:\n\nYa está resuelto. El problema era que el escáner de Finanzas seguía usando tu contraseña antigua y cada pocos minutos la probaba, así que tu cuenta se bloqueaba sola.\n\nLo he desactivado y he desbloqueado tu cuenta. No tienes que hacer nada más. Si vuelve a pasar, responde a este mensaje.\n\nUn saludo,\nAlex";
const GOOD_EN = "Hi Marta,\n\nThis is now fixed. The problem was that the Finance scanner was still using your old password and kept trying it, so your account locked itself.\n\nI turned it off and unlocked your account. You don't need to do anything else. If it happens again, reply to this message.\n\nBest regards,\nAlex";
const ctx = { name: "Marta", device: "PC-FIN-021" };
const rule = (r, id) => r.rules.find((x) => x.id === id);

test("user note: a good note scores 5/5 in both languages", () => {
  for (const text of [GOOD_ES, GOOD_EN]) {
    const r = C.checkUserNote(text, ctx);
    assert.equal(r.score, 5, JSON.stringify(r.rules));
    assert.equal(r.max, 5);
    assert.deepEqual(r.rules.map((x) => x.id), C.RULES);
  }
  const empty = C.checkUserNote("   ", ctx);
  assert.equal(empty.score, 0);
  assert.equal(empty.empty, true);
});

test("user note rule: addresses the requester by name", () => {
  assert.equal(rule(C.checkUserNote(GOOD_ES, ctx), "name").ok, true);
  assert.equal(rule(C.checkUserNote(GOOD_ES.replace("Marta", "compañera"), ctx), "name").ok, false);
  assert.equal(rule(C.checkUserNote(GOOD_ES, { name: "Martín" }), "name").ok, false, "a whole word, not part of another name");
  assert.equal(rule(C.checkUserNote("Hola, ángela: " + GOOD_ES.slice(12), { name: "Ángela" }), "name").ok, true, "accents and case are ignored");
});

test("user note rule: says what was wrong in plain words; jargon is flagged unless explained", () => {
  assert.equal(rule(C.checkUserNote(GOOD_EN, ctx), "plain").ok, true);
  const noCause = C.checkUserNote("Hi Marta, I unlocked your account and turned off the scanner. You don't need to do anything else. If it happens again, reply to this message. Best regards, Alex", ctx);
  assert.equal(rule(noCause, "plain").ok, false);
  assert.deepEqual(rule(noCause, "plain").detail, ["cause"]);
  const jar = C.checkUserNote(GOOD_EN.replace("the Finance scanner", "a scheduled task in PowerShell with a stale Kerberos SPN"), ctx);
  assert.equal(rule(jar, "plain").ok, false);
  for (const w of ["powershell", "kerberos", "spn"]) assert.ok(rule(jar, "plain").detail.includes(w), w);
  assert.deepEqual(C.jargonIn("Restarted the spooler and cleared the DNS cache"), ["spooler", "dns"]);
  assert.deepEqual(C.jargonIn("Reinicié el spooler (el servicio que manda los trabajos a la impresora)."), [], "explained in brackets");
  assert.deepEqual(C.jargonIn("The DNS, that is the address book of the network, was wrong"), [], "explained with 'that is'");
  assert.deepEqual(C.jargonIn("Una GPO: una regla que aplica la empresa a los equipos"), [], "explained after a colon");
  assert.deepEqual(C.jargonIn("Your outlook works and the gpos are fine; the registry was edited"), ["registry"], "whole words only");
  assert.deepEqual(C.jargonIn("No pasa nada con tu ordenador"), []);
});

test("user note rule: says what the user has to do next, or that nothing is needed", () => {
  assert.equal(rule(C.checkUserNote(GOOD_ES, ctx), "next").ok, true);
  for (const s of ["No tienes que hacer nada.", "Por favor, reinicia el portátil.", "You don't need to do anything.", "Please restart Outlook.", "If it happens again, let us know."]) {
    assert.equal(rule(C.checkUserNote("Hola Marta, el problema era el escáner. " + s, ctx), "next").ok, true, s);
  }
  assert.equal(rule(C.checkUserNote("Hola Marta: el problema era que el escáner usaba tu contraseña antigua. Lo he desactivado y ya funciona bien desde las diez. Un saludo, Alex", ctx), "next").ok, false);
});

test("user note rule: no internal-only details (servers, admin accounts, passwords, private IPs, ids)", () => {
  assert.equal(rule(C.checkUserNote(GOOD_ES, ctx), "private").ok, true);
  assert.deepEqual(C.internalIn("La tarea de FS-SCAN01 usaba tu cuenta; lo arreglé desde ADM-WS01 con it.admin."), ["FS-SCAN01", "ADM-WS01", "it.admin"]);
  assert.deepEqual(C.internalIn("Tu contraseña temporal: Contoso2026! (cámbiala)"), ["contraseña temporal: Contoso2026!"]);
  assert.deepEqual(C.internalIn("The server 10.20.1.15 and DC01 and \\\\FS01\\SQLBackup"), ["DC01", "FS01", "10.20.1.15", "\\\\FS01\\SQLBackup"]);
  assert.deepEqual(C.internalIn("Recovery key 417263-090574-211628-558602-694408-303050-618926-147895"), ["417263-090574-211628-558602-694408-303050-618926-147895"]);
  assert.deepEqual(C.internalIn("svc-scan and the certificate 4C1E8A0D93F27B5C6E1D04A8B39F7C25D0E862B7"), ["svc-scan", "4C1E8A0D93F27B5C6E1D04A8B39F7C25D0E862B7"]);
  assert.deepEqual(C.internalIn("Ticket INC-20418, request REQ-7731, your laptop LAPTOP-0217, Wi-Fi", { device: "LAPTOP-0217" }), [], "ticket numbers and the user's own device are fine");
  assert.deepEqual(C.internalIn("The root cause was an old password"), [], "'root cause' is not the root account");
  assert.equal(rule(C.checkUserNote(GOOD_EN + " (Fixed on FS-SCAN01.)", ctx), "private").ok, false);
});

test("user note rule: ready to send: no template gaps and a reasonable length", () => {
  assert.deepEqual(C.placeholdersIn("Hola [nombre]: el problema era [qué pasaba]. [qué pasaba]"), ["[nombre]", "[qué pasaba]"]);
  assert.deepEqual(C.placeholdersIn(GOOD_ES), []);
  const tpl = C.template("resolved", "es", { name: "Marta", me: "Alex" });
  assert.match(tpl, /^Hola Marta:/);
  assert.match(tpl, /Alex$/);
  const r = C.checkUserNote(tpl, ctx);
  assert.equal(rule(r, "ready").ok, false, "an untouched template is not ready");
  assert.deepEqual(rule(r, "ready").detail, ["[qué pasaba, en palabras sencillas]", "[qué has cambiado]"]);
  const filled = tpl.replace("[qué pasaba, en palabras sencillas]", "el escáner de Finanzas seguía probando tu contraseña antigua").replace("[qué has cambiado]", "lo he desactivado y he desbloqueado tu cuenta");
  assert.equal(C.checkUserNote(filled, ctx).score, 5, JSON.stringify(C.checkUserNote(filled, ctx).rules));
  assert.equal(rule(C.checkUserNote("Hola Marta, el problema era el escáner. No tienes que hacer nada.", ctx), "ready").detail[0], "short");
  assert.equal(rule(C.checkUserNote(GOOD_EN + " " + "x".repeat(900), ctx), "ready").detail[0], "long");
  for (const tp of C.TEMPLATES) for (const lang of ["en", "es"]) {
    const s = C.template(tp.id, lang, { name: "Marta", me: "Alex" });
    assert.ok(C.placeholdersIn(s).length >= 1, `${tp.id}/${lang} has gaps to fill`);
    assert.equal(C.internalIn(s).length, 0);
    assert.equal(C.jargonIn(s).length, 0);
    assert.ok(tp.label[lang]);
  }
  const words = C.describe(C.checkUserNote(tpl + " PRT-SRV01 spooler", ctx), "en");
  assert.equal(words.length, 5);
  assert.ok(words.find((w) => w.id === "ready").problems.some((p) => p.startsWith("gap not filled in")));
  assert.ok(words.find((w) => w.id === "private").problems[0].includes("PRT-SRV01"));
  assert.ok(words.find((w) => w.id === "plain").problems[0].includes("spooler"));
});

test("communication result: a separate bonus and remarks; the password request is always a remark", () => {
  const good = C.checkUserNote(GOOD_EN, ctx);
  const sum = (o) => Object.assign({ asked: 0, useful: 0, neutral: 0, bad: 0, password: false, confirmed: null, minutes: 0 }, o);
  assert.deepEqual(C.evaluate(sum({ asked: 2, useful: 1, neutral: 1 }), good), { bonus: 8, userNote: 5,
    credits: [{ id: "note", points: 5 }, { id: "questions", points: 3, n: 1 }], remarks: [] });
  assert.equal(C.evaluate(sum({ asked: 3, useful: 2, confirmed: "ok" }), good).bonus, 10);
  const pw = C.evaluate(sum({ asked: 2, useful: 1, bad: 1, password: true }), good);
  assert.equal(pw.bonus, 5, "no credit for the questions after asking for the password");
  assert.deepEqual(pw.remarks, [{ id: "password" }]);
  assert.deepEqual(C.evaluate(sum({ bad: 2, password: true }), null).remarks, [{ id: "no-note" }, { id: "password" }, { id: "bad", n: 1 }]);
  assert.equal(C.evaluate(sum({}), C.checkUserNote("", ctx)).userNote, null, "an empty note is a missing note");
  assert.equal(C.evaluate(sum({}), C.checkUserNote(GOOD_EN.replace("Marta", "you"), ctx)).bonus, 3, "4/5 gives 3");
});

test("badge: Clear communicator after three different tickets with a 5/5 user note", () => {
  const b = G.BADGES.find((x) => x.id === "communicator");
  assert.ok(b && b.name.es && b.name.en && b.rule.es && b.rule.en);
  const f = (closes) => G.facts({ activity: closes.map((c) => Object.assign({ type: "ticket", day: "2026-10-30" }, c)), progress: {}, desks: [], kb: {}, mail: {} });
  assert.equal(b.test(f([{ id: "a", userNote: 5 }, { id: "a", userNote: 5 }, { id: "b", userNote: 5 }])), false);
  assert.equal(b.test(f([{ id: "a", userNote: 5 }, { id: "b", userNote: 4 }, { id: "c", userNote: 5 }])), false);
  assert.equal(b.test(f([{ id: "a", userNote: 5 }, { id: "b", userNote: 5 }, { id: "c", userNote: 5 }])), true);
  const s = G.commsStats([{ type: "ticket", id: "a", useful: 2, userNote: 5 }, { type: "ticket", id: "b", useful: 1, userNote: 3 }, { type: "ticket", id: "c" }, { type: "mail", id: "x" }]);
  assert.deepEqual(s, { useful: 3, notes: 2, average: 4 });
  assert.deepEqual(G.commsStats([]), { useful: 0, notes: 0, average: null });
});
