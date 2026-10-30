/* SysAdmin Desks by IGG - the documentation library (v0.8): one short reference article per area (what it is, the commands and tools
   you use in this simulator, common causes, good practice, where to practise it and the matching guides on inigogonzalezgarcia.github.io).
   Pure data and logic, no DOM: the app and the Node tests use the same code. tests/learning.test.js checks that every desk, lab and guide
   an article links to exists, that every command listed is understood where the article says, and that no article gives a desk away. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SDLibrary = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const GUIDE_BASE = "https://inigogonzalezgarcia.github.io/guias/";
  const t = (v, lang) => (v == null ? "" : typeof v === "string" ? v : v[lang] || v.en || "");
  const fold = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const guideUrl = (slug) => GUIDE_BASE + slug + ".html";

  // the ten areas; the profile (profile.js) uses the same ids
  const AREAS = [
    { id: "ad", icon: "◫", name: { en: "Active Directory", es: "Active Directory" } },
    { id: "windows", icon: "▭", name: { en: "Windows, DNS and DHCP", es: "Windows, DNS y DHCP" } },
    { id: "m365", icon: "✉", name: { en: "Microsoft 365 and Exchange", es: "Microsoft 365 y Exchange" } },
    { id: "endpoint", icon: "⛨", name: { en: "Intune and BitLocker", es: "Intune y BitLocker" } },
    { id: "linux", icon: "$", name: { en: "Linux", es: "Linux" } },
    { id: "vdi", icon: "▣", name: { en: "Citrix and VDI", es: "Citrix y VDI" } },
    { id: "data", icon: "⛁", name: { en: "Backup and SQL Server", es: "Copias y SQL Server" } },
    { id: "network", icon: "⌗", name: { en: "Network (Cisco, HP, FortiGate)", es: "Red (Cisco, HP, FortiGate)" } },
    { id: "hardware", icon: "⇪", name: { en: "Hardware and RMA", es: "Hardware y RMA" } },
    { id: "itsm", icon: "▤", name: { en: "Service desk process", es: "Proceso de service desk" } },
  ];

  /* An article: { id (= its area), title, summary, tags, what: {en: [paragraphs], es}, tools: [tool], causes: {en: [..], es}, tips: {en, es},
     desks: [desk ids], labs: [lab ids], guides: [slugs] }.
     A tool: { cmd (what you type, with <placeholders>), try (a real line the tests run, when cmd has placeholders), what: {en, es}, on }.
     on: "ad" (the Directory console and the AD lab), "lab:<id>" (that lab's console), "desk:<id>" (that ticket's console), a network
     device id (its CLI, in the network room and the network lab), or "page:#/..." (a page of the app; then there is no command). */
  const ARTICLES = [
    {
      id: "ad",
      title: { en: "Active Directory: accounts, groups and sign-in", es: "Active Directory: cuentas, grupos e inicio de sesión" },
      summary: { en: "The directory of contoso.local: what it keeps, how to read an account, unlock, reset, change groups and handle a leaver.",
        es: "El directorio de contoso.local: qué guarda, cómo leer una cuenta, desbloquear, restablecer, cambiar grupos y tramitar una baja." },
      tags: ["active directory", "ad", "ou", "gpo", "kerberos", "lockout", "bloqueo", "password", "contraseña", "grupo", "group", "leaver", "baja", "rsat", "entra connect"],
      what: {
        en: ["Active Directory keeps Contoso's users, groups and computers, in organisational units (OUs) under contoso.local. The domain controllers DC01 and DC02 check every sign-in; DC01 is the PDC emulator, the one that records account lockouts.",
          "Access is given with groups (GG-…): a group change reaches the user at their next sign-in, because the Kerberos ticket carries the groups. Microsoft Entra Connect copies the accounts of some OUs to Microsoft 365."],
        es: ["Active Directory guarda los usuarios, grupos y equipos de Contoso, en unidades organizativas (OU) bajo contoso.local. Los controladores de dominio DC01 y DC02 comprueban cada inicio de sesión; DC01 es el emulador de PDC, el que registra los bloqueos de cuenta.",
          "Los accesos se dan con grupos (GG-…): un cambio de grupo le llega al usuario en su siguiente inicio de sesión, porque el ticket de Kerberos lleva los grupos. Microsoft Entra Connect copia a Microsoft 365 las cuentas de algunas OU."],
      },
      tools: [
        { cmd: "Get-ADUser <user>", try: "Get-ADUser jruiz", on: "ad", what: { en: "The account: enabled, locked out, bad passwords, password last set, last sign-in.", es: "La cuenta: habilitada, bloqueada, contraseñas erróneas, último cambio de contraseña y último inicio de sesión." } },
        { cmd: "Search-ADAccount -LockedOut", on: "ad", what: { en: "Every locked-out account (-AccountDisabled for the disabled ones).", es: "Todas las cuentas bloqueadas (-AccountDisabled para las deshabilitadas)." } },
        { cmd: "Unlock-ADAccount <user>", try: "Unlock-ADAccount jruiz", on: "ad", what: { en: "Unlocks. It does not stop whatever locked the account.", es: "Desbloquea. No detiene lo que bloqueó la cuenta." } },
        { cmd: "Set-ADAccountPassword <user> -Reset", try: "Set-ADAccountPassword lperez -Reset", on: "ad", what: { en: "A new temporary password, set by an administrator.", es: "Una contraseña temporal nueva, puesta por un administrador." } },
        { cmd: "Set-ADUser <user> -ChangePasswordAtLogon $true", try: "Set-ADUser lperez -ChangePasswordAtLogon $true", on: "ad", what: { en: "The user chooses their own password at the next sign-in.", es: "El usuario elige su propia contraseña en el siguiente inicio de sesión." } },
        { cmd: "Add-ADGroupMember <group> -Members <user>", try: "Add-ADGroupMember GG-VPN-Users -Members eromero", on: "ad", what: { en: "Gives the access of a group (Remove-ADGroupMember takes it away).", es: "Da el acceso de un grupo (Remove-ADGroupMember lo quita)." } },
        { cmd: "Get-ADPrincipalGroupMembership <user>", try: "Get-ADPrincipalGroupMembership eromero", on: "ad", what: { en: "The groups a user is in.", es: "Los grupos de un usuario." } },
        { cmd: "Disable-ADAccount <user>", try: "Disable-ADAccount lnavarro", on: "ad", what: { en: "Stops sign-in without deleting anything (leavers).", es: "Impide iniciar sesión sin borrar nada (bajas)." } },
        { cmd: "Get-WinEvent -ComputerName DC01 -FilterHashtable @{LogName='Security'; Id=4740}", on: "desk:ad-lockout", what: { en: "Lockout events on the PDC emulator: which computer sent the bad passwords.", es: "Eventos de bloqueo en el emulador de PDC: qué equipo envió las contraseñas erróneas." } },
      ],
      causes: {
        en: ["The user typed an old password several times, or caps lock was on.", "A device or an app keeps a saved old password and retries it on its own: a phone, a mapped drive, a stored credential, something that runs without the user.",
          "The account is disabled or has expired (a leaver, a contractor's end date).", "The user is not in the group that gives the access, or the change was made and they have not signed in again.",
          "The object is in an OU that the policies or the synchronisation to Microsoft 365 do not cover."],
        es: ["El usuario escribió varias veces una contraseña antigua, o tenía el bloqueo de mayúsculas puesto.", "Un dispositivo o una aplicación guarda una contraseña antigua y la reintenta por su cuenta: un móvil, una unidad de red, una credencial guardada, algo que se ejecuta sin el usuario.",
          "La cuenta está deshabilitada o ha caducado (una baja, la fecha de fin de un externo).", "El usuario no está en el grupo que da el acceso, o el cambio se hizo y no ha vuelto a iniciar sesión.",
          "El objeto está en una OU que no cubren las directivas o la sincronización con Microsoft 365."],
      },
      tips: {
        en: ["Check who is calling before you unlock or reset: call back on the number in the directory.", "Give a temporary password by phone, never by email, with \"change at next sign-in\".",
          "Never ask a user for their password, not even to test.", "Unlocking is not the fix if the account locks again: find the source first."],
        es: ["Comprueba quién llama antes de desbloquear o restablecer: devuelve la llamada al número del directorio.", "La contraseña temporal se da por teléfono, nunca por correo, con «cambiar en el siguiente inicio de sesión».",
          "Nunca pidas a un usuario su contraseña, ni para probar.", "Desbloquear no es el arreglo si la cuenta se vuelve a bloquear: busca antes el origen."],
      },
      desks: ["ad-lockout", "aadc-sync", "leaver-return"], labs: ["ad"],
      guides: ["active-directory-alta-usuario-grupos", "active-directory-delegar-permisos-papelera-y-quien-ha-cambiado-este-usuario", "powershell-altas-masivas-en-active-directory-desde-csv-y-bajas-con-revision", "azure-ad-connect-forzar-sincronizacion-y-objetos-que-no-pasan"],
    },
    {
      id: "windows",
      title: { en: "Windows, DNS and DHCP on a user's PC", es: "Windows, DNS y DHCP en el equipo de un usuario" },
      summary: { en: "How a Contoso PC gets its address and finds names, and the first commands for network, services, disk space, printing and the event log.",
        es: "Cómo recibe un equipo de Contoso su dirección y encuentra los nombres, y los primeros comandos para red, servicios, espacio en disco, impresión y registro de eventos." },
      tags: ["windows", "dns", "dhcp", "ipconfig", "nslookup", "flushdns", "service", "servicio", "spooler", "disk", "disco", "event viewer", "visor de eventos", "printer", "impresora", "powershell"],
      what: {
        en: ["A Contoso PC gets its address, gateway and DNS servers from DHCP on DC01 (VLAN 140, 10.20.14.0/24). The DNS servers DC01 and DC02 (10.20.1.10 and .11) know the internal names, such as intranet.contoso.local, and forward the rest to the internet.",
          "Windows remembers DNS answers for a while (the DNS client cache). Services run in the background and can be stopped, started or set to start on their own. The event log keeps what Windows and the apps report."],
        es: ["Un equipo de Contoso recibe su dirección, su puerta de enlace y sus servidores DNS del DHCP de DC01 (VLAN 140, 10.20.14.0/24). Los servidores DNS DC01 y DC02 (10.20.1.10 y .11) conocen los nombres internos, como intranet.contoso.local, y reenvían el resto a internet.",
          "Windows recuerda las respuestas de DNS durante un tiempo (la caché del cliente DNS). Los servicios se ejecutan en segundo plano y se pueden parar, arrancar o configurar para que arranquen solos. El registro de eventos guarda lo que informan Windows y las aplicaciones."],
      },
      tools: [
        { cmd: "ipconfig /all", on: "lab:windows", what: { en: "Address, gateway, DNS servers and whether DHCP gave them.", es: "Dirección, puerta de enlace, servidores DNS y si los dio el DHCP." } },
        { cmd: "nslookup <name>", try: "nslookup intranet.contoso.local", on: "lab:windows", what: { en: "Asks the DNS server directly, without the PC's cache.", es: "Pregunta directamente al servidor DNS, sin la caché del equipo." } },
        { cmd: "ipconfig /flushdns", on: "lab:windows", what: { en: "Forgets the answers the PC remembers (Clear-DnsClientCache does the same).", es: "Olvida las respuestas que recuerda el equipo (Clear-DnsClientCache hace lo mismo)." } },
        { cmd: "Test-NetConnection <name> -Port 443", try: "Test-NetConnection intranet.contoso.local -Port 443", on: "lab:windows", what: { en: "Whether a name resolves and a port answers.", es: "Si un nombre se resuelve y un puerto responde." } },
        { cmd: "Get-Service <name>", try: "Get-Service Spooler", on: "lab:windows", what: { en: "A service's state; Restart-Service, Stop-Service and Start-Service change it.", es: "El estado de un servicio; Restart-Service, Stop-Service y Start-Service lo cambian." } },
        { cmd: "Get-PSDrive C", on: "lab:windows", what: { en: "Used and free space on C:.", es: "Espacio usado y libre en C:." } },
        { cmd: "Get-WinEvent -LogName System -MaxEvents 20", on: "lab:windows", what: { en: "The latest System events: errors and warnings with their source and ID.", es: "Los últimos eventos de Sistema: errores y advertencias con su origen e ID." } },
        { cmd: "Get-PrintJob -PrinterName <queue>", try: "Get-PrintJob -ComputerName PRT-SRV01 -PrinterName RECEPCION-MFP", on: "desk:print-queue", what: { en: "The jobs in a print queue and their status.", es: "Los trabajos de una cola de impresión y su estado." } },
      ],
      causes: {
        en: ["Name resolution: the PC asks a DNS server that does not know the internal names, uses an answer it remembered, or the record is missing.", "No DHCP lease: the PC gives itself a 169.254.x.x address and reaches nothing.",
          "A service is stopped, or set to Manual or Disabled after an update.", "C: is full of files Windows can rebuild (temporary files, caches) or of the user's own data.", "A print job in error holds the queue behind it."],
        es: ["Resolución de nombres: el equipo pregunta a un servidor DNS que no conoce los nombres internos, usa una respuesta que recordaba o falta el registro.", "Sin concesión de DHCP: el equipo se pone una dirección 169.254.x.x y no llega a nada.",
          "Un servicio está parado, o en Manual o Deshabilitado tras una actualización.", "C: está lleno de archivos que Windows vuelve a crear (temporales, cachés) o de datos del propio usuario.", "Un trabajo de impresión con error retiene la cola que tiene detrás."],
      },
      tips: {
        en: ["Look before you change: ipconfig /all, nslookup and the event log first.", "Clean only what Windows rebuilds; never delete the user's documents or OneDrive files.",
          "Leave every service as you found it: if you stop one to clean its cache, start it again.", "Prove the fix with what the user does (open the page, print the document), not only with a command."],
        es: ["Mira antes de cambiar: primero ipconfig /all, nslookup y el registro de eventos.", "Limpia solo lo que Windows vuelve a crear; nunca borres documentos del usuario ni archivos de OneDrive.",
          "Deja cada servicio como lo encontraste: si paras uno para limpiar su caché, vuelve a arrancarlo.", "Demuestra el arreglo con lo que hace el usuario (abrir la página, imprimir el documento), no solo con un comando."],
      },
      desks: ["dns-intranet", "disk-full", "print-queue", "vpn-anyconnect"], labs: ["windows"],
      guides: ["windows-diagnostico-basico-equipo-lento-o-con-errores", "dns-y-dhcp-en-windows-server-zonas-ambitos-conmutacion-y-un-equipo-sin-ip", "impresoras-instalar-impresora-de-red-y-cola-atascada", "windows-server-instalar-rol-parchear-y-leer-eventos"],
    },
    {
      id: "m365",
      title: { en: "Microsoft 365 and Exchange Online", es: "Microsoft 365 y Exchange Online" },
      summary: { en: "Licences, mailboxes and permissions with Microsoft Graph and Exchange Online PowerShell, and how identity and sign-in fit in.",
        es: "Licencias, buzones y permisos con Microsoft Graph y Exchange Online PowerShell, y cómo encajan la identidad y el inicio de sesión." },
      tags: ["microsoft 365", "m365", "office 365", "exchange", "graph", "licencia", "licence", "license", "buzon", "mailbox", "shared", "compartido", "fullaccess", "sendas", "entra", "conditional access", "acceso condicional", "sso"],
      what: {
        en: ["Contoso's users get Microsoft 365 through the group GG-M365-E3 (group-based licensing). Microsoft Graph PowerShell reads and changes users, licences and sign-ins; Exchange Online PowerShell reads and changes mailboxes and their permissions.",
          "A shared mailbox has no licence and nobody signs in to it: people use it through permissions. FullAccess opens it; SendAs (or Send on behalf) sends from it. Sign-in goes through Microsoft Entra ID, where Conditional Access can allow or block it."],
        es: ["Los usuarios de Contoso reciben Microsoft 365 a través del grupo GG-M365-E3 (licencias por grupo). Microsoft Graph PowerShell lee y cambia usuarios, licencias e inicios de sesión; Exchange Online PowerShell lee y cambia buzones y sus permisos.",
          "Un buzón compartido no tiene licencia y nadie inicia sesión en él: se usa con permisos. FullAccess lo abre; SendAs (o Enviar en nombre de) envía desde él. El inicio de sesión pasa por Microsoft Entra ID, donde el acceso condicional puede permitirlo o bloquearlo."],
      },
      tools: [
        { cmd: "Connect-MgGraph -Scopes User.Read.All", on: "lab:m365", what: { en: "Signs in to Microsoft Graph with the permissions you ask for.", es: "Inicia sesión en Microsoft Graph con los permisos que pidas." } },
        { cmd: "Get-MgSubscribedSku", on: "lab:m365", what: { en: "The licences the company owns and how many are in use.", es: "Las licencias que tiene la empresa y cuántas están en uso." } },
        { cmd: "Get-MgUserLicenseDetail -UserId <upn>", try: "Get-MgUserLicenseDetail -UserId eromero@contoso.com", on: "lab:m365", what: { en: "The licences one user has.", es: "Las licencias de un usuario." } },
        { cmd: "Connect-ExchangeOnline", on: "lab:m365", what: { en: "Opens Exchange Online PowerShell.", es: "Abre Exchange Online PowerShell." } },
        { cmd: "Get-EXOMailboxStatistics <user>", try: "Get-EXOMailboxStatistics jruiz", on: "lab:m365", what: { en: "Mailbox size and number of items.", es: "Tamaño del buzón y número de elementos." } },
        { cmd: "Get-MailboxPermission <mailbox>", try: "Get-MailboxPermission eventos", on: "lab:m365", what: { en: "Who has FullAccess to a mailbox.", es: "Quién tiene FullAccess a un buzón." } },
        { cmd: "Add-MailboxPermission <mailbox> -User <user> -AccessRights FullAccess", try: "Add-MailboxPermission eventos -User aortiz -AccessRights FullAccess", on: "lab:m365", what: { en: "Gives FullAccess (with automapping, it appears in Outlook on its own).", es: "Da FullAccess (con automapping aparece solo en Outlook)." } },
        { cmd: "Add-RecipientPermission <mailbox> -Trustee <user> -AccessRights SendAs", try: "Add-RecipientPermission eventos -Trustee aortiz -AccessRights SendAs", on: "lab:m365", what: { en: "Gives Send As: a different permission from FullAccess.", es: "Da Enviar como: un permiso distinto de FullAccess." } },
        { cmd: "Get-MgAuditLogSignIn -Filter \"userPrincipalName eq '<upn>'\"", try: "Get-MgAuditLogSignIn -Filter \"userPrincipalName eq 'psanchez@contoso.com'\" -Top 5", on: "desk:ca-blocked", what: { en: "Sign-in logs: result, app, location and the Conditional Access policies applied.", es: "Registros de inicio de sesión: resultado, aplicación, ubicación y las directivas de acceso condicional aplicadas." } },
      ],
      causes: {
        en: ["No free licences, or the user has no usage location.", "A licence assigned straight to the user instead of through the group (it stays when they leave the group).",
          "A mailbox over its quota, or the archive not in use.", "FullAccess and SendAs mixed up: one opens the mailbox, the other sends from it.",
          "The account was created in AD but not synchronised yet, or is in an OU that is not synchronised.", "Sign-in blocked by Conditional Access, or an SSO application whose settings do not match the application's."],
        es: ["No quedan licencias libres o el usuario no tiene ubicación de uso.", "Una licencia asignada directamente al usuario en lugar de por el grupo (se queda aunque salga del grupo).",
          "Un buzón por encima de su cuota, o el archivo sin usar.", "FullAccess y SendAs confundidos: uno abre el buzón y el otro envía desde él.",
          "La cuenta se creó en AD pero aún no se ha sincronizado, o está en una OU que no se sincroniza.", "Inicio de sesión bloqueado por el acceso condicional, o una aplicación con SSO cuya configuración no coincide con la de la aplicación."],
      },
      tips: {
        en: ["Read the error where it is shown: licence errors of a group show on the group, not on the user.", "Give permissions to the person who asked, after their manager approves; remove them on the leaving day.",
          "Conditional Access policies are Security's: an exception is a request, never an edit to the policy.", "Sign-in and permission changes can take minutes to apply: say so to the user."],
        es: ["Lee el error donde se muestra: los errores de licencia de un grupo aparecen en el grupo, no en el usuario.", "Da los permisos a quien los pidió, tras la aprobación de su responsable; quítalos el día de la baja.",
          "Las directivas de acceso condicional son de Seguridad: una excepción es una petición, nunca una edición de la directiva.", "Los cambios de inicio de sesión y de permisos pueden tardar minutos: díselo al usuario."],
      },
      desks: ["m365-licence", "shared-mailbox", "mailbox-full", "aadc-sync", "ca-blocked", "sso-saml"], labs: ["m365"],
      guides: ["microsoft-365-asignar-y-retirar-licencias", "outlook-exchange-online-buzon-compartido-permisos-autorespuesta", "microsoft-graph-primeras-consultas-con-powershell-y-un-informe-que-no-existe-en-el-portal",
        "entra-conditional-access-politicas-base-y-usuario-bloqueado", "entra-sso-saml-dar-de-alta-una-aplicacion-y-login-que-falla"],
    },
    {
      id: "endpoint",
      title: { en: "Intune, compliance, BitLocker and MECM", es: "Intune, cumplimiento, BitLocker y MECM" },
      summary: { en: "How Contoso laptops are joined and managed, what compliance checks, where the BitLocker recovery keys live and how software reaches a PC.",
        es: "Cómo se unen y gestionan los portátiles de Contoso, qué comprueba el cumplimiento, dónde están las claves de recuperación de BitLocker y cómo llega el software a un equipo." },
      tags: ["intune", "bitlocker", "compliance", "cumplimiento", "dsregcmd", "hybrid", "hibrido", "entra joined", "recovery key", "clave de recuperacion", "mecm", "sccm", "configuration manager", "company portal", "portal de empresa", "wipe"],
      what: {
        en: ["Most Contoso PCs are Microsoft Entra hybrid joined (in contoso.local and in Entra ID) and enrolled in Intune; a few laptops are Entra joined only. The compliance policy checks things such as encryption, the Windows version and Defender, and Conditional Access can block the Microsoft 365 apps on a device that does not comply.",
          "BitLocker encrypts the system drive; its recovery password must be backed up to the device in Entra ID before the laptop leaves the user's hands. Software for the hybrid PCs is deployed with Microsoft Configuration Manager (MECM)."],
        es: ["La mayoría de equipos de Contoso están unidos a Microsoft Entra en modo híbrido (en contoso.local y en Entra ID) e inscritos en Intune; algunos portátiles solo están unidos a Entra ID. La directiva de cumplimiento comprueba cosas como el cifrado, la versión de Windows y Defender, y el acceso condicional puede bloquear las apps de Microsoft 365 en un equipo que no cumple.",
          "BitLocker cifra la unidad del sistema; su contraseña de recuperación tiene que estar guardada en el dispositivo en Entra ID antes de que el portátil salga de manos del usuario. El software de los equipos híbridos se despliega con Microsoft Configuration Manager (MECM)."],
      },
      tools: [
        { cmd: "dsregcmd /status", on: "desk:intune-bitlocker", what: { en: "How the PC is joined (AzureAdJoined, DomainJoined) and its MDM enrolment.", es: "Cómo está unido el equipo (AzureAdJoined, DomainJoined) y su inscripción en MDM." } },
        { cmd: "Get-BitLockerVolume", on: "desk:intune-bitlocker", what: { en: "Encryption state and protectors of each drive (manage-bde -status says the same).", es: "Estado del cifrado y protectores de cada unidad (manage-bde -status dice lo mismo)." } },
        { cmd: "manage-bde -protectors -get C:", on: "desk:laptop-rma", what: { en: "The protectors of C:, with the ID of the recovery password.", es: "Los protectores de C:, con el ID de la contraseña de recuperación." } },
        { cmd: "BackupToAAD-BitLockerKeyProtector -MountPoint C: -KeyProtectorId <id>", try: "BackupToAAD-BitLockerKeyProtector -MountPoint C: -KeyProtectorId {id}", on: "desk:intune-bitlocker", what: { en: "Backs up the recovery password to the device in Entra ID.", es: "Guarda la contraseña de recuperación en el dispositivo en Entra ID." } },
        { cmd: "Get-MgDeviceManagementManagedDevice", on: "desk:intune-bitlocker", what: { en: "Intune's view of the device: compliance state and last sync.", es: "Lo que Intune sabe del dispositivo: estado de cumplimiento y última sincronización." } },
        { cmd: "Get-CMDeployment", on: "desk:mecm-app", what: { en: "MECM deployments and how many devices succeeded or failed.", es: "Despliegues de MECM y cuántos equipos lo lograron o fallaron." } },
      ],
      causes: {
        en: ["The device does not meet a compliance setting (encryption, OS version, antivirus).", "It was fixed but has not synchronised yet, so Intune still shows the old state.",
          "The BitLocker recovery key was never backed up to Entra ID.", "An application deployment whose detection rule does not match what the installer really installs, or whose content is not on the distribution point."],
        es: ["El equipo no cumple un ajuste de cumplimiento (cifrado, versión del sistema, antivirus).", "Se arregló pero aún no se ha sincronizado, así que Intune sigue mostrando el estado anterior.",
          "La clave de recuperación de BitLocker nunca se guardó en Entra ID.", "Un despliegue de aplicación cuya regla de detección no coincide con lo que instala de verdad el instalador, o cuyo contenido no está en el punto de distribución."],
      },
      tips: {
        en: ["Give a recovery key only to the device's user, after checking who they are, and write it in the ticket.", "Check the key is in Entra ID before a laptop goes for repair, to a vendor or to another user.",
          "After a fix, sync the device and check its state again before you close."],
        es: ["Da una clave de recuperación solo al usuario del equipo, tras comprobar quién es, y anótalo en el ticket.", "Comprueba que la clave está en Entra ID antes de que un portátil vaya a reparar, al fabricante o a otro usuario.",
          "Tras un arreglo, sincroniza el equipo y vuelve a mirar su estado antes de cerrar."],
      },
      desks: ["intune-bitlocker", "mecm-app", "laptop-rma", "leaver-return"], labs: [],
      guides: ["intune-perfiles-y-cumplimiento-en-windows-macos-ios-android-y-dispositivo-que-no-cumple", "bitlocker-estado-y-clave-de-recuperacion", "mecm-sccm-empaquetar-una-aplicacion-y-desplegarla",
        "intune-anillos-de-windows-update-plazos-actualizaciones-urgentes-y-un-equipo-que-no-se-parchea"],
    },
    {
      id: "linux",
      title: { en: "Linux servers (Red Hat Enterprise Linux)", es: "Servidores Linux (Red Hat Enterprise Linux)" },
      summary: { en: "Working safely on a RHEL server: disk space, services and their logs, listening ports, the firewall and the join to Active Directory.",
        es: "Trabajar con cuidado en un servidor RHEL: espacio en disco, servicios y sus registros, puertos a la escucha, el cortafuegos y la unión a Active Directory." },
      tags: ["linux", "rhel", "red hat", "bash", "df", "du", "systemctl", "journalctl", "ss", "firewalld", "firewall-cmd", "sssd", "realm", "sudo", "nginx"],
      what: {
        en: ["Contoso's Linux servers run Red Hat Enterprise Linux 9. You sign in by SSH with your own account and use sudo; every sudo command is logged. Services are systemd units: systemctl starts, stops and shows them, and journalctl reads their logs.",
          "The firewall is firewalld. Some servers are joined to Active Directory with SSSD (realm), so domain users can sign in with their AD account."],
        es: ["Los servidores Linux de Contoso usan Red Hat Enterprise Linux 9. Se entra por SSH con tu cuenta y se usa sudo; cada orden con sudo queda registrada. Los servicios son unidades de systemd: systemctl los arranca, los para y los muestra, y journalctl lee sus registros.",
          "El cortafuegos es firewalld. Algunos servidores están unidos a Active Directory con SSSD (realm), para que los usuarios del dominio entren con su cuenta de AD."],
      },
      tools: [
        { cmd: "df -h", on: "lab:linux", what: { en: "Used and free space on each filesystem.", es: "Espacio usado y libre en cada sistema de archivos." } },
        { cmd: "sudo du -sh /var/*", on: "lab:linux", what: { en: "What takes the space inside a folder.", es: "Qué ocupa el espacio dentro de una carpeta." } },
        { cmd: "systemctl status <service>", try: "systemctl status nginx", on: "lab:linux", what: { en: "Whether a service is running, since when, and its last log lines.", es: "Si un servicio está en marcha, desde cuándo, y sus últimas líneas de registro." } },
        { cmd: "journalctl -u <service>", try: "journalctl -u nginx", on: "lab:linux", what: { en: "The full log of a service.", es: "El registro completo de un servicio." } },
        { cmd: "ss -tlnp", on: "lab:linux", what: { en: "The TCP ports listening and which process owns each one.", es: "Los puertos TCP a la escucha y qué proceso tiene cada uno." } },
        { cmd: "firewall-cmd --permanent --add-service=<service>", try: "firewall-cmd --permanent --add-service=https", on: "lab:linux", what: { en: "A permanent rule: it applies after firewall-cmd --reload.", es: "Una regla permanente: se aplica tras firewall-cmd --reload." } },
        { cmd: "timedatectl", on: "lab:linux", what: { en: "The clock, the time zone and whether it is synchronised.", es: "La hora, la zona horaria y si está sincronizada." } },
        { cmd: "realm list", on: "desk:linux-sssd", what: { en: "The domain the server is joined to and who may sign in.", es: "El dominio al que está unido el servidor y quién puede entrar." } },
      ],
      causes: {
        en: ["A filesystem fills up, very often with logs or old files.", "A service fails after a configuration change: systemctl status and journalctl say why.",
          "A firewall rule added without --permanent, lost at the next reload or reboot, or one that was never reloaded.", "Permissions or SELinux block a service from reading a file.", "Domain sign-in fails while local accounts work: look at SSSD and what it logs."],
        es: ["Un sistema de archivos se llena, muy a menudo de registros o de archivos antiguos.", "Un servicio falla tras un cambio de configuración: systemctl status y journalctl dicen por qué.",
          "Una regla del cortafuegos añadida sin --permanent, que se pierde en la siguiente recarga o reinicio, o una que nunca se recargó.", "Los permisos o SELinux impiden a un servicio leer un archivo.", "El inicio de sesión del dominio falla y las cuentas locales funcionan: mira SSSD y lo que registra."],
      },
      tips: {
        en: ["Look before you change: uptime, df -h, systemctl status, journalctl.", "Do not delete a log a service is writing; rotate it or ask the service to reopen it.",
          "Change one thing at a time and write down what you changed."],
        es: ["Mira antes de cambiar: uptime, df -h, systemctl status, journalctl.", "No borres un registro que un servicio está escribiendo; rótalo o pide al servicio que lo vuelva a abrir.",
          "Cambia una cosa cada vez y apunta qué has cambiado."],
      },
      desks: ["rhel-var-full", "linux-sssd"], labs: ["linux"],
      guides: ["rhel-registrar-parchear-servicios-firewall-selinux", "linux-unir-un-servidor-a-active-directory-con-sssd", "ubuntu-server-usuarios-ssh-firewall-y-actualizaciones", "bash-primer-script-de-comprobacion-de-un-servidor"],
    },
    {
      id: "vdi",
      title: { en: "Citrix Virtual Apps and Desktops", es: "Citrix Virtual Apps and Desktops" },
      summary: { en: "How a Citrix session reaches a user, the Broker PowerShell commands on the Delivery Controller and what to check when a session will not open.",
        es: "Cómo llega una sesión de Citrix a un usuario, los comandos de Broker PowerShell en el Delivery Controller y qué mirar cuando una sesión no abre." },
      tags: ["citrix", "vdi", "vda", "delivery controller", "ddc", "broker", "session", "sesion", "maintenance mode", "modo mantenimiento", "workspace", "horizon", "avd"],
      what: {
        en: ["The Delivery Controller (CTX-DDC01) brokers each session: it picks a VDA (the server or desktop that runs the apps) that is registered and not in maintenance mode, and the user connects to it with Citrix Workspace.",
          "From the Delivery Controller, the Citrix Broker PowerShell snap-in shows the sessions and the machines, and puts a machine into or out of maintenance mode."],
        es: ["El Delivery Controller (CTX-DDC01) reparte cada sesión: elige un VDA (el servidor o escritorio que ejecuta las aplicaciones) que esté registrado y no en modo mantenimiento, y el usuario se conecta a él con Citrix Workspace.",
          "Desde el Delivery Controller, el complemento Citrix Broker PowerShell muestra las sesiones y las máquinas, y pone una máquina en modo mantenimiento o la saca."],
      },
      tools: [
        { cmd: "Add-PSSnapin Citrix*", on: "desk:citrix-session", what: { en: "Loads the Citrix commands in PowerShell.", es: "Carga los comandos de Citrix en PowerShell." } },
        { cmd: "Get-BrokerSession", on: "desk:citrix-session", what: { en: "The sessions: user, machine and state (Active, Disconnected…).", es: "Las sesiones: usuario, máquina y estado (Active, Disconnected…)." } },
        { cmd: "Get-BrokerMachine", on: "desk:citrix-session", what: { en: "The VDAs: registration state, maintenance mode and load.", es: "Los VDA: estado de registro, modo mantenimiento y carga." } },
        { cmd: "Set-BrokerMachine <machine> -InMaintenanceMode $true", try: "Set-BrokerMachine CONTOSO\\CTX-VDA03 -InMaintenanceMode $true", on: "desk:citrix-session", what: { en: "Stops new sessions on a machine (existing ones carry on).", es: "Impide sesiones nuevas en una máquina (las que hay siguen)." } },
      ],
      causes: {
        en: ["A VDA that is unregistered: its service, its DNS or its time.", "A machine left in maintenance mode, or one that receives sessions it should not.",
          "A disconnected session stuck on one VDA that the user keeps reconnecting to.", "Profile or licence problems."],
        es: ["Un VDA que no está registrado: su servicio, su DNS o su hora.", "Una máquina olvidada en modo mantenimiento, o una que recibe sesiones que no debería.",
          "Una sesión desconectada atascada en un VDA al que el usuario se sigue reconectando.", "Problemas de perfil o de licencias."],
      },
      tips: {
        en: ["Put a machine in maintenance mode before you work on it, and take it out when you finish.", "Ending a session can lose unsaved work: tell the user first.",
          "Find out whether it is one user, one machine or everyone before you change anything."],
        es: ["Pon una máquina en modo mantenimiento antes de trabajar en ella y sácala al terminar.", "Cerrar una sesión puede perder trabajo sin guardar: avisa antes al usuario.",
          "Averigua si le pasa a un usuario, a una máquina o a todos antes de cambiar nada."],
      },
      desks: ["citrix-session"], labs: [],
      guides: ["citrix-vdi-publicar-aplicacion-y-sesion-que-no-abre", "vmware-horizon-pool-de-escritorios-y-conexion-que-falla", "azure-virtual-desktop-y-windows-365-host-pool-cloud-pc-y-conexion-que-falla"],
    },
    {
      id: "data",
      title: { en: "Backups (Veeam) and SQL Server", es: "Copias de seguridad (Veeam) y SQL Server" },
      summary: { en: "Veeam jobs, sessions and repositories, the SQL Server recovery models and how to see what is filling a transaction log.",
        es: "Jobs, sesiones y repositorios de Veeam, los modelos de recuperación de SQL Server y cómo ver qué está llenando un registro de transacciones." },
      tags: ["backup", "copia", "veeam", "vbr", "restore", "restauracion", "repository", "repositorio", "sql server", "sqlcmd", "transaction log", "registro de transacciones", "recovery model", "erp"],
      what: {
        en: ["Contoso's servers are backed up with Veeam Backup & Replication on VBR01: each job copies some machines to a repository on a schedule and keeps a number of restore points. The service desk reads the backup report every morning.",
          "SQL Server databases use a recovery model. In the FULL model the transaction log keeps every change until a log backup, which allows a restore to a point in time. sys.databases says what each log is waiting for (log_reuse_wait_desc)."],
        es: ["Los servidores de Contoso se copian con Veeam Backup & Replication en VBR01: cada job copia unas máquinas a un repositorio según un horario y guarda un número de puntos de restauración. El service desk lee cada mañana el informe de copias.",
          "Las bases de datos de SQL Server usan un modelo de recuperación. En el modelo FULL el registro de transacciones guarda cada cambio hasta una copia del registro, lo que permite restaurar a un momento concreto. sys.databases dice qué espera cada registro (log_reuse_wait_desc)."],
      },
      tools: [
        { cmd: "Get-VBRJob", on: "desk:veeam-job", what: { en: "The backup jobs and their last result.", es: "Los jobs de copia y su último resultado." } },
        { cmd: "Get-VBRBackupSession", on: "desk:veeam-job", what: { en: "The runs of the jobs, with their result and when.", es: "Las ejecuciones de los jobs, con su resultado y cuándo." } },
        { cmd: "Get-VBRBackupRepository", on: "desk:veeam-job", what: { en: "The repositories, their size and free space.", es: "Los repositorios, su tamaño y espacio libre." } },
        { cmd: "sqlcmd -S <server> -Q \"DBCC SQLPERF(LOGSPACE)\"", try: "sqlcmd -S SQL-ERP01 -Q \"DBCC SQLPERF(LOGSPACE)\"", on: "desk:sql-log-full", what: { en: "How full each database's transaction log is.", es: "Cómo de lleno está el registro de transacciones de cada base de datos." } },
        { cmd: "sqlcmd -S <server> -Q \"SELECT name, recovery_model_desc, log_reuse_wait_desc FROM sys.databases\"", try: "sqlcmd -S SQL-ERP01 -Q \"SELECT name, recovery_model_desc, log_reuse_wait_desc FROM sys.databases\"", on: "desk:sql-log-full", what: { en: "Each database's recovery model and what its log is waiting for.", es: "El modelo de recuperación de cada base de datos y qué espera su registro." } },
        { cmd: "sqlcmd -S <server> -Q \"SELECT TOP 5 database_name, type, backup_finish_date FROM msdb.dbo.backupset ORDER BY backup_finish_date DESC\"", try: "sqlcmd -S SQL-ERP01 -Q \"SELECT TOP 5 database_name, type, backup_finish_date FROM msdb.dbo.backupset ORDER BY backup_finish_date DESC\"", on: "desk:sql-log-full", what: { en: "The latest backups (D full, I differential, L log).", es: "Las últimas copias (D completa, I diferencial, L registro)." } },
      ],
      causes: {
        en: ["A repository without free space, or a target the job cannot reach.", "Credentials or permissions the job uses that changed.", "Retention keeping more restore points than the space allows.",
          "In FULL recovery, a log that cannot be reused until something happens: log_reuse_wait_desc says what (LOG_BACKUP, ACTIVE_TRANSACTION, REPLICATION…)."],
        es: ["Un repositorio sin espacio libre, o un destino al que el job no llega.", "Credenciales o permisos del job que han cambiado.", "Una retención que guarda más puntos de restauración de los que caben.",
          "En recuperación FULL, un registro que no se puede reutilizar hasta que pase algo: log_reuse_wait_desc dice qué (LOG_BACKUP, ACTIVE_TRANSACTION, REPLICATION…)."],
      },
      tips: {
        en: ["Never delete restore points of a job that still exists just to make room.", "Find what holds the space before you free any: changing a production database's settings is a change, not a quick fix.",
          "A backup is only proven by a restore test."],
        es: ["Nunca borres puntos de restauración de un job que sigue existiendo solo para hacer sitio.", "Averigua qué retiene el espacio antes de liberarlo: cambiar la configuración de una base de datos de producción es un cambio, no un arreglo rápido.",
          "Una copia solo se demuestra con una prueba de restauración."],
      },
      desks: ["veeam-job", "sql-log-full"], labs: [],
      guides: ["veeam-crear-un-job-comprobar-copias-y-restaurar", "sql-server-copias-y-restauracion-de-la-base-de-datos-del-erp", "postgresql-mysql-sql-server-tareas-de-operaciones-copia-restauracion-espacio-y-consulta-lenta", "backup-en-cinta-rotacion-gfs-custodia-y-comprobacion-de-copias"],
    },
    {
      id: "network",
      title: { en: "Network: Cisco, HP Aruba and FortiGate", es: "Red: Cisco, HP Aruba y FortiGate" },
      summary: { en: "Contoso's VLANs, the switches, the branch router and the firewall, and the CLI commands to find a device, change a port, save and trace traffic.",
        es: "Las VLAN de Contoso, los switches, el router de la sucursal y el cortafuegos, y los comandos de CLI para encontrar un equipo, cambiar un puerto, guardar y seguir el tráfico." },
      tags: ["red", "network", "vlan", "cisco", "ios", "aruba", "hp", "fortigate", "fortios", "switch", "mac", "err-disabled", "bpdu", "trunk", "troncal", "write memory", "debug flow", "policy", "politica", "ssh"],
      what: {
        en: ["Head office uses 10.20.0.0/16 and the Valencia branch 10.40.0.0/16. Each VLAN is a /24: 10 servers, 30 printers, 99 management, 140 users, 150 voice, and 999 for unused (parked) ports. The core switch SW-CORE-01 routes between them; the access switches SW-ACC-2F (Cisco) and SW-ACC-1F (HP Aruba) give the user ports.",
          "You reach every device by SSH from the admin workstation ADM-WS01. A switch keeps a running configuration and a saved (startup) one: a change is lost after a reboot until you save it. The FortiGate FGT-HQ-01 checks its policies in order, the first match wins, and the rest is dropped by the implicit deny."],
        es: ["La sede usa 10.20.0.0/16 y la sucursal de Valencia 10.40.0.0/16. Cada VLAN es una /24: 10 servidores, 30 impresoras, 99 gestión, 140 usuarios, 150 voz, y la 999 para los puertos sin uso (aparcados). El switch de núcleo SW-CORE-01 enruta entre ellas; los switches de acceso SW-ACC-2F (Cisco) y SW-ACC-1F (HP Aruba) dan los puertos de usuario.",
          "A todos los equipos se entra por SSH desde el equipo de administración ADM-WS01. Un switch tiene una configuración en ejecución y otra guardada (startup): un cambio se pierde tras un reinicio hasta que lo guardas. El FortiGate FGT-HQ-01 revisa sus políticas en orden, gana la primera que coincide y el resto lo descarta la denegación implícita."],
      },
      tools: [
        { cmd: "show interfaces status", on: "SW-ACC-2F", what: { en: "Every port: description, status, VLAN, speed (Cisco).", es: "Cada puerto: descripción, estado, VLAN y velocidad (Cisco)." } },
        { cmd: "show interfaces status err-disabled", on: "SW-ACC-2F", what: { en: "Ports shut down by a protection, with the reason.", es: "Puertos apagados por una protección, con el motivo." } },
        { cmd: "show mac address-table address <mac>", try: "show mac address-table address 6c4b.9042.1a24", on: "SW-CORE-01", what: { en: "On which port a MAC address was learned: follow it switch by switch.", es: "En qué puerto se aprendió una dirección MAC: síguela de switch en switch." } },
        { cmd: "show cdp neighbors / show lldp neighbors", try: "show lldp neighbors", on: "SW-CORE-01", what: { en: "What is connected to each port (switches, phones, printers).", es: "Qué hay conectado a cada puerto (switches, teléfonos, impresoras)." } },
        { cmd: "show vlan brief", on: "SW-ACC-2F", what: { en: "The VLANs and their access ports.", es: "Las VLAN y sus puertos de acceso." } },
        { cmd: "show logging", on: "SW-ACC-2F", what: { en: "The switch's log: ports up and down, protections.", es: "El registro del switch: puertos que suben y bajan, protecciones." } },
        { cmd: "write memory", on: "SW-ACC-2F", what: { en: "Saves the running configuration (copy running-config startup-config).", es: "Guarda la configuración en ejecución (copy running-config startup-config)." } },
        { cmd: "show vlans ports <ports> detail", try: "show vlans ports 5 detail", on: "SW-ACC-1F", what: { en: "The VLANs of a port on the HP Aruba: untagged and tagged.", es: "Las VLAN de un puerto en el HP Aruba: untagged y tagged." } },
        { cmd: "show mac-address <mac>", try: "show mac-address f4a8.0d31.2217", on: "SW-ACC-1F", what: { en: "Where a MAC address is, on the HP Aruba.", es: "Dónde está una dirección MAC, en el HP Aruba." } },
        { cmd: "show firewall policy", on: "FGT-HQ-01", what: { en: "The FortiGate policies, in order.", es: "Las políticas del FortiGate, en orden." } },
        { cmd: "diagnose debug flow filter addr <ip>", try: "diagnose debug flow filter addr 10.40.10.23", on: "FGT-HQ-01", what: { en: "With diagnose debug enable and … trace start, shows which policy allows or denies a flow.", es: "Con diagnose debug enable y … trace start, muestra qué política permite o deniega un flujo." } },
        { cmd: "show crypto session", on: "RTR-VLC-01", what: { en: "The state of the IPsec tunnel to head office.", es: "El estado del túnel IPsec a la sede." } },
      ],
      causes: {
        en: ["A port shut down by a protection (err-disabled) or by hand.", "A port in the wrong VLAN for what is plugged in, or a device moved to another socket.",
          "A change made but not saved, lost after a reboot.", "A firewall policy above the right one that matches first, or an address object that points at the wrong host.", "A tunnel or an uplink down."],
        es: ["Un puerto apagado por una protección (err-disabled) o a mano.", "Un puerto en una VLAN que no corresponde a lo que tiene conectado, o un equipo que cambió de toma.",
          "Un cambio hecho pero no guardado, que se pierde tras un reinicio.", "Una política del cortafuegos por encima de la buena que coincide antes, o un objeto de dirección que apunta a otro equipo.", "Un túnel o un enlace de subida caído."],
      },
      tips: {
        en: ["Read the log and the port status before you shut or unshut anything.", "Change the smallest thing that works; on a firewall, no any-any policies.",
          "Write the change reference in the port description or the policy comments.", "Save the configuration and prove it with the user's device, not only with a ping from the switch."],
        es: ["Lee el registro y el estado del puerto antes de apagar o encender nada.", "Cambia lo mínimo que funcione; en un cortafuegos, nada de políticas any-any.",
          "Escribe la referencia del cambio en la descripción del puerto o en los comentarios de la política.", "Guarda la configuración y demuéstralo con el equipo del usuario, no solo con un ping desde el switch."],
      },
      desks: ["net-err-disabled", "net-wrong-vlan", "net-fortigate-branch", "net-psu-rma"], labs: ["network"],
      guides: ["cisco-primeros-comandos-copia-de-configuracion-y-un-puerto-err-disabled", "cisco-vlans-troncales-router-de-la-sede-y-un-puerto-que-no-da-red", "switches-hp-aruba-vlans-copia-de-configuracion-firmware-y-puerto-a-100-mb",
        "fortigate-politicas-con-minimo-privilegio-vpn-con-entra-id-tuneles-entre-sedes-y-un-usuario-que-no-llega", "lan-wan-y-wifi-conectar-plantas-y-sedes-de-varios-paises"],
    },
    {
      id: "hardware",
      title: { en: "Hardware, warranty and RMA", es: "Hardware, garantía y RMA" },
      summary: { en: "From a failing part to a closed RMA: the evidence a vendor asks for, protecting the data, loans, couriers and the asset register.",
        es: "De una pieza que falla a un RMA cerrado: las pruebas que pide el fabricante, proteger los datos, préstamos, mensajería y el registro de activos." },
      tags: ["hardware", "rma", "garantia", "warranty", "smart", "disk", "disco", "power supply", "fuente", "psu", "courier", "mensajeria", "loan", "prestamo", "asset", "activo", "inventario", "leaver"],
      what: {
        en: ["An RMA (return merchandise authorisation) is the vendor's case for a faulty part under warranty or a support contract. The vendor asks for the serial number and evidence: a diagnostics code, a log line, a SMART status. Some contracts send the replacement before the faulty unit comes back (advance replacement).",
          "Before a device leaves the user, protect the data: the BitLocker recovery key in Entra ID, the drive wiped, encrypted, or kept by the company if the contract allows it. Every movement goes into the asset register: in use, in RMA, on loan, in stock."],
        es: ["Un RMA (autorización de devolución) es el caso del fabricante para una pieza averiada en garantía o con contrato de soporte. El fabricante pide el número de serie y pruebas: un código de diagnóstico, una línea del registro, el estado SMART. Algunos contratos envían la pieza de sustitución antes de que vuelva la averiada (sustitución anticipada).",
          "Antes de que un equipo salga de manos del usuario, protege los datos: la clave de recuperación de BitLocker en Entra ID, el disco borrado, cifrado o retenido por la empresa si el contrato lo permite. Cada movimiento va al registro de activos: en uso, en RMA, en préstamo, en almacén."],
      },
      tools: [
        { cmd: "Get-PhysicalDisk | Get-StorageReliabilityCounter", on: "desk:laptop-rma", what: { en: "Health and error counters of a drive.", es: "Salud y contadores de errores de un disco." } },
        { cmd: "show environment power", on: "SW-CORE-01", what: { en: "A switch's power supplies: model, serial and status.", es: "Las fuentes de alimentación de un switch: modelo, serie y estado." } },
        { cmd: "Shipments", on: "page:#/shipping", what: { en: "RMAs, shipments, returns and loans, with the carrier's tracking.", es: "RMA, envíos, devoluciones y préstamos, con el seguimiento de la mensajería." } },
        { cmd: "Inventory · Endpoints", on: "page:#/inventory", what: { en: "Every device and its state in the asset register.", es: "Cada equipo y su estado en el registro de activos." } },
      ],
      causes: {
        en: ["A drive that reports SMART errors or fails the vendor's diagnostics.", "A failed power supply on a device with two: it keeps running, without redundancy.",
          "A part damaged in transit, or a shipment lost: then it is a claim with the carrier.", "A leaver's equipment that nobody collected or registered."],
        es: ["Un disco que informa errores SMART o falla el diagnóstico del fabricante.", "Una fuente de alimentación averiada en un equipo con dos: sigue funcionando, sin redundancia.",
          "Una pieza dañada en el transporte o un envío perdido: entonces es una reclamación a la mensajería.", "El equipo de una baja que nadie recogió ni registró."],
      },
      tips: {
        en: ["Rule out the simple causes first (the cable, the power feed) and keep the evidence.", "Check the warranty or contract and the serial number before you open the case.",
          "Never ship a laptop whose recovery key is not in Entra ID.", "Close the RMA only when the faulty unit is returned and the register is updated."],
        es: ["Descarta primero lo sencillo (el cable, la alimentación) y guarda las pruebas.", "Comprueba la garantía o el contrato y el número de serie antes de abrir el caso.",
          "Nunca envíes un portátil cuya clave de recuperación no esté en Entra ID.", "Cierra el RMA solo cuando la pieza averiada se ha devuelto y el registro está al día."],
      },
      desks: ["laptop-rma", "net-psu-rma", "leaver-return"], labs: [],
      guides: ["bitlocker-estado-y-clave-de-recuperacion", "idrac-e-ilo-gestion-fuera-de-banda-red-usuarios-consola-firmware-y-alertas", "device42-inventario-de-racks-y-equipos-de-la-sala-de-comunicaciones", "monitorizacion-desplegar-alarmas-y-responder-en-plataformas-24x7"],
    },
    {
      id: "itsm",
      title: { en: "The service desk process: states, SLA, notes and communication", es: "El proceso de service desk: estados, SLA, notas y comunicación" },
      summary: { en: "How a ticket moves from New to Closed, what the SLA measures, what a good work note and a good note to the user say, and how to talk to the requester.",
        es: "Cómo pasa un ticket de Nuevo a Cerrado, qué mide el SLA, qué dicen una buena nota de trabajo y una buena nota para el usuario, y cómo hablar con el solicitante." },
      tags: ["itsm", "itil", "ticket", "sla", "pending", "pendiente", "state", "estado", "work note", "nota de trabajo", "user note", "nota al usuario", "communication", "comunicacion", "change", "cambio", "escalation", "escalado"],
      what: {
        en: ["A ticket is New until someone assigns it, In progress while they work on it, Pending user or Pending vendor while it waits for someone else, and Closed when the service is back and proven. In this simulator the SLA starts when you assign the ticket (20 minutes for a P1, 30 for a P2, 45 for a P3) and pauses while the ticket is pending with a reason.",
          "Two notes close a ticket: the work note, for the next engineer (cause, change, verification, follow-up), and the note to the user, in plain words (what was wrong, what they have to do, nothing internal). A fix brings a service back to how it should be; a change alters how it works for everybody and needs approval."],
        es: ["Un ticket está Nuevo hasta que alguien se lo asigna, En curso mientras se trabaja, Pendiente del usuario o Pendiente del proveedor mientras espera a otro, y Cerrado cuando el servicio ha vuelto y está comprobado. En este simulador el SLA empieza al asignarte el ticket (20 minutos para una P1, 30 para una P2, 45 para una P3) y se pausa mientras el ticket está pendiente con un motivo.",
          "Dos notas cierran un ticket: la nota de trabajo, para el siguiente técnico (causa, cambio, comprobación y seguimiento), y la nota para el usuario, en palabras sencillas (qué pasaba, qué tiene que hacer, nada interno). Un arreglo devuelve un servicio a como debe estar; un cambio altera cómo funciona para todos y necesita aprobación."],
      },
      tools: [
        { cmd: "Tickets", on: "page:#/", what: { en: "The queue: priority, SLA, state and assignee.", es: "La cola: prioridad, SLA, estado y asignado." } },
        { cmd: "Mail", on: "page:#/mail", what: { en: "Triage messages: requests, notices and phishing.", es: "Clasificar mensajes: peticiones, avisos y phishing." } },
        { cmd: "Knowledge base", on: "page:#/kb", what: { en: "Your closed tickets as articles, from your own notes.", es: "Tus tickets cerrados como artículos, a partir de tus notas." } },
        { cmd: "Progress", on: "page:#/progress", what: { en: "Streak, weekly goal, badges and communication.", es: "Racha, objetivo semanal, insignias y comunicación." } },
      ],
      causes: {
        en: ["Closing on the symptom: the account is unlocked, but whatever locked it is still there.", "No verification: \"it should work now\" without proof.",
          "Leaving a ticket in progress while waiting for the user or a vendor, so the SLA runs.", "Asking leading or blaming questions, or the user's password.", "Jargon or internal details (servers, admin accounts, IPs) in the note to the user."],
        es: ["Cerrar con el síntoma: la cuenta está desbloqueada, pero lo que la bloqueó sigue ahí.", "Sin comprobación: «ya debería funcionar» sin prueba.",
          "Dejar un ticket en curso mientras esperas al usuario o a un proveedor, de modo que el SLA corre.", "Hacer preguntas que inducen la respuesta o culpan, o pedir la contraseña del usuario.", "Jerga o detalles internos (servidores, cuentas de administración, IP) en la nota para el usuario."],
      },
      tips: {
        en: ["Ask open, useful questions: when did it start, what changed, does it happen to anyone else.", "Set the ticket to pending with a clear reason when you wait for someone.",
          "Write the work note as you go: cause, what you changed, how you proved it, what is left.", "Ask the user to confirm before you close when you can."],
        es: ["Haz preguntas abiertas y útiles: cuándo empezó, qué cambió, si le pasa a alguien más.", "Pon el ticket en pendiente con un motivo claro cuando esperas a alguien.",
          "Escribe la nota de trabajo sobre la marcha: causa, qué cambiaste, cómo lo comprobaste, qué queda.", "Pide al usuario que lo confirme antes de cerrar cuando puedas."],
      },
      desks: ["ad-lockout", "print-queue", "laptop-rma", "net-fortigate-branch"], labs: [],
      guides: ["jira-service-management-un-ticket-bien-hecho", "glpi-inventario-con-glpi-agent-tickets-sla-y-un-equipo-que-deja-de-reportar", "confluence-espacio-de-it-y-runbooks-que-se-usan", "entorno-de-pruebas-para-validar-cambios-en-plataformas-criticas"],
    },
  ];

  // the plain text of an article in one language (search, Markdown and the tests)
  function textOf(a, lang) {
    const L = lang === "es" ? "es" : "en";
    return [].concat(a.what[L], a.tools.map((x) => x.cmd + " " + t(x.what, L)), a.causes[L], a.tips[L]);
  }
  function area(id) { return AREAS.find((x) => x.id === id) || null; }
  function article(id) { return ARTICLES.find((a) => a.id === id) || null; }
  function forDesk(deskId) { return ARTICLES.filter((a) => a.desks.includes(deskId)); }
  function forLab(labId) { return ARTICLES.filter((a) => a.labs.includes(labId)); }
  // where a tool is used, as {kind, id}: kind "ad" | "lab" | "desk" | "device" | "page"
  function toolPlace(tool) {
    const on = String(tool.on || "");
    if (on === "ad") return { kind: "ad", id: "ad" };
    const m = on.match(/^(lab|desk|page):(.+)$/);
    if (m) return { kind: m[1], id: m[2] };
    return { kind: "device", id: on };
  }

  /* Search: every word of the query must appear somewhere (title, summary, tags or text, accents ignored). Title hits weigh most.
     Returns [{article, score, snippet}] best first; an empty query returns every article. */
  function search(query, lang) {
    const words = fold(query).split(/[^a-z0-9.\-_/]+/).filter((w) => w.length > 1);
    if (!words.length) return ARTICLES.map((a) => ({ article: a, score: 0, snippet: t(a.summary, lang) }));
    const out = [];
    ARTICLES.forEach((a) => {
      const title = fold(t(a.title, "en") + " " + t(a.title, "es"));
      const summary = fold(t(a.summary, lang));
      const tags = fold(a.tags.join(" "));
      const body = textOf(a, lang);
      const bodyF = fold(body.join(" "));
      let score = 0;
      for (const w of words) {
        const s = (title.includes(w) ? 6 : 0) + (tags.includes(w) ? 4 : 0) + (summary.includes(w) ? 3 : 0) + (bodyF.includes(w) ? 1 : 0);
        if (!s) return;
        score += s;
      }
      const hit = body.find((x) => fold(x).includes(words[0])) || t(a.summary, lang);
      out.push({ article: a, score, snippet: hit.length > 180 ? hit.slice(0, 177).replace(/\s+\S*$/, "") + "…" : hit });
    });
    return out.sort((x, y) => y.score - x.score || ARTICLES.indexOf(x.article) - ARTICLES.indexOf(y.article));
  }

  const MD = {
    en: { what: "What it is", tools: "Commands and tools in the simulator", causes: "Common causes", tips: "Good practice", desks: "Practise it in these tickets", labs: "Labs", guides: "Guides",
      src: "SysAdmin Desks by IGG · reference for a simulator with a fictional company (Contoso)" },
    es: { what: "Qué es", tools: "Comandos y herramientas en el simulador", causes: "Causas habituales", tips: "Buenas prácticas", desks: "Practícalo en estos tickets", labs: "Laboratorios", guides: "Guías",
      src: "SysAdmin Desks by IGG · referencia de un simulador con una empresa ficticia (Contoso)" },
  };
  // Markdown for one article, in one language (deskTitle and labTitle turn ids into names)
  function toMarkdown(a, lang, deskTitle, labTitle) {
    const L = lang === "es" ? "es" : "en";
    const W = MD[L];
    const lines = ["# " + t(a.title, L), "", "_" + t(a.summary, L) + "_", "", "## " + W.what, ""];
    a.what[L].forEach((p) => lines.push(p, ""));
    lines.push("## " + W.tools, "", ...a.tools.map((x) => "- `" + x.cmd + "`: " + t(x.what, L)), "");
    lines.push("## " + W.causes, "", ...a.causes[L].map((x) => "- " + x), "");
    lines.push("## " + W.tips, "", ...a.tips[L].map((x) => "- " + x), "");
    if (a.desks.length) lines.push("## " + W.desks, "", ...a.desks.map((d) => "- " + (deskTitle ? deskTitle(d) : d)), "");
    if (a.labs.length) lines.push("## " + W.labs, "", ...a.labs.map((l) => "- " + (labTitle ? labTitle(l) : l)), "");
    if (a.guides.length) lines.push("## " + W.guides, "", ...a.guides.map((g) => "- " + guideUrl(g)), "");
    lines.push("---", W.src, "");
    return lines.join("\n");
  }

  return { GUIDE_BASE, AREAS, ARTICLES, t, fold, guideUrl, textOf, area, article, forDesk, forLab, toolPlace, search, toMarkdown };
});
