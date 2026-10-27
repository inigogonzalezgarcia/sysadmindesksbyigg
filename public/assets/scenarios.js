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
      { label: { en: "the cause (the task on FS-SCAN01 with her old password)", es: "la causa (la tarea en FS-SCAN01 con su contraseña antigua)" },
        any: ["scheduled task", "tarea programada", "scantofinance", "fs-scan01", "old password", "contraseña antigua", "contrasena anterior"] },
      { label: { en: "what you changed (task disabled, account unlocked)", es: "qué cambiaste (tarea deshabilitada, cuenta desbloqueada)" },
        any: ["disabl", "deshabilit", "desactiv", "unlock", "desbloque"] },
      { label: { en: "how you checked it", es: "cómo lo comprobaste" }, any: ["lockedout false", "checked", "verified", "comprob", "verific", "stays", "sigue"] },
      { label: { en: "the follow-up (service account, server owner)", es: "el seguimiento (cuenta de servicio, responsable del servidor)" },
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
      { label: { en: "the cause (public DNS set by hand at the hotel)", es: "la causa (DNS públicos puestos a mano en el hotel)" },
        any: ["8.8.8.8", "1.1.1.1", "static dns", "manual dns", "public dns", "dns publico", "dns estatico", "dns fijo", "dns manual", "a mano", "hotel"] },
      { label: { en: "the fix (back to DHCP, cache flushed)", es: "la solución (vuelta a DHCP, caché vaciada)" }, any: ["dhcp", "reset", "flushdns", "flush", "restablec", "cache"] },
      { label: { en: "how you checked it", es: "cómo lo comprobaste" }, any: ["ping", "nslookup", "test-netconnection", "resolve", "opens", "abre", "responde", "s: drive", "unidad s"] },
      { label: { en: "advice to the user for next time", es: "el consejo al usuario para la próxima vez" }, any: ["advised", "explained", "told", "next time", "expliqu", "avis", "aconsej", "proxima vez", "vpn"] },
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
      { label: { en: "what filled the disk", es: "qué llenaba el disco" }, any: ["temp", "softwaredistribution", "windows update", "add-in", "complemento"] },
      { label: { en: "what you deleted", es: "qué borraste" }, any: ["deleted", "removed", "cleaned", "emptied", "borr", "elimin", "limpi", "vaci"] },
      { label: { en: "the free space after", es: "el espacio libre después" }, any: ["gb", "free", "libre"] },
      { label: { en: "how to stop it happening again", es: "cómo evitar que vuelva a pasar" },
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
      { label: { en: "the cause (a corrupt job stuck in Deleting)", es: "la causa (un trabajo corrupto atascado en Eliminando)" },
        any: ["corrupt", "corrupto", "stuck", "atascad", "deleting", "eliminando", "312"] },
      { label: { en: "the fix (spooler stopped, spool files cleared)", es: "la solución (spooler parado, ficheros de cola borrados)" }, any: ["spooler", "spool", "printers folder", "carpeta printers"] },
      { label: { en: "how you checked it", es: "cómo lo comprobaste" }, any: ["test page", "pagina de prueba", "jobcount", "prints", "imprime", "empty", "vacia"] },
      { label: { en: "the impact (other queues paused, jobs to resend)", es: "el impacto (otras colas paradas, trabajos a reenviar)" },
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
      { label: { en: "the cause (mailbox at the 50 GB quota, NDR 5.2.2)", es: "la causa (buzón en la cuota de 50 GB, NDR 5.2.2)" }, any: ["50 gb", "quota", "cuota", "full", "lleno", "5.2.2"] },
      { label: { en: "the fix (archive enabled, retention run)", es: "la solución (archivo activado, retención ejecutada)" }, any: ["archive", "archivo", "managedfolder", "retention", "retencion"] },
      { label: { en: "how you checked it", es: "cómo lo comprobaste" }, any: ["gb free", "28", "statistics", "size", "tamano", "receives", "recibe", "test email", "correo de prueba"] },
      { label: { en: "the follow-up (customers to resend, quota alert)", es: "el seguimiento (clientes que reenvíen, alerta de cuota)" },
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
      { label: { en: "the cause (BitLocker off after the motherboard repair)", es: "la causa (BitLocker desactivado tras cambiar la placa)" },
        any: ["bitlocker", "encrypt", "cifrad", "decrypted", "descifr", "motherboard", "placa"] },
      { label: { en: "the fix (encryption enabled)", es: "la solución (cifrado activado)" }, any: ["enable-bitlocker", "enabled", "activ", "habilit", "encrypting", "cifrando"] },
      { label: { en: "the recovery key stored in Entra ID", es: "la clave de recuperación guardada en Entra ID" }, any: ["recovery", "recuperacion", "entra", "azure ad", "aad", "escrow"] },
      { label: { en: "how you checked compliance", es: "cómo comprobaste el cumplimiento" }, any: ["compliant", "cumple", "sync", "sincroniz", "outlook", "teams"] },
    ],
    solution: ["dsregcmd /status", "Get-BitLockerVolume -MountPoint C:", "Enable-BitLocker -MountPoint C: -EncryptionMethod XtsAes256 -UsedSpaceOnly -RecoveryPasswordProtector",
               "BackupToAAD-BitLockerKeyProtector -MountPoint C: -KeyProtectorId '{1A2B}'", "Get-ScheduledTask | ? TaskName -eq PushLaunch | Start-ScheduledTask",
               "Get-MgDeviceManagementManagedDevice -Filter \"deviceName eq 'LAPTOP-0388'\""],
    sampleNote: {
      en: "Device non-compliant because BitLocker was off after the motherboard replacement (FullyDecrypted). Enabled BitLocker (XtsAes256, TPM + recovery password) and backed up the recovery key to Entra ID. Forced an MDM sync: compliant again, Outlook and Teams open. Asked the repair partner to suspend, not decrypt, BitLocker in future repairs.",
      es: "El dispositivo no cumplía porque BitLocker quedó desactivado tras cambiar la placa base (FullyDecrypted). Activé BitLocker (XtsAes256, TPM + contraseña de recuperación) y guardé la clave de recuperación en Entra ID. Forcé la sincronización MDM: vuelve a cumplir y Outlook y Teams abren. Pedí al servicio técnico que en futuras reparaciones suspenda BitLocker en lugar de descifrar.",
    },
  });

  return scenarios;
});
