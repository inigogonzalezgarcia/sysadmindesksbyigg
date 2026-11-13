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
  // the names of a batch of identical machines: range("WH-PC-", 2, 12, 2) -> WH-PC-02 ... WH-PC-12
  const range = (prefix, from, to, width) => Array.from({ length: to - from + 1 }, (_, i) => prefix + String(from + i).padStart(width, "0"));
  const NOW = "26/10/2026 09:40";   // the simulation clock for changes made in the directory

  const OUS = [
    { id: "users", name: "Users", parent: null },
    { id: "finance", name: "Finance", parent: "users" },
    { id: "accounting", name: "Accounting", parent: "users" },
    { id: "sales", name: "Sales", parent: "users" },
    { id: "marketing", name: "Marketing", parent: "users" },
    { id: "legal", name: "Legal", parent: "users" },
    { id: "projects", name: "Projects", parent: "users" },
    { id: "operations", name: "Operations", parent: "users" },
    { id: "stores", name: "Stores", parent: "users" },
    { id: "hr", name: "HR", parent: "users" },
    { id: "health", name: "Health", parent: "users" },
    { id: "hospitality", name: "Hospitality", parent: "users" },
    { id: "markets", name: "Markets", parent: "users" },
    { id: "facilities", name: "Facilities", parent: "users" },
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
    { name: "GG-Projects", ou: "groups", desc: { en: "Projects office (PMO): drive P: (\\\\FS01\\Proyectos)", es: "Oficina de Proyectos (PMO): unidad P: (\\\\FS01\\Proyectos)" } },
    { name: "GG-Stores-All", ou: "groups", desc: { en: "All store staff: intranet and the stores' mailing list", es: "Todo el personal de tiendas: intranet y lista de correo de tiendas" } },
    { name: "GG-Store-T03", ou: "groups", desc: { en: "Store 03 Bilbao: StockTienda access to that store", es: "Tienda 03 Bilbao: acceso a esa tienda en StockTienda" } },
    { name: "GG-Store-T07", ou: "groups", desc: { en: "Store 07 Valencia: StockTienda access to that store", es: "Tienda 07 Valencia: acceso a esa tienda en StockTienda" } },
    { name: "GG-Store-T12", ou: "groups", desc: { en: "Store 12 Sevilla: StockTienda access to that store", es: "Tienda 12 Sevilla: acceso a esa tienda en StockTienda" } },
    { name: "GG-HR", ou: "groups", desc: { en: "HR team: HR share and the badge printer", es: "Equipo de RR. HH.: carpeta de RR. HH. e impresora de tarjetas" } },
    { name: "GG-Reception", ou: "groups", desc: { en: "Reception desk", es: "Recepción" } },
    { name: "GG-IT-Admins", ou: "groups", desc: { en: "IT administrators", es: "Administradores de IT" } },
    { name: "GG-VPN-Users", ou: "groups", desc: { en: "Allowed to connect with the VPN from home", es: "Pueden conectarse por VPN desde casa" } },
    { name: "GG-M365-E3", ou: "groups", desc: { en: "Microsoft 365 E3 licence (group-based licensing)", es: "Licencia Microsoft 365 E3 (licencias por grupo)" } },
    { name: "GG-M365-F3", ou: "groups", desc: { en: "Microsoft 365 F3 licence for frontline staff (group-based licensing)", es: "Licencia Microsoft 365 F3 para personal de primera línea (licencias por grupo)" } },
    { name: "GG-Printers-HQ", ou: "groups", desc: { en: "Head office printers, deployed by GPO", es: "Impresoras de la oficina central, desplegadas por GPO" } },
    { name: "GG-Server-RDP", ou: "groups", desc: { en: "Allowed to sign in to the servers through Remote Desktop (security team's GPO)", es: "Pueden iniciar sesión en los servidores por escritorio remoto (GPO del equipo de seguridad)" } },
    { name: "GG-Scan-Service", ou: "groups", desc: { en: "Service accounts that write scans to the file shares", es: "Cuentas de servicio que dejan los escaneos en las carpetas" } },
    { name: "GG-Clinic-Pilot", ou: "groups", desc: { en: "Clínica Contoso Salud: Ward 1 nurses in the SaludNet pilot (Citrix)", es: "Clínica Contoso Salud: enfermeras de la planta 1 del piloto de SaludNet (Citrix)" } },
    { name: "GG-Clinic-Ward3", ou: "groups", desc: { en: "Clínica Contoso Salud: Ward 3 nurses (SaludNet from Citrix)", es: "Clínica Contoso Salud: enfermeras de la planta 3 (SaludNet desde Citrix)" } },
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
    { sam: "irey", name: "Inés Rey", ou: "accounting", title: { en: "Accounting manager", es: "Responsable de Contabilidad" }, dept: "Accounting",
      groups: ["GG-Accounting", "GG-M365-E3", "GG-Printers-HQ"], device: "PC-FIN-036", pwdLastSet: "18/09/2026 09:10", lastLogon: "25/10/2026 08:12" },
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
    { sam: "smolina", name: "Sergio Molina", ou: "projects", title: { en: "Project coordinator", es: "Coordinador de proyectos" }, dept: "Projects",
      groups: ["GG-Projects", "GG-M365-E3", "GG-Printers-HQ"], device: "LAPTOP-0272", pwdLastSet: "02/10/2026 08:35", lastLogon: "25/10/2026 08:41" },
    { sam: "pherrero", name: "Paula Herrero", ou: "projects", title: { en: "Project manager", es: "Jefa de proyecto" }, dept: "Projects",
      groups: ["GG-Projects", "GG-M365-E3", "GG-Printers-HQ"], device: "LAPTOP-0281", pwdLastSet: "16/10/2026 12:20", lastLogon: "25/10/2026 09:02" },
    { sam: "imontero", name: "Isabel Montero", ou: "operations", title: { en: "Operations director", es: "Directora de Operaciones" }, dept: "Operations",
      groups: ["GG-M365-E3", "GG-VPN-Users", "GG-Printers-HQ"], device: "LAPTOP-0412", pwdLastSet: "20/10/2026 08:15", lastLogon: "11/11/2026 08:20" },
    { sam: "ribanez", name: "Raúl Ibáñez", ou: "operations", title: { en: "Shift supervisor, Zaragoza plant", es: "Jefe de turno, planta de Zaragoza" }, dept: "Operations",
      groups: ["GG-M365-E3"], device: "PC-ZAR-011", pwdLastSet: "03/10/2026 06:02", lastLogon: "11/11/2026 06:05" },
    { sam: "jarrieta", name: "Jon Arrieta", ou: "stores", title: { en: "Store manager, Store 03 Bilbao", es: "Encargado, Tienda 03 Bilbao" }, dept: "Stores",
      groups: ["GG-Store-T03", "GG-Stores-All", "GG-M365-F3"], device: "TPV-T03-01", pwdLastSet: "12/10/2026 09:30", lastLogon: "11/11/2026 09:02" },
    { sam: "nsaez", name: "Nora Sáez", ou: "stores", title: { en: "Sales assistant, Store 03 Bilbao", es: "Dependienta, Tienda 03 Bilbao" }, dept: "Stores",
      groups: ["GG-Store-T03", "GG-Stores-All", "GG-M365-F3"], device: "TPV-T03-01", pwdLastSet: "28/09/2026 10:05", lastLogon: "10/11/2026 16:40" },
    { sam: "amedina", name: "Alba Medina", ou: "stores", title: { en: "Sales assistant, Store 03 Bilbao (new starter)", es: "Dependienta, Tienda 03 Bilbao (nueva incorporación)" }, dept: "Stores",
      groups: ["GG-Store-T03", "GG-Stores-All", "GG-M365-F3"], device: "TPV-T03-01", pwdLastSet: "10/11/2026 16:05", lastLogon: "11/11/2026 09:05" },
    { sam: "rcampos", name: "Rocío Campos", ou: "stores", title: { en: "Store manager, Store 07 Valencia", es: "Encargada, Tienda 07 Valencia" }, dept: "Stores",
      groups: ["GG-Store-T07", "GG-Stores-All", "GG-M365-F3"], device: "TPV-T07-01", pwdLastSet: "05/10/2026 09:12", lastLogon: "11/11/2026 09:30" },
    { sam: "cortega", name: "Carmen Ortega", ou: "stores", title: { en: "Store manager, Store 12 Sevilla", es: "Encargada, Tienda 12 Sevilla" }, dept: "Stores",
      groups: ["GG-Store-T12", "GG-Stores-All", "GG-M365-F3"], device: "TPV-T12-01", pwdLastSet: "17/10/2026 10:00", lastLogon: "11/11/2026 09:48" },
    { sam: "agoikoetxea", name: "Ane Goikoetxea", ou: "hospitality", title: { en: "Restaurant manager, Restaurante Ribera (Contoso Hospitality)", es: "Encargada, Restaurante Ribera (Contoso Hospitality)" }, dept: "Hospitality",
      groups: ["GG-Stores-All", "GG-M365-F3"], device: "LAPTOP-RIB-02", pwdLastSet: "21/10/2026 11:30", lastLogon: "11/11/2026 12:05" },
    { sam: "ietxeberria", name: "Iker Etxeberria", ou: "operations", title: { en: "Warehouse lead", es: "Responsable de almacén" }, dept: "Operations",
      groups: ["GG-M365-F3"], device: "WH-PC-01", pwdLastSet: "07/10/2026 06:40", lastLogon: "11/11/2026 06:58" },
    { sam: "msoler", name: "Marina Soler", ou: "marketing", title: { en: "Graphic designer", es: "Diseñadora gráfica" }, dept: "Marketing",
      groups: ["GG-Marketing", "GG-M365-E3"], device: "MAC-0019", pwdLastSet: "03/11/2026 09:10", lastLogon: "11/11/2026 08:52" },
    { sam: "ncastro", name: "Noelia Castro", ou: "hr", title: { en: "HR generalist", es: "Técnica de RR. HH." }, dept: "HR",
      groups: ["GG-HR", "GG-M365-E3", "GG-Printers-HQ"], device: "PC-RRHH-004", pwdLastSet: "24/09/2026 08:20", lastLogon: "11/11/2026 08:31" },
    { sam: "nprieto", name: "Nerea Prieto", ou: "legal", title: { en: "Paralegal (new starter)", es: "Asistente jurídica (nueva incorporación)" }, dept: "Legal",
      groups: ["GG-Legal", "GG-M365-E3", "GG-Printers-HQ"], device: "LAPTOP-0395", pwdLastSet: "23/10/2026 17:42", lastLogon: "", mustChange: true },
    { sam: "it.admin", name: "IT Admin", ou: "it", title: { en: "IT support technician", es: "Técnico de soporte IT" }, dept: "IT",
      groups: ["GG-IT-Admins", "GG-M365-E3", "GG-VPN-Users"], device: "ADM-WS01", pwdLastSet: "12/10/2026 08:00", lastLogon: "26/10/2026 08:58" },
    { sam: "sgil", name: "Sara Gil", ou: "it", title: { en: "Service desk technician", es: "Técnica de service desk" }, dept: "IT",
      groups: ["GG-IT-Admins", "GG-M365-E3"], device: "PC-IT-004", pwdLastSet: "29/10/2026 07:55", lastLogon: "11/11/2026 07:58" },
    { sam: "olafuente", name: "Óscar Lafuente", ou: "it", title: { en: "IT infrastructure lead", es: "Responsable de infraestructura IT" }, dept: "IT",
      groups: ["GG-IT-Admins", "GG-M365-E3", "GG-VPN-Users"], device: "PC-IT-001", pwdLastSet: "02/11/2026 08:15", lastLogon: "12/11/2026 07:49" },
    { sam: "rlarrea", name: "Rodrigo Larrea", ou: "markets", title: { en: "FX trader, Contoso Markets trading floor (Madrid)", es: "Trader de divisas, sala de trading de Contoso Markets (Madrid)" }, dept: "Markets",
      groups: ["GG-Finance", "GG-M365-E3", "GG-VPN-Users"], device: "LAPTOP-0441", pwdLastSet: "21/10/2026 07:40", lastLogon: "11/11/2026 18:05" },
    { sam: "mugarte", name: "Mikel Ugarte", ou: "hospitality", title: { en: "Front office manager, Hotel Ribera (Contoso Hospitality)", es: "Jefe de recepción, Hotel Ribera (Contoso Hospitality)" }, dept: "Hospitality",
      groups: ["GG-Stores-All", "GG-M365-E3"], device: "PC-HTL-REC01", pwdLastSet: "15/10/2026 07:30", lastLogon: "12/11/2026 07:02" },
    { sam: "lzubiaurre", name: "Leire Zubiaurre", ou: "hospitality", title: { en: "Technical services, Hotel Ribera (Contoso Hospitality)", es: "Servicios técnicos, Hotel Ribera (Contoso Hospitality)" }, dept: "Hospitality",
      groups: ["GG-Stores-All", "GG-M365-F3"], device: "PC-HTL-MNT01", pwdLastSet: "28/10/2026 08:00", lastLogon: "12/11/2026 08:20" },
    { sam: "dvega", name: "Daniel Vega", ou: "it", title: { en: "Endpoint engineer", es: "Técnico de puesto de trabajo" }, dept: "IT",
      groups: ["GG-IT-Admins", "GG-M365-E3", "GG-VPN-Users"], device: "PC-IT-002", pwdLastSet: "16/10/2026 08:05", lastLogon: "11/11/2026 08:10" },
    { sam: "aechevarria", name: "Asier Echevarría", ou: "it", title: { en: "Network engineer", es: "Técnico de redes" }, dept: "IT",
      groups: ["GG-IT-Admins", "GG-M365-E3", "GG-VPN-Users"], device: "PC-IT-005", pwdLastSet: "21/10/2026 08:20", lastLogon: "12/11/2026 08:29" },
    { sam: "iolano", name: "Itziar Olano", ou: "hospitality", title: { en: "Shift lead, Contoso Hospitality booking centre (Bilbao)", es: "Jefa de turno, central de reservas de Contoso Hospitality (Bilbao)" }, dept: "Hospitality",
      groups: ["GG-Stores-All", "GG-M365-E3"], device: "TC-RES-07", pwdLastSet: "22/10/2026 15:05", lastLogon: "12/11/2026 15:01" },
    { sam: "murrutia", name: "Maite Urrutia", ou: "health", title: { en: "Ward 3 nursing supervisor, Clínica Contoso Salud (Bilbao)", es: "Supervisora de enfermería de la planta 3, Clínica Contoso Salud (Bilbao)" }, dept: "Health",
      groups: ["GG-Clinic-Ward3", "GG-M365-F3"], device: "PC-CLN-P3-01", pwdLastSet: "02/11/2026 07:40", lastLogon: "12/11/2026 07:52" },
    { sam: "kwisniewska", name: "Katarzyna Wiśniewska", ou: "accounting", title: { en: "Accountant, Wrocław plant (Poland)", es: "Contable, planta de Wrocław (Polonia)" }, dept: "Accounting",
      groups: ["GG-Finance", "GG-M365-E3"], device: "PC-WRO-014", pwdLastSet: "19/10/2026 08:10", lastLogon: "12/11/2026 08:02" },
    // v0.18: everyone the tickets name (requesters, the people in the decision cases' case files, the colleagues in the outputs)
    { sam: "arios", name: "Alberto Ríos", ou: "facilities", title: { en: "Facilities technician (data room, UPS and racks)", es: "Técnico de servicios generales (sala técnica, SAI y racks)" }, dept: "Facilities",
      groups: ["GG-M365-E3", "GG-Printers-HQ"], device: "PC-FAC-002", pwdLastSet: "06/10/2026 08:05", lastLogon: "12/11/2026 08:10" },
    { sam: "icastro", name: "Irene Castro", ou: "facilities", title: { en: "Facilities coordinator (moves and new desks)", es: "Coordinadora de servicios generales (traslados y puestos nuevos)" }, dept: "Facilities",
      groups: ["GG-M365-E3", "GG-Printers-HQ"], device: "LAPTOP-0433", pwdLastSet: "27/10/2026 09:00", lastLogon: "12/11/2026 08:44" },
    { sam: "nvega", name: "Nuria Vega", ou: "facilities", title: { en: "Receptionist, head office", es: "Recepcionista, oficina central" }, dept: "Reception",
      groups: ["GG-Reception", "GG-M365-F3", "GG-Printers-HQ"], device: "PC-REC-001", pwdLastSet: "13/10/2026 08:00", lastLogon: "12/11/2026 08:01" },
    { sam: "bherrero", name: "Beatriz Herrero", ou: "hr", title: { en: "People partner (joiners and leavers)", es: "People partner (altas y bajas)" }, dept: "HR",
      groups: ["GG-HR", "GG-M365-E3", "GG-Printers-HQ"], device: "PC-RRHH-002", pwdLastSet: "09/10/2026 08:30", lastLogon: "12/11/2026 08:35" },
    { sam: "icastillo", name: "Irene Castillo", ou: "sales", title: { en: "Branch manager, Valencia branch", es: "Directora de la sucursal de Valencia" }, dept: "Sales",
      groups: ["GG-Sales", "GG-Sales-Managers", "GG-M365-E3"], device: "PC-VLC-011", pwdLastSet: "15/10/2026 08:20", lastLogon: "12/11/2026 08:25" },
    { sam: "rblanco", name: "Rocío Blanco", ou: "sales", title: { en: "Sales office coordinator (password resets delegated on OU=Sales)", es: "Coordinadora de la oficina de Ventas (restablecimientos delegados en OU=Sales)" }, dept: "Sales",
      groups: ["GG-Sales", "GG-M365-E3", "GG-Printers-HQ"], device: "LAPTOP-0268", pwdLastSet: "01/10/2026 08:40", lastLogon: "12/11/2026 08:30" },
    { sam: "hserrano", name: "Hugo Serrano", ou: "sales", title: { en: "Sales representative", es: "Comercial" }, dept: "Sales",
      groups: ["GG-Sales", "GG-M365-E3", "GG-VPN-Users"], device: "LAPTOP-0266", pwdLastSet: "22/10/2026 09:10", lastLogon: "12/11/2026 09:20" },
    { sam: "svidal", name: "Sergio Vidal", ou: "sales", title: { en: "Sales representative (new starter)", es: "Comercial (nueva incorporación)" }, dept: "Sales",
      groups: ["GG-Sales", "GG-M365-E3"], device: "LAPTOP-0267", pwdLastSet: "12/11/2026 08:00", lastLogon: "12/11/2026 08:58" },
    { sam: "hsanz", name: "Hugo Sanz", ou: "sales", title: { en: "Sales representative (left in September)", es: "Comercial (baja en septiembre)" }, dept: "Sales",
      groups: [], device: "", pwdLastSet: "02/06/2026 09:00", lastLogon: "30/09/2026 17:12", enabled: false },
    { sam: "rgomez", name: "Rubén Gómez", ou: "sales", title: { en: "Account manager (left on 30/09)", es: "Gestor de cuentas (baja el 30/09)" }, dept: "Sales",
      groups: [], device: "", pwdLastSet: "18/07/2026 08:50", lastLogon: "30/09/2026 18:02", enabled: false },
    { sam: "mgil", name: "Marina Gil", ou: "legal", title: { en: "Paralegal (new starter)", es: "Asistente jurídica (nueva incorporación)" }, dept: "Legal",
      groups: ["GG-Legal", "GG-M365-E3", "GG-Printers-HQ"], device: "LAPTOP-0396", pwdLastSet: "12/11/2026 08:15", lastLogon: "", mustChange: true },
    { sam: "barana", name: "Beatriz Arana", ou: "it", title: { en: "Information security officer", es: "Responsable de seguridad de la información" }, dept: "IT security",
      groups: ["GG-M365-E3", "GG-Printers-HQ"], device: "PC-SEC-001", pwdLastSet: "20/10/2026 08:00", lastLogon: "12/11/2026 08:05" },
    { sam: "blasa", name: "Beatriz Lasa", ou: "it", title: { en: "Security analyst (SOC, privileged access)", es: "Analista de seguridad (SOC, accesos privilegiados)" }, dept: "IT security",
      groups: ["GG-IT-Admins", "GG-M365-E3", "GG-VPN-Users"], device: "PC-IT-007", pwdLastSet: "26/10/2026 07:50", lastLogon: "12/11/2026 07:55" },
    { sam: "bsalas", name: "Bruno Salas", ou: "it", title: { en: "Security engineer (logs, patching and firmware)", es: "Ingeniero de seguridad (registros, parches y firmware)" }, dept: "IT security",
      groups: ["GG-IT-Admins", "GG-M365-E3", "GG-VPN-Users"], device: "PC-IT-008", pwdLastSet: "30/10/2026 08:10", lastLogon: "12/11/2026 08:12" },
    { sam: "samolina", name: "Sara Molina", ou: "it", title: { en: "Night operator, IT operations", es: "Operadora de noche, operaciones de IT" }, dept: "IT",
      groups: ["GG-IT-Admins", "GG-M365-E3"], device: "PC-IT-006", pwdLastSet: "03/11/2026 22:05", lastLogon: "12/11/2026 06:58" },
    { sam: "sprieto", name: "Sonia Prieto", ou: "it", title: { en: "NOC operator (network monitoring)", es: "Operadora del NOC (monitorización de red)" }, dept: "IT",
      groups: ["GG-IT-Admins", "GG-M365-E3"], device: "PC-NOC-01", pwdLastSet: "28/10/2026 07:00", lastLogon: "12/11/2026 07:02" },
    { sam: "rcalvo", name: "Rubén Calvo", ou: "it", title: { en: "DBA, Finance applications (SQL Server and PostgreSQL)", es: "DBA, aplicaciones de Finanzas (SQL Server y PostgreSQL)" }, dept: "IT",
      groups: ["GG-IT-Admins", "GG-M365-E3", "GG-VPN-Users"], device: "PC-IT-009", pwdLastSet: "05/11/2026 08:20", lastLogon: "12/11/2026 08:22" },
    { sam: "jsanz", name: "Jorge Sanz", ou: "it", title: { en: "Development lead (in-house apps)", es: "Responsable de desarrollo (aplicaciones propias)" }, dept: "IT",
      groups: ["GG-M365-E3", "GG-VPN-Users"], device: "LAPTOP-0472", pwdLastSet: "08/10/2026 09:15", lastLogon: "12/11/2026 09:01" },
    { sam: "giturbe", name: "Gorka Iturbe", ou: "markets", title: { en: "Quant researcher, Contoso Markets (GPU cluster user)", es: "Investigador cuantitativo, Contoso Markets (usuario del clúster de GPU)" }, dept: "Markets",
      groups: ["GG-M365-E3", "GG-VPN-Users"], device: "LAPTOP-0463", pwdLastSet: "16/10/2026 08:45", lastLogon: "12/11/2026 08:50" },
    { sam: "mgil.trd", name: "Marta Gil", ou: "markets", title: { en: "Trader, Contoso Markets trading floor (Madrid)", es: "Trader, sala de trading de Contoso Markets (Madrid)" }, dept: "Markets",
      groups: ["GG-M365-E3", "GG-VPN-Users"], device: "LAPTOP-0442", pwdLastSet: "22/10/2026 07:35", lastLogon: "12/11/2026 07:40" },
    { sam: "alasa", name: "Amaia Lasa", ou: "hospitality", title: { en: "General manager, Hotel Ribera Donostia (opens 24/11)", es: "Directora, Hotel Ribera Donostia (abre el 24/11)" }, dept: "Hospitality",
      groups: ["GG-Stores-All", "GG-M365-E3"], device: "LAPTOP-0471", pwdLastSet: "02/11/2026 10:00", lastLogon: "12/11/2026 10:12" },
    { sam: "aetxebarria", name: "Amaia Etxebarria", ou: "health", title: { en: "Ward 3 nurse, Clínica Contoso Salud (Bilbao)", es: "Enfermera de la planta 3, Clínica Contoso Salud (Bilbao)" }, dept: "Health",
      groups: ["GG-Clinic-Ward3", "GG-M365-F3"], device: "PC-CLN-P3-01", pwdLastSet: "29/10/2026 07:30", lastLogon: "12/11/2026 07:41" },
    { sam: "mibarra", name: "Marta Ibarra", ou: "health", title: { en: "DBA, clinical systems (Oracle for SaludNet)", es: "DBA, sistemas clínicos (Oracle de SaludNet)" }, dept: "Health",
      groups: ["GG-M365-E3", "GG-VPN-Users"], device: "PC-CLN-IT01", pwdLastSet: "21/10/2026 08:00", lastLogon: "12/11/2026 08:03" },
    { sam: "izabala", name: "Iñaki Zabala", ou: "health", title: { en: "Medical director, Clínica Contoso Salud (Dr.)", es: "Director médico, Clínica Contoso Salud (Dr.)" }, dept: "Health",
      groups: ["GG-M365-E3"], device: "PC-CLN-DIR01", pwdLastSet: "14/10/2026 08:30", lastLogon: "12/11/2026 08:40" },
    { sam: "eruiz", name: "Elena Ruiz", ou: "health", title: { en: "Pharmacist, Clínica Contoso Salud (on call)", es: "Farmacéutica, Clínica Contoso Salud (de guardia)" }, dept: "Health",
      groups: ["GG-M365-F3"], device: "PC-CLN-FAR01", pwdLastSet: "19/10/2026 07:20", lastLogon: "12/11/2026 07:25" },
    // v0.19: the people of the career level 8 cases (IT management): the IT director, the CFO, the service desk lead, the change manager,
    // procurement, internal audit, Contoso Markets' COO and internal communications
    { sam: "earrese", name: "Elena Arrese", ou: "it", title: { en: "Group IT director", es: "Directora de IT del grupo" }, dept: "IT",
      groups: ["GG-M365-E3", "GG-VPN-Users"], device: "LAPTOP-0480", pwdLastSet: "26/10/2026 08:00", lastLogon: "13/11/2026 08:05" },
    { sam: "iferrer", name: "Ignacio Ferrer", ou: "finance", title: { en: "Group CFO", es: "Director financiero del grupo" }, dept: "Finance",
      groups: ["GG-Finance", "GG-M365-E3", "GG-VPN-Users"], device: "LAPTOP-0481", pwdLastSet: "19/10/2026 08:30", lastLogon: "13/11/2026 08:40" },
    { sam: "lmendez", name: "Laura Méndez", ou: "it", title: { en: "Service desk team lead", es: "Coordinadora del service desk" }, dept: "IT",
      groups: ["GG-IT-Admins", "GG-M365-E3"], device: "PC-IT-010", pwdLastSet: "02/11/2026 07:45", lastLogon: "13/11/2026 07:50" },
    { sam: "nlarranaga", name: "Nekane Larrañaga", ou: "it", title: { en: "Change manager (chairs the CAB)", es: "Gestora de cambios (preside el CAB)" }, dept: "IT",
      groups: ["GG-M365-E3"], device: "PC-IT-011", pwdLastSet: "28/10/2026 08:10", lastLogon: "13/11/2026 08:12" },
    { sam: "pgarate", name: "Patricia Gárate", ou: "finance", title: { en: "Procurement manager (IT contracts)", es: "Responsable de compras (contratos de IT)" }, dept: "Procurement",
      groups: ["GG-Finance", "GG-M365-E3", "GG-Printers-HQ"], device: "PC-FIN-040", pwdLastSet: "21/10/2026 08:25", lastLogon: "13/11/2026 08:30" },
    { sam: "jolabarria", name: "Javier Olabarria", ou: "finance", title: { en: "Internal auditor (IT audit)", es: "Auditor interno (auditoría de IT)" }, dept: "Internal audit",
      groups: ["GG-M365-E3", "GG-VPN-Users"], device: "LAPTOP-0484", pwdLastSet: "15/10/2026 09:00", lastLogon: "13/11/2026 09:10" },
    { sam: "aurquijo", name: "Andrés Urquijo", ou: "markets", title: { en: "COO, Contoso Markets", es: "Director de operaciones, Contoso Markets" }, dept: "Markets",
      groups: ["GG-M365-E3", "GG-VPN-Users"], device: "LAPTOP-0482", pwdLastSet: "20/10/2026 07:30", lastLogon: "13/11/2026 07:35" },
    { sam: "mazkue", name: "Maialen Azkue", ou: "marketing", title: { en: "Internal communications", es: "Comunicación interna" }, dept: "Marketing",
      groups: ["GG-Marketing", "GG-M365-E3"], device: "LAPTOP-0483", pwdLastSet: "29/10/2026 09:20", lastLogon: "13/11/2026 09:25" },
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
    { name: "LAPTOP-0395", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "nprieto" },
    { name: "LAPTOP-0272", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "smolina" },
    { name: "LAPTOP-0281", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "pherrero", note: { en: "Entra ID joined (cloud only): managed in Intune, with Endpoint Privilege Management", es: "Unido a Entra ID (solo nube): se gestiona en Intune, con Endpoint Privilege Management" } },
    { name: "PC-FIN-036", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "irey" },
    { name: "LAPTOP-0412", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "imontero" },
    { name: "PC-ZAR-011", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "ribanez", note: { en: "Shift office, Zaragoza plant", es: "Oficina de turno, planta de Zaragoza" } },
    { name: "TPV-T03-01", ou: "desktops", os: "Windows 11 IoT Enterprise", user: null, note: { en: "Till PC, Store 03 Bilbao (shared)", es: "PC de caja, Tienda 03 Bilbao (compartido)" } },
    { name: "TPV-T07-01", ou: "desktops", os: "Windows 11 IoT Enterprise", user: null, note: { en: "Till PC, Store 07 Valencia (shared)", es: "PC de caja, Tienda 07 Valencia (compartido)" } },
    { name: "TPV-T12-01", ou: "desktops", os: "Windows 11 IoT Enterprise", user: null, note: { en: "Till PC, Store 12 Sevilla (shared), Zebra label printer on USB", es: "PC de caja, Tienda 12 Sevilla (compartido), impresora de etiquetas Zebra por USB" } },
    { name: "PC-SALA-CANT", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: null, note: { en: "Room PC, Sala Cantábrico (4th floor), next to the Poly G7500 codec", es: "PC de sala, Sala Cantábrico (4ª planta), junto al códec Poly G7500" } },
    { name: "MTR-SALA2", ou: "desktops", os: "Windows 11 IoT Enterprise", user: null, note: { en: "Microsoft Teams Rooms console, meeting room 2 (2nd floor)", es: "Consola de Microsoft Teams Rooms, sala de reuniones 2 (2ª planta)" } },
    { name: "ADM-WS01", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "it.admin" },
    { name: "PC-IT-001", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "olafuente" },
    { name: "LAPTOP-0441", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "rlarrea", note: { en: "Trader's travel laptop, Entra ID joined, managed in Intune, FIDO2 key", es: "Portátil de viaje del trader, unido a Entra ID, gestionado en Intune, llave FIDO2" } },
    { name: "PC-HTL-REC01", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "mugarte", note: { en: "Reception PC, Hotel Ribera Bilbao (PMS front office)", es: "PC de recepción, Hotel Ribera Bilbao (recepción del PMS)" } },
    { name: "PC-HTL-MNT01", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "lzubiaurre", note: { en: "Technical services office, Hotel Ribera Bilbao", es: "Oficina de servicios técnicos, Hotel Ribera Bilbao" } },
    { name: "PC-IT-002", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "dvega" },
    { name: "PC-IT-004", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "sgil" },
    { name: "PC-IT-005", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "aechevarria" },
    { name: "PC-RRHH-004", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "ncastro" },
    { name: "MAC-0019", ou: "laptops", os: "macOS 15 Sequoia", user: "msoler", note: { en: "MacBook Pro, managed with Jamf Pro (not joined to the domain)", es: "MacBook Pro, gestionado con Jamf Pro (no unido al dominio)" } },
    { name: "WH-PC-01", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "ietxeberria", note: { en: "Warehouse, loading bay (one of WH-PC-01 to WH-PC-12, OU=Warehouse)", es: "Almacén, muelle de carga (uno de WH-PC-01 a WH-PC-12, OU=Warehouse)" },
      also: range("WH-PC-", 2, 12, 2) },
    { name: "TPV-RIB-01", ou: "desktops", os: "Windows 11 IoT Enterprise", user: null, note: { en: "Main POS PC, Restaurante Ribera (HioPOS)", es: "PC principal del TPV, Restaurante Ribera (HioPOS)" } },
    { name: "TC-RES-07", ou: "desktops", os: "IGEL OS 12 (Horizon client)", user: "iolano", note: { en: "Thin client, booking centre (one of 30): connects to the Horizon pool CALL-W11", es: "Cliente ligero, central de reservas (uno de 30): se conecta al pool de Horizon CALL-W11" } },
    { name: "PC-CLN-P3-01", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: null, note: { en: "Ward 3 nurses' station PC, Clínica Contoso Salud (shared; Citrix Workspace)", es: "PC del control de enfermería de la planta 3, Clínica Contoso Salud (compartido; Citrix Workspace)" } },
    { name: "LAPTOP-0451", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: null, note: { en: "New starter laptop (Autopilot, GD-Win-Autopilot-2026), one of LAPTOP-0451 to 0456", es: "Portátil de nueva incorporación (Autopilot, GD-Win-Autopilot-2026), uno de LAPTOP-0451 a 0456" },
      also: range("LAPTOP-0", 452, 456, 3) },
    { name: "PC-WRO-014", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "kwisniewska", note: { en: "Accounting, Wrocław plant (Poland), LAN 10.20.80.0/24", es: "Contabilidad, planta de Wrocław (Polonia), LAN 10.20.80.0/24" } },
    { name: "PC-DSN-01", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: null, note: { en: "Render PC, Marketing design studio (one of PC-DSN-01 to 03)", es: "PC de render, estudio de diseño de Marketing (uno de PC-DSN-01 a 03)" }, also: ["PC-DSN-02", "PC-DSN-03"] },
    { name: "LAPTOP-RIB-02", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "agoikoetxea", note: { en: "Office laptop, Restaurante Ribera", es: "Portátil de la oficina, Restaurante Ribera" } },
    // v0.18: every PC, laptop, till and thin client the tickets name. `also` lists the identical machines of the same batch.
    { name: "PC-FAC-002", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "arios", note: { en: "Facilities office, ground floor", es: "Oficina de servicios generales, planta baja" } },
    { name: "LAPTOP-0433", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "icastro", note: { en: "3rd floor (VLAN 160, 10.20.16.0/24)", es: "3ª planta (VLAN 160, 10.20.16.0/24)" } },
    { name: "LAPTOP-0434", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: null, note: { en: "New laptops for the 3rd floor's move (VLAN 160)", es: "Portátiles nuevos del traslado de la 3ª planta (VLAN 160)" },
      also: ["LAPTOP-0439", "LAPTOP-0447"] },
    { name: "LAPTOP-0311", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: null, note: { en: "3rd floor, Marketing (VLAN 160)", es: "3ª planta, Marketing (VLAN 160)" }, also: ["LAPTOP-0352"] },
    { name: "PC-MKT-001", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: null, note: { en: "Marketing, 3rd floor (VLAN 160)", es: "Marketing, 3ª planta (VLAN 160)" }, also: ["PC-MKT-002", "PC-MKT-042"] },
    { name: "PC-FIN-019", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: null, note: { en: "Finance, 2nd floor (behind an IP phone on SW-ACC-2F)", es: "Finanzas, 2ª planta (detrás de un teléfono IP en SW-ACC-2F)" },
      also: ["PC-FIN-024", "PC-FIN-025"] },
    { name: "PC-RRHH-002", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "bherrero" },
    { name: "PC-VLC-011", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "icastillo", note: { en: "Valencia branch, 10.40.10.23 (behind SW-VLC-01)", es: "Sucursal de Valencia, 10.40.10.23 (detrás de SW-VLC-01)" } },
    { name: "PC-VLC-014", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: null, note: { en: "Valencia branch, 10.40.10.27", es: "Sucursal de Valencia, 10.40.10.27" } },
    { name: "PC-SEC-001", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "barana", note: { en: "Information security, 3rd floor", es: "Seguridad de la información, 3ª planta" } },
    { name: "PC-IT-006", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "samolina" },
    { name: "PC-IT-007", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "blasa" },
    { name: "PC-IT-008", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "bsalas" },
    { name: "PC-IT-009", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "rcalvo" },
    { name: "PC-NOC-01", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "sprieto", note: { en: "NOC console (Orion, Zabbix and the alarm wall)", es: "Consola del NOC (Orion, Zabbix y la pared de alarmas)" } },
    { name: "LAPTOP-0266", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "hserrano" },
    { name: "LAPTOP-0267", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "svidal" },
    { name: "LAPTOP-0268", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "rblanco" },
    { name: "LAPTOP-0396", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "mgil" },
    { name: "LAPTOP-0442", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "mgil.trd", note: { en: "Trader's laptop, Entra ID joined, FIDO2 key", es: "Portátil de trader, unido a Entra ID, llave FIDO2" } },
    { name: "LAPTOP-0463", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "giturbe", note: { en: "Quant research, trading floor (Madrid)", es: "Investigación cuantitativa, sala de trading (Madrid)" } },
    { name: "LAPTOP-0471", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "alasa", note: { en: "Hotel Ribera Donostia, opening team", es: "Hotel Ribera Donostia, equipo de apertura" } },
    { name: "LAPTOP-0472", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "jsanz" },
    { name: "LAPTOP-0198", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: null, note: { en: "At the vendor under RMA since 01/10", es: "En el fabricante por RMA desde el 01/10" } },
    { name: "PC-ZAR-019", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: null, note: { en: "Zaragoza plant, production area (closed for works)", es: "Planta de Zaragoza, zona de producción (cerrada por obras)" } },
    { name: "ZAR-ENG01", ou: "desktops", os: "Windows 10 Enterprise LTSC 2019", user: null, note: { en: "Engineering station, Zaragoza plant (TIA Portal), production VLAN 170", es: "Estación de ingeniería, planta de Zaragoza (TIA Portal), VLAN 170 de producción" } },
    { name: "MR-1B-PC", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: null, note: { en: "Meeting room 1B PC (shared)", es: "PC de la sala de reuniones 1B (compartido)" } },
    { name: "MAC-0007", ou: "laptops", os: "macOS 15 Sequoia", user: null, note: { en: "Marketing MacBook, managed with Jamf Pro", es: "MacBook de Marketing, gestionado con Jamf Pro" },
      also: ["MAC-0011", "MAC-0012", "MAC-0014", "MAC-0015", "MAC-0017"] },
    { name: "WH-UBU-01", ou: "desktops", os: "Ubuntu 24.04 LTS Desktop", user: null, note: { en: "Warehouse packing station, managed with Landscape (tag 'warehouse')", es: "Puesto de embalaje del almacén, gestionado con Landscape (etiqueta «warehouse»)" },
      also: range("WH-UBU-", 2, 8, 2) },
    { name: "TPV-T07-02", ou: "desktops", os: "Windows 11 IoT Enterprise", user: null, note: { en: "Second till PC, Store 07 Valencia", es: "Segundo PC de caja, Tienda 07 Valencia" } },
    { name: "TPV-C21-01", ou: "desktops", os: "Windows 11 IoT Enterprise", user: null, note: { en: "Till PC, Corner 21 (Galerías Nervión, Bilbao)", es: "PC de caja, Corner 21 (Galerías Nervión, Bilbao)" }, also: ["TPV-C21-02"] },
    { name: "CALL-W11-01", ou: "desktops", os: "Windows 11 Enterprise 24H2 (Horizon VDI)", user: null, note: { en: "Virtual desktop of the booking centre's Horizon pool CALL-W11 (one of 30)", es: "Escritorio virtual del pool de Horizon CALL-W11 de la central de reservas (uno de 30)" },
      also: range("CALL-W11-", 2, 30, 2) },
    { name: "PC-CLN-IT01", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "mibarra", note: { en: "Clinical systems office, Clínica Contoso Salud", es: "Oficina de sistemas clínicos, Clínica Contoso Salud" } },
    { name: "PC-CLN-DIR01", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "izabala", note: { en: "Medical director's office, Clínica Contoso Salud", es: "Despacho de la dirección médica, Clínica Contoso Salud" } },
    { name: "PC-CLN-FAR01", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "eruiz", note: { en: "Pharmacy, Clínica Contoso Salud (shared on call)", es: "Farmacia, Clínica Contoso Salud (compartido de guardia)" } },
    // v0.19: the IT management cases' people
    { name: "LAPTOP-0480", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "earrese" },
    { name: "LAPTOP-0481", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "iferrer" },
    { name: "LAPTOP-0482", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "aurquijo", note: { en: "Contoso Markets, trading floor management", es: "Contoso Markets, dirección de la sala de trading" } },
    { name: "LAPTOP-0483", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "mazkue" },
    { name: "LAPTOP-0484", ou: "laptops", os: "Windows 11 Enterprise 24H2", user: "jolabarria" },
    { name: "PC-IT-010", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "lmendez" },
    { name: "PC-IT-011", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "nlarranaga" },
    { name: "PC-FIN-040", ou: "desktops", os: "Windows 11 Enterprise 24H2", user: "pgarate" },
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
    { id: "FS-NEW01", role: { en: "File server: Archive share (replaced FS02 in October)", es: "Servidor de ficheros: carpeta Archivo (sustituyó a FS02 en octubre)" }, os: "Windows Server 2022", ip: "10.20.1.21",
      location: { en: "Head office data room, rack B", es: "Sala técnica de la oficina central, rack B" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
    { id: "PDQ01", role: { en: "PDQ Deploy and Inventory (software deployment)", es: "PDQ Deploy e Inventory (despliegue de software)" }, os: "Windows Server 2022", ip: "10.20.1.35",
      location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" }, owner: { en: "IT endpoints", es: "IT puesto de trabajo" }, patched: "14/10/2026" },
    { id: "PROXY01", role: { en: "Web proxy (Squid) with category filtering", es: "Proxy web (Squid) con filtrado por categorías" }, os: "Rocky Linux 9", ip: "10.20.1.40",
      location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "04/11/2026" },
    { id: "CONTOSO400", role: { en: "IBM i (AS400): accounting and suppliers application", es: "IBM i (AS400): aplicación de contabilidad y proveedores" }, os: "IBM i 7.5", ip: "10.20.1.50",
      location: { en: "Head office data room, rack C", es: "Sala técnica de la oficina central, rack C" }, owner: { en: "Finance applications", es: "Aplicaciones de Finanzas" }, patched: "20/09/2026" },
    { id: "DOCS-LNX01", role: { en: "Delivery notes app (scans), documents on /srv", es: "Aplicación de albaranes (escaneos), documentos en /srv" }, os: "Rocky Linux 9", ip: "10.20.1.44",
      location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" }, owner: { en: "Operations", es: "Operaciones" }, patched: "04/11/2026" },
    { id: "MON-UBU01", role: { en: "Zabbix server (pilot)", es: "Servidor Zabbix (piloto)" }, os: "Ubuntu Server 24.04 LTS", ip: "10.20.1.60",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "11/11/2026" },
    { id: "ORION01", role: { en: "SolarWinds Orion (network monitoring)", es: "SolarWinds Orion (monitorización de red)" }, os: "Windows Server 2022", ip: "10.20.1.62",
      location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
    { id: "BKP-LNX01", role: { en: "Backup server with the LTO-8 tape library", es: "Servidor de copias con la librería de cintas LTO-8" }, os: "Debian 12", ip: "10.20.1.46",
      location: { en: "Head office data room, rack C", es: "Sala técnica de la oficina central, rack C" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "04/11/2026" },
    { id: "PMS-HTL01", role: { en: "Hotel Ribera PMS and its interfaces (POS, keys, TV)", es: "PMS del Hotel Ribera y sus interfaces (TPV, llaves, TV)" }, os: "Windows Server 2022", ip: "10.20.61.15",
      location: { en: "Hotel Ribera Bilbao, rack room", es: "Hotel Ribera Bilbao, cuarto de rack" }, owner: { en: "Contoso Hospitality", es: "Contoso Hospitality" }, patched: "07/11/2026" },
    { id: "VMH-01", role: { en: "VMware ESXi host (Dell PowerEdge R750), iDRAC 10.20.99.41", es: "Host VMware ESXi (Dell PowerEdge R750), iDRAC 10.20.99.41" }, os: "VMware ESXi 8.0 U3", ip: "10.20.1.81",
      location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "21/10/2026" },
    { id: "VMH-02", role: { en: "VMware ESXi host (Dell PowerEdge R750), iDRAC 10.20.99.42", es: "Host VMware ESXi (Dell PowerEdge R750), iDRAC 10.20.99.42" }, os: "VMware ESXi 8.0 U3", ip: "10.20.1.82",
      location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "21/10/2026" },
    { id: "CACTI01", role: { en: "Cacti (SNMP traffic graphs of switches and the firewall)", es: "Cacti (gráficas de tráfico por SNMP de switches y cortafuegos)" }, os: "Debian 12", ip: "10.20.1.61",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "05/11/2026" },
    { id: "NAGIOS01", role: { en: "Nagios Core (stores' monitoring, before Zabbix)", es: "Nagios Core (monitorización de las tiendas, anterior a Zabbix)" }, os: "Ubuntu Server 22.04 LTS", ip: "10.20.1.63",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "28/10/2026" },
    { id: "WMS01", role: { en: "Warehouse management system (Contoso WMS 5) and the handheld scanners' service", es: "Sistema de gestión del almacén (Contoso WMS 5) y el servicio de los lectores de mano" }, os: "Windows Server 2022", ip: "10.20.1.70",
      location: { en: "Head office data room, rack B", es: "Sala técnica de la oficina central, rack B" }, owner: { en: "Operations (warehouse)", es: "Operaciones (almacén)" }, patched: "10/11/2026" },
    { id: "OCR-UBU01", role: { en: "Invoice reading (OCR) app, scans from the NAS over NFS", es: "Aplicación de lectura de facturas (OCR), escaneos del NAS por NFS" }, os: "Ubuntu Server 24.04 LTS", ip: "10.20.1.66",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "Accounting", es: "Contabilidad" }, patched: "12/11/2026" },
    { id: "WEB-UBU02", role: { en: "Apache web server: Restaurante Ribera's reservations site (test)", es: "Servidor web Apache: web de reservas del Restaurante Ribera (pruebas)" }, os: "Ubuntu Server 24.04 LTS", ip: "10.20.1.64",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "Marketing (web agency)", es: "Marketing (agencia web)" }, patched: "10/11/2026" },
    { id: "PRT-SRV01", role: { en: "Print server (22 queues)", es: "Servidor de impresión (22 colas)" }, os: "Windows Server 2022", ip: "10.20.1.30",
      location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
    { id: "HZN-CS01", role: { en: "VMware Horizon Connection Server (booking centre pool CALL-W11)", es: "VMware Horizon Connection Server (pool CALL-W11 de la central de reservas)" }, os: "Windows Server 2022", ip: "10.20.1.90",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
    { id: "OPS-DKR01", role: { en: "Docker host for operations apps (HR portal, Uptime Kuma)", es: "Host Docker de aplicaciones de operaciones (portal de RR. HH., Uptime Kuma)" }, os: "Ubuntu Server 24.04 LTS", ip: "10.20.1.72",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "10/11/2026" },
    { id: "ELK01", role: { en: "Elasticsearch and Kibana (central logs)", es: "Elasticsearch y Kibana (registros centralizados)" }, os: "Rocky Linux 9", ip: "10.20.1.68",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "03/11/2026" },
    { id: "ERP-RHEL01", role: { en: "ERP database (PostgreSQL) and report service, critical", es: "Base de datos del ERP (PostgreSQL) y servicio de informes, crítico" }, os: "Red Hat Enterprise Linux 9", ip: "10.20.1.55",
      location: { en: "Head office data room, rack C", es: "Sala técnica de la oficina central, rack C" }, owner: { en: "Finance applications", es: "Aplicaciones de Finanzas" }, patched: "21/10/2026" },
    { id: "LSC01", role: { en: "Canonical Landscape (Ubuntu fleet: warehouse PCs and servers)", es: "Canonical Landscape (flota Ubuntu: PC del almacén y servidores)" }, os: "Ubuntu Server 24.04 LTS", ip: "10.20.1.74",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "10/11/2026" },
    { id: "VCENTER01", role: { en: "VMware vCenter Server (cluster CL-PROD: VMH-01 and VMH-02, datastore DS-PROD-01; cluster CL-GEN: VMH-03 to VMH-08)", es: "VMware vCenter Server (clúster CL-PROD: VMH-01 y VMH-02, datastore DS-PROD-01; clúster CL-GEN: VMH-03 a VMH-08)" }, os: "vCenter Server Appliance 8.0 U3", ip: "10.20.1.80",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "21/10/2026" },
    { id: "HV-ZAR01", role: { en: "Hyper-V host, Zaragoza plant (VM ZAR-MES01, production tracking)", es: "Host Hyper-V, planta de Zaragoza (VM ZAR-MES01, seguimiento de producción)" }, os: "Windows Server 2022", ip: "10.20.70.15",
      location: { en: "Zaragoza plant, comms room", es: "Planta de Zaragoza, cuarto de comunicaciones" }, owner: { en: "Operations (Zaragoza plant)", es: "Operaciones (planta de Zaragoza)" }, patched: "07/10/2026" },
    { id: "NTX-HTL01", role: { en: "Nutanix AHV cluster, three nodes (PMS-HTL01 and the hotel's VMs)", es: "Clúster Nutanix AHV de tres nodos (PMS-HTL01 y las VM del hotel)" }, os: "Nutanix AOS 6.10 / AHV", ip: "10.20.61.30",
      location: { en: "Hotel Ribera Bilbao, rack room", es: "Hotel Ribera Bilbao, cuarto de rack" }, owner: { en: "Contoso Hospitality", es: "Contoso Hospitality" }, patched: "15/09/2026" },
    { id: "CL-ZAR-FS", role: { en: "File server cluster, Zaragoza plant (nodes ZAR-FSN01 and ZAR-FSN02, role FS-ZAR01: Producción share)", es: "Clúster de ficheros, planta de Zaragoza (nodos ZAR-FSN01 y ZAR-FSN02, rol FS-ZAR01: carpeta Producción)" }, os: "Windows Server 2022 (failover cluster)", ip: "10.20.70.20",
      location: { en: "Zaragoza plant, comms room", es: "Planta de Zaragoza, cuarto de comunicaciones" }, owner: { en: "Operations (Zaragoza plant)", es: "Operaciones (planta de Zaragoza)" }, patched: "14/10/2026" },
    { id: "ERP-APP01", role: { en: "Finance ERP application server (Contoso ERP 11 on IIS) for ERP_PROD on SQL-ERP01", es: "Servidor de aplicación del ERP de Finanzas (Contoso ERP 11 en IIS) de ERP_PROD en SQL-ERP01" }, os: "Windows Server 2022", ip: "10.20.1.54",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "Finance applications", es: "Aplicaciones de Finanzas" }, patched: "14/10/2026" },
    { id: "ERP-RHEL02", role: { en: "Streaming replica (hot standby) of the ERP's PostgreSQL on ERP-RHEL01, read by BI", es: "Réplica en streaming (hot standby) del PostgreSQL del ERP de ERP-RHEL01, la lee BI" }, os: "Red Hat Enterprise Linux 9", ip: "10.20.1.57",
      location: { en: "Head office data room, rack C (VM)", es: "Sala técnica de la oficina central, rack C (VM)" }, owner: { en: "Finance applications", es: "Aplicaciones de Finanzas" }, patched: "21/10/2026" },
    { id: "SQL-ERP01", role: { en: "SQL Server 2022: ERP_PROD (accounting, suppliers and payments)", es: "SQL Server 2022: ERP_PROD (contabilidad, proveedores y pagos)" }, os: "Windows Server 2022", ip: "10.20.1.53",
      location: { en: "Head office data room, rack C", es: "Sala técnica de la oficina central, rack C" }, owner: { en: "Finance applications", es: "Aplicaciones de Finanzas" }, patched: "14/10/2026" },
    { id: "TANIUM01", role: { en: "Tanium server (endpoint inventory, questions and patching)", es: "Servidor de Tanium (inventario de equipos, preguntas y parches)" }, os: "Windows Server 2022", ip: "10.20.1.77",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
    { id: "RPT-LNX01", role: { en: "Scheduled reports in Python (daily sales report)", es: "Informes programados en Python (informe diario de ventas)" }, os: "Ubuntu Server 24.04 LTS", ip: "10.20.1.76",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "10/11/2026" },
    { id: "PORTAL01", role: { en: "Stores' portal (Nginx and contoso-portal, Node.js)", es: "Portal de tiendas (Nginx y contoso-portal, Node.js)" }, os: "Ubuntu Server 24.04 LTS", ip: "10.20.1.78",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "Stores (web agency)", es: "Tiendas (agencia web)" }, patched: "10/11/2026" },
    { id: "WEB-WP01", role: { en: "Corporate website (WordPress in Docker Compose)", es: "Web corporativa (WordPress en Docker Compose)" }, os: "Ubuntu Server 24.04 LTS", ip: "10.20.1.65",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "Marketing", es: "Marketing" }, patched: "10/11/2026" },
    { id: "RPT-WIN02", role: { en: "Reports server: Contoso Report Scheduler (replaced RPT-WIN01 in CHG-4447)", es: "Servidor de informes: Contoso Report Scheduler (sustituyó a RPT-WIN01 en el CHG-4447)" }, os: "Windows Server 2022", ip: "10.20.1.83",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "Finance applications", es: "Aplicaciones de Finanzas" }, patched: "10/11/2026" },
    { id: "APP-IIS01", role: { en: "Stores' orders portal (IIS, site Pedidos)", es: "Portal de pedidos de las tiendas (IIS, sitio Pedidos)" }, os: "Windows Server 2022", ip: "10.20.1.84",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "Stores", es: "Tiendas" }, patched: "14/10/2026" },
    { id: "DB-MAR01", role: { en: "MariaDB: the stores' stock database", es: "MariaDB: base de datos de stock de las tiendas" }, os: "Ubuntu Server 24.04 LTS", ip: "10.20.1.71",
      location: { en: "Head office data room, rack C", es: "Sala técnica de la oficina central, rack C" }, owner: { en: "Stores", es: "Tiendas" }, patched: "10/11/2026" },
    { id: "RES-DB01", role: { en: "MySQL: Contoso Hospitality's booking database", es: "MySQL: base de datos de reservas de Contoso Hospitality" }, os: "Ubuntu Server 24.04 LTS", ip: "10.20.1.92",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "Contoso Hospitality", es: "Contoso Hospitality" }, patched: "10/11/2026" },
    { id: "NPS01", role: { en: "Network Policy Server (RADIUS for the switches' logins)", es: "Network Policy Server (RADIUS para el inicio de sesión de los switches)" }, os: "Windows Server 2022", ip: "10.20.1.14",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "12/11/2026" },
    { id: "RAD01", role: { en: "FreeRADIUS for the corporate Wi-Fi Contoso-Corp (PEAP against Active Directory)", es: "FreeRADIUS de la WiFi corporativa Contoso-Corp (PEAP contra Active Directory)" }, os: "Ubuntu Server 24.04 LTS", ip: "10.20.1.16",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "10/11/2026" },
    { id: "PBX01", role: { en: "Asterisk PBX (PJSIP): head office and booking centre phones, SIP trunk trunk-voip", es: "Centralita Asterisk (PJSIP): teléfonos de la oficina central y la central de reservas, troncal SIP trunk-voip" }, os: "Debian 12", ip: "10.20.1.18",
      location: { en: "Head office data room, rack B (VM)", es: "Sala técnica de la oficina central, rack B (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "03/11/2026" },
    { id: "DC-ZAR01", role: { en: "Domain controller and DNS, Zaragoza plant (site ZAR), VM on HV-ZAR01", es: "Controlador de dominio y DNS, planta de Zaragoza (sitio ZAR), VM en HV-ZAR01" }, os: "Windows Server 2022", ip: "10.20.70.10",
      location: { en: "Zaragoza plant, comms room (VM)", es: "Planta de Zaragoza, cuarto de comunicaciones (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
    { id: "DC-WRO01", role: { en: "Domain controller and DNS, Wrocław plant (site WRO)", es: "Controlador de dominio y DNS, planta de Wrocław (sitio WRO)" }, os: "Windows Server 2022", ip: "10.20.80.10",
      location: { en: "Wrocław plant (Poland), comms room", es: "Planta de Wrocław (Polonia), cuarto de comunicaciones" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
    { id: "PVWA01", role: { en: "CyberArk PVWA and CPM (privileged accounts: rotation and sessions)", es: "CyberArk PVWA y CPM (cuentas privilegiadas: rotación y sesiones)" }, os: "Windows Server 2022", ip: "10.20.1.145",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT security", es: "Seguridad IT" }, patched: "10/11/2026" },
    { id: "TRD-VOX01", role: { en: "Trading floor voice server: turret lines, private wires and the voice recorder", es: "Servidor de voz de la sala de trading: líneas de los turrets, private wires y grabador de voz" }, os: "Rocky Linux 9", ip: "10.20.1.144",
      location: { en: "Madrid trading floor, comms room", es: "Sala de trading de Madrid, cuarto de comunicaciones" }, owner: { en: "Treasury (trading floor)", es: "Tesorería (sala de trading)" }, patched: "03/11/2026" },
    { id: "RMQ-CLN01", role: { en: "RabbitMQ and the lab-bridge service: SaludNet orders to the lab system (Clínica Contoso Salud)", es: "RabbitMQ y el servicio lab-bridge: órdenes de SaludNet al sistema del laboratorio (Clínica Contoso Salud)" }, os: "Ubuntu Server 24.04 LTS", ip: "10.20.1.141",
      location: { en: "Head office data room, rack B (VM)", es: "Sala técnica de la oficina central, rack B (VM)" }, owner: { en: "Clínica Contoso Salud (integrations)", es: "Clínica Contoso Salud (integraciones)" }, patched: "10/11/2026" },
    { id: "PUP01", role: { en: "Puppet Server 8 and its CA (configuration of the Linux servers)", es: "Puppet Server 8 y su CA (configuración de los servidores Linux)" }, os: "Rocky Linux 9", ip: "10.20.1.142",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "10/11/2026" },
    { id: "KC01", role: { en: "Keycloak (single sign-on for the Operations portal, realm contoso federated with AD)", es: "Keycloak (inicio de sesión único del portal de Operaciones, realm contoso federado con AD)" }, os: "Rocky Linux 9", ip: "10.20.1.143",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "10/11/2026" },
    { id: "PCNS01", role: { en: "PowerChute Network Shutdown appliance: clean shutdown of VMH-01 and VMH-02 on UPS-SALA-A", es: "Appliance de PowerChute Network Shutdown: apagado ordenado de VMH-01 y VMH-02 con el UPS-SALA-A" }, os: "PowerChute Network Shutdown 5.1 (virtual appliance)", ip: "10.20.1.146",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
    { id: "FLEET01", role: { en: "Elastic Fleet Server (agents of the offices and stores, since CHG-4518)", es: "Elastic Fleet Server (agentes de oficinas y tiendas, desde el CHG-4518)" }, os: "Rocky Linux 9", ip: "10.20.1.148",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT security", es: "Seguridad IT" }, patched: "11/11/2026" },
    { id: "LB-RES01", role: { en: "Nginx balancer for the bookings app (Contoso Hospitality booking centre)", es: "Balanceador Nginx de la app de reservas (central de reservas de Contoso Hospitality)" }, os: "Ubuntu Server 24.04 LTS", ip: "10.20.1.149",
      location: { en: "Head office data room, rack B (VM)", es: "Sala técnica de la oficina central, rack B (VM)" }, owner: { en: "Contoso Hospitality (booking centre)", es: "Contoso Hospitality (central de reservas)" }, patched: "09/11/2026" },
    { id: "WEB-RES01", role: { en: "Bookings app, node 1 (PHP, port 8080)", es: "App de reservas, nodo 1 (PHP, puerto 8080)" }, os: "Ubuntu Server 24.04 LTS", ip: "10.20.1.150",
      location: { en: "Head office data room, rack B (VM)", es: "Sala técnica de la oficina central, rack B (VM)" }, owner: { en: "Contoso Hospitality (booking centre)", es: "Contoso Hospitality (central de reservas)" }, patched: "09/11/2026" },
    { id: "WEB-RES02", role: { en: "Bookings app, node 2 (PHP, port 8080, since CHG-4521)", es: "App de reservas, nodo 2 (PHP, puerto 8080, desde el CHG-4521)" }, os: "Ubuntu Server 24.04 LTS", ip: "10.20.1.151",
      location: { en: "Head office data room, rack B (VM)", es: "Sala técnica de la oficina central, rack B (VM)" }, owner: { en: "Contoso Hospitality (booking centre)", es: "Contoso Hospitality (central de reservas)" }, patched: "09/11/2026" },
    { id: "SPLUNK01", role: { en: "Splunk Enterprise (security logs: firewall, Windows, Linux)", es: "Splunk Enterprise (registros de seguridad: firewall, Windows, Linux)" }, os: "Rocky Linux 9", ip: "10.20.1.152",
      location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" }, owner: { en: "IT security", es: "Seguridad IT" }, patched: "02/11/2026" },
    { id: "OPS-JMP01", role: { en: "Admin and automation host: kubectl, Terraform, the Ansible control node", es: "Equipo de administración y automatización: kubectl, Terraform, el nodo de control de Ansible" }, os: "Rocky Linux 9", ip: "10.20.1.153",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "11/11/2026" },
    { id: "JENKINS01", role: { en: "Jenkins (the IT team's pipelines: it-scripts, infra-docs)", es: "Jenkins (los pipelines del equipo de IT: it-scripts, infra-docs)" }, os: "Ubuntu Server 24.04 LTS", ip: "10.20.1.154",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "05/11/2026" },
    { id: "HPC-CTL01", role: { en: "Slurm controller and login node of the quant research GPU cluster (gpu-n01 to gpu-n04)", es: "Controlador de Slurm y nodo de acceso del clúster de GPU de investigación cuantitativa (gpu-n01 a gpu-n04)" }, os: "Rocky Linux 9", ip: "10.20.1.155",
      location: { en: "Head office data room, rack C", es: "Sala técnica de la oficina central, rack C" }, owner: { en: "Quant research", es: "Investigación cuantitativa" }, patched: "04/11/2026" },
    { id: "GPU-N03", role: { en: "GPU node of the quant research cluster (Dell PowerEdge XE8545, 4 × NVIDIA A100 80GB), service tag 4GPQX93", es: "Nodo GPU del clúster de investigación cuantitativa (Dell PowerEdge XE8545, 4 × NVIDIA A100 80GB), etiqueta de servicio 4GPQX93" }, os: "Rocky Linux 9", ip: "10.20.1.158",
      location: { en: "Head office data room, rack C", es: "Sala técnica de la oficina central, rack C" }, owner: { en: "Quant research", es: "Investigación cuantitativa" }, patched: "04/11/2026" },
    // v0.18: every server the tickets and the case files name, at an address of its own
    { id: "APP-LNX01", role: { en: "Timesheets app (nginx and gunicorn, timesheets.contoso.local)", es: "Aplicación de fichajes (nginx y gunicorn, timesheets.contoso.local)" }, os: "Red Hat Enterprise Linux 9", ip: "10.20.1.41",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "HR", es: "RR. HH." }, patched: "04/11/2026" },
    { id: "ERPWEB02", role: { en: "ERP web front (erp.contoso.local, since CHG-4471; replaced ERPWEB01)", es: "Frontal web del ERP (erp.contoso.local, desde el CHG-4471; sustituyó a ERPWEB01)" }, os: "Windows Server 2022", ip: "10.20.1.52",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "Finance applications", es: "Aplicaciones de Finanzas" }, patched: "14/10/2026" },
    { id: "VBR01", role: { en: "Veeam Backup & Replication 12 (jobs FS01 Nightly and SQL-ERP01 Nightly, repository REPO01 on E:)", es: "Veeam Backup & Replication 12 (jobs FS01 Nightly y SQL-ERP01 Nightly, repositorio REPO01 en E:)" }, os: "Windows Server 2022", ip: "10.20.1.36",
      location: { en: "Head office data room, rack C (on BKP-PE01)", es: "Sala técnica de la oficina central, rack C (en BKP-PE01)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
    { id: "SYNC01", role: { en: "Microsoft Entra Connect Sync (AD to Entra ID)", es: "Microsoft Entra Connect Sync (de AD a Entra ID)" }, os: "Windows Server 2022", ip: "10.20.1.37",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
    { id: "STOCK-APP01", role: { en: "StockTienda application server (the stores' stock app; database on DB-MAR01)", es: "Servidor de aplicación de StockTienda (la app de stock de las tiendas; base de datos en DB-MAR01)" }, os: "Ubuntu Server 24.04 LTS", ip: "10.20.1.88",
      location: { en: "Head office data room, rack B (VM)", es: "Sala técnica de la oficina central, rack B (VM)" }, owner: { en: "Stores", es: "Tiendas" }, patched: "10/11/2026" },
    { id: "CTX-DDC01", role: { en: "Citrix Delivery Controller (delivery groups Contoso Apps and Clinical-W2022)", es: "Citrix Delivery Controller (grupos de entrega Contoso Apps y Clinical-W2022)" }, os: "Windows Server 2022", ip: "10.20.1.100",
      location: { en: "Head office data room, rack B (VM)", es: "Sala técnica de la oficina central, rack B (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
    { id: "CTX-VDA01", role: { en: "Citrix multi-session VDA, delivery group Contoso Apps (Contoso CRM)", es: "VDA multisesión de Citrix, grupo de entrega Contoso Apps (Contoso CRM)" }, os: "Windows Server 2022", ip: "10.20.1.101",
      location: { en: "Head office data room, rack B (VM)", es: "Sala técnica de la oficina central, rack B (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
    { id: "CTX-VDA02", role: { en: "Citrix multi-session VDA, delivery group Contoso Apps (Contoso CRM)", es: "VDA multisesión de Citrix, grupo de entrega Contoso Apps (Contoso CRM)" }, os: "Windows Server 2022", ip: "10.20.1.102",
      location: { en: "Head office data room, rack B (VM)", es: "Sala técnica de la oficina central, rack B (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
    { id: "CTX-VDA03", role: { en: "Citrix multi-session VDA, delivery group Contoso Apps (Contoso CRM)", es: "VDA multisesión de Citrix, grupo de entrega Contoso Apps (Contoso CRM)" }, os: "Windows Server 2022", ip: "10.20.1.103",
      location: { en: "Head office data room, rack B (VM)", es: "Sala técnica de la oficina central, rack B (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
    { id: "CTX-VDA04", role: { en: "Citrix multi-session VDA, delivery group Contoso Apps (Contoso CRM)", es: "VDA multisesión de Citrix, grupo de entrega Contoso Apps (Contoso CRM)" }, os: "Windows Server 2022", ip: "10.20.1.104",
      location: { en: "Head office data room, rack B (VM)", es: "Sala técnica de la oficina central, rack B (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
    { id: "CTX-CLN01", role: { en: "Citrix VDA, delivery group Clinical-W2022 (SaludNet for the wards)", es: "VDA de Citrix, grupo de entrega Clinical-W2022 (SaludNet para las plantas)" }, os: "Windows Server 2022", ip: "10.20.1.105",
      location: { en: "Head office data room, rack B (VM)", es: "Sala técnica de la oficina central, rack B (VM)" }, owner: { en: "Clínica Contoso Salud (clinical systems)", es: "Clínica Contoso Salud (sistemas clínicos)" }, patched: "14/10/2026" },
    { id: "CTX-CLN02", role: { en: "Citrix VDA, delivery group Clinical-W2022 (SaludNet for the wards)", es: "VDA de Citrix, grupo de entrega Clinical-W2022 (SaludNet para las plantas)" }, os: "Windows Server 2022", ip: "10.20.1.106",
      location: { en: "Head office data room, rack B (VM)", es: "Sala técnica de la oficina central, rack B (VM)" }, owner: { en: "Clínica Contoso Salud (clinical systems)", es: "Clínica Contoso Salud (sistemas clínicos)" }, patched: "14/10/2026" },
    { id: "CTX-CLN03", role: { en: "Citrix VDA, delivery group Clinical-W2022 (SaludNet for the wards)", es: "VDA de Citrix, grupo de entrega Clinical-W2022 (SaludNet para las plantas)" }, os: "Windows Server 2022", ip: "10.20.1.107",
      location: { en: "Head office data room, rack B (VM)", es: "Sala técnica de la oficina central, rack B (VM)" }, owner: { en: "Clínica Contoso Salud (clinical systems)", es: "Clínica Contoso Salud (sistemas clínicos)" }, patched: "14/10/2026" },
    { id: "CTX-CLN04", role: { en: "Citrix VDA, delivery group Clinical-W2022 (SaludNet for the wards)", es: "VDA de Citrix, grupo de entrega Clinical-W2022 (SaludNet para las plantas)" }, os: "Windows Server 2022", ip: "10.20.1.108",
      location: { en: "Head office data room, rack B (VM)", es: "Sala técnica de la oficina central, rack B (VM)" }, owner: { en: "Clínica Contoso Salud (clinical systems)", es: "Clínica Contoso Salud (sistemas clínicos)" }, patched: "14/10/2026" },
    { id: "ORA-CLN01", role: { en: "Oracle Database 19c for SaludNet, the clinic's 24x7 clinical record (out of hardware support on 31/12)", es: "Oracle Database 19c de SaludNet, la historia clínica 24x7 de la clínica (sin soporte de hardware el 31/12)" }, os: "Oracle Linux 7.9", ip: "10.20.1.110",
      location: { en: "Head office data room, rack B", es: "Sala técnica de la oficina central, rack B" }, owner: { en: "Clínica Contoso Salud (clinical systems)", es: "Clínica Contoso Salud (sistemas clínicos)" }, patched: "20/09/2026" },
    { id: "ORA-CLN02", role: { en: "New Oracle server for SaludNet (Oracle 19.23 installed, 10 Gb to ORA-CLN01), not in service yet", es: "Servidor Oracle nuevo de SaludNet (Oracle 19.23 instalado, 10 Gb hasta ORA-CLN01), aún sin servicio" }, os: "Oracle Linux 9.4", ip: "10.20.1.111",
      location: { en: "Head office data room, rack B", es: "Sala técnica de la oficina central, rack B" }, owner: { en: "Clínica Contoso Salud (clinical systems)", es: "Clínica Contoso Salud (sistemas clínicos)" }, patched: "10/11/2026" },
    { id: "LIS-CLN01", role: { en: "Laboratory information system (LIS), HL7 on port 2575", es: "Sistema del laboratorio (LIS), HL7 en el puerto 2575" }, os: "Windows Server 2019", ip: "10.20.1.147",
      location: { en: "Head office data room, rack B (VM)", es: "Sala técnica de la oficina central, rack B (VM)" }, owner: { en: "Clínica Contoso Salud (clinical systems)", es: "Clínica Contoso Salud (sistemas clínicos)" }, patched: "14/10/2026" },
    { id: "DB-TEST01", role: { en: "Test MariaDB: restore tests of the stock database", es: "MariaDB de pruebas: pruebas de restauración de la base de datos de stock" }, os: "Ubuntu Server 24.04 LTS", ip: "10.20.1.112",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "10/11/2026" },
    { id: "BI-TEST01", role: { en: "Old BI test VM (44 GB), listed for removal", es: "VM antigua de pruebas de BI (44 GB), en la lista para borrar" }, os: "Windows Server 2019", ip: "10.20.1.113",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "Finance applications", es: "Aplicaciones de Finanzas" }, patched: "12/05/2026" },
    { id: "LIC-SRV01", role: { en: "CAD licence server (30 users at the Zaragoza plant), VM on the CL-PROD cluster", es: "Servidor de licencias CAD (30 usuarios de la planta de Zaragoza), VM del clúster CL-PROD" }, os: "Windows Server 2022", ip: "10.20.1.114",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "Operations (Zaragoza plant)", es: "Operaciones (planta de Zaragoza)" }, patched: "14/10/2026" },
    { id: "SCADA-GW01", role: { en: "SCADA gateway of the Zaragoza plant (read-only data for head office), VM on the CL-PROD cluster", es: "Pasarela SCADA de la planta de Zaragoza (datos de solo lectura para la central), VM del clúster CL-PROD" }, os: "Windows Server 2019", ip: "10.20.1.115",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "Operations (Zaragoza plant)", es: "Operaciones (planta de Zaragoza)" }, patched: "14/10/2026" },
    { id: "PAY-SFTP01", role: { en: "Payroll SFTP server (joined to AD with SSSD)", es: "Servidor SFTP de nóminas (unido a AD con SSSD)" }, os: "Red Hat Enterprise Linux 9", ip: "10.20.1.116",
      location: { en: "Head office data room, rack C", es: "Sala técnica de la oficina central, rack C" }, owner: { en: "Finance (payroll)", es: "Finanzas (nóminas)" }, patched: "04/11/2026" },
    { id: "PAY-APP01", role: { en: "Payroll application server", es: "Servidor de aplicación de nóminas" }, os: "Red Hat Enterprise Linux 9", ip: "10.20.1.117",
      location: { en: "Head office data room, rack C", es: "Sala técnica de la oficina central, rack C" }, owner: { en: "Finance (payroll)", es: "Finanzas (nóminas)" }, patched: "04/11/2026" },
    { id: "PAY-DB01", role: { en: "Payroll database (PostgreSQL)", es: "Base de datos de nóminas (PostgreSQL)" }, os: "Red Hat Enterprise Linux 9", ip: "10.20.1.118",
      location: { en: "Head office data room, rack C", es: "Sala técnica de la oficina central, rack C" }, owner: { en: "Finance (payroll)", es: "Finanzas (nóminas)" }, patched: "04/11/2026" },
    { id: "PGSQL-FIN01", role: { en: "PostgreSQL for the expenses app (expenses-api on Kubernetes)", es: "PostgreSQL de la app de gastos (expenses-api en Kubernetes)" }, os: "Rocky Linux 9", ip: "10.20.1.120",
      location: { en: "Head office data room, rack C", es: "Sala técnica de la oficina central, rack C" }, owner: { en: "Finance applications", es: "Aplicaciones de Finanzas" }, patched: "11/11/2026" },
    { id: "OCP-BASTION01", role: { en: "OpenShift bastion (oc and the stores-cc project)", es: "Bastión de OpenShift (oc y el proyecto stores-cc)" }, os: "Rocky Linux 9", ip: "10.20.1.119",
      location: { en: "Head office data room, rack A (VM)", es: "Sala técnica de la oficina central, rack A (VM)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "11/11/2026" },
    { id: "SBC-TRD01", role: { en: "Session border controller of the trading floor (backup SIP route of the private wires)", es: "Session border controller de la sala de trading (ruta SIP de respaldo de las private wires)" }, os: "Ribbon SBC SWe Lite (virtual)", ip: "10.20.1.160",
      location: { en: "Madrid trading floor, comms room (VM)", es: "Sala de trading de Madrid, cuarto de comunicaciones (VM)" }, owner: { en: "Contoso Markets (trading floor)", es: "Contoso Markets (sala de trading)" }, patched: "03/11/2026" },
    { id: "GPU-N01", role: { en: "GPU node of the quant research cluster (Dell PowerEdge XE8545, 4 × NVIDIA A100 80GB)", es: "Nodo GPU del clúster de investigación cuantitativa (Dell PowerEdge XE8545, 4 × NVIDIA A100 80GB)" }, os: "Rocky Linux 9", ip: "10.20.1.156",
      location: { en: "Head office data room, rack C", es: "Sala técnica de la oficina central, rack C" }, owner: { en: "Quant research", es: "Investigación cuantitativa" }, patched: "04/11/2026" },
    { id: "GPU-N02", role: { en: "GPU node of the quant research cluster (Dell PowerEdge XE8545, 4 × NVIDIA A100 80GB)", es: "Nodo GPU del clúster de investigación cuantitativa (Dell PowerEdge XE8545, 4 × NVIDIA A100 80GB)" }, os: "Rocky Linux 9", ip: "10.20.1.157",
      location: { en: "Head office data room, rack C", es: "Sala técnica de la oficina central, rack C" }, owner: { en: "Quant research", es: "Investigación cuantitativa" }, patched: "04/11/2026" },
    { id: "GPU-N04", role: { en: "GPU node of the quant research cluster (Dell PowerEdge XE8545, 4 × NVIDIA A100 80GB)", es: "Nodo GPU del clúster de investigación cuantitativa (Dell PowerEdge XE8545, 4 × NVIDIA A100 80GB)" }, os: "Rocky Linux 9", ip: "10.20.1.159",
      location: { en: "Head office data room, rack C", es: "Sala técnica de la oficina central, rack C" }, owner: { en: "Quant research", es: "Investigación cuantitativa" }, patched: "04/11/2026" },
    { id: "VMH-03", role: { en: "VMware ESXi host of the CL-GEN cluster (Dell PowerEdge R750), iDRAC 10.20.99.43", es: "Host VMware ESXi del clúster CL-GEN (Dell PowerEdge R750), iDRAC 10.20.99.43" }, os: "VMware ESXi 8.0 U3", ip: "10.20.1.85",
      location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "21/10/2026" },
    { id: "VMH-04", role: { en: "VMware ESXi host of the CL-GEN cluster (Dell PowerEdge R750), iDRAC 10.20.99.44", es: "Host VMware ESXi del clúster CL-GEN (Dell PowerEdge R750), iDRAC 10.20.99.44" }, os: "VMware ESXi 8.0 U3", ip: "10.20.1.86",
      location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "21/10/2026" },
    { id: "VMH-05", role: { en: "VMware ESXi host of the CL-GEN cluster (Dell PowerEdge R750), iDRAC 10.20.99.45", es: "Host VMware ESXi del clúster CL-GEN (Dell PowerEdge R750), iDRAC 10.20.99.45" }, os: "VMware ESXi 8.0 U3", ip: "10.20.1.87",
      location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "21/10/2026" },
    { id: "VMH-06", role: { en: "VMware ESXi host of the CL-GEN cluster (Dell PowerEdge R750), iDRAC 10.20.99.46", es: "Host VMware ESXi del clúster CL-GEN (Dell PowerEdge R750), iDRAC 10.20.99.46" }, os: "VMware ESXi 8.0 U3", ip: "10.20.1.89",
      location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "21/10/2026" },
    { id: "VMH-07", role: { en: "VMware ESXi host of the CL-GEN cluster (Dell PowerEdge R750), iDRAC 10.20.99.47", es: "Host VMware ESXi del clúster CL-GEN (Dell PowerEdge R750), iDRAC 10.20.99.47" }, os: "VMware ESXi 8.0 U3", ip: "10.20.1.93",
      location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "21/10/2026" },
    { id: "VMH-08", role: { en: "VMware ESXi host of the CL-GEN cluster (Dell PowerEdge R750), iDRAC 10.20.99.48", es: "Host VMware ESXi del clúster CL-GEN (Dell PowerEdge R750), iDRAC 10.20.99.48" }, os: "VMware ESXi 8.0 U3", ip: "10.20.1.94",
      location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "21/10/2026" },
    { id: "SQL-PE01", role: { en: "Dell PowerEdge R750 under SQL-ERP01 (iDRAC address)", es: "Dell PowerEdge R750 de SQL-ERP01 (dirección del iDRAC)" }, os: "Dell PowerEdge R750 · iDRAC", ip: "10.20.99.49",
      location: { en: "Head office data room, rack C", es: "Sala técnica de la oficina central, rack C" }, owner: { en: "Finance applications", es: "Aplicaciones de Finanzas" }, patched: "05/11/2026" },
    { id: "BKP-PE01", role: { en: "Dell PowerEdge R750 under VBR01 and the LTO-8 library (iDRAC address)", es: "Dell PowerEdge R750 de VBR01 y la librería LTO-8 (dirección del iDRAC)" }, os: "Dell PowerEdge R750 · iDRAC", ip: "10.20.99.50",
      location: { en: "Head office data room, rack C", es: "Sala técnica de la oficina central, rack C" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "05/11/2026" },
    { id: "VDI-PE01", role: { en: "ESXi host of the Horizon pool CALL-W11 (iDRAC address)", es: "Host ESXi del pool de Horizon CALL-W11 (dirección del iDRAC)" }, os: "Dell PowerEdge R750 · iDRAC", ip: "10.20.99.51",
      location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "05/11/2026" },
    { id: "VDI-PE02", role: { en: "ESXi host of the Horizon pool CALL-W11 (iDRAC address)", es: "Host ESXi del pool de Horizon CALL-W11 (dirección del iDRAC)" }, os: "Dell PowerEdge R750 · iDRAC", ip: "10.20.99.52",
      location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "05/11/2026" },
    { id: "ZAR-VMH01", role: { en: "VMware ESXi host of the Zaragoza plant (cluster CL-ZAR, Dell PowerEdge R750) (iDRAC address)", es: "Host VMware ESXi de la planta de Zaragoza (clúster CL-ZAR, Dell PowerEdge R750) (dirección del iDRAC)" }, os: "Dell PowerEdge R750 · iDRAC", ip: "10.20.99.53",
      location: { en: "Zaragoza plant, comms room", es: "Planta de Zaragoza, cuarto de comunicaciones" }, owner: { en: "Operations (Zaragoza plant)", es: "Operaciones (planta de Zaragoza)" }, patched: "05/11/2026" },
    { id: "ZAR-VMH02", role: { en: "VMware ESXi host of the Zaragoza plant (cluster CL-ZAR, Dell PowerEdge R750) (iDRAC address)", es: "Host VMware ESXi de la planta de Zaragoza (clúster CL-ZAR, Dell PowerEdge R750) (dirección del iDRAC)" }, os: "Dell PowerEdge R750 · iDRAC", ip: "10.20.99.54",
      location: { en: "Zaragoza plant, comms room", es: "Planta de Zaragoza, cuarto de comunicaciones" }, owner: { en: "Operations (Zaragoza plant)", es: "Operaciones (planta de Zaragoza)" }, patched: "05/11/2026" },
    { id: "ZAR-VMH03", role: { en: "VMware ESXi host of the Zaragoza plant (cluster CL-ZAR, Dell PowerEdge R640) (iDRAC address)", es: "Host VMware ESXi de la planta de Zaragoza (clúster CL-ZAR, Dell PowerEdge R640) (dirección del iDRAC)" }, os: "Dell PowerEdge R640 · iDRAC", ip: "10.20.99.55",
      location: { en: "Zaragoza plant, comms room", es: "Planta de Zaragoza, cuarto de comunicaciones" }, owner: { en: "Operations (Zaragoza plant)", es: "Operaciones (planta de Zaragoza)" }, patched: "05/11/2026" },
    { id: "ZAR-VMH04", role: { en: "VMware ESXi host of the Zaragoza plant (cluster CL-ZAR, Dell PowerEdge R640) (iDRAC address)", es: "Host VMware ESXi de la planta de Zaragoza (clúster CL-ZAR, Dell PowerEdge R640) (dirección del iDRAC)" }, os: "Dell PowerEdge R640 · iDRAC", ip: "10.20.99.56",
      location: { en: "Zaragoza plant, comms room", es: "Planta de Zaragoza, cuarto de comunicaciones" }, owner: { en: "Operations (Zaragoza plant)", es: "Operaciones (planta de Zaragoza)" }, patched: "05/11/2026" },
    { id: "ZAR-BKP01", role: { en: "Zaragoza plant backup server (copy of the plant's backups) (iDRAC address)", es: "Servidor de copias de la planta de Zaragoza (copia de las copias de la planta) (dirección del iDRAC)" }, os: "Dell PowerEdge R750 · iDRAC", ip: "10.20.99.57",
      location: { en: "Zaragoza plant, comms room", es: "Planta de Zaragoza, cuarto de comunicaciones" }, owner: { en: "Operations (Zaragoza plant)", es: "Operaciones (planta de Zaragoza)" }, patched: "05/11/2026" },
    { id: "WRO-VMH01", role: { en: "ESXi host of the Wrocław plant (DC-WRO01 and the plant's VMs) (iDRAC address)", es: "Host ESXi de la planta de Wrocław (DC-WRO01 y las VM de la planta) (dirección del iDRAC)" }, os: "Dell PowerEdge R750 · iDRAC", ip: "10.20.99.58",
      location: { en: "Wrocław plant (Poland), comms room", es: "Planta de Wrocław (Polonia), cuarto de comunicaciones" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "05/11/2026" },
    { id: "WRO-VMH02", role: { en: "ESXi host of the Wrocław plant (iDRAC address)", es: "Host ESXi de la planta de Wrocław (dirección del iDRAC)" }, os: "Dell PowerEdge R750 · iDRAC", ip: "10.20.99.59",
      location: { en: "Wrocław plant (Poland), comms room", es: "Planta de Wrocław (Polonia), cuarto de comunicaciones" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "05/11/2026" },
    { id: "HTL-PE01", role: { en: "Hotel Ribera Bilbao backup server (Veeam proxy for the Nutanix VMs) (iDRAC address)", es: "Servidor de copias del Hotel Ribera Bilbao (proxy de Veeam para las VM de Nutanix) (dirección del iDRAC)" }, os: "Dell PowerEdge R750 · iDRAC", ip: "10.20.99.60",
      location: { en: "Hotel Ribera Bilbao, rack room", es: "Hotel Ribera Bilbao, cuarto de rack" }, owner: { en: "Contoso Hospitality", es: "Contoso Hospitality" }, patched: "05/11/2026" },
    { id: "ZAR-FSN01", role: { en: "Node 1 of the file server cluster CL-ZAR-FS (role FS-ZAR01)", es: "Nodo 1 del clúster de ficheros CL-ZAR-FS (rol FS-ZAR01)" }, os: "Windows Server 2022", ip: "10.20.70.21",
      location: { en: "Zaragoza plant, comms room", es: "Planta de Zaragoza, cuarto de comunicaciones" }, owner: { en: "Operations (Zaragoza plant)", es: "Operaciones (planta de Zaragoza)" }, patched: "14/10/2026" },
    { id: "ZAR-FSN02", role: { en: "Node 2 of the file server cluster CL-ZAR-FS (role FS-ZAR01)", es: "Nodo 2 del clúster de ficheros CL-ZAR-FS (rol FS-ZAR01)" }, os: "Windows Server 2022", ip: "10.20.70.22",
      location: { en: "Zaragoza plant, comms room", es: "Planta de Zaragoza, cuarto de comunicaciones" }, owner: { en: "Operations (Zaragoza plant)", es: "Operaciones (planta de Zaragoza)" }, patched: "14/10/2026" },
    { id: "ZAR-MES01", role: { en: "MES (production tracking), VM on HV-ZAR01, production VLAN 170", es: "MES (seguimiento de producción), VM en HV-ZAR01, VLAN 170 de producción" }, os: "Windows Server 2019", ip: "10.20.170.10",
      location: { en: "Zaragoza plant, comms room (VM)", es: "Planta de Zaragoza, cuarto de comunicaciones (VM)" }, owner: { en: "Operations (Zaragoza plant)", es: "Operaciones (planta de Zaragoza)" }, patched: "07/10/2026" },
    { id: "ZAR-SCADA01", role: { en: "WinCC SCADA of the production lines (patched only with the SCADA vendor's approval)", es: "SCADA WinCC de las líneas de producción (se parchea solo con el visto bueno del fabricante)" }, os: "Windows Server 2016", ip: "10.20.170.11",
      location: { en: "Zaragoza plant, comms room", es: "Planta de Zaragoza, cuarto de comunicaciones" }, owner: { en: "Operations (Zaragoza plant)", es: "Operaciones (planta de Zaragoza)" }, patched: "18/03/2025" },
    { id: "NTNX-HTL-N1", role: { en: "Node 1 of the Nutanix cluster NTX-HTL01", es: "Nodo 1 del clúster Nutanix NTX-HTL01" }, os: "Nutanix AOS 6.10 / AHV", ip: "10.20.61.31",
      location: { en: "Hotel Ribera Bilbao, rack room", es: "Hotel Ribera Bilbao, cuarto de rack" }, owner: { en: "Contoso Hospitality", es: "Contoso Hospitality" }, patched: "15/09/2026" },
    { id: "NTNX-HTL-N2", role: { en: "Node 2 of the Nutanix cluster NTX-HTL01", es: "Nodo 2 del clúster Nutanix NTX-HTL01" }, os: "Nutanix AOS 6.10 / AHV", ip: "10.20.61.32",
      location: { en: "Hotel Ribera Bilbao, rack room", es: "Hotel Ribera Bilbao, cuarto de rack" }, owner: { en: "Contoso Hospitality", es: "Contoso Hospitality" }, patched: "15/09/2026" },
    { id: "NTNX-HTL-N3", role: { en: "Node 3 of the Nutanix cluster NTX-HTL01", es: "Nodo 3 del clúster Nutanix NTX-HTL01" }, os: "Nutanix AOS 6.10 / AHV", ip: "10.20.61.33",
      location: { en: "Hotel Ribera Bilbao, rack room", es: "Hotel Ribera Bilbao, cuarto de rack" }, owner: { en: "Contoso Hospitality", es: "Contoso Hospitality" }, patched: "15/09/2026" },
    { id: "DC-AZ01", role: { en: "Domain controller and DNS in Azure (vNet vnet-w365-weu, West Europe)", es: "Controlador de dominio y DNS en Azure (vNet vnet-w365-weu, West Europe)" }, os: "Windows Server 2022 (Azure VM)", ip: "10.70.1.4",
      location: { en: "Azure, West Europe", es: "Azure, West Europe" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "14/10/2026" },
    { id: "AWS-INT01", role: { en: "Integration server in AWS (account Contoso-Prod, subnet private-app-a)", es: "Servidor de integración en AWS (cuenta Contoso-Prod, subred private-app-a)" }, os: "Windows Server 2022 (EC2)", ip: "10.120.11.25",
      location: { en: "AWS, eu-west-1", es: "AWS, eu-west-1" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "10/11/2026" },
    // v0.19: servers named by the IT management cases
    { id: "SMTP-RLY01", role: { en: "SMTP relay for applications and scanners (Postfix), sends through the email security gateway", es: "Relay SMTP de aplicaciones y escáneres (Postfix), envía a través de la pasarela de seguridad de correo" }, os: "Ubuntu Server 24.04 LTS", ip: "10.20.1.161",
      location: { en: "Head office data room (VM on CL-PROD)", es: "Sala técnica de la oficina central (VM en CL-PROD)" }, owner: { en: "IT infrastructure", es: "Infraestructura IT" }, patched: "09/11/2026" },
    { id: "ERP-TST01", role: { en: "Test copy of the Finance ERP (Contoso ERP 11 on IIS, with a copy of ERP_PROD refreshed monthly)", es: "Copia de pruebas del ERP de Finanzas (Contoso ERP 11 en IIS, con una copia de ERP_PROD que se refresca cada mes)" }, os: "Windows Server 2022", ip: "10.20.1.162",
      location: { en: "Head office data room (VM on CL-GEN)", es: "Sala técnica de la oficina central (VM en CL-GEN)" }, owner: { en: "Finance applications", es: "Aplicaciones de Finanzas" }, patched: "02/11/2026" },
  ];
  const PRINTERS = [
    { id: "RECEPCION-MFP", model: { en: "Colour A3 multifunction", es: "Multifunción A3 color" }, ip: "10.20.3.41", queue: "PRT-SRV01", location: { en: "Ground floor, reception", es: "Planta baja, recepción" } },
    { id: "FIN-MFP-01", model: { en: "Mono A4 multifunction", es: "Multifunción A4 monocromo" }, ip: "10.20.3.42", queue: "PRT-SRV01", location: { en: "2nd floor, Finance", es: "2ª planta, Finanzas" } },
    { id: "SALES-MFP-01", model: { en: "Colour A4 multifunction", es: "Multifunción A4 color" }, ip: "10.20.3.43", queue: "PRT-SRV01", location: { en: "1st floor, Sales", es: "1ª planta, Ventas" } },
    { id: "ALM-MFP-01", model: { en: "Mono A4 multifunction (SAP delivery notes)", es: "Multifunción A4 monocromo (albaranes de SAP)" }, ip: "10.20.3.45", queue: "PRT-SRV01", location: { en: "Warehouse, loading bay", es: "Almacén, muelle de carga" } },
    { id: "LEGAL-PRN-01", model: { en: "Mono A4 printer with secure release", es: "Impresora A4 monocromo con liberación segura" }, ip: "10.20.3.44", queue: "PRT-SRV01", location: { en: "4th floor, Legal", es: "4ª planta, Legal" } },
    // v0.18: printers that print direct to their IP (no queue on a print server)
    { id: "LBL-FIN-01", model: { en: "Label printer (DHCP reservation), Finance post room", es: "Impresora de etiquetas (reserva DHCP), correo de Finanzas" }, ip: "10.20.3.61", queue: null, location: { en: "2nd floor, Finance", es: "2ª planta, Finanzas" } },
    { id: "PRN-T07", model: { en: "Mono A4 printer, Store 07", es: "Impresora A4 monocromo, Tienda 07" }, ip: "10.60.7.30", queue: null, location: { en: "Store 07 Valencia, back office", es: "Tienda 07 Valencia, trastienda" } },
    { id: "PRN-COC-01", model: { en: "Kitchen ticket printer Epson TM-T20III (HioPOS orders)", es: "Impresora de comandas Epson TM-T20III (comandas de HioPOS)" }, ip: "192.168.10.50", queue: null, location: { en: "Restaurante Ribera, kitchen", es: "Restaurante Ribera, cocina" } },
    { id: "PRN-RECEPCION", model: { en: "Colour A4 multifunction, hotel reception", es: "Multifunción A4 color, recepción del hotel" }, ip: "10.20.61.45", queue: null, location: { en: "Hotel Ribera Bilbao, reception", es: "Hotel Ribera Bilbao, recepción" } },
  ];

  /* v0.18: the rest of the equipment the tickets name: network devices outside the network room's simulator (netcli.js),
     UPS and PDU, card terminals, tablets and phones. kind: switch, router, firewall, ap, ups, pdu, payment, tablet, phone. */
  const DEVICES = [
    { id: "SW-ACC-0F", kind: "switch", model: "Cisco Catalyst 9200 (IOS XE)", ip: "10.20.99.11", location: { en: "Head office, ground floor comms cabinet", es: "Oficina central, armario de comunicaciones de la planta baja" } },
    { id: "SW-ACC-3F", kind: "switch", model: "HPE Aruba 2930F 48G PoE+ (ArubaOS-Switch)", ip: "10.20.99.14", location: { en: "Head office, 3rd floor comms cabinet", es: "Oficina central, armario de comunicaciones de la 3ª planta" } },
    { id: "SW-ACC-4F", kind: "switch", model: "Cisco Catalyst 9200 (IOS XE)", ip: "10.20.99.16", location: { en: "Head office, 4th floor comms cabinet", es: "Oficina central, armario de comunicaciones de la 4ª planta" } },
    { id: "SW-ACC-5F", kind: "switch", model: "Cisco Catalyst 9200 (IOS XE)", ip: "10.20.99.15", location: { en: "Head office, 5th floor comms cabinet", es: "Oficina central, armario de comunicaciones de la 5ª planta" } },
    { id: "SW-TRD-01", kind: "switch", model: "Cisco Catalyst 9300 (IOS XE)", ip: "10.20.99.17", location: { en: "Madrid trading floor, comms room", es: "Sala de trading de Madrid, cuarto de comunicaciones" } },
    { id: "UPS-SALA-A", kind: "ups", model: "APC Smart-UPS SRT 10kVA (NMC 10.20.99.30)", ip: "10.20.99.30", location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" } },
    { id: "UPS-RACKB", kind: "ups", model: "APC Smart-UPS (NMC 10.20.99.31)", ip: "10.20.99.31", location: { en: "Head office data room, rack B", es: "Sala técnica de la oficina central, rack B" } },
    { id: "PDU-A1", kind: "pdu", model: "APC switched rack PDU", ip: "10.20.99.25", location: { en: "Head office data room, rack A", es: "Sala técnica de la oficina central, rack A" } },
    { id: "PDU-B1", kind: "pdu", model: "APC switched rack PDU", ip: "10.20.99.26", location: { en: "Head office data room, rack B", es: "Sala técnica de la oficina central, rack B" } },
    { id: "RTR-ALM-01", kind: "router", model: "Cisco ISR 1100 (warehouse WAN link)", ip: "10.20.40.1", location: { en: "Central warehouse, comms cabinet", es: "Almacén central, armario de comunicaciones" } },
    { id: "SW-ALM-01", kind: "switch", model: "Cisco Catalyst 9200 (warehouse)", ip: "10.20.40.2", location: { en: "Central warehouse, comms cabinet", es: "Almacén central, armario de comunicaciones" } },
    { id: "AP-ALM-01", kind: "ap", model: "Wi-Fi access point (warehouse, handheld scanners)", ip: "10.20.40.3", location: { en: "Central warehouse, aisles 1-6", es: "Almacén central, pasillos 1-6" }, also: ["AP-ALM-02"] },
    { id: "FW-ZAR01", kind: "firewall", model: "OPNsense 24.7 with Suricata (IPS)", ip: "10.20.70.1", location: { en: "Zaragoza plant, comms room", es: "Planta de Zaragoza, cuarto de comunicaciones" } },
    { id: "SW-ZAR-01", kind: "switch", model: "Cisco Catalyst 9200 (plant core)", ip: "10.20.70.2", location: { en: "Zaragoza plant, comms room", es: "Planta de Zaragoza, cuarto de comunicaciones" } },
    { id: "RTR-WRO-01", kind: "router", model: "Cisco ISR 4331 (MPLS WAN, 20 Mb)", ip: "10.20.80.1", location: { en: "Wrocław plant (Poland), comms room", es: "Planta de Wrocław (Polonia), cuarto de comunicaciones" } },
    { id: "SW-WRO-CORE", kind: "switch", model: "Core switch, Wrocław plant", ip: "10.20.80.2", location: { en: "Wrocław plant (Poland), comms room", es: "Planta de Wrocław (Polonia), cuarto de comunicaciones" } },
    { id: "FW-WRO01", kind: "firewall", model: "FortiGate (Wrocław plant)", ip: "10.20.80.254", location: { en: "Wrocław plant (Poland), comms room", es: "Planta de Wrocław (Polonia), cuarto de comunicaciones" } },
    { id: "FW-HTL01", kind: "firewall", model: "pfSense 2.7 (CARP master; hotel gateway 10.20.61.1)", ip: "10.20.61.2", location: { en: "Hotel Ribera Bilbao, rack room", es: "Hotel Ribera Bilbao, cuarto de rack" } },
    { id: "FW-HTL02", kind: "firewall", model: "pfSense 2.7 (CARP backup, since 21/10)", ip: "10.20.61.3", location: { en: "Hotel Ribera Bilbao, rack room", es: "Hotel Ribera Bilbao, cuarto de rack" } },
    { id: "RTR-HTL-01", kind: "router", model: "MikroTik (RouterOS 7): rooms' hotspot hs-guests, VLAN 62", ip: "10.20.62.1", location: { en: "Hotel Ribera Bilbao, rack room", es: "Hotel Ribera Bilbao, cuarto de rack" } },
    { id: "SW-HTL-P4", kind: "switch", model: "HPE Aruba 2930F (ArubaOS-Switch)", ip: "10.20.61.44", location: { en: "Hotel Ribera Bilbao, 4th floor", es: "Hotel Ribera Bilbao, 4ª planta" } },
    { id: "UPS-HTL-01", kind: "ups", model: "APC Smart-UPS SMT1500", ip: "10.20.61.35", location: { en: "Hotel Ribera Bilbao, comms room", es: "Hotel Ribera Bilbao, cuarto de comunicaciones" } },
    { id: "RTR-RIB-01", kind: "router", model: "TP-Link Archer (restaurant LAN 192.168.10.0/24, DHCP .100-.199)", ip: "192.168.10.1", location: { en: "Restaurante Ribera, office", es: "Restaurante Ribera, oficina" } },
    { id: "DATAFONO-01", kind: "payment", model: "Card terminal (HioPOS)", ip: "192.168.10.51", location: { en: "Restaurante Ribera, bar", es: "Restaurante Ribera, barra" } },
    { id: "TABLET-01", kind: "tablet", model: "Android tablet (waiters' ordering app)", ip: "", location: { en: "Restaurante Ribera, dining room", es: "Restaurante Ribera, comedor" }, also: ["TABLET-02"] },
    { id: "SW-VLC-01", kind: "switch", model: "Small unmanaged switch under a desk (PC-VLC-011 and PC-VLC-014)", ip: "", location: { en: "Valencia branch, open office", es: "Sucursal de Valencia, zona abierta" } },
    { id: "RTR-T07", kind: "router", model: "MikroTik RB5009 (RouterOS 7.16, WireGuard to the head office)", ip: "10.60.7.1", location: { en: "Store 07 Valencia, back office", es: "Tienda 07 Valencia, trastienda" } },
    { id: "SW-T07", kind: "switch", model: "Store switch", ip: "10.60.7.2", location: { en: "Store 07 Valencia, back office", es: "Tienda 07 Valencia, trastienda" } },
    { id: "RUT-T03", kind: "router", model: "Teltonika RUTX11 (fibre with 4G backup, managed in RMS)", ip: "10.60.3.1", location: { en: "Store 03 Bilbao, back office", es: "Tienda 03 Bilbao, trastienda" } },
    { id: "ZAR-IPH-0147", kind: "phone", model: "iPhone (corporate, Intune)", ip: "", location: { en: "Zaragoza plant", es: "Planta de Zaragoza" } },
  ];

  /* v0.18: people and companies outside Contoso that the tickets and case files name (suppliers, partners, counterparties).
     name is how they appear in the tickets. */
  const CONTACTS = [
    { id: "ebro", division: "corporate", name: "Automatismos Ebro", org: "Automatismos Ebro", role: { en: "the Zaragoza plant's automation integrator", es: "el integrador de automatización de la planta de Zaragoza" } },
    { id: "oms-vendor", division: "markets", name: "Contoso OMS support", org: { en: "the order management system's vendor", es: "el fabricante del sistema de órdenes" }, role: { en: "vendor support of the trading floor's OMS", es: "soporte del fabricante del OMS de la sala de trading" } },
    { id: "dell", division: "corporate", name: "Dell account manager", org: "Dell Technologies", role: { en: "the server vendor's account manager", es: "comercial del fabricante de servidores" } },
    { id: "nervion", division: "retail", name: "Galerías Nervión facilities", org: "Galerías Nervión", role: { en: "the department store's facilities manager (Corner 21)", es: "responsable de mantenimiento del gran almacén (Corner 21)" } },
    { id: "nervion-it", division: "retail", name: "The centre's IT technician", org: "Galerías Nervión", role: { en: "the department store's IT technician", es: "técnico de IT del gran almacén" } },
    { id: "saludnet", division: "health", name: "SaludNet's project manager", org: { en: "SaludNet's vendor", es: "el fabricante de SaludNet" }, role: { en: "project manager of the clinical record's vendor", es: "jefe de proyecto del fabricante de la historia clínica" } },
    { id: "ms-partner", division: "corporate", name: "The Microsoft partner", org: { en: "Contoso's Microsoft partner", es: "el partner de Microsoft de Contoso" }, role: { en: "the partner who offers a weekend migration", es: "el partner que ofrece la migración en un fin de semana" } },
    { id: "ms-partner-am", division: "corporate", name: "The partner's account manager", org: { en: "Contoso's Microsoft partner", es: "el partner de Microsoft de Contoso" }, role: { en: "account manager for Azure commitments", es: "comercial de los compromisos de Azure" } },
    { id: "iptv", division: "hospitality", name: "The TV company", org: { en: "the hotels' IPTV supplier", es: "el proveedor de IPTV de los hoteles" }, role: { en: "IPTV installer", es: "instalador de IPTV" } },
    { id: "oracle-integrator", division: "health", name: "The integrator", org: { en: "the clinic's Oracle integrator", es: "el integrador de Oracle de la clínica" }, role: { en: "Oracle integrator", es: "integrador de Oracle" } },
    { id: "transnorte", division: "corporate", name: "Transnorte", org: "Transnorte", role: { en: "haulier (invoices on its portal)", es: "transportista (facturas en su portal)" } },
    { id: "trazalia", division: "corporate", name: "Trazalia Software", org: "Trazalia Software S.L.", role: { en: "publisher of TrazaCAD Viewer", es: "editor de TrazaCAD Viewer" } },
    { id: "meridiano", division: "markets", name: "Banco Meridiano", org: "Banco Meridiano", role: { en: "FX counterparty of Contoso Markets (private wire PW-MERIDIANO-FX)", es: "contraparte de divisas de Contoso Markets (private wire PW-MERIDIANO-FX)" } },
    // v0.19: the suppliers of the IT management cases
    { id: "norte", division: "retail", name: "Norte Workplace Services", org: "Norte Workplace Services S.L.", role: { en: "on-site end-user support (EUC) for the boutiques, the corners and the hotels (contract CT-EUC-2025)", es: "soporte de puesto de trabajo (EUC) presencial de las boutiques, los corners y los hoteles (contrato CT-EUC-2025)" } },
    { id: "norte-sm", division: "retail", name: "Norte Workplace's service manager", org: "Norte Workplace Services S.L.", role: { en: "the EUC provider's service manager for Contoso", es: "responsable del servicio de Contoso en el proveedor de EUC" } },
    { id: "cantabrico", division: "corporate", name: "Redes Cantábrico", org: "Redes Cantábrico S.A.", role: { en: "reseller of the head office firewall's support and subscriptions (contract CT-FW-2023)", es: "distribuidor del soporte y las suscripciones del cortafuegos de la sede (contrato CT-FW-2023)" } },
    { id: "cantabrico-am", division: "corporate", name: "Redes Cantábrico's account manager", org: "Redes Cantábrico S.A.", role: { en: "account manager for the firewall renewal", es: "comercial de la renovación del cortafuegos" } },
    { id: "bastion", division: "corporate", name: "Bastión Mail", org: "Bastión Mail S.L.", role: { en: "the group's email security gateway, in front of Exchange Online (contract CT-MAIL-2024)", es: "la pasarela de seguridad de correo del grupo, delante de Exchange Online (contrato CT-MAIL-2024)" } },
  ];

  /* v0.19: the IT contracts the cases name: supplier (a CONTACTS id), what it covers, its division and its term */
  const CONTRACTS = [
    { id: "CT-EUC-2025", supplier: "norte", division: "retail", what: { en: "On-site end-user support for the boutiques, the corners and the hotels: €18,500 a month, SLA and service credits", es: "Soporte de puesto de trabajo presencial de las boutiques, los corners y los hoteles: 18.500 € al mes, SLA y penalizaciones" }, ends: "28/02/2028" },
    { id: "CT-FW-2023", supplier: "cantabrico", division: "corporate", what: { en: "Support and security subscriptions of FGT-HQ-01, the head office firewall (36 months, renews by itself)", es: "Soporte y suscripciones de seguridad de FGT-HQ-01, el cortafuegos de la sede (36 meses, se renueva solo)" }, ends: "13/12/2026" },
    { id: "CT-MAIL-2024", supplier: "bastion", division: "corporate", what: { en: "Email security gateway for the whole group (inbound and outbound filtering in front of Exchange Online)", es: "Pasarela de seguridad de correo de todo el grupo (filtrado de entrada y salida delante de Exchange Online)" }, ends: "31/05/2027" },
  ];

  /* v0.18: Contoso is a group with four divisions and the group's corporate services. Every site, person, computer, server,
     printer and device says its division (field `division`, filled below from the site lists). */
  const SITES = [
    { id: "hq", division: "corporate", name: { en: "Head office (Madrid): corporate services, IT and the data room", es: "Oficina central (Madrid): servicios corporativos, IT y la sala técnica" } },
    { id: "warehouse", division: "corporate", name: { en: "Central warehouse", es: "Almacén central" } },
    { id: "zaragoza", division: "corporate", name: { en: "Zaragoza plant (industry)", es: "Planta de Zaragoza (industria)" } },
    { id: "wroclaw", division: "corporate", name: { en: "Wrocław plant (Poland)", es: "Planta de Wrocław (Polonia)" } },
    { id: "valencia", division: "corporate", name: { en: "Valencia branch (sales)", es: "Sucursal de Valencia (comercial)" } },
    { id: "cloud", division: "corporate", name: { en: "Azure and AWS", es: "Azure y AWS" } },
    { id: "hotel-bilbao", division: "hospitality", name: { en: "Hotel Ribera Bilbao", es: "Hotel Ribera Bilbao" } },
    { id: "hotel-donostia", division: "hospitality", name: { en: "Hotel Ribera Donostia (opens 24/11/2026)", es: "Hotel Ribera Donostia (abre el 24/11/2026)" } },
    { id: "restaurant", division: "hospitality", name: { en: "Restaurante Ribera (Bilbao)", es: "Restaurante Ribera (Bilbao)" } },
    { id: "booking-centre", division: "hospitality", name: { en: "Booking centre (Bilbao)", es: "Central de reservas (Bilbao)" } },
    { id: "store-03", division: "retail", name: { en: "Store 03 Bilbao", es: "Tienda 03 Bilbao" } },
    { id: "store-07", division: "retail", name: { en: "Store 07 Valencia", es: "Tienda 07 Valencia" } },
    { id: "store-12", division: "retail", name: { en: "Store 12 Sevilla", es: "Tienda 12 Sevilla" } },
    { id: "corner-21", division: "retail", name: { en: "Corner 21, Galerías Nervión (Bilbao)", es: "Corner 21, Galerías Nervión (Bilbao)" } },
    { id: "clinic", division: "health", name: { en: "Clínica Contoso Salud (Bilbao)", es: "Clínica Contoso Salud (Bilbao)" } },
    { id: "trading", division: "markets", name: { en: "Trading floor, Madrid head office (FX, brokerage and digital assets desks)", es: "Sala de trading, oficina central de Madrid (mesas de divisas, brokerage y criptoactivos)" } },
  ];
  const COMPANY = {
    name: { en: "Contoso Group", es: "Grupo Contoso" },
    divisions: [
      { id: "hospitality", name: { en: "Contoso Hospitality", es: "Contoso Hospitality" },
        what: { en: "Hotels, restaurants and bars (HORECA): the PMS, HioPOS and ICG tills, CashDro, IPTV, guest Wi-Fi and the kitchen", es: "Hoteles, restaurantes y bares (HORECA): el PMS, los TPV HioPOS e ICG, CashDro, IPTV, la WiFi de huéspedes y la cocina" },
        sites: ["hotel-bilbao", "hotel-donostia", "restaurant", "booking-centre"] },
      { id: "retail", name: { en: "Contoso Luxury Retail", es: "Contoso Luxury Retail" },
        what: { en: "Boutiques and corners in department stores: the store tills, label printers, 4G backup and AnyConnect", es: "Boutiques y corners en grandes almacenes: los TPV de tienda, las etiquetas, el 4G de respaldo y AnyConnect" },
        sites: ["store-03", "store-07", "store-12", "corner-21"] },
      { id: "health", name: { en: "Contoso Salud", es: "Contoso Salud" },
        what: { en: "Hospitals and clinics: the 24x7 clinical record (SaludNet on Oracle), RabbitMQ for the lab and clinical Citrix", es: "Hospitales y clínicas: la historia clínica 24x7 (SaludNet sobre Oracle), RabbitMQ para el laboratorio y el Citrix clínico" },
        sites: ["clinic"] },
      { id: "markets", name: { en: "Contoso Markets", es: "Contoso Markets" },
        what: { en: "Finance: trading desks, brokerage and a digital assets desk, with trading voice, market data terminals, the OMS, custody and the quant research GPU cluster", es: "Finanzas: mesas de trading, brokerage y una mesa de criptoactivos, con voz de trading, terminales de mercado, el OMS, la custodia y el clúster de GPU de investigación cuantitativa" },
        sites: ["trading"] },
      { id: "corporate", name: { en: "Group corporate services", es: "Servicios corporativos del grupo" },
        what: { en: "Head office, IT, Finance, HR, Legal, Sales and Marketing, the warehouse and the plants in Zaragoza and Wrocław", es: "Sede central, IT, Finanzas, RR. HH., Legal, Ventas y Marketing, el almacén y las plantas de Zaragoza y Wrocław" },
        sites: ["hq", "warehouse", "zaragoza", "wroclaw", "valencia", "cloud"] },
    ],
  };
  // what belongs to a division other than corporate services (everything else is corporate): users, computers, servers, printers, devices
  const IN_DIVISION = {
    hospitality: ["agoikoetxea", "mugarte", "lzubiaurre", "iolano", "alasa", "PC-HTL-REC01", "PC-HTL-MNT01", "TPV-RIB-01", "LAPTOP-RIB-02", "TC-RES-07",
      "LAPTOP-0471", "CALL-W11-01", "PMS-HTL01", "NTX-HTL01", "NTNX-HTL-N1", "NTNX-HTL-N2", "NTNX-HTL-N3", "HTL-PE01", "VDI-PE01", "VDI-PE02", "RES-DB01",
      "LB-RES01", "WEB-RES01", "WEB-RES02", "WEB-UBU02", "HZN-CS01", "PRN-COC-01", "PRN-RECEPCION", "FW-HTL01", "FW-HTL02", "RTR-HTL-01", "SW-HTL-P4",
      "UPS-HTL-01", "RTR-RIB-01", "DATAFONO-01", "TABLET-01"],
    retail: ["jarrieta", "nsaez", "amedina", "rcampos", "cortega", "TPV-T03-01", "TPV-T07-01", "TPV-T07-02", "TPV-T12-01", "TPV-C21-01", "PORTAL01",
      "APP-IIS01", "DB-MAR01", "STOCK-APP01", "DB-TEST01", "PRN-T07", "RTR-T07", "SW-T07", "RUT-T03"],
    health: ["murrutia", "aetxebarria", "mibarra", "izabala", "eruiz", "PC-CLN-P3-01", "PC-CLN-IT01", "PC-CLN-DIR01", "PC-CLN-FAR01", "RMQ-CLN01",
      "ORA-CLN01", "ORA-CLN02", "LIS-CLN01", "CTX-CLN01", "CTX-CLN02", "CTX-CLN03", "CTX-CLN04"],
    markets: ["rlarrea", "giturbe", "mgil.trd", "LAPTOP-0441", "LAPTOP-0442", "LAPTOP-0463", "TRD-VOX01", "SBC-TRD01", "HPC-CTL01", "GPU-N01", "GPU-N02",
      "GPU-N03", "GPU-N04", "SW-TRD-01", "aurquijo", "LAPTOP-0482"],
  };
  const DIVISION_OF = {};
  Object.keys(IN_DIVISION).forEach((d) => IN_DIVISION[d].forEach((id) => { DIVISION_OF[id.toLowerCase()] = d; }));
  // the division of a user (sam), computer, server, printer or device; corporate services when nothing else says so
  function divisionOf(id) { return DIVISION_OF[String(id || "").toLowerCase()] || "corporate"; }
  function division(id) { return COMPANY.divisions.find((d) => d.id === id) || null; }
  USERS.concat(COMPUTERS).forEach((x) => { x.division = divisionOf(x.sam || x.name); });
  SERVERS.concat(PRINTERS, DEVICES).forEach((x) => { x.division = divisionOf(x.id); });
  SITES.forEach((x) => { if (!COMPANY.divisions.some((d) => d.sites.includes(x.id))) throw new Error("site without division " + x.id); });

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
    const batch = COMPUTERS.find((c) => (c.also || []).some((x) => x.toLowerCase() === n));
    return COMPUTERS.find((c) => c.name.toLowerCase() === n) || (batch && Object.assign({}, batch, { name: batch.also.find((x) => x.toLowerCase() === n), also: undefined }))
      || (SERVERS.find((s) => s.id.toLowerCase() === n) && serverAsComputer(SERVERS.find((s) => s.id.toLowerCase() === n)));
  }
  function serverAsComputer(s) { return { name: s.id, ou: "servers", os: s.os, user: null, ip: s.ip, division: s.division }; }
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

  // every name the world declares: users (sam and name), computers and their batches, servers, printers, devices and outside contacts
  function names() {
    const out = new Set();
    const add = (x) => { if (x) out.add(String(x).toLowerCase()); };
    USERS.forEach((u) => { add(u.sam); add(u.name); });
    COMPUTERS.forEach((c) => { add(c.name); (c.also || []).forEach(add); });
    SERVERS.forEach((x) => add(x.id));
    PRINTERS.forEach((x) => add(x.id));
    DEVICES.forEach((x) => { add(x.id); (x.also || []).forEach(add); });
    CONTACTS.forEach((x) => add(x.name));
    return out;
  }

  function tasks(w, lang) { return TASKS.map((x) => ({ id: x.id, label: t(x.label, lang), done: Boolean(x.check(w)) })); }

  return { DC, OUS, GROUPS, USERS, COMPUTERS, SERVERS, PRINTERS, DEVICES, CONTACTS, CONTRACTS, SITES, COMPANY, TASKS, CMD, t, createWorld, snapshot, restore, user, view,
    group, computer, allComputers, members, ouPath, userDn, under, parse, run, tasks, divisionOf, division, names, IN_DIVISION };
});
