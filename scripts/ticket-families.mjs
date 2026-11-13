// The ticket families for the public pages /tickets/<family>. Which family each desk belongs to (by its area in the profile, and the
// decision cases by career level) lives in public/assets/families.js, shared with the queue's family filter; this file adds each
// family's title, description and intro, so a search for "practise Linux" or "ejercicios de redes Cisco" lands on the right list.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { DESK_AREA } = require("../public/assets/profile.js");
const SCENARIOS = require("../public/assets/scenarios.js");
const SF = require("../public/assets/families.js");

// n: the number of tickets in the family. desc at most 155 characters with n up to 999.
export const FAMILIES = [
  { slug: "active-directory",
    es: { name: "Active Directory", title: "Practicar Active Directory · tickets gratis · SysAdmin Desks",
      desc: (n) => `${n} tickets de Active Directory para practicar gratis: cuentas bloqueadas, replicación, la hora del dominio y la sincronización con Entra ID.`,
      intro: "Cuentas que se bloquean, usuarios borrados, controladores de dominio que no replican, la hora del dominio y la sincronización con Entra ID. Los resuelves con PowerShell y el directorio de una empresa ficticia, en el navegador." },
    en: { name: "Active Directory", title: "Practise Active Directory · free tickets · SysAdmin Desks",
      desc: (n) => `${n} free Active Directory tickets to practise: locked accounts, replication, domain time and the sync with Entra ID, in a simulated console.`,
      intro: "Accounts that keep locking, deleted users, domain controllers that do not replicate, domain time and the sync with Entra ID. You solve them with PowerShell and the directory of a fictional company, in the browser." } },
  { slug: "windows-server",
    es: { name: "Windows y Windows Server", title: "Practicar Windows y Windows Server · tickets gratis",
      desc: (n) => `${n} tickets de Windows para practicar gratis: DNS, DHCP, directivas de grupo, permisos NTFS, IIS, impresoras, VPN y PowerShell, con consola simulada.`,
      intro: "Del puesto de trabajo al servidor: DNS y DHCP, directivas de grupo, permisos NTFS, perfiles, impresoras, la VPN, IIS, Windows Update y scripts de PowerShell. Cada ticket se corrige por el estado del sistema, no por una plantilla." },
    en: { name: "Windows and Windows Server", title: "Practise Windows and Windows Server · free tickets",
      desc: (n) => `${n} free Windows tickets to practise: DNS, DHCP, Group Policy, NTFS permissions, IIS, printers, VPN and PowerShell, in a simulated console.`,
      intro: "From the desktop to the server: DNS and DHCP, Group Policy, NTFS permissions, profiles, printers, the VPN, IIS, Windows Update and PowerShell scripts. Each ticket is checked against the state of the system, not a template." } },
  { slug: "microsoft-365",
    es: { name: "Microsoft 365 y Entra ID", title: "Practicar Microsoft 365 y Entra ID · tickets gratis",
      desc: (n) => `${n} tickets de Microsoft 365 para practicar gratis: Exchange Online, Teams y salas, licencias, acceso condicional, SSO, PIM y Purview.`,
      intro: "Buzones llenos o compartidos que no aparecen, licencias, Teams y las salas de reuniones, el acceso condicional, el SSO con SAML, PIM, Purview y Microsoft Graph. Los tickets que llegan cada día a una mesa que gestiona Microsoft 365." },
    en: { name: "Microsoft 365 and Entra ID", title: "Practise Microsoft 365 and Entra ID · free tickets",
      desc: (n) => `${n} free Microsoft 365 tickets to practise: Exchange Online, Teams and meeting rooms, licences, Conditional Access, SSO, PIM and Purview.`,
      intro: "Full mailboxes and shared ones that do not show, licences, Teams and meeting rooms, Conditional Access, SAML SSO, PIM, Purview and Microsoft Graph. The tickets that reach a desk running Microsoft 365 every day." } },
  { slug: "intune-endpoint",
    es: { name: "Intune y seguridad del puesto", title: "Practicar Intune, MDM y seguridad del puesto · tickets gratis",
      desc: (n) => `${n} tickets de Intune y endpoint para practicar gratis: BitLocker, MECM, Jamf, EPM, móviles Android e iPhone, Defender y anillos de actualización.`,
      intro: "Portátiles que no cumplen, BitLocker, MECM, Jamf, Endpoint Privilege Management, móviles Android e iPhone, anillos de Windows Update, certificados SCEP y Microsoft Defender. Gestión y seguridad del puesto de trabajo, ticket a ticket." },
    en: { name: "Intune and endpoint security", title: "Practise Intune, MDM and endpoint security · free tickets",
      desc: (n) => `${n} free Intune and endpoint tickets to practise: BitLocker, MECM, Jamf, EPM, Android and iPhone, Defender and Windows Update rings.`,
      intro: "Laptops that are not compliant, BitLocker, MECM, Jamf, Endpoint Privilege Management, Android and iPhone, Windows Update rings, SCEP certificates and Microsoft Defender. Endpoint management and security, one ticket at a time." } },
  { slug: "linux-devops",
    es: { name: "Linux y DevOps", title: "Practicar Linux para sysadmin y DevOps · tickets gratis",
      desc: (n) => `${n} tickets de Linux y DevOps para practicar gratis: SSH, discos, NFS, Apache, Nginx, Docker, Kubernetes, Terraform, Ansible y Jenkins.`,
      intro: "Servidores Ubuntu y Red Hat con SSH, discos llenos, montajes NFS, Apache, Nginx y SSSD, y después contenedores, Kubernetes, Terraform, Ansible y Jenkins. Se resuelven en una consola bash simulada y se cierran con la nota de trabajo." },
    en: { name: "Linux and DevOps", title: "Practise Linux for sysadmins and DevOps · free tickets",
      desc: (n) => `${n} free Linux and DevOps tickets to practise: SSH, disks, NFS, Apache, Nginx, Docker, Kubernetes, Terraform, Ansible and Jenkins.`,
      intro: "Ubuntu and Red Hat servers with SSH, full disks, NFS mounts, Apache, Nginx and SSSD, then containers, Kubernetes, Terraform, Ansible and Jenkins. Solved in a simulated bash console and closed with the work note." } },
  { slug: "virtualisation-backup-databases",
    es: { name: "Virtualización, copias y bases de datos", title: "Practicar VMware, Veeam y SQL Server · tickets gratis",
      desc: (n) => `${n} tickets para practicar gratis: vSphere y ESXi, Citrix y Horizon, Veeam y cintas, SQL Server, MySQL, PostgreSQL, AS400 y z/OS.`,
      intro: "Hosts ESXi que no responden, snapshots olvidados, escritorios Citrix y Horizon, copias de Veeam y en cinta que hay que probar, y bases de datos SQL Server, MySQL y PostgreSQL. También AS400 y z/OS." },
    en: { name: "Virtualisation, backup and databases", title: "Practise VMware, Veeam and SQL Server · free tickets",
      desc: (n) => `${n} free tickets to practise: vSphere and ESXi, Citrix and Horizon, Veeam and tape, SQL Server, MySQL, PostgreSQL, AS400 and z/OS.`,
      intro: "ESXi hosts that stop answering, forgotten snapshots, Citrix and Horizon desktops, Veeam and tape backups to test, and SQL Server, MySQL and PostgreSQL databases. AS400 and z/OS too." } },
  { slug: "networking",
    es: { name: "Redes y monitorización", title: "Ejercicios de redes Cisco, FortiGate y Zabbix · tickets gratis",
      desc: (n) => `${n} tickets de redes para practicar gratis: switches Cisco y HP, VLAN, FortiGate, pfSense, MikroTik, WiFi, VoIP, Zabbix, Nagios y Grafana.`,
      intro: "Puertos en err-disabled, VLAN equivocadas, el FortiGate de una sucursal, pfSense, MikroTik, WiFi de invitados y telefonía, y la monitorización que tendría que haber avisado: Zabbix, Nagios, Cacti y Grafana. Con la CLI de cada equipo." },
    en: { name: "Networking and monitoring", title: "Practise Cisco, FortiGate and Zabbix networking · free tickets",
      desc: (n) => `${n} free networking tickets to practise: Cisco and HP switches, VLANs, FortiGate, pfSense, MikroTik, Wi-Fi, VoIP, Zabbix, Nagios and Grafana.`,
      intro: "Ports in err-disabled, wrong VLANs, a branch FortiGate, pfSense, MikroTik, guest Wi-Fi and voice, and the monitoring that should have warned: Zabbix, Nagios, Cacti and Grafana. With each device's own CLI." } },
  { slug: "hardware-servers",
    es: { name: "Hardware, servidores y RMA", title: "Practicar hardware, servidores y RMA · tickets gratis",
      desc: (n) => `${n} tickets de hardware para practicar gratis: RMA en garantía, iDRAC, SAI, Nutanix, servidores, TPV y la recepción y devolución de equipos.`,
      intro: "Discos a punto de fallar, fuentes averiadas, el SAI de la sala, el iDRAC, Nutanix, TPV de tienda y restaurante, y equipos que llegan o se devuelven. Muchos se cierran con un envío o una RMA al fabricante." },
    en: { name: "Hardware, servers and RMA", title: "Practise hardware, servers and RMA · free tickets",
      desc: (n) => `${n} free hardware tickets to practise: warranty RMAs, iDRAC, UPS, Nutanix, servers, POS, and equipment that arrives or is returned.`,
      intro: "Drives about to fail, failed power supplies, the room UPS, the iDRAC, Nutanix, shop and restaurant POS, and equipment that arrives or goes back. Many are closed with a shipment or an RMA to the vendor." } },
  { slug: "architecture",
    es: { name: "Arquitectura y casos de decisión", title: "Casos de arquitectura IT y decisiones · tickets gratis",
      desc: (n) => `${n} casos de decisión de arquitectura para practicar gratis: DR con RTO y RPO, nube o local, alta disponibilidad, redes de sede y FinOps.`,
      intro: "Casos de un arquitecto de infraestructura: lees el expediente, preguntas a las partes interesadas, comparas tres o cuatro opciones con su coste, su riesgo y su plazo, decides y lo defiendes en una nota para dirección. Recuperación ante desastres, nube o local, alta disponibilidad, una sede nueva, aperturas y ventanas de mantenimiento." },
    en: { name: "Architecture and decision cases", title: "IT architecture and decision cases · free tickets",
      desc: (n) => `${n} free architecture decision cases to practise: DR with RTO and RPO, cloud or on-premises, high availability, site networks and FinOps.`,
      intro: "An infrastructure architect's cases: read the case file, ask the stakeholders, compare three or four options with their cost, risk and time, decide and defend it in a note for management. Disaster recovery, cloud or on-premises, high availability, a new site, openings and maintenance windows." } },
  { slug: "management",
    es: { name: "Gestión de IT y servicio", title: "Casos de gestión de IT y servicio · tickets gratis",
      desc: (n) => `${n} casos de decisión de un responsable de IT para practicar gratis: proveedores y SLA, contratos, incidentes graves, problemas, cambios y CMDB.`,
      intro: "Casos de un responsable de IT: decides sobre personas, proveedores, procesos, servicio y dinero, y lo defiendes ante dirección, el CAB o auditoría. Un proveedor que incumple el SLA, un contrato que se renueva solo, un incidente grave, un problema que vuelve cada lunes, un cambio en semana de cierre, un backlog que crece y una CMDB auditada." },
    en: { name: "IT and service management", title: "IT and service management cases · free tickets",
      desc: (n) => `${n} free IT manager decision cases to practise: suppliers and SLAs, contracts, major incidents, problems, changes and the CMDB.`,
      intro: "An IT manager's cases: you decide about people, suppliers, processes, service and money, and defend it to management, the CAB or audit. A supplier that misses its SLA, a contract that renews by itself, a major incident, a problem back every Monday, a change in closing week, a growing backlog and an audited CMDB." } },
  { slug: "leadership",
    es: { name: "Dirección de IT y CIO", title: "Casos de dirección de IT y CIO · tickets gratis",
      desc: (n) => `${n} casos de decisión de dirección de IT para practicar gratis: presupuesto, ISO 27001, vulnerabilidades, cartera de proyectos, sedes y gobierno.`,
      intro: "Casos de un director de IT para todo el grupo: decides con presupuesto, riesgo regulatorio, cartera de proyectos y personas, y lo defiendes ante el comité de dirección o el consejero delegado, con el impacto en cada división y lo que se deja de hacer. Un recorte del 15 %, una auditoría ISO 27001, vulnerabilidades críticas fuera de plazo, tres proyectos para dos presupuestos, las dos peores sedes y los administradores globales del tenant." },
    en: { name: "IT leadership and CIO", title: "IT leadership and CIO cases · free tickets",
      desc: (n) => `${n} free IT director decision cases to practise: budget cuts, ISO 27001, vulnerabilities, the project portfolio, sites and tenant governance.`,
      intro: "An IT director's cases for the whole group: you decide with budget, regulatory risk, the project portfolio and people, and defend it to the executive committee or the CEO, with the impact on each division and what is not done. A 15 % cut, an ISO 27001 audit, critical vulnerabilities past their deadline, three projects for two budgets, the two worst sites and the tenant's Global Administrators." } },
];

const byId = Object.fromEntries(SCENARIOS.map((sc) => [sc.id, sc]));
export const familyOf = (id) => {
  if (!byId[id]) throw new Error("no desk " + id);
  return FAMILIES.find((f) => f.slug === SF.familyOf(byId[id], DESK_AREA));
};
// the same families, in the same order and with the same names, as the queue's filter (families.js)
if (FAMILIES.map((f) => f.slug + f.es.name + f.en.name).join() !== SF.FAMILIES.map((f) => f.slug + f.name.es + f.name.en).join()) {
  throw new Error("scripts/ticket-families.mjs and public/assets/families.js list different families");
}
export const familyPath = (f) => "/tickets/" + f.slug;
