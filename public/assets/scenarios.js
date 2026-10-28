/* SysAdmin Desks by IGG - scenarios. Fictional company (Contoso), fictional people. Format: docs/scenario-format.md */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SDScenarios = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const GUIDE = "https://inigogonzalezgarcia.github.io/guias/";

  const scenarios = [];

  /* ------------------------------------------------------------------ 1. Account that keeps locking */
  scenarios.push({
    id: "ad-lockout",
    level: 1,
    topic: { en: "Active Directory", es: "Active Directory" },
    minutes: 15,
    title: { en: "The account that locks every morning", es: "La cuenta que se bloquea cada mañana" },
    guide: GUIDE + "active-directory-alta-usuario-grupos.html",
    machine: { host: "ADM-WS01", user: "it.admin", domain: "CONTOSO", shell: "powershell", prompt: "PS C:\\Users\\it.admin> " },
    ticket: {
      id: "INC-20418", from: "Marta García (Finance)", priority: "P2",
      subject: { en: "My account locks several times a day", es: "Mi cuenta se bloquea varias veces al día" },
      body: {
        en: "Since I changed my password on Monday my account gets locked two or three times a day. The service desk has unlocked it twice, but it happens again. I type the password correctly. User: mgarcia.",
        es: "Desde que cambié la contraseña el lunes, mi cuenta se bloquea dos o tres veces al día. El service desk la ha desbloqueado dos veces, pero vuelve a pasar. Escribo bien la contraseña. Usuario: mgarcia.",
      },
    },
    intro: {
      en: "You are on your admin workstation with the Active Directory module (RSAT). The domain controllers are DC01 (PDC emulator) and DC02.",
      es: "Estás en tu equipo de administración con el módulo de Active Directory (RSAT). Los controladores de dominio son DC01 (emulador de PDC) y DC02.",
    },
    requester: { name: "Marta García", team: { en: "Finance", es: "Finanzas" }, user: "mgarcia", location: { en: "Head office, 2nd floor", es: "Oficina central, 2ª planta" }, device: "PC-FIN-021" },
    asset: {
      title: { en: "User account · mgarcia", es: "Cuenta de usuario · mgarcia" },
      fields: [
        { label: { en: "Account", es: "Cuenta" }, states: [
          { when: { locked: true }, value: { en: "Locked", es: "Bloqueada" }, tone: "bad" },
          { value: { en: "Unlocked", es: "Desbloqueada" }, tone: "ok" }] },
        { label: { en: "Lockout source", es: "Origen de los bloqueos" }, states: [
          { when: { sourceFound: false }, value: { en: "Unknown", es: "Desconocido" }, tone: "warn" },
          { value: "FS-SCAN01" }] },
        { label: { en: "Task ScanToFinance", es: "Tarea ScanToFinance" }, states: [
          { when: { taskFound: false }, value: { en: "Not reviewed", es: "Sin revisar" }, tone: "muted" },
          { when: { taskDisabled: false }, value: { en: "Ready, with her old password", es: "Activa, con su contraseña antigua" }, tone: "bad" },
          { value: { en: "Disabled", es: "Deshabilitada" }, tone: "ok" }] },
        { label: { en: "Password last set", es: "Último cambio de contraseña" }, value: "19/10/2026 08:12" },
      ],
    },
    actions: [{ id: "unlock", label: { en: "Unlock account", es: "Desbloquear cuenta" }, cmd: "Unlock-ADAccount mgarcia", when: { locked: true } }],
    codes: ["cause-removed"],
    bind: [
      { kind: "user", id: "mgarcia", states: [{ when: { locked: true }, set: { locked: true, badPwd: 5 } }, { set: { locked: false, badPwd: 0 } }] },
      { kind: "server", id: "FS-SCAN01", states: [
        { when: { taskFound: true, taskDisabled: false }, set: { status: "warn" },
          note: { en: "Task ScanToFinance runs as mgarcia with her old password", es: "La tarea ScanToFinance se ejecuta como mgarcia con su contraseña antigua" } },
        { set: {} }] },
    ],
    state: { locked: true, inspected: false, sourceFound: false, taskFound: false, taskDisabled: false, relock: false, verified: false },
    events: [{
      when: { relock: true },
      set: { locked: true, relock: false },
      say: {
        en: "[Event 4740 on DC01] A user account was locked out. Account: mgarcia. Caller computer: FS-SCAN01. (It locked again a minute after the unlock.)",
        es: "[Evento 4740 en DC01] Se bloqueó una cuenta de usuario. Cuenta: mgarcia. Equipo llamador: FS-SCAN01. (Se ha vuelto a bloquear un minuto después del desbloqueo.)",
      },
    }],
    commands: [
      { id: "aduser", match: /^get-aduser\b.*\bmgarcia\b/, when: { locked: true }, set: { inspected: true }, out: [
        "",
        "DistinguishedName     : CN=Marta Garcia,OU=Finance,OU=Users,DC=contoso,DC=local",
        "Enabled               : True",
        "LockedOut             : True",
        "badPwdCount           : 5",
        "LastBadPasswordAttempt: 25/10/2026 07:58:12",
        "PasswordLastSet       : 19/10/2026 08:12:40",
        "PasswordExpired       : False",
        "SamAccountName        : mgarcia",
        ""] },
      { id: "aduser-ok", match: /^get-aduser\b.*\bmgarcia\b/, when: { locked: false, taskDisabled: true }, set: { verified: true }, out: [
        "",
        "Enabled               : True",
        "LockedOut             : False",
        "badPwdCount           : 0",
        "SamAccountName        : mgarcia",
        ""],
        say: { en: "The account stays unlocked.", es: "La cuenta sigue desbloqueada." } },
      { id: "aduser-ok-early", match: /^get-aduser\b.*\bmgarcia\b/, when: { locked: false }, out: [
        "", "Enabled               : True", "LockedOut             : False", "badPwdCount           : 0", ""] },
      { id: "search", match: /^search-adaccount\b.*-lockedout/, when: { locked: true }, set: { inspected: true }, out: [
        "", "Name          SamAccountName LockedOut LastLogonDate", "----          -------------- --------- -------------",
        "Marta Garcia  mgarcia        True      24/10/2026 18:03", ""] },
      { id: "search-none", match: /^search-adaccount\b.*-lockedout/, out: [""] },
      { id: "pdc", match: /^get-addomain\b/, out: [
        "", "DNSRoot        : contoso.local", "NetBIOSName    : CONTOSO", "PDCEmulator    : DC01.contoso.local",
        "ReplicaDirectoryServers : {DC01.contoso.local, DC02.contoso.local}", ""] },
      { id: "event", match: /^(get-winevent|get-eventlog)\b.*4740/, set: { sourceFound: true }, out: [
        "",
        "   ProviderName: Microsoft-Windows-Security-Auditing",
        "",
        "TimeCreated          Id Message",
        "-----------          -- -------",
        "25/10/2026 07:58:12 4740 A user account was locked out. Account Name: mgarcia  Caller Computer Name: FS-SCAN01",
        "24/10/2026 15:28:40 4740 A user account was locked out. Account Name: mgarcia  Caller Computer Name: FS-SCAN01",
        "24/10/2026 09:13:05 4740 A user account was locked out. Account Name: mgarcia  Caller Computer Name: FS-SCAN01",
        ""],
        say: { en: "Every lockout comes from the same computer, FS-SCAN01, the scanning server. Marta does not log on there.",
               es: "Todos los bloqueos vienen del mismo equipo, FS-SCAN01, el servidor de escaneo. Marta no inicia sesión ahí." } },
      { id: "event-other", match: /^(get-winevent|get-eventlog)\b/, out: [
        "", "TimeCreated          Id Message", "-----------          -- -------",
        "25/10/2026 07:58:12 4625 An account failed to log on. Account Name: mgarcia  Workstation Name: FS-SCAN01", "..."],
        say: { en: "Too much noise. Filter by the lockout event ID on the PDC emulator.", es: "Demasiado ruido. Filtra por el ID del evento de bloqueo en el emulador de PDC." } },
      { id: "tasks", match: /^(get-scheduledtask\b.*fs-scan01|invoke-command\b.*fs-scan01.*scheduledtask|schtasks\b.*\/s\s+fs-scan01)/,
        set: { taskFound: true }, out: [
        "",
        "TaskPath   TaskName             State   Principal",
        "--------   --------             -----   ---------",
        "\\Contoso\\  ScanToFinance        Ready   CONTOSO\\mgarcia",
        "\\Contoso\\  ScanToHR             Ready   CONTOSO\\svc-scan",
        "\\Microsoft\\Windows\\...  (system tasks)",
        ""],
        say: { en: "ScanToFinance runs every 5 minutes as mgarcia, with the password saved before Monday's change.",
               es: "ScanToFinance se ejecuta cada 5 minutos como mgarcia, con la contraseña guardada antes del cambio del lunes." } },
      { id: "services", match: /^(get-(ciminstance|wmiobject)\b.*win32_service.*fs-scan01|get-service\b.*fs-scan01)/, out: [
        "", "Name              StartName", "----              ---------", "ScanService       CONTOSO\\svc-scan", "Spooler           LocalSystem", ""],
        say: { en: "No service runs as mgarcia. Something else on that server uses her account.", es: "Ningún servicio usa a mgarcia. Otra cosa en ese servidor usa su cuenta." } },
      { id: "disable", match: /^(disable-scheduledtask\b.*scantofinance|schtasks\b.*\/change.*scantofinance.*\/disable)/, set: { taskDisabled: true, taskFound: true }, out: [
        "", "TaskPath   TaskName        State", "--------   --------        -----", "\\Contoso\\  ScanToFinance   Disabled", ""],
        say: { en: "The task is disabled. Tell the server owner it must run with a service account (like ScanToHR), not a person's account.",
               es: "Tarea deshabilitada. Avisa al responsable del servidor: debe ejecutarse con una cuenta de servicio (como ScanToHR), no con la de una persona." } },
      { id: "unlock-early", match: /^unlock-adaccount\b.*\bmgarcia\b/, when: { taskDisabled: false }, set: { locked: false, relock: true }, out: [""],
        say: { en: "(Account unlocked.)", es: "(Cuenta desbloqueada.)" } },
      { id: "unlock", match: /^unlock-adaccount\b.*\bmgarcia\b/, set: { locked: false }, out: [""],
        say: { en: "(Account unlocked.)", es: "(Cuenta desbloqueada.)" } },
      { id: "reset", match: /^set-adaccountpassword\b.*mgarcia/, out: [""],
        say: { en: "Resetting her password will not help: the cause is a saved old password somewhere else. And now she has to learn a new one.",
               es: "Resetear su contraseña no ayuda: la causa es una contraseña antigua guardada en otro sitio. Y ahora tiene que aprender otra." } },
    ],
    goal: { locked: false, taskDisabled: true, verified: true },
    stages: [
      { id: "investigate", label: { en: "Find the source of the lockouts", es: "Encontrar el origen de los bloqueos" }, when: { sourceFound: true } },
      { id: "fix", label: { en: "Remove the cause and unlock", es: "Quitar la causa y desbloquear" }, when: { taskDisabled: true, locked: false } },
      { id: "verify", label: { en: "Check it stays unlocked", es: "Comprobar que sigue desbloqueada" }, when: { verified: true } },
    ],
    resolved: { en: "Resolved: the account is unlocked and the cause is gone. Now write the work note.",
                es: "Resuelto: la cuenta está desbloqueada y la causa eliminada. Ahora escribe la nota de trabajo." },
    hints: [
      { en: "Look at the account first: Get-ADUser mgarcia -Properties LockedOut,badPwdCount,LastBadPasswordAttempt",
        es: "Mira primero la cuenta: Get-ADUser mgarcia -Properties LockedOut,badPwdCount,LastBadPasswordAttempt" },
      { en: "The lockout event (4740) on the PDC emulator says which computer caused it: Get-WinEvent -ComputerName DC01 -FilterHashtable @{LogName='Security';Id=4740}",
        es: "El evento de bloqueo (4740) en el emulador de PDC dice qué equipo lo provocó: Get-WinEvent -ComputerName DC01 -FilterHashtable @{LogName='Security';Id=4740}" },
      { en: "On that server, look for scheduled tasks or services that run as her: Get-ScheduledTask -CimSession FS-SCAN01",
        es: "En ese servidor, busca tareas programadas o servicios que se ejecuten como ella: Get-ScheduledTask -CimSession FS-SCAN01" },
      { en: "Disable the task (Disable-ScheduledTask -CimSession FS-SCAN01 -TaskName ScanToFinance -TaskPath '\\Contoso\\'), then Unlock-ADAccount mgarcia and check again.",
        es: "Deshabilita la tarea (Disable-ScheduledTask -CimSession FS-SCAN01 -TaskName ScanToFinance -TaskPath '\\Contoso\\'), después Unlock-ADAccount mgarcia y vuelve a comprobar." },
    ],
    note: [
      { kb: "cause", label: { en: "the cause (the task on FS-SCAN01 with her old password)", es: "la causa (la tarea en FS-SCAN01 con su contraseña antigua)" },
        any: ["scheduled task", "tarea programada", "scantofinance", "fs-scan01", "old password", "contraseña antigua", "contrasena anterior"] },
      { kb: "fix", label: { en: "what you changed (task disabled, account unlocked)", es: "qué cambiaste (tarea deshabilitada, cuenta desbloqueada)" },
        any: ["disabl", "deshabilit", "desactiv", "unlock", "desbloque"] },
      { kb: "verify", label: { en: "how you checked it", es: "cómo lo comprobaste" }, any: ["lockedout false", "checked", "verified", "comprob", "verific", "stays", "sigue"] },
      { kb: "followup", label: { en: "the follow-up (service account, server owner)", es: "el seguimiento (cuenta de servicio, responsable del servidor)" },
        any: ["service account", "cuenta de servicio", "svc-", "owner", "responsable"] },
    ],
    solution: [
      "Get-ADUser mgarcia -Properties LockedOut,badPwdCount,LastBadPasswordAttempt",
      "Get-WinEvent -ComputerName DC01 -FilterHashtable @{LogName='Security';Id=4740}",
      "Get-ScheduledTask -CimSession FS-SCAN01",
      "Disable-ScheduledTask -CimSession FS-SCAN01 -TaskName ScanToFinance -TaskPath '\\Contoso\\'",
      "Unlock-ADAccount mgarcia",
      "Get-ADUser mgarcia -Properties LockedOut",
    ],
    sampleNote: {
      en: "Lockouts came from scheduled task ScanToFinance on FS-SCAN01 running as mgarcia with her old password (event 4740 on DC01). Disabled the task, unlocked the account and checked LockedOut False after 10 minutes. Asked the server owner to run the task with a service account.",
      es: "Los bloqueos venían de la tarea programada ScanToFinance en FS-SCAN01, que se ejecutaba como mgarcia con su contraseña antigua (evento 4740 en DC01). Deshabilité la tarea, desbloqueé la cuenta y comprobé LockedOut False a los 10 minutos. Pedí al responsable del servidor que la tarea use una cuenta de servicio.",
    },
  });

  /* ------------------------------------------------------------------ 2. Intranet does not open */
  scenarios.push({
    id: "dns-intranet",
    level: 1,
    topic: { en: "Network / DNS", es: "Red / DNS" },
    minutes: 10,
    title: { en: "Internet works, the intranet does not", es: "Internet funciona, la intranet no" },
    guide: GUIDE + "windows-diagnostico-basico-equipo-lento-o-con-errores.html",
    machine: { host: "LAPTOP-0217", user: "jruiz", domain: "CONTOSO", shell: "powershell", prompt: "PS C:\\Windows\\system32> " },
    ticket: {
      id: "INC-20433", from: "Javier Ruiz (Sales)", priority: "P3",
      subject: { en: "Intranet and shared folders do not open", es: "No abren la intranet ni las carpetas compartidas" },
      body: {
        en: "Back in the office after a trade fair. Internet works, Teams works, but the intranet (intranet.contoso.local) says the page cannot be found and the S: drive is disconnected. At the hotel I had to change some network setting to get online.",
        es: "He vuelto a la oficina después de una feria. Internet funciona, Teams también, pero la intranet (intranet.contoso.local) dice que no encuentra la página y la unidad S: está desconectada. En el hotel tuve que cambiar algo de la red para conectarme.",
      },
    },
    intro: {
      en: "You are connected to Javier's laptop with remote assistance, in an elevated PowerShell. The intranet server is 10.20.1.15; the office DNS servers are the domain controllers (10.20.1.10 and 10.20.1.11), handed out by DHCP.",
      es: "Estás conectado al portátil de Javier con asistencia remota, en un PowerShell elevado. El servidor de la intranet es 10.20.1.15; los DNS de la oficina son los controladores de dominio (10.20.1.10 y 10.20.1.11), entregados por DHCP.",
    },
    requester: { name: "Javier Ruiz", team: { en: "Sales", es: "Ventas" }, user: "jruiz", location: { en: "Head office, Sales area", es: "Oficina central, zona de Ventas" }, device: "LAPTOP-0217" },
    asset: {
      title: { en: "Device · LAPTOP-0217", es: "Equipo · LAPTOP-0217" },
      fields: [
        { label: { en: "DNS servers", es: "Servidores DNS" }, states: [
          { when: { dnsStatic: true }, value: { en: "8.8.8.8, 1.1.1.1 (set by hand)", es: "8.8.8.8, 1.1.1.1 (puestos a mano)" }, tone: "bad" },
          { value: "10.20.1.10, 10.20.1.11 (DHCP)", tone: "ok" }] },
        { label: { en: "DNS cache", es: "Caché DNS" }, states: [
          { when: { flushed: true }, value: { en: "Flushed", es: "Vaciada" }, tone: "ok" },
          { value: { en: "Not flushed", es: "Sin vaciar" }, tone: "muted" }] },
        { label: { en: "Intranet by name", es: "Intranet por nombre" }, states: [
          { when: { verified: true }, value: { en: "Answers", es: "Responde" }, tone: "ok" },
          { value: { en: "Not found", es: "No se encuentra" }, tone: "bad" }] },
        { label: { en: "Network", es: "Red" }, value: { en: "Office Ethernet", es: "Ethernet de la oficina" } },
      ],
    },
    actions: [{ id: "flush", label: { en: "Flush DNS cache", es: "Vaciar caché DNS" }, cmd: "ipconfig /flushdns" }],
    codes: ["config-fixed"],
    desktop: {
      apps: [
        { id: "network", icon: "⇄", title: { en: "Network settings", es: "Configuración de red" }, look: "ipconfig /all",
          fields: [
            { label: { en: "Adapter", es: "Adaptador" }, value: { en: "Ethernet · connected", es: "Ethernet · conectado" } },
            { label: { en: "IPv4 address", es: "Dirección IPv4" }, value: { en: "10.20.14.57 (automatic, DHCP)", es: "10.20.14.57 (automática, DHCP)" } },
            { label: { en: "Default gateway", es: "Puerta de enlace" }, value: "10.20.14.1" },
            { label: { en: "DNS server assignment", es: "Asignación de servidor DNS" }, states: [
              { when: { dnsStatic: true }, value: { en: "Manual: 8.8.8.8, 1.1.1.1", es: "Manual: 8.8.8.8, 1.1.1.1" }, tone: "bad" },
              { value: { en: "Automatic (DHCP): 10.20.1.10, 10.20.1.11", es: "Automática (DHCP): 10.20.1.10, 10.20.1.11" }, tone: "ok" }] },
          ],
          actions: [{ id: "dns-auto", label: { en: "Set DNS to automatic (DHCP)", es: "Poner los DNS en automático (DHCP)" },
            cmd: "Set-DnsClientServerAddress -InterfaceAlias Ethernet -ResetServerAddresses", when: { dnsStatic: true } }] },
        { id: "browser", icon: "◎", title: { en: "Browser", es: "Navegador" }, look: "Test-NetConnection intranet.contoso.local -Port 443",
          page: { url: "https://intranet.contoso.local", states: [
            { when: { verified: true }, title: { en: "Contoso intranet", es: "Intranet de Contoso" },
              text: { en: "Welcome back, Javier. News · Holidays · IT requests · S: drive connected.", es: "Hola de nuevo, Javier. Noticias · Vacaciones · Peticiones a IT · Unidad S: conectada." }, tone: "ok" },
            { title: { en: "This site can't be reached", es: "No se puede acceder a este sitio" },
              text: { en: "intranet.contoso.local's server IP address could not be found. DNS_PROBE_FINISHED_NXDOMAIN", es: "No se ha encontrado la dirección IP del servidor de intranet.contoso.local. DNS_PROBE_FINISHED_NXDOMAIN" }, tone: "bad" }] },
          actions: [{ id: "reload", label: { en: "Reload", es: "Recargar" }, cmd: "Test-NetConnection intranet.contoso.local -Port 443" }] },
      ],
      log: [
        { level: "warning", time: "25/10/2026 08:49", source: "Microsoft-Windows-Time-Service", id: 129,
          text: { en: "NtpClient was unable to set a domain peer to use as a time source because of discovery error.", es: "NtpClient no pudo establecer un mismo nivel del dominio para usarlo como origen de hora debido a un error de detección." } },
        { level: "error", time: "25/10/2026 08:51", source: "Microsoft-Windows-GroupPolicy", id: 1129,
          text: { en: "The processing of Group Policy failed because of lack of network connectivity to a domain controller.", es: "Error al procesar la directiva de grupo debido a la falta de conectividad de red con un controlador de dominio." } },
        { when: { verified: true }, level: "information", time: "26/10/2026 09:41", source: "Microsoft-Windows-GroupPolicy", id: 1502,
          text: { en: "The processing of Group Policy succeeded. Windows detected and applied new settings.", es: "El procesamiento de la directiva de grupo se realizó correctamente. Windows detectó y aplicó nuevas opciones de configuración." } },
      ],
    },
    state: { dnsStatic: true, foundDns: false, flushed: false, verified: false },
    commands: [
      { id: "ipall", match: /^ipconfig\s+\/all\b/, when: { dnsStatic: true }, set: { foundDns: true }, out: [
        "", "Ethernet adapter Ethernet:", "",
        "   DHCP Enabled. . . . . . . . . . . : Yes",
        "   IPv4 Address. . . . . . . . . . . : 10.20.14.57(Preferred)",
        "   Subnet Mask . . . . . . . . . . . : 255.255.255.0",
        "   Default Gateway . . . . . . . . . : 10.20.14.1",
        "   DHCP Server . . . . . . . . . . . : 10.20.1.10",
        "   DNS Servers . . . . . . . . . . . : 8.8.8.8",
        "                                       1.1.1.1", ""],
        say: { en: "The IP comes from DHCP, but the DNS servers are public ones typed by hand. They cannot resolve contoso.local.",
               es: "La IP viene por DHCP, pero los DNS son públicos y puestos a mano. No pueden resolver contoso.local." } },
      { id: "ipall-ok", match: /^ipconfig\s+\/all\b/, out: [
        "", "Ethernet adapter Ethernet:", "", "   DHCP Enabled. . . . . . . . . . . : Yes",
        "   IPv4 Address. . . . . . . . . . . : 10.20.14.57(Preferred)",
        "   DNS Servers . . . . . . . . . . . : 10.20.1.10", "                                       10.20.1.11", ""] },
      { id: "ip", match: /^ipconfig\s*$/, out: [
        "", "Ethernet adapter Ethernet:", "", "   IPv4 Address. . . . . . . . . . . : 10.20.14.57",
        "   Subnet Mask . . . . . . . . . . . : 255.255.255.0", "   Default Gateway . . . . . . . . . : 10.20.14.1", ""],
        say: { en: "The address and gateway look fine. ipconfig without /all does not show the DNS servers.", es: "La dirección y la puerta de enlace están bien. ipconfig sin /all no muestra los DNS." } },
      { id: "dnsaddr", match: /^get-dnsclientserveraddress\b/, when: { dnsStatic: true }, set: { foundDns: true }, out: [
        "", "InterfaceAlias  Interface Address ServerAddresses", "                Index     Family",
        "--------------  --------- ------- ---------------", "Ethernet               12 IPv4    {8.8.8.8, 1.1.1.1}", ""] },
      { id: "dnsaddr-ok", match: /^get-dnsclientserveraddress\b/, out: [
        "", "InterfaceAlias  Interface Address ServerAddresses", "--------------  --------- ------- ---------------",
        "Ethernet               12 IPv4    {10.20.1.10, 10.20.1.11}", ""] },
      { id: "ping-ip", match: /^ping\s+10\.20\.1\.15\b/, out: [
        "", "Pinging 10.20.1.15 with 32 bytes of data:", "Reply from 10.20.1.15: bytes=32 time=2ms TTL=127",
        "Reply from 10.20.1.15: bytes=32 time=1ms TTL=127", ""],
        say: { en: "The server answers by IP: the network is fine, the name is not.", es: "El servidor responde por IP: la red está bien, el nombre no." } },
      { id: "ping-ok", match: /^(ping|test-connection)\b.*intranet/, when: { dnsStatic: false, flushed: true }, set: { verified: true }, out: [
        "", "Pinging intranet.contoso.local [10.20.1.15] with 32 bytes of data:", "Reply from 10.20.1.15: bytes=32 time=1ms TTL=127", ""] },
      { id: "ping-cache", match: /^(ping|test-connection)\b.*intranet/, when: { dnsStatic: false }, out: [
        "", "Ping request could not find host intranet.contoso.local. Please check the name and try again.", ""],
        say: { en: "The DNS servers are right now, but Windows still remembers the failed lookup.", es: "Los DNS ya son los correctos, pero Windows aún recuerda la búsqueda fallida." } },
      { id: "ping-bad", match: /^(ping|test-connection)\b.*intranet/, out: [
        "", "Ping request could not find host intranet.contoso.local. Please check the name and try again.", ""] },
      { id: "ns-ok", match: /^(nslookup|resolve-dnsname)\b.*intranet/, when: { dnsStatic: false }, set: {}, out: [
        "", "Server:  dc01.contoso.local", "Address:  10.20.1.10", "", "Name:    intranet.contoso.local", "Address:  10.20.1.15", ""] },
      { id: "ns-bad", match: /^(nslookup|resolve-dnsname)\b.*intranet/, set: { foundDns: true }, out: [
        "", "Server:  dns.google", "Address:  8.8.8.8", "", "*** dns.google can't find intranet.contoso.local: Non-existent domain", ""] },
      { id: "reset", match: /^(set-dnsclientserveraddress\b.*-resetserveraddresses|netsh\s+int(erface)?\s+ip(v4)?\s+set\s+dns(servers)?\b.*\bdhcp\b)/,
        set: { dnsStatic: false }, out: [""],
        say: { en: "DNS servers back to DHCP.", es: "Los DNS vuelven a DHCP." } },
      { id: "static", match: /^set-dnsclientserveraddress\b.*10\.20\.1\.1[01]/, set: { dnsStatic: false }, out: [""],
        say: { en: "That works in the office, but a static DNS breaks again at the next hotel. Back to DHCP is the better fix.",
               es: "Funciona en la oficina, pero un DNS fijo volverá a fallar en el próximo hotel. Volver a DHCP es mejor solución." } },
      { id: "flush", match: /^(ipconfig\s+\/flushdns|clear-dnsclientcache)\b/, set: { flushed: true }, out: [
        "", "Windows IP Configuration", "", "Successfully flushed the DNS Resolver Cache.", ""] },
      { id: "tnc", match: /^test-netconnection\b.*intranet/, when: { dnsStatic: false, flushed: true }, set: { verified: true }, out: [
        "", "ComputerName     : intranet.contoso.local", "RemoteAddress    : 10.20.1.15", "RemotePort       : 443", "TcpTestSucceeded : True", ""] },
      { id: "tnc-bad", match: /^test-netconnection\b.*intranet/, out: [
        "WARNING: Name resolution of intranet.contoso.local failed", "", "ComputerName   : intranet.contoso.local", "RemoteAddress  :", "PingSucceeded  : False", ""] },
    ],
    goal: { dnsStatic: false, flushed: true, verified: true },
    stages: [
      { id: "investigate", label: { en: "Find why the name does not resolve", es: "Encontrar por qué no resuelve el nombre" }, when: { foundDns: true } },
      { id: "fix", label: { en: "Restore the DNS settings", es: "Restaurar la configuración DNS" }, when: { dnsStatic: false, flushed: true } },
      { id: "verify", label: { en: "Check the intranet answers by name", es: "Comprobar que la intranet responde por nombre" }, when: { verified: true } },
    ],
    resolved: { en: "Resolved: the intranet answers by name. Now write the work note.", es: "Resuelto: la intranet responde por nombre. Ahora escribe la nota de trabajo." },
    hints: [
      { en: "Ping the server by IP (10.20.1.15) and then by name: is it the network or the name?", es: "Haz ping al servidor por IP (10.20.1.15) y luego por nombre: ¿es la red o el nombre?" },
      { en: "ipconfig /all shows which DNS servers the laptop uses.", es: "ipconfig /all muestra qué DNS usa el portátil." },
      { en: "Put the DNS back to DHCP: Set-DnsClientServerAddress -InterfaceAlias Ethernet -ResetServerAddresses, then ipconfig /flushdns.",
        es: "Devuelve los DNS a DHCP: Set-DnsClientServerAddress -InterfaceAlias Ethernet -ResetServerAddresses, y después ipconfig /flushdns." },
      { en: "Check with ping intranet.contoso.local or Test-NetConnection intranet.contoso.local -Port 443.", es: "Compruébalo con ping intranet.contoso.local o Test-NetConnection intranet.contoso.local -Port 443." },
    ],
    note: [
      { kb: "cause", label: { en: "the cause (public DNS set by hand at the hotel)", es: "la causa (DNS públicos puestos a mano en el hotel)" },
        any: ["8.8.8.8", "1.1.1.1", "static dns", "manual dns", "public dns", "dns publico", "dns estatico", "dns fijo", "dns manual", "a mano", "hotel"] },
      { kb: "fix", label: { en: "the fix (back to DHCP, cache flushed)", es: "la solución (vuelta a DHCP, caché vaciada)" }, any: ["dhcp", "reset", "flushdns", "flush", "restablec", "cache"] },
      { kb: "verify", label: { en: "how you checked it", es: "cómo lo comprobaste" }, any: ["ping", "nslookup", "test-netconnection", "resolve", "opens", "abre", "responde", "s: drive", "unidad s"] },
      { kb: "followup", label: { en: "advice to the user for next time", es: "el consejo al usuario para la próxima vez" }, any: ["advised", "explained", "told", "next time", "expliqu", "avis", "aconsej", "proxima vez", "vpn"] },
    ],
    solution: ["ping 10.20.1.15", "ping intranet.contoso.local", "ipconfig /all", "Set-DnsClientServerAddress -InterfaceAlias Ethernet -ResetServerAddresses",
               "ipconfig /flushdns", "ping intranet.contoso.local"],
    sampleNote: {
      en: "Laptop had public DNS 8.8.8.8/1.1.1.1 set by hand at a hotel, so contoso.local names did not resolve (ping by IP worked). Reset DNS to DHCP and flushed the cache; ping and the intranet work by name and S: reconnected. Told the user to use the VPN instead of changing network settings.",
      es: "El portátil tenía DNS públicos 8.8.8.8/1.1.1.1 puestos a mano en un hotel, así que no resolvía los nombres de contoso.local (el ping por IP funcionaba). Devolví los DNS a DHCP y vacié la caché; ping e intranet funcionan por nombre y la unidad S: se reconectó. Expliqué al usuario que use la VPN en lugar de cambiar la configuración de red.",
    },
  });

  /* ------------------------------------------------------------------ 3. Disk full */
  scenarios.push({
    id: "disk-full",
    level: 1,
    topic: { en: "Windows", es: "Windows" },
    minutes: 15,
    title: { en: "Disk full: Excel cannot save", es: "Disco lleno: Excel no puede guardar" },
    guide: GUIDE + "windows-diagnostico-basico-equipo-lento-o-con-errores.html",
    machine: { host: "PC-FIN-033", user: "lperez", domain: "CONTOSO", shell: "powershell", prompt: "PS C:\\Windows\\system32> " },
    ticket: {
      id: "INC-20447", from: "Laura Pérez (Accounting)", priority: "P2",
      subject: { en: "Excel says the disk is full, the PC is very slow", es: "Excel dice que el disco está lleno, el equipo va lentísimo" },
      body: {
        en: "I cannot save the month-end workbook: 'There is not enough disk space'. The computer has been very slow for days. I have not installed anything.",
        es: "No puedo guardar el libro del cierre de mes: 'No hay espacio suficiente en el disco'. El equipo lleva días muy lento. No he instalado nada.",
      },
    },
    intro: {
      en: "You are on Laura's PC with an elevated PowerShell. The disk is 128 GB. Do not delete user documents.",
      es: "Estás en el equipo de Laura con un PowerShell elevado. El disco es de 128 GB. No borres documentos del usuario.",
    },
    requester: { name: "Laura Pérez", team: { en: "Accounting", es: "Contabilidad" }, user: "lperez", location: { en: "Head office, 3rd floor", es: "Oficina central, 3ª planta" }, device: "PC-FIN-033" },
    asset: {
      title: { en: "Device · PC-FIN-033", es: "Equipo · PC-FIN-033" },
      fields: [
        { label: { en: "Free space on C:", es: "Espacio libre en C:" }, states: [
          { when: { tempClean: true, wuClean: true }, value: { en: "18.4 GB of 128 GB", es: "18,4 GB de 128 GB" }, tone: "ok" },
          { when: { tempClean: true }, value: { en: "12.2 GB of 128 GB", es: "12,2 GB de 128 GB" }, tone: "warn" },
          { when: { wuClean: true }, value: { en: "6.6 GB of 128 GB", es: "6,6 GB de 128 GB" }, tone: "warn" },
          { value: { en: "0.4 GB of 128 GB", es: "0,4 GB de 128 GB" }, tone: "bad" }] },
        { label: { en: "User temp folder", es: "Carpeta temporal del usuario" }, states: [
          { when: { tempClean: true }, value: { en: "Emptied", es: "Vaciada" }, tone: "ok" },
          { value: { en: "Not reviewed", es: "Sin revisar" }, tone: "muted" }] },
        { label: { en: "Windows Update service", es: "Servicio Windows Update" }, states: [
          { when: { wuRunning: true }, value: { en: "Running", es: "En ejecución" }, tone: "ok" },
          { value: { en: "Stopped", es: "Detenido" }, tone: "warn" }] },
      ],
    },
    actions: [{ id: "wu-start", label: { en: "Start Windows Update", es: "Arrancar Windows Update" }, cmd: "Start-Service wuauserv", when: { wuRunning: false } }],
    codes: ["capacity"],
    desktop: {
      apps: [
        { id: "storage", icon: "▤", title: { en: "Storage", es: "Almacenamiento" },
          look: "Get-ChildItem C:\\Users,C:\\Windows -Directory -Recurse | Measure-Object -Sum Length",
          fields: [
            { label: { en: "Free space on C:", es: "Espacio libre en C:" }, states: [
              { when: { tempClean: true, wuClean: true }, value: { en: "18.4 GB of 128 GB", es: "18,4 GB de 128 GB" }, tone: "ok" },
              { when: { tempClean: true }, value: { en: "12.2 GB of 128 GB", es: "12,2 GB de 128 GB" }, tone: "warn" },
              { when: { wuClean: true }, value: { en: "6.6 GB of 128 GB", es: "6,6 GB de 128 GB" }, tone: "warn" },
              { value: { en: "0.4 GB of 128 GB", es: "0,4 GB de 128 GB" }, tone: "bad" }] },
            { label: { en: "Temporary files (Laura)", es: "Archivos temporales (Laura)" }, states: [
              { when: { tempClean: true }, value: "0.2 GB", tone: "ok" }, { value: "11.8 GB", tone: "warn" }] },
            { label: { en: "Windows Update cache", es: "Caché de Windows Update" }, states: [
              { when: { wuClean: true }, value: "0 GB", tone: "ok" }, { value: "6.2 GB", tone: "warn" }] },
            { label: { en: "Documents", es: "Documentos" }, value: "4.1 GB" },
          ],
          actions: [
            { id: "temp", label: { en: "Empty temporary files", es: "Vaciar archivos temporales" }, cmd: "Remove-Item $env:TEMP\\* -Recurse -Force", when: { tempClean: false } },
            { id: "wu-cache", label: { en: "Empty the Windows Update cache", es: "Vaciar la caché de Windows Update" },
              cmd: "Remove-Item C:\\Windows\\SoftwareDistribution\\Download\\* -Recurse -Force", when: { wuClean: false } },
            { id: "refresh", label: { en: "Refresh free space", es: "Actualizar espacio libre" }, cmd: "Get-PSDrive C" }] },
        { id: "services", icon: "⚙", title: { en: "Services", es: "Servicios" },
          fields: [
            { label: "Windows Update (wuauserv)", states: [
              { when: { wuRunning: true }, value: { en: "Running", es: "En ejecución" }, tone: "ok" }, { value: { en: "Stopped", es: "Detenido" }, tone: "warn" }] },
            { label: { en: "Startup type", es: "Tipo de inicio" }, value: { en: "Manual (trigger start)", es: "Manual (desencadenado)" } },
          ],
          actions: [
            { id: "stop", label: { en: "Stop Windows Update", es: "Detener Windows Update" }, cmd: "Stop-Service wuauserv", when: { wuRunning: true } },
            { id: "start", label: { en: "Start Windows Update", es: "Iniciar Windows Update" }, cmd: "Start-Service wuauserv", when: { wuRunning: false } }] },
      ],
      log: [
        { level: "warning", time: "24/10/2026 17:12", source: "srv", id: 2013,
          text: { en: "The C: disk is at or near capacity. You may need to delete some files.", es: "El disco C: está lleno o casi lleno. Puede que necesite eliminar algunos archivos." } },
        { level: "warning", time: "25/10/2026 08:05", source: "srv", id: 2013,
          text: { en: "The C: disk is at or near capacity. You may need to delete some files.", es: "El disco C: está lleno o casi lleno. Puede que necesite eliminar algunos archivos." } },
      ],
    },
    state: { foundBig: false, tempClean: false, wuRunning: true, wuClean: false, verified: false },
    commands: [
      { id: "free-0", match: /^(get-psdrive\b.*\bc\b|get-volume\b|fsutil\s+volume\s+diskfree|wmic\s+logicaldisk|gdr\b.*\bc\b)/, when: { tempClean: false, wuClean: false }, out: [
        "", "Name   Used (GB)   Free (GB) Provider   Root", "----   ---------   --------- --------   ----", "C         118,62        0,38 FileSystem C:\\", ""] },
      { id: "free-t", match: /^(get-psdrive\b.*\bc\b|get-volume\b|fsutil\s+volume\s+diskfree|wmic\s+logicaldisk|gdr\b.*\bc\b)/, when: { tempClean: true, wuClean: false }, out: [
        "", "Name   Used (GB)   Free (GB) Provider   Root", "----   ---------   --------- --------   ----", "C         106,80       12,20 FileSystem C:\\", ""] },
      { id: "free-w", match: /^(get-psdrive\b.*\bc\b|get-volume\b|fsutil\s+volume\s+diskfree|wmic\s+logicaldisk|gdr\b.*\bc\b)/, when: { tempClean: false, wuClean: true }, out: [
        "", "Name   Used (GB)   Free (GB) Provider   Root", "----   ---------   --------- --------   ----", "C         112,40        6,60 FileSystem C:\\", ""] },
      { id: "free-all", match: /^(get-psdrive\b.*\bc\b|get-volume\b|fsutil\s+volume\s+diskfree|wmic\s+logicaldisk|gdr\b.*\bc\b)/, set: { verified: true }, out: [
        "", "Name   Used (GB)   Free (GB) Provider   Root", "----   ---------   --------- --------   ----", "C         100,60       18,40 FileSystem C:\\", ""] },
      { id: "sizes", match: /^(get-childitem|gci|dir|ls)\b.*(-recurse|\/s\b)/, set: { foundBig: true }, out: [
        "", "Folder                                          Size (GB)", "------                                          ---------",
        "C:\\Users\\lperez\\AppData\\Local\\Temp                  11,8",
        "C:\\Windows\\SoftwareDistribution\\Download             6,2",
        "C:\\Users\\lperez\\Documents                            4,1",
        "C:\\Windows\\Temp                                       0,3", ""],
        say: { en: "Two folders that can be emptied: Laura's temp folder (a reporting add-in leaves a file there on every export) and the Windows Update download cache.",
               es: "Dos carpetas que se pueden vaciar: la carpeta temporal de Laura (un complemento de informes deja un fichero en cada exportación) y la caché de descargas de Windows Update." } },
      { id: "root", match: /^(get-childitem|gci|dir|ls)\s+c:\\?\s*$/, out: [
        "", "    Directory: C:\\", "", "Mode   Name", "----   ----", "d----  PerfLogs", "d-r--  Program Files", "d-r--  Program Files (x86)", "d-r--  Users", "d----  Windows", ""],
        say: { en: "Folder sizes need a recursive listing with Measure-Object, or a tool like TreeSize.", es: "Para ver tamaños hace falta un listado recursivo con Measure-Object, o una herramienta como TreeSize." } },
      { id: "temp", match: /^(remove-item\b.*(\\temp|\$env:temp|%temp%)|del\b.*(%temp%|\\temp))/, unless: { tempClean: true }, set: { tempClean: true }, out: [
        "Remove-Item : Cannot remove item C:\\Users\\lperez\\AppData\\Local\\Temp\\~DF2A1C.tmp: The process cannot access the file because it is being used by another process.", ""],
        say: { en: "11.6 GB deleted; a few files in use were skipped, which is normal.", es: "11,6 GB borrados; se han saltado unos pocos ficheros en uso, es normal." } },
      { id: "temp-again", match: /^(remove-item\b.*(\\temp|\$env:temp|%temp%)|del\b.*(%temp%|\\temp))/, out: [""] },
      { id: "wu-locked", match: /^(remove-item|del|rd|rmdir)\b.*softwaredistribution/, when: { wuRunning: true }, error: true, out: [
        "Remove-Item : Cannot remove item C:\\Windows\\SoftwareDistribution\\Download\\a3f1...: The process cannot access the file because it is being used by another process.", ""],
        say: { en: "Windows Update is using the folder. Stop the service first.", es: "Windows Update está usando la carpeta. Para antes el servicio." } },
      { id: "wu-clean", match: /^(remove-item|del|rd|rmdir)\b.*softwaredistribution/, set: { wuClean: true }, out: [""],
        say: { en: "Download cache emptied (6.2 GB). Windows Update will download again only what it still needs.", es: "Caché de descargas vaciada (6,2 GB). Windows Update solo volverá a descargar lo que necesite." } },
      { id: "wu-stop", match: /^(stop-service\b.*wuauserv|net\s+stop\s+wuauserv)/, set: { wuRunning: false }, out: ["The Windows Update service was stopped successfully.", ""] },
      { id: "wu-start", match: /^(start-service\b.*wuauserv|net\s+start\s+wuauserv)/, set: { wuRunning: true }, out: ["The Windows Update service was started successfully.", ""] },
      { id: "wu-running", match: /^get-service\b.*wuauserv/, when: { wuRunning: true }, out: ["", "Status   Name       DisplayName", "------   ----       -----------", "Running  wuauserv   Windows Update", ""] },
      { id: "wu-stopped", match: /^get-service\b.*wuauserv/, out: ["", "Status   Name       DisplayName", "------   ----       -----------", "Stopped  wuauserv   Windows Update", ""],
        say: { en: "Remember to start it again before you finish.", es: "Acuérdate de arrancarlo otra vez antes de terminar." } },
      { id: "cleanmgr", match: /^(cleanmgr|dism\b.*startcomponentcleanup)/, out: ["", "The operation completed successfully.", ""],
        say: { en: "Useful, but it freed less than 1 GB here. The space is in the two folders you can find with a size listing.",
               es: "Útil, pero aquí libera menos de 1 GB. El espacio está en dos carpetas que encuentras con un listado de tamaños." } },
    ],
    goal: { tempClean: true, wuClean: true, wuRunning: true, verified: true },
    stages: [
      { id: "investigate", label: { en: "Find what is using the space", es: "Encontrar qué ocupa el espacio" }, when: { foundBig: true } },
      { id: "fix", label: { en: "Free space safely (and leave Windows Update running)", es: "Liberar espacio con seguridad (y dejar Windows Update en marcha)" },
        when: { tempClean: true, wuClean: true, wuRunning: true } },
      { id: "verify", label: { en: "Check the free space", es: "Comprobar el espacio libre" }, when: { verified: true } },
    ],
    resolved: { en: "Resolved: 18 GB free and Windows Update running. Now write the work note.", es: "Resuelto: 18 GB libres y Windows Update en marcha. Ahora escribe la nota de trabajo." },
    hints: [
      { en: "How much is free? Get-PSDrive C", es: "¿Cuánto queda libre? Get-PSDrive C" },
      { en: "Find the big folders, e.g. Get-ChildItem C:\\Users,C:\\Windows -Directory -Recurse ... | Measure-Object -Sum Length", es: "Busca las carpetas grandes, p. ej. Get-ChildItem C:\\Users,C:\\Windows -Directory -Recurse ... | Measure-Object -Sum Length" },
      { en: "Empty $env:TEMP with Remove-Item $env:TEMP\\* -Recurse -Force", es: "Vacía $env:TEMP con Remove-Item $env:TEMP\\* -Recurse -Force" },
      { en: "For C:\\Windows\\SoftwareDistribution\\Download: Stop-Service wuauserv, Remove-Item ...\\Download\\* -Recurse -Force, Start-Service wuauserv.",
        es: "Para C:\\Windows\\SoftwareDistribution\\Download: Stop-Service wuauserv, Remove-Item ...\\Download\\* -Recurse -Force, Start-Service wuauserv." },
    ],
    note: [
      { kb: "cause", label: { en: "what filled the disk", es: "qué llenaba el disco" }, any: ["temp", "softwaredistribution", "windows update", "add-in", "complemento"] },
      { kb: "fix", label: { en: "what you deleted", es: "qué borraste" }, any: ["deleted", "removed", "cleaned", "emptied", "borr", "elimin", "limpi", "vaci"] },
      { kb: "verify", label: { en: "the free space after", es: "el espacio libre después" }, any: ["gb", "free", "libre"] },
      { kb: "followup", label: { en: "how to stop it happening again", es: "cómo evitar que vuelva a pasar" },
        any: ["storage sense", "sensor de almacenamiento", "intune", "gpo", "monitor", "alert", "alerta", "add-in", "complemento", "vendor", "proveedor"] },
    ],
    solution: ["Get-PSDrive C", "Get-ChildItem C:\\Users,C:\\Windows -Directory -Recurse | Measure-Object -Sum Length", "Remove-Item $env:TEMP\\* -Recurse -Force",
               "Stop-Service wuauserv", "Remove-Item C:\\Windows\\SoftwareDistribution\\Download\\* -Recurse -Force", "Start-Service wuauserv", "Get-PSDrive C"],
    sampleNote: {
      en: "C: had 0.4 GB free: 11.8 GB in the user's temp folder (reporting add-in leaves a file per export) and 6.2 GB of Windows Update cache. Emptied both (stopped and restarted wuauserv). 18.4 GB free now. Proposed enabling Storage Sense by Intune and reported the add-in to the vendor.",
      es: "C: tenía 0,4 GB libres: 11,8 GB en la carpeta temporal del usuario (un complemento de informes deja un fichero por exportación) y 6,2 GB de caché de Windows Update. Vacié ambas (paré y arranqué wuauserv). Ahora hay 18,4 GB libres. Propuse activar el Sensor de almacenamiento por Intune y avisé al proveedor del complemento.",
    },
  });

  /* ------------------------------------------------------------------ 4. Stuck print queue */
  scenarios.push({
    id: "print-queue",
    level: 1,
    topic: { en: "Printers", es: "Impresoras" },
    minutes: 10,
    title: { en: "The reception printer queue that will not empty", es: "La cola de la impresora de recepción que no se vacía" },
    guide: GUIDE + "impresoras-instalar-impresora-de-red-y-cola-atascada.html",
    machine: { host: "PRT-SRV01", user: "it.admin", domain: "CONTOSO", shell: "powershell", prompt: "PS C:\\Users\\it.admin> " },
    ticket: {
      id: "INC-20452", from: "Reception (Head office)", priority: "P2",
      subject: { en: "Reception printer does not print, 14 jobs stuck", es: "La impresora de recepción no imprime, 14 trabajos atascados" },
      body: {
        en: "Nothing prints since 9:00. There are 14 documents in the queue and they cannot be cancelled: the first one says 'Deleting' and stays there. We turned the printer off and on.",
        es: "No sale nada desde las 9:00. Hay 14 documentos en la cola y no se pueden cancelar: el primero pone 'Eliminando' y se queda ahí. Ya hemos apagado y encendido la impresora.",
      },
    },
    intro: {
      en: "You are on the print server PRT-SRV01. It hosts 22 queues for the head office; stopping the spooler pauses all of them for a minute.",
      es: "Estás en el servidor de impresión PRT-SRV01. Tiene 22 colas de la sede; parar el spooler detiene todas durante un minuto.",
    },
    requester: { name: { en: "Reception", es: "Recepción" }, team: { en: "Head office", es: "Oficina central" }, user: "recepcion", location: { en: "Ground floor", es: "Planta baja" }, device: "RECEPCION-MFP" },
    asset: {
      title: { en: "Print queue · RECEPCION-MFP", es: "Cola de impresión · RECEPCION-MFP" },
      fields: [
        { label: { en: "Queue", es: "Cola" }, states: [
          { when: { cleared: true }, value: { en: "Empty", es: "Vacía" }, tone: "ok" },
          { value: { en: "14 jobs, job 312 'Deleting'", es: "14 trabajos, el 312 en 'Eliminando'" }, tone: "bad" }] },
        { label: { en: "Spooler on PRT-SRV01", es: "Spooler en PRT-SRV01" }, states: [
          { when: { spooler: "running" }, value: { en: "Running", es: "En ejecución" }, tone: "ok" },
          { value: { en: "Stopped (22 queues paused)", es: "Parado (22 colas en pausa)" }, tone: "warn" }] },
        { label: { en: "Test page", es: "Página de prueba" }, states: [
          { when: { verified: true }, value: { en: "Printed", es: "Impresa" }, tone: "ok" },
          { value: { en: "Pending", es: "Pendiente" }, tone: "muted" }] },
      ],
    },
    actions: [{ id: "restart", label: { en: "Restart the spooler", es: "Reiniciar el spooler" }, cmd: "Restart-Service Spooler", when: { spooler: "running" } }],
    codes: ["cause-removed"],
    bind: [
      { kind: "printer", id: "RECEPCION-MFP", states: [
        { when: { cleared: false }, set: { status: "bad", jobs: 14 },
          note: { en: "Error: job 312 stuck in 'Deleting', 14 jobs waiting", es: "Error: el trabajo 312 atascado en 'Eliminando', 14 trabajos en cola" } },
        { set: { status: "ok", jobs: 0 } }] },
      { kind: "server", id: "PRT-SRV01", states: [
        { when: { spooler: "stopped" }, set: { status: "warn" },
          note: { en: "Print Spooler stopped: the 22 queues are paused", es: "Cola de impresión parada: las 22 colas están en pausa" } },
        { set: {} }] },
    ],
    state: { looked: false, spooler: "running", cleared: false, verified: false },
    commands: [
      { id: "spooler-down", match: /^(get-printjob|get-printer)\b/, when: { spooler: "stopped" }, error: true,
        out: ["Get-PrintJob : The spooler service is not reachable. Ensure the spooler service is running.", ""] },
      { id: "printers", match: /^get-printer\b/, when: { cleared: false }, set: { looked: true }, out: [
        "", "Name            ComputerName  Type   DriverName                  PortName      JobCount PrinterStatus",
        "----            ------------  ----   ----------                  --------      -------- -------------",
        "RECEPCION-MFP   PRT-SRV01     Local  Contoso Universal PCL6      10.20.3.41          14 Error",
        "FIN-MFP-01      PRT-SRV01     Local  Contoso Universal PCL6      10.20.3.42           0 Normal", "..."] },
      { id: "printers-ok", match: /^get-printer\b/, when: { spooler: "running" }, set: { verified: true }, out: [
        "", "Name            ComputerName  Type   DriverName                  PortName      JobCount PrinterStatus",
        "----            ------------  ----   ----------                  --------      -------- -------------",
        "RECEPCION-MFP   PRT-SRV01     Local  Contoso Universal PCL6      10.20.3.41           0 Normal", "..."] },
      { id: "jobs", match: /^get-printjob\b/, when: { cleared: false, spooler: "running" }, set: { looked: true }, out: [
        "", "Id    ComputerName  PrinterName     DocumentName                  SubmittedTime        JobStatus",
        "--    ------------  -----------     ------------                  -------------        ---------",
        "312   PRT-SRV01     RECEPCION-MFP   Visitor badges.pdf            25/10/2026 08:57:31  Error, Deleting",
        "313   PRT-SRV01     RECEPCION-MFP   Courier label                 25/10/2026 09:02:10  Normal",
        "...   (12 more)", ""],
        say: { en: "Job 312 is corrupt and blocks the rest. It cannot be deleted while the spooler holds its file.", es: "El trabajo 312 está corrupto y bloquea el resto. No se puede borrar mientras el spooler tenga su fichero." } },
      { id: "jobs-ok", match: /^get-printjob\b/, when: { spooler: "running" }, set: { verified: true }, out: [""],
        say: { en: "(The queue is empty.)", es: "(La cola está vacía.)" } },
      { id: "removejob", match: /^remove-printjob\b/, when: { cleared: false }, out: [""],
        say: { en: "The command returns, but job 312 is still there in 'Error, Deleting'.", es: "El comando termina, pero el trabajo 312 sigue ahí en 'Error, Eliminando'." } },
      { id: "spool-running", match: /^get-service\b.*spooler/, when: { spooler: "running" }, out: ["", "Status   Name     DisplayName", "------   ----     -----------", "Running  Spooler  Print Spooler", ""] },
      { id: "spool-stopped", match: /^get-service\b.*spooler/, out: ["", "Status   Name     DisplayName", "------   ----     -----------", "Stopped  Spooler  Print Spooler", ""] },
      { id: "stop", match: /^(stop-service\b.*spooler|net\s+stop\s+spooler)/, set: { spooler: "stopped" }, out: ["The Print Spooler service was stopped successfully.", ""] },
      { id: "start", match: /^(start-service\b.*spooler|net\s+start\s+spooler)/, set: { spooler: "running" }, out: ["The Print Spooler service was started successfully.", ""] },
      { id: "restart", match: /^restart-service\b.*spooler/, out: ["WARNING: Waiting for service 'Print Spooler (Spooler)' to start...", ""],
        say: { en: "The spooler restarted, but it loaded job 312 again from disk. The stuck file has to be removed while the service is stopped.",
               es: "El spooler se ha reiniciado, pero ha vuelto a cargar el trabajo 312 del disco. Hay que borrar el fichero atascado con el servicio parado." } },
      { id: "del-running", match: /^(remove-item|del)\b.*spool\\printers/, when: { spooler: "running" }, error: true, out: [
        "Remove-Item : Cannot remove item C:\\Windows\\System32\\spool\\PRINTERS\\00312.SPL: The process cannot access the file because it is being used by another process.", ""] },
      { id: "del", match: /^(remove-item|del)\b.*spool\\printers/, set: { cleared: true }, out: [""],
        say: { en: "Spool files deleted (the 14 jobs are gone; reception will have to send the urgent ones again).", es: "Ficheros de cola borrados (los 14 trabajos desaparecen; recepción tendrá que reenviar los urgentes)." } },
      { id: "testpage", match: /^(.*out-printer\b.*recepcion|rundll32\s+printui\.dll.*\/k\b.*recepcion)/, when: { cleared: true, spooler: "running" }, set: { verified: true }, out: [""],
        say: { en: "Reception confirms the test page came out.", es: "Recepción confirma que ha salido la página de prueba." } },
    ],
    goal: { cleared: true, spooler: "running", verified: true },
    stages: [
      { id: "investigate", label: { en: "Find what blocks the queue", es: "Encontrar qué bloquea la cola" }, when: { looked: true } },
      { id: "fix", label: { en: "Clear the stuck job and restart the spooler", es: "Quitar el trabajo atascado y arrancar el spooler" }, when: { cleared: true, spooler: "running" } },
      { id: "verify", label: { en: "Check the queue and print a test", es: "Comprobar la cola e imprimir una prueba" }, when: { verified: true } },
    ],
    resolved: { en: "Resolved: the queue is empty and printing again. Now write the work note.", es: "Resuelto: la cola está vacía y vuelve a imprimir. Ahora escribe la nota de trabajo." },
    hints: [
      { en: "Look at the queue: Get-PrintJob -PrinterName RECEPCION-MFP", es: "Mira la cola: Get-PrintJob -PrinterName RECEPCION-MFP" },
      { en: "A job stuck in 'Deleting' is held by the spooler. Stop it: Stop-Service Spooler", es: "Un trabajo atascado en 'Eliminando' lo retiene el spooler. Páralo: Stop-Service Spooler" },
      { en: "With the spooler stopped, delete the files in C:\\Windows\\System32\\spool\\PRINTERS, then Start-Service Spooler.", es: "Con el spooler parado, borra los ficheros de C:\\Windows\\System32\\spool\\PRINTERS y después Start-Service Spooler." },
      { en: "Check Get-Printer (JobCount 0) or send a test page.", es: "Comprueba Get-Printer (JobCount 0) o manda una página de prueba." },
    ],
    note: [
      { kb: "cause", label: { en: "the cause (a corrupt job stuck in Deleting)", es: "la causa (un trabajo corrupto atascado en Eliminando)" },
        any: ["corrupt", "corrupto", "stuck", "atascad", "deleting", "eliminando", "312"] },
      { kb: "fix", label: { en: "the fix (spooler stopped, spool files cleared)", es: "la solución (spooler parado, ficheros de cola borrados)" }, any: ["spooler", "spool", "printers folder", "carpeta printers"] },
      { kb: "verify", label: { en: "how you checked it", es: "cómo lo comprobaste" }, any: ["test page", "pagina de prueba", "jobcount", "prints", "imprime", "empty", "vacia"] },
      { kb: "followup", label: { en: "the impact (other queues paused, jobs to resend)", es: "el impacto (otras colas paradas, trabajos a reenviar)" },
        any: ["all queues", "other queues", "otras colas", "todas las colas", "resend", "reenvi", "minute", "minuto"] },
    ],
    solution: ["Get-PrintJob -PrinterName RECEPCION-MFP", "Stop-Service Spooler", "Remove-Item C:\\Windows\\System32\\spool\\PRINTERS\\* -Force",
               "Start-Service Spooler", "Get-Printer -Name RECEPCION-MFP"],
    sampleNote: {
      en: "Job 312 on RECEPCION-MFP was corrupt and stuck in 'Deleting', blocking 14 jobs. Stopped the spooler on PRT-SRV01 (all 22 queues paused for about a minute), deleted the spool files and started it again. JobCount 0 and a test page printed. Reception will resend the urgent documents.",
      es: "El trabajo 312 de RECEPCION-MFP estaba corrupto y atascado en 'Eliminando', bloqueando 14 trabajos. Paré el spooler en PRT-SRV01 (las 22 colas paradas un minuto), borré los ficheros de cola y lo arranqué. JobCount 0 y la página de prueba salió bien. Recepción reenviará los documentos urgentes.",
    },
  });

  /* ------------------------------------------------------------------ 5. Mailbox full */
  scenarios.push({
    id: "mailbox-full",
    level: 2,
    topic: { en: "Exchange Online", es: "Exchange Online" },
    minutes: 15,
    title: { en: "Customer emails bounce: the sales director's mailbox", es: "Los correos de clientes rebotan: el buzón del director comercial" },
    guide: GUIDE + "outlook-exchange-online-buzon-compartido-permisos-autorespuesta.html",
    machine: { host: "ADM-WS01", user: "it.admin", domain: "CONTOSO", shell: "powershell", prompt: "PS C:\\Users\\it.admin> " },
    ticket: {
      id: "INC-20460", from: "Carlos Martín (Sales Director)", priority: "P1",
      subject: { en: "Customers say my emails bounce", es: "Los clientes dicen que mis correos les rebotan" },
      body: {
        en: "Since yesterday afternoon two customers tell me their emails to me bounce. I have not received anything external today. I have a tender closing on Friday. Email: cmartin@contoso.com.",
        es: "Desde ayer por la tarde dos clientes me dicen que los correos que me envían les rebotan. Hoy no he recibido nada de fuera. Tengo una licitación que cierra el viernes. Correo: cmartin@contoso.com.",
      },
    },
    intro: {
      en: "You are on your admin workstation with the ExchangeOnlineManagement module installed. Carlos has a Microsoft 365 E3 licence (50 GB mailbox, archiving included).",
      es: "Estás en tu equipo de administración con el módulo ExchangeOnlineManagement instalado. Carlos tiene licencia Microsoft 365 E3 (buzón de 50 GB, archivo incluido).",
    },
    requester: { name: "Carlos Martín", team: { en: "Sales Director", es: "Director comercial" }, user: "cmartin", location: { en: "Head office, 5th floor (VIP)", es: "Oficina central, 5ª planta (VIP)" }, device: "LAPTOP-0102" },
    asset: {
      title: { en: "Mailbox · cmartin@contoso.com", es: "Buzón · cmartin@contoso.com" },
      fields: [
        { label: { en: "Mailbox size", es: "Tamaño del buzón" }, states: [
          { when: { mfa: true }, value: { en: "28.41 GB of 50 GB", es: "28,41 GB de 50 GB" }, tone: "ok" },
          { value: { en: "49.98 GB of 50 GB", es: "49,98 GB de 50 GB" }, tone: "bad" }] },
        { label: { en: "Archive", es: "Archivo" }, states: [
          { when: { archive: true }, value: { en: "Enabled", es: "Activado" }, tone: "ok" },
          { value: { en: "Not enabled", es: "Sin activar" }, tone: "warn" }] },
        { label: "Managed Folder Assistant", states: [
          { when: { mfa: true }, value: { en: "Processed", es: "Procesado" }, tone: "ok" },
          { value: { en: "Pending", es: "Pendiente" }, tone: "muted" }] },
        { label: { en: "Licence", es: "Licencia" }, value: "Microsoft 365 E3" },
      ],
    },
    actions: [{ id: "archive", label: { en: "Enable archive", es: "Activar el archivo" }, cmd: "Enable-Mailbox cmartin -Archive", when: { connected: true, archive: false } }],
    codes: ["capacity"],
    state: { connected: false, sizeChecked: false, causeFound: false, archive: false, mfa: false, verified: false },
    commands: [
      { id: "connect", match: /^connect-exchangeonline\b/, set: { connected: true }, out: [
        "", "This V3 EXO PowerShell module contains new REST API backed Exchange Online cmdlets...", "(signed in as it.admin@contoso.com)", ""] },
      { id: "not-connected", match: /^(get|set|enable|start)-(exo)?(mailbox|mailboxstatistics|messagetrace|messagetracev2|managedfolderassistant)\b/, when: { connected: false },
        error: true, out: ["Get-EXOMailbox : Run Connect-ExchangeOnline before using the Exchange Online cmdlets.", ""] },
      { id: "trace", match: /^get-messagetrace(v2)?\b/, set: { causeFound: true }, out: [
        "", "Received             SenderAddress              RecipientAddress      Subject               Status",
        "--------             -------------              ----------------      -------               ------",
        "25/10/2026 07:41:09  ana.lopez@fabrikam.com     cmartin@contoso.com   RE: Tender - pricing  Failed",
        "24/10/2026 18:22:51  compras@northwind.es       cmartin@contoso.com   Pedido 4471           Failed", "",
        "Detail: 550 5.2.2 STOREDRV.Deliver; mailbox full", ""] },
      { id: "stats-full", match: /^get-(exo)?mailboxstatistics\b.*cmartin/, when: { mfa: false }, unless: { archive: true }, set: { sizeChecked: true }, out: [
        "", "DisplayName    ItemCount TotalItemSize", "-----------    --------- -------------", "Carlos Martin     412987 49.98 GB (53,666,214,912 bytes)", ""] },
      { id: "stats-archive-empty", match: /^get-(exo)?mailboxstatistics\b.*cmartin/, when: { mfa: false }, set: { sizeChecked: true }, out: [
        "", "DisplayName    ItemCount TotalItemSize", "-----------    --------- -------------", "Carlos Martin     412987 49.98 GB (53,666,214,912 bytes)", ""],
        say: { en: "The archive exists but nothing has moved yet: the retention policy only runs when the Managed Folder Assistant processes the mailbox.",
               es: "El archivo existe pero aún no se ha movido nada: la directiva de retención solo actúa cuando el Managed Folder Assistant procesa el buzón." } },
      { id: "stats-ok", match: /^get-(exo)?mailboxstatistics\b.*cmartin/, set: { verified: true }, out: [
        "", "DisplayName    ItemCount TotalItemSize", "-----------    --------- -------------", "Carlos Martin     231504 28.41 GB (30,505,174,016 bytes)", "",
        "(archive: 181483 items, 21.57 GB)", ""],
        say: { en: "(An hour later.) Items older than two years moved to the archive; 21 GB free in the mailbox.", es: "(Una hora después.) Los elementos de más de dos años se han movido al archivo; 21 GB libres en el buzón." } },
      { id: "mbx", match: /^get-(exo)?mailbox\b.*cmartin/, set: { sizeChecked: true }, out: [
        "", "ProhibitSendReceiveQuota : 50 GB (53,687,091,200 bytes)", "IssueWarningQuota        : 49 GB (52,613,349,376 bytes)",
        "ArchiveStatus            : None", "ArchiveDatabase          :", "RetentionPolicy          : Contoso - Move to archive after 2 years", ""],
        say: { en: "No archive, so the retention policy's 'move to archive' tag has nowhere to move items.", es: "Sin archivo, la etiqueta 'mover al archivo' de la directiva de retención no tiene dónde mover los elementos." } },
      { id: "quota", match: /^set-mailbox\b.*cmartin.*quota/, error: true, out: [
        "Set-Mailbox : The value of ProhibitSendReceiveQuota exceeds the maximum allowed by the mailbox's licence (50 GB).", ""] },
      { id: "archive", match: /^enable-mailbox\b.*cmartin.*-archive\b/, set: { archive: true }, out: [
        "", "Name           Alias    Database         ArchiveStatus", "----           -----    --------         -------------", "Carlos Martin  cmartin  EURPR03DG123-db   Active", ""] },
      { id: "mfa", match: /^start-managedfolderassistant\b.*cmartin/, when: { archive: true }, set: { mfa: true }, out: [""],
        say: { en: "The assistant is processing the mailbox. On a real tenant this can take from minutes to a few hours.", es: "El asistente está procesando el buzón. En un tenant real puede tardar de minutos a unas horas." } },
      { id: "mfa-early", match: /^start-managedfolderassistant\b.*cmartin/, out: [""],
        say: { en: "It runs, but without an archive there is nowhere to move items.", es: "Se ejecuta, pero sin archivo no hay dónde mover elementos." } },
    ],
    goal: { archive: true, mfa: true, verified: true },
    stages: [
      { id: "investigate", label: { en: "Confirm why messages bounce", es: "Confirmar por qué rebotan los mensajes" }, when: { sizeChecked: true } },
      { id: "fix", label: { en: "Make room without losing mail", es: "Hacer sitio sin perder correo" }, when: { archive: true, mfa: true } },
      { id: "verify", label: { en: "Check the mailbox size", es: "Comprobar el tamaño del buzón" }, when: { verified: true } },
    ],
    resolved: { en: "Resolved: the mailbox has room and mail is delivered again. Now write the work note.", es: "Resuelto: el buzón tiene sitio y el correo vuelve a entregarse. Ahora escribe la nota de trabajo." },
    hints: [
      { en: "Connect first: Connect-ExchangeOnline", es: "Conéctate primero: Connect-ExchangeOnline" },
      { en: "Look at the size and the quota: Get-EXOMailboxStatistics cmartin and Get-Mailbox cmartin | fl *Quota*,Archive*,RetentionPolicy",
        es: "Mira el tamaño y la cuota: Get-EXOMailboxStatistics cmartin y Get-Mailbox cmartin | fl *Quota*,Archive*,RetentionPolicy" },
      { en: "The licence includes an archive: Enable-Mailbox cmartin -Archive", es: "La licencia incluye archivo: Enable-Mailbox cmartin -Archive" },
      { en: "Make the retention policy run now: Start-ManagedFolderAssistant cmartin, then check the size again.", es: "Haz que la directiva de retención se ejecute ya: Start-ManagedFolderAssistant cmartin, y vuelve a mirar el tamaño." },
    ],
    note: [
      { kb: "cause", label: { en: "the cause (mailbox at the 50 GB quota, NDR 5.2.2)", es: "la causa (buzón en la cuota de 50 GB, NDR 5.2.2)" }, any: ["50 gb", "quota", "cuota", "full", "lleno", "5.2.2"] },
      { kb: "fix", label: { en: "the fix (archive enabled, retention run)", es: "la solución (archivo activado, retención ejecutada)" }, any: ["archive", "archivo", "managedfolder", "retention", "retencion"] },
      { kb: "verify", label: { en: "how you checked it", es: "cómo lo comprobaste" }, any: ["gb free", "28", "statistics", "size", "tamano", "receives", "recibe", "test email", "correo de prueba"] },
      { kb: "followup", label: { en: "the follow-up (customers to resend, quota alert)", es: "el seguimiento (clientes que reenvíen, alerta de cuota)" },
        any: ["resend", "reenv", "customers", "clientes", "alert", "alerta", "warning", "aviso", "monitor"] },
    ],
    solution: ["Connect-ExchangeOnline", "Get-EXOMailboxStatistics cmartin", "Get-Mailbox cmartin | fl *Quota*,Archive*,RetentionPolicy",
               "Enable-Mailbox cmartin -Archive", "Start-ManagedFolderAssistant cmartin", "Get-EXOMailboxStatistics cmartin"],
    sampleNote: {
      en: "Mailbox cmartin reached the 50 GB quota (49.98 GB), external mail bounced with 550 5.2.2. No archive was enabled, so the 2-year archive policy could not move anything. Enabled the archive (included in E3) and ran Start-ManagedFolderAssistant: 28.4 GB now, 21.6 GB in the archive. Asked Carlos to tell the two customers to resend; proposing a quota warning alert for VIP mailboxes.",
      es: "El buzón de cmartin llegó a la cuota de 50 GB (49,98 GB) y el correo externo rebotaba con 550 5.2.2. No tenía archivo, así que la directiva de archivar a los 2 años no podía mover nada. Activé el archivo (incluido en E3) y ejecuté Start-ManagedFolderAssistant: ahora 28,4 GB y 21,6 GB en el archivo. Pedí a Carlos que avise a los dos clientes para que reenvíen; propongo una alerta de cuota para buzones VIP.",
    },
  });

  /* ------------------------------------------------------------------ 6. Device not compliant */
  scenarios.push({
    id: "intune-bitlocker",
    level: 2,
    topic: { en: "Intune / BitLocker", es: "Intune / BitLocker" },
    minutes: 15,
    title: { en: "'Your device does not meet requirements': Outlook and Teams blocked", es: "'Tu dispositivo no cumple los requisitos': Outlook y Teams bloqueados" },
    guide: GUIDE + "intune-perfiles-y-cumplimiento-en-windows-macos-ios-android-y-dispositivo-que-no-cumple.html",
    machine: { host: "LAPTOP-0388", user: "aortiz", domain: "CONTOSO", shell: "powershell", prompt: "PS C:\\Windows\\system32> " },
    ticket: {
      id: "INC-20471", from: "Ana Ortiz (Legal)", priority: "P2",
      subject: { en: "Outlook and Teams say my device is not compliant", es: "Outlook y Teams dicen que mi dispositivo no cumple" },
      body: {
        en: "This morning Outlook and Teams ask me to 'make my device compliant' and do not open. Company Portal shows a warning about encryption. My laptop came back from repair last week (new motherboard).",
        es: "Esta mañana Outlook y Teams me piden 'hacer que mi dispositivo cumpla' y no abren. Portal de empresa muestra un aviso sobre el cifrado. El portátil volvió de reparación la semana pasada (placa base nueva).",
      },
    },
    intro: {
      en: "You are on Ana's laptop with an elevated PowerShell (remote assistance). The compliance policy requires BitLocker; Conditional Access blocks Microsoft 365 apps on non-compliant devices.",
      es: "Estás en el portátil de Ana con un PowerShell elevado (asistencia remota). La directiva de cumplimiento exige BitLocker; el acceso condicional bloquea las apps de Microsoft 365 en dispositivos que no cumplen.",
    },
    requester: { name: "Ana Ortiz", team: { en: "Legal", es: "Legal" }, user: "aortiz", location: { en: "Head office, 4th floor", es: "Oficina central, 4ª planta" }, device: "LAPTOP-0388" },
    asset: {
      title: { en: "Device · LAPTOP-0388", es: "Dispositivo · LAPTOP-0388" },
      fields: [
        { label: { en: "Compliance", es: "Cumplimiento" }, states: [
          { when: { verified: true }, value: { en: "Compliant", es: "Cumple" }, tone: "ok" },
          { value: { en: "Not compliant", es: "No cumple" }, tone: "bad" }] },
        { label: "BitLocker", states: [
          { when: { encrypted: true }, value: { en: "On (XtsAes256)", es: "Activado (XtsAes256)" }, tone: "ok" },
          { value: { en: "Off", es: "Desactivado" }, tone: "bad" }] },
        { label: { en: "Recovery key in Entra ID", es: "Clave de recuperación en Entra ID" }, states: [
          { when: { escrowed: true }, value: { en: "Stored", es: "Guardada" }, tone: "ok" },
          { value: { en: "Missing", es: "No guardada" }, tone: "bad" }] },
        { label: { en: "Last Intune sync", es: "Última sincronización con Intune" }, states: [
          { when: { synced: true }, value: { en: "Just now", es: "Ahora mismo" }, tone: "ok" },
          { value: "25/10/2026 08:02" }] },
      ],
    },
    actions: [{ id: "sync", label: { en: "Sync with Intune", es: "Sincronizar con Intune" }, cmd: "Get-ScheduledTask | ? TaskName -eq PushLaunch | Start-ScheduledTask" }],
    codes: ["compliance"],
    desktop: {
      apps: [
        { id: "portal", icon: "◈", title: { en: "Company Portal", es: "Portal de empresa" },
          look: "Get-MgDeviceManagementManagedDevice -Filter \"deviceName eq 'LAPTOP-0388'\"",
          fields: [
            { label: { en: "Device", es: "Dispositivo" }, value: "LAPTOP-0388" },
            { label: { en: "Status", es: "Estado" }, states: [
              { when: { verified: true }, value: { en: "Can access company resources", es: "Puede acceder a los recursos de la empresa" }, tone: "ok" },
              { value: { en: "Cannot access company resources", es: "No puede acceder a los recursos de la empresa" }, tone: "bad" }] },
            { label: { en: "What to fix", es: "Qué hay que arreglar" }, states: [
              { when: { verified: true }, value: { en: "Nothing", es: "Nada" }, tone: "ok" },
              { value: { en: "Encryption is required (BitLocker)", es: "Se requiere cifrado (BitLocker)" }, tone: "bad" }] },
          ],
          actions: [
            { id: "sync", label: { en: "Sync this device", es: "Sincronizar este dispositivo" }, cmd: "Get-ScheduledTask | ? TaskName -eq PushLaunch | Start-ScheduledTask" },
            { id: "check", label: { en: "Check status", es: "Comprobar estado" }, cmd: "Get-MgDeviceManagementManagedDevice -Filter \"deviceName eq 'LAPTOP-0388'\"" }] },
        { id: "bitlocker", icon: "▣", title: { en: "BitLocker Drive Encryption", es: "Cifrado de unidad BitLocker" }, look: "Get-BitLockerVolume -MountPoint C:",
          fields: [
            { label: "C:", states: [
              { when: { encrypted: true, recoveryPw: true }, value: { en: "Encrypting (TPM + recovery password)", es: "Cifrando (TPM + contraseña de recuperación)" }, tone: "ok" },
              { when: { encrypted: true }, value: { en: "Encrypting (TPM only, no recovery password)", es: "Cifrando (solo TPM, sin contraseña de recuperación)" }, tone: "warn" },
              { value: { en: "BitLocker off", es: "BitLocker desactivado" }, tone: "bad" }] },
            { label: { en: "Recovery key in Entra ID", es: "Clave de recuperación en Entra ID" }, states: [
              { when: { escrowed: true }, value: { en: "Backed up", es: "Guardada" }, tone: "ok" }, { value: { en: "Not backed up", es: "Sin guardar" }, tone: "bad" }] },
          ],
          actions: [
            { id: "on", label: { en: "Turn on BitLocker", es: "Activar BitLocker" },
              cmd: "Enable-BitLocker -MountPoint C: -EncryptionMethod XtsAes256 -UsedSpaceOnly -RecoveryPasswordProtector", when: { encrypted: false } },
            { id: "add-rp", label: { en: "Add a recovery password", es: "Añadir contraseña de recuperación" }, cmd: "manage-bde -protectors -add C: -RecoveryPassword",
              when: { encrypted: true, recoveryPw: false } },
            { id: "backup", label: { en: "Back up the recovery key to Entra ID", es: "Guardar la clave de recuperación en Entra ID" },
              cmd: "BackupToAAD-BitLockerKeyProtector -MountPoint C: -KeyProtectorId '{1A2B}'", when: { encrypted: true, escrowed: false } }] },
      ],
      log: [
        { when: { escrowed: true }, level: "information", time: "26/10/2026 09:44", source: "Microsoft-Windows-BitLocker-API", id: 845,
          text: { en: "BitLocker Drive Encryption recovery information for volume C: was backed up successfully to Entra ID.", es: "La información de recuperación del Cifrado de unidad BitLocker del volumen C: se guardó correctamente en Entra ID." } },
      ],
      logNote: { en: "No error about encryption: BitLocker being off is a setting, not a failure. Look at the BitLocker panel and the Company Portal.",
                 es: "Ningún error sobre el cifrado: que BitLocker esté desactivado es una configuración, no un fallo. Mira el panel de BitLocker y el Portal de empresa." },
    },
    state: { joinChecked: false, blChecked: false, encrypted: false, recoveryPw: false, escrowed: false, synced: false, verified: false },
    commands: [
      { id: "dsreg", match: /^dsregcmd\s+\/status\b/, set: { joinChecked: true }, out: [
        "", "+----------------------------------------------------------------------+", "| Device State                                                         |",
        "+----------------------------------------------------------------------+", "",
        "             AzureAdJoined : YES", "          EnterpriseJoined : NO", "              DomainJoined : NO", "               DeviceName : LAPTOP-0388", "",
        "                    MdmUrl : https://enrollment.manage.microsoft.com/enrollmentserver/discovery.svc", ""],
        say: { en: "Joined to Entra ID and enrolled in Intune: the join is fine, the problem is a compliance setting.", es: "Unido a Entra ID e inscrito en Intune: la unión está bien, el problema es un requisito de cumplimiento." } },
      { id: "bl-off", match: /^(get-bitlockervolume\b|manage-bde\s+-status\b)/, when: { encrypted: false }, set: { blChecked: true }, out: [
        "", "VolumeType      Mount CapacityGB VolumeStatus           Encryption KeyProtector  AutoUnlock Protection",
        "                Point                                   Percentage               Enabled    Status",
        "----------      ----- ---------- ------------           ---------- ------------  ---------- ----------",
        "OperatingSystem C:        475,69 FullyDecrypted         0          {}                       Off", ""],
        say: { en: "BitLocker is off. With the new motherboard the TPM is new, and the repair shop decrypted the disk.", es: "BitLocker está desactivado. Con la placa nueva el TPM también es nuevo, y el servicio técnico descifró el disco." } },
      { id: "bl-on", match: /^(get-bitlockervolume\b|manage-bde\s+-status\b)/, out: [
        "", "VolumeType      Mount CapacityGB VolumeStatus           Encryption KeyProtector              Protection",
        "----------      ----- ---------- ------------           ---------- ------------              ----------",
        "OperatingSystem C:        475,69 EncryptionInProgress   18         {Tpm, RecoveryPassword}   On", ""] },
      { id: "tpm", match: /^get-tpm\b/, out: ["", "TpmPresent                : True", "TpmReady                  : True", "TpmEnabled                : True", "ManagedAuthLevel          : Full", ""] },
      { id: "enable-full", match: /^enable-bitlocker\b.*-recoverypasswordprotector\b/, unless: { encrypted: true }, set: { encrypted: true, recoveryPw: true }, out: [
        "", "WARNING: ACTIONS REQUIRED:", "1. Save this numerical recovery password in a secure location away from your computer:", "",
        "      417263-090574-211628-558602-694408-303050-618926-147895", "",
        "To prevent data loss, save this password immediately. This password helps ensure that you can unlock the encrypted volume.", ""],
        say: { en: "Encryption started with a TPM key and a recovery password (the password shown here is fictional). Now the recovery key must be stored in Entra ID.",
               es: "Cifrado iniciado con clave en el TPM y contraseña de recuperación (la que se muestra es ficticia). Ahora hay que guardar la clave de recuperación en Entra ID." } },
      { id: "enable-tpm", match: /^(enable-bitlocker\b|manage-bde\s+-on\b)/, unless: { encrypted: true }, set: { encrypted: true }, out: ["", "(Encryption started with a TPM protector only.)", ""],
        say: { en: "Encrypting, but there is no recovery password. If the TPM fails again, nobody can unlock this disk.", es: "Cifrando, pero sin contraseña de recuperación. Si el TPM vuelve a fallar, nadie podrá desbloquear el disco." } },
      { id: "enable-again", match: /^(enable-bitlocker\b|manage-bde\s+-on\b)/, out: ["Enable-BitLocker : The volume is already encrypted or being encrypted.", ""] },
      { id: "add-rp", match: /^(add-bitlockerkeyprotector\b.*-recoverypasswordprotector|manage-bde\s+-protectors\s+-add\b.*-recoverypassword)/, when: { encrypted: true },
        set: { recoveryPw: true }, out: ["", "(Recovery password protector added.)", ""] },
      { id: "escrow", match: /^backuptoaad-bitlockerkeyprotector\b/, when: { recoveryPw: true }, set: { escrowed: true }, out: [""],
        say: { en: "The recovery key is now stored on the device object in Entra ID.", es: "La clave de recuperación queda guardada en el objeto del dispositivo en Entra ID." } },
      { id: "escrow-none", match: /^backuptoaad-bitlockerkeyprotector\b/, error: true, out: ["BackupToAAD-BitLockerKeyProtector : The key protector was not found. Add a recovery password protector first.", ""] },
      { id: "sync", match: /(start-scheduledtask\b.*pushlaunch|pushlaunch.*start-scheduledtask|intunemanagementextension:\/\/syncapp|deviceenroller\.exe\b.*\/c\b)/,
        set: { synced: true }, out: [""],
        say: { en: "MDM sync triggered: the device reports its state to Intune again.", es: "Sincronización MDM lanzada: el dispositivo vuelve a informar su estado a Intune." } },
      { id: "graph-ok", match: /^get-mg(beta)?devicemanagementmanageddevice\b/, when: { encrypted: true, escrowed: true, synced: true }, set: { verified: true }, out: [
        "", "DeviceName   ComplianceState  IsEncrypted  LastSyncDateTime", "----------   ---------------  -----------  ----------------",
        "LAPTOP-0388  compliant        True         25/10/2026 10:41:07", ""],
        say: { en: "Compliant again. Ana can open Outlook and Teams (she may need to sign in once). On real devices the BitLocker check can need a restart.",
               es: "Vuelve a cumplir. Ana puede abrir Outlook y Teams (puede que tenga que iniciar sesión una vez). En equipos reales la comprobación de BitLocker puede requerir un reinicio." } },
      { id: "graph-bad", match: /^get-mg(beta)?devicemanagementmanageddevice\b/, out: [
        "", "DeviceName   ComplianceState  IsEncrypted  LastSyncDateTime", "----------   ---------------  -----------  ----------------",
        "LAPTOP-0388  noncompliant     False        25/10/2026 08:02:55", ""] },
    ],
    goal: { encrypted: true, escrowed: true, synced: true, verified: true },
    stages: [
      { id: "investigate", label: { en: "Find the failing compliance setting", es: "Encontrar el requisito que no se cumple" }, when: { blChecked: true } },
      { id: "fix", label: { en: "Encrypt the disk and store the recovery key", es: "Cifrar el disco y guardar la clave de recuperación" }, when: { encrypted: true, escrowed: true } },
      { id: "verify", label: { en: "Sync and confirm compliance", es: "Sincronizar y confirmar el cumplimiento" }, when: { verified: true } },
    ],
    resolved: { en: "Resolved: the device is compliant again. Now write the work note.", es: "Resuelto: el dispositivo vuelve a cumplir. Ahora escribe la nota de trabajo." },
    hints: [
      { en: "Check the join first (dsregcmd /status), then the encryption: Get-BitLockerVolume -MountPoint C:", es: "Comprueba la unión (dsregcmd /status) y después el cifrado: Get-BitLockerVolume -MountPoint C:" },
      { en: "Enable it with a recovery password: Enable-BitLocker -MountPoint C: -EncryptionMethod XtsAes256 -UsedSpaceOnly -RecoveryPasswordProtector",
        es: "Actívalo con contraseña de recuperación: Enable-BitLocker -MountPoint C: -EncryptionMethod XtsAes256 -UsedSpaceOnly -RecoveryPasswordProtector" },
      { en: "Store the key in Entra ID: BackupToAAD-BitLockerKeyProtector -MountPoint C: -KeyProtectorId <id of the RecoveryPassword protector>",
        es: "Guarda la clave en Entra ID: BackupToAAD-BitLockerKeyProtector -MountPoint C: -KeyProtectorId <id del protector RecoveryPassword>" },
      { en: "Force a sync (Get-ScheduledTask | ? TaskName -eq PushLaunch | Start-ScheduledTask) and check with Get-MgDeviceManagementManagedDevice -Filter \"deviceName eq 'LAPTOP-0388'\".",
        es: "Fuerza una sincronización (Get-ScheduledTask | ? TaskName -eq PushLaunch | Start-ScheduledTask) y compruébalo con Get-MgDeviceManagementManagedDevice -Filter \"deviceName eq 'LAPTOP-0388'\"." },
    ],
    note: [
      { kb: "cause", label: { en: "the cause (BitLocker off after the motherboard repair)", es: "la causa (BitLocker desactivado tras cambiar la placa)" },
        any: ["bitlocker", "encrypt", "cifrad", "decrypted", "descifr", "motherboard", "placa"] },
      { kb: "fix", label: { en: "the fix (encryption enabled)", es: "la solución (cifrado activado)" }, any: ["enable-bitlocker", "enabled", "activ", "habilit", "encrypting", "cifrando"] },
      { kb: "fix", label: { en: "the recovery key stored in Entra ID", es: "la clave de recuperación guardada en Entra ID" }, any: ["recovery", "recuperacion", "entra", "azure ad", "aad", "escrow"] },
      { kb: "verify", label: { en: "how you checked compliance", es: "cómo comprobaste el cumplimiento" }, any: ["compliant", "cumple", "sync", "sincroniz", "outlook", "teams"] },
    ],
    solution: ["dsregcmd /status", "Get-BitLockerVolume -MountPoint C:", "Enable-BitLocker -MountPoint C: -EncryptionMethod XtsAes256 -UsedSpaceOnly -RecoveryPasswordProtector",
               "BackupToAAD-BitLockerKeyProtector -MountPoint C: -KeyProtectorId '{1A2B}'", "Get-ScheduledTask | ? TaskName -eq PushLaunch | Start-ScheduledTask",
               "Get-MgDeviceManagementManagedDevice -Filter \"deviceName eq 'LAPTOP-0388'\""],
    sampleNote: {
      en: "Device non-compliant because BitLocker was off after the motherboard replacement (FullyDecrypted). Enabled BitLocker (XtsAes256, TPM + recovery password) and backed up the recovery key to Entra ID. Forced an MDM sync: compliant again, Outlook and Teams open. Asked the repair partner to suspend, not decrypt, BitLocker in future repairs.",
      es: "El dispositivo no cumplía porque BitLocker quedó desactivado tras cambiar la placa base (FullyDecrypted). Activé BitLocker (XtsAes256, TPM + contraseña de recuperación) y guardé la clave de recuperación en Entra ID. Forcé la sincronización MDM: vuelve a cumplir y Outlook y Teams abren. Pedí al servicio técnico que en futuras reparaciones suspenda BitLocker en lugar de descifrar.",
    },
  });

  /* ------------------------------------------------------------------ 7. VPN does not connect from home */
  const VPNCLI = "& \"C:\\Program Files (x86)\\Cisco\\Cisco Secure Client\\vpncli.exe\"";
  const VPN_BANNER = ["Cisco Secure Client (version 5.1.6.103) .", "", "Copyright (c) 2004 - 2024 Cisco Systems, Inc.  All Rights Reserved.", ""];
  scenarios.push({
    id: "vpn-anyconnect",
    level: 1,
    topic: { en: "Cisco AnyConnect / VPN", es: "Cisco AnyConnect / VPN" },
    minutes: 15,
    title: { en: "Working from home: the VPN will not connect", es: "Teletrabajo: la VPN no conecta" },
    guide: GUIDE + "anyconnect-instalar-y-diagnosticar-vpn.html",
    machine: { host: "LAPTOP-0217", user: "jruiz", domain: "CONTOSO", shell: "powershell", prompt: "PS C:\\Windows\\system32> " },
    ticket: {
      id: "INC-20501", from: "Javier Ruiz (Sales)", priority: "P2",
      subject: { en: "AnyConnect says 'Certificate Validation Failure'", es: "AnyConnect dice 'Certificate Validation Failure'" },
      body: {
        en: "I'm working from home today and the VPN will not connect: AnyConnect says 'Certificate Validation Failure'. My home internet works, although some websites warn that the connection is not private. The laptop spent the summer in a drawer and the battery was completely flat. I have a customer call at 11:00.",
        es: "Hoy teletrabajo y la VPN no conecta: AnyConnect dice 'Certificate Validation Failure'. Internet en casa funciona, aunque algunas webs avisan de que la conexión no es privada. El portátil ha pasado el verano en un cajón y la batería estaba totalmente descargada. Tengo una llamada con un cliente a las 11:00.",
      },
    },
    intro: {
      en: "You are connected to Javier's laptop with remote assistance over the internet, in an elevated PowerShell. AnyConnect is now called Cisco Secure Client (5.1); its command line is vpncli.exe in C:\\Program Files (x86)\\Cisco\\Cisco Secure Client. The VPN gateway is vpn.contoso.com; its certificate is valid from 02/03/2026 to 02/03/2027. Today is 28/10/2026.",
      es: "Estás conectado al portátil de Javier con asistencia remota por internet, en un PowerShell elevado. AnyConnect ahora se llama Cisco Secure Client (5.1); su línea de comandos es vpncli.exe en C:\\Program Files (x86)\\Cisco\\Cisco Secure Client. La puerta de enlace VPN es vpn.contoso.com; su certificado es válido del 02/03/2026 al 02/03/2027. Hoy es 28/10/2026.",
    },
    requester: { name: "Javier Ruiz", team: { en: "Sales", es: "Ventas" }, user: "jruiz", location: { en: "Working from home", es: "Teletrabajo (en casa)" }, device: "LAPTOP-0217" },
    asset: {
      title: { en: "VPN · LAPTOP-0217", es: "VPN · LAPTOP-0217" },
      fields: [
        { label: { en: "VPN (Secure Client)", es: "VPN (Secure Client)" }, states: [
          { when: { connected: true }, value: { en: "Connected to vpn.contoso.com", es: "Conectada a vpn.contoso.com" }, tone: "ok" },
          { value: { en: "Disconnected: Certificate Validation Failure", es: "Desconectada: Certificate Validation Failure" }, tone: "bad" }] },
        { label: { en: "Laptop clock", es: "Reloj del portátil" }, states: [
          { when: { clockOk: true }, value: "28/10/2026 09:4x", tone: "ok" },
          { when: { clockSeen: true }, value: { en: "01/01/2024 (wrong date)", es: "01/01/2024 (fecha errónea)" }, tone: "bad" },
          { value: { en: "Not reviewed", es: "Sin revisar" }, tone: "muted" }] },
        { label: { en: "Time source", es: "Origen de la hora" }, states: [
          { when: { verified: true }, value: "DC01.contoso.local", tone: "ok" },
          { value: "Local CMOS Clock", tone: "warn" }] },
        { label: { en: "Client and profile", es: "Cliente y perfil" }, value: { en: "Secure Client 5.1.6 · contoso-vpn.xml", es: "Secure Client 5.1.6 · contoso-vpn.xml" } },
      ],
    },
    actions: [
      { id: "connect", label: { en: "Connect the VPN", es: "Conectar la VPN" }, cmd: VPNCLI + " connect vpn.contoso.com", when: { connected: false } },
      { id: "reinstall", label: { en: "Reinstall Secure Client", es: "Reinstalar Secure Client" },
        cmd: "msiexec /fa C:\\Temp\\cisco-secure-client-win-5.1.6.103-core-vpn-predeploy-k9.msi /qn" },
    ],
    codes: ["config-fixed", "cause-removed"],
    state: { clockSeen: false, certSeen: false, clockOk: false, connected: false, verified: false },
    commands: [
      { id: "connect-bad", match: /vpncli(\.exe)?["']?\s+connect\b/, when: { clockOk: false }, set: { certSeen: true }, out: VPN_BANNER.concat([
        "  >> state: Disconnected", "  >> notice: Ready to connect.", "  >> contacting host (vpn.contoso.com) for login information...",
        "  >> notice: Contacting vpn.contoso.com.", "  >> error: Certificate Validation Failure", "  >> state: Disconnected", ""]),
        say: { en: "The gateway answers, but the laptop does not accept its certificate. The certificate itself has not changed for anyone else.",
               es: "La puerta de enlace responde, pero el portátil no acepta su certificado. El certificado no ha cambiado para nadie más." } },
      { id: "connect", match: /vpncli(\.exe)?["']?\s+connect\b/, when: { connected: false }, set: { connected: true }, out: VPN_BANNER.concat([
        "  >> state: Disconnected", "  >> contacting host (vpn.contoso.com) for login information...", "  >> notice: Contacting vpn.contoso.com.",
        "  >> Please enter your username and password.", "Username: [jruiz] ", "Password: ********", "  >> state: Connecting",
        "  >> notice: Establishing VPN session...", "  >> notice: Establishing VPN - Configuring system...", "  >> state: Connected", ""]),
        say: { en: "Javier signs in: the tunnel is up.", es: "Javier inicia sesión: el túnel está establecido." } },
      { id: "connect-again", match: /vpncli(\.exe)?["']?\s+connect\b/, out: VPN_BANNER.concat(["  >> state: Connected", "  >> notice: The VPN connection is already established.", ""]) },
      { id: "vpn-state-up", match: /vpncli(\.exe)?["']?\s+(state|stats)\b/, when: { connected: true }, out: VPN_BANNER.concat(["  >> state: Connected", ""]) },
      { id: "vpn-state", match: /vpncli(\.exe)?["']?\s+(state|stats)\b/, out: VPN_BANNER.concat(["  >> state: Disconnected", "  >> notice: Ready to connect.", ""]) },
      { id: "date-bad", match: /^(get-date|date\s*\/t|time\s*\/t|\[datetime\]::now)\b/, when: { clockOk: false }, set: { clockSeen: true }, out: ["", "01 January 2024 09:16:52", ""],
        say: { en: "The laptop thinks it is January 2024. A certificate valid from March 2026 is 'not valid yet' for it.",
               es: "El portátil cree que es enero de 2024. Para él, un certificado válido desde marzo de 2026 «todavía no es válido»." } },
      { id: "date-ok", match: /^(get-date|date\s*\/t|time\s*\/t|\[datetime\]::now)\b/, out: ["", "28 October 2026 09:44:10", ""] },
      { id: "systeminfo", match: /^systeminfo\b/, when: { clockOk: false }, set: { clockSeen: true }, out: [
        "", "Host Name:                 LAPTOP-0217", "OS Name:                   Microsoft Windows 11 Enterprise", "System Boot Time:          01/01/2024, 08:58:31",
        "Time Zone:                 (UTC+01:00) Brussels, Copenhagen, Madrid, Paris", "Domain:                    contoso.local", ""] },
      { id: "systeminfo-ok", match: /^systeminfo\b/, out: ["", "Host Name:                 LAPTOP-0217", "Time Zone:                 (UTC+01:00) Brussels, Copenhagen, Madrid, Paris", "Domain:                    contoso.local", ""] },
      { id: "tz", match: /^(get-timezone|tzutil\s+\/g)\b/, out: ["", "Id                         : Romance Standard Time", "DisplayName                : (UTC+01:00) Brussels, Copenhagen, Madrid, Paris", ""],
        say: { en: "The time zone is right. A time zone only shifts the hours; it cannot explain a certificate error.", es: "La zona horaria es correcta. La zona solo mueve las horas; no explica un error de certificado." } },
      { id: "w32-status-ok", match: /^w32tm\s+\/query\s+\/(status|source)\b/, when: { verified: true }, out: [
        "", "Leap Indicator: 0(no warning)", "Stratum: 4 (secondary reference - syncd by (S)NTP)", "Last Successful Sync Time: 28/10/2026 09:46:02", "Source: DC01.contoso.local", "Poll Interval: 10 (1024s)", ""] },
      { id: "w32-status", match: /^w32tm\s+\/query\s+\/(status|source)\b/, set: { clockSeen: true }, out: [
        "", "Leap Indicator: 3(not synchronized)", "Stratum: 0 (unspecified)", "Precision: -23 (119.209ns per tick)", "ReferenceId: 0x00000000 (unspecified)",
        "Last Successful Sync Time: unspecified", "Source: Local CMOS Clock", "Poll Interval: 10 (1024s)", ""],
        say: { en: "Never synchronised: a domain laptop takes its time from the domain controllers, and from home it cannot reach them without the VPN.",
               es: "Nunca sincronizado: un portátil del dominio toma la hora de los controladores de dominio, y desde casa no llega a ellos sin la VPN." } },
      { id: "resync-ok", match: /^w32tm\s+\/resync\b/, when: { connected: true }, set: { verified: true }, out: ["", "Sending resync command to local computer", "The command completed successfully.", ""],
        say: { en: "Through the tunnel the laptop reaches DC01 and takes the domain time again, so it will keep the right time.",
               es: "Por el túnel el portátil llega a DC01 y vuelve a tomar la hora del dominio, así que mantendrá la hora correcta." } },
      { id: "resync-bad", match: /^w32tm\s+\/resync\b/, error: true, out: ["", "Sending resync command to local computer", "The computer did not resync because no time data was available.", ""],
        say: { en: "No domain controller is reachable from home, so Windows cannot correct the clock by itself.", es: "Desde casa no hay ningún controlador de dominio accesible, así que Windows no puede corregir la hora solo." } },
      { id: "w32-config", match: /^w32tm\s+\/config\b/, out: [""],
        say: { en: "Changing the time source by hand would take the laptop out of the domain time hierarchy for good. Not needed: correct the date once and the domain does the rest.",
               es: "Cambiar a mano el origen de la hora sacaría el portátil de la jerarquía de hora del dominio para siempre. No hace falta: corrige la fecha una vez y el dominio hace el resto." } },
      { id: "setdate", match: /^set-date\b.*2026/, set: { clockOk: true, clockSeen: true }, out: ["", "28 October 2026 09:44:00", ""],
        say: { en: "Clock corrected by hand.", es: "Hora corregida a mano." } },
      { id: "setdate-wrong", match: /^set-date\b/, out: [""],
        say: { en: "That is not today's date (28/10/2026).", es: "Esa no es la fecha de hoy (28/10/2026)." } },
      { id: "tnc", match: /^test-netconnection\b.*vpn\.contoso\.com/, out: ["", "ComputerName     : vpn.contoso.com", "RemoteAddress    : 203.0.113.25", "RemotePort       : 443",
        "InterfaceAlias   : Wi-Fi", "TcpTestSucceeded : True", ""],
        say: { en: "The gateway is reachable on 443: it is not the home network.", es: "La puerta de enlace responde en el 443: no es la red de casa." } },
      { id: "profile", match: /^(get-childitem|gci|dir|ls)\b.*cisco secure client.*profile/, out: [
        "", "    Directory: C:\\ProgramData\\Cisco\\Cisco Secure Client\\VPN\\Profile", "", "Mode          LastWriteTime   Length Name",
        "----          -------------   ------ ----", "-a---   02/03/2026  10:12     4818 contoso-vpn.xml", ""],
        say: { en: "The profile is there and points to vpn.contoso.com.", es: "El perfil está y apunta a vpn.contoso.com." } },
      { id: "reinstall", match: /^(msiexec\b.*(cisco|secure-client|anyconnect)|.*uninstall-package\b.*(secure client|anyconnect)|winget\b.*(cisco|anyconnect))/, out: [""],
        say: { en: "Reinstalled in two minutes... and the same 'Certificate Validation Failure'. The client was never the problem.",
               es: "Reinstalado en dos minutos... y el mismo 'Certificate Validation Failure'. El cliente nunca fue el problema." } },
      { id: "agent", match: /^(restart-service|stop-service|start-service|net\s+(stop|start))\b.*(vpnagent|csc_vpnagent)/, out: [""],
        say: { en: "The VPN agent service restarted. Nothing it does changes how the laptop judges the certificate.", es: "El servicio del agente VPN se ha reiniciado. Nada de eso cambia cómo juzga el portátil el certificado." } },
    ],
    goal: { clockOk: true, connected: true, verified: true },
    stages: [
      { id: "investigate", label: { en: "Find why the certificate is rejected", es: "Encontrar por qué se rechaza el certificado" }, when: { certSeen: true, clockSeen: true } },
      { id: "fix", label: { en: "Correct the clock and connect", es: "Corregir la hora y conectar" }, when: { clockOk: true, connected: true } },
      { id: "verify", label: { en: "Check it takes the domain time again", es: "Comprobar que vuelve a tomar la hora del dominio" }, when: { verified: true } },
    ],
    resolved: { en: "Resolved: the VPN connects and the clock follows the domain again. Now write the work note.",
                es: "Resuelto: la VPN conecta y la hora vuelve a seguir al dominio. Ahora escribe la nota de trabajo." },
    hints: [
      { en: "Reproduce it from the console: " + VPNCLI + " connect vpn.contoso.com", es: "Reprodúcelo desde la consola: " + VPNCLI + " connect vpn.contoso.com" },
      { en: "A certificate is checked against the laptop's own clock. What date does it have? Get-Date and w32tm /query /status",
        es: "Un certificado se comprueba con el reloj del propio portátil. ¿Qué fecha tiene? Get-Date y w32tm /query /status" },
      { en: "Without the VPN it cannot reach a domain controller to sync, so set it once: Set-Date -Date '28/10/2026 09:44'",
        es: "Sin la VPN no llega a un controlador de dominio para sincronizar, así que ponla una vez: Set-Date -Date '28/10/2026 09:44'" },
      { en: "Connect again, then w32tm /resync to take the time from the domain through the tunnel.", es: "Vuelve a conectar y después w32tm /resync para tomar la hora del dominio por el túnel." },
    ],
    note: [
      { kb: "cause", label: { en: "the cause (the laptop clock at 2024, so the certificate looked not yet valid)", es: "la causa (el reloj del portátil en 2024, así que el certificado parecía aún no válido)" },
        any: ["clock", "reloj", "2024", "wrong date", "fecha erronea", "fecha incorrecta", "not yet valid", "aun no valido", "todavia no", "cmos"] },
      { kb: "fix", label: { en: "the fix (date corrected, VPN connected)", es: "la solución (fecha corregida, VPN conectada)" },
        any: ["set-date", "corrected", "set the date", "corregi", "ajuste", "puse la fecha", "fixed the date"] },
      { kb: "verify", label: { en: "how you checked it (tunnel up, time synced from the domain)", es: "cómo lo comprobaste (túnel arriba, hora sincronizada con el dominio)" },
        any: ["connected", "conecta", "resync", "w32tm", "dc01", "sincroniz"] },
      { kb: "followup", label: { en: "the follow-up (no reinstall needed, battery, advice)", es: "el seguimiento (sin reinstalar, batería, consejo)" },
        any: ["battery", "bateria", "advised", "told", "next time", "explique", "avise", "proxima vez", "reinstall", "reinstal", "drawer", "cajon"] },
    ],
    solution: [
      VPNCLI + " connect vpn.contoso.com",
      "Get-Date",
      "w32tm /query /status",
      "Set-Date -Date '28/10/2026 09:44'",
      VPNCLI + " connect vpn.contoso.com",
      "w32tm /resync",
    ],
    sampleNote: {
      en: "Secure Client failed with Certificate Validation Failure because the laptop clock was at 01/01/2024 after the battery went flat, so the gateway certificate looked not yet valid. Set the date with Set-Date and connected the VPN. Checked the tunnel is up and w32tm /resync took the time from DC01. No reinstall needed; told Javier to charge the laptop before storing it and to call us if the clock looks wrong.",
      es: "Secure Client fallaba con Certificate Validation Failure porque el reloj del portátil estaba en 01/01/2024 tras descargarse la batería, así que el certificado de la puerta de enlace parecía aún no válido. Puse la fecha con Set-Date y conecté la VPN. Comprobé que el túnel está arriba y que w32tm /resync tomó la hora de DC01. No hizo falta reinstalar; expliqué a Javier que cargue el portátil antes de guardarlo y que nos llame si ve la hora mal.",
    },
  });

  /* ------------------------------------------------------------------ 8. New starter without a licence */
  const E3 = "05e9a617-0261-4cee-bb44-138d3ef5d965";
  scenarios.push({
    id: "m365-licence",
    level: 1,
    topic: { en: "Microsoft 365", es: "Microsoft 365" },
    minutes: 15,
    title: { en: "New starter without Outlook or Teams", es: "Nueva incorporación sin Outlook ni Teams" },
    guide: GUIDE + "microsoft-365-asignar-y-retirar-licencias.html",
    machine: { host: "ADM-WS01", user: "it.admin", domain: "CONTOSO", shell: "powershell", prompt: "PS C:\\Users\\it.admin> " },
    ticket: {
      id: "INC-20502", from: "Carlos Martín (Sales Director)", priority: "P2",
      subject: { en: "Sergio started today and has no email or Teams", es: "Sergio ha empezado hoy y no tiene correo ni Teams" },
      body: {
        en: "Sergio Vidal joined Sales today. He can sign in to Windows, but Outlook says he has no mailbox and Teams says he has no licence. The onboarding form put him in the usual groups. User: svidal@contoso.com.",
        es: "Sergio Vidal se ha incorporado hoy a Ventas. Puede iniciar sesión en Windows, pero Outlook dice que no tiene buzón y Teams que no tiene licencia. En el formulario de alta se le puso en los grupos de siempre. Usuario: svidal@contoso.com.",
      },
    },
    intro: {
      en: "You are on your admin workstation with Microsoft Graph PowerShell installed. Licences are group-based: members of GG-M365-E3 get Microsoft 365 E3 (SkuPartNumber SPE_E3). Contoso owns 120 E3 licences. The tenant's country is Spain.",
      es: "Estás en tu equipo de administración con Microsoft Graph PowerShell instalado. Las licencias se asignan por grupo: los miembros de GG-M365-E3 reciben Microsoft 365 E3 (SkuPartNumber SPE_E3). Contoso tiene 120 licencias E3. El país del tenant es España.",
    },
    requester: { name: "Carlos Martín", team: { en: "Sales Director", es: "Director comercial" }, user: "cmartin", location: { en: "Head office, 5th floor (VIP)", es: "Oficina central, 5ª planta (VIP)" }, device: "LAPTOP-0102" },
    asset: {
      title: { en: "User · svidal@contoso.com", es: "Usuario · svidal@contoso.com" },
      fields: [
        { label: { en: "Microsoft 365 E3", es: "Microsoft 365 E3" }, states: [
          { when: { reprocessed: true }, value: { en: "Active, from GG-M365-E3", es: "Activa, desde GG-M365-E3" }, tone: "ok" },
          { when: { errorFound: true }, value: { en: "Error from GG-M365-E3: CountViolation", es: "Error desde GG-M365-E3: CountViolation" }, tone: "bad" },
          { value: { en: "Not assigned", es: "Sin asignar" }, tone: "bad" }] },
        { label: { en: "Free E3 licences", es: "Licencias E3 libres" }, states: [
          { when: { reprocessed: true }, value: { en: "0 of 120 (the leaver's one went to Sergio)", es: "0 de 120 (la del que se fue es ahora de Sergio)" }, tone: "warn" },
          { when: { freed: true }, value: { en: "1 of 120", es: "1 de 120" }, tone: "ok" },
          { value: { en: "0 of 120", es: "0 de 120" }, tone: "bad" }] },
        { label: { en: "Direct licence", es: "Licencia directa" }, states: [
          { when: { direct: true }, value: { en: "Yes, on top of the group", es: "Sí, además del grupo" }, tone: "warn" },
          { value: { en: "None (group only)", es: "Ninguna (solo grupo)" }, tone: "ok" }] },
        { label: { en: "Usage location", es: "Ubicación de uso" }, states: [
          { when: { usageSet: true }, value: "ES", tone: "ok" },
          { value: { en: "Empty (the group uses the tenant's: ES)", es: "Vacía (el grupo usa la del tenant: ES)" }, tone: "muted" }] },
      ],
    },
    actions: [{ id: "reprocess", label: { en: "Reprocess licences", es: "Reprocesar licencias" }, cmd: "Invoke-MgLicenseUser -UserId svidal@contoso.com", when: { connected: true } }],
    codes: ["capacity", "config-fixed"],
    state: { connected: false, userChecked: false, errorFound: false, leaverFound: false, freed: false, usageSet: false, direct: false, reprocessed: false, verified: false },
    commands: [
      { id: "connect", match: /^connect-mggraph\b/, set: { connected: true }, out: ["", "Welcome to Microsoft Graph!", "", "Connected via delegated access using it.admin@contoso.com", ""] },
      { id: "not-connected", match: /^(get|set|update|invoke|new|remove)-mg/, when: { connected: false }, error: true, out: ["Get-MgUser_List: Authentication needed. Please call Connect-MgGraph.", ""] },
      { id: "leavers", match: /^get-mguser\b.*accountenabled\s*(eq|-eq)\s*\$?false/, set: { leaverFound: true }, out: [
        "", "DisplayName   UserPrincipalName     AccountEnabled AssignedLicenses",
        "-----------   -----------------     -------------- ----------------",
        "Rubén Gómez   rgomez@contoso.com    False          {" + E3 + "}  (direct)",
        "Old Room 3B   room3b@contoso.com    False          {}", ""],
        say: { en: "Rubén Gómez left on 30/09: his account is disabled but still holds a directly assigned E3. The leaver process removes groups, not direct licences.",
               es: "Rubén Gómez se fue el 30/09: su cuenta está deshabilitada pero sigue con una E3 asignada directamente. El proceso de bajas quita los grupos, no las licencias directas." } },
      { id: "states-ok", match: /^get-mguser\b.*svidal.*licenseassignmentstates/, when: { reprocessed: true }, out: [
        "", "AssignedByGroup                      SkuId                                State  Error", "---------------                      -----                                -----  -----",
        "4c1f0e2a-77b3-4d6e-9a52-1d0e8f3b6a10 " + E3 + " Active None", ""] },
      { id: "states", match: /^get-mguser\b.*svidal.*licenseassignmentstates/, set: { userChecked: true, errorFound: true }, out: [
        "", "AssignedByGroup                      SkuId                                State Error",
        "---------------                      -----                                ----- -----",
        "4c1f0e2a-77b3-4d6e-9a52-1d0e8f3b6a10 " + E3 + " Error CountViolation", ""],
        say: { en: "The group tried to give him E3 and failed: CountViolation means there are no licences left.", es: "El grupo intentó darle la E3 y falló: CountViolation significa que no quedan licencias." } },
      { id: "user-ok", match: /^get-mguser\b.*svidal/, when: { reprocessed: true }, out: [
        "", "DisplayName      : Sergio Vidal", "UserPrincipalName: svidal@contoso.com", "AccountEnabled   : True", "AssignedLicenses : {" + E3 + "}", ""] },
      { id: "user", match: /^get-mguser\b.*svidal/, set: { userChecked: true }, out: [
        "", "DisplayName      : Sergio Vidal", "UserPrincipalName: svidal@contoso.com", "AccountEnabled   : True", "UsageLocation    :", "AssignedLicenses : {}", ""],
        say: { en: "No licence at all, and no usage location. Group licensing records why an assignment failed on the user object itself.",
               es: "Ninguna licencia y sin ubicación de uso. Las licencias por grupo guardan en el propio usuario por qué falló la asignación." } },
      { id: "group-errors", match: /^get-mggroupmemberwithlicenseerror\b/, set: { errorFound: true }, out: [
        "", "Id                                   DisplayName", "--                                   -----------", "9b2d6f41-3c8e-4a7d-b1f2-6e0c5a8d3e77 Sergio Vidal", ""],
        say: { en: "Sergio is the only member of GG-M365-E3 with a licence error.", es: "Sergio es el único miembro de GG-M365-E3 con error de licencia." } },
      { id: "detail-ok", match: /^get-mguserlicensedetail\b.*svidal/, when: { reprocessed: true, direct: false }, set: { verified: true }, out: [
        "", "SkuId                                SkuPartNumber", "-----                                -------------",
        E3 + " SPE_E3", ""],
        say: { en: "Sergio has E3 from the group. Exchange creates his mailbox within minutes; he signs out and back in to Teams.",
               es: "Sergio tiene la E3 desde el grupo. Exchange crea su buzón en unos minutos; él cierra y vuelve a abrir sesión en Teams." } },
      { id: "detail-direct", match: /^get-mguserlicensedetail\b.*svidal/, when: { direct: true }, out: [
        "", "SkuId                                SkuPartNumber", "-----                                -------------",
        E3 + " SPE_E3", ""],
        say: { en: "He has E3, but as a direct licence: when he leaves, nobody will remember to remove it. That is exactly how Rubén's licence got stuck.",
               es: "Tiene la E3, pero como licencia directa: cuando se vaya, nadie se acordará de quitarla. Así es justo como se quedó atascada la de Rubén." } },
      { id: "detail", match: /^get-mguserlicensedetail\b.*svidal/, out: [""],
        say: { en: "(No licences.)", es: "(Sin licencias.)" } },
      { id: "sku-reused", match: /^get-mgsubscribedsku\b/, when: { reprocessed: true }, set: { errorFound: true }, out: [
        "", "SkuPartNumber ConsumedUnits PrepaidUnits.Enabled", "------------- ------------- --------------------", "SPE_E3                  120                  120", ""] },
      { id: "sku-freed", match: /^get-mgsubscribedsku\b/, when: { freed: true }, set: { errorFound: true }, out: [
        "", "SkuPartNumber ConsumedUnits PrepaidUnits.Enabled", "------------- ------------- --------------------", "SPE_E3                  119                  120", ""] },
      { id: "sku", match: /^get-mgsubscribedsku\b/, set: { errorFound: true }, out: [
        "", "SkuPartNumber ConsumedUnits PrepaidUnits.Enabled", "------------- ------------- --------------------", "SPE_E3                  120                  120", ""],
        say: { en: "All 120 E3 licences are in use: no seat for a new starter, by group or directly.", es: "Las 120 licencias E3 están en uso: no hay hueco para una nueva incorporación, ni por grupo ni directa." } },
      { id: "usage", match: /^(update|set)-mguser\b.*svidal.*-usagelocation\s+["']?es\b/, set: { usageSet: true }, out: [""],
        say: { en: "Good practice for every new user. But the group was already using the tenant's location (ES), so this alone does not give him a licence.",
               es: "Buena práctica en cada alta. Pero el grupo ya usaba la ubicación del tenant (ES), así que esto solo no le da licencia." } },
      { id: "direct-remove", match: /^set-mguserlicense\b.*svidal.*-removelicenses\s+@?\(?\s*["']?(05e9a617|\$)/, set: { direct: false }, out: [""],
        say: { en: "Direct licence removed; the group assignment stays.", es: "Licencia directa quitada; la asignación por grupo se queda." } },
      { id: "free", match: /^set-mguserlicense\b.*rgomez.*-removelicenses\s+@?\(?\s*["']?(05e9a617|\$)/, set: { freed: true, leaverFound: true }, out: [
        "", "DisplayName  Id                                   UserPrincipalName", "Rubén Gómez  1f7a9c33-5e2b-4b8d-a0c4-7d6e2f9b1a58 rgomez@contoso.com", ""],
        say: { en: "One E3 licence is free again.", es: "Vuelve a haber una licencia E3 libre." } },
      { id: "direct-noloc", match: /^set-mguserlicense\b.*svidal.*-addlicenses/, when: { usageSet: false }, error: true, out: [
        "Set-MgUserLicense_AssignExpanded: License assignment cannot be done for user with invalid usage location.", ""],
        say: { en: "A direct licence needs a usage location; a group licence falls back to the tenant's.", es: "Una licencia directa necesita ubicación de uso; una de grupo usa la del tenant." } },
      { id: "direct-full", match: /^set-mguserlicense\b.*svidal.*-addlicenses/, when: { freed: false }, error: true, out: [
        "Set-MgUserLicense_AssignExpanded: Subscription with SKU " + E3 + " does not have any available licenses.", ""],
        say: { en: "Same wall as the group: a direct licence comes from the same 120.", es: "El mismo muro que el grupo: una licencia directa sale de las mismas 120." } },
      { id: "direct", match: /^set-mguserlicense\b.*svidal.*-addlicenses/, set: { direct: true }, out: ["", "DisplayName  Id                                   UserPrincipalName", "Sergio Vidal 9b2d6f41-3c8e-4a7d-b1f2-6e0c5a8d3e77 svidal@contoso.com", ""],
        say: { en: "It works, but he now has a direct licence on top of the group, which the leaver process will not remove.", es: "Funciona, pero ahora tiene una licencia directa además del grupo, que el proceso de bajas no quitará." } },
      { id: "reprocess", match: /^invoke-mglicenseuser\b.*svidal/, when: { freed: true }, set: { reprocessed: true, errorFound: true }, out: [
        "", "DisplayName  Id                                   UserPrincipalName", "Sergio Vidal 9b2d6f41-3c8e-4a7d-b1f2-6e0c5a8d3e77 svidal@contoso.com", ""],
        say: { en: "Group licensing processes him again.", es: "Las licencias por grupo vuelven a procesarlo." } },
      { id: "reprocess-full", match: /^invoke-mglicenseuser\b.*svidal/, out: [
        "", "DisplayName  Id                                   UserPrincipalName", "Sergio Vidal 9b2d6f41-3c8e-4a7d-b1f2-6e0c5a8d3e77 svidal@contoso.com", ""],
        say: { en: "Reprocessed, and the same error: there is still no free licence.", es: "Reprocesado, y el mismo error: sigue sin haber licencias libres." } },
    ],
    goal: { freed: true, reprocessed: true, direct: false, verified: true },
    stages: [
      { id: "investigate", label: { en: "Find why the group did not license him", es: "Encontrar por qué el grupo no le dio licencia" }, when: { errorFound: true } },
      { id: "fix", label: { en: "Free a licence and reprocess the group assignment", es: "Liberar una licencia y reprocesar la asignación por grupo" }, when: { freed: true, reprocessed: true, direct: false } },
      { id: "verify", label: { en: "Check his licence", es: "Comprobar su licencia" }, when: { verified: true } },
    ],
    resolved: { en: "Resolved: Sergio has Microsoft 365 E3 from the group. Now write the work note.", es: "Resuelto: Sergio tiene Microsoft 365 E3 desde el grupo. Ahora escribe la nota de trabajo." },
    hints: [
      { en: "Connect (Connect-MgGraph -Scopes User.ReadWrite.All,Organization.Read.All) and look at him: Get-MgUser -UserId svidal@contoso.com -Property UsageLocation,AssignedLicenses,LicenseAssignmentStates",
        es: "Conéctate (Connect-MgGraph -Scopes User.ReadWrite.All,Organization.Read.All) y míralo: Get-MgUser -UserId svidal@contoso.com -Property UsageLocation,AssignedLicenses,LicenseAssignmentStates" },
      { en: "Why the group failed: Get-MgUser -UserId svidal@contoso.com -Property LicenseAssignmentStates | Select -ExpandProperty LicenseAssignmentStates. Then Get-MgSubscribedSku.",
        es: "Por qué falló el grupo: Get-MgUser -UserId svidal@contoso.com -Property LicenseAssignmentStates | Select -ExpandProperty LicenseAssignmentStates. Después Get-MgSubscribedSku." },
      { en: "Leavers often keep licences: Get-MgUser -Filter \"accountEnabled eq false\" -Property DisplayName,UserPrincipalName,AssignedLicenses",
        es: "Las bajas suelen quedarse con licencias: Get-MgUser -Filter \"accountEnabled eq false\" -Property DisplayName,UserPrincipalName,AssignedLicenses" },
      { en: "Free it (Set-MgUserLicense -UserId rgomez@contoso.com -AddLicenses @() -RemoveLicenses @('" + E3 + "')), then Invoke-MgLicenseUser -UserId svidal@contoso.com and Get-MgUserLicenseDetail -UserId svidal@contoso.com.",
        es: "Libérala (Set-MgUserLicense -UserId rgomez@contoso.com -AddLicenses @() -RemoveLicenses @('" + E3 + "')), después Invoke-MgLicenseUser -UserId svidal@contoso.com y Get-MgUserLicenseDetail -UserId svidal@contoso.com." },
    ],
    note: [
      { kb: "cause", label: { en: "the cause (no free E3: CountViolation, a leaver still licensed)", es: "la causa (sin E3 libres: CountViolation, una baja aún con licencia)" },
        any: ["countviolation", "no free", "no licences left", "no licenses left", "sin licencias", "no quedaban", "120 of 120", "120 de 120", "leaver", "baja"] },
      { kb: "fix", label: { en: "the fix (licence freed, assignment reprocessed)", es: "la solución (licencia liberada, asignación reprocesada)" },
        any: ["removed", "freed", "quite", "libere", "reprocess", "invoke-mglicenseuser"] },
      { kb: "verify", label: { en: "how you checked it", es: "cómo lo comprobaste" }, any: ["get-mguserlicensedetail", "spe_e3", "mailbox", "buzon", "teams", "checked", "comprob"] },
      { kb: "followup", label: { en: "the follow-up (leaver process, licence count, usage location)", es: "el seguimiento (proceso de bajas, recuento de licencias, ubicación de uso)" },
        any: ["leaver process", "proceso de bajas", "buy", "comprar", "purchase", "usage location", "ubicacion de uso", "usagelocation", "alert", "alerta"] },
    ],
    solution: [
      "Connect-MgGraph -Scopes User.ReadWrite.All,Organization.Read.All",
      "Get-MgUser -UserId svidal@contoso.com -Property UsageLocation,AssignedLicenses,LicenseAssignmentStates | Select -ExpandProperty LicenseAssignmentStates",
      "Get-MgSubscribedSku",
      "Get-MgUser -Filter \"accountEnabled eq false\" -Property DisplayName,UserPrincipalName,AssignedLicenses",
      "Set-MgUserLicense -UserId rgomez@contoso.com -AddLicenses @() -RemoveLicenses @('" + E3 + "')",
      "Invoke-MgLicenseUser -UserId svidal@contoso.com",
      "Get-MgUserLicenseDetail -UserId svidal@contoso.com",
    ],
    sampleNote: {
      en: "GG-M365-E3 could not license svidal: CountViolation, 120 of 120 E3 in use, because leaver rgomez (disabled 30/09) still had a direct E3. Removed that licence and reprocessed the group assignment with Invoke-MgLicenseUser. Get-MgUserLicenseDetail shows SPE_E3 and his mailbox and Teams work. Asked to add direct licences to the leaver process, set UsageLocation at creation and review whether to buy more E3.",
      es: "GG-M365-E3 no podía dar licencia a svidal: CountViolation, 120 de 120 E3 en uso, porque la baja rgomez (deshabilitada el 30/09) aún tenía una E3 directa. Quité esa licencia y reprocesé la asignación por grupo con Invoke-MgLicenseUser. Get-MgUserLicenseDetail muestra SPE_E3 y su buzón y Teams funcionan. Pedí añadir las licencias directas al proceso de bajas, poner UsageLocation en el alta y valorar comprar más E3.",
    },
  });

  /* ------------------------------------------------------------------ 9. Shared mailbox that does not appear */
  scenarios.push({
    id: "shared-mailbox",
    level: 1,
    topic: { en: "Exchange Online", es: "Exchange Online" },
    minutes: 10,
    title: { en: "The invoices mailbox does not appear in Outlook", es: "El buzón de facturas no aparece en Outlook" },
    guide: GUIDE + "outlook-exchange-online-buzon-compartido-permisos-autorespuesta.html",
    machine: { host: "ADM-WS01", user: "it.admin", domain: "CONTOSO", shell: "powershell", prompt: "PS C:\\Users\\it.admin> " },
    ticket: {
      id: "INC-20503", from: "Laura Pérez (Accounting)", priority: "P3",
      subject: { en: "I can't see the facturas@ mailbox", es: "No veo el buzón facturas@" },
      body: {
        en: "From this week I also cover supplier invoices. IT gave me access to facturas@contoso.com on Monday, but the mailbox does not appear in Outlook, and if I try to open it I get 'The set of folders cannot be opened'. My colleagues see it under their own mailbox.",
        es: "Desde esta semana también llevo las facturas de proveedores. IT me dio acceso a facturas@contoso.com el lunes, pero el buzón no aparece en Outlook, y si intento abrirlo me sale 'No se puede abrir el conjunto de carpetas'. Mis compañeros lo ven debajo de su buzón.",
      },
    },
    intro: {
      en: "You are on your admin workstation with the ExchangeOnlineManagement module. facturas@contoso.com is a shared mailbox (no licence, no sign-in). The team members are mgarcia and dlopez.",
      es: "Estás en tu equipo de administración con el módulo ExchangeOnlineManagement. facturas@contoso.com es un buzón compartido (sin licencia, sin inicio de sesión). Los miembros del equipo son mgarcia y dlopez.",
    },
    requester: { name: "Laura Pérez", team: { en: "Accounting", es: "Contabilidad" }, user: "lperez", location: { en: "Head office, 3rd floor", es: "Oficina central, 3ª planta" }, device: "PC-FIN-033" },
    asset: {
      title: { en: "Shared mailbox · facturas@contoso.com", es: "Buzón compartido · facturas@contoso.com" },
      fields: [
        { label: { en: "Laura: Full Access", es: "Laura: Acceso total" }, states: [
          { when: { fullAccess: true }, value: { en: "Granted", es: "Concedido" }, tone: "ok" },
          { when: { permsChecked: true }, value: { en: "Missing", es: "No lo tiene" }, tone: "bad" },
          { value: { en: "Not reviewed", es: "Sin revisar" }, tone: "muted" }] },
        { label: { en: "Laura: Send As", es: "Laura: Enviar como" }, value: { en: "Granted (Monday)", es: "Concedido (lunes)" } },
        { label: { en: "In Laura's Outlook", es: "En el Outlook de Laura" }, states: [
          { when: { verified: true, automap: true }, value: { en: "Shown (automapping)", es: "Aparece (automapping)" }, tone: "ok" },
          { when: { verified: true }, value: { en: "Add it by hand (automapping off)", es: "Añadirlo a mano (automapping desactivado)" }, tone: "warn" },
          { when: { fullAccess: true }, value: { en: "After Outlook restarts", es: "Tras reiniciar Outlook" }, tone: "muted" },
          { value: { en: "'The set of folders cannot be opened'", es: "'No se puede abrir el conjunto de carpetas'" }, tone: "bad" }] },
        { label: { en: "Type", es: "Tipo" }, value: "SharedMailbox" },
      ],
    },
    actions: [{ id: "sendas", label: { en: "Grant Send As", es: "Conceder Enviar como" }, cmd: "Add-RecipientPermission facturas -Trustee lperez@contoso.com -AccessRights SendAs -Confirm:$false", when: { connected: true } }],
    codes: ["config-fixed"],
    state: { connected: false, permsChecked: false, fullAccess: false, automap: true, verified: false },
    commands: [
      { id: "connect", match: /^connect-exchangeonline\b/, set: { connected: true }, out: ["", "This V3 EXO PowerShell module contains new REST API backed Exchange Online cmdlets...", "(signed in as it.admin@contoso.com)", ""] },
      { id: "not-connected", match: /^(get|set|add|remove)-(exo)?(mailbox|recipient|mailboxpermission|recipientpermission|mailboxfolderpermission)\b/, when: { connected: false },
        error: true, out: ["Get-EXOMailbox : Run Connect-ExchangeOnline before using the Exchange Online cmdlets.", ""] },
      { id: "mbx", match: /^get-(exo)?mailbox\b.*facturas/, out: [
        "", "Name      Alias     PrimarySmtpAddress       RecipientTypeDetails", "----      -----     ------------------       --------------------", "facturas  facturas  facturas@contoso.com     SharedMailbox", ""] },
      { id: "sendas-list", match: /^get-(exo)?recipientpermission\b.*facturas/, out: [
        "", "Identity  Trustee               AccessControlType AccessRights Inherited", "--------  -------               ----------------- ------------ ---------",
        "facturas  NT AUTHORITY\\SELF     Allow             {SendAs}     False", "facturas  mgarcia@contoso.com   Allow             {SendAs}     False",
        "facturas  dlopez@contoso.com    Allow             {SendAs}     False", "facturas  lperez@contoso.com    Allow             {SendAs}     False", ""],
        say: { en: "Laura can send as the mailbox. Sending is not what she cannot do.", es: "Laura puede enviar como el buzón. Lo que no puede no es enviar." } },
      { id: "perm-user-ok", match: /^get-(exo)?mailboxpermission\b.*facturas.*lperez/, when: { fullAccess: true }, set: { verified: true }, out: [
        "", "Identity  User                AccessRights   IsInherited Deny", "--------  ----                ------------   ----------- ----", "facturas  lperez@contoso.com  {FullAccess}   False       False", ""],
        say: { en: "Laura restarts Outlook and facturas appears under her mailbox; she opens the Inbox. (On a real tenant automapping can take up to an hour.)",
               es: "Laura reinicia Outlook y facturas aparece debajo de su buzón; abre la Bandeja de entrada. (En un tenant real el automapping puede tardar hasta una hora.)" } },
      { id: "perm-user", match: /^get-(exo)?mailboxpermission\b.*facturas.*lperez/, set: { permsChecked: true }, out: [""],
        say: { en: "(Nothing: Laura has no permission on the mailbox itself.)", es: "(Nada: Laura no tiene ningún permiso sobre el propio buzón.)" } },
      { id: "perm-ok", match: /^get-(exo)?mailboxpermission\b.*facturas/, when: { fullAccess: true }, set: { verified: true }, out: [
        "", "Identity  User                AccessRights                  IsInherited Deny", "--------  ----                ------------                  ----------- ----",
        "facturas  NT AUTHORITY\\SELF   {FullAccess, ReadPermission}  False       False", "facturas  mgarcia@contoso.com {FullAccess}                  False       False",
        "facturas  dlopez@contoso.com  {FullAccess}                  False       False", "facturas  lperez@contoso.com  {FullAccess}                  False       False", ""],
        say: { en: "Laura restarts Outlook and facturas appears under her mailbox. (On a real tenant automapping can take up to an hour.)",
               es: "Laura reinicia Outlook y facturas aparece debajo de su buzón. (En un tenant real el automapping puede tardar hasta una hora.)" } },
      { id: "perm", match: /^get-(exo)?mailboxpermission\b.*facturas/, set: { permsChecked: true }, out: [
        "", "Identity  User                AccessRights                  IsInherited Deny", "--------  ----                ------------                  ----------- ----",
        "facturas  NT AUTHORITY\\SELF   {FullAccess, ReadPermission}  False       False", "facturas  mgarcia@contoso.com {FullAccess}                  False       False",
        "facturas  dlopez@contoso.com  {FullAccess}                  False       False", ""],
        say: { en: "Her colleagues have Full Access; Laura is not on the list. On Monday she only got Send As.", es: "Sus compañeros tienen Acceso total; Laura no está en la lista. El lunes solo recibió Enviar como." } },
      { id: "sendas-again", match: /^add-recipientpermission\b.*facturas/, out: [""],
        say: { en: "She already had Send As. Outlook can only show and open the mailbox with Full Access.", es: "Ya tenía Enviar como. Outlook solo puede mostrar y abrir el buzón con Acceso total." } },
      { id: "folder", match: /^add-mailboxfolderpermission\b.*facturas/, out: ["", "FolderName  User          AccessRights", "----------  ----          ------------", "Inbox       Laura Pérez   {Reviewer}", ""],
        say: { en: "A folder permission lets her read one folder if she adds the mailbox by hand, but not the mailbox the team uses. Her colleagues have Full Access.",
               es: "Un permiso de carpeta le deja leer una carpeta si añade el buzón a mano, pero no el buzón que usa el equipo. Sus compañeros tienen Acceso total." } },
      { id: "full-again", match: /^add-mailboxpermission\b.*facturas.*fullaccess/, when: { fullAccess: true }, out: [
        "WARNING: The appropriate access control entry is already present on the object \"facturas\" for account \"lperez@contoso.com\".", ""] },
      { id: "full-nomap", match: /^add-mailboxpermission\b.*facturas.*lperez.*fullaccess.*-automapping:?\s*\$false/, set: { fullAccess: true, automap: false }, out: [
        "", "Identity  User                AccessRights   IsInherited Deny", "--------  ----                ------------   ----------- ----", "facturas  lperez@contoso.com  {FullAccess}   False       False", ""],
        say: { en: "Full Access granted without automapping: Outlook will not add it by itself; she adds it in Account Settings > More Settings > Advanced.",
               es: "Acceso total concedido sin automapping: Outlook no lo añadirá solo; ella lo añade en Configuración de la cuenta > Más configuraciones > Avanzadas." } },
      { id: "full", match: /^add-mailboxpermission\b.*facturas.*lperez.*fullaccess/, set: { fullAccess: true, automap: true }, out: [
        "", "Identity  User                AccessRights   IsInherited Deny", "--------  ----                ------------   ----------- ----", "facturas  lperez@contoso.com  {FullAccess}   False       False", ""] },
      { id: "remove-full", match: /^remove-mailboxpermission\b.*facturas.*lperez/, set: { fullAccess: false, automap: true }, out: [""] },
    ],
    goal: { fullAccess: true, verified: true },
    stages: [
      { id: "investigate", label: { en: "Find which permission she is missing", es: "Encontrar qué permiso le falta" }, when: { permsChecked: true } },
      { id: "fix", label: { en: "Grant Full Access", es: "Conceder Acceso total" }, when: { fullAccess: true } },
      { id: "verify", label: { en: "Check the permission and that Outlook shows it", es: "Comprobar el permiso y que Outlook lo muestra" }, when: { verified: true } },
    ],
    resolved: { en: "Resolved: Laura can open the invoices mailbox. Now write the work note.", es: "Resuelto: Laura puede abrir el buzón de facturas. Ahora escribe la nota de trabajo." },
    hints: [
      { en: "Connect (Connect-ExchangeOnline) and look at both kinds of permission: Get-RecipientPermission facturas and Get-MailboxPermission facturas",
        es: "Conéctate (Connect-ExchangeOnline) y mira los dos tipos de permiso: Get-RecipientPermission facturas y Get-MailboxPermission facturas" },
      { en: "Send As only lets her send. To see and open the mailbox she needs Full Access, like her colleagues.", es: "Enviar como solo le deja enviar. Para ver y abrir el buzón necesita Acceso total, como sus compañeros." },
      { en: "Add-MailboxPermission facturas -User lperez@contoso.com -AccessRights FullAccess -InheritanceType All -AutoMapping $true",
        es: "Add-MailboxPermission facturas -User lperez@contoso.com -AccessRights FullAccess -InheritanceType All -AutoMapping $true" },
      { en: "Check with Get-MailboxPermission facturas -User lperez@contoso.com and ask her to restart Outlook.", es: "Compruébalo con Get-MailboxPermission facturas -User lperez@contoso.com y pídele que reinicie Outlook." },
    ],
    note: [
      { kb: "cause", label: { en: "the cause (only Send As, no Full Access)", es: "la causa (solo Enviar como, sin Acceso total)" },
        any: ["only send as", "solo send as", "solo enviar como", "only had send as", "no full access", "sin full access", "sin acceso total", "missing full", "faltaba"] },
      { kb: "fix", label: { en: "the fix (Full Access with automapping)", es: "la solución (Acceso total con automapping)" },
        any: ["add-mailboxpermission", "granted full", "gave full", "added full", "concedi", "di acceso total", "anadi"] },
      { kb: "verify", label: { en: "how you checked it", es: "cómo lo comprobaste" },
        any: ["get-mailboxpermission", "appears", "aparece", "opens", "abre", "checked", "comprob", "restart", "reinici"] },
      { kb: "followup", label: { en: "the follow-up (how to request shared mailbox access)", es: "el seguimiento (cómo pedir acceso a buzones compartidos)" },
        any: ["request", "solicitud", "template", "plantilla", "procedure", "procedimiento", "both permissions", "ambos permisos", "checklist", "automapping"] },
    ],
    solution: [
      "Connect-ExchangeOnline",
      "Get-RecipientPermission facturas",
      "Get-MailboxPermission facturas",
      "Add-MailboxPermission facturas -User lperez@contoso.com -AccessRights FullAccess -InheritanceType All -AutoMapping $true",
      "Get-MailboxPermission facturas -User lperez@contoso.com",
    ],
    sampleNote: {
      en: "Laura only had Send As on facturas@contoso.com, no Full Access, so Outlook could not show or open it. Granted Full Access with Add-MailboxPermission and automapping. Get-MailboxPermission shows FullAccess; after an Outlook restart the mailbox appears and opens. Updated the request template so shared mailbox access asks for both permissions.",
      es: "Laura solo tenía Enviar como en facturas@contoso.com, sin Acceso total, así que Outlook no podía mostrarlo ni abrirlo. Concedí Acceso total con Add-MailboxPermission y automapping. Get-MailboxPermission muestra FullAccess; tras reiniciar Outlook el buzón aparece y se abre. Actualicé la plantilla de solicitud para que el acceso a buzones compartidos pida ambos permisos.",
    },
  });

  /* ------------------------------------------------------------------ 10. New user that does not sync */
  const MGIL_OLD = "CN=Marina Gil,CN=Users,DC=contoso,DC=local";
  const MGIL_NEW = "CN=Marina Gil,OU=Legal,OU=Users,DC=contoso,DC=local";
  scenarios.push({
    id: "aadc-sync",
    level: 2,
    topic: { en: "Azure AD Connect", es: "Azure AD Connect" },
    minutes: 20,
    title: { en: "Created in AD this morning, missing in Microsoft 365", es: "Creada en AD esta mañana, no aparece en Microsoft 365" },
    guide: GUIDE + "azure-ad-connect-forzar-sincronizacion-y-objetos-que-no-pasan.html",
    machine: { host: "SYNC01", user: "it.admin", domain: "CONTOSO", shell: "powershell", prompt: "PS C:\\Users\\it.admin> " },
    ticket: {
      id: "INC-20504", from: "Ana Ortiz (Legal)", priority: "P2",
      subject: { en: "The new trainee does not exist in Microsoft 365", es: "La nueva becaria no existe en Microsoft 365" },
      body: {
        en: "Marina Gil starts in Legal tomorrow. The service desk created her account at 08:15 this morning, but four hours later she still does not appear in Microsoft 365: I cannot add her to our Teams team or share the contracts folder with her. User: mgil.",
        es: "Marina Gil empieza mañana en Legal. El service desk creó su cuenta a las 08:15 de esta mañana, pero cuatro horas después sigue sin aparecer en Microsoft 365: no puedo añadirla a nuestro equipo de Teams ni compartirle la carpeta de contratos. Usuario: mgil.",
      },
    },
    intro: {
      en: "You are on SYNC01, the Azure AD Connect server (now called Microsoft Entra Connect Sync), with the ADSync and ActiveDirectory modules, and signed in to Microsoft Graph PowerShell. Sync uses OU filtering. A delta cycle runs every 30 minutes; a full sync of the directory takes about 40 minutes.",
      es: "Estás en SYNC01, el servidor de Azure AD Connect (ahora Microsoft Entra Connect Sync), con los módulos ADSync y ActiveDirectory, y con sesión iniciada en Microsoft Graph PowerShell. La sincronización usa filtrado por OU. Cada 30 minutos se ejecuta un ciclo delta; una sincronización completa del directorio tarda unos 40 minutos.",
    },
    requester: { name: "Ana Ortiz", team: { en: "Legal", es: "Legal" }, user: "aortiz", location: { en: "Head office, 4th floor", es: "Oficina central, 4ª planta" }, device: "LAPTOP-0388" },
    asset: {
      title: { en: "AD user · mgil", es: "Usuario de AD · mgil" },
      fields: [
        { label: { en: "Location in AD", es: "Ubicación en AD" }, states: [
          { when: { moved: true }, value: "OU=Legal,OU=Users", tone: "ok" },
          { when: { adChecked: true }, value: { en: "CN=Users (default container)", es: "CN=Users (contenedor predeterminado)" }, tone: "bad" },
          { value: { en: "Not reviewed", es: "Sin revisar" }, tone: "muted" }] },
        { label: { en: "In Entra ID", es: "En Entra ID" }, states: [
          { when: { verified: true }, value: { en: "Synced", es: "Sincronizada" }, tone: "ok" },
          { value: { en: "Not found", es: "No existe" }, tone: "bad" }] },
        { label: { en: "Sync engine", es: "Motor de sincronización" }, states: [
          { when: { running: true }, value: { en: "Delta cycle running", es: "Ciclo delta en marcha" }, tone: "warn" },
          { when: { synced: true }, value: { en: "Idle, delta finished", es: "Inactivo, delta terminado" }, tone: "ok" },
          { value: { en: "Idle (every 30 min)", es: "Inactivo (cada 30 min)" } }] },
        { label: { en: "Created", es: "Creada" }, value: "28/10/2026 08:14" },
      ],
    },
    actions: [
      { id: "delta", label: { en: "Run a delta sync", es: "Lanzar sincronización delta" }, cmd: "Start-ADSyncSyncCycle -PolicyType Delta" },
      { id: "full", label: { en: "Run a full sync", es: "Lanzar sincronización completa" }, cmd: "Start-ADSyncSyncCycle -PolicyType Initial" },
    ],
    codes: ["config-fixed", "cause-removed"],
    state: { adChecked: false, cloudChecked: false, scopeFound: false, moved: false, synced: false, running: false, verified: false },
    commands: [
      { id: "move", match: /^(?=.*move-adobject\b)(?=.*(mgil|marina gil))(?=.*-targetpath\s*["']?ou=legal,ou=users,dc=contoso,dc=local)/, unless: { moved: true }, set: { moved: true, adChecked: true }, out: [""],
        say: { en: "Marina is now in OU=Legal,OU=Users, with the rest of her team, inside the sync scope.", es: "Marina está ahora en OU=Legal,OU=Users, con el resto de su equipo, dentro del ámbito de sincronización." } },
      { id: "move-other", match: /^(?=.*move-adobject\b)(?=.*(mgil|marina gil))/, unless: { moved: true }, out: [""],
        say: { en: "That is not her department's OU. She works in Legal: OU=Legal,OU=Users,DC=contoso,DC=local.", es: "Esa no es la OU de su departamento. Trabaja en Legal: OU=Legal,OU=Users,DC=contoso,DC=local." } },
      { id: "aduser-new", match: /^get-aduser\b.*\b(mgil|marina)/, when: { moved: true }, out: [
        "", "DistinguishedName : " + MGIL_NEW, "Enabled           : True", "SamAccountName    : mgil", "UserPrincipalName : mgil@contoso.com", "whenCreated       : 28/10/2026 08:14:52", ""] },
      { id: "aduser", match: /^get-aduser\b.*\b(mgil|marina)/, set: { adChecked: true }, out: [
        "", "DistinguishedName : " + MGIL_OLD, "Enabled           : True", "SamAccountName    : mgil", "UserPrincipalName : mgil@contoso.com", "whenCreated       : 28/10/2026 08:14:52", ""],
        say: { en: "She exists and is enabled. Look at where she is.", es: "Existe y está habilitada. Fíjate en dónde está." } },
      { id: "mg-ok", match: /^get-mguser\b.*mgil/, when: { synced: true, running: false }, set: { verified: true }, out: [
        "", "DisplayName : Marina Gil", "UserPrincipalName : mgil@contoso.com", "OnPremisesSyncEnabled : True", "OnPremisesLastSyncDateTime : 28/10/2026 12:21:40", ""],
        say: { en: "She is in Entra ID. Ana can add her to Teams now; her E3 comes from GG-M365-E3 if she is a member.", es: "Ya está en Entra ID. Ana ya puede añadirla a Teams; la E3 le llega por GG-M365-E3 si es miembro." } },
      { id: "mg-running", match: /^get-mguser\b.*mgil/, when: { running: true }, error: true, out: [
        "Get-MgUser_Get: Resource 'mgil@contoso.com' does not exist or one of its queried reference-property objects are not present.", ""],
        say: { en: "Not yet: is the cycle you started still running?", es: "Todavía no: ¿sigue en marcha el ciclo que lanzaste?" } },
      { id: "mg-missing", match: /^get-mguser\b.*mgil/, set: { cloudChecked: true }, error: true, out: [
        "Get-MgUser_Get: Resource 'mgil@contoso.com' does not exist or one of its queried reference-property objects are not present.", ""] },
      { id: "scheduler", match: /^get-adsyncscheduler\b/, out: [
        "", "AllowedSyncCycleInterval            : 00:30:00", "CurrentlyEffectiveSyncCycleInterval : 00:30:00", "NextSyncCyclePolicyType             : Delta",
        "NextSyncCycleStartTimeInUTC         : 28/10/2026 11:30:12", "SyncCycleEnabled                    : True", "MaintenanceEnabled                  : True", "StagingModeEnabled                  : False", ""],
        say: { en: "The scheduler is on and not in staging mode: eight delta cycles have run since 08:15. They did not pick her up.",
               es: "El programador está activo y no en modo staging: desde las 08:15 han pasado ocho ciclos delta. Ninguno la recogió." } },
      { id: "scope", match: /get-adsyncconnector\b.*(partition|containerinclusion)/, set: { scopeFound: true }, out: [
        "", "OU=Users,DC=contoso,DC=local", "OU=Shared accounts,DC=contoso,DC=local", "OU=Groups,DC=contoso,DC=local", "OU=Computers,DC=contoso,DC=local", ""],
        say: { en: "These are the containers the AD connector reads. Compare them with her distinguished name.", es: "Estos son los contenedores que lee el conector de AD. Compáralos con su nombre distintivo." } },
      { id: "connectors", match: /^get-adsyncconnector\b/, out: [
        "", "Name                          Type       ", "----                          ----       ", "contoso.local                 AD         ", "contoso.onmicrosoft.com - AAD Extensible2", ""],
        say: { en: "The AD connector's selected OUs are in .Partitions.ConnectorPartitionScope.ContainerInclusionList.", es: "Las OU seleccionadas del conector de AD están en .Partitions.ConnectorPartitionScope.ContainerInclusionList." } },
      { id: "csobject-new", match: /^get-adsynccsobject\b.*ou=legal/, when: { synced: true }, out: [
        "", "DistinguishedName : " + MGIL_NEW, "ConnectorName     : contoso.local", "ObjectType        : user", "IsConnector       : True", ""] },
      { id: "csobject", match: /^get-adsynccsobject\b/, set: { scopeFound: true }, out: [""],
        say: { en: "Nothing: she is not in the AD connector space. The sync engine has never imported her, so it never tried to export her either.",
               es: "Nada: no está en el espacio del conector de AD. El motor nunca la ha importado, así que tampoco intentó exportarla." } },
      { id: "runresult", match: /^get-adsyncrunprofileresult\b/, out: [
        "", "ConnectorName                  RunProfileName  Result   StartDate", "-------------                  --------------  ------   ---------",
        "contoso.onmicrosoft.com - AAD  Export          success  28/10/2026 11:01:44", "contoso.local                  Delta Import    success  28/10/2026 11:00:09", ""],
        say: { en: "No export errors (no duplicate attributes, no conflicts). The problem is not a failed export: she was never picked up.",
               es: "Sin errores de exportación (ni atributos duplicados ni conflictos). No es una exportación fallida: nunca la recogió." } },
      { id: "runstatus-busy", match: /^get-adsyncconnectorrunstatus\b/, when: { running: true }, set: { running: false }, out: [
        "", "RunState ConnectorName", "-------- -------------", "Busy     contoso.onmicrosoft.com - AAD", ""],
        say: { en: "The cycle is exporting to Entra ID. (Two minutes later the same command returns nothing: the engine is idle again.)",
               es: "El ciclo está exportando a Entra ID. (Dos minutos después el mismo comando no devuelve nada: el motor vuelve a estar inactivo.)" } },
      { id: "runstatus", match: /^get-adsyncconnectorrunstatus\b/, out: [""],
        say: { en: "(Empty: the sync engine is idle.)", es: "(Vacío: el motor de sincronización está inactivo.)" } },
      { id: "delta-moved", match: /^start-adsyncsynccycle\b(?!.*initial)/, when: { moved: true }, set: { synced: true, running: true }, out: ["", "Result", "------", "Success", ""],
        say: { en: "Delta cycle started.", es: "Ciclo delta lanzado." } },
      { id: "delta", match: /^start-adsyncsynccycle\b(?!.*initial)/, out: ["", "Result", "------", "Success", ""],
        say: { en: "(A few minutes later.) The cycle ends without errors, and she is still not in Entra ID.", es: "(Unos minutos después.) El ciclo termina sin errores, y ella sigue sin estar en Entra ID." } },
      { id: "full-moved", match: /^start-adsyncsynccycle\b.*initial/, when: { moved: true }, set: { synced: true, running: true }, out: ["", "Result", "------", "Success", ""],
        say: { en: "Full sync started. A delta would have been enough: moving the object is a change the delta picks up.", es: "Sincronización completa lanzada. Bastaba un delta: mover el objeto es un cambio que el delta recoge." } },
      { id: "full", match: /^start-adsyncsynccycle\b.*initial/, out: ["", "Result", "------", "Success", ""],
        say: { en: "(40 minutes later.) The full sync re-read the whole directory and she is still not there. A full sync reads the same OUs, just all of them again.",
               es: "(40 minutos después.) La sincronización completa ha releído todo el directorio y ella sigue sin aparecer. Una completa lee las mismas OU, solo que todo otra vez." } },
    ],
    goal: { moved: true, synced: true, running: false, verified: true },
    stages: [
      { id: "investigate", label: { en: "Find why the sync skips her", es: "Encontrar por qué la sincronización la ignora" }, when: { adChecked: true, scopeFound: true } },
      { id: "fix", label: { en: "Move her into the sync scope and sync", es: "Moverla al ámbito de sincronización y sincronizar" }, when: { moved: true, synced: true } },
      { id: "verify", label: { en: "Check she is in Entra ID", es: "Comprobar que está en Entra ID" }, when: { verified: true } },
    ],
    resolved: { en: "Resolved: Marina is synced to Entra ID. Now write the work note.", es: "Resuelto: Marina está sincronizada en Entra ID. Ahora escribe la nota de trabajo." },
    hints: [
      { en: "Compare both sides: Get-ADUser mgil -Properties whenCreated and Get-MgUser -UserId mgil@contoso.com", es: "Compara los dos lados: Get-ADUser mgil -Properties whenCreated y Get-MgUser -UserId mgil@contoso.com" },
      { en: "Is the sync running (Get-ADSyncScheduler)? Which OUs does it read? (Get-ADSyncConnector -Name contoso.local).Partitions.ConnectorPartitionScope.ContainerInclusionList",
        es: "¿Se está sincronizando (Get-ADSyncScheduler)? ¿Qué OU lee? (Get-ADSyncConnector -Name contoso.local).Partitions.ConnectorPartitionScope.ContainerInclusionList" },
      { en: "CN=Users is the default container, not OU=Users. Move her: Move-ADObject '" + MGIL_OLD + "' -TargetPath 'OU=Legal,OU=Users,DC=contoso,DC=local'",
        es: "CN=Users es el contenedor predeterminado, no OU=Users. Muévela: Move-ADObject '" + MGIL_OLD + "' -TargetPath 'OU=Legal,OU=Users,DC=contoso,DC=local'" },
      { en: "Start-ADSyncSyncCycle -PolicyType Delta, wait until Get-ADSyncConnectorRunStatus is empty, then Get-MgUser again.",
        es: "Start-ADSyncSyncCycle -PolicyType Delta, espera a que Get-ADSyncConnectorRunStatus salga vacío y vuelve a lanzar Get-MgUser." },
    ],
    note: [
      { kb: "cause", label: { en: "the cause (created in CN=Users, outside the sync scope)", es: "la causa (creada en CN=Users, fuera del ámbito de sincronización)" },
        any: ["cn=users", "default container", "contenedor predeterminado", "out of scope", "outside the sync scope", "fuera del ambito", "not synced ou", "ou filtering", "filtrado por ou"] },
      { kb: "fix", label: { en: "the fix (moved to OU=Legal, delta sync)", es: "la solución (movida a OU=Legal, sincronización delta)" },
        any: ["move-adobject", "moved", "movi", "ou=legal", "delta"] },
      { kb: "verify", label: { en: "how you checked it", es: "cómo lo comprobaste" }, any: ["get-mguser", "onpremisessyncenabled", "entra id", "appears", "aparece", "checked", "comprob"] },
      { kb: "followup", label: { en: "the follow-up (create users in the right OU)", es: "el seguimiento (crear los usuarios en la OU correcta)" },
        any: ["-path", "redirusr", "template", "plantilla", "procedure", "procedimiento", "service desk", "onboarding", "alta"] },
    ],
    solution: [
      "Get-ADUser mgil -Properties whenCreated",
      "Get-MgUser -UserId mgil@contoso.com",
      "Get-ADSyncScheduler",
      "(Get-ADSyncConnector -Name contoso.local).Partitions.ConnectorPartitionScope.ContainerInclusionList",
      "Move-ADObject '" + MGIL_OLD + "' -TargetPath 'OU=Legal,OU=Users,DC=contoso,DC=local'",
      "Start-ADSyncSyncCycle -PolicyType Delta",
      "Get-ADSyncConnectorRunStatus",
      "Get-MgUser -UserId mgil@contoso.com",
    ],
    sampleNote: {
      en: "mgil was created in CN=Users, the default container, which is outside the sync scope (OU filtering reads OU=Users and others), so the sync never imported her; no export errors. Moved her with Move-ADObject to OU=Legal,OU=Users and ran a delta sync. Checked with Get-MgUser: she is in Entra ID with OnPremisesSyncEnabled True. Asked the service desk to create users with -Path in their department's OU (and proposed redirusr to an OU that is synced).",
      es: "mgil se creó en CN=Users, el contenedor predeterminado, que está fuera del ámbito de sincronización (el filtrado por OU lee OU=Users y otras), así que la sincronización nunca la importó; sin errores de exportación. La moví con Move-ADObject a OU=Legal,OU=Users y lancé una sincronización delta. Comprobé con Get-MgUser: está en Entra ID con OnPremisesSyncEnabled True. Pedí al service desk que cree los usuarios con -Path en la OU de su departamento (y propuse redirusr a una OU que se sincronice).",
    },
  });

  /* ------------------------------------------------------------------ 11. Backup job that fails every night */
  scenarios.push({
    id: "veeam-job",
    level: 2,
    topic: { en: "Veeam Backup", es: "Veeam Backup" },
    minutes: 20,
    title: { en: "Three nights without a backup of the file server", es: "Tres noches sin copia del servidor de ficheros" },
    guide: GUIDE + "veeam-crear-un-job-comprobar-copias-y-restaurar.html",
    machine: { host: "VBR01", user: "it.admin", domain: "CONTOSO", shell: "powershell", prompt: "PS C:\\Users\\it.admin> " },
    ticket: {
      id: "INC-20511", from: "Veeam backup report (VBR01)", priority: "P2",
      subject: { en: "[Failed] FS01 Nightly: third failed night in a row", es: "[Failed] FS01 Nightly: tercera noche seguida con error" },
      body: {
        en: "The morning backup report shows job 'FS01 Nightly' as Failed for the third night (25, 26 and 27 October). FS01 holds the S: drive and the department shares. The last good restore point is from 24 October. The night operator retried the job twice and it failed again.",
        es: "El informe de copias de esta mañana muestra el job 'FS01 Nightly' en Failed por tercera noche (25, 26 y 27 de octubre). FS01 tiene la unidad S: y las carpetas de departamento. El último punto de restauración bueno es del 24 de octubre. El operador de noche reintentó el job dos veces y volvió a fallar.",
      },
    },
    intro: {
      en: "You are on the backup server VBR01 (Veeam Backup & Replication 12) in PowerShell with the Veeam module loaded. The backups go to repository REPO01 (E:\\Backups on VBR01, 8 TB, NTFS). Do not delete restore points of jobs that still exist.",
      es: "Estás en el servidor de copias VBR01 (Veeam Backup & Replication 12) en PowerShell con el módulo de Veeam cargado. Las copias van al repositorio REPO01 (E:\\Backups en VBR01, 8 TB, NTFS). No borres puntos de restauración de jobs que siguen existiendo.",
    },
    requester: { name: { en: "Backup report", es: "Informe de copias" }, team: { en: "IT", es: "IT" }, user: "it.admin", location: { en: "Data centre, rack 2", es: "CPD, rack 2" }, device: "VBR01" },
    asset: {
      title: { en: "Backup job · FS01 Nightly", es: "Job de copia · FS01 Nightly" },
      fields: [
        { label: { en: "Last result", es: "Último resultado" }, states: [
          { when: { jobRun: true }, value: { en: "Success (today)", es: "Success (hoy)" }, tone: "ok" },
          { value: { en: "Failed (3 nights)", es: "Failed (3 noches)" }, tone: "bad" }] },
        { label: { en: "Free space on REPO01", es: "Espacio libre en REPO01" }, states: [
          { when: { freed: true }, value: { en: "2.9 TB of 8 TB", es: "2,9 TB de 8 TB" }, tone: "ok" },
          { value: { en: "41 GB of 8 TB", es: "41 GB de 8 TB" }, tone: "bad" }] },
        { label: { en: "Chain 'FS01 Weekly'", es: "Cadena 'FS01 Weekly'" }, states: [
          { when: { freed: true }, value: { en: "Removed from disk", es: "Eliminada del disco" }, tone: "ok" },
          { when: { orphanFound: true }, value: { en: "2.9 TB, its job no longer exists", es: "2,9 TB, su job ya no existe" }, tone: "warn" },
          { value: { en: "Not reviewed", es: "Sin revisar" }, tone: "muted" }] },
        { label: { en: "Last restore point", es: "Último punto de restauración" }, states: [
          { when: { jobRun: true }, value: "28/10/2026 10:37", tone: "ok" },
          { value: "24/10/2026 22:04", tone: "warn" }] },
      ],
    },
    actions: [
      { id: "retry", label: { en: "Retry the job", es: "Reintentar el job" }, cmd: "Get-VBRJob -Name 'FS01 Nightly' | Start-VBRJob -RetryBackup" },
      { id: "points", label: { en: "Show restore points", es: "Ver puntos de restauración" }, cmd: "Get-VBRBackup -Name 'FS01 Nightly' | Get-VBRRestorePoint" },
    ],
    codes: ["capacity", "cause-removed"],
    bind: [
      { kind: "server", id: "FS01", states: [
        { when: { jobRun: false }, set: { status: "warn" },
          note: { en: "No backup since 24/10/2026: job FS01 Nightly fails", es: "Sin copia desde el 24/10/2026: el job FS01 Nightly falla" } },
        { set: {} }] },
    ],
    state: { jobChecked: false, logRead: false, repoChecked: false, orphanFound: false, configOnly: false, freed: false, jobRun: false, verified: false },
    commands: [
      { id: "connect", match: /^connect-vbrserver\b/, out: [""], say: { en: "(Connected to VBR01.)", es: "(Conectado a VBR01.)" } },
      { id: "retry-early", match: /start-vbrjob\b/, when: { freed: false }, set: { jobChecked: true }, out: [
        "",
        "Job Name             State      Start Time             End Time               Result",
        "--------             -----      ----------             --------               ------",
        "FS01 Nightly         Stopped    28/10/2026 09:52:10    28/10/2026 10:31:47    Failed", ""],
        say: { en: "Failed again, at the same point as the last three nights. Retrying does not change what makes it fail.",
               es: "Vuelve a fallar, en el mismo punto que las tres últimas noches. Reintentar no cambia lo que lo hace fallar." } },
      { id: "run", match: /start-vbrjob\b/, set: { jobRun: true }, out: [
        "",
        "Job Name             State      Start Time             End Time               Result",
        "--------             -----      ----------             --------               ------",
        "FS01 Nightly         Stopped    28/10/2026 10:02:33    28/10/2026 10:37:05    Success", ""],
        say: { en: "The job finished with Success. The synthetic full that failed every night has been created.",
               es: "El job ha terminado en Success. Se ha creado el full sintético que fallaba cada noche." } },
      { id: "job", match: /^get-vbrjob\b/, when: { jobRun: false }, set: { jobChecked: true }, out: [
        "",
        "Name                 Type            State      Last Result  Description",
        "----                 ----            -----      -----------  -----------",
        "FS01 Nightly         VMware Backup   Stopped    Failed       S: drive and department shares",
        "SQL01 Nightly        VMware Backup   Stopped    Success      ERP database server", ""],
        say: { en: "Only FS01 fails; SQL01 writes to the same repository and still fits because it is much smaller.",
               es: "Solo falla FS01; SQL01 escribe en el mismo repositorio y aún cabe porque es mucho más pequeño." } },
      { id: "job-ok", match: /^get-vbrjob\b/, out: [
        "",
        "Name                 Type            State      Last Result  Description",
        "----                 ----            -----      -----------  -----------",
        "FS01 Nightly         VMware Backup   Stopped    Success      S: drive and department shares",
        "SQL01 Nightly        VMware Backup   Stopped    Success      ERP database server", ""] },
      { id: "log", match: /(logger\.getlog|getlog\(\)|get-vbrtasksession\b)/, when: { jobRun: false }, set: { logRead: true, jobChecked: true }, out: [
        "",
        "Title",
        "-----",
        "Job started at 27/10/2026 22:00:09",
        "Building VM list",
        "Processing FS01",
        "Repository REPO01 is getting low on free space (41 GB left)",
        "Creating synthetic full backup (GFS weekly)",
        "Error: There is not enough space on the disk. Failed to write data to the file [E:\\Backups\\FS01 Nightly\\FS01.vm-1042D2026-10-27T220012_6A1C.vbk].",
        "Job finished with error at 27/10/2026 23:41:55", ""],
        say: { en: "The job dies writing the weekly synthetic full: the repository is out of space.",
               es: "El job muere al escribir el full sintético semanal: el repositorio se ha quedado sin espacio." } },
      { id: "log-ok", match: /(logger\.getlog|getlog\(\)|get-vbrtasksession\b)/, out: [
        "", "Title", "-----", "Processing FS01", "Creating synthetic full backup (GFS weekly)", "Job finished at 28/10/2026 10:37:05", ""] },
      { id: "sessions", match: /^get-vbrbackupsession\b/, when: { jobRun: false }, set: { jobChecked: true }, out: [
        "",
        "Job Name             State      Start Time             End Time               Result",
        "--------             -----      ----------             --------               ------",
        "FS01 Nightly         Stopped    27/10/2026 22:00:09    27/10/2026 23:41:55    Failed",
        "FS01 Nightly         Stopped    26/10/2026 22:00:07    26/10/2026 23:38:12    Failed",
        "FS01 Nightly         Stopped    25/10/2026 22:00:11    25/10/2026 23:40:03    Failed",
        "FS01 Nightly         Stopped    24/10/2026 22:00:05    24/10/2026 22:04:41    Success", ""],
        say: { en: "The result says Failed but not why. Each session keeps its log (Logger.GetLog()).",
               es: "El resultado dice Failed pero no por qué. Cada sesión guarda su log (Logger.GetLog())." } },
      { id: "sessions-ok", match: /^get-vbrbackupsession\b/, out: [
        "",
        "Job Name             State      Start Time             End Time               Result",
        "--------             -----      ----------             --------               ------",
        "FS01 Nightly         Stopped    28/10/2026 10:02:33    28/10/2026 10:37:05    Success",
        "FS01 Nightly         Stopped    27/10/2026 22:00:09    27/10/2026 23:41:55    Failed", ""] },
      { id: "repo", match: /^get-vbrbackuprepository\b/, when: { freed: false }, set: { repoChecked: true }, out: [
        "",
        "Name     Path         FreeGB  TotalGB",
        "----     ----         ------  -------",
        "REPO01   E:\\Backups       41     8192", ""],
        say: { en: "41 GB free out of 8 TB. FS01's weekly synthetic full needs about 1.8 TB. Something is taking up the repository.",
               es: "41 GB libres de 8 TB. El full sintético semanal de FS01 necesita unos 1,8 TB. Algo está ocupando el repositorio." } },
      { id: "repo-ok", match: /^get-vbrbackuprepository\b/, out: [
        "",
        "Name     Path         FreeGB  TotalGB",
        "----     ----         ------  -------",
        "REPO01   E:\\Backups     2987     8192", ""] },
      { id: "points-before", match: /get-vbrrestorepoint\b/, when: { jobRun: false }, out: [
        "",
        "VM Name   Creation Time          Type",
        "-------   -------------          ----",
        "FS01      22/10/2026 22:03:58    Increment",
        "FS01      23/10/2026 22:04:12    Increment",
        "FS01      24/10/2026 22:04:41    Increment", ""],
        say: { en: "Nothing newer than 24 October.", es: "Nada posterior al 24 de octubre." } },
      { id: "points", match: /get-vbrrestorepoint\b/, set: { verified: true }, out: [
        "",
        "VM Name   Creation Time          Type",
        "-------   -------------          ----",
        "FS01      23/10/2026 22:04:12    Increment",
        "FS01      24/10/2026 22:04:41    Increment",
        "FS01      28/10/2026 10:37:05    Full", ""],
        say: { en: "There is a restore point of FS01 from today.", es: "Hay un punto de restauración de FS01 de hoy." } },
      { id: "remove-nightly", match: /^(?=.*remove-vbrbackup\b)(?=.*nightly)/, out: [
        "", "Confirm", "Are you sure you want to perform this action? [Y] Yes  [N] No (default is \"N\"): N", ""],
        say: { en: "You stopped at the confirmation: that chain holds FS01's only good restore points.",
               es: "Te paras en la confirmación: esa cadena tiene los únicos puntos de restauración buenos de FS01." } },
      { id: "remove-gone", match: /^(?=.*remove-vbrbackup\b)(?=.*weekly)/, when: { configOnly: true }, error: true, out: [
        "Remove-VBRBackup : Cannot validate argument on parameter 'Backup'. The argument is null or empty.", ""],
        say: { en: "The backup is no longer in the configuration, but its files are still in E:\\Backups\\FS01 Weekly.",
               es: "La copia ya no está en la configuración, pero sus ficheros siguen en E:\\Backups\\FS01 Weekly." } },
      { id: "remove-disk", match: /^(?=.*remove-vbrbackup\b)(?=.*weekly)(?=.*-fromdisk\b)/, unless: { freed: true }, set: { freed: true, orphanFound: true }, out: [""],
        say: { en: "Chain 'FS01 Weekly' removed from the configuration and from disk: 2.9 TB freed in REPO01.",
               es: "Cadena 'FS01 Weekly' eliminada de la configuración y del disco: 2,9 TB liberados en REPO01." } },
      { id: "remove-config", match: /^(?=.*remove-vbrbackup\b)(?=.*weekly)/, unless: { freed: true }, set: { configOnly: true, orphanFound: true }, out: [""],
        say: { en: "Without -FromDisk, Remove-VBRBackup only removes the backup from the configuration. The files stay on the repository and no space is freed.",
               es: "Sin -FromDisk, Remove-VBRBackup solo quita la copia de la configuración. Los ficheros se quedan en el repositorio y no se libera espacio." } },
      { id: "files-del", match: /^(remove-item|del|rd|rmdir)\b.*fs01 weekly/, unless: { freed: true }, set: { freed: true, orphanFound: true }, out: [""],
        say: { en: "Folder deleted: 2.9 TB freed. (While a backup is still in the configuration, Remove-VBRBackup -FromDisk is cleaner: it removes both.)",
               es: "Carpeta borrada: 2,9 TB liberados. (Si la copia sigue en la configuración, Remove-VBRBackup -FromDisk es más limpio: quita las dos cosas.)" } },
      { id: "backups", match: /^get-vbrbackup(\s|$)/, when: { freed: false, configOnly: false }, set: { orphanFound: true }, out: [
        "",
        "Job Name             Type            Creation Time          VM count",
        "--------             ----            -------------          --------",
        "FS01 Nightly         VMware Backup   02/09/2026 22:00:14    1",
        "FS01 Weekly          VMware Backup   07/03/2026 23:00:05    1",
        "SQL01 Nightly        VMware Backup   15/01/2026 22:30:11    1", ""],
        say: { en: "'FS01 Weekly' has no job any more: it was deleted on 02/09 when weekly GFS was added to FS01 Nightly, but its 2.9 TB chain stayed in REPO01.",
               es: "'FS01 Weekly' ya no tiene job: se borró el 02/09 al añadir GFS semanal a FS01 Nightly, pero su cadena de 2,9 TB se quedó en REPO01." } },
      { id: "backups-ok", match: /^get-vbrbackup(\s|$)/, out: [
        "",
        "Job Name             Type            Creation Time          VM count",
        "--------             ----            -------------          --------",
        "FS01 Nightly         VMware Backup   02/09/2026 22:00:14    1",
        "SQL01 Nightly        VMware Backup   15/01/2026 22:30:11    1", ""] },
      { id: "retention", match: /^set-vbrjob(options|advancedstorageoptions)?\b/, out: [""],
        say: { en: "Changing the retention only affects new restore points. The space is held by a chain that no job manages.",
               es: "Cambiar la retención solo afecta a los puntos nuevos. El espacio lo ocupa una cadena que ningún job gestiona." } },
    ],
    goal: { freed: true, jobRun: true, verified: true },
    stages: [
      { id: "investigate", label: { en: "Find why the job fails and what fills the repository", es: "Encontrar por qué falla el job y qué llena el repositorio" }, when: { logRead: true, orphanFound: true } },
      { id: "fix", label: { en: "Free the space and run the job again", es: "Liberar el espacio y volver a lanzar el job" }, when: { freed: true, jobRun: true } },
      { id: "verify", label: { en: "Check there is a new restore point", es: "Comprobar que hay un punto de restauración nuevo" }, when: { verified: true } },
    ],
    resolved: { en: "Resolved: the job works again and FS01 has a restore point from today. Now write the work note.",
                es: "Resuelto: el job vuelve a funcionar y FS01 tiene un punto de restauración de hoy. Ahora escribe la nota de trabajo." },
    hints: [
      { en: "Look at the last sessions and read the log of the last one: (Get-VBRBackupSession | ? JobName -eq 'FS01 Nightly' | Sort-Object EndTime -Descending)[0].Logger.GetLog().UpdatedRecords | Select-Object Title",
        es: "Mira las últimas sesiones y lee el log de la última: (Get-VBRBackupSession | ? JobName -eq 'FS01 Nightly' | Sort-Object EndTime -Descending)[0].Logger.GetLog().UpdatedRecords | Select-Object Title" },
      { en: "Check the repository: Get-VBRBackupRepository -Name REPO01 | Select-Object Name, @{n='FreeGB';e={$_.GetContainer().CachedFreeSpace.InGigabytes}}",
        es: "Revisa el repositorio: Get-VBRBackupRepository -Name REPO01 | Select-Object Name, @{n='FreeGB';e={$_.GetContainer().CachedFreeSpace.InGigabytes}}" },
      { en: "Compare the backups on disk (Get-VBRBackup) with the jobs that exist (Get-VBRJob). A backup without a job is orphaned.",
        es: "Compara las copias en disco (Get-VBRBackup) con los jobs que existen (Get-VBRJob). Una copia sin job está huérfana." },
      { en: "Remove it from disk too: Get-VBRBackup -Name 'FS01 Weekly' | Remove-VBRBackup -FromDisk -Confirm:$false. Then rerun the job and check Get-VBRRestorePoint.",
        es: "Elimínala también del disco: Get-VBRBackup -Name 'FS01 Weekly' | Remove-VBRBackup -FromDisk -Confirm:$false. Después relanza el job y comprueba Get-VBRRestorePoint." },
    ],
    note: [
      { kb: "cause", label: { en: "the cause (repository full because of the orphaned chain FS01 Weekly)", es: "la causa (repositorio lleno por la cadena huérfana FS01 Weekly)" },
        any: ["fs01 weekly", "orphan", "huerfan", "not enough space", "out of space", "sin espacio", "repository full", "repositorio lleno", "41 gb"] },
      { kb: "fix", label: { en: "the fix (orphaned chain removed from disk, job rerun)", es: "la solución (cadena huérfana eliminada del disco, job relanzado)" },
        any: ["remove-vbrbackup", "fromdisk", "removed", "deleted", "elimin", "borr"] },
      { kb: "verify", label: { en: "how you checked it (Success, new restore point)", es: "cómo lo comprobaste (Success, punto de restauración nuevo)" },
        any: ["restore point", "punto de restauracion", "success", "correctamente"] },
      { kb: "followup", label: { en: "the follow-up (capacity alert, delete from disk when removing jobs)", es: "el seguimiento (alerta de capacidad, eliminar del disco al borrar jobs)" },
        any: ["alert", "alerta", "capacity", "capacidad", "procedure", "procedimiento", "checklist"] },
    ],
    solution: [
      "Get-VBRJob -Name 'FS01 Nightly'",
      "(Get-VBRBackupSession | ? JobName -eq 'FS01 Nightly' | Sort-Object EndTime -Descending)[0].Logger.GetLog().UpdatedRecords | Select-Object Title",
      "Get-VBRBackupRepository -Name REPO01 | Select-Object Name, @{n='FreeGB';e={$_.GetContainer().CachedFreeSpace.InGigabytes}}",
      "Get-VBRBackup",
      "Get-VBRBackup -Name 'FS01 Weekly' | Remove-VBRBackup -FromDisk -Confirm:$false",
      "Get-VBRJob -Name 'FS01 Nightly' | Start-VBRJob",
      "Get-VBRBackup -Name 'FS01 Nightly' | Get-VBRRestorePoint",
    ],
    sampleNote: {
      en: "Job FS01 Nightly failed three nights writing the weekly synthetic full because REPO01 had only 41 GB free (not enough space on the disk). The space was taken by the orphaned chain FS01 Weekly (2.9 TB), left behind when that job was dropped in September. Removed it with Remove-VBRBackup -FromDisk and ran the job again. It ended with Success and FS01 has a new restore point from today. Proposed a capacity alert for REPO01 at 15% and a step in the procedure to delete from disk when a job is retired.",
      es: "El job FS01 Nightly falló tres noches al escribir el full sintético semanal porque REPO01 solo tenía 41 GB libres (sin espacio en el disco). El espacio lo ocupaba la cadena huérfana FS01 Weekly (2,9 TB), que quedó cuando se retiró ese job en septiembre. La eliminé con Remove-VBRBackup -FromDisk y relancé el job. Terminó correctamente (Success) y FS01 tiene un punto de restauración nuevo de hoy. Propuse una alerta de capacidad para REPO01 al 15% y un paso en el procedimiento para eliminar del disco al retirar un job.",
    },
  });

  /* ------------------------------------------------------------------ 12. Deployment failed, app installed */
  scenarios.push({
    id: "mecm-app",
    level: 2,
    topic: { en: "MECM / SCCM", es: "MECM / SCCM" },
    minutes: 20,
    title: { en: "Installed, but Software Center says 'Failed'", es: "Instalada, pero el Centro de software dice 'Error'" },
    guide: GUIDE + "mecm-sccm-empaquetar-una-aplicacion-y-desplegarla.html",
    machine: { host: "ADM-WS01", user: "it.admin", domain: "CONTOSO", shell: "powershell", prompt: "PS CON:\\> " },
    ticket: {
      id: "INC-20512", from: "David López (Finance)", priority: "P3",
      subject: { en: "Software Center says Contoso Expenses failed, but it works", es: "El Centro de software dice que Contoso Expenses falló, pero funciona" },
      body: {
        en: "Since Monday Software Center shows Contoso Expenses as 'Failed' and every night it installs again (I see the progress bar in the morning). The app opens and works: it says version 4.2. My colleagues in Finance have the same.",
        es: "Desde el lunes el Centro de software muestra Contoso Expenses como 'Error' y cada noche se vuelve a instalar (por la mañana veo la barra de progreso). La aplicación abre y funciona: pone versión 4.2. A mis compañeros de Finanzas les pasa lo mismo.",
      },
    },
    intro: {
      en: "You are on your admin workstation with the Configuration Manager console and its PowerShell module, on the site drive CON:. Application 'Contoso Expenses' (deployment type 'Expenses 4.2 MSI') is deployed as Required to the collection 'Finance - Workstations' (14 devices). On Monday the 4.1 MSI in the source folder was replaced with 4.2 and the content was updated. You can read the client logs of PC-FIN-027 through its admin share.",
      es: "Estás en tu equipo de administración con la consola de Configuration Manager y su módulo de PowerShell, en la unidad del sitio CON:. La aplicación 'Contoso Expenses' (tipo de implementación 'Expenses 4.2 MSI') está desplegada como Requerida a la colección 'Finance - Workstations' (14 equipos). El lunes se sustituyó el MSI 4.1 de la carpeta de origen por el 4.2 y se actualizó el contenido. Puedes leer los logs del cliente de PC-FIN-027 por su recurso administrativo.",
    },
    requester: { name: "David López", team: { en: "Finance", es: "Finanzas" }, user: "dlopez", location: { en: "Head office, 2nd floor", es: "Oficina central, 2ª planta" }, device: "PC-FIN-027" },
    asset: {
      title: { en: "Deployment · Contoso Expenses → Finance - Workstations", es: "Implementación · Contoso Expenses → Finance - Workstations" },
      fields: [
        { label: { en: "Deployment status", es: "Estado de la implementación" }, states: [
          { when: { verified: true }, value: { en: "14 of 14 succeeded", es: "14 de 14 correctas" }, tone: "ok" },
          { value: { en: "14 errors (0x87D00324)", es: "14 errores (0x87D00324)" }, tone: "bad" }] },
        { label: { en: "Detection method", es: "Método de detección" }, states: [
          { when: { dtFixed: true }, value: { en: "MSI product code of 4.2", es: "Código de producto MSI de la 4.2" }, tone: "ok" },
          { when: { discRead: true }, value: { en: "MSI product code of 4.1", es: "Código de producto MSI de la 4.1" }, tone: "bad" },
          { value: { en: "Not reviewed", es: "Sin revisar" }, tone: "muted" }] },
        { label: { en: "Content", es: "Contenido" }, states: [
          { when: { contentRedist: true }, value: { en: "Updated again (2 of 2 DPs)", es: "Actualizado otra vez (2 de 2 DP)" }, tone: "muted" },
          { value: { en: "Distributed (2 of 2 DPs)", es: "Distribuido (2 de 2 DP)" }, tone: "ok" }] },
        { label: { en: "Client policy (PC-FIN-027)", es: "Directiva del cliente (PC-FIN-027)" }, states: [
          { when: { appEval: true }, value: { en: "New revision evaluated", es: "Nueva revisión evaluada" }, tone: "ok" },
          { when: { policy: true }, value: { en: "New revision downloaded", es: "Nueva revisión descargada" }, tone: "muted" },
          { value: { en: "Revision 4", es: "Revisión 4" }, tone: "muted" }] },
      ],
    },
    actions: [
      { id: "update", label: { en: "Update content", es: "Actualizar contenido" }, cmd: "Update-CMDistributionPoint -ApplicationName 'Contoso Expenses' -DeploymentTypeName 'Expenses 4.2 MSI'" },
      { id: "policy", label: { en: "Machine policy on PC-FIN-027", es: "Directiva de equipo en PC-FIN-027" }, cmd: "Invoke-CMClientAction -DeviceName PC-FIN-027 -ActionType ClientNotificationRequestMachinePolicyNow" },
    ],
    codes: ["config-fixed"],
    state: { statusSeen: false, enforceRead: false, discRead: false, codeFound: false, dtChecked: false, contentRedist: false, dtFixed: false, policy: false, appEval: false, verified: false },
    commands: [
      { id: "deploy-ok", match: /^get-cmdeployment(\s|$)/, when: { appEval: true }, set: { verified: true }, out: [
        "",
        "SoftwareName       CollectionName          NumberTargeted NumberSuccess NumberErrors",
        "------------       --------------          -------------- ------------- ------------",
        "Contoso Expenses   Finance - Workstations              14            14            0", ""],
        say: { en: "(After the clients' evaluation cycle and the deployment summarization.) Every device reports the app as installed.",
               es: "(Tras el ciclo de evaluación de los clientes y el resumen de la implementación.) Todos los equipos informan la aplicación como instalada." } },
      { id: "deploy", match: /^get-cmdeployment(\s|$)/, set: { statusSeen: true }, out: [
        "",
        "SoftwareName       CollectionName          NumberTargeted NumberSuccess NumberErrors",
        "------------       --------------          -------------- ------------- ------------",
        "Contoso Expenses   Finance - Workstations              14             0           14", ""],
        say: { en: "All 14 in error. In the console the error is 0x87D00324: the application was not detected after installation completed.",
               es: "Los 14 con error. En la consola el error es 0x87D00324: la aplicación no se detectó después de terminar la instalación." } },
      { id: "enforce-ok", match: /appenforce\.log/, when: { appEval: true }, set: { verified: true, enforceRead: true }, out: [
        "",
        "    Performing detection of app deployment type Expenses 4.2 MSI(ScopeId_6C1F2A0B-93D4-4E6A-B1C7-2F0E8D9A4B31/DeploymentType_4b7e91d2-0c5a-4f13-8e2d-61a9c3f7b505, revision 5) for system.",
        "+++ Application discovered. [AppDT Id: ScopeId_6C1F2A0B-93D4-4E6A-B1C7-2F0E8D9A4B31/DeploymentType_4b7e91d2-0c5a-4f13-8e2d-61a9c3f7b505, Revision: 5]", ""],
        say: { en: "With revision 5 the client detects the app and does not install it again.", es: "Con la revisión 5 el cliente detecta la aplicación y ya no la vuelve a instalar." } },
      { id: "enforce", match: /appenforce\.log/, set: { enforceRead: true }, out: [
        "",
        "+++ Starting Install enforcement for App DT \"Expenses 4.2 MSI\" ApplicationDeliveryType - ScopeId_6C1F2A0B-93D4-4E6A-B1C7-2F0E8D9A4B31/DeploymentType_4b7e91d2-0c5a-4f13-8e2d-61a9c3f7b505, Revision - 4, ContentPath - C:\\Windows\\ccmcache\\1c, Execution Context - System",
        "    Executing Command line: \"C:\\Windows\\system32\\msiexec.exe\" /i \"ContosoExpenses-4.2.0.msi\" /qn /l*v C:\\Windows\\CCM\\Logs\\ContosoExpenses-install.log with system context",
        "    Process 7312 terminated with exitcode: 0",
        "    Looking for exit code 0 in exit codes table...",
        "    Matched exit code 0 to a Success entry in exit codes table.",
        "    Performing detection of app deployment type Expenses 4.2 MSI(ScopeId_6C1F2A0B-93D4-4E6A-B1C7-2F0E8D9A4B31/DeploymentType_4b7e91d2-0c5a-4f13-8e2d-61a9c3f7b505, revision 4) for system.",
        "+++ Application not discovered. [AppDT Id: ScopeId_6C1F2A0B-93D4-4E6A-B1C7-2F0E8D9A4B31/DeploymentType_4b7e91d2-0c5a-4f13-8e2d-61a9c3f7b505, Revision: 4]", ""],
        say: { en: "The installer ends with exit code 0, so content and installation are fine. It fails afterwards, in the detection. AppDiscovery.log says what it looks for.",
               es: "El instalador termina con código 0: el contenido y la instalación están bien. Falla después, en la detección. AppDiscovery.log dice qué busca." } },
      { id: "disc-ok", match: /appdiscovery\.log/, when: { appEval: true }, set: { verified: true, discRead: true }, out: [
        "",
        "    Performing detection of app deployment type Expenses 4.2 MSI(ScopeId_6C1F2A0B-93D4-4E6A-B1C7-2F0E8D9A4B31/DeploymentType_4b7e91d2-0c5a-4f13-8e2d-61a9c3f7b505, revision 5) for system.",
        "+++ Discovered application [AppDT Id: ScopeId_6C1F2A0B-93D4-4E6A-B1C7-2F0E8D9A4B31/DeploymentType_4b7e91d2-0c5a-4f13-8e2d-61a9c3f7b505, Revision: 5]", ""] },
      { id: "disc", match: /appdiscovery\.log/, set: { discRead: true }, out: [
        "",
        "    Performing detection of app deployment type Expenses 4.2 MSI(ScopeId_6C1F2A0B-93D4-4E6A-B1C7-2F0E8D9A4B31/DeploymentType_4b7e91d2-0c5a-4f13-8e2d-61a9c3f7b505, revision 4) for system.",
        "+++ MSI application not discovered [MSI Product Code: {3B6A9E21-41D4-4C11-8E0F-5A1C2D3E4F41}, MSI Product version: ]",
        "+++ Application not discovered. [AppDT Id: ScopeId_6C1F2A0B-93D4-4E6A-B1C7-2F0E8D9A4B31/DeploymentType_4b7e91d2-0c5a-4f13-8e2d-61a9c3f7b505, Revision: 4]", ""],
        say: { en: "The detection looks for product code {3B6A9E21-...-4F41}. Is that the code the 4.2 MSI installs?",
               es: "La detección busca el código de producto {3B6A9E21-...-4F41}. ¿Es el código que instala el MSI 4.2?" } },
      { id: "uninstall", match: /currentversion\\uninstall/, set: { codeFound: true }, out: [
        "",
        "DisplayName      DisplayVersion PSChildName                            PSComputerName",
        "-----------      -------------- -----------                            --------------",
        "Contoso Expenses 4.2.0          {9C2E7F10-42A8-4B3D-9E61-7D2B4A6C8E42} PC-FIN-027", ""],
        say: { en: "4.2 is installed with product code {9C2E7F10-...-8E42}. It is a major upgrade, so the 4.1 code is gone: the detection still looks for 4.1.",
               es: "La 4.2 está instalada con el código de producto {9C2E7F10-...-8E42}. Es una actualización mayor, así que el código de la 4.1 ya no está: la detección sigue buscando la 4.1." } },
      { id: "win32product", match: /win32_product/, set: { codeFound: true }, out: [
        "",
        "IdentifyingNumber : {9C2E7F10-42A8-4B3D-9E61-7D2B4A6C8E42}",
        "Name              : Contoso Expenses",
        "Vendor            : Contoso",
        "Version           : 4.2.0",
        "Caption           : Contoso Expenses", ""],
        say: { en: "It gives the product code, but querying Win32_Product makes Windows Installer check every MSI on the machine. The Uninstall registry key is faster and safer.",
               es: "Da el código de producto, pero consultar Win32_Product hace que Windows Installer revise todos los MSI del equipo. La clave Uninstall del registro es más rápida y segura." } },
      { id: "dt-ok", match: /^get-cmdeploymenttype\b/, when: { dtFixed: true }, set: { dtChecked: true }, out: [
        "",
        "LocalizedDisplayName : Expenses 4.2 MSI",
        "Technology           : MSI",
        "CIVersion            : 5",
        "SDMPackageXML        : ...<EnhancedDetectionMethod>...<ProductCode>{9C2E7F10-42A8-4B3D-9E61-7D2B4A6C8E42}</ProductCode>...", ""] },
      { id: "dt", match: /^get-cmdeploymenttype\b/, set: { dtChecked: true, discRead: true }, out: [
        "",
        "LocalizedDisplayName : Expenses 4.2 MSI",
        "Technology           : MSI",
        "CIVersion            : 4",
        "SDMPackageXML        : ...<EnhancedDetectionMethod>...<ProductCode>{3B6A9E21-41D4-4C11-8E0F-5A1C2D3E4F41}</ProductCode>...", ""],
        say: { en: "The deployment type still detects the product code of the 4.1 MSI. Replacing the file and updating the content does not change the detection method.",
               es: "El tipo de implementación sigue detectando el código de producto del MSI 4.1. Sustituir el fichero y actualizar el contenido no cambia el método de detección." } },
      { id: "redist", match: /^(update-cmdistributionpoint|invoke-cmcontentredistribution|start-cmcontentdistribution)\b/, set: { contentRedist: true }, out: [""],
        say: { en: "The content is sent to the distribution points again. But the clients already download it and the installer ends with exit code 0: nothing in the detection changes, so the deployment stays in error.",
               es: "El contenido se vuelve a enviar a los puntos de distribución. Pero los clientes ya lo descargan y el instalador termina con código 0: la detección no cambia y la implementación sigue con error." } },
      { id: "set-dt", match: /^set-cmmsideploymenttype\b.*-productcode\s+['"]?\{?9c2e7f10-42a8-4b3d-9e61-7d2b4a6c8e42/, set: { dtFixed: true }, out: [""],
        say: { en: "Detection method updated to the 4.2 product code. The deployment type moves to revision 5; clients get it with their next machine policy.",
               es: "Método de detección actualizado al código de producto de la 4.2. El tipo de implementación pasa a la revisión 5; los clientes la reciben con su siguiente directiva de equipo." } },
      { id: "set-dt-other", match: /^set-cmmsideploymenttype\b/, out: [""],
        say: { en: "Saved, but the detection still does not match the product code that the 4.2 MSI installs on the clients.",
               es: "Guardado, pero la detección sigue sin coincidir con el código de producto que el MSI 4.2 instala en los clientes." } },
      { id: "policy", match: /(machinepolicynow|requestmachinepolicy|0{8}-0{4}-0{4}-0{4}-0{10}21\b)/, when: { dtFixed: true }, set: { policy: true }, out: [""],
        say: { en: "Machine policy requested: the client downloads revision 5 of the deployment type.", es: "Directiva de equipo solicitada: el cliente descarga la revisión 5 del tipo de implementación." } },
      { id: "policy-early", match: /(machinepolicynow|requestmachinepolicy|0{8}-0{4}-0{4}-0{4}-0{10}21\b)/, out: [""],
        say: { en: "Machine policy requested, but nothing has changed in the deployment type yet: the client gets the same revision 4.",
               es: "Directiva de equipo solicitada, pero aún no ha cambiado nada en el tipo de implementación: el cliente recibe la misma revisión 4." } },
      { id: "eval", match: /(appdepleval|0{8}-0{4}-0{4}-0{4}-0{9}121\b)/, when: { policy: true }, set: { appEval: true }, out: [""],
        say: { en: "Application deployment evaluation started with revision 5.", es: "Evaluación de implementaciones de aplicaciones iniciada con la revisión 5." } },
      { id: "eval-old", match: /(appdepleval|0{8}-0{4}-0{4}-0{4}-0{9}121\b)/, when: { dtFixed: true }, out: [""],
        say: { en: "The client evaluates again with revision 4, the one it has: it has not downloaded the new policy yet.",
               es: "El cliente vuelve a evaluar con la revisión 4, la que tiene: aún no ha descargado la directiva nueva." } },
      { id: "eval-early", match: /(appdepleval|0{8}-0{4}-0{4}-0{4}-0{9}121\b)/, out: [""],
        say: { en: "The client installs the app again (exit code 0) and again does not detect it. Same result as every night.",
               es: "El cliente vuelve a instalar la aplicación (código 0) y otra vez no la detecta. El mismo resultado que cada noche." } },
    ],
    goal: { dtFixed: true, policy: true, appEval: true, verified: true },
    stages: [
      { id: "investigate", label: { en: "Find why the client does not detect the app", es: "Encontrar por qué el cliente no detecta la aplicación" }, when: { discRead: true, codeFound: true } },
      { id: "fix", label: { en: "Correct the detection method and re-evaluate", es: "Corregir el método de detección y volver a evaluar" }, when: { dtFixed: true, policy: true, appEval: true } },
      { id: "verify", label: { en: "Check the deployment reports success", es: "Comprobar que la implementación informa correcto" }, when: { verified: true } },
    ],
    resolved: { en: "Resolved: the clients detect Contoso Expenses 4.2 and the deployment is green. Now write the work note.",
                es: "Resuelto: los clientes detectan Contoso Expenses 4.2 y la implementación está en verde. Ahora escribe la nota de trabajo." },
    hints: [
      { en: "Look at the deployment (Get-CMDeployment -SoftwareName 'Contoso Expenses'), then at the client: Get-Content \\\\PC-FIN-027\\c$\\Windows\\CCM\\Logs\\AppEnforce.log -Tail 20",
        es: "Mira la implementación (Get-CMDeployment -SoftwareName 'Contoso Expenses') y después el cliente: Get-Content \\\\PC-FIN-027\\c$\\Windows\\CCM\\Logs\\AppEnforce.log -Tail 20" },
      { en: "AppDiscovery.log (same folder) says what the detection looks for. Compare it with what is installed: Invoke-Command -ComputerName PC-FIN-027 { Get-ItemProperty HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | ? DisplayName -like 'Contoso Expenses*' | Select DisplayName, DisplayVersion, PSChildName }",
        es: "AppDiscovery.log (misma carpeta) dice qué busca la detección. Compáralo con lo instalado: Invoke-Command -ComputerName PC-FIN-027 { Get-ItemProperty HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | ? DisplayName -like 'Contoso Expenses*' | Select DisplayName, DisplayVersion, PSChildName }" },
      { en: "Set the 4.2 product code on the deployment type: Set-CMMsiDeploymentType -ApplicationName 'Contoso Expenses' -DeploymentTypeName 'Expenses 4.2 MSI' -ProductCode '{9C2E7F10-42A8-4B3D-9E61-7D2B4A6C8E42}'",
        es: "Pon el código de producto de la 4.2 en el tipo de implementación: Set-CMMsiDeploymentType -ApplicationName 'Contoso Expenses' -DeploymentTypeName 'Expenses 4.2 MSI' -ProductCode '{9C2E7F10-42A8-4B3D-9E61-7D2B4A6C8E42}'" },
      { en: "First machine policy, then the application deployment evaluation: Invoke-CMClientAction -CollectionName 'Finance - Workstations' -ActionType ClientNotificationRequestMachinePolicyNow, then ClientNotificationAppDeplEvalNow. Check Get-CMDeployment again.",
        es: "Primero la directiva de equipo y después la evaluación de implementaciones: Invoke-CMClientAction -CollectionName 'Finance - Workstations' -ActionType ClientNotificationRequestMachinePolicyNow, y luego ClientNotificationAppDeplEvalNow. Vuelve a mirar Get-CMDeployment." },
    ],
    note: [
      { kb: "cause", label: { en: "the cause (detection still looked for the 4.1 product code)", es: "la causa (la detección seguía buscando el código de producto de la 4.1)" },
        any: ["product code", "codigo de producto", "detection method", "metodo de deteccion", "0x87d00324", "not detected", "no se detectaba"] },
      { kb: "fix", label: { en: "the fix (detection updated, policy and evaluation triggered)", es: "la solución (detección actualizada, directiva y evaluación lanzadas)" },
        any: ["set-cmmsideploymenttype", "-productcode", "updated the detection", "actualice la deteccion", "machine policy", "directiva de equipo"] },
      { kb: "verify", label: { en: "how you checked it", es: "cómo lo comprobaste" }, any: ["14 of 14", "14 de 14", "succeeded", "correctas", "discovered"] },
      { kb: "followup", label: { en: "the follow-up (packaging checklist for new MSI versions)", es: "el seguimiento (lista de empaquetado para versiones nuevas de un MSI)" },
        any: ["checklist", "lista de", "packaging", "empaquetado", "procedure", "procedimiento", "new version", "version nueva"] },
    ],
    solution: [
      "Get-CMDeployment -SoftwareName 'Contoso Expenses'",
      "Get-Content \\\\PC-FIN-027\\c$\\Windows\\CCM\\Logs\\AppEnforce.log -Tail 20",
      "Get-Content \\\\PC-FIN-027\\c$\\Windows\\CCM\\Logs\\AppDiscovery.log -Tail 20",
      "Invoke-Command -ComputerName PC-FIN-027 { Get-ItemProperty HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | ? DisplayName -like 'Contoso Expenses*' | Select DisplayName, DisplayVersion, PSChildName }",
      "Set-CMMsiDeploymentType -ApplicationName 'Contoso Expenses' -DeploymentTypeName 'Expenses 4.2 MSI' -ProductCode '{9C2E7F10-42A8-4B3D-9E61-7D2B4A6C8E42}'",
      "Invoke-CMClientAction -CollectionName 'Finance - Workstations' -ActionType ClientNotificationRequestMachinePolicyNow",
      "Invoke-CMClientAction -CollectionName 'Finance - Workstations' -ActionType ClientNotificationAppDeplEvalNow",
      "Get-CMDeployment -SoftwareName 'Contoso Expenses'",
    ],
    sampleNote: {
      en: "Contoso Expenses showed 14 errors (0x87D00324) although 4.2 was installed and the installer ended with exit code 0. AppDiscovery.log showed the detection method still looked for the product code of 4.1; the 4.2 MSI installs {9C2E7F10-42A8-4B3D-9E61-7D2B4A6C8E42}. Set it with Set-CMMsiDeploymentType -ProductCode, then triggered machine policy and the application deployment evaluation on the collection. Get-CMDeployment shows 14 of 14 succeeded. Added a packaging checklist step: when an MSI gets a new version, review the detection.",
      es: "Contoso Expenses mostraba 14 errores (0x87D00324) aunque la 4.2 estaba instalada y el instalador terminaba con código 0. AppDiscovery.log mostró que el método de detección seguía buscando el código de producto de la 4.1; el MSI 4.2 instala {9C2E7F10-42A8-4B3D-9E61-7D2B4A6C8E42}. Lo puse con Set-CMMsiDeploymentType -ProductCode y lancé la directiva de equipo y la evaluación de implementaciones en la colección. Get-CMDeployment muestra 14 de 14 correctas. Añadí un paso a la lista de empaquetado: cuando un MSI tenga versión nueva, revisar la detección.",
    },
  });

  /* ------------------------------------------------------------------ 13. Web app down, /var full */
  scenarios.push({
    id: "rhel-var-full",
    level: 2,
    topic: { en: "Red Hat Enterprise Linux", es: "Red Hat Enterprise Linux" },
    minutes: 20,
    title: { en: "502 Bad Gateway: the timesheets app is down", es: "502 Bad Gateway: la aplicación de fichajes no funciona" },
    guide: GUIDE + "rhel-registrar-parchear-servicios-firewall-selinux.html",
    machine: { host: "app-lnx01", user: "root", domain: "contoso.local", shell: "bash", prompt: "[root@app-lnx01 ~]# " },
    ticket: {
      id: "INC-20513", from: "Elena Romero (Marketing)", priority: "P2",
      subject: { en: "Timesheets shows '502 Bad Gateway'", es: "Fichajes muestra '502 Bad Gateway'" },
      body: {
        en: "Since about 8:15 the timesheets site (https://timesheets.contoso.local) shows '502 Bad Gateway'. It is month end and the whole Marketing team has to submit hours today. Colleagues in other departments see the same.",
        es: "Desde las 8:15 más o menos la web de fichajes (https://timesheets.contoso.local) muestra '502 Bad Gateway'. Es fin de mes y todo Marketing tiene que enviar las horas hoy. A compañeros de otros departamentos les pasa lo mismo.",
      },
    },
    intro: {
      en: "You are on app-lnx01 (RHEL 9, 10.20.1.40) by SSH, as root. nginx listens on 443 and passes requests to the app, timesheets.service (gunicorn on 127.0.0.1:8000). /var is its own 20 GB logical volume.",
      es: "Estás en app-lnx01 (RHEL 9, 10.20.1.40) por SSH, como root. nginx escucha en el 443 y pasa las peticiones a la aplicación, timesheets.service (gunicorn en 127.0.0.1:8000). /var es un volumen lógico propio de 20 GB.",
    },
    requester: { name: "Elena Romero", team: { en: "Marketing", es: "Marketing" }, user: "eromero", location: { en: "Head office, 1st floor", es: "Oficina central, 1ª planta" }, device: "LAPTOP-0251" },
    asset: {
      title: { en: "Server · app-lnx01 (timesheets)", es: "Servidor · app-lnx01 (fichajes)" },
      fields: [
        { label: "/var", states: [
          { when: { freed: true }, value: { en: "33% used (6.4 of 20 GB)", es: "33% usado (6,4 de 20 GB)" }, tone: "ok" },
          { when: { rmHeld: true }, value: { en: "100% used (file deleted, space still held)", es: "100% usado (fichero borrado, espacio aún retenido)" }, tone: "bad" },
          { value: { en: "100% used", es: "100% usado" }, tone: "bad" }] },
        { label: "timesheets.service", states: [
          { when: { svcUp: true }, value: "active (running)", tone: "ok" },
          { value: "failed", tone: "bad" }] },
        { label: { en: "Rotation of access.log", es: "Rotación de access.log" }, states: [
          { when: { rotateFixed: true }, value: { en: "Daily, 14 kept", es: "Diaria, se guardan 14" }, tone: "ok" },
          { when: { rotateSeen: true }, value: { en: "Never rotated (wrong path in the config)", es: "Nunca rotado (ruta incorrecta en la configuración)" }, tone: "bad" },
          { value: { en: "Not reviewed", es: "Sin revisar" }, tone: "muted" }] },
        { label: { en: "Web (https://timesheets.contoso.local)", es: "Web (https://timesheets.contoso.local)" }, states: [
          { when: { svcUp: true }, value: "200 OK", tone: "ok" },
          { value: "502 Bad Gateway", tone: "bad" }] },
      ],
    },
    actions: [
      { id: "restart", label: { en: "Restart timesheets.service", es: "Reiniciar timesheets.service" }, cmd: "systemctl restart timesheets" },
      { id: "df", label: { en: "Disk usage", es: "Uso de disco" }, cmd: "df -h" },
    ],
    codes: ["capacity", "cause-removed"],
    state: { dfSeen: false, svcSeen: false, foundLog: false, rmHeld: false, vacuumed: false, freed: false, rotateSeen: false, rotateFixed: false, svcUp: false, verified: false },
    commands: [
      { id: "df-ok", match: /^(sudo )?df\b/, when: { freed: true }, set: { dfSeen: true }, out: [
        "Filesystem             Size  Used Avail Use% Mounted on",
        "/dev/mapper/rhel-root   30G  6.1G   24G  21% /",
        "/dev/mapper/rhel-var    20G  6.4G   14G  33% /var",
        "/dev/sda1              960M  301M  660M  32% /boot", ""] },
      { id: "df-held", match: /^(sudo )?df\b/, when: { rmHeld: true }, set: { dfSeen: true }, out: [
        "Filesystem             Size  Used Avail Use% Mounted on",
        "/dev/mapper/rhel-root   30G  6.1G   24G  21% /",
        "/dev/mapper/rhel-var    20G   20G     0 100% /var",
        "/dev/sda1              960M  301M  660M  32% /boot", ""],
        say: { en: "Still 100%. The file is gone from the folder, but its space is not back.", es: "Sigue al 100%. El fichero ya no está en la carpeta, pero su espacio no ha vuelto." } },
      { id: "df-vac", match: /^(sudo )?df\b/, when: { vacuumed: true }, set: { dfSeen: true }, out: [
        "Filesystem             Size  Used Avail Use% Mounted on",
        "/dev/mapper/rhel-root   30G  6.1G   24G  21% /",
        "/dev/mapper/rhel-var    20G   19G  1.7G  92% /var",
        "/dev/sda1              960M  301M  660M  32% /boot", ""] },
      { id: "df", match: /^(sudo )?df\b/, set: { dfSeen: true }, out: [
        "Filesystem             Size  Used Avail Use% Mounted on",
        "/dev/mapper/rhel-root   30G  6.1G   24G  21% /",
        "/dev/mapper/rhel-var    20G   20G     0 100% /var",
        "/dev/sda1              960M  301M  660M  32% /boot", ""],
        say: { en: "/var is full.", es: "/var está lleno." } },
      { id: "du-log", match: /^(sudo )?du\b.*\/var\/log/, when: { freed: false }, set: { foundLog: true }, out: [
        "8.0M    /var/log/nginx",
        "1.9G    /var/log/journal",
        "14G     /var/log/timesheets",
        "16G     /var/log", ""],
        say: { en: "14 GB in /var/log/timesheets.", es: "14 GB en /var/log/timesheets." } },
      { id: "du-log-ok", match: /^(sudo )?du\b.*\/var\/log/, out: ["8.0M    /var/log/nginx", "1.9G    /var/log/journal", "4.0K    /var/log/timesheets", "2.0G    /var/log", ""] },
      { id: "du", match: /^(sudo )?du\b.*\/var/, when: { freed: false }, out: ["12M     /var/cache", "1.6G    /var/lib", "16G     /var/log", "18G     /var", ""],
        say: { en: "Almost everything is under /var/log. Look one level deeper.", es: "Casi todo está en /var/log. Mira un nivel más abajo." } },
      { id: "du-ok", match: /^(sudo )?du\b.*\/var/, out: ["12M     /var/cache", "1.6G    /var/lib", "2.0G    /var/log", "3.7G    /var", ""] },
      { id: "ls-held", match: /^(sudo )?ls\b.*\/var\/log\/timesheets/, when: { rmHeld: true, freed: false }, out: [
        "total 2.2M", "-rw-r--r--. 1 nginx nginx 2.1M Oct 28 08:14 error.log", ""] },
      { id: "ls-ok", match: /^(sudo )?ls\b.*\/var\/log\/timesheets/, when: { freed: true }, out: [
        "total 2.2M", "-rw-r--r--. 1 nginx nginx 1.4K Oct 28 10:21 access.log", "-rw-r--r--. 1 nginx nginx 2.1M Oct 28 08:14 error.log", ""] },
      { id: "ls", match: /^(sudo )?ls\b.*\/var\/log\/timesheets/, set: { foundLog: true }, out: [
        "total 14G", "-rw-r--r--. 1 nginx nginx  14G Oct 28 10:02 access.log", "-rw-r--r--. 1 nginx nginx 2.1M Oct 28 08:14 error.log", ""],
        say: { en: "access.log is nginx's access log for this site: 14 GB since the server was built in March. The load balancer's health check alone writes a line every two seconds.",
               es: "access.log es el log de accesos de nginx para esta web: 14 GB desde que se montó el servidor en marzo. Solo el health check del balanceador escribe una línea cada dos segundos." } },
      { id: "status-ok", match: /^(sudo )?systemctl\s+status\b.*timesheets/, when: { svcUp: true }, set: { svcSeen: true }, out: [
        "● timesheets.service - Contoso Timesheets (gunicorn)",
        "     Loaded: loaded (/etc/systemd/system/timesheets.service; enabled; preset: disabled)",
        "     Active: active (running) since Wed 2026-10-28 10:24:51 CET; 12s ago",
        "   Main PID: 6412 (gunicorn)", ""] },
      { id: "status", match: /^(sudo )?systemctl\s+status\b.*timesheets/, set: { svcSeen: true }, out: [
        "× timesheets.service - Contoso Timesheets (gunicorn)",
        "     Loaded: loaded (/etc/systemd/system/timesheets.service; enabled; preset: disabled)",
        "     Active: failed (Result: exit-code) since Wed 2026-10-28 08:14:03 CET; 2h 3min ago",
        "    Process: 4121 ExecStart=/opt/timesheets/venv/bin/gunicorn --bind 127.0.0.1:8000 timesheets.wsgi (code=exited, status=1/FAILURE)",
        "   Main PID: 4121 (code=exited, status=1/FAILURE)",
        "        CPU: 412ms", ""],
        say: { en: "The app is down, so nginx has nobody to pass requests to: that is the 502.", es: "La aplicación está caída y nginx no tiene a quién pasar las peticiones: ese es el 502." } },
      { id: "nginx-status", match: /^(sudo )?systemctl\s+status\b.*nginx/, out: [
        "● nginx.service - The nginx HTTP and reverse proxy server",
        "     Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled; preset: disabled)",
        "     Active: active (running) since Mon 2026-10-05 07:02:11 CEST; 3 weeks 2 days ago",
        "   Main PID: 1187 (nginx)", ""] },
      { id: "journal-u", match: /^(sudo )?journalctl\b.*(-u|--unit)[\s=]*timesheets/, set: { svcSeen: true }, out: [
        "Oct 28 08:14:02 app-lnx01 gunicorn[4121]: [2026-10-28 08:14:02 +0100] [4121] [ERROR] Exception in worker process",
        "Oct 28 08:14:02 app-lnx01 gunicorn[4121]: OSError: [Errno 28] No space left on device: '/var/lib/timesheets/sessions/sess_8f2c1a'",
        "Oct 28 08:14:03 app-lnx01 systemd[1]: timesheets.service: Main process exited, code=exited, status=1/FAILURE",
        "Oct 28 08:14:03 app-lnx01 systemd[1]: timesheets.service: Failed with result 'exit-code'.",
        "Oct 28 08:14:03 app-lnx01 systemd[1]: timesheets.service: Start request repeated too quickly.", ""],
        say: { en: "Errno 28: the app cannot write its session files because there is no space left.", es: "Errno 28: la aplicación no puede escribir sus ficheros de sesión porque no queda espacio." } },
      { id: "vacuum", match: /^(sudo )?journalctl\b.*--vacuum-(size|time|files)/, unless: { vacuumed: true }, set: { vacuumed: true }, out: [
        "Vacuuming done, freed 1.7G of archived journals from /var/log/journal/3f9a1c2e8b7d4e6fa0c5b1d2e3f4a5b6.", ""],
        say: { en: "1.7 GB back. It helps for a day: access.log keeps growing about 1 GB every two weeks and nobody rotates it.",
               es: "1,7 GB recuperados. Ayuda un día: access.log sigue creciendo cerca de 1 GB cada dos semanas y nadie lo rota." } },
      { id: "vacuum-again", match: /^(sudo )?journalctl\b.*--vacuum-(size|time|files)/, out: ["Vacuuming done, freed 0B of archived journals from /var/log/journal/3f9a1c2e8b7d4e6fa0c5b1d2e3f4a5b6.", ""] },
      { id: "rm", match: /^(sudo )?rm\b.*\/var\/log\/timesheets\/(access\.log|\*)/, unless: { freed: true }, set: { rmHeld: true, foundLog: true }, out: [""] },
      { id: "lsof-held", match: /^(sudo )?lsof\b.*(\+l1|deleted)/, when: { rmHeld: true, freed: false }, out: [
        "COMMAND  PID  USER   FD   TYPE DEVICE    SIZE/OFF NLINK    NODE NAME",
        "nginx   1188 nginx    5w   REG  253,2 14602113024     0 1048611 /var/log/timesheets/access.log (deleted)",
        "nginx   1189 nginx    5w   REG  253,2 14602113024     0 1048611 /var/log/timesheets/access.log (deleted)", ""],
        say: { en: "The nginx workers still have the deleted file open, so its 14 GB are not released until they close it.",
               es: "Los workers de nginx siguen teniendo abierto el fichero borrado, así que sus 14 GB no se liberan hasta que lo cierren." } },
      { id: "lsof", match: /^(sudo )?lsof\b/, out: [""] },
      { id: "reopen", match: /^(sudo )?(systemctl\s+(reload|restart)\s+nginx|nginx\s+-s\s+(reopen|reload)|kill\s+-usr1\b.*nginx)/, when: { rmHeld: true, freed: false }, set: { freed: true }, out: [""],
        say: { en: "nginx reopens its log files: the deleted one is released (14 GB back) and a new, empty access.log is created.",
               es: "nginx reabre sus logs: suelta el fichero borrado (14 GB recuperados) y crea un access.log nuevo y vacío." } },
      { id: "nginx-other", match: /^(sudo )?(systemctl\s+(reload|restart)\s+nginx|nginx\s+-s\s+(reopen|reload)|kill\s+-usr1\b.*nginx)/, out: [""],
        say: { en: "nginx reloaded. That is not what is broken: it runs fine and answers 502 because the app is down.",
               es: "nginx recargado. No es lo que falla: funciona bien y responde 502 porque la aplicación está caída." } },
      { id: "truncate-held", match: /^(sudo )?(truncate\b.*-s\s*0\b.*access\.log|:?\s*>\s*\/var\/log\/timesheets\/access\.log|cat\s+\/dev\/null\s*>.*access\.log)/, when: { rmHeld: true, freed: false }, out: [""],
        say: { en: "That creates a new empty file with the same name. nginx still writes to the deleted one, which keeps its 14 GB.",
               es: "Eso crea un fichero nuevo y vacío con el mismo nombre. nginx sigue escribiendo en el borrado, que conserva sus 14 GB." } },
      { id: "truncate", match: /^(sudo )?(truncate\b.*-s\s*0\b.*access\.log|:?\s*>\s*\/var\/log\/timesheets\/access\.log|cat\s+\/dev\/null\s*>.*access\.log)/, set: { freed: true, foundLog: true }, out: [""],
        say: { en: "access.log emptied in place: nginx keeps writing to the same file and the 14 GB are free at once.",
               es: "access.log vaciado sin borrarlo: nginx sigue escribiendo en el mismo fichero y los 14 GB quedan libres al momento." } },
      { id: "ls-rotate", match: /^(sudo )?ls\b.*\/etc\/logrotate\.d/, out: ["chrony  dnf  firewalld  nginx  sssd  timesheets  wpa_supplicant", ""] },
      { id: "cat-rotate-ok", match: /^(sudo )?(cat|less|more|head)\b.*\/etc\/logrotate\.d\/timesheets/, when: { rotateFixed: true }, set: { rotateSeen: true }, out: [
        "/var/log/timesheets/*.log {", "    daily", "    rotate 14", "    compress", "    delaycompress", "    missingok", "    notifempty", "    sharedscripts",
        "    postrotate", "        /bin/kill -USR1 $(cat /run/nginx.pid 2>/dev/null) 2>/dev/null || true", "    endscript", "}", ""] },
      { id: "cat-rotate", match: /^(sudo )?(cat|less|more|head)\b.*\/etc\/logrotate\.d\/timesheets/, set: { rotateSeen: true }, out: [
        "/var/log/timesheet/*.log {", "    daily", "    rotate 14", "    compress", "    delaycompress", "    missingok", "    notifempty", "    sharedscripts",
        "    postrotate", "        /bin/kill -USR1 $(cat /run/nginx.pid 2>/dev/null) 2>/dev/null || true", "    endscript", "}", ""],
        say: { en: "Look at the first line: /var/log/timesheet (without the s). With missingok, logrotate skips the missing folder every night without an error.",
               es: "Mira la primera línea: /var/log/timesheet (sin la s). Con missingok, logrotate se salta cada noche la carpeta que no existe sin dar error." } },
      { id: "debug-ok", match: /^(sudo )?logrotate\b.*(-d|--debug)\b.*timesheets/, when: { rotateFixed: true }, set: { rotateSeen: true }, out: [
        "reading config file /etc/logrotate.d/timesheets", "Handling 1 logs", "",
        "rotating pattern: /var/log/timesheets/*.log  after 1 days empty log files are not rotated, (14 rotations), old logs are removed",
        "considering log /var/log/timesheets/access.log", "considering log /var/log/timesheets/error.log", ""],
        say: { en: "logrotate now finds both log files.", es: "logrotate ya encuentra los dos ficheros de log." } },
      { id: "debug", match: /^(sudo )?logrotate\b.*(-d|--debug)\b.*timesheets/, set: { rotateSeen: true }, out: [
        "reading config file /etc/logrotate.d/timesheets", "Handling 1 logs", "",
        "rotating pattern: /var/log/timesheet/*.log  after 1 days empty log files are not rotated, (14 rotations), old logs are removed",
        "considering log /var/log/timesheet/*.log", "  log /var/log/timesheet/*.log does not exist -- skipping", ""],
        say: { en: "The pattern points to a folder that does not exist, so nothing has ever been rotated.", es: "El patrón apunta a una carpeta que no existe, así que nunca se ha rotado nada." } },
      { id: "edit", match: /^(sudo )?(vi|vim|nano|emacs)\b/, out: [""],
        say: { en: "There is no interactive editor in this simulation. Change the line with sed -i.", es: "En esta simulación no hay editor interactivo. Cambia la línea con sed -i." } },
      { id: "sed", match: /^(sudo )?sed\s+-i\b.*timesheets.*\/etc\/logrotate\.d\/timesheets/, set: { rotateFixed: true, rotateSeen: true }, out: [""],
        say: { en: "Path corrected in /etc/logrotate.d/timesheets.", es: "Ruta corregida en /etc/logrotate.d/timesheets." } },
      { id: "restart-early", match: /^(sudo )?systemctl\s+(restart|start)\s+timesheets/, when: { freed: false, vacuumed: false }, error: true, out: [
        "Job for timesheets.service failed because the control process exited with error code.",
        "See \"systemctl status timesheets.service\" and \"journalctl -xeu timesheets.service\" for details.", ""],
        say: { en: "It fails again in a second: with /var full the app still cannot write.", es: "Vuelve a fallar en un segundo: con /var lleno la aplicación sigue sin poder escribir." } },
      { id: "restart", match: /^(sudo )?systemctl\s+(restart|start)\s+timesheets/, set: { svcUp: true }, out: [""] },
      { id: "curl-ok", match: /^curl\b.*(localhost|127\.0\.0\.1|timesheets)/, when: { svcUp: true, rotateFixed: true }, set: { verified: true }, out: [
        "HTTP/1.1 200 OK", "Server: nginx/1.20.1", "Date: Wed, 28 Oct 2026 09:25:40 GMT", "Content-Type: text/html; charset=utf-8", ""],
        say: { en: "The app answers. Elena confirms she can submit her hours.", es: "La aplicación responde. Elena confirma que puede enviar sus horas." } },
      { id: "curl-up", match: /^curl\b.*(localhost|127\.0\.0\.1|timesheets)/, when: { svcUp: true }, out: [
        "HTTP/1.1 200 OK", "Server: nginx/1.20.1", "Content-Type: text/html; charset=utf-8", ""],
        say: { en: "It answers for now, but nothing rotates access.log: /var will fill up again.", es: "De momento responde, pero nada rota access.log: /var se volverá a llenar." } },
      { id: "curl-bad", match: /^curl\b.*(localhost|127\.0\.0\.1|timesheets)/, out: [
        "HTTP/1.1 502 Bad Gateway", "Server: nginx/1.20.1", "Content-Type: text/html", ""] },
    ],
    goal: { freed: true, rotateFixed: true, svcUp: true, verified: true },
    stages: [
      { id: "investigate", label: { en: "Find why the app fails and what fills /var", es: "Encontrar por qué falla la aplicación y qué llena /var" }, when: { foundLog: true, rotateSeen: true } },
      { id: "fix", label: { en: "Free the space, fix the rotation and start the app", es: "Liberar el espacio, arreglar la rotación y arrancar la aplicación" }, when: { freed: true, rotateFixed: true, svcUp: true } },
      { id: "verify", label: { en: "Check the site answers", es: "Comprobar que la web responde" }, when: { verified: true } },
    ],
    resolved: { en: "Resolved: timesheets answers and its log will rotate. Now write the work note.", es: "Resuelto: fichajes responde y su log se rotará. Ahora escribe la nota de trabajo." },
    hints: [
      { en: "Why did the app stop? systemctl status timesheets and journalctl -u timesheets -n 20. Then df -h.", es: "¿Por qué se ha parado la aplicación? systemctl status timesheets y journalctl -u timesheets -n 20. Después df -h." },
      { en: "Find what fills /var: du -xh --max-depth=1 /var/log | sort -h, then ls -lh /var/log/timesheets", es: "Busca qué llena /var: du -xh --max-depth=1 /var/log | sort -h, y luego ls -lh /var/log/timesheets" },
      { en: "nginx has access.log open: empty it in place with truncate -s 0 /var/log/timesheets/access.log (rm would not free the space). Then cat /etc/logrotate.d/timesheets.",
        es: "nginx tiene access.log abierto: vacíalo sin borrarlo con truncate -s 0 /var/log/timesheets/access.log (rm no liberaría el espacio). Después cat /etc/logrotate.d/timesheets." },
      { en: "Fix the path (sed -i 's#/var/log/timesheet/#/var/log/timesheets/#' /etc/logrotate.d/timesheets), check it with logrotate -d /etc/logrotate.d/timesheets, then systemctl restart timesheets and curl -I https://timesheets.contoso.local",
        es: "Corrige la ruta (sed -i 's#/var/log/timesheet/#/var/log/timesheets/#' /etc/logrotate.d/timesheets), compruébalo con logrotate -d /etc/logrotate.d/timesheets, y después systemctl restart timesheets y curl -I https://timesheets.contoso.local" },
    ],
    note: [
      { kb: "cause", label: { en: "the cause (/var full by an access.log that was never rotated)", es: "la causa (/var lleno por un access.log que nunca se rotó)" },
        any: ["never rotated", "not rotated", "nunca se roto", "no se rotaba", "wrong path", "ruta incorrecta", "no space left", "errno 28"] },
      { kb: "fix", label: { en: "the fix (log emptied in place, logrotate path corrected, app started)", es: "la solución (log vaciado sin borrarlo, ruta de logrotate corregida, aplicación arrancada)" },
        any: ["truncate", "emptied", "vacie", "corrected", "corregi", "sed -i"] },
      { kb: "verify", label: { en: "how you checked it", es: "cómo lo comprobaste" }, any: ["curl", "200 ok", "logrotate -d", "df -h"] },
      { kb: "followup", label: { en: "the follow-up (disk alert, lower log volume)", es: "el seguimiento (alerta de disco, menos volumen de log)" },
        any: ["alert", "alerta", "monitor", "health check", "health-check", "balanceador", "load balancer"] },
    ],
    solution: [
      "systemctl status timesheets",
      "journalctl -u timesheets -n 20",
      "df -h",
      "du -xh --max-depth=1 /var/log | sort -h",
      "ls -lh /var/log/timesheets",
      "truncate -s 0 /var/log/timesheets/access.log",
      "cat /etc/logrotate.d/timesheets",
      "sed -i 's#/var/log/timesheet/#/var/log/timesheets/#' /etc/logrotate.d/timesheets",
      "logrotate -d /etc/logrotate.d/timesheets",
      "systemctl restart timesheets",
      "curl -I https://timesheets.contoso.local",
    ],
    sampleNote: {
      en: "timesheets.service failed with Errno 28 (no space left on device): /var was at 100% because nginx's /var/log/timesheets/access.log (14 GB) was never rotated. The logrotate file pointed to /var/log/timesheet (wrong path) and missingok hid it. Emptied the log with truncate -s 0, since nginx keeps it open, and corrected the path with sed -i. Started the service; curl gives 200 OK, logrotate -d finds the logs and df -h shows 33%. Proposed a /var disk alert at 85% and logging the load balancer health check less often.",
      es: "timesheets.service fallaba con Errno 28 (no space left on device): /var estaba al 100% porque el /var/log/timesheets/access.log de nginx (14 GB) nunca se rotó. El fichero de logrotate apuntaba a /var/log/timesheet (ruta incorrecta) y missingok lo ocultaba. Vacié el log con truncate -s 0, porque nginx lo mantiene abierto, y corregí la ruta con sed -i. Arranqué el servicio; curl da 200 OK, logrotate -d encuentra los logs y df -h muestra 33%. Propuse una alerta de disco para /var al 85% y registrar menos el health check del balanceador.",
    },
  });

  /* ------------------------------------------------------------------ 14. Published app that never opens */
  scenarios.push({
    id: "citrix-session",
    level: 2,
    topic: { en: "Citrix VDI", es: "Citrix VDI" },
    minutes: 20,
    title: { en: "The CRM in Citrix stays on 'Starting...'", es: "El CRM de Citrix se queda en 'Iniciando...'" },
    guide: GUIDE + "citrix-vdi-publicar-aplicacion-y-sesion-que-no-abre.html",
    machine: { host: "CTX-DDC01", user: "it.admin", domain: "CONTOSO", shell: "powershell", prompt: "PS C:\\Users\\it.admin> " },
    ticket: {
      id: "INC-20514", from: "Pablo Sánchez (Sales)", priority: "P2",
      subject: { en: "Contoso CRM (Citrix) does not open", es: "Contoso CRM (Citrix) no abre" },
      body: {
        en: "Since this morning, when I click Contoso CRM in Citrix Workspace it says 'Starting...' for a minute and then nothing. Yesterday afternoon it froze and I closed the laptop. The service desk already reset Workspace app on my laptop and it is the same. Other people in Sales can open it.",
        es: "Desde esta mañana, cuando pulso Contoso CRM en Citrix Workspace pone 'Iniciando...' un minuto y luego nada. Ayer por la tarde se quedó colgado y cerré el portátil. El service desk ya restableció Workspace app en mi portátil y sigue igual. Otros compañeros de Ventas sí pueden abrirlo.",
      },
    },
    intro: {
      en: "You are on the Delivery Controller CTX-DDC01 in PowerShell with the Citrix Broker SDK. Contoso CRM is published from the delivery group 'Contoso Apps': four multi-session VDAs, CTX-VDA01 to CTX-VDA04. Other users are working on all of them.",
      es: "Estás en el Delivery Controller CTX-DDC01 en PowerShell con el SDK de Citrix Broker. Contoso CRM se publica desde el grupo de entrega 'Contoso Apps': cuatro VDA multisesión, de CTX-VDA01 a CTX-VDA04. Hay otros usuarios trabajando en todos.",
    },
    requester: { name: "Pablo Sánchez", team: { en: "Sales", es: "Ventas" }, user: "psanchez", location: { en: "Head office, Sales area", es: "Oficina central, zona de Ventas" }, device: "LAPTOP-0264" },
    asset: {
      title: { en: "Citrix session · CONTOSO\\psanchez", es: "Sesión de Citrix · CONTOSO\\psanchez" },
      fields: [
        { label: { en: "His session", es: "Su sesión" }, states: [
          { when: { verified: true }, value: { en: "Active on CTX-VDA01", es: "Activa en CTX-VDA01" }, tone: "ok" },
          { when: { sessionGone: true }, value: { en: "Logged off", es: "Cerrada" }, tone: "ok" },
          { value: { en: "Disconnected on CTX-VDA03 since 27/10 18:42", es: "Desconectada en CTX-VDA03 desde el 27/10 18:42" }, tone: "bad" }] },
        { label: { en: "CTX-VDA03 registration", es: "Registro de CTX-VDA03" }, states: [
          { when: { registered: true }, value: { en: "Registered", es: "Registrado" }, tone: "ok" },
          { value: { en: "Unregistered (ContactLost)", es: "No registrado (ContactLost)" }, tone: "bad" }] },
        { label: { en: "CTX-VDA03 maintenance mode", es: "Modo mantenimiento de CTX-VDA03" }, states: [
          { when: { maint: true }, value: { en: "On", es: "Activado" }, tone: "warn" },
          { value: { en: "Off", es: "Desactivado" }, tone: "muted" }] },
        { label: { en: "Contoso CRM launch", es: "Inicio de Contoso CRM" }, states: [
          { when: { verified: true }, value: { en: "Opens", es: "Abre" }, tone: "ok" },
          { value: { en: "Stays on 'Starting...'", es: "Se queda en 'Iniciando...'" }, tone: "bad" }] },
      ],
    },
    actions: [
      { id: "logoff", label: { en: "Log off his session", es: "Cerrar su sesión" }, cmd: "Get-BrokerSession -UserName CONTOSO\\psanchez | Stop-BrokerSession", when: { sessionGone: false } },
      { id: "password", label: { en: "Reset his password", es: "Restablecer su contraseña" }, cmd: "Set-ADAccountPassword psanchez -Reset" },
    ],
    codes: ["cause-removed", "workaround"],
    state: { sessionFound: false, vdaFound: false, logoffTried: false, maint: false, registered: false, sessionGone: false, verified: false },
    commands: [
      { id: "snapin", match: /^(add-pssnapin|asnp)\b.*citrix/, out: [""] },
      { id: "stop", match: /stop-brokersession\b/, when: { registered: true, sessionGone: false }, set: { sessionGone: true }, out: [""],
        say: { en: "The logoff reaches the VDA: the hung session closes.", es: "El cierre de sesión llega al VDA: la sesión colgada se cierra." } },
      { id: "stop-early", match: /stop-brokersession\b/, when: { sessionGone: false }, set: { logoffTried: true, sessionFound: true }, out: [""],
        say: { en: "The command returns, but the session is still there, Disconnected: the controller cannot pass the logoff to a VDA it has lost contact with.",
               es: "El comando termina, pero la sesión sigue ahí, Desconectada: el controlador no puede pasar el cierre a un VDA con el que ha perdido el contacto." } },
      { id: "stop-none", match: /stop-brokersession\b/, out: [""], say: { en: "(No session to log off.)", es: "(No hay sesión que cerrar.)" } },
      { id: "maint-on", match: /^set-brokermachine\b.*-inmaintenancemode(\s+|:)\$?(true|1)\b/, set: { maint: true, vdaFound: true }, out: [""],
        say: { en: "CTX-VDA03 is in maintenance mode: no new sessions land on it, and the users working there keep their sessions.",
               es: "CTX-VDA03 en modo mantenimiento: no recibe sesiones nuevas, y los usuarios que trabajan allí conservan las suyas." } },
      { id: "maint-off", match: /^set-brokermachine\b.*-inmaintenancemode(\s+|:)\$?(false|0)\b/, set: { maint: false }, out: [""],
        say: { en: "Maintenance mode off: CTX-VDA03 takes new sessions again.", es: "Modo mantenimiento desactivado: CTX-VDA03 vuelve a aceptar sesiones nuevas." } },
      { id: "agent-restart", match: /^(?=.*ctx-vda03)(?=.*restart-service)(?=.*(brokeragent|citrix desktop service))/, set: { registered: true, vdaFound: true }, out: [""],
        say: { en: "Citrix Desktop Service restarted on CTX-VDA03. The VDA registers with the controller again in under a minute; the other users' sessions are not touched.",
               es: "Citrix Desktop Service reiniciado en CTX-VDA03. El VDA vuelve a registrarse en el controlador en menos de un minuto; las sesiones de los demás usuarios no se tocan." } },
      { id: "agent-status", match: /^(?=.*ctx-vda03)(?=.*get-service)(?=.*(brokeragent|citrix desktop service))/, when: { registered: false }, out: [
        "", "Status   Name          DisplayName", "------   ----          -----------", "Running  BrokerAgent   Citrix Desktop Service", ""],
        say: { en: "Windows says Running, but the controller lost contact with it yesterday: the service is hung.", es: "Windows dice Running, pero el controlador perdió el contacto ayer: el servicio está colgado." } },
      { id: "agent-ok", match: /^(?=.*ctx-vda03)(?=.*get-service)(?=.*(brokeragent|citrix desktop service))/, out: [
        "", "Status   Name          DisplayName", "------   ----          -----------", "Running  BrokerAgent   Citrix Desktop Service", ""] },
      { id: "reboot", match: /^(restart-computer\b.*ctx-vda03|new-brokerhostingpoweraction\b.*ctx-vda03)/, out: [""],
        say: { en: "Stopped before running it: 11 users are working on CTX-VDA03 and a restart would close their sessions without warning.",
               es: "Lo paras antes de ejecutarlo: hay 11 usuarios trabajando en CTX-VDA03 y un reinicio cerraría sus sesiones sin aviso." } },
      { id: "session-new", match: /^get-brokersession\b/, when: { sessionGone: true, registered: true }, set: { verified: true }, out: [
        "",
        "UserName               : CONTOSO\\psanchez",
        "MachineName            : CONTOSO\\CTX-VDA01",
        "DesktopGroupName       : Contoso Apps",
        "SessionState           : Active",
        "SessionStateChangeTime : 28/10/2026 10:44:18",
        "ApplicationsInUse      : {Contoso CRM}",
        "ClientName             : LAPTOP-0264", ""],
        say: { en: "(Pablo launches Contoso CRM again.) New active session, and the CRM opens.", es: "(Pablo vuelve a abrir Contoso CRM.) Sesión nueva y activa, y el CRM abre." } },
      { id: "session-vda", match: /^get-brokersession\b.*ctx-vda03/, set: { sessionFound: true }, out: [
        "",
        "UserName            MachineName          SessionState  SessionStateChangeTime",
        "--------            -----------          ------------  ----------------------",
        "CONTOSO\\psanchez    CONTOSO\\CTX-VDA03    Disconnected  27/10/2026 18:42:10",
        "CONTOSO\\lnavarro    CONTOSO\\CTX-VDA03    Active        28/10/2026 08:31:55",
        "...                 (10 more Active)", ""] },
      { id: "session", match: /^get-brokersession\b/, set: { sessionFound: true }, out: [
        "",
        "UserName               : CONTOSO\\psanchez",
        "MachineName            : CONTOSO\\CTX-VDA03",
        "DesktopGroupName       : Contoso Apps",
        "SessionState           : Disconnected",
        "SessionStateChangeTime : 27/10/2026 18:42:10",
        "ApplicationsInUse      : {Contoso CRM}",
        "Protocol               : HDX",
        "ClientName             : LAPTOP-0264", ""],
        say: { en: "He still has yesterday's session, disconnected, on CTX-VDA03. Each launch tries to reconnect him to it instead of starting a new one.",
               es: "Sigue teniendo la sesión de ayer, desconectada, en CTX-VDA03. Cada inicio intenta reconectarle a ella en lugar de abrir una nueva." } },
      { id: "machine-ok-true", match: /^get-brokermachine\b/, when: { registered: true, maint: true }, out: [
        "",
        "MachineName              : CONTOSO\\CTX-VDA03",
        "DesktopGroupName         : Contoso Apps",
        "RegistrationState        : Registered",
        "InMaintenanceMode        : True",
        "SessionCount             : 12", ""],
        say: { en: "CTX-VDA03 is registered again.", es: "CTX-VDA03 vuelve a estar registrado." } },
      { id: "machine-ok-false", match: /^get-brokermachine\b/, when: { registered: true, maint: false }, out: [
        "",
        "MachineName              : CONTOSO\\CTX-VDA03",
        "DesktopGroupName         : Contoso Apps",
        "RegistrationState        : Registered",
        "InMaintenanceMode        : False",
        "SessionCount             : 12", ""],
        say: { en: "CTX-VDA03 is registered again.", es: "CTX-VDA03 vuelve a estar registrado." } },
      { id: "machine", match: /^get-brokermachine\b/, set: { vdaFound: true }, out: [
        "",
        "MachineName              : CONTOSO\\CTX-VDA03",
        "DesktopGroupName         : Contoso Apps",
        "RegistrationState        : Unregistered",
        "LastDeregistrationReason : ContactLost",
        "LastDeregistrationTime   : 27/10/2026 18:40:52",
        "InMaintenanceMode        : False",
        "PowerState               : On",
        "SessionCount             : 12", ""],
        say: { en: "CTX-VDA03 lost contact with the controller two minutes before Pablo's session froze. The others (VDA01, 02 and 04) are Registered.",
               es: "CTX-VDA03 perdió el contacto con el controlador dos minutos antes de que se colgara la sesión de Pablo. Los demás (VDA01, 02 y 04) están Registered." } },
      { id: "password", match: /^set-adaccountpassword\b.*psanchez/, out: [""],
        say: { en: "Password reset, and Pablo has a new one to learn. His launch still hangs: the problem is the session on CTX-VDA03, not his credentials.",
               es: "Contraseña restablecida, y Pablo tiene otra que aprender. Su inicio sigue colgándose: el problema es la sesión en CTX-VDA03, no sus credenciales." } },
    ],
    goal: { registered: true, sessionGone: true, maint: false, verified: true },
    stages: [
      { id: "investigate", label: { en: "Find where his session is and why it does not open", es: "Encontrar dónde está su sesión y por qué no abre" }, when: { sessionFound: true, vdaFound: true } },
      { id: "fix", label: { en: "Bring the VDA back and log off the hung session", es: "Recuperar el VDA y cerrar la sesión colgada" }, when: { registered: true, sessionGone: true, maint: false } },
      { id: "verify", label: { en: "Check he gets a new session", es: "Comprobar que obtiene una sesión nueva" }, when: { verified: true } },
    ],
    resolved: { en: "Resolved: Pablo has a new session and the CRM opens. Now write the work note.", es: "Resuelto: Pablo tiene una sesión nueva y el CRM abre. Ahora escribe la nota de trabajo." },
    hints: [
      { en: "Look for his session: Get-BrokerSession -UserName CONTOSO\\psanchez", es: "Busca su sesión: Get-BrokerSession -UserName CONTOSO\\psanchez" },
      { en: "Check the machine it is on: Get-BrokerMachine -MachineName CONTOSO\\CTX-VDA03 (RegistrationState, LastDeregistrationReason)",
        es: "Revisa la máquina en la que está: Get-BrokerMachine -MachineName CONTOSO\\CTX-VDA03 (RegistrationState, LastDeregistrationReason)" },
      { en: "Put it in maintenance mode (Set-BrokerMachine -MachineName CONTOSO\\CTX-VDA03 -InMaintenanceMode $true) and restart its Citrix Desktop Service: Invoke-Command -ComputerName CTX-VDA03 { Restart-Service BrokerAgent }",
        es: "Ponla en modo mantenimiento (Set-BrokerMachine -MachineName CONTOSO\\CTX-VDA03 -InMaintenanceMode $true) y reinicia su Citrix Desktop Service: Invoke-Command -ComputerName CTX-VDA03 { Restart-Service BrokerAgent }" },
      { en: "Once it is Registered, log off the session (Get-BrokerSession -UserName CONTOSO\\psanchez | Stop-BrokerSession), take the VDA out of maintenance mode and check his new session.",
        es: "Cuando esté Registered, cierra la sesión (Get-BrokerSession -UserName CONTOSO\\psanchez | Stop-BrokerSession), saca el VDA del modo mantenimiento y comprueba su sesión nueva." },
    ],
    note: [
      { kb: "cause", label: { en: "the cause (disconnected session on the unregistered CTX-VDA03)", es: "la causa (sesión desconectada en CTX-VDA03, no registrado)" },
        any: ["disconnected", "desconectada", "unregistered", "no registrado", "contactlost", "hung session", "sesion colgada"] },
      { kb: "fix", label: { en: "the fix (Desktop Service restarted, session logged off)", es: "la solución (Desktop Service reiniciado, sesión cerrada)" },
        any: ["restart-service", "restarted", "reinici", "stop-brokersession", "logged off", "cerre la sesion"] },
      { kb: "verify", label: { en: "how you checked it", es: "cómo lo comprobaste" }, any: ["registered again", "registrado de nuevo", "new session", "sesion nueva", "opens", "abre"] },
      { kb: "followup", label: { en: "the follow-up (why the VDA lost contact)", es: "el seguimiento (por qué el VDA perdió el contacto)" },
        any: ["alert", "alerta", "monitor", "investigat", "investig", "event log", "registro de eventos", "why", "por que"] },
    ],
    solution: [
      "Get-BrokerSession -UserName CONTOSO\\psanchez",
      "Get-BrokerMachine -MachineName CONTOSO\\CTX-VDA03",
      "Set-BrokerMachine -MachineName CONTOSO\\CTX-VDA03 -InMaintenanceMode $true",
      "Invoke-Command -ComputerName CTX-VDA03 { Restart-Service BrokerAgent }",
      "Get-BrokerMachine -MachineName CONTOSO\\CTX-VDA03",
      "Get-BrokerSession -UserName CONTOSO\\psanchez | Stop-BrokerSession",
      "Set-BrokerMachine -MachineName CONTOSO\\CTX-VDA03 -InMaintenanceMode $false",
      "Get-BrokerSession -UserName CONTOSO\\psanchez",
    ],
    sampleNote: {
      en: "Every launch tried to reconnect Pablo to yesterday's disconnected session on CTX-VDA03, which was unregistered (ContactLost), so it hung. Put CTX-VDA03 in maintenance mode and restarted its Citrix Desktop Service (BrokerAgent) without touching the other 11 sessions. With the VDA registered again, logged off his session with Stop-BrokerSession and took the VDA out of maintenance mode. He got a new session on CTX-VDA01 and the CRM opens. Asked the Citrix team to investigate why the Desktop Service hung (event log on CTX-VDA03) and to add an alert for unregistered VDAs.",
      es: "Cada inicio intentaba reconectar a Pablo a su sesión desconectada de ayer en CTX-VDA03, que estaba no registrado (ContactLost), y se colgaba. Puse CTX-VDA03 en modo mantenimiento y reinicié su Citrix Desktop Service (BrokerAgent) sin tocar las otras 11 sesiones. Con el VDA registrado de nuevo, cerré la sesión con Stop-BrokerSession y saqué el VDA del modo mantenimiento. Tiene una sesión nueva en CTX-VDA01 y el CRM abre. Pedí al equipo de Citrix que investigue por qué se colgó el Desktop Service (registro de eventos de CTX-VDA03) y que añada una alerta para VDA no registrados.",
    },
  });

  /* ------------------------------------------------------------------ 15. Conditional Access blocks a traveller */
  scenarios.push({
    id: "ca-blocked",
    level: 2,
    topic: { en: "Entra ID / Conditional Access", es: "Entra ID / Acceso condicional" },
    minutes: 20,
    title: { en: "Abroad and locked out of Microsoft 365", es: "De viaje y sin acceso a Microsoft 365" },
    guide: GUIDE + "entra-conditional-access-politicas-base-y-usuario-bloqueado.html",
    machine: { host: "ADM-WS01", user: "it.admin", domain: "CONTOSO", shell: "powershell", prompt: "PS C:\\Users\\it.admin> " },
    ticket: {
      id: "INC-20521", from: "Pablo Sánchez (Sales)", priority: "P2",
      subject: { en: "Outlook and Teams blocked since I landed in Mexico", es: "Outlook y Teams bloqueados desde que aterricé en México" },
      body: {
        en: "I am in Mexico City visiting a customer until 6 November. Since I landed, Outlook and Teams say 'You cannot access this right now'. My password and the Authenticator prompts work. My manager Carlos Martín approved the trip in REQ-7731. User: psanchez@contoso.com.",
        es: "Estoy en Ciudad de México visitando a un cliente hasta el 6 de noviembre. Desde que aterricé, Outlook y Teams dicen 'No puede acceder a esto en este momento'. La contraseña y los avisos de Authenticator funcionan. Mi responsable, Carlos Martín, aprobó el viaje en REQ-7731. Usuario: psanchez@contoso.com.",
      },
    },
    intro: {
      en: "You are on your admin workstation with the Microsoft Graph PowerShell SDK. Conditional Access policies belong to Security and only change through a change request. Travel exceptions follow the procedure: a time-bound assignment to the group CA-Exception-Travel in PIM for Groups, ending when the trip ends, with the request number as justification. You are an owner of that group.",
      es: "Estás en tu equipo de administración con el SDK de Microsoft Graph PowerShell. Las directivas de acceso condicional son de Seguridad y solo cambian con una petición de cambio. Las excepciones por viaje siguen el procedimiento: una asignación con fecha de fin al grupo CA-Exception-Travel en PIM para grupos, que termina con el viaje, con el número de petición como justificación. Eres propietario de ese grupo.",
    },
    requester: { name: "Pablo Sánchez", team: { en: "Sales", es: "Ventas" }, user: "psanchez", location: { en: "Travelling: Mexico City", es: "De viaje: Ciudad de México" }, device: "LAPTOP-0264" },
    asset: {
      title: { en: "Sign-ins · psanchez@contoso.com", es: "Inicios de sesión · psanchez@contoso.com" },
      fields: [
        { label: { en: "Sign-in", es: "Inicio de sesión" }, states: [
          { when: { verified: true }, value: { en: "Allowed (Mexico, MX)", es: "Permitido (México, MX)" }, tone: "ok" },
          { value: { en: "Blocked: error 53003", es: "Bloqueado: error 53003" }, tone: "bad" }] },
        { label: { en: "Blocking policy", es: "Directiva que bloquea" }, states: [
          { when: { policyFound: false }, value: { en: "Not reviewed", es: "Sin revisar" }, tone: "muted" },
          { value: "CA010 - Block outside allowed countries" }] },
        { label: { en: "Travel exception", es: "Excepción por viaje" }, states: [
          { when: { permMember: true }, value: { en: "Permanent member, no end date", es: "Miembro permanente, sin fecha de fin" }, tone: "bad" },
          { when: { assigned: true }, value: { en: "CA-Exception-Travel until 07/11/2026 (PIM)", es: "CA-Exception-Travel hasta el 07/11/2026 (PIM)" }, tone: "ok" },
          { value: { en: "None", es: "Ninguna" }, tone: "warn" }] },
        { label: { en: "Device", es: "Dispositivo" }, value: { en: "LAPTOP-0264 · compliant", es: "LAPTOP-0264 · cumple" } },
      ],
    },
    actions: [
      { id: "signins", label: { en: "Open the sign-in log", es: "Abrir el registro de inicios de sesión" },
        cmd: "Get-MgAuditLogSignIn -Filter \"userPrincipalName eq 'psanchez@contoso.com'\" -Top 5", when: { connected: true } },
      { id: "revoke", label: { en: "Revoke sessions", es: "Revocar sesiones" }, cmd: "Revoke-MgUserSignInSession -UserId psanchez@contoso.com", when: { connected: true } },
    ],
    codes: ["config-fixed", "workaround"],
    state: { connected: false, signinSeen: false, policyFound: false, groupFound: false, params: "none", assigned: false, permMember: false, verified: false },
    commands: [
      { id: "connect", match: /^connect-mggraph\b/, set: { connected: true }, out: ["", "Welcome to Microsoft Graph!", "", "Connected via delegated access using it.admin@contoso.com", ""] },
      { id: "not-connected", match: /^\(?(get|new|update|remove|revoke)-mg/, when: { connected: false }, error: true,
        out: ["Authentication needed. Please call Connect-MgGraph.", ""] },
      { id: "ca-applied", match: /^\(?get-mgauditlogsignin\b.*psanchez.*appliedconditionalaccesspolicies/, when: { assigned: false, permMember: false },
        set: { signinSeen: true, policyFound: true }, out: [
        "", "DisplayName                               Result",
        "-----------                               ------",
        "CA001 - Require MFA for all users         success",
        "CA010 - Block outside allowed countries   failure",
        "CA020 - Require compliant device          success",
        "CA030 - Block legacy authentication       notApplied", ""],
        say: { en: "MFA and the device are fine. The policy that blocks him is the country one: Mexico is not in the allowed countries.",
               es: "El MFA y el dispositivo están bien. La directiva que lo bloquea es la de países: México no está entre los permitidos." } },
      { id: "ca-applied-ok", match: /^\(?get-mgauditlogsignin\b.*psanchez.*appliedconditionalaccesspolicies/, unless: { permMember: true }, set: { verified: true }, out: [
        "", "DisplayName                               Result",
        "-----------                               ------",
        "CA001 - Require MFA for all users         success",
        "CA010 - Block outside allowed countries   notApplied",
        "CA020 - Require compliant device          success",
        "CA030 - Block legacy authentication       notApplied", ""],
        say: { en: "(Pablo signed in again.) CA010 no longer applies to him; MFA and device compliance are still enforced.",
               es: "(Pablo ha vuelto a iniciar sesión.) CA010 ya no se le aplica; el MFA y el cumplimiento del dispositivo se siguen exigiendo." } },
      { id: "signin-blocked", match: /^\(?get-mgauditlogsignin\b/, when: { assigned: false, permMember: false }, set: { signinSeen: true }, out: [
        "",
        "CreatedDateTime         : 28/10/2026 07:12:44",
        "UserPrincipalName       : psanchez@contoso.com",
        "UserId                  : 8b41c7e2-3d5f-4a6b-b2e9-71c0d4f8a925",
        "AppDisplayName          : Microsoft Teams",
        "IpAddress               : 203.0.113.45",
        "Location                : Mexico City, MX",
        "Status                  : 53003 - Access has been blocked by Conditional Access policies.",
        "ConditionalAccessStatus : failure",
        "",
        "CreatedDateTime         : 28/10/2026 07:11:02",
        "AppDisplayName          : Office 365 Exchange Online",
        "Location                : Mexico City, MX",
        "Status                  : 53003 - Access has been blocked by Conditional Access policies.",
        "ConditionalAccessStatus : failure", ""],
        say: { en: "Error 53003 is a Conditional Access block, not a password or MFA problem. The sign-in record also lists which policies applied.",
               es: "El error 53003 es un bloqueo de acceso condicional, no un problema de contraseña ni de MFA. El registro del inicio de sesión también indica qué directivas se aplicaron." } },
      { id: "signin-perm", match: /^\(?get-mgauditlogsignin\b/, when: { permMember: true }, out: [
        "", "CreatedDateTime         : 28/10/2026 09:40:18", "AppDisplayName          : Microsoft Teams", "Location                : Mexico City, MX",
        "Status                  : 0", "ConditionalAccessStatus : success", ""],
        say: { en: "He gets in, but as a permanent member he will skip the country check for good, also after the trip. The procedure asks for an end date.",
               es: "Entra, pero como miembro permanente se saltará la comprobación de país para siempre, también después del viaje. El procedimiento pide una fecha de fin." } },
      { id: "signin-ok", match: /^\(?get-mgauditlogsignin\b/, set: { verified: true }, out: [
        "", "CreatedDateTime         : 28/10/2026 09:40:18", "UserPrincipalName       : psanchez@contoso.com", "AppDisplayName          : Microsoft Teams",
        "IpAddress               : 203.0.113.45", "Location                : Mexico City, MX", "Status                  : 0", "ConditionalAccessStatus : success", ""],
        say: { en: "(You asked Pablo to sign in again; new sign-ins can take a few minutes to show in the log.) Teams and Outlook open.",
               es: "(Le has pedido a Pablo que vuelva a iniciar sesión; los nuevos inicios pueden tardar unos minutos en aparecer en el registro.) Teams y Outlook abren." } },
      { id: "policy-ca010", match: /^get-mgidentityconditionalaccesspolicy\b.*(ca010|-conditionalaccesspolicyid)/, set: { policyFound: true }, out: [
        "",
        "DisplayName      : CA010 - Block outside allowed countries",
        "State            : enabled",
        "Users            : Include: All users  Exclude: CA-Exception-Travel, CA-BreakGlass",
        "Locations        : Include: Any location  Exclude: Allowed countries (ES, PT, FR, GB)",
        "GrantControls    : block", ""],
        say: { en: "The policy already has the approved way out: members of CA-Exception-Travel are excluded.",
               es: "La directiva ya tiene la salida aprobada: los miembros de CA-Exception-Travel quedan excluidos." } },
      { id: "policies", match: /^get-mgidentityconditionalaccesspolicy\b/, out: [
        "", "DisplayName                               State",
        "-----------                               -----",
        "CA001 - Require MFA for all users         enabled",
        "CA010 - Block outside allowed countries   enabled",
        "CA020 - Require compliant device          enabled",
        "CA030 - Block legacy authentication       enabled", ""] },
      { id: "policy-edit", match: /^(update|remove)-mgidentityconditionalaccesspolicy\b/, error: true, out: [
        "Insufficient privileges to complete the operation.",
        "Status: 403 (Forbidden)", "ErrorCode: Authorization_RequestDenied", ""],
        say: { en: "Good that it failed: excluding him from the policy would be permanent and outside the change process. Use the exception group with an end date.",
               es: "Mejor que haya fallado: excluirlo de la directiva sería permanente y fuera del proceso de cambios. Usa el grupo de excepción con fecha de fin." } },
      { id: "group", match: /^get-mggroup\b.*ca-exception-travel/, set: { groupFound: true }, out: [
        "", "DisplayName          Id                                   SecurityEnabled",
        "-----------          --                                   ---------------",
        "CA-Exception-Travel  5f2d8c1e-7a43-4b9e-9c61-2e8f0a7d4b13 True", ""] },
      { id: "user", match: /^get-mguser\b.*psanchez/, out: [
        "", "DisplayName    Id                                   UserPrincipalName", "-----------    --                                   -----------------",
        "Pablo Sánchez  8b41c7e2-3d5f-4a6b-b2e9-71c0d4f8a925 psanchez@contoso.com", ""] },
      { id: "params-end", match: /^\$params\s*=\s*@\{.*member.*(enddatetime|duration)/, set: { params: "ok" }, out: [""] },
      { id: "params-noend", match: /^\$params\s*=\s*@\{.*member/, set: { params: "noend" }, out: [""] },
      { id: "pim-ok", match: /^new-mgidentitygovernanceprivilegedaccessgroupassignmentschedulerequest\b.*-bodyparameter/, when: { params: "ok" }, set: { assigned: true }, out: [
        "", "Id                                   Action      Status      AccessId GroupId",
        "--                                   ------      ------      -------- -------",
        "c7e0a2d4-91b3-4e5f-8d26-0a4b7c9e1f38 adminAssign Provisioned member   5f2d8c1e-7a43-4b9e-9c61-2e8f0a7d4b13", ""],
        say: { en: "Pablo is a member of CA-Exception-Travel until the end date; PIM removes him then without anyone having to remember.",
               es: "Pablo es miembro de CA-Exception-Travel hasta la fecha de fin; PIM lo quitará entonces sin que nadie tenga que acordarse." } },
      { id: "pim-noend", match: /^new-mgidentitygovernanceprivilegedaccessgroupassignmentschedulerequest\b.*-bodyparameter/, when: { params: "noend" }, error: true, out: [
        "The role assignment request failed policy validation: ExpirationRule.",
        "Status: 400 (BadRequest)", ""],
        say: { en: "The PIM settings of this group do not allow permanent assignments. Add an expiration with the end of the trip.",
               es: "La configuración de PIM de este grupo no permite asignaciones permanentes. Añade una expiración con el final del viaje." } },
      { id: "pim-none", match: /^new-mgidentitygovernanceprivilegedaccessgroupassignmentschedulerequest\b/, error: true, out: [
        "New-MgIdentityGovernancePrivilegedAccessGroupAssignmentScheduleRequest : Cannot bind argument to parameter 'BodyParameter' because it is null.", ""] },
      { id: "member-add", match: /^new-mggroupmember\b.*5f2d8c1e/, set: { permMember: true }, out: [""],
        say: { en: "Added as a plain member: no end date, so nothing will remove him after the trip.",
               es: "Añadido como miembro normal: sin fecha de fin, así que nada lo quitará después del viaje." } },
      { id: "member-remove", match: /^remove-mggroupmember(byref)?\b.*5f2d8c1e/, set: { permMember: false }, out: [""],
        say: { en: "Permanent membership removed.", es: "Pertenencia permanente quitada." } },
      { id: "mfa-methods", match: /^get-mguserauthentication\w*method\b/, out: [
        "", "Id                                   AdditionalProperties", "--                                   --------------------",
        "28c10230-6103-485e-b985-444c60001490 #microsoft.graph.passwordAuthenticationMethod",
        "a1f5e7c2-0d4b-4e61-9b2f-3c7a8d5e6f10 #microsoft.graph.microsoftAuthenticatorAuthenticationMethod", ""] },
      { id: "mfa-reset", match: /^(remove-mguserauthentication\w*method|revoke-mgusersigninsession)\b/, out: ["True", ""],
        say: { en: "That does not help: MFA worked, the block comes from the country policy. Now he also has to sign in (or register Authenticator) again from abroad.",
               es: "Eso no ayuda: el MFA funcionaba, el bloqueo viene de la directiva de países. Ahora además tiene que volver a iniciar sesión (o registrar Authenticator) desde el extranjero." } },
    ],
    goal: { assigned: true, permMember: false, verified: true },
    stages: [
      { id: "investigate", label: { en: "Find the policy that blocks the sign-in", es: "Encontrar la directiva que bloquea el inicio de sesión" }, when: { policyFound: true } },
      { id: "fix", label: { en: "Add a time-bound travel exception", es: "Añadir una excepción por viaje con fecha de fin" }, when: { assigned: true, permMember: false } },
      { id: "verify", label: { en: "Check a new sign-in succeeds", es: "Comprobar que un nuevo inicio de sesión funciona" }, when: { verified: true } },
    ],
    resolved: { en: "Resolved: Pablo can sign in from Mexico until the trip ends. Now write the work note.", es: "Resuelto: Pablo puede iniciar sesión desde México hasta que acabe el viaje. Ahora escribe la nota de trabajo." },
    hints: [
      { en: "Connect (Connect-MgGraph -Scopes AuditLog.Read.All,Policy.Read.All,PrivilegedAssignmentSchedule.ReadWrite.AzureADGroup) and read his sign-ins: Get-MgAuditLogSignIn -Filter \"userPrincipalName eq 'psanchez@contoso.com'\" -Top 5",
        es: "Conéctate (Connect-MgGraph -Scopes AuditLog.Read.All,Policy.Read.All,PrivilegedAssignmentSchedule.ReadWrite.AzureADGroup) y lee sus inicios de sesión: Get-MgAuditLogSignIn -Filter \"userPrincipalName eq 'psanchez@contoso.com'\" -Top 5" },
      { en: "Which policy failed? (Get-MgAuditLogSignIn -Filter \"userPrincipalName eq 'psanchez@contoso.com'\" -Top 1).AppliedConditionalAccessPolicies | ft DisplayName,Result",
        es: "¿Qué directiva falló? (Get-MgAuditLogSignIn -Filter \"userPrincipalName eq 'psanchez@contoso.com'\" -Top 1).AppliedConditionalAccessPolicies | ft DisplayName,Result" },
      { en: "Get the group id (Get-MgGroup -Filter \"displayName eq 'CA-Exception-Travel'\") and build $params = @{ accessId = 'member'; principalId = '<his UserId>'; groupId = '<group id>'; action = 'adminAssign'; justification = 'REQ-7731'; scheduleInfo = @{ startDateTime = '2026-10-28T09:00:00Z'; expiration = @{ type = 'afterDateTime'; endDateTime = '2026-11-07T00:00:00Z' } } }",
        es: "Saca el id del grupo (Get-MgGroup -Filter \"displayName eq 'CA-Exception-Travel'\") y prepara $params = @{ accessId = 'member'; principalId = '<su UserId>'; groupId = '<id del grupo>'; action = 'adminAssign'; justification = 'REQ-7731'; scheduleInfo = @{ startDateTime = '2026-10-28T09:00:00Z'; expiration = @{ type = 'afterDateTime'; endDateTime = '2026-11-07T00:00:00Z' } } }" },
      { en: "Send it with New-MgIdentityGovernancePrivilegedAccessGroupAssignmentScheduleRequest -BodyParameter $params, ask Pablo to sign in again and read the sign-in log.",
        es: "Envíalo con New-MgIdentityGovernancePrivilegedAccessGroupAssignmentScheduleRequest -BodyParameter $params, pide a Pablo que vuelva a entrar y lee el registro de inicios de sesión." },
    ],
    note: [
      { kb: "cause", label: { en: "the cause (CA010 blocks countries outside the allowed list, error 53003)", es: "la causa (CA010 bloquea países fuera de la lista permitida, error 53003)" },
        any: ["ca010", "53003", "allowed countries", "paises permitidos", "country", "pais", "mexico", "location", "ubicacion"] },
      { kb: "fix", label: { en: "the fix (time-bound assignment to CA-Exception-Travel)", es: "la solución (asignación con fecha de fin a CA-Exception-Travel)" },
        any: ["ca-exception-travel", "exception group", "grupo de excepcion", "pim", "assignment", "asignacion"] },
      { kb: "verify", label: { en: "how you checked it", es: "cómo lo comprobaste" }, any: ["sign-in log", "registro de inicio", "status 0", "success", "correcto", "notapplied", "signed in again", "volvio a iniciar"] },
      { kb: "followup", label: { en: "the end date and the approval", es: "la fecha de fin y la aprobación" },
        any: ["07/11", "7 november", "7 de noviembre", "end date", "fecha de fin", "expires", "caduca", "req-7731"] },
    ],
    solution: [
      "Connect-MgGraph -Scopes AuditLog.Read.All,Policy.Read.All,PrivilegedAssignmentSchedule.ReadWrite.AzureADGroup",
      "Get-MgAuditLogSignIn -Filter \"userPrincipalName eq 'psanchez@contoso.com'\" -Top 5",
      "(Get-MgAuditLogSignIn -Filter \"userPrincipalName eq 'psanchez@contoso.com'\" -Top 1).AppliedConditionalAccessPolicies | ft DisplayName,Result",
      "Get-MgGroup -Filter \"displayName eq 'CA-Exception-Travel'\"",
      "$params = @{ accessId = 'member'; principalId = '8b41c7e2-3d5f-4a6b-b2e9-71c0d4f8a925'; groupId = '5f2d8c1e-7a43-4b9e-9c61-2e8f0a7d4b13'; action = 'adminAssign'; justification = 'REQ-7731 trip to Mexico'; scheduleInfo = @{ startDateTime = '2026-10-28T09:00:00Z'; expiration = @{ type = 'afterDateTime'; endDateTime = '2026-11-07T00:00:00Z' } } }",
      "New-MgIdentityGovernancePrivilegedAccessGroupAssignmentScheduleRequest -BodyParameter $params",
      "Get-MgAuditLogSignIn -Filter \"userPrincipalName eq 'psanchez@contoso.com'\" -Top 5",
    ],
    sampleNote: {
      en: "Sign-ins from Mexico failed with 53003: policy CA010 blocks countries outside the allowed list (MFA and device were fine). Added psanchez to CA-Exception-Travel with a PIM assignment as approved in REQ-7731. He signed in again and the sign-in log shows success. The exception expires on 07/11/2026, after the trip.",
      es: "Los inicios de sesión desde México fallaban con 53003: la directiva CA010 bloquea los países fuera de la lista permitida (MFA y dispositivo estaban bien). Añadí a psanchez a CA-Exception-Travel con una asignación de PIM según lo aprobado en REQ-7731. Volvió a iniciar sesión y el registro muestra success. La excepción caduca el 07/11/2026, al acabar el viaje.",
    },
  });

  /* ------------------------------------------------------------------ 16. SAML SSO broken after the certificate expired */
  scenarios.push({
    id: "sso-saml",
    level: 2,
    topic: { en: "Entra ID / SSO (SAML)", es: "Entra ID / SSO (SAML)" },
    minutes: 20,
    title: { en: "Nobody can sign in to Expenses with SSO", es: "Nadie puede entrar en Gastos con SSO" },
    guide: GUIDE + "entra-sso-saml-dar-de-alta-una-aplicacion-y-login-que-falla.html",
    machine: { host: "ADM-WS01", user: "it.admin", domain: "CONTOSO", shell: "powershell", prompt: "PS C:\\Users\\it.admin> " },
    ticket: {
      id: "INC-20522", from: "Elena Romero (Marketing)", priority: "P2",
      subject: { en: "Expenses app: 'SSO error' for everyone since this morning", es: "App de Gastos: 'error de SSO' para todos desde esta mañana" },
      body: {
        en: "Since this morning nobody in Marketing can get into Contoso Expenses (expenses.contoso.com). Microsoft asks for the login as usual, then the app shows 'SSO error: SAML response rejected'. Yesterday it worked. I need to submit my expenses before the monthly close.",
        es: "Desde esta mañana nadie de Marketing puede entrar en Contoso Expenses (expenses.contoso.com). Microsoft pide el inicio de sesión como siempre y luego la app muestra 'SSO error: SAML response rejected'. Ayer funcionaba. Tengo que pasar mis gastos antes del cierre del mes.",
      },
    },
    intro: {
      en: "You are on your admin workstation with the Microsoft Graph PowerShell SDK (Application Administrator). Contoso Expenses is an enterprise app with SAML SSO (service principal id 3e9b7a21-6c4d-4f80-9a15-d2c8e07b4f6a). Its owner, Finance Systems, says that on 02/10 they uploaded to the app the new certificate from the expiry notice, thumbprint 4C1E8A0D93F27B5C6E1D04A8B39F7C25D0E862B7.",
      es: "Estás en tu equipo de administración con el SDK de Microsoft Graph PowerShell (Administrador de aplicaciones). Contoso Expenses es una aplicación empresarial con SSO SAML (id de la entidad de servicio 3e9b7a21-6c4d-4f80-9a15-d2c8e07b4f6a). Su responsable, Sistemas de Finanzas, dice que el 02/10 subieron a la app el certificado nuevo del aviso de caducidad, huella 4C1E8A0D93F27B5C6E1D04A8B39F7C25D0E862B7.",
    },
    requester: { name: "Elena Romero", team: { en: "Marketing", es: "Marketing" }, user: "eromero", location: { en: "Head office, 1st floor", es: "Oficina central, 1ª planta" }, device: "LAPTOP-0251" },
    asset: {
      title: { en: "Enterprise app · Contoso Expenses", es: "Aplicación empresarial · Contoso Expenses" },
      fields: [
        { label: { en: "SSO sign-in", es: "Inicio de sesión SSO" }, states: [
          { when: { verified: true }, value: { en: "Working", es: "Funciona" }, tone: "ok" },
          { value: { en: "Rejected by the app", es: "Rechazado por la app" }, tone: "bad" }] },
        { label: { en: "Active signing certificate in Entra ID", es: "Certificado de firma activo en Entra ID" }, states: [
          { when: { active: "new" }, value: { en: "4C1E…62B7, valid until 01/10/2029", es: "4C1E…62B7, válido hasta el 01/10/2029" }, tone: "ok" },
          { when: { active: "rogue" }, value: { en: "D27B…19AF (created today, unknown to the app)", es: "D27B…19AF (creado hoy, la app no lo conoce)" }, tone: "bad" },
          { value: { en: "9F3A…0C51, expired 28/10/2026", es: "9F3A…0C51, caducado el 28/10/2026" }, tone: "bad" }] },
        { label: { en: "Certificate the app trusts", es: "Certificado en el que confía la app" }, value: { en: "4C1E…62B7 (uploaded 02/10)", es: "4C1E…62B7 (subido el 02/10)" } },
        { label: { en: "Users assigned", es: "Usuarios asignados" }, value: "142" },
      ],
    },
    actions: [
      { id: "test", label: { en: "Test sign-in (My Apps)", es: "Probar inicio de sesión (Mis aplicaciones)" },
        cmd: "Start-Process 'https://launcher.myapps.microsoft.com/api/signin/a64f2c18-0b7e-4d39-8e51-c9d27f30b6e4?tenantId=contoso.com'" },
    ],
    codes: ["config-fixed"],
    state: { connected: false, appError: false, certsSeen: false, active: "old", rogueAdded: false, verified: false },
    commands: [
      { id: "connect", match: /^connect-mggraph\b/, set: { connected: true }, out: ["", "Welcome to Microsoft Graph!", "", "Connected via delegated access using it.admin@contoso.com", ""] },
      { id: "test-old", match: /^start-process\b.*(myapps|expenses\.contoso\.com)/, when: { active: "old" }, set: { appError: true }, out: [""],
        say: { en: "Browser: you sign in to Microsoft without problems, then expenses.contoso.com shows 'SSO error: SAML response rejected. Signing certificate expired (NotAfter 2026-10-28T00:00:00Z).'",
               es: "Navegador: el inicio de sesión en Microsoft va bien y después expenses.contoso.com muestra 'SSO error: SAML response rejected. Signing certificate expired (NotAfter 2026-10-28T00:00:00Z).'" } },
      { id: "test-rogue", match: /^start-process\b.*(myapps|expenses\.contoso\.com)/, when: { active: "rogue" }, set: { appError: true }, out: [""],
        say: { en: "Browser: expenses.contoso.com shows 'SSO error: Signature validation failed. Certificate thumbprint D27B30E9A41C5F86B2D7E03C91A4F65B8E0C19AF is not trusted.'",
               es: "Navegador: expenses.contoso.com muestra 'SSO error: Signature validation failed. Certificate thumbprint D27B30E9A41C5F86B2D7E03C91A4F65B8E0C19AF is not trusted.'" } },
      { id: "test-ok", match: /^start-process\b.*(myapps|expenses\.contoso\.com)/, set: { verified: true }, out: [""],
        say: { en: "Browser: you land on the Contoso Expenses dashboard. Elena confirms she is in too.",
               es: "Navegador: entras en el panel de Contoso Expenses. Elena confirma que ella también entra." } },
      { id: "not-connected", match: /^\(?(get|new|update|remove|add)-mg/, when: { connected: false }, error: true,
        out: ["Authentication needed. Please call Connect-MgGraph.", ""] },
      { id: "keys", match: /^\(?get-mgserviceprincipal\b.*keycredentials/, set: { certsSeen: true }, out: [
        "", "DisplayName                                   Usage  StartDateTime        EndDateTime          Thumbprint",
        "-----------                                   -----  -------------        -----------          ----------",
        "CN=Microsoft Azure Federated SSO Certificate  Sign   28/10/2023 00:00:00  28/10/2026 00:00:00  9F3A51C27E0B4D86A1F3C95E2D7084B61A9E0C51",
        "CN=Microsoft Azure Federated SSO Certificate  Verify 28/10/2023 00:00:00  28/10/2026 00:00:00  9F3A51C27E0B4D86A1F3C95E2D7084B61A9E0C51",
        "CN=Microsoft Azure Federated SSO Certificate  Sign   01/10/2026 00:00:00  01/10/2029 00:00:00  4C1E8A0D93F27B5C6E1D04A8B39F7C25D0E862B7",
        "CN=Microsoft Azure Federated SSO Certificate  Verify 01/10/2026 00:00:00  01/10/2029 00:00:00  4C1E8A0D93F27B5C6E1D04A8B39F7C25D0E862B7", ""],
        say: { en: "Two certificates: the old one expired at midnight and the new one, the one the app already trusts, was created on 01/10 but never made active.",
               es: "Dos certificados: el antiguo caducó a medianoche y el nuevo, el que la app ya tiene, se creó el 01/10 pero nunca se activó." } },
      { id: "sp-old", match: /^get-mgserviceprincipal\b/, when: { active: "old" }, out: [
        "", "Id                                 : 3e9b7a21-6c4d-4f80-9a15-d2c8e07b4f6a", "AppId                              : a64f2c18-0b7e-4d39-8e51-c9d27f30b6e4",
        "DisplayName                        : Contoso Expenses", "PreferredSingleSignOnMode          : saml",
        "PreferredTokenSigningKeyThumbprint : 9F3A51C27E0B4D86A1F3C95E2D7084B61A9E0C51", ""],
        say: { en: "Entra ID still signs with 9F3A…0C51. Look at the app's certificates (KeyCredentials) and their dates.",
               es: "Entra ID sigue firmando con 9F3A…0C51. Mira los certificados de la app (KeyCredentials) y sus fechas." } },
      { id: "sp-rogue", match: /^get-mgserviceprincipal\b/, when: { active: "rogue" }, out: [
        "", "Id                                 : 3e9b7a21-6c4d-4f80-9a15-d2c8e07b4f6a", "DisplayName                        : Contoso Expenses",
        "PreferredSingleSignOnMode          : saml", "PreferredTokenSigningKeyThumbprint : D27B30E9A41C5F86B2D7E03C91A4F65B8E0C19AF", ""] },
      { id: "sp-new", match: /^get-mgserviceprincipal\b/, out: [
        "", "Id                                 : 3e9b7a21-6c4d-4f80-9a15-d2c8e07b4f6a", "DisplayName                        : Contoso Expenses",
        "PreferredSingleSignOnMode          : saml", "PreferredTokenSigningKeyThumbprint : 4C1E8A0D93F27B5C6E1D04A8B39F7C25D0E862B7", ""] },
      { id: "signins", match: /^\(?get-mgauditlogsignin\b/, out: [
        "", "CreatedDateTime      UserPrincipalName     AppDisplayName    Status",
        "---------------      -----------------     --------------    ------",
        "28/10/2026 08:41:07  eromero@contoso.com   Contoso Expenses  0",
        "28/10/2026 08:37:52  lnavarro@contoso.com  Contoso Expenses  0",
        "28/10/2026 08:20:15  psanchez@contoso.com  Contoso Expenses  0", ""],
        say: { en: "Entra ID signs everyone in and sends the SAML response. It is the app that rejects it: look at how the response is signed.",
               es: "Entra ID autentica a todos y envía la respuesta SAML. Es la app la que la rechaza: mira con qué se firma la respuesta." } },
      { id: "activate-new", match: /^update-mgserviceprincipal\b.*preferredtokensigningkeythumbprint\b.*4c1e8a0d93f27b5c6e1d04a8b39f7c25d0e862b7/, set: { active: "new", verified: false }, out: [""],
        say: { en: "Entra ID now signs the SAML responses with 4C1E…62B7, the certificate the app already has.",
               es: "Entra ID firma ahora las respuestas SAML con 4C1E…62B7, el certificado que la app ya tiene." } },
      { id: "activate-old", match: /^update-mgserviceprincipal\b.*preferredtokensigningkeythumbprint\b.*9f3a51c2/, set: { active: "old", verified: false }, out: [""],
        say: { en: "That is the certificate that expired at midnight.", es: "Ese es el certificado que caducó a medianoche." } },
      { id: "activate-rogue", match: /^update-mgserviceprincipal\b.*preferredtokensigningkeythumbprint\b.*d27b30e9/, when: { rogueAdded: true }, set: { active: "rogue", verified: false }, out: [""] },
      { id: "activate-bad", match: /^update-mgserviceprincipal\b.*preferredtokensigningkeythumbprint/, error: true, out: [
        "The thumbprint does not match any signing certificate of this service principal.", "Status: 400 (BadRequest)", ""] },
      { id: "add-cert", match: /^add-mgserviceprincipaltokensigningcertificate\b/, set: { rogueAdded: true }, out: [
        "", "Thumbprint                               EndDateTime          KeyId", "----------                               -----------          -----",
        "D27B30E9A41C5F86B2D7E03C91A4F65B8E0C19AF 28/10/2029 00:00:00  6a0f2e41-8c3d-4b75-a2e9-1d7f04c8b356", ""],
        say: { en: "A third certificate, created now. The app has never seen it: making it active would need another upload by Finance Systems.",
               es: "Un tercer certificado, creado ahora. La app no lo ha visto nunca: activarlo obligaría a Sistemas de Finanzas a subirlo otra vez." } },
      { id: "reset-pwd", match: /^(update-mguser\b.*passwordprofile|reset-mguserauthenticationmethodpassword|set-adaccountpassword)\b/, out: [""],
        say: { en: "Passwords are not the problem: the sign-in log shows everyone authenticates fine. The app rejects the signature of the SAML response.",
               es: "Las contraseñas no son el problema: el registro muestra que todos se autentican bien. La app rechaza la firma de la respuesta SAML." } },
      { id: "recreate", match: /^remove-mgserviceprincipal\b/, out: [""],
        say: { en: "Stopped before it ran: deleting the enterprise app loses the 142 assignments and the claims, and a new app would bring a certificate the Expenses app does not trust either.",
               es: "Detenido antes de ejecutarse: borrar la aplicación empresarial pierde las 142 asignaciones y las notificaciones, y una app nueva traería un certificado en el que Expenses tampoco confía." } },
    ],
    goal: { active: "new", verified: true },
    stages: [
      { id: "investigate", label: { en: "Find which certificate signs the SAML response", es: "Encontrar qué certificado firma la respuesta SAML" }, when: { certsSeen: true } },
      { id: "fix", label: { en: "Make the certificate the app trusts active", es: "Activar el certificado en el que confía la app" }, when: { active: "new" } },
      { id: "verify", label: { en: "Test the SSO sign-in", es: "Probar el inicio de sesión SSO" }, when: { verified: true } },
    ],
    resolved: { en: "Resolved: SSO to Contoso Expenses works again. Now write the work note.", es: "Resuelto: el SSO a Contoso Expenses vuelve a funcionar. Ahora escribe la nota de trabajo." },
    hints: [
      { en: "Reproduce it with the test sign-in, and connect: Connect-MgGraph -Scopes Application.ReadWrite.All,AuditLog.Read.All",
        es: "Reprodúcelo con la prueba de inicio de sesión y conéctate: Connect-MgGraph -Scopes Application.ReadWrite.All,AuditLog.Read.All" },
      { en: "Which certificate is Entra ID using? Get-MgServicePrincipal -ServicePrincipalId 3e9b7a21-6c4d-4f80-9a15-d2c8e07b4f6a | fl DisplayName,PreferredTokenSigningKeyThumbprint",
        es: "¿Qué certificado usa Entra ID? Get-MgServicePrincipal -ServicePrincipalId 3e9b7a21-6c4d-4f80-9a15-d2c8e07b4f6a | fl DisplayName,PreferredTokenSigningKeyThumbprint" },
      { en: "List the certificates and dates: (Get-MgServicePrincipal -ServicePrincipalId 3e9b7a21-6c4d-4f80-9a15-d2c8e07b4f6a).KeyCredentials | ft DisplayName,Usage,StartDateTime,EndDateTime,@{n='Thumbprint';e={[BitConverter]::ToString($_.CustomKeyIdentifier) -replace '-'}}",
        es: "Lista los certificados y sus fechas: (Get-MgServicePrincipal -ServicePrincipalId 3e9b7a21-6c4d-4f80-9a15-d2c8e07b4f6a).KeyCredentials | ft DisplayName,Usage,StartDateTime,EndDateTime,@{n='Thumbprint';e={[BitConverter]::ToString($_.CustomKeyIdentifier) -replace '-'}}" },
      { en: "Make the one the app has active: Update-MgServicePrincipal -ServicePrincipalId <id> -PreferredTokenSigningKeyThumbprint <thumbprint>, then test the sign-in again.",
        es: "Activa el que tiene la app: Update-MgServicePrincipal -ServicePrincipalId <id> -PreferredTokenSigningKeyThumbprint <huella>, y vuelve a probar el inicio de sesión." },
    ],
    note: [
      { kb: "cause", label: { en: "the cause (Entra ID still signed with the expired certificate)", es: "la causa (Entra ID seguía firmando con el certificado caducado)" },
        any: ["expired", "caducad", "expir", "9f3a", "signing certificate", "certificado de firma"] },
      { kb: "fix", label: { en: "the fix (the new certificate made active)", es: "la solución (certificado nuevo activado)" },
        any: ["preferredtokensigningkeythumbprint", "active", "activ", "4c1e"] },
      { kb: "verify", label: { en: "how you checked it", es: "cómo lo comprobaste" }, any: ["test sign-in", "prueba de inicio", "dashboard", "panel", "works again", "ya funciona", "vuelve a funcionar"] },
      { kb: "followup", label: { en: "the follow-up (activate certificates when they are rolled out, expiry reminders)", es: "el seguimiento (activar los certificados al desplegarlos, avisos de caducidad)" },
        any: ["notification", "aviso", "reminder", "recordatorio", "calendar", "calendario", "owner", "responsable", "procedure", "procedimiento", "checklist"] },
    ],
    solution: [
      "Start-Process 'https://launcher.myapps.microsoft.com/api/signin/a64f2c18-0b7e-4d39-8e51-c9d27f30b6e4?tenantId=contoso.com'",
      "Connect-MgGraph -Scopes Application.ReadWrite.All,AuditLog.Read.All",
      "Get-MgServicePrincipal -ServicePrincipalId 3e9b7a21-6c4d-4f80-9a15-d2c8e07b4f6a | fl DisplayName,PreferredTokenSigningKeyThumbprint",
      "(Get-MgServicePrincipal -ServicePrincipalId 3e9b7a21-6c4d-4f80-9a15-d2c8e07b4f6a).KeyCredentials | ft DisplayName,Usage,StartDateTime,EndDateTime,@{n='Thumbprint';e={[BitConverter]::ToString($_.CustomKeyIdentifier) -replace '-'}}",
      "Update-MgServicePrincipal -ServicePrincipalId 3e9b7a21-6c4d-4f80-9a15-d2c8e07b4f6a -PreferredTokenSigningKeyThumbprint 4C1E8A0D93F27B5C6E1D04A8B39F7C25D0E862B7",
      "Start-Process 'https://launcher.myapps.microsoft.com/api/signin/a64f2c18-0b7e-4d39-8e51-c9d27f30b6e4?tenantId=contoso.com'",
    ],
    sampleNote: {
      en: "Entra ID still signed the SAML responses for Contoso Expenses with the signing certificate 9F3A…0C51, which expired at midnight; the new one (4C1E…62B7) had been uploaded to the app on 02/10 but never made active. Set PreferredTokenSigningKeyThumbprint to 4C1E…62B7. The test sign-in reaches the dashboard and Elena works again. Agreed with the app owner to activate new certificates as soon as they are uploaded, with a calendar reminder before expiry.",
      es: "Entra ID seguía firmando las respuestas SAML de Contoso Expenses con el certificado de firma 9F3A…0C51, caducado a medianoche; el nuevo (4C1E…62B7) se subió a la app el 02/10 pero nunca se activó. Puse PreferredTokenSigningKeyThumbprint en 4C1E…62B7. La prueba de inicio de sesión llega al panel y Elena ya funciona. Acordé con el responsable de la app activar los certificados nuevos en cuanto se suban, con un recordatorio en el calendario antes de la caducidad.",
    },
  });

  /* ------------------------------------------------------------------ 17. Linux server joined to AD: AD logins fail */
  scenarios.push({
    id: "linux-sssd",
    level: 2,
    topic: { en: "Linux / Active Directory", es: "Linux / Active Directory" },
    minutes: 20,
    title: { en: "The payroll SFTP server rejects AD accounts", es: "El servidor SFTP de nóminas rechaza las cuentas del dominio" },
    guide: GUIDE + "linux-unir-un-servidor-a-active-directory-con-sssd.html",
    machine: { host: "pay-sftp01", user: "root", domain: "contoso.local", shell: "bash", prompt: "[root@pay-sftp01 ~]# " },
    ticket: {
      id: "INC-20523", from: "David López (Finance)", priority: "P2",
      subject: { en: "SFTP to the payroll server: 'Permission denied'", es: "SFTP al servidor de nóminas: 'Permission denied'" },
      body: {
        en: "Since this morning I cannot connect to pay-sftp01 to upload the payroll file for the bank: 'Permission denied, please try again', and my password is right (I use it for Windows). Lucía gets the same. The file has to be uploaded before 12:00.",
        es: "Desde esta mañana no puedo conectarme a pay-sftp01 para subir el fichero de nóminas del banco: 'Permission denied, please try again', y la contraseña es la buena (la uso en Windows). A Lucía le pasa lo mismo. El fichero tiene que subirse antes de las 12:00.",
      },
    },
    intro: {
      en: "You are logged in as root on pay-sftp01 (RHEL 9), joined to contoso.local with realmd and SSSD. The local account payops, used by the nightly job, still logs in. The domain controllers are dc01 (10.20.1.10) and dc02 (10.20.1.11). There was patching on Monday night.",
      es: "Has entrado como root en pay-sftp01 (RHEL 9), unido a contoso.local con realmd y SSSD. La cuenta local payops, la del proceso nocturno, sigue entrando. Los controladores de dominio son dc01 (10.20.1.10) y dc02 (10.20.1.11). El lunes por la noche hubo parches.",
    },
    requester: { name: "David López", team: { en: "Finance (Payroll)", es: "Finanzas (Nóminas)" }, user: "dlopez", location: { en: "Head office, 2nd floor", es: "Oficina central, 2ª planta" }, device: "PC-FIN-027" },
    asset: {
      title: { en: "Server · pay-sftp01 (RHEL 9)", es: "Servidor · pay-sftp01 (RHEL 9)" },
      fields: [
        { label: { en: "AD logins", es: "Inicios de sesión del dominio" }, states: [
          { when: { verified: true }, value: { en: "Working", es: "Funcionan" }, tone: "ok" },
          { value: { en: "Failing: Permission denied", es: "Fallan: Permission denied" }, tone: "bad" }] },
        { label: { en: "System clock", es: "Reloj del sistema" }, states: [
          { when: { clockOk: true }, value: { en: "In sync with dc01 (chrony)", es: "Sincronizado con dc01 (chrony)" }, tone: "ok" },
          { when: { skewFound: true }, value: { en: "9 min 22 s behind the DCs", es: "9 min 22 s por detrás de los DC" }, tone: "bad" },
          { value: { en: "Not checked", es: "Sin revisar" }, tone: "muted" }] },
        { label: "chronyd", states: [
          { when: { chronyRunning: true, chronyEnabled: true }, value: { en: "Active, enabled", es: "Activo, habilitado" }, tone: "ok" },
          { when: { chronyRunning: true }, value: { en: "Active, but disabled at boot", es: "Activo, pero deshabilitado al arrancar" }, tone: "warn" },
          { value: { en: "Inactive", es: "Inactivo" }, tone: "warn" }] },
        { label: { en: "Domain membership", es: "Pertenencia al dominio" }, states: [
          { when: { left: true }, value: { en: "Not joined (realm leave)", es: "Fuera del dominio (realm leave)" }, tone: "bad" },
          { value: "contoso.local (SSSD)" }] },
      ],
    },
    actions: [
      { id: "restart-sssd", label: { en: "Restart SSSD", es: "Reiniciar SSSD" }, cmd: "systemctl restart sssd" },
      { id: "flush", label: { en: "Clear the SSSD cache", es: "Vaciar la caché de SSSD" }, cmd: "sss_cache -E" },
    ],
    codes: ["cause-removed", "config-fixed"],
    state: { skewFound: false, chronyRunning: false, chronyEnabled: false, clockOk: false, left: false, verified: false },
    commands: [
      { id: "id", match: /^id\s+dlopez(@contoso\.local)?\b/, out: [
        "uid=1215001104(dlopez@contoso.local) gid=1215000513(domain users@contoso.local) groups=1215000513(domain users@contoso.local),1215001122(gg-finance@contoso.local),1215001131(gg-vpn-users@contoso.local)"],
        say: { en: "SSSD knows the user and his groups (from its cache), and he is in gg-finance.", es: "SSSD conoce al usuario y sus grupos (desde su caché), y está en gg-finance." } },
      { id: "realm-left", match: /^realm\s+list\b/, when: { left: true }, out: [""] },
      { id: "realm", match: /^realm\s+list\b/, out: [
        "contoso.local", "  type: kerberos", "  realm-name: CONTOSO.LOCAL", "  domain-name: contoso.local", "  configured: kerberos-member",
        "  server-software: active-directory", "  client-software: sssd", "  required-package: sssd", "  required-package: adcli",
        "  login-formats: %U@contoso.local", "  login-policy: allow-permitted-logins", "  permitted-logins: ",
        "  permitted-groups: gg-finance@contoso.local, gg-it-admins@contoso.local"],
        say: { en: "The server is joined and gg-finance is allowed to log in. Access rules are not the problem.",
               es: "El servidor está unido y gg-finance tiene permiso para entrar. Las reglas de acceso no son el problema." } },
      { id: "usercheck", match: /^sssctl\s+user-checks\b/, out: [
        "user: dlopez@contoso.local", "action: acct", "service: system-auth", "", "SSSD nss user lookup result:", " - user name: dlopez@contoso.local",
        " - user id: 1215001104", " - group id: 1215000513", " - home directory: /home/dlopez@contoso.local", " - shell: /bin/bash", "",
        "testing pam_acct_mgmt", "", "pam_acct_mgmt: Success", ""],
        say: { en: "The account check (access) passes. What fails is the password check, which goes to Kerberos.",
               es: "La comprobación de la cuenta (acceso) pasa. Lo que falla es la de la contraseña, que va a Kerberos." } },
      { id: "logs-sssd", match: /^(journalctl\b.*\bsssd\b|(cat|tail|grep|less)\b.*\/var\/log\/sssd)/, when: { clockOk: false }, set: { skewFound: true }, out: [
        "Oct 28 08:56:41 pay-sftp01 krb5_child[48211]: Clock skew too great",
        "Oct 28 08:56:41 pay-sftp01 krb5_child[48211]: Clock skew too great",
        "Oct 28 08:57:13 pay-sftp01 krb5_child[48263]: Clock skew too great",
        "Oct 28 08:57:13 pay-sftp01 krb5_child[48263]: Clock skew too great"],
        say: { en: "Kerberos refuses the ticket: this server's clock and the domain controllers' differ by more than 5 minutes.",
               es: "Kerberos rechaza el ticket: el reloj de este servidor y el de los controladores de dominio difieren en más de 5 minutos." } },
      { id: "logs-sssd-ok", match: /^(journalctl\b.*\bsssd\b|(cat|tail|grep|less)\b.*\/var\/log\/sssd)/, out: ["-- No entries --"] },
      { id: "logs-secure", match: /^(journalctl\b.*\bsshd\b|(cat|tail|grep|less)\b.*\/var\/log\/secure)/, out: [
        "Oct 28 08:57:13 pay-sftp01 sshd[48207]: pam_sss(sshd:auth): authentication failure; logname= uid=0 euid=0 tty=ssh ruser= rhost=10.20.14.63 user=dlopez@contoso.local",
        "Oct 28 08:57:13 pay-sftp01 sshd[48207]: pam_sss(sshd:auth): received for user dlopez@contoso.local: 4 (System error)",
        "Oct 28 08:57:15 pay-sftp01 sshd[48207]: Failed password for dlopez@contoso.local from 10.20.14.63 port 51544 ssh2"],
        say: { en: "'System error' (4), not 'Authentication failure' (7): the password is not wrong, SSSD could not check it. Its own log says why.",
               es: "'System error' (4), no 'Authentication failure' (7): la contraseña no está mal, SSSD no pudo comprobarla. Su propio registro dice por qué." } },
      { id: "timedatectl-bad", match: /^timedatectl(\s+status)?\s*$/, when: { clockOk: false }, set: { skewFound: true }, out: [
        "               Local time: Wed 2026-10-28 08:58:02 CET", "           Universal time: Wed 2026-10-28 07:58:02 UTC",
        "                 RTC time: Wed 2026-10-28 07:58:01", "                Time zone: Europe/Madrid (CET, +0100)",
        "System clock synchronized: no", "              NTP service: inactive", "          RTC in local TZ: no"],
        say: { en: "No time synchronisation, and the clock says 08:58 when it is 09:07 on your watch.",
               es: "Sin sincronización de hora, y el reloj marca las 08:58 cuando en el tuyo son las 09:07." } },
      { id: "timedatectl-ok", match: /^timedatectl(\s+status)?\s*$/, out: [
        "               Local time: Wed 2026-10-28 09:08:14 CET", "           Universal time: Wed 2026-10-28 08:08:14 UTC",
        "                 RTC time: Wed 2026-10-28 08:08:14", "                Time zone: Europe/Madrid (CET, +0100)",
        "System clock synchronized: yes", "              NTP service: active", "          RTC in local TZ: no"] },
      { id: "chronyd-q", match: /^chronyd\s+-q\b/, when: { clockOk: false }, set: { skewFound: true }, out: [
        "2026-10-28T07:58:31Z chronyd version 4.5 starting (+CMDMON +NTP +REFCLOCK +RTC +PRIVDROP +SCFILTER +SIGND +ASYNCDNS +NTS +SECHASH +IPV6 +DEBUG)",
        "2026-10-28T07:58:35Z System clock wrong by 562.418 seconds (ignored)", "2026-10-28T07:58:35Z chronyd exiting"],
        say: { en: "562 seconds (9 min 22 s) off. Kerberos tolerates 5 minutes.", es: "562 segundos (9 min 22 s) de desfase. Kerberos tolera 5 minutos." } },
      { id: "chrony-down", match: /^chronyc\b/, when: { chronyRunning: false }, error: true, out: ["506 Cannot talk to daemon"] },
      { id: "chrony-makestep", match: /^chronyc\s+makestep\b/, set: { clockOk: true }, out: ["200 OK"] },
      { id: "chrony-tracking", match: /^chronyc\s+(tracking|sources)\b/, out: [
        "Reference ID    : 0A14010A (dc01.contoso.local)", "Stratum         : 4", "Ref time (UTC)  : Wed Oct 28 08:07:31 2026",
        "System time     : 0.000012 seconds slow of NTP time", "Last offset     : -0.000031 seconds", "RMS offset      : 0.000031 seconds",
        "Frequency       : 12.401 ppm fast", "Leap status     : Normal"],
        say: { en: "Synchronised with dc01, offset in microseconds.", es: "Sincronizado con dc01, desfase de microsegundos." } },
      { id: "status-chrony-off", match: /^systemctl\s+(status|is-active|is-enabled)\s+chronyd\b/, when: { chronyRunning: false }, set: { skewFound: true }, out: [
        "○ chronyd.service - NTP client/server", "     Loaded: loaded (/usr/lib/systemd/system/chronyd.service; disabled; preset: enabled)",
        "     Active: inactive (dead) since Mon 2026-10-26 22:14:05 CET; 1 day 10h ago"],
        say: { en: "chronyd was stopped and disabled during Monday's patching. The clock has been drifting since.",
               es: "chronyd se paró y se deshabilitó en los parches del lunes. Desde entonces el reloj se va desviando." } },
      { id: "status-chrony-on", match: /^systemctl\s+(status|is-active|is-enabled)\s+chronyd\b/, out: [
        "● chronyd.service - NTP client/server", "     Loaded: loaded (/usr/lib/systemd/system/chronyd.service; enabled; preset: enabled)",
        "     Active: active (running)"] },
      { id: "chrony-enable-now", match: /^systemctl\s+enable\s+--now\s+chronyd\b|^systemctl\s+enable\s+chronyd\s+--now\b/, set: { chronyRunning: true, chronyEnabled: true, clockOk: true }, out: [
        "Created symlink /etc/systemd/system/multi-user.target.wants/chronyd.service → /usr/lib/systemd/system/chronyd.service."],
        say: { en: "chronyd is running and enabled at boot. With 'makestep 1.0 3' in /etc/chrony.conf it steps the clock straight away.",
               es: "chronyd está en marcha y habilitado al arrancar. Con 'makestep 1.0 3' en /etc/chrony.conf corrige el reloj de golpe enseguida." } },
      { id: "chrony-start", match: /^systemctl\s+(re)?start\s+chronyd\b/, set: { chronyRunning: true, clockOk: true }, out: [""],
        say: { en: "Running and the clock is corrected, but it is still disabled: after the next reboot it will not start.",
               es: "En marcha y el reloj corregido, pero sigue deshabilitado: tras el próximo reinicio no arrancará." } },
      { id: "chrony-enable", match: /^systemctl\s+enable\s+chronyd\b/, set: { chronyEnabled: true }, out: [
        "Created symlink /etc/systemd/system/multi-user.target.wants/chronyd.service → /usr/lib/systemd/system/chronyd.service."] },
      { id: "sss-cache", match: /^sss_cache\s+-e\b/, out: [""],
        say: { en: "(Cache cleared.) It does not change the clock: the next login will fail the same way while the skew is there.",
               es: "(Caché vaciada.) No cambia el reloj: el próximo inicio fallará igual mientras siga el desfase." } },
      { id: "sssd-restart", match: /^systemctl\s+restart\s+sssd\b/, out: [""],
        say: { en: "SSSD restarted. That alone does not fix Kerberos.", es: "SSSD reiniciado. Eso solo no arregla Kerberos." } },
      { id: "kinit-left", match: /^kinit\s+-k\b/, when: { left: true }, error: true, out: ["kinit: Key table file '/etc/krb5.keytab' not found while getting initial credentials"] },
      { id: "kinit-skew", match: /^kinit\s+-k\b/, when: { clockOk: false }, set: { skewFound: true }, error: true, out: ["kinit: Clock skew too great while getting initial credentials"] },
      { id: "kinit-ok", match: /^kinit\s+-k\b/, set: { verified: true }, out: [""],
        say: { en: "The server gets a Kerberos ticket with its own keytab. David tries the SFTP upload again: connected, file uploaded.",
               es: "El servidor obtiene un ticket de Kerberos con su propio keytab. David vuelve a probar la subida por SFTP: conectado y fichero subido." } },
      { id: "klist", match: /^klist\b/, when: { verified: true }, out: [
        "Ticket cache: KCM:0", "Default principal: host/pay-sftp01.contoso.local@CONTOSO.LOCAL", "",
        "Valid starting       Expires              Service principal", "28/10/26 09:08:40  28/10/26 19:08:40  krbtgt/CONTOSO.LOCAL@CONTOSO.LOCAL"] },
      { id: "klist-none", match: /^klist\b/, out: ["klist: Credentials cache 'KCM:0' not found"] },
      { id: "su", match: /^su\s+-?\s*(dlopez|lnavarro)/, out: ["[dlopez@contoso.local@pay-sftp01 ~]$ exit", "logout"],
        say: { en: "It works, but root never needs the user's password, so this does not test Kerberos at all.",
               es: "Funciona, pero root nunca necesita la contraseña del usuario, así que esto no prueba Kerberos en absoluto." } },
      { id: "realm-leave", match: /^realm\s+leave\b/, unless: { left: true }, set: { left: true }, out: [""],
        say: { en: "The server is out of the domain: now no AD user can log in at all, and the keytab is gone.",
               es: "El servidor está fuera del dominio: ahora ningún usuario del dominio puede entrar, y el keytab ha desaparecido." } },
      { id: "realm-join-already", match: /^realm\s+join\b/, when: { left: false }, error: true, out: ["realm: Already joined to this domain"] },
      { id: "realm-join-skew", match: /^realm\s+join\b/, when: { clockOk: false }, error: true, out: [
        "Password for Administrator: ", " ! Couldn't authenticate as: Administrator@CONTOSO.LOCAL: Clock skew too great",
        "realm: Couldn't join realm: Couldn't authenticate to active directory: Clock skew too great"],
        say: { en: "Joining needs Kerberos too, so it fails for the same reason.", es: "Unirse también necesita Kerberos, así que falla por el mismo motivo." } },
      { id: "realm-join", match: /^realm\s+join\b/, set: { left: false }, out: ["Password for Administrator: "],
        say: { en: "Joined again. It was not needed: the join was never broken, only the clock.", es: "Unido de nuevo. No hacía falta: la unión nunca estuvo rota, solo el reloj." } },
      { id: "ssh-test", match: /^(ssh|sftp)\b.*(dlopez|lnavarro)/, out: ["dlopez@contoso.local@localhost's password: "],
        say: { en: "You would need his password. Test Kerberos with the server's own keytab instead, then ask David to try.",
               es: "Te haría falta su contraseña. Prueba Kerberos con el keytab del propio servidor y después pide a David que lo intente." } },
    ],
    goal: { chronyRunning: true, chronyEnabled: true, clockOk: true, left: false, verified: true },
    stages: [
      { id: "investigate", label: { en: "Find why AD passwords are rejected", es: "Encontrar por qué se rechazan las contraseñas del dominio" }, when: { skewFound: true } },
      { id: "fix", label: { en: "Restore time synchronisation (and keep the server joined)", es: "Restaurar la sincronización de hora (y mantener el servidor unido)" },
        when: { chronyRunning: true, chronyEnabled: true, clockOk: true, left: false } },
      { id: "verify", label: { en: "Check Kerberos works again", es: "Comprobar que Kerberos vuelve a funcionar" }, when: { verified: true } },
    ],
    resolved: { en: "Resolved: the clock is in sync and AD users log in again. Now write the work note.", es: "Resuelto: el reloj está sincronizado y los usuarios del dominio vuelven a entrar. Ahora escribe la nota de trabajo." },
    hints: [
      { en: "Rule out access first: id dlopez@contoso.local and realm list (who is permitted).", es: "Descarta primero el acceso: id dlopez@contoso.local y realm list (quién tiene permiso)." },
      { en: "Read SSSD's log: journalctl -u sssd --since today", es: "Lee el registro de SSSD: journalctl -u sssd --since today" },
      { en: "Kerberos needs the clocks within 5 minutes: timedatectl and systemctl status chronyd", es: "Kerberos necesita los relojes a menos de 5 minutos: timedatectl y systemctl status chronyd" },
      { en: "systemctl enable --now chronyd, check chronyc tracking, then test Kerberos with the host keytab: kinit -k",
        es: "systemctl enable --now chronyd, comprueba chronyc tracking y prueba Kerberos con el keytab del equipo: kinit -k" },
    ],
    note: [
      { kb: "cause", label: { en: "the cause (clock 9 minutes off, chronyd stopped: Kerberos clock skew)", es: "la causa (reloj 9 minutos desviado, chronyd parado: desfase de Kerberos)" },
        any: ["clock skew", "skew", "desfase", "reloj", "clock"] },
      { kb: "fix", label: { en: "the fix (chronyd enabled and started)", es: "la solución (chronyd habilitado y arrancado)" }, any: ["enable --now", "enabled", "habilit", "started", "arranc"] },
      { kb: "verify", label: { en: "how you checked it", es: "cómo lo comprobaste" }, any: ["kinit", "chronyc tracking", "timedatectl", "sftp", "uploaded", "subido"] },
      { kb: "followup", label: { en: "the follow-up (patching checklist, time monitoring)", es: "el seguimiento (lista de parches, vigilancia de la hora)" },
        any: ["checklist", "lista de parches", "monitor", "alert", "alerta", "vigil"] },
    ],
    solution: ["id dlopez@contoso.local", "realm list", "journalctl -u sssd --since today", "timedatectl", "systemctl enable --now chronyd", "chronyc tracking", "kinit -k"],
    sampleNote: {
      en: "AD logins to pay-sftp01 failed with pam_sss System error: krb5_child logged 'Clock skew too great'. chronyd had been stopped and disabled during Monday's patching and the clock was 9 min 22 s behind the DCs. Access rules (realm permit gg-finance) were fine. Ran systemctl enable --now chronyd; chronyc tracking shows sync with dc01 and kinit -k works. David uploaded the payroll file by SFTP. Asked to add a time sync check to the patching checklist and a monitoring alert.",
      es: "Los inicios de sesión del dominio en pay-sftp01 fallaban con System error de pam_sss: krb5_child registraba 'Clock skew too great'. chronyd se paró y deshabilitó en los parches del lunes y el reloj iba 9 min 22 s por detrás de los DC. Las reglas de acceso (realm permit gg-finance) estaban bien. Ejecuté systemctl enable --now chronyd; chronyc tracking muestra sincronización con dc01 y kinit -k funciona. David ha subido el fichero de nóminas por SFTP. Pedí añadir una comprobación de hora a la lista de parches y una alerta de monitorización.",
    },
  });

  /* ------------------------------------------------------------------ 18. SQL Server transaction log full */
  scenarios.push({
    id: "sql-log-full",
    level: 2,
    topic: { en: "Databases / SQL Server", es: "Bases de datos / SQL Server" },
    minutes: 20,
    title: { en: "The ERP cannot save: transaction log full", es: "El ERP no puede guardar: registro de transacciones lleno" },
    guide: GUIDE + "postgresql-mysql-sql-server-tareas-de-operaciones-copia-restauracion-espacio-y-consulta-lenta.html",
    machine: { host: "ADM-WS01", user: "it.admin", domain: "CONTOSO", shell: "powershell", prompt: "PS C:\\Users\\it.admin> " },
    ticket: {
      id: "INC-20524", from: "Laura Pérez (Accounting)", priority: "P1",
      subject: { en: "ERP: no one can post invoices, 'transaction log full' error", es: "ERP: nadie puede contabilizar facturas, error 'registro de transacciones lleno'" },
      body: {
        en: "Since 08:40 the ERP shows an error whenever we save anything: 'The transaction log for database ERP_PROD is full due to LOG_BACKUP'. We can look at data but not post invoices or payments. The whole Accounting team is stopped.",
        es: "Desde las 08:40 el ERP da un error al guardar cualquier cosa: 'The transaction log for database ERP_PROD is full due to LOG_BACKUP'. Podemos consultar datos, pero no contabilizar facturas ni pagos. Todo Contabilidad está parado.",
      },
    },
    intro: {
      en: "You are on your admin workstation with sqlcmd and sysadmin rights on SQL-ERP01 (SQL Server 2022). ERP_PROD uses the FULL recovery model: the backup policy is a nightly full, a differential at 13:00 and a log backup every 15 minutes (SQL Agent job 'ERP_PROD - Log backup') to the share \\\\FS01\\SQLBackup. The ERP needs point-in-time restore.",
      es: "Estás en tu equipo de administración con sqlcmd y permisos sysadmin en SQL-ERP01 (SQL Server 2022). ERP_PROD usa el modelo de recuperación FULL: la política es una copia completa cada noche, una diferencial a las 13:00 y una del registro cada 15 minutos (trabajo del Agente SQL 'ERP_PROD - Log backup') a la carpeta compartida \\\\FS01\\SQLBackup. El ERP necesita restauración a un momento concreto.",
    },
    requester: { name: "Laura Pérez", team: { en: "Accounting", es: "Contabilidad" }, user: "lperez", location: { en: "Head office, 3rd floor", es: "Oficina central, 3ª planta" }, device: "PC-FIN-033" },
    asset: {
      title: { en: "Database · ERP_PROD on SQL-ERP01", es: "Base de datos · ERP_PROD en SQL-ERP01" },
      fields: [
        { label: { en: "Transaction log", es: "Registro de transacciones" }, states: [
          { when: { logFull: true }, value: { en: "99.98% of 50 GB used (error 9002)", es: "99,98% de 50 GB usado (error 9002)" }, tone: "bad" },
          { value: { en: "1.2% of 50 GB used", es: "1,2% de 50 GB usado" }, tone: "ok" }] },
        { label: { en: "Recovery model", es: "Modelo de recuperación" }, states: [
          { when: { recovery: "simple" }, value: { en: "SIMPLE (no point-in-time restore)", es: "SIMPLE (sin restauración a un momento concreto)" }, tone: "bad" },
          { value: "FULL" }] },
        { label: { en: "Log backup chain", es: "Cadena de copias del registro" }, states: [
          { when: { chainBroken: true }, value: { en: "Broken: needs a full or differential backup", es: "Rota: necesita una copia completa o diferencial" }, tone: "bad" },
          { when: { backedUp: true }, value: { en: "Last log backup: today", es: "Última copia del registro: hoy" }, tone: "ok" },
          { value: { en: "Last log backup: 26/10/2026 23:45", es: "Última copia del registro: 26/10/2026 23:45" }, tone: "warn" }] },
        { label: { en: "Job 'ERP_PROD - Log backup'", es: "Trabajo 'ERP_PROD - Log backup'" }, states: [
          { when: { jobRan: true }, value: { en: "Succeeded", es: "Correcto" }, tone: "ok" },
          { when: { jobFixed: true }, value: { en: "Fixed, not run yet", es: "Corregido, sin ejecutar aún" }, tone: "warn" },
          { value: { en: "Failing since 27/10 00:00", es: "Falla desde el 27/10 a las 00:00" }, tone: "bad" }] },
      ],
    },
    actions: [
      { id: "logspace", label: { en: "Check log space", es: "Ver el espacio del registro" }, cmd: "sqlcmd -S SQL-ERP01 -E -Q \"DBCC SQLPERF(LOGSPACE)\"" },
      { id: "runjob", label: { en: "Run the log backup job", es: "Ejecutar el trabajo de copia del registro" },
        cmd: "sqlcmd -S SQL-ERP01 -E -Q \"EXEC msdb.dbo.sp_start_job @job_name = N'ERP_PROD - Log backup'\"" },
    ],
    codes: ["capacity", "cause-removed"],
    state: { looked: false, causeFound: false, logFull: true, recovery: "full", chainBroken: false, backedUp: false, jobFixed: false, jobRan: false, verified: false },
    commands: [
      { id: "reuse-full", match: /^(sqlcmd|invoke-sqlcmd)\b.*log_reuse_wait/, when: { logFull: true, recovery: "full" }, set: { looked: true }, out: [
        "name       recovery_model_desc  log_reuse_wait_desc", "---------- -------------------- --------------------",
        "ERP_PROD   FULL                 LOG_BACKUP", "", "(1 row affected)"],
        say: { en: "The log cannot be reused until it is backed up. Log backups should run every 15 minutes: when was the last one?",
               es: "El registro no se puede reutilizar hasta que se copie. Las copias del registro deberían hacerse cada 15 minutos: ¿cuándo fue la última?" } },
      { id: "reuse-simple", match: /^(sqlcmd|invoke-sqlcmd)\b.*log_reuse_wait/, when: { recovery: "simple" }, out: [
        "name       recovery_model_desc  log_reuse_wait_desc", "---------- -------------------- --------------------",
        "ERP_PROD   SIMPLE               NOTHING", "", "(1 row affected)"] },
      { id: "reuse-ok", match: /^(sqlcmd|invoke-sqlcmd)\b.*log_reuse_wait/, set: { looked: true }, out: [
        "name       recovery_model_desc  log_reuse_wait_desc", "---------- -------------------- --------------------",
        "ERP_PROD   FULL                 NOTHING", "", "(1 row affected)"] },
      { id: "logspace-full", match: /^(sqlcmd|invoke-sqlcmd)\b.*dbcc\s+sqlperf\s*\(\s*logspace\s*\)/, when: { logFull: true }, set: { looked: true }, out: [
        "Database Name   Log Size (MB)   Log Space Used (%)  Status", "--------------- --------------- ------------------- -----------",
        "master          7.992188        41.30205            0", "tempdb          71.99219        3.84012             0",
        "msdb            39.99219        12.57813            0", "ERP_PROD        51200           99.98326            0", "",
        "DBCC execution completed. If DBCC printed error messages, contact your system administrator."],
        say: { en: "The log is at its 50 GB limit (the L: drive is full too, so it cannot grow).", es: "El registro está en su límite de 50 GB (la unidad L: también está llena, así que no puede crecer)." } },
      { id: "logspace-ok", match: /^(sqlcmd|invoke-sqlcmd)\b.*dbcc\s+sqlperf\s*\(\s*logspace\s*\)/, when: { recovery: "full", chainBroken: false, jobRan: true }, set: { verified: true }, out: [
        "Database Name   Log Size (MB)   Log Space Used (%)  Status", "--------------- --------------- ------------------- -----------",
        "ERP_PROD        51200           1.21934             0", "",
        "DBCC execution completed. If DBCC printed error messages, contact your system administrator."],
        say: { en: "The log has room again and the job keeps it that way. Laura confirms invoices post again.",
               es: "El registro vuelve a tener sitio y el trabajo lo mantendrá así. Laura confirma que vuelven a contabilizarse facturas." } },
      { id: "logspace-free", match: /^(sqlcmd|invoke-sqlcmd)\b.*dbcc\s+sqlperf\s*\(\s*logspace\s*\)/, out: [
        "Database Name   Log Size (MB)   Log Space Used (%)  Status", "--------------- --------------- ------------------- -----------",
        "ERP_PROD        51200           1.21934             0", "",
        "DBCC execution completed. If DBCC printed error messages, contact your system administrator."],
        say: { en: "The log has room for now. Is the cause gone, so it does not fill up again?", es: "El registro tiene sitio por ahora. ¿Se ha quitado la causa para que no vuelva a llenarse?" } },
      { id: "history", match: /^(sqlcmd|invoke-sqlcmd)\b.*backupset/, out: [
        "type backup_finish_date", "---- -----------------------",
        "L    2026-10-26 23:45:12.000", "L    2026-10-26 23:30:10.000", "L    2026-10-26 23:15:09.000",
        "I    2026-10-26 13:04:51.000", "D    2026-10-26 01:12:44.000", "", "(5 rows affected)"],
        say: { en: "No backups at all since Monday 23:45: the log has been growing for more than two days.",
               es: "Ninguna copia desde el lunes a las 23:45: el registro lleva más de dos días creciendo." } },
      { id: "jobhist-bad", match: /^(sqlcmd|invoke-sqlcmd)\b.*(sp_help_jobhistory|sysjobhistory)/, when: { jobRan: false }, set: { causeFound: true }, out: [
        "run_date  run_time step_name            run_status message",
        "--------  -------- -------------------- ---------- -------",
        "20261028  090000   Backup log ERP_PROD  0          Executed as user: CONTOSO\\svc-sqlagent. Cannot open backup device '\\\\FS-OLD01\\SQLBackup\\ERP_PROD\\ERP_PROD_LOG_20261028_0900.trn'. Operating system error 53(The network path was not found.). [SQLSTATE 42000] (Error 3201)  BACKUP LOG is terminating abnormally. [SQLSTATE 42000] (Error 3013).  The step failed.",
        "20261028  084500   Backup log ERP_PROD  0          Executed as user: CONTOSO\\svc-sqlagent. Cannot open backup device '\\\\FS-OLD01\\SQLBackup\\ERP_PROD\\ERP_PROD_LOG_20261028_0845.trn'. Operating system error 53(The network path was not found.). ...",
        "...       (213 more failures since 20261027 000000)", "", "(3 rows affected)"],
        say: { en: "The job still writes to FS-OLD01, the old file server switched off on Monday night after the move to FS01. Nobody updated the job, and nobody was alerted.",
               es: "El trabajo sigue escribiendo en FS-OLD01, el servidor de ficheros antiguo que se apagó el lunes por la noche tras la migración a FS01. Nadie actualizó el trabajo ni saltó ninguna alerta." } },
      { id: "jobhist-ok", match: /^(sqlcmd|invoke-sqlcmd)\b.*(sp_help_jobhistory|sysjobhistory)/, out: [
        "run_date  run_time step_name            run_status message", "--------  -------- -------------------- ---------- -------",
        "20261028  092204   Backup log ERP_PROD  1          Executed as user: CONTOSO\\svc-sqlagent. Processed 1402 pages for database 'ERP_PROD', file 'ERP_PROD_log' on file 1. BACKUP LOG successfully processed 1402 pages ...  The step succeeded.",
        "", "(1 row affected)"] },
      { id: "backup-old", match: /^(sqlcmd|invoke-sqlcmd)\b.*backup\s+log\b.*fs-old01/, error: true, out: [
        "Msg 3201, Level 16, State 1, Server SQL-ERP01, Line 1", "Cannot open backup device '\\\\FS-OLD01\\SQLBackup\\ERP_PROD\\ERP_PROD_LOG.trn'. Operating system error 53(The network path was not found.).",
        "Msg 3013, Level 16, State 1, Server SQL-ERP01, Line 1", "BACKUP LOG is terminating abnormally."] },
      { id: "backup-simple", match: /^(sqlcmd|invoke-sqlcmd)\b.*backup\s+log\b/, when: { recovery: "simple" }, error: true, out: [
        "Msg 4208, Level 16, State 1, Server SQL-ERP01, Line 1",
        "The statement BACKUP LOG is not allowed while the recovery model is SIMPLE. Use BACKUP DATABASE or change the recovery model using ALTER DATABASE.",
        "Msg 3013, Level 16, State 1, Server SQL-ERP01, Line 1", "BACKUP LOG is terminating abnormally."] },
      { id: "backup-nochain", match: /^(sqlcmd|invoke-sqlcmd)\b.*backup\s+log\b/, when: { chainBroken: true }, error: true, out: [
        "Msg 4214, Level 16, State 1, Server SQL-ERP01, Line 1", "BACKUP LOG cannot be performed because there is no current database backup.",
        "Msg 3013, Level 16, State 1, Server SQL-ERP01, Line 1", "BACKUP LOG is terminating abnormally."],
        say: { en: "The switch to SIMPLE broke the log chain. A differential (or full) backup starts it again.",
               es: "El paso a SIMPLE rompió la cadena del registro. Una copia diferencial (o completa) la vuelve a iniciar." } },
      { id: "backup-log", match: /^(sqlcmd|invoke-sqlcmd)\b.*backup\s+log\b.*erp_prod\b.*fs01/, set: { logFull: false, backedUp: true }, out: [
        "Processed 6553214 pages for database 'ERP_PROD', file 'ERP_PROD_log' on file 1.",
        "BACKUP LOG successfully processed 6553214 pages in 412.338 seconds (124.163 MB/sec)."],
        say: { en: "The log is backed up and its space can be reused: the ERP can write again. The job is still broken, though.",
               es: "Registro copiado y su espacio se puede reutilizar: el ERP vuelve a escribir. Pero el trabajo sigue roto." } },
      { id: "backup-diff", match: /^(sqlcmd|invoke-sqlcmd)\b.*backup\s+database\b.*erp_prod\b.*fs01/, when: { recovery: "full" }, set: { chainBroken: false }, out: [
        "Processed 2214790 pages for database 'ERP_PROD', file 'ERP_PROD' on file 1.", "Processed 2 pages for database 'ERP_PROD', file 'ERP_PROD_log' on file 1.",
        "BACKUP DATABASE WITH DIFFERENTIAL successfully processed 2214792 pages in 168.904 seconds (102.441 MB/sec)."] },
      { id: "to-simple", match: /^(sqlcmd|invoke-sqlcmd)\b.*alter\s+database\b.*erp_prod\b.*set\s+recovery\s+simple/, set: { recovery: "simple", logFull: false, chainBroken: true }, out: [""],
        say: { en: "Writes work again, but SIMPLE ends point-in-time restore: every change since Monday's backups can no longer be restored to a moment, and the ERP requires it.",
               es: "Vuelve a escribir, pero SIMPLE acaba con la restauración a un momento concreto: los cambios desde las copias del lunes ya no se pueden restaurar así, y el ERP lo exige." } },
      { id: "to-full", match: /^(sqlcmd|invoke-sqlcmd)\b.*alter\s+database\b.*erp_prod\b.*set\s+recovery\s+full/, set: { recovery: "full" }, out: [""],
        say: { en: "Back to FULL, but the chain stays broken until a full or differential backup.", es: "Vuelve a FULL, pero la cadena sigue rota hasta una copia completa o diferencial." } },
      { id: "shrink", match: /^(sqlcmd|invoke-sqlcmd)\b.*dbcc\s+shrinkfile/, when: { logFull: true }, out: [
        "Cannot shrink log file 2 (ERP_PROD_log) because the logical log file located at the end of the file is in use.",
        "DbId   FileId      CurrentSize MinimumSize UsedPages   EstimatedPages", "------ ----------- ----------- ----------- ----------- --------------",
        "     7           2     6553600       12800     6552504        6552504"],
        say: { en: "Nothing to shrink: the whole log is waiting for a log backup. Shrinking does not free used log, and the log would only grow back.",
               es: "No hay nada que reducir: todo el registro espera una copia. Reducir no libera registro en uso, y el registro volvería a crecer." } },
      { id: "shrink-later", match: /^(sqlcmd|invoke-sqlcmd)\b.*dbcc\s+shrinkfile/, out: [""],
        say: { en: "Not needed: 50 GB is the size this log needs; with log backups every 15 minutes it stays nearly empty.",
               es: "No hace falta: 50 GB es el tamaño que necesita este registro; con copias cada 15 minutos se mantiene casi vacío." } },
      { id: "fix-job", match: /^(sqlcmd|invoke-sqlcmd)\b.*sp_update_jobstep\b.*fs01/, set: { jobFixed: true }, out: [""],
        say: { en: "The job step now writes to \\\\FS01\\SQLBackup.", es: "El paso del trabajo escribe ahora en \\\\FS01\\SQLBackup." } },
      { id: "start-broken", match: /^(sqlcmd|invoke-sqlcmd)\b.*sp_start_job\b/, when: { jobFixed: false }, out: ["Job 'ERP_PROD - Log backup' started successfully."],
        say: { en: "(A minute later it has failed again, like every run since Monday.)", es: "(Un minuto después ha vuelto a fallar, como todas las ejecuciones desde el lunes.)" } },
      { id: "start-bad", match: /^(sqlcmd|invoke-sqlcmd)\b.*sp_start_job\b/, when: { recovery: "simple" }, out: ["Job 'ERP_PROD - Log backup' started successfully."],
        say: { en: "(It failed: BACKUP LOG is not allowed in SIMPLE.)", es: "(Ha fallado: BACKUP LOG no se permite en SIMPLE.)" } },
      { id: "start-nochain", match: /^(sqlcmd|invoke-sqlcmd)\b.*sp_start_job\b/, when: { chainBroken: true }, out: ["Job 'ERP_PROD - Log backup' started successfully."],
        say: { en: "(It failed with error 4214: no current database backup.)", es: "(Ha fallado con el error 4214: no hay copia de la base de datos actual.)" } },
      { id: "start-ok", match: /^(sqlcmd|invoke-sqlcmd)\b.*sp_start_job\b/, set: { jobRan: true, logFull: false, backedUp: true }, out: ["Job 'ERP_PROD - Log backup' started successfully."],
        say: { en: "(The job finished in a few seconds and succeeded.)", es: "(El trabajo terminó en unos segundos y correctamente.)" } },
    ],
    goal: { logFull: false, recovery: "full", chainBroken: false, jobFixed: true, jobRan: true, verified: true },
    stages: [
      { id: "investigate", label: { en: "Find why the log is not being backed up", es: "Encontrar por qué no se copia el registro" }, when: { causeFound: true } },
      { id: "fix", label: { en: "Back up the log and fix the job (keeping the restore chain)", es: "Copiar el registro y arreglar el trabajo (sin romper la cadena de restauración)" },
        when: { logFull: false, recovery: "full", chainBroken: false, jobFixed: true, jobRan: true } },
      { id: "verify", label: { en: "Check the log space after the job runs", es: "Comprobar el espacio del registro tras ejecutar el trabajo" }, when: { verified: true } },
    ],
    resolved: { en: "Resolved: the ERP writes again and log backups run. Now write the work note.", es: "Resuelto: el ERP vuelve a escribir y las copias del registro funcionan. Ahora escribe la nota de trabajo." },
    hints: [
      { en: "Why can the log not be reused? sqlcmd -S SQL-ERP01 -E -Q \"SELECT name, recovery_model_desc, log_reuse_wait_desc FROM sys.databases WHERE name = 'ERP_PROD'\" and DBCC SQLPERF(LOGSPACE)",
        es: "¿Por qué no se reutiliza el registro? sqlcmd -S SQL-ERP01 -E -Q \"SELECT name, recovery_model_desc, log_reuse_wait_desc FROM sys.databases WHERE name = 'ERP_PROD'\" y DBCC SQLPERF(LOGSPACE)" },
      { en: "Look at the last backups (msdb.dbo.backupset) and the job: EXEC msdb.dbo.sp_help_jobhistory @job_name = N'ERP_PROD - Log backup', @mode = N'FULL'",
        es: "Mira las últimas copias (msdb.dbo.backupset) y el trabajo: EXEC msdb.dbo.sp_help_jobhistory @job_name = N'ERP_PROD - Log backup', @mode = N'FULL'" },
      { en: "Free the log with a log backup to the right share: BACKUP LOG ERP_PROD TO DISK = N'\\\\FS01\\SQLBackup\\ERP_PROD\\...trn' WITH COMPRESSION. Do not switch to SIMPLE.",
        es: "Libera el registro con una copia a la carpeta correcta: BACKUP LOG ERP_PROD TO DISK = N'\\\\FS01\\SQLBackup\\ERP_PROD\\...trn' WITH COMPRESSION. No pases a SIMPLE." },
      { en: "Point the job at FS01 (msdb.dbo.sp_update_jobstep ... @command = ...), run it with sp_start_job and check DBCC SQLPERF(LOGSPACE).",
        es: "Apunta el trabajo a FS01 (msdb.dbo.sp_update_jobstep ... @command = ...), ejecútalo con sp_start_job y comprueba DBCC SQLPERF(LOGSPACE)." },
    ],
    note: [
      { kb: "cause", label: { en: "the cause (log backup job writing to the switched-off FS-OLD01)", es: "la causa (el trabajo de copia del registro escribía en FS-OLD01, apagado)" },
        any: ["fs-old01", "log_backup", "network path", "ruta de red", "job failed", "trabajo fallaba", "9002"] },
      { kb: "fix", label: { en: "the fix (log backed up, job pointed at FS01)", es: "la solución (registro copiado, trabajo apuntando a FS01)" },
        any: ["backup log", "log backup", "copia del registro", "sp_update_jobstep", "fs01"] },
      { kb: "verify", label: { en: "how you checked it", es: "cómo lo comprobaste" }, any: ["sqlperf", "logspace", "1.2%", "1,2%", "succeeded", "correcta", "contabiliz"] },
      { kb: "followup", label: { en: "the follow-up (job failure alerts, restore chain kept)", es: "el seguimiento (alertas de fallo del trabajo, cadena de restauración intacta)" },
        any: ["alert", "alerta", "operator", "operador", "migration", "migracion", "chain", "cadena"] },
    ],
    solution: [
      "sqlcmd -S SQL-ERP01 -E -Q \"SELECT name, recovery_model_desc, log_reuse_wait_desc FROM sys.databases WHERE name = 'ERP_PROD'\"",
      "sqlcmd -S SQL-ERP01 -E -Q \"DBCC SQLPERF(LOGSPACE)\"",
      "sqlcmd -S SQL-ERP01 -E -Q \"SELECT TOP 5 type, backup_finish_date FROM msdb.dbo.backupset WHERE database_name = 'ERP_PROD' ORDER BY backup_finish_date DESC\"",
      "sqlcmd -S SQL-ERP01 -E -Q \"EXEC msdb.dbo.sp_help_jobhistory @job_name = N'ERP_PROD - Log backup', @mode = N'FULL'\"",
      "sqlcmd -S SQL-ERP01 -E -Q \"BACKUP LOG ERP_PROD TO DISK = N'\\\\FS01\\SQLBackup\\ERP_PROD\\ERP_PROD_LOG_20261028_0915.trn' WITH COMPRESSION\"",
      "sqlcmd -S SQL-ERP01 -E -Q \"EXEC msdb.dbo.sp_update_jobstep @job_name = N'ERP_PROD - Log backup', @step_id = 1, @command = N'DECLARE @f nvarchar(260) = N''\\\\FS01\\SQLBackup\\ERP_PROD\\ERP_PROD_LOG_'' + FORMAT(SYSDATETIME(), ''yyyyMMdd_HHmm'') + N''.trn''; BACKUP LOG ERP_PROD TO DISK = @f WITH COMPRESSION;'\"",
      "sqlcmd -S SQL-ERP01 -E -Q \"EXEC msdb.dbo.sp_start_job @job_name = N'ERP_PROD - Log backup'\"",
      "sqlcmd -S SQL-ERP01 -E -Q \"DBCC SQLPERF(LOGSPACE)\"",
    ],
    sampleNote: {
      en: "ERP_PROD log was full (error 9002, log_reuse_wait LOG_BACKUP): the job 'ERP_PROD - Log backup' had failed since 27/10 00:00 because it wrote to FS-OLD01, switched off after the file server migration. Took a log backup to \\\\FS01\\SQLBackup and fixed the job with sp_update_jobstep to point at FS01; the job run succeeded and DBCC SQLPERF(LOGSPACE) shows 1.2% used. Invoices post again. Kept FULL recovery so the restore chain is intact; proposing a job failure alert to the DBA operator and adding SQL jobs to the migration checklist.",
      es: "El registro de ERP_PROD estaba lleno (error 9002, log_reuse_wait LOG_BACKUP): el trabajo 'ERP_PROD - Log backup' fallaba desde el 27/10 a las 00:00 porque escribía en FS-OLD01, apagado tras la migración del servidor de ficheros. Hice una copia del registro a \\\\FS01\\SQLBackup y corregí el trabajo con sp_update_jobstep para que apunte a FS01; la ejecución del trabajo fue correcta y DBCC SQLPERF(LOGSPACE) muestra un 1,2% usado. Ya se contabilizan facturas. Mantuve la recuperación FULL, así que la cadena de restauración está intacta; propongo una alerta de fallo del trabajo al operador de DBA y añadir los trabajos SQL a la lista de la migración.",
    },
  });

  return scenarios;
});
