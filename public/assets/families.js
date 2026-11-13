/* SysAdmin Desks by IGG - the ticket families (v0.18): which family each desk belongs to, shared by the public pages
   (scripts/ticket-families.mjs adds each family's SEO texts and builds /tickets/<family>) and the queue's family filter.
   A desk's family comes from its area in the profile (profile.js, DESK_AREA), with Citrix and VDI joined to virtualisation,
   except the decision cases (machine.shell "case"): those go by career level, since a case is about deciding, not about one
   technology. Pure logic, no DOM. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SDFamilies = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // area in the profile -> family slug
  const AREA_FAMILY = { ad: "active-directory", windows: "windows-server", m365: "microsoft-365", endpoint: "intune-endpoint",
    linux: "linux-devops", vdi: "virtualisation-backup-databases", data: "virtualisation-backup-databases", network: "networking",
    hardware: "hardware-servers", itsm: "windows-server" };
  // decision cases by career level -> family slug: the architect's cases (7), the IT manager's (8), and the IT director's (9) and
  // the CIO's (10) together in leadership
  const CASE_FAMILY = { 7: "architecture", 8: "management", 9: "leadership", 10: "leadership" };

  // the families in the order the pages and the queue show them
  const FAMILIES = [
    { slug: "active-directory", name: { es: "Active Directory", en: "Active Directory" } },
    { slug: "windows-server", name: { es: "Windows y Windows Server", en: "Windows and Windows Server" } },
    { slug: "microsoft-365", name: { es: "Microsoft 365 y Entra ID", en: "Microsoft 365 and Entra ID" } },
    { slug: "intune-endpoint", name: { es: "Intune y seguridad del puesto", en: "Intune and endpoint security" } },
    { slug: "linux-devops", name: { es: "Linux y DevOps", en: "Linux and DevOps" } },
    { slug: "virtualisation-backup-databases", name: { es: "Virtualización, copias y bases de datos", en: "Virtualisation, backup and databases" } },
    { slug: "networking", name: { es: "Redes y monitorización", en: "Networking and monitoring" } },
    { slug: "hardware-servers", name: { es: "Hardware, servidores y RMA", en: "Hardware, servers and RMA" } },
    { slug: "architecture", name: { es: "Arquitectura y casos de decisión", en: "Architecture and decision cases" } },
    { slug: "management", name: { es: "Gestión de IT y servicio", en: "IT and service management" } },
    { slug: "leadership", name: { es: "Dirección de IT y CIO", en: "IT leadership and CIO" } },
  ];

  // the family slug of a scenario, given the areas of the profile (DESK_AREA); throws for a desk without one
  function familyOf(sc, deskArea) {
    if (sc.machine && sc.machine.shell === "case") {
      const slug = CASE_FAMILY[sc.career];
      if (!slug) throw new Error(`no family for the decision cases of career level ${sc.career} (${sc.id})`);
      return slug;
    }
    const a = deskArea[sc.id];
    if (!a || !AREA_FAMILY[a]) throw new Error("no family for desk " + sc.id);
    return AREA_FAMILY[a];
  }

  return { AREA_FAMILY, CASE_FAMILY, FAMILIES, familyOf };
});
