/* SysAdmin Desks by IGG - labs by area (v0.8): free-practice sandboxes, with no SLA and no score. Each lab is a console with a short list
   of guided tasks that tick themselves from the lab's state. They reuse the engines of the simulator: the directory (world.js) for the
   AD lab, the device CLI (netcli.js) for the network lab, and the scenario engine (engine.js) with a small set of rules for the Windows,
   Microsoft 365 and Linux labs. Pure logic, no DOM: the app and the Node tests (tests/learning.test.js) use the same code.
   Progress (the tasks done) is kept in the browser like the rest of the growth data (sd.labs); the sandbox itself lives in the page. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./world.js"), require("./netcli.js"), require("./engine.js"));
  else root.SDLabs = factory(root.SDWorld, root.SDNet, root.SDEngine);
})(typeof self !== "undefined" ? self : this, function (Wd, NN, E) {
  "use strict";

  const t = (v, lang) => (v == null ? "" : typeof v === "string" ? v : v[lang] || v.en || "");
  const PS = "PS C:\\Users\\it.admin> ";

  /* ---------- the rules of the Windows, Microsoft 365 and Linux labs (engine.js format, see docs/scenario-format.md; {$1} is a captured group) */
  const DNS = { intranet: "10.20.1.15", erp: "10.20.1.52", fs01: "10.20.1.20", dc01: "10.20.1.10", dc02: "10.20.1.11", "prt-srv01": "10.20.1.30" };
  function dnsRules() {
    const out = [];
    Object.entries(DNS).forEach(([name, ip]) => {
      const fq = name + ".contoso.local";
      const re = `\\s+["']?${name.replace("-", "\\-")}(\\.contoso\\.local)?\\.?["']?(\\s|$)`;
      out.push({ match: `^nslookup${re}`, set: name === "intranet" ? { dnsSeen: true } : {},
        out: ["Server:  dc01.contoso.local", "Address:  10.20.1.10", "", "Name:    " + fq, "Address:  " + ip, ""],
        say: { en: "nslookup asks the DNS server directly: the PC's cache does not take part.", es: "nslookup pregunta directamente al servidor DNS: la caché del equipo no interviene." } });
      out.push({ match: `^resolve-dnsname${re}`, set: name === "intranet" ? { dnsSeen: true } : {},
        out: ["", "Name                                           Type   TTL   Section    IPAddress", "----                                           ----   ---   -------    ---------",
          (fq + " ".repeat(47)).slice(0, 47) + "A      1200  Answer     " + ip, ""] });
      out.push({ match: `^ping${re}`, out: ["", `Pinging ${fq} [${ip}] with 32 bytes of data:`, ...[1, 2, 3, 4].map(() => `Reply from ${ip}: bytes=32 time<1ms TTL=127`), "",
        `Ping statistics for ${ip}:`, "    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),", "Approximate round trip times in milli-seconds:", "    Minimum = 0ms, Maximum = 0ms, Average = 0ms"] });
      out.push({ match: `^test-netconnection${re.replace("(\\s|$)", "")}.*-port\\s+(\\d+)`, out: ["", "ComputerName     : " + fq, "RemoteAddress    : " + ip, "RemotePort       : {$2}",
        "InterfaceAlias   : Ethernet", "SourceAddress    : 10.20.14.131", "TcpTestSucceeded : " + (["intranet", "erp"].includes(name) ? "True" : "False"), ""] });
      out.push({ match: `^test-netconnection${re}`, out: ["", "ComputerName           : " + fq, "RemoteAddress          : " + ip, "InterfaceAlias         : Ethernet",
        "SourceAddress          : 10.20.14.131", "PingSucceeded          : True", "PingReplyDetails (RTT) : 0 ms", ""] });
    });
    return out;
  }
  const svc = (status, name, display) => ["", "Status   Name               DisplayName", "------   ----               -----------", (status + "         ").slice(0, 9) + (name + " ".repeat(19)).slice(0, 19) + display, ""];
  const WIN = {
    id: "lab-windows",
    machine: { host: "PC-LAB-01", user: "it.admin", domain: "CONTOSO", shell: "powershell", prompt: PS },
    state: { lab: false, ipSeen: false, dnsSeen: false, flushed: false, spoolerSeen: false, spoolerRestarted: false, spoolerStopped: false, diskSeen: false, eventsSeen: false },
    goal: { lab: true },
    commands: [
      { match: /^ipconfig\s+\/all\b/, set: { ipSeen: true }, out: ["", "Windows IP Configuration", "",
        "   Host Name . . . . . . . . . . . . : PC-LAB-01", "   Primary Dns Suffix  . . . . . . . : contoso.local", "   Node Type . . . . . . . . . . . . : Hybrid",
        "   IP Routing Enabled. . . . . . . . : No", "   WINS Proxy Enabled. . . . . . . . : No", "   DNS Suffix Search List. . . . . . : contoso.local", "",
        "Ethernet adapter Ethernet:", "", "   Connection-specific DNS Suffix  . : contoso.local", "   Description . . . . . . . . . . . : Intel(R) Ethernet Connection (16) I219-LM",
        "   Physical Address. . . . . . . . . : 6C-4B-90-42-1A-31", "   DHCP Enabled. . . . . . . . . . . : Yes", "   Autoconfiguration Enabled . . . . : Yes",
        "   IPv4 Address. . . . . . . . . . . : 10.20.14.131(Preferred)", "   Subnet Mask . . . . . . . . . . . : 255.255.255.0",
        "   Lease Obtained. . . . . . . . . . : Monday, 26 October 2026 08:02:11", "   Lease Expires . . . . . . . . . . : Tuesday, 3 November 2026 08:02:11",
        "   Default Gateway . . . . . . . . . : 10.20.14.1", "   DHCP Server . . . . . . . . . . . : 10.20.1.10", "   DNS Servers . . . . . . . . . . . : 10.20.1.10",
        "                                       10.20.1.11", "   NetBIOS over Tcpip. . . . . . . . : Enabled", ""],
        say: { en: "DHCP Enabled: Yes, and the address, gateway and DNS servers come from the DHCP server 10.20.1.10 (DC01).", es: "DHCP habilitado: Sí, y la dirección, la puerta de enlace y los DNS vienen del servidor DHCP 10.20.1.10 (DC01)." } },
      { match: /^get-netipconfiguration\b/, set: { ipSeen: true }, out: ["", "InterfaceAlias       : Ethernet", "InterfaceIndex       : 12", "InterfaceDescription : Intel(R) Ethernet Connection (16) I219-LM",
        "NetProfile.Name      : contoso.local", "IPv4Address          : 10.20.14.131", "IPv4DefaultGateway   : 10.20.14.1", "DNSServer            : 10.20.1.10", "                       10.20.1.11", ""] },
      { match: /^ipconfig\s*$/, out: ["", "Windows IP Configuration", "", "", "Ethernet adapter Ethernet:", "", "   Connection-specific DNS Suffix  . : contoso.local",
        "   IPv4 Address. . . . . . . . . . . : 10.20.14.131", "   Subnet Mask . . . . . . . . . . . : 255.255.255.0", "   Default Gateway . . . . . . . . . : 10.20.14.1", ""],
        say: { en: "Without /all, ipconfig does not show the DNS servers or whether DHCP is on.", es: "Sin /all, ipconfig no muestra los servidores DNS ni si el DHCP está activado." } },
      { match: /^get-dnsclientserveraddress\b/, out: ["", "InterfaceAlias               Interface Address ServerAddresses", "                             Index     Family",
        "--------------               --------- ------- ---------------", "Ethernet                            12 IPv4    {10.20.1.10, 10.20.1.11}", "Ethernet                            12 IPv6    {}", ""] },
      ...dnsRules(),
      { match: /^nslookup\s+["']?((?:[a-z0-9-]+\.)+(?:com|net|org|es|io))\.?["']?\s*$/, out: ["Server:  dc01.contoso.local", "Address:  10.20.1.10", "", "Non-authoritative answer:", "Name:    {$1}", "Address:  203.0.113.80", ""],
        say: { en: "Non-authoritative: DC01 forwarded the question to the internet. (The addresses in this simulation are documentation ranges.)", es: "Respuesta no autoritativa: DC01 reenvió la pregunta a internet. (Las direcciones de esta simulación son rangos de documentación.)" } },
      { match: /^nslookup\s+["']?(\S+?)["']?\s*$/, out: ["Server:  dc01.contoso.local", "Address:  10.20.1.10", "", "*** dc01.contoso.local can't find {$1}: Non-existent domain"], error: true,
        say: { en: "The internal names this lab knows: intranet, erp, fs01, dc01, dc02 and prt-srv01 (.contoso.local).", es: "Los nombres internos que conoce este laboratorio: intranet, erp, fs01, dc01, dc02 y prt-srv01 (.contoso.local)." } },
      { match: /^resolve-dnsname\s+["']?(\S+?)["']?(\s|$)/, out: ["Resolve-DnsName : {$1} : DNS name does not exist"], error: true },
      { match: /^ping\s+(\S+)/, out: ["Ping request could not find host {$1}. Please check the name and try again."], error: true },
      { match: /^test-netconnection\s+(\S+)/, out: ["WARNING: Name resolution of {$1} failed", "", "ComputerName   : {$1}", "RemoteAddress  :", "PingSucceeded  : False", ""] },
      { match: /^ipconfig\s+\/flushdns\b/, set: { flushed: true }, out: ["", "Windows IP Configuration", "", "Successfully flushed the DNS Resolver Cache."] },
      { match: /^clear-dnsclientcache\b/, set: { flushed: true }, out: [""], say: { en: "(DNS client cache cleared: the cmdlet prints nothing when it works.)", es: "(Caché del cliente DNS borrada: el cmdlet no muestra nada cuando funciona.)" } },
      { match: /^(ipconfig\s+\/displaydns|get-dnsclientcache)\b/, out: ["", "Entry                     RecordName                Record Status    Section TimeTo Data L Data", "                                                    Type                     Live   ength",
        "-----                     ----------                ------ ------    ------- ------ ------ ----", "intranet.contoso.local    intranet.contoso.local    A      Success   Answer     941      4 10.20.1.15",
        "fs01.contoso.local        fs01.contoso.local        A      Success   Answer    1108      4 10.20.1.20", ""] },
      { match: /^(get-service|gsv)\s+(-name\s+)?["']?spooler["']?(\s|$)/, when: { spoolerStopped: true }, set: { spoolerSeen: true }, out: svc("Stopped", "Spooler", "Print Spooler") },
      { match: /^(get-service|gsv)\s+(-name\s+)?["']?spooler["']?(\s|$)/, set: { spoolerSeen: true }, out: svc("Running", "Spooler", "Print Spooler") },
      { match: /^(get-service|gsv)\s+(-name\s+)?["']?wuauserv["']?(\s|$)/, out: svc("Stopped", "wuauserv", "Windows Update"),
        say: { en: "Windows Update starts on demand (Manual, trigger start): Stopped is normal when it has nothing to do.", es: "Windows Update arranca cuando hace falta (Manual, inicio por desencadenador): Stopped es normal cuando no tiene trabajo." } },
      { match: /^(get-service|gsv)\s+(-name\s+)?["']?dnscache["']?(\s|$)/, out: svc("Running", "Dnscache", "DNS Client") },
      { match: /^(get-service|gsv)\s+(-name\s+)?["']?bits["']?(\s|$)/, out: svc("Running", "BITS", "Background Intelligent Transfer Ser...") },
      { match: /^(get-service|gsv)\s*$/, out: ["", "Status   Name               DisplayName", "------   ----               -----------", "Running  BITS               Background Intelligent Transfer Ser...",
        "Running  Dnscache           DNS Client", "Running  EventLog           Windows Event Log", "Running  LanmanWorkstation  Workstation", "Running  Spooler            Print Spooler",
        "Running  W32Time            Windows Time", "Stopped  wuauserv           Windows Update", ""], say: { en: "(A short list: the lab shows the services it knows.)", es: "(Una lista corta: el laboratorio muestra los servicios que conoce.)" } },
      { match: /^(get-service|gsv)\s+(?:-name\s+)?["']?([\w$-]+)["']?/, out: ["Get-Service : Cannot find any service with service name '{$2}'."], error: true },
      { match: /^(restart-service\b.*spooler|net\s+stop\s+spooler\s*&&\s*net\s+start\s+spooler)/, set: { spoolerRestarted: true, spoolerStopped: false }, out: ["WARNING: Waiting for service 'Print Spooler (Spooler)' to stop..."],
        say: { en: "Restarted. On a print server this interrupts everyone printing at that moment: on a real desk, say so in the ticket.", es: "Reiniciado. En un servidor de impresión esto corta a todos los que imprimen en ese momento: en un puesto real, dilo en el ticket." } },
      { match: /^(stop-service\b.*spooler|net\s+stop\s+spooler)/, set: { spoolerStopped: true }, out: ["The Print Spooler service is stopping.", "The Print Spooler service was stopped successfully.", ""] },
      { match: /^(start-service\b.*spooler|net\s+start\s+spooler)/, set: { spoolerStopped: false, spoolerRestarted: true }, out: ["The Print Spooler service is starting.", "The Print Spooler service was started successfully.", ""] },
      { match: /^(restart-service|stop-service|start-service)\b/, out: ["(In this lab you can stop, start and restart the Print Spooler service.)"] },
      { match: /^(get-psdrive|gdr)\b.*\bc\b/, set: { diskSeen: true }, out: ["", "Name           Used (GB)     Free (GB) Provider      Root                    CurrentLocation", "----           ---------     --------- --------      ----                    ---------------",
        "C                 141,32         96,71 FileSystem    C:\\                      Users\\it.admin", ""] },
      { match: /^get-volume\b/, set: { diskSeen: true }, out: ["", "DriveLetter FriendlyName FileSystemType DriveType HealthStatus OperationalStatus SizeRemaining      Size",
        "----------- ------------ -------------- --------- ------------ ----------------- -------------      ----", "C           Windows      NTFS           Fixed     Healthy      OK                     96.71 GB 238.03 GB", ""] },
      { match: /^(get-winevent\b.*\bsystem\b|get-eventlog\b.*\bsystem\b)/, set: { eventsSeen: true }, out: ["", "   ProviderName: Service Control Manager", "",
        "TimeCreated                      Id LevelDisplayName Message", "-----------                      -- ---------------- -------",
        "26/10/2026 09:12:40            7036 Information      The Print Spooler service entered the running state.", "26/10/2026 08:01:58            7036 Information      The Windows Update service entered the stopped state.", "",
        "   ProviderName: Microsoft-Windows-Time-Service", "", "TimeCreated                      Id LevelDisplayName Message", "-----------                      -- ---------------- -------",
        "26/10/2026 08:02:30              37 Information      The time provider NtpClient is currently receiving valid time data from DC01.contoso.local.", "",
        "   ProviderName: Microsoft-Windows-Kernel-Power", "", "TimeCreated                      Id LevelDisplayName Message", "-----------                      -- ---------------- -------",
        "25/10/2026 19:44:03             109 Information      The kernel power manager has initiated a shutdown transition.", ""],
        say: { en: "Read the level, the source (ProviderName) and the ID: they are what you search for.", es: "Fíjate en el nivel, el origen (ProviderName) y el ID: es lo que se busca." } },
      { match: /^(get-winevent|get-eventlog)\b/, out: ["(This lab answers the System log: Get-WinEvent -LogName System -MaxEvents 20.)"] },
      { match: /^whoami\s*$/, out: ["contoso\\it.admin"] },
      { match: /^(hostname|\$env:computername)\s*$/, out: ["PC-LAB-01"] },
    ],
  };

  const exoNeeds = (cmd) => [cmd + " : Run Connect-ExchangeOnline before using the Exchange Online cmdlets."];
  const M365 = {
    id: "lab-m365",
    machine: { host: "ADM-WS01", user: "it.admin", domain: "CONTOSO", shell: "powershell", prompt: PS },
    state: { lab: false, graph: false, exo: false, skuSeen: false, licSeen: false, sizeSeen: false, permGiven: false, permChecked: false, sendAs: false },
    goal: { lab: true },
    commands: [
      { match: /^connect-mggraph\b/, set: { graph: true }, out: ["", "Welcome to Microsoft Graph!", "", "Connected via delegated access using 14d82eec-204b-4c2f-b7e8-296a70dab67e",
        "Readme: https://aka.ms/graph/sdk/powershell", "SDK Docs: https://aka.ms/graph/sdk/powershell/docs", "API Docs: https://aka.ms/graph/docs", "",
        "NOTE: You can use the -NoWelcome parameter to suppress this message.", ""], say: { en: "(Signed in as it.admin@contoso.com.)", es: "(Sesión iniciada como it.admin@contoso.com.)" } },
      { match: /^disconnect-mggraph\b/, set: { graph: false }, out: [""] },
      { match: /^connect-exchangeonline\b/, set: { exo: true }, out: ["", "This V3 EXO PowerShell module contains new REST API backed Exchange Online cmdlets which doesn't require WinRM for Client-Server communication.", "(signed in as it.admin@contoso.com)", ""] },
      { match: /^disconnect-exchangeonline\b/, set: { exo: false }, out: [""] },
      { match: /^((?:get|set|update|new|remove|invoke)-mg\w+)/, when: { graph: false }, out: ["{$1}: Authentication needed. Please call Connect-MgGraph."], error: true },
      { match: /^((?:get|set|add|remove|enable)-(?:exo)?(?:mailbox|recipient)\w*)/, when: { exo: false }, out: ["{$1} : Run Connect-ExchangeOnline before using the Exchange Online cmdlets."], error: true },
      { match: /^get-mgsubscribedsku\b/, set: { skuSeen: true }, out: ["", "SkuPartNumber ConsumedUnits PrepaidUnits.Enabled", "------------- ------------- --------------------", "SPE_E3                  112                  120", "EXCHANGESTANDARD          3                    5", ""],
        say: { en: "PrepaidUnits.Enabled is what the company owns; ConsumedUnits, what is assigned. The difference is what is free.", es: "PrepaidUnits.Enabled es lo que tiene la empresa; ConsumedUnits, lo asignado. La diferencia es lo libre." } },
      { match: /^get-mguserlicensedetail\b.*\beromero\b/, set: { licSeen: true }, out: ["", "SkuId                                SkuPartNumber", "-----                                -------------", "05e9a617-0261-4cee-bb44-138d3ef5d965 SPE_E3", ""],
        say: { en: "SPE_E3 is Microsoft 365 E3. Whether it comes from a group or straight from the user, Get-MgUser -Property LicenseAssignmentStates says.", es: "SPE_E3 es Microsoft 365 E3. Si viene de un grupo o directamente del usuario lo dice Get-MgUser -Property LicenseAssignmentStates." } },
      { match: /^get-mguserlicensedetail\b.*-userid\s+["']?([\w.]+@contoso\.com)/, out: ["", "SkuId                                SkuPartNumber", "-----                                -------------", "05e9a617-0261-4cee-bb44-138d3ef5d965 SPE_E3", ""] },
      { match: /^get-mguserlicensedetail\b/, out: ["Get-MgUserLicenseDetail_List: Cannot bind argument to parameter 'UserId' because it is an empty string."], error: true },
      { match: /^(get|set|update|new|remove|invoke)-mg\w+/, out: [], say: { en: "(This lab answers Get-MgSubscribedSku and Get-MgUserLicenseDetail; the Microsoft 365 tickets use more Graph cmdlets.)", es: "(Este laboratorio responde a Get-MgSubscribedSku y Get-MgUserLicenseDetail; los tickets de Microsoft 365 usan más cmdlets de Graph.)" } },
      { match: /^get-(exo)?mailboxstatistics\b.*\bjruiz\b/, set: { sizeSeen: true }, out: ["", "DisplayName  ItemCount TotalItemSize", "-----------  --------- -------------", "Javier Ruiz      48213 18.42 GB (19,778,323,456 bytes)", ""],
        say: { en: "An E3 mailbox holds 50 GB: this one is far from the limit.", es: "Un buzón E3 admite 50 GB: este está lejos del límite." } },
      { match: /^get-(exo)?mailboxstatistics\b.*\beventos\b/, out: ["", "DisplayName  ItemCount TotalItemSize", "-----------  --------- -------------", "Eventos           6120 2.87 GB (3,081,682,944 bytes)", ""] },
      { match: /^get-(exo)?mailbox\b.*\beventos\b/, out: ["", "Name     Alias    PrimarySmtpAddress    RecipientTypeDetails", "----     -----    ------------------    --------------------", "eventos  eventos  eventos@contoso.com   SharedMailbox", ""] },
      { match: /^add-mailboxpermission\b(?=.*\beventos\b)(?=.*\baortiz\b)(?=.*fullaccess)/, set: { permGiven: true }, out: ["", "Identity User                AccessRights  IsInherited Deny", "-------- ----                ------------  ----------- ----",
        "eventos  aortiz@contoso.com  {FullAccess}  False       False", ""], say: { en: "With automapping (the default), the mailbox appears in Ana's Outlook on its own after a while.", es: "Con automapping (lo predeterminado), el buzón aparece solo en el Outlook de Ana pasado un rato." } },
      { match: /^get-(exo)?mailboxpermission\b.*\beventos\b/, when: { permGiven: true }, set: { permChecked: true }, out: ["", "Identity User                AccessRights                IsInherited Deny", "-------- ----                ------------                ----------- ----",
        "eventos  NT AUTHORITY\\SELF   {FullAccess, ReadPermission} False       False", "eventos  aortiz@contoso.com  {FullAccess}                False       False", ""] },
      { match: /^get-(exo)?mailboxpermission\b.*\beventos\b/, out: ["", "Identity User                AccessRights                IsInherited Deny", "-------- ----                ------------                ----------- ----",
        "eventos  NT AUTHORITY\\SELF   {FullAccess, ReadPermission} False       False", ""] },
      { match: /^add-recipientpermission\b(?=.*\beventos\b)(?=.*\baortiz\b)(?=.*sendas)/, set: { sendAs: true }, out: ["", "Identity Trustee             AccessControlType AccessRights Inherited", "-------- -------             ----------------- ------------ ---------",
        "eventos  aortiz@contoso.com  Allow             {SendAs}     False", ""], say: { en: "Send As: Ana's messages from eventos show only eventos as the sender.", es: "Enviar como: los mensajes de Ana desde eventos muestran solo eventos como remitente." } },
      { match: /^get-(exo)?recipientpermission\b.*\beventos\b/, when: { sendAs: true }, out: ["", "Identity Trustee             AccessControlType AccessRights Inherited", "-------- -------             ----------------- ------------ ---------",
        "eventos  NT AUTHORITY\\SELF   Allow             {SendAs}     False", "eventos  aortiz@contoso.com  Allow             {SendAs}     False", ""] },
      { match: /^get-(exo)?recipientpermission\b.*\beventos\b/, out: ["", "Identity Trustee             AccessControlType AccessRights Inherited", "-------- -------             ----------------- ------------ ---------",
        "eventos  NT AUTHORITY\\SELF   Allow             {SendAs}     False", ""] },
      { match: /^(get|set|add|remove|enable)-(exo)?(mailbox|recipient)\w*/, out: [], say: { en: "(This lab knows the mailboxes jruiz and eventos and the permissions of eventos.)", es: "(Este laboratorio conoce los buzones jruiz y eventos y los permisos de eventos.)" } },
    ],
  };

  const unit = (name, desc, preset, since, extra) => [`● ${name}.service - ${desc}`, `     Loaded: loaded (/usr/lib/systemd/system/${name}.service; enabled; preset: ${preset})`,
    `     Active: active (running) since ${since}`].concat(extra || []);
  const LNX = {
    id: "lab-linux",
    machine: { host: "lab-lnx01", user: "it.admin", domain: "contoso.local", shell: "bash", prompt: "[it.admin@lab-lnx01 ~]$ " },
    state: { lab: false, dfSeen: false, duSeen: false, statusSeen: false, journalSeen: false, ssSeen: false, fwPerm: false, fwRuntime: false, timeSeen: false },
    goal: { lab: true },
    commands: [
      { match: /^(sudo )?df\b/, set: { dfSeen: true }, out: ["Filesystem             Size  Used Avail Use% Mounted on", "devtmpfs               4.0M     0  4.0M   0% /dev", "tmpfs                  1.8G     0  1.8G   0% /dev/shm",
        "/dev/mapper/rhel-root   30G  7.9G   23G  27% /", "/dev/mapper/rhel-var    20G   15G  5.2G  74% /var", "/dev/sda1              960M  301M  660M  32% /boot", "tmpfs                  366M     0  366M   0% /run/user/1000"],
        say: { en: "Use% is what matters: /var is the fullest one here.", es: "Lo que importa es Use%: aquí el más lleno es /var." } },
      { match: /^sudo du\b.*\/var\b/, set: { duSeen: true }, out: ["0\t/var/adm", "412M\t/var/cache", "0\t/var/crash", "8.0K\t/var/db", "0\t/var/empty", "0\t/var/ftp", "0\t/var/games", "1.6G\t/var/lib", "0\t/var/local", "0\t/var/lock",
        "13G\t/var/log", "0\t/var/mail", "0\t/var/nis", "0\t/var/opt", "0\t/var/preserve", "0\t/var/run", "64K\t/var/spool", "48K\t/var/tmp", "0\t/var/yp"],
        say: { en: "/var/log takes most of it: the next step would be du -sh /var/log/*.", es: "/var/log ocupa casi todo: el siguiente paso sería du -sh /var/log/*." } },
      { match: /^du\b.*\/var\b/, out: ["du: cannot read directory '/var/lib/sss/db': Permission denied", "du: cannot read directory '/var/log/audit': Permission denied", "du: cannot read directory '/var/cache/ldconfig': Permission denied", "412M\t/var/cache", "6.2G\t/var/log"], error: true,
        say: { en: "Without sudo, du cannot read every folder and the totals are wrong.", es: "Sin sudo, du no puede leer todas las carpetas y los totales salen mal." } },
      { match: /^(sudo )?systemctl\s+status\s+nginx(\.service)?\s*$/, set: { statusSeen: true }, out: unit("nginx", "The nginx HTTP and reverse proxy server", "disabled", "Mon 2026-10-26 07:58:12 CET; 1h 43min ago", [
        "    Process: 1125 ExecStartPre=/usr/bin/rm -f /run/nginx.pid (code=exited, status=0/SUCCESS)", "    Process: 1127 ExecStartPre=/usr/sbin/nginx -t (code=exited, status=0/SUCCESS)",
        "    Process: 1131 ExecStart=/usr/sbin/nginx (code=exited, status=0/SUCCESS)", "   Main PID: 1133 (nginx)", "      Tasks: 3 (limit: 23116)", "     Memory: 4.6M", "        CPU: 61ms",
        "     CGroup: /system.slice/nginx.service", "             ├─1133 \"nginx: master process /usr/sbin/nginx\"", "             ├─1134 \"nginx: worker process\"", "             └─1135 \"nginx: worker process\"", "",
        "Oct 26 07:58:12 lab-lnx01 systemd[1]: Starting The nginx HTTP and reverse proxy server...", "Oct 26 07:58:12 lab-lnx01 nginx[1127]: nginx: the configuration file /etc/nginx/nginx.conf syntax is ok",
        "Oct 26 07:58:12 lab-lnx01 nginx[1127]: nginx: configuration file /etc/nginx/nginx.conf test is successful", "Oct 26 07:58:12 lab-lnx01 systemd[1]: Started The nginx HTTP and reverse proxy server."]) },
      ...[["sshd", "OpenSSH server daemon"], ["chronyd", "NTP client/server"], ["firewalld", "firewalld - dynamic firewall daemon"]].map(([n, d]) => ({
        match: `^(sudo )?systemctl\\s+status\\s+${n}(\\.service)?\\s*$`, out: unit(n, d, "enabled", "Mon 2026-10-26 07:58:09 CET; 1h 43min ago"),
        say: { en: "(A short status: this lab shows nginx in full.)", es: "(Un estado corto: este laboratorio muestra nginx completo.)" } })),
      { match: /^(sudo )?systemctl\s+status\s+([\w@.-]+?)(\.service)?\s*$/, out: ["Unit {$2}.service could not be found."], error: true },
      { match: /^systemctl\s+(restart|reload|stop|start)\s+(\S+)/, out: ["Failed to {$1} {$2}: Interactive authentication required.", "See system logs and 'systemctl status {$2}' for details."], error: true,
        say: { en: "Changing a service needs sudo.", es: "Cambiar un servicio necesita sudo." } },
      { match: /^sudo systemctl\s+(restart|reload)\s+nginx/, out: [""], say: { en: "(Done. Look at systemctl status nginx again to prove it.)", es: "(Hecho. Vuelve a mirar systemctl status nginx para comprobarlo.)" } },
      { match: /^sudo systemctl\s+(restart|reload|stop|start)\s+(\S+)/, out: [""], say: { en: "(In this lab nothing needs restarting: look before you change.)", es: "(En este laboratorio no hace falta reiniciar nada: mira antes de cambiar.)" } },
      { match: /^(sudo )?journalctl\b.*(-u|--unit)[\s=]*nginx/, set: { journalSeen: true }, out: ["Oct 25 07:57:58 lab-lnx01 systemd[1]: Stopping The nginx HTTP and reverse proxy server...",
        "Oct 25 07:57:58 lab-lnx01 systemd[1]: nginx.service: Deactivated successfully.", "Oct 25 07:57:58 lab-lnx01 systemd[1]: Stopped The nginx HTTP and reverse proxy server.",
        "-- Boot 3f1c2a9e7b0d4c58a6e2f1b9d0c7a345 --", "Oct 26 07:58:12 lab-lnx01 systemd[1]: Starting The nginx HTTP and reverse proxy server...",
        "Oct 26 07:58:12 lab-lnx01 nginx[1127]: nginx: the configuration file /etc/nginx/nginx.conf syntax is ok", "Oct 26 07:58:12 lab-lnx01 nginx[1127]: nginx: configuration file /etc/nginx/nginx.conf test is successful",
        "Oct 26 07:58:12 lab-lnx01 systemd[1]: Started The nginx HTTP and reverse proxy server."], say: { en: "A clean stop before the reboot and a clean start after it.", es: "Una parada limpia antes del reinicio y un arranque limpio después." } },
      { match: /^(sudo )?journalctl\b/, out: ["(This lab keeps the journal of nginx: journalctl -u nginx.)"] },
      { match: /^sudo ss\s+-\w*t\w*l\w*/, set: { ssSeen: true }, out: ["State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process", "LISTEN 0      511          0.0.0.0:80         0.0.0.0:*     users:((\"nginx\",pid=1135,fd=6),(\"nginx\",pid=1134,fd=6),(\"nginx\",pid=1133,fd=6))",
        "LISTEN 0      128          0.0.0.0:22         0.0.0.0:*     users:((\"sshd\",pid=987,fd=3))", "LISTEN 0      2048       127.0.0.1:8080       0.0.0.0:*     users:((\"gunicorn\",pid=1201,fd=5))",
        "LISTEN 0      511             [::]:80            [::]:*     users:((\"nginx\",pid=1135,fd=7),(\"nginx\",pid=1134,fd=7),(\"nginx\",pid=1133,fd=7))", "LISTEN 0      128             [::]:22            [::]:*     users:((\"sshd\",pid=987,fd=4))"],
        say: { en: "8080 belongs to gunicorn and listens only on 127.0.0.1: nginx in front of it is what users reach on port 80.", es: "El 8080 es de gunicorn y solo escucha en 127.0.0.1: lo que los usuarios alcanzan en el puerto 80 es nginx, delante de él." } },
      { match: /^ss\s+-\w*t\w*l\w*/, out: ["State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process", "LISTEN 0      511          0.0.0.0:80         0.0.0.0:*", "LISTEN 0      128          0.0.0.0:22         0.0.0.0:*",
        "LISTEN 0      2048       127.0.0.1:8080       0.0.0.0:*", "LISTEN 0      511             [::]:80            [::]:*", "LISTEN 0      128             [::]:22            [::]:*"],
        say: { en: "The Process column is empty: without sudo, ss does not show the processes of other users.", es: "La columna Process está vacía: sin sudo, ss no muestra los procesos de otros usuarios." } },
      { match: /^firewall-cmd\b/, out: ["Authorization failed.", "    Make sure polkit agent is running or run the application as superuser."], error: true },
      { match: /^sudo firewall-cmd\s+--permanent\s+--add-service[= ](https)\s*$/, set: { fwPerm: true }, out: ["success"],
        say: { en: "Saved in the permanent configuration. It is not active yet: firewall-cmd --reload applies it.", es: "Guardado en la configuración permanente. Aún no está activo: firewall-cmd --reload lo aplica." } },
      { match: /^sudo firewall-cmd\s+--add-service[= ](https)\s+--permanent\s*$/, set: { fwPerm: true }, out: ["success"] },
      { match: /^sudo firewall-cmd\s+--add-service[= ](https)\s*$/, set: { fwRuntime: true }, out: ["success"],
        say: { en: "Active now, but only until the next reload or reboot: it is not in the permanent configuration.", es: "Activo ya, pero solo hasta la siguiente recarga o reinicio: no está en la configuración permanente." } },
      { match: /^sudo firewall-cmd\s+--reload\s*$/, when: { fwPerm: true }, set: { fwRuntime: true }, out: ["success"] },
      { match: /^sudo firewall-cmd\s+--reload\s*$/, set: { fwRuntime: false }, out: ["success"] },
      { match: /^sudo firewall-cmd\s+--permanent\s+--list-services\s*$/, when: { fwPerm: true }, out: ["cockpit dhcpv6-client http https ssh"] },
      { match: /^sudo firewall-cmd\s+--permanent\s+--list-services\s*$/, out: ["cockpit dhcpv6-client http ssh"] },
      { match: /^sudo firewall-cmd\s+--list-services\s*$/, when: { fwRuntime: true }, out: ["cockpit dhcpv6-client http https ssh"] },
      { match: /^sudo firewall-cmd\s+--list-services\s*$/, out: ["cockpit dhcpv6-client http ssh"] },
      { match: /^sudo firewall-cmd\s+--list-all\s*$/, when: { fwRuntime: true }, out: ["public (active)", "  target: default", "  icmp-block-inversion: no", "  interfaces: ens192", "  sources: ",
        "  services: cockpit dhcpv6-client http https ssh", "  ports: ", "  protocols: ", "  forward: yes", "  masquerade: no", "  forward-ports: ", "  source-ports: ", "  icmp-blocks: ", "  rich rules: "] },
      { match: /^sudo firewall-cmd\s+--list-all\s*$/, out: ["public (active)", "  target: default", "  icmp-block-inversion: no", "  interfaces: ens192", "  sources: ",
        "  services: cockpit dhcpv6-client http ssh", "  ports: ", "  protocols: ", "  forward: yes", "  masquerade: no", "  forward-ports: ", "  source-ports: ", "  icmp-blocks: ", "  rich rules: "] },
      { match: /^sudo firewall-cmd\b/, out: ["(In this lab: --list-services, --list-all, --add-service=https with or without --permanent, and --reload.)"] },
      { match: /^timedatectl(\s+status)?\s*$/, set: { timeSeen: true }, out: ["               Local time: Mon 2026-10-26 09:41:07 CET", "           Universal time: Mon 2026-10-26 08:41:07 UTC", "                 RTC time: Mon 2026-10-26 08:41:07",
        "                Time zone: Europe/Madrid (CET, +0100)", "System clock synchronized: yes", "              NTP service: active", "          RTC in local TZ: no"] },
      { match: /^uptime\s*$/, out: [" 09:41:07 up  1:43,  1 user,  load average: 0.08, 0.05, 0.01"] },
      { match: /^(hostname|uname -n)\s*$/, out: ["lab-lnx01"] },
      { match: /^whoami\s*$/, out: ["it.admin"] },
    ],
  };

  /* ---------- the labs: what each one practises and its tasks. A task's check(lab) reads the lab's state; it never looks at the text typed,
     except through the tags the engines give (a command that looked something up). */
  const flags = (lab) => (lab.sess ? lab.sess.state : {});
  const seen = (lab, re) => lab.seen.some((x) => re.test(x));
  const port = (lab, dev, p) => NN.port(lab.net.devices[dev], p);
  const LABS = [
    {
      id: "ad", area: "ad", kind: "ad",
      title: { en: "Active Directory lab", es: "Laboratorio de Active Directory" },
      summary: { en: "Contoso's directory, a copy of its own, with the RSAT PowerShell commands: find, unlock, reset, groups and sign-ins.", es: "Una copia propia del directorio de Contoso, con los comandos de PowerShell de RSAT: buscar, desbloquear, restablecer, grupos e inicios de sesión." },
      tasks: [
        { id: "find", label: { en: "Someone cannot sign in this morning. List the accounts that are locked out.", es: "Alguien no puede iniciar sesión esta mañana. Lista las cuentas bloqueadas." },
          hint: "Search-ADAccount -LockedOut", check: (lab) => seen(lab, /^search-locked$/) },
        { id: "unlock", label: { en: "Unlock the account you found (after checking who is calling, on a real desk).", es: "Desbloquea la cuenta que has encontrado (tras comprobar quién llama, en un puesto real)." },
          hint: "Unlock-ADAccount <user>", check: (lab) => !Wd.user(lab.world, "jruiz").locked },
        { id: "reset", label: { en: "Laura Pérez (lperez) forgot her password: reset it and make her choose a new one at the next sign-in.", es: "Laura Pérez (lperez) ha olvidado su contraseña: restablécela y oblígale a elegir una nueva al iniciar sesión." },
          hint: "Set-ADAccountPassword lperez -Reset · Set-ADUser lperez -ChangePasswordAtLogon $true", check: (lab) => { const u = Wd.user(lab.world, "lperez"); return u.pwdReset && u.mustChange; } },
        { id: "group", label: { en: "Elena Romero (eromero) starts working from home: add her to GG-VPN-Users.", es: "Elena Romero (eromero) empieza a teletrabajar: añádela a GG-VPN-Users." },
          hint: "Add-ADGroupMember GG-VPN-Users -Members eromero", check: (lab) => Wd.user(lab.world, "eromero").groups.includes("GG-VPN-Users") },
        { id: "lastlogon", label: { en: "When did Ana Ortiz (aortiz) last sign in? Read her account.", es: "¿Cuándo inició sesión por última vez Ana Ortiz (aortiz)? Lee su cuenta." },
          hint: "Get-ADUser aortiz -Properties LastLogonDate", check: (lab) => seen(lab, /^user:aortiz$/) },
      ],
    },
    {
      id: "network", area: "network", kind: "net",
      title: { en: "Network lab", es: "Laboratorio de red" },
      summary: { en: "Contoso's switches, router and firewall, a copy of their own: follow a MAC address, bring a port into service, save and check.", es: "Una copia propia de los switches, el router y el cortafuegos de Contoso: sigue una MAC, pon un puerto en servicio, guarda y comprueba." },
      tasks: [
        { id: "mac", label: { en: "PC-FIN-024 (MAC 6c4b.9042.1a24) is on the 2nd floor: find the switch and the port it is plugged into. Start at the core switch.", es: "PC-FIN-024 (MAC 6c4b.9042.1a24) está en la 2ª planta: encuentra el switch y el puerto donde está conectado. Empieza por el switch de núcleo." },
          hint: "ssh SW-CORE-01 · show mac address-table address 6c4b.9042.1a24", check: (lab) => seen(lab, /^SW-ACC-2F\|show mac address-table address 6c4b\.9042\.1a24 Gi1\/0\/5\b/) },
        { id: "vlan", label: { en: "A new desk at socket FIN 2.16: on SW-ACC-2F, the parked port Gi1/0/16 needs the description FIN 2.16, access VLAN 140 and to be brought up.", es: "Un puesto nuevo en la toma FIN 2.16: en SW-ACC-2F, el puerto aparcado Gi1/0/16 necesita la descripción FIN 2.16, la VLAN de acceso 140 y encenderse." },
          hint: "configure terminal · interface gi1/0/16 · description FIN 2.16 · switchport access vlan 140 · no shutdown",
          check: (lab) => { const p = port(lab, "SW-ACC-2F", "Gi1/0/16"); return p.vlan === 140 && p.admin !== false && /^FIN 2\.16\b/i.test(p.desc || ""); } },
        { id: "save", label: { en: "Save the configuration of SW-ACC-2F, so the new port survives a reboot.", es: "Guarda la configuración de SW-ACC-2F, para que el puerto nuevo sobreviva a un reinicio." },
          hint: "write memory", check: (lab) => LABS[1].tasks[1].check(lab) && NN.saved(lab.net.devices["SW-ACC-2F"]) },
        { id: "errdis", label: { en: "Check whether any port of SW-ACC-2F is err-disabled.", es: "Comprueba si algún puerto de SW-ACC-2F está en err-disabled." },
          hint: "show interfaces status err-disabled", check: (lab) => seen(lab, /^SW-ACC-2F\|show interfaces status err-disabled$/) },
        { id: "ping", label: { en: "From SW-ACC-2F, ping the DHCP server DC01 (10.20.1.10).", es: "Desde SW-ACC-2F, haz ping al servidor DHCP DC01 (10.20.1.10)." },
          hint: "ping 10.20.1.10", check: (lab) => seen(lab, /^SW-ACC-2F\|ping 10\.20\.1\.10 ok/) },
      ],
    },
    {
      id: "windows", area: "windows", kind: "rules", sc: WIN,
      title: { en: "Windows lab", es: "Laboratorio de Windows" },
      summary: { en: "A healthy Contoso PC in PowerShell: network and DNS, a service, disk space and the event log.", es: "Un equipo de Contoso sano en PowerShell: red y DNS, un servicio, espacio en disco y el registro de eventos." },
      tasks: [
        { id: "ip", label: { en: "Find this PC's IP address, default gateway and DNS servers, and whether DHCP gave them.", es: "Encuentra la dirección IP, la puerta de enlace y los servidores DNS de este equipo, y si los dio el DHCP." },
          hint: "ipconfig /all", check: (lab) => flags(lab).ipSeen },
        { id: "dns", label: { en: "Check that the intranet (intranet.contoso.local) resolves, asking the DNS server directly.", es: "Comprueba que la intranet (intranet.contoso.local) se resuelve, preguntando directamente al servidor DNS." },
          hint: "nslookup intranet.contoso.local", check: (lab) => flags(lab).dnsSeen },
        { id: "flush", label: { en: "Clear the DNS answers this PC remembers.", es: "Borra las respuestas de DNS que recuerda este equipo." },
          hint: "ipconfig /flushdns", check: (lab) => flags(lab).flushed },
        { id: "spooler", label: { en: "Check the Print Spooler service, restart it and leave it running.", es: "Comprueba el servicio Cola de impresión, reinícialo y déjalo en marcha." },
          hint: "Get-Service Spooler · Restart-Service Spooler", check: (lab) => { const f = flags(lab); return f.spoolerSeen && f.spoolerRestarted && !f.spoolerStopped; } },
        { id: "disk", label: { en: "How much free space is left on C:?", es: "¿Cuánto espacio libre queda en C:?" },
          hint: "Get-PSDrive C", check: (lab) => flags(lab).diskSeen },
        { id: "events", label: { en: "Read the latest events of the System log.", es: "Lee los últimos eventos del registro Sistema." },
          hint: "Get-WinEvent -LogName System -MaxEvents 20", check: (lab) => flags(lab).eventsSeen },
      ],
    },
    {
      id: "m365", area: "m365", kind: "rules", sc: M365,
      title: { en: "Microsoft 365 lab", es: "Laboratorio de Microsoft 365" },
      summary: { en: "Microsoft Graph and Exchange Online PowerShell from the admin workstation: licences, a mailbox size and a shared mailbox's permissions.", es: "Microsoft Graph y Exchange Online PowerShell desde el equipo de administración: licencias, el tamaño de un buzón y los permisos de un buzón compartido." },
      tasks: [
        { id: "connect", label: { en: "Connect to Microsoft Graph and to Exchange Online.", es: "Conéctate a Microsoft Graph y a Exchange Online." },
          hint: "Connect-MgGraph -Scopes User.Read.All · Connect-ExchangeOnline", check: (lab) => flags(lab).graph && flags(lab).exo },
        { id: "sku", label: { en: "How many Microsoft 365 E3 licences (SPE_E3) are free?", es: "¿Cuántas licencias Microsoft 365 E3 (SPE_E3) quedan libres?" },
          hint: "Get-MgSubscribedSku", check: (lab) => flags(lab).skuSeen },
        { id: "licence", label: { en: "Which licences does Elena Romero (eromero@contoso.com) have?", es: "¿Qué licencias tiene Elena Romero (eromero@contoso.com)?" },
          hint: "Get-MgUserLicenseDetail -UserId eromero@contoso.com", check: (lab) => flags(lab).licSeen },
        { id: "size", label: { en: "How big is Javier Ruiz's (jruiz) mailbox?", es: "¿Cuánto ocupa el buzón de Javier Ruiz (jruiz)?" },
          hint: "Get-EXOMailboxStatistics jruiz", check: (lab) => flags(lab).sizeSeen },
        { id: "fullaccess", label: { en: "Ana Ortiz (aortiz) has to open the shared mailbox eventos@contoso.com: give her FullAccess, then check the permissions.", es: "Ana Ortiz (aortiz) tiene que abrir el buzón compartido eventos@contoso.com: dale FullAccess y después comprueba los permisos." },
          hint: "Add-MailboxPermission eventos -User aortiz -AccessRights FullAccess · Get-MailboxPermission eventos", check: (lab) => flags(lab).permGiven && flags(lab).permChecked },
        { id: "sendas", label: { en: "She also has to send as eventos: give her Send As.", es: "También tiene que enviar como eventos: dale Enviar como." },
          hint: "Add-RecipientPermission eventos -Trustee aortiz -AccessRights SendAs", check: (lab) => flags(lab).sendAs },
      ],
    },
    {
      id: "linux", area: "linux", kind: "rules", sc: LNX,
      title: { en: "Linux lab", es: "Laboratorio de Linux" },
      summary: { en: "A RHEL 9 server over SSH, with your own account and sudo: space, a service and its log, ports, the firewall and the clock.", es: "Un servidor RHEL 9 por SSH, con tu cuenta y sudo: espacio, un servicio y su registro, puertos, el cortafuegos y la hora." },
      tasks: [
        { id: "df", label: { en: "Check the free space on every filesystem.", es: "Comprueba el espacio libre de cada sistema de archivos." }, hint: "df -h", check: (lab) => flags(lab).dfSeen },
        { id: "du", label: { en: "Find what takes the space in /var (you will need sudo).", es: "Encuentra qué ocupa el espacio en /var (necesitarás sudo)." }, hint: "sudo du -sh /var/*", check: (lab) => flags(lab).duSeen },
        { id: "service", label: { en: "Check that nginx is running, then read its log.", es: "Comprueba que nginx está en marcha y después lee su registro." }, hint: "systemctl status nginx · journalctl -u nginx",
          check: (lab) => flags(lab).statusSeen && flags(lab).journalSeen },
        { id: "port", label: { en: "Which process listens on port 8080? (ss shows the processes only with sudo.)", es: "¿Qué proceso escucha en el puerto 8080? (ss solo muestra los procesos con sudo.)" }, hint: "sudo ss -tlnp", check: (lab) => flags(lab).ssSeen },
        { id: "firewall", label: { en: "Allow HTTPS in the firewall so that it survives a reboot, and make it active now.", es: "Permite HTTPS en el cortafuegos de forma que sobreviva a un reinicio, y que esté activo ya." },
          hint: "sudo firewall-cmd --permanent --add-service=https · sudo firewall-cmd --reload", check: (lab) => flags(lab).fwPerm && flags(lab).fwRuntime },
        { id: "time", label: { en: "Check the clock, the time zone and whether the time is synchronised.", es: "Comprueba la hora, la zona horaria y si la hora está sincronizada." }, hint: "timedatectl", check: (lab) => flags(lab).timeSeen },
      ],
    },
  ];
  function lab(id) { return LABS.find((l) => l.id === id) || null; }

  /* ---------- a lab session */
  function create(id, lang) {
    const def = lab(id);
    if (!def) return null;
    const s = { id, kind: def.kind, lang: lang || "en", seen: [] };
    if (def.kind === "ad") {
      s.world = Wd.createWorld();
      Object.assign(Wd.user(s.world, "eromero"), { locked: false, badPwd: 0 });
      Object.assign(Wd.user(s.world, "jruiz"), { locked: true, badPwd: 5 });
    } else if (def.kind === "net") {
      s.net = NN.createNet([]);
      s.term = NN.terminal(s.net);
    } else {
      s.sess = E.createSession(def.sc, s.lang);
    }
    return s;
  }
  function prompt(s) {
    if (s.kind === "net") return NN.prompt(s.term);
    if (s.kind === "rules") return E.prompt(s.sess);
    return PS;
  }
  const HELP = {
    net: { en: ["Start with ssh <device>: SW-CORE-01, SW-ACC-2F, SW-ACC-1F, RTR-VLC-01 or FGT-HQ-01. On a device, ? lists what you can type; exit closes the session.",
      "This network is a copy for the lab: nothing you change here reaches the tickets or the network room."],
      es: ["Empieza con ssh <equipo>: SW-CORE-01, SW-ACC-2F, SW-ACC-1F, RTR-VLC-01 o FGT-HQ-01. En un equipo, ? lista lo que puedes escribir; exit cierra la sesión.",
      "Esta red es una copia para el laboratorio: lo que cambies aquí no llega a los tickets ni a la sala de red."] },
    rules: { en: ["Type the commands you would use on a real machine; each task shows one way to do it under Show how. Nothing here has an SLA or a score.", "  clear / cls   clear the screen"],
      es: ["Escribe los comandos que usarías en un equipo real; cada tarea enseña una forma de hacerla en Ver cómo. Aquí no hay SLA ni puntuación.", "  clear / cls   limpia la pantalla"] },
  };
  // runs one line; returns {lines: [{text, kind}], clear}
  function run(s, input, lang) {
    const L = lang === "es" ? "es" : "en";
    const cmd = String(input || "").trim().replace(/\s+/g, " ");
    const res = { lines: [], clear: false };
    if (!cmd) return res;
    const low = cmd.toLowerCase();
    if (low === "clear" || low === "cls") { res.clear = true; return res; }
    if (s.kind === "ad") {
      const p = Wd.parse(cmd);
      const r = Wd.run(s.world, cmd, L);
      if (p.verb === "search-adaccount" && "lockedout" in p.named) s.seen.push("search-locked");
      if (p.verb === "get-aduser" && p.id && Wd.user(s.world, p.id)) s.seen.push("user:" + String(p.id).toLowerCase());
      return { lines: r.lines, clear: r.clear };
    }
    if (s.kind === "net") {
      if ((low === "help" || low === "?") && NN.depth(s.term) === 0) { HELP.net[L].forEach((x) => res.lines.push({ text: x, kind: "say" })); return res; }
      const r = NN.exec(s.term, cmd, { lang: L });
      r.tags.forEach((x) => s.seen.push(x.dev + "|" + x.tag));
      return { lines: r.lines, clear: false };
    }
    if (low === "help" || low === "?" || low === "hint" || low === "ticket") { HELP.rules[L].forEach((x) => res.lines.push({ text: x, kind: "say" })); return res; }
    s.sess.lang = L;
    const r = E.run(s.sess, cmd);
    return { lines: r.lines.filter((l) => l.kind !== "ok"), clear: r.clear };
  }
  // the tasks of a lab with their state, in one language
  function tasks(s, lang) {
    return lab(s.id).tasks.map((x) => ({ id: x.id, label: t(x.label, lang), hint: x.hint, done: Boolean(x.check(s)) }));
  }

  /* ---------- progress, kept in the browser (sd.labs): {labId: {done: [task ids], day: last day with a new task, completed: day or null}} */
  function normalise(store) {
    const out = {};
    if (!store || typeof store !== "object") return out;
    LABS.forEach((l) => {
      const x = store[l.id];
      if (!x || typeof x !== "object") return;
      const ids = l.tasks.map((k) => k.id);
      const done = Array.isArray(x.done) ? ids.filter((id) => x.done.includes(id)) : [];
      out[l.id] = { done, day: typeof x.day === "string" ? x.day : null, completed: done.length === ids.length ? (typeof x.completed === "string" ? x.completed : x.day || null) : null };
    });
    return out;
  }
  // adds the tasks done now (never takes one away); returns {store, fresh: [new task ids], completedNow}
  function record(store, labId, doneIds, day) {
    const st = normalise(store);
    const def = lab(labId);
    if (!def) return { store: st, fresh: [], completedNow: false };
    const prev = st[labId] || { done: [], day: null, completed: null };
    const ids = def.tasks.map((k) => k.id);
    const fresh = ids.filter((id) => doneIds.includes(id) && !prev.done.includes(id));
    if (!fresh.length) return { store: st, fresh, completedNow: false };
    const done = ids.filter((id) => prev.done.includes(id) || doneIds.includes(id));
    const complete = done.length === ids.length;
    st[labId] = { done, day, completed: complete ? prev.completed || day : null };
    return { store: st, fresh, completedNow: complete && !prev.completed };
  }
  function reset(store, labId) { const st = normalise(store); delete st[labId]; return st; }
  function progressOf(store, labId) {
    const def = lab(labId);
    const x = normalise(store)[labId];
    const total = def ? def.tasks.length : 0;
    const done = x ? x.done.length : 0;
    return { done, total, complete: total > 0 && done === total, completed: x ? x.completed : null };
  }
  function summary(store) {
    const all = LABS.map((l) => progressOf(store, l.id));
    return { labs: LABS.length, complete: all.filter((x) => x.complete).length, tasks: all.reduce((a, x) => a + x.done, 0), totalTasks: all.reduce((a, x) => a + x.total, 0) };
  }

  return { LABS, WIN, M365, LNX, t, lab, create, prompt, run, tasks, normalise, record, reset, progressOf, summary };
});
