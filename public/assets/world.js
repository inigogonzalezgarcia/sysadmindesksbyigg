/* SysAdmin Desks by IGG - the shared world (v0.3): Contoso's directory (OUs, users, groups, computers) and its inventory
   (servers and printers). Fictional company and people. Pure logic, no DOM: the app and the Node tests use the same code.
   The directory answers PowerShell (RSAT-style) commands, and every button in the directory page builds and runs one of
   those commands, so the console and the buttons always give the same result. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SDWorld = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const DC = "DC=contoso,DC=local";
  const NOW = "26/10/2026 09:40";   // the simulation clock for changes made in the directory

  const OUS = [
    { id: "users", name: "Users", parent: null },
    { id: "finance", name: "Finance", parent: "users" },
    { id: "accounting", name: "Accounting", parent: "users" },
    { id: "sales", name: "Sales", parent: "users" },
    { id: "marketing", name: "Marketing", parent: "users" },
    { id: "legal", name: "Legal", parent: "users" },
    { id: "it", name: "IT", parent: "users" },
    { id: "shared", name: "Shared accounts", parent: null },
    { id: "service", name: "Service accounts", parent: null },
    { id: "groups", name: "Groups", parent: null },
    { id: "computers", name: "Computers", parent: null },
    { id: "laptops", name: "Laptops", parent: "computers" },
    { id: "desktops", name: "Desktops", parent: "computers" },
    { id: "servers", name: "Servers", parent: null },
  ];

  const GROUPS = [
    { name: "GG-Finance", ou: "groups", desc: { en: "Finance team: Finance share and ERP", es: "Equipo de Finanzas: carpeta de Finanzas y ERP" } },
    { name: "GG-Accounting", ou: "groups", desc: { en: "Accounting team", es: "Equipo de Contabilidad" } },
    { name: "GG-Sales", ou: "groups", desc: { en: "Sales team: CRM and Sales share", es: "Equipo comercial: CRM y carpeta de Ventas" } },
    { name: "GG-Sales-Managers", ou: "groups", desc: { en: "Sales managers: forecasts and pricing", es: "Responsables comerciales: previsiones y precios" } },
    { name: "GG-Marketing", ou: "groups", desc: { en: "Marketing team", es: "Equipo de Marketing" } },
    { name: "GG-Legal", ou: "groups", desc: { en: "Legal team: contracts share", es: "Equipo Legal: carpeta de contratos" } },
    { name: "GG-Reception", ou: "groups", desc: { en: "Reception desk", es: "Recepción" } },
    { name: "GG-IT-Admins", ou: "groups", desc: { en: "IT administrators", es: "Administradores de IT" } },
    { name: "GG-VPN-Users", ou: "groups", desc: { en: "Allowed to connect with the VPN from home", es: "Pueden conectarse por VPN desde casa" } },
    { name: "GG-M365-E3", ou: "groups", desc: { en: "Microsoft 365 E3 licence (group-based licensing)", es: "Licencia Microsoft 365 E3 (licencias por grupo)" } },
    { name: "GG-Printers-HQ", ou: "groups", desc: { en: "Head office printers, deployed by GPO", es: "Impresoras de la oficina central, desplegadas por GPO" } },
    { name: "GG-Scan-Service", ou: "groups", desc: { en: "Service accounts that write scans to the file shares", es: "Cuentas de servicio que dejan los escaneos en las carpetas" } },
  ];

  const USERS = [
    { sam: "mgarcia", name: "Marta García", ou: "finance", title: { en: "Finance analyst", es: "Analista financiera" }, dept: "Finance",
      groups: ["GG-Finance", "GG-M365-E3", "GG-Printers-HQ"], device: "PC-FIN-021", pwdLastSet: "19/10/2026 08:12", lastLogon: "25/10/2026 07:55" },
    { sam: "dlopez", name: "David López", ou: "finance", title: { en: "Payroll specialist", es: "Técnico de nóminas" }, dept: "Finance",
      groups: ["GG-Finance", "GG-M365-E3", "GG-Printers-HQ"], device: "PC-FIN-027", pwdLastSet: "02/09/2026 09:03", lastLogon: "24/10/2026 18:20" },
    { sam: "lnavarro", name: "Lucía Navarro", ou: "finance", title: { en: "Finance controller", es: "Controller financiera" }, dept: "Finance",
      groups: ["GG-Finance", "GG-M365-E3", "GG-VPN-Users"], device: "LAPTOP-0230", pwdLastSet: "11/08/2026 10:30", lastLogon: "23/10/2026 17:02" },
    { sam: "lperez", name: "Laura Pérez", ou: "accounting", title: { en: "Accountant", es: "Contable" }, dept: "Accounting",
      groups: ["GG-Accounting", "GG-M365-E3", "GG-Printers-HQ"], device: "PC-FIN-033", pwdLastSet: "30/09/2026 08:44", lastLogon: "25/10/2026 08:01" },
    { sam: "jruiz", name: "Javier Ruiz", ou: "sales", title: { en: "Account manager", es: "Gestor de cuentas" }, dept: "Sales",
      groups: ["GG-Sales", "GG-M365-E3", "GG-VPN-Users"], device: "LAPTOP-0217", pwdLastSet: "14/10/2026 19:21", lastLogon: "25/10/2026 08:47" },
    { sam: "cmartin", name: "Carlos Martín", ou: "sales", title: { en: "Sales director", es: "Director comercial" }, dept: "Sales",
      groups: ["GG-Sales", "GG-Sales-Managers", "GG-M365-E3", "GG-VPN-Users"], device: "LAPTOP-0102", pwdLastSet: "05/10/2026 07:58", lastLogon: "25/10/2026 07:40" },
    { sam: "psanchez", name: "Pablo Sánchez", ou: "sales", title: { en: "Sales representative", es: "Comercial" }, dept: "Sales",
      groups: ["GG-Sales", "GG-M365-E3"], device: "LAPTOP-0264", pwdLastSet: "21/10/2026 09:15", lastLogon: "24/10/2026 16:33" },
    { sam: "eromero", name: "Elena Romero", ou: "marketing", title: { en: "Marketing specialist", es: "Técnica de marketing" }, dept: "Marketing",
      groups: ["GG-Marketing", "GG-M365-E3"], device: "LAPTOP-0251", pwdLastSet: "29/08/2026 12:10", lastLogon: "09/10/2026 18:05", locked: true, badPwd: 5 },
    { sam: "aortiz", name: "Ana Ortiz", ou: "legal", title: { en: "Legal counsel", es: "Asesora jurídica" }, dept: "Legal",
      groups: ["GG-Legal", "GG-M365-E3", "GG-VPN-Users"], device: "LAPTOP-0388", pwdLastSet: "07/10/2026 08:30", lastLogon: "25/10/2026 08:05" },
    { sam: "it.admin", name: "IT Admin", ou: "it", title: { en: "IT support technician", es: "Técnico de soporte IT" }, dept: "IT",
      groups: ["GG-IT-Admins", "GG-M365-E3", "GG-VPN-Users"], device: "ADM-WS01", pwdLastSet: "12/10/2026 08:00", lastLogon: "26/10/2026 08:58" },
    { sam: "recepcion", name: "Recepción", ou: "shared", title: { en: "Reception desk (shared)", es: "Recepción (compartida)" }, dept: "Reception",
      groups: ["GG-Reception", "GG-Printers-HQ"], device: "PC-REC-001", pwdLastSet: "01/07/2026 08:00", lastLogon: "26/10/2026 08:30" },
    { sam: "svc-scan", name: "svc-scan", ou: "service", title: { en: "Scan to folder (FS-SCAN01)", es: "Escanear a carpeta (FS-SCAN01)" }, dept: "IT",
      groups: ["GG-Scan-Service"], device: "FS-SCAN01", pwdLastSet: "15/03/2026 10:00", lastLogon: "26/10/2026 09:35", neverExpires: true },
  ];

  const COMPUTERS = [
    { name: "PC-FIN-021", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "mgarcia" },
    { name: "PC-FIN-027", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "dlopez" },
    { name: "PC-FIN-033", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "lperez" },
    { name: "PC-REC-001", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "recepcion" },
    { name: "LAPTOP-0102", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "cmartin" },
    { name: "LAPTOP-0217", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "jruiz" },
    { name: "LAPTOP-0230", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "lnavarro" },
    { name: "LAPTOP-0251", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "eromero" },
    { name: "LAPTOP-0264", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "psanchez" },
    { name: "LAPTOP-0388", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "aortiz", note: { en: "Entra ID joined (cloud only): managed in Intune", es: "Unido a Entra ID (solo nube): se gestiona en Intune" } },
    { name: "ADM-WS01", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "it.admin" },
  ];

  // the inventory: servers (also computer objects in OU=Servers) and printers
  const SERVERS = [
    { id: "DC01", role: { en: "Domain controller (PDC emulator), DNS", es: "Controlador de dominio (emulador de PDC), DNS" }, os: "Windows Server 2022", ip: "10.20.1.10",
      location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
    { id: "DC02", role: { en: "Domain controller, DNS", es: "Controlador de dominio, DNS" }, os: "Windows Server 2022", ip: "10.20.1.11",
      location: { en: "Head office data room, rack B", es: "Sala técnica de la oficina central, rack B" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
    { id: "INTRANET01", role: { en: "Intranet web server (intranet.contoso.local)", es: "Servidor web de la intranet (intranet.contoso.local)" }, os: "Windows Server 2022", ip: "10.20.1.15",
      location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" }, owner: { en: "Internal communications", es: "Comunicación interna" }, patched: "14/10/2026" },
    { id: "FS01", role: { en: "File server (S: drive, department shares)", es: "Servidor de ficheros (unidad S:, carpetas de departamento)" }, os: "Windows Server 2022", ip: "10.20.1.20",
      location: { en: "Head office data room, rack B", es: "Sala técnica de la oficina central, rack B" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
    { id: "FS-SCAN01", role: { en: "Scan to folder for the printers", es: "Escanear a carpeta para las impresoras" }, os: "Windows Server 2019", ip: "10.20.1.24",
      location: { en: "Head office data room, rack B", es: "Sala técnica de la oficina central, rack B" }, owner: { en: "Facilities (printing supplier)", es: "Servicios generales (proveedor de impresión)" }, patched: "09/09/2026" },
    { id: "PRT-SRV01", role: { en: "Print server (22 queues)", es: "Servidor de impresión (22 colas)" }, os: "Windows Server 2022", ip: "10.20.1.30",
      location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
  ];
  const PRINTERS = [
    { id: "RECEPCION-MFP", model: { en: "Colour A3 multifunction", es: "Multifunción A3 color" }, ip: "10.20.3.41", queue: "PRT-SRV01", location: { en: "Ground floor, reception", es: "Planta baja, recepción" } },
    { id: "FIN-MFP-01", model: { en: "Mono A4 multifunction", es: "Multifunción A4 monocromo" }, ip: "10.20.3.42", queue: "PRT-SRV01", location: { en: "2nd floor, Finance", es: "2ª planta, Finanzas" } },
    { id: "SALES-MFP-01", model: { en: "Colour A4 multifunction", es: "Multifunción A4 color" }, ip: "10.20.3.43", queue: "PRT-SRV01", location: { en: "1st floor, Sales", es: "1ª planta, Ventas" } },
    { id: "LEGAL-PRN-01", model: { en: "Mono A4 printer with secure release", es: "Impresora A4 monocromo con liberación segura" }, ip: "10.20.3.44", queue: "PRT-SRV01", location: { en: "4th floor, Legal", es: "4ª planta, Legal" } },
  ];

  // directory practice: four everyday requests, each one doable with the buttons or with PowerShell
  const TASKS = [
    { id: "unlock", label: { en: "Elena Romero is back from holiday and locked out: unlock her account.", es: "Elena Romero ha vuelto de vacaciones y se ha bloqueado: desbloquea su cuenta." },
      check: (w) => !user(w, "eromero").locked && user(w, "eromero").enabled },
    { id: "vpn", label: { en: "Pablo Sánchez starts working from home: add him to GG-VPN-Users.", es: "Pablo Sánchez empieza a teletrabajar: añádelo a GG-VPN-Users." },
      check: (w) => user(w, "psanchez").groups.includes("GG-VPN-Users") },
    { id: "reset", label: { en: "David López forgot his password: reset it and make him change it at the next sign-in.", es: "David López ha olvidado su contraseña: restablécela y oblígale a cambiarla al iniciar sesión." },
      check: (w) => user(w, "dlopez").pwdReset && user(w, "dlopez").mustChange },
    { id: "leaver", label: { en: "Lucía Navarro left the company yesterday: disable her account and remove her from GG-Finance.", es: "Lucía Navarro dejó la empresa ayer: deshabilita su cuenta y quítala de GG-Finance." },
      check: (w) => !user(w, "lnavarro").enabled && !user(w, "lnavarro").groups.includes("GG-Finance") },
  ];

  function t(value, lang) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    return value[lang] || value.en || "";
  }

  function createWorld() {
    return {
      users: USERS.map((u) => Object.assign({ enabled: true, locked: false, badPwd: 0, mustChange: false, pwdReset: false, neverExpires: false }, u, { groups: u.groups.slice() })),
      overlay: {},   // sam -> fields that come from an open ticket (e.g. {locked: true} while INC-20418 is open)
    };
  }
  // keep only what the directory page can change, so a saved copy can be loaded on top of a fresh world
  function snapshot(w) {
    return w.users.map((u) => ({ sam: u.sam, enabled: u.enabled, locked: u.locked, badPwd: u.badPwd, mustChange: u.mustChange, pwdReset: u.pwdReset, pwdLastSet: u.pwdLastSet, groups: u.groups.slice() }));
  }
  function restore(saved) {
    const w = createWorld();
    (Array.isArray(saved) ? saved : []).forEach((s) => {
      const u = w.users.find((x) => s && x.sam === s.sam);
      if (!u) return;
      ["enabled", "locked", "mustChange", "pwdReset"].forEach((k) => { if (typeof s[k] === "boolean") u[k] = s[k]; });
      if (typeof s.badPwd === "number") u.badPwd = s.badPwd;
      if (typeof s.pwdLastSet === "string") u.pwdLastSet = s.pwdLastSet;
      if (Array.isArray(s.groups)) u.groups = s.groups.filter((g) => GROUPS.some((x) => x.name === g));
    });
    return w;
  }

  function user(w, sam) { return w.users.find((u) => u.sam.toLowerCase() === String(sam).toLowerCase()); }
  // a user as the directory shows it: the stored fields plus what an open ticket says
  function view(w, sam) {
    const u = user(w, sam);
    return u ? Object.assign({}, u, w.overlay[u.sam] || {}) : null;
  }
  function group(name) { return GROUPS.find((g) => g.name.toLowerCase() === String(name).toLowerCase()); }
  function computer(name) {
    const n = String(name).toLowerCase();
    return COMPUTERS.find((c) => c.name.toLowerCase() === n) || (SERVERS.find((s) => s.id.toLowerCase() === n) && serverAsComputer(SERVERS.find((s) => s.id.toLowerCase() === n)));
  }
  function serverAsComputer(s) { return { name: s.id, ou: "servers", os: s.os, user: null, ip: s.ip }; }
  function allComputers() { return COMPUTERS.concat(SERVERS.map(serverAsComputer)); }
  function members(w, g) { return w.users.filter((u) => u.groups.includes(g.name)); }
  function ouPath(id) {
    const parts = [];
    for (let o = OUS.find((x) => x.id === id); o; o = OUS.find((x) => x.id === o.parent)) parts.push("OU=" + o.name);
    return parts.join(",") + "," + DC;
  }
  function userDn(u) { return `CN=${u.name.normalize("NFD").replace(/[̀-ͯ]/g, "")},${ouPath(u.ou)}`; }
  function ouByDn(dn) {
    const d = String(dn).toLowerCase().replace(/\s+/g, "");
    return OUS.find((o) => ouPath(o.id).toLowerCase() === d);
  }
  // the OU and every OU below it
  function under(id) {
    const ids = [id];
    OUS.forEach((o) => { if (ids.includes(o.parent)) ids.push(o.id); });
    return ids;
  }

  /* ---------- a small PowerShell parser: Verb-Noun, positional values, -Name value, -Name:value and quoted strings */
  function tokenize(s) {
    const out = [];
    const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let m;
    while ((m = re.exec(s))) out.push(m[1] != null ? m[1] : m[2] != null ? m[2] : m[3]);
    return out;
  }
  function parse(input) {
    const toks = tokenize(String(input).trim());
    const verb = (toks.shift() || "").toLowerCase();
    const named = {};
    const pos = [];
    for (let i = 0; i < toks.length; i++) {
      const tk = toks[i];
      if (/^-[a-z]/i.test(tk)) {
        const [k, inline] = tk.slice(1).split(":");
        const key = k.toLowerCase();
        if (inline != null) named[key] = inline;
        else if (i + 1 < toks.length && !/^-[a-z]/i.test(toks[i + 1])) named[key] = toks[++i];
        else named[key] = true;
      } else pos.push(tk);
    }
    return { verb, named, pos, id: named.identity || pos[0] };
  }

  function pad(s, n) { s = String(s); return s.length >= n ? s : s + " ".repeat(n - s.length); }
  function table(cols, rows) {
    const w = cols.map((c, i) => Math.max(c.length, ...rows.map((r) => String(r[i]).length)));
    return ["", cols.map((c, i) => pad(c, w[i])).join(" ").trimEnd(), cols.map((c, i) => pad("-".repeat(c.length), w[i])).join(" ").trimEnd(),
      ...rows.map((r) => r.map((x, i) => pad(x, w[i])).join(" ").trimEnd()), ""];
  }
  function props(pairs) {
    const n = Math.max(...pairs.map((p) => p[0].length));
    return ["", ...pairs.map(([k, v]) => pad(k, n) + " : " + v), ""];
  }
  const tf = (b) => (b ? "True" : "False");

  function userLines(u) {
    return props([["DistinguishedName", userDn(u)], ["Enabled", tf(u.enabled)], ["LockedOut", tf(u.locked)], ["badPwdCount", String(u.badPwd || 0)],
      ["Name", u.name], ["SamAccountName", u.sam], ["UserPrincipalName", u.sam + "@contoso.com"], ["Title", t(u.title, "en")], ["Department", u.dept],
      ["PasswordLastSet", u.pwdLastSet], ["PasswordNeverExpires", tf(u.neverExpires)], ["ChangePasswordAtLogon", tf(u.mustChange)], ["LastLogonDate", u.lastLogon]]);
  }
  function computerLines(c) {
    return props([["DistinguishedName", `CN=${c.name},${ouPath(c.ou)}`], ["DNSHostName", c.name.toLowerCase() + ".contoso.local"], ["Enabled", "True"],
      ["Name", c.name], ["OperatingSystem", c.os], ["ManagedBy", c.user ? userDn(USERS.find((u) => u.sam === c.user)) : ""]]);
  }

  const SAY = {
    unlocked: { en: "(Account unlocked.)", es: "(Cuenta desbloqueada.)" },
    reset: { en: "New temporary password set. Give it to the user by a separate channel (phone, not email) and make them change it at the next sign-in.",
             es: "Contraseña temporal puesta. Dásela al usuario por otro canal (teléfono, no correo) y oblígale a cambiarla al iniciar sesión." },
    resetNeeds: { en: "As an administrator you set a new password with -Reset; without it the cmdlet asks for the old one.",
                  es: "Como administrador se pone una contraseña nueva con -Reset; sin él, el cmdlet pide la antigua." },
    mustChange: { en: "The user will have to choose a new password at the next sign-in.", es: "El usuario tendrá que elegir una contraseña nueva al iniciar sesión." },
    noMustChange: { en: "The user keeps the current password.", es: "El usuario mantiene la contraseña actual." },
    enabled: { en: "(Account enabled.)", es: "(Cuenta habilitada.)" },
    disabled: { en: "(Account disabled: the user cannot sign in, and nothing is deleted.)", es: "(Cuenta deshabilitada: el usuario no puede iniciar sesión y no se borra nada.)" },
    added: { en: "Added. The user gets the new access at the next sign-in (the Kerberos ticket carries the groups).", es: "Añadido. El usuario tendrá el nuevo acceso al volver a iniciar sesión (el ticket de Kerberos lleva los grupos)." },
    already: { en: "(Already a member: nothing to do.)", es: "(Ya es miembro: no hay nada que hacer.)" },
    removed: { en: "(Removed from the group.)", es: "(Quitado del grupo.)" },
    notMember: { en: "(Not a member of that group.)", es: "(No es miembro de ese grupo.)" },
    filter: { en: "This simulation understands -Filter * (optionally with -SearchBase \"OU=...,DC=contoso,DC=local\").", es: "Esta simulación entiende -Filter * (opcionalmente con -SearchBase \"OU=...,DC=contoso,DC=local\")." },
  };
  const HELP = {
    en: ["Directory commands (RSAT ActiveDirectory module):",
      "  Get-ADUser <user> | Get-ADUser -Filter * [-SearchBase \"OU=Sales,OU=Users,DC=contoso,DC=local\"]",
      "  Search-ADAccount -LockedOut | -AccountDisabled",
      "  Unlock-ADAccount <user>   Enable-ADAccount <user>   Disable-ADAccount <user>",
      "  Set-ADAccountPassword <user> -Reset   Set-ADUser <user> -ChangePasswordAtLogon $true",
      "  Get-ADGroup <group> | -Filter *   Get-ADGroupMember <group>   Get-ADPrincipalGroupMembership <user>",
      "  Add-ADGroupMember <group> -Members <user>   Remove-ADGroupMember <group> -Members <user> -Confirm:$false",
      "  Get-ADComputer <name> | -Filter *   Get-ADOrganizationalUnit -Filter *",
      "Every button on this page shows the command it runs."],
    es: ["Comandos del directorio (módulo ActiveDirectory de RSAT):",
      "  Get-ADUser <usuario> | Get-ADUser -Filter * [-SearchBase \"OU=Sales,OU=Users,DC=contoso,DC=local\"]",
      "  Search-ADAccount -LockedOut | -AccountDisabled",
      "  Unlock-ADAccount <usuario>   Enable-ADAccount <usuario>   Disable-ADAccount <usuario>",
      "  Set-ADAccountPassword <usuario> -Reset   Set-ADUser <usuario> -ChangePasswordAtLogon $true",
      "  Get-ADGroup <grupo> | -Filter *   Get-ADGroupMember <grupo>   Get-ADPrincipalGroupMembership <usuario>",
      "  Add-ADGroupMember <grupo> -Members <usuario>   Remove-ADGroupMember <grupo> -Members <usuario> -Confirm:$false",
      "  Get-ADComputer <nombre> | -Filter *   Get-ADOrganizationalUnit -Filter *",
      "Cada botón de esta página muestra el comando que ejecuta."],
  };

  function notFound(verb, id) {
    return [`${verb} : Cannot find an object with identity: '${id}' under: '${DC}'.`];
  }
  function notRecognised(cmd) {
    const word = cmd.split(" ")[0];
    return [word + " : The term '" + word + "' is not recognized as the name of a cmdlet, function, script file, or operable program.",
      "Check the spelling of the name, or if a path was included, verify that the path is correct and try again."];
  }

  /* Runs one command against the directory. Returns {lines: [{text, kind}], changed}.
     route(input, parsed) lets the app hand a command to an open ticket first (it returns a result, or null to let the directory answer). */
  function run(w, input, lang, route) {
    const L = lang === "es" ? "es" : "en";
    const cmd = String(input || "").trim().replace(/\s+/g, " ");
    const res = { lines: [], changed: false, clear: false };
    const out = (arr, kind) => arr.forEach((x) => res.lines.push({ text: x, kind: kind || "out" }));
    const say = (s) => res.lines.push({ text: t(s, L), kind: "say" });
    const err = (arr) => out(arr, "err");
    if (!cmd) return res;
    const p = parse(cmd);
    if (route) { const r = route(cmd, p); if (r) return r; }
    const v = p.verb;
    if (v === "clear" || v === "cls") { res.clear = true; return res; }
    if (v === "help" || v === "?") { HELP[L].forEach((x) => res.lines.push({ text: x, kind: "say" })); return res; }

    const needUser = (verb) => {
      const u = p.id && view(w, p.id);
      if (!u) err(notFound(verb, p.id || ""));
      return u;
    };
    const change = (sam, fields) => { Object.assign(user(w, sam), fields); res.changed = true; };

    switch (v) {
      case "get-aduser": {
        if (p.named.filter) {
          if (p.named.filter !== "*") { err(["Get-ADUser : Error parsing query."]); say(SAY.filter); return res; }
          let list = w.users.map((u) => view(w, u.sam));
          if (p.named.searchbase) {
            const ou = ouByDn(p.named.searchbase);
            if (!ou) { err([`Get-ADUser : Directory object not found: '${p.named.searchbase}'.`]); return res; }
            list = list.filter((u) => under(ou.id).includes(u.ou));
          }
          out(table(["Name", "SamAccountName", "Enabled", "LockedOut"], list.map((u) => [u.name, u.sam, tf(u.enabled), tf(u.locked)])));
          return res;
        }
        const u = needUser("Get-ADUser");
        if (u) out(userLines(u));
        return res;
      }
      case "search-adaccount": {
        const lockedOut = "lockedout" in p.named;
        const disabled = "accountdisabled" in p.named;
        if (!lockedOut && !disabled) { err(["Search-ADAccount : Parameter set cannot be resolved using the specified named parameters."]); return res; }
        const list = w.users.map((u) => view(w, u.sam)).filter((u) => (lockedOut ? u.locked : !u.enabled));
        out(list.length ? table(["Name", "SamAccountName", "Enabled", "LockedOut", "LastLogonDate"], list.map((u) => [u.name, u.sam, tf(u.enabled), tf(u.locked), u.lastLogon])) : [""]);
        return res;
      }
      case "unlock-adaccount": {
        const u = needUser("Unlock-ADAccount");
        if (u) { change(u.sam, { locked: false, badPwd: 0 }); out([""]); say(SAY.unlocked); }
        return res;
      }
      case "enable-adaccount":
      case "disable-adaccount": {
        const on = v === "enable-adaccount";
        const u = needUser(on ? "Enable-ADAccount" : "Disable-ADAccount");
        if (u) { change(u.sam, { enabled: on }); out([""]); say(on ? SAY.enabled : SAY.disabled); }
        return res;
      }
      case "set-adaccountpassword": {
        const u = needUser("Set-ADAccountPassword");
        if (!u) return res;
        if (!("reset" in p.named)) { err(["Set-ADAccountPassword : The specified network password is not correct."]); say(SAY.resetNeeds); return res; }
        change(u.sam, { pwdLastSet: NOW, pwdReset: true });
        out([""]); say(SAY.reset);
        return res;
      }
      case "set-aduser": {
        const u = needUser("Set-ADUser");
        if (!u) return res;
        const val = p.named.changepasswordatlogon;
        if (val == null) { err(["Set-ADUser : This simulation only changes -ChangePasswordAtLogon."]); return res; }
        const on = /^\$?true$/i.test(String(val)) || val === true;
        change(u.sam, { mustChange: on });
        out([""]); say(on ? SAY.mustChange : SAY.noMustChange);
        return res;
      }
      case "add-adgroupmember":
      case "remove-adgroupmember": {
        const add = v === "add-adgroupmember";
        const verb = add ? "Add-ADGroupMember" : "Remove-ADGroupMember";
        const g = p.id && group(p.id);
        if (!g) { err(notFound(verb, p.id || "")); return res; }
        const who = String(p.named.members || p.pos[1] || "");
        const u = who && user(w, who);
        if (!u) { err([`${verb} : Cannot find an object with identity: '${who}' under: '${DC}'.`]); return res; }
        const has = u.groups.includes(g.name);
        if (add && has) { out([""]); say(SAY.already); return res; }
        if (!add && !has) { out([""]); say(SAY.notMember); return res; }
        change(u.sam, { groups: add ? u.groups.concat(g.name) : u.groups.filter((x) => x !== g.name) });
        out([""]); say(add ? SAY.added : SAY.removed);
        return res;
      }
      case "get-adgroupmember": {
        const g = p.id && group(p.id);
        if (!g) { err(notFound("Get-ADGroupMember", p.id || "")); return res; }
        const m = members(w, g);
        out(m.length ? table(["name", "SamAccountName", "objectClass"], m.map((u) => [u.name, u.sam, "user"])) : [""]);
        return res;
      }
      case "get-adprincipalgroupmembership": {
        const u = needUser("Get-ADPrincipalGroupMembership");
        if (u) out(table(["name", "GroupScope"], [["Domain Users", "Global"]].concat(u.groups.map((g) => [g, "Global"]))));
        return res;
      }
      case "get-adgroup": {
        if (p.named.filter) { out(table(["Name", "GroupScope", "Members"], GROUPS.map((g) => [g.name, "Global", String(members(w, g).length)]))); return res; }
        const g = p.id && group(p.id);
        if (!g) { err(notFound("Get-ADGroup", p.id || "")); return res; }
        out(props([["DistinguishedName", `CN=${g.name},${ouPath(g.ou)}`], ["GroupCategory", "Security"], ["GroupScope", "Global"], ["Name", g.name],
          ["Description", t(g.desc, "en")], ["Members", String(members(w, g).length)]]));
        return res;
      }
      case "get-adcomputer": {
        if (p.named.filter) { out(table(["Name", "OperatingSystem", "DistinguishedName"], allComputers().map((c) => [c.name, c.os, `CN=${c.name},${ouPath(c.ou)}`]))); return res; }
        const c = p.id && computer(p.id);
        if (!c) { err(notFound("Get-ADComputer", p.id || "")); return res; }
        out(computerLines(c));
        return res;
      }
      case "get-adorganizationalunit": {
        out(table(["Name", "DistinguishedName"], OUS.map((o) => [o.name, ouPath(o.id)])));
        return res;
      }
      default:
        err(notRecognised(cmd));
        return res;
    }
  }

  // the command each button on the directory page runs
  const CMD = {
    unlock: (sam) => `Unlock-ADAccount -Identity ${sam}`,
    reset: (sam) => `Set-ADAccountPassword -Identity ${sam} -Reset`,
    mustChange: (sam, on) => `Set-ADUser -Identity ${sam} -ChangePasswordAtLogon $${on ? "true" : "false"}`,
    enable: (sam) => `Enable-ADAccount -Identity ${sam}`,
    disable: (sam) => `Disable-ADAccount -Identity ${sam}`,
    addGroup: (sam, g) => `Add-ADGroupMember -Identity ${g} -Members ${sam}`,
    removeGroup: (sam, g) => `Remove-ADGroupMember -Identity ${g} -Members ${sam} -Confirm:$false`,
    show: (sam) => `Get-ADUser -Identity ${sam} -Properties *`,
  };

  function tasks(w, lang) { return TASKS.map((x) => ({ id: x.id, label: t(x.label, lang), done: Boolean(x.check(w)) })); }

  return { DC, OUS, GROUPS, USERS, COMPUTERS, SERVERS, PRINTERS, TASKS, CMD, t, createWorld, snapshot, restore, user, view, group, computer,
    allComputers, members, ouPath, userDn, under, parse, run, tasks };
});
