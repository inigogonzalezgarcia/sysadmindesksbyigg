/* SysAdmin Desks by IGG - profile and career (v0.8): progress per area (tickets solved, average score, communication, labs), a skill
   value per area for the radar, a simple career path (Service Desk L1 → L2 → Sysadmin/Infrastructure → Network/Cloud) with the next
   step to take, and a Markdown summary the user can download as evidence of practice. Pure logic, no DOM: the app and the Node tests
   (tests/learning.test.js) use the same code. Nothing here is stored: it is all computed from the progress, the activity and the labs. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./library.js"), require("./labs.js"));
  else root.SDProfile = factory(root.SDLibrary, root.SDLabs);
})(typeof self !== "undefined" ? self : this, function (Lib, Lb) {
  "use strict";

  const t = Lib.t;
  // the area of every desk (each desk in exactly one area; the tests check every scenario is here)
  const DESK_AREA = {
    "ad-lockout": "ad", "aadc-sync": "ad",
    "dns-intranet": "windows", "disk-full": "windows", "print-queue": "windows", "vpn-anyconnect": "windows",
    "m365-licence": "m365", "shared-mailbox": "m365", "mailbox-full": "m365", "ca-blocked": "m365", "sso-saml": "m365",
    "intune-bitlocker": "endpoint", "mecm-app": "endpoint",
    "rhel-var-full": "linux", "linux-sssd": "linux",
    "citrix-session": "vdi",
    "veeam-job": "data", "sql-log-full": "data",
    "net-err-disabled": "network", "net-wrong-vlan": "network", "net-fortigate-branch": "network",
    "laptop-rma": "hardware", "net-psu-rma": "hardware", "leaver-return": "hardware",
  };
  const LAB_AREA = Object.fromEntries(Lb.LABS.map((l) => [l.id, l.area]));

  // the career path: each desk and each lab in exactly one step
  const CAREER = [
    { id: "l1", title: { en: "Service Desk L1", es: "Service desk N1" },
      what: { en: "First line: accounts and passwords, a user's PC, printing, licences and mailboxes, and talking to the user.", es: "Primera línea: cuentas y contraseñas, el equipo de un usuario, impresión, licencias y buzones, y hablar con el usuario." },
      areas: ["ad", "windows", "m365", "itsm"],
      desks: ["ad-lockout", "dns-intranet", "disk-full", "print-queue", "vpn-anyconnect", "m365-licence", "shared-mailbox", "leaver-return"], labs: ["ad", "windows"] },
    { id: "l2", title: { en: "Service Desk L2 / Desktop", es: "Service desk N2 / puesto de trabajo" },
      what: { en: "Second line: device management, deployments, mailboxes at their limit, VDI, identity sync and hardware under warranty.", es: "Segunda línea: gestión de dispositivos, despliegues, buzones al límite, VDI, sincronización de identidades y hardware en garantía." },
      areas: ["endpoint", "vdi", "hardware", "m365"],
      desks: ["mailbox-full", "intune-bitlocker", "mecm-app", "citrix-session", "laptop-rma", "aadc-sync"], labs: ["m365"] },
    { id: "sys", title: { en: "Sysadmin / Infrastructure", es: "Sysadmin / Infraestructura" },
      what: { en: "Servers: Linux, backups and databases, where a change affects many users at once.", es: "Servidores: Linux, copias y bases de datos, donde un cambio afecta a muchos usuarios a la vez." },
      areas: ["linux", "data"],
      desks: ["rhel-var-full", "linux-sssd", "veeam-job", "sql-log-full"], labs: ["linux"] },
    { id: "netcloud", title: { en: "Network / Cloud", es: "Redes / Cloud" },
      what: { en: "Switches, the firewall and the branch, and cloud identity: Conditional Access and single sign-on.", es: "Switches, el cortafuegos y la sucursal, e identidad en la nube: acceso condicional e inicio de sesión único." },
      areas: ["network", "m365"],
      desks: ["net-err-disabled", "net-wrong-vlan", "net-fortigate-branch", "net-psu-rma", "ca-blocked", "sso-saml"], labs: ["network"] },
  ];

  const avg = (xs) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
  const tickets = (activity) => (Array.isArray(activity) ? activity : []).filter((a) => a && a.type === "ticket");

  /* Progress per area and in total. input: { desks: [desk ids], progress: {deskId: {points, stars, date}}, activity, labs (the sd.labs store) }.
     skill (0-100): three quarters the share of the area's tickets solved and one quarter the share of its lab's tasks; an area without a lab
     counts only its tickets; the service desk process (no tickets of its own) is the average mark of your notes to the user. */
  function aggregate(input) {
    const desks = (input.desks || Object.keys(DESK_AREA)).filter((d) => DESK_AREA[d]);
    const progress = input.progress || {};
    const act = tickets(input.activity);
    const labs = Lb.normalise(input.labs);
    const areas = Lib.AREAS.map((ar) => {
      const mine = desks.filter((d) => DESK_AREA[d] === ar.id);
      const solved = mine.filter((d) => progress[d]);
      const points = avg(solved.map((d) => Number(progress[d].points) || 0));
      const notes = act.filter((a) => mine.includes(a.id) && typeof a.userNote === "number").map((a) => a.userNote);
      const labIds = Lb.LABS.filter((l) => l.area === ar.id).map((l) => l.id);
      const lp = labIds.map((id) => Lb.progressOf(labs, id));
      const labDone = lp.reduce((a, x) => a + x.done, 0);
      const labTotal = lp.reduce((a, x) => a + x.total, 0);
      let skill;
      if (ar.id === "itsm") {
        const all = act.filter((a) => typeof a.userNote === "number").map((a) => a.userNote);
        skill = all.length ? Math.round((avg(all) / 5) * 100) : 0;
      } else {
        const dp = mine.length ? solved.length / mine.length : 0;
        skill = Math.round(100 * (labTotal ? dp * 0.75 + (labDone / labTotal) * 0.25 : dp));
      }
      return { id: ar.id, desks: mine.length, solved: solved.length, avgPoints: points == null ? null : Math.round(points), comms: avg(notes),
        labs: labIds, labDone, labTotal, skill };
    });
    const solvedAll = desks.filter((d) => progress[d]);
    const allNotes = act.filter((a) => typeof a.userNote === "number").map((a) => a.userNote);
    const ls = Lb.summary(labs);
    return {
      areas,
      totals: { desks: desks.length, solved: solvedAll.length, avgPoints: solvedAll.length ? Math.round(avg(solvedAll.map((d) => Number(progress[d].points) || 0))) : null,
        comms: avg(allNotes), notes: allNotes.length, labs: ls.labs, labsComplete: ls.complete, tasks: ls.tasks, totalTasks: ls.totalTasks },
    };
  }

  /* The career path from the same input: each step with its tickets and labs, and the next thing to do.
     The current step is the first one not finished. Inside it, a lab comes first while none of the step's tickets is solved (practise
     the commands, then a ticket); then the step's unsolved tickets, level 1 before level 2; then its unfinished labs.
     levels: {deskId: level} to sort; next: {step, kind: "desk" | "lab", id} or null when everything is done. */
  function career(input) {
    const progress = input.progress || {};
    const labs = Lb.normalise(input.labs);
    const levels = input.levels || {};
    const known = new Set(input.desks || Object.keys(DESK_AREA));
    let current = null;
    const steps = CAREER.map((st) => {
      const desks = st.desks.filter((d) => known.has(d)).map((d) => ({ id: d, solved: Boolean(progress[d]), level: levels[d] || 1 }));
      const lb = st.labs.map((id) => Object.assign({ id }, Lb.progressOf(labs, id)));
      const done = desks.filter((d) => d.solved).length + lb.filter((l) => l.complete).length;
      const total = desks.length + lb.length;
      const out = { id: st.id, title: st.title, what: st.what, areas: st.areas, desks, labs: lb, done, total, pct: total ? Math.round((100 * done) / total) : 100 };
      out.status = done === total ? "done" : current ? "later" : "current";
      if (out.status === "current") current = out;
      return out;
    });
    let next = null;
    if (current) {
      const openLab = current.labs.find((l) => !l.complete);
      const anySolved = current.desks.some((d) => d.solved);
      const desk = current.desks.filter((d) => !d.solved).sort((a, b) => a.level - b.level)[0];
      if (openLab && !anySolved) next = { step: current.id, kind: "lab", id: openLab.id };
      else if (desk) next = { step: current.id, kind: "desk", id: desk.id };
      else if (openLab) next = { step: current.id, kind: "lab", id: openLab.id };
    }
    return { steps, current: current ? current.id : null, next };
  }

  /* The radar: n axes from the top, clockwise. Returns the axis end points, the polygon of the values (0-100) and the rings, as SVG
     coordinates rounded to one decimal. */
  function radar(values, size) {
    const s = size || 240;
    const c = s / 2;
    const r = s / 2 - 34;
    const n = values.length;
    const at = (i, f) => {
      const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
      return [Math.round((c + Math.cos(a) * r * f) * 10) / 10, Math.round((c + Math.sin(a) * r * f) * 10) / 10];
    };
    const pts = (f) => values.map((_, i) => at(i, typeof f === "function" ? f(i) : f).join(",")).join(" ");
    return {
      size: s, center: c, radius: r,
      axes: values.map((_, i) => ({ end: at(i, 1), label: at(i, 1.2) })),
      rings: [0.25, 0.5, 0.75, 1].map((f) => pts(f)),
      shape: pts((i) => Math.max(0.02, Math.min(100, Number(values[i]) || 0) / 100)),
    };
  }

  /* ---------- the Markdown summary (evidence of practice, clearly labelled as such) */
  const MD = {
    en: {
      title: "SysAdmin Desks · Practice summary",
      label: "Practice in a simulator, not work experience.",
      disclaimer: "SysAdmin Desks by IGG is a free simulator of IT support tickets with a fictional company (Contoso). The tickets, systems, people and data are simulated; the results below show practice in that simulator, not work done for an employer or a client, and are not a certification.",
      who: "Technician", date: "Date", site: "Simulator",
      overview: "Overview", solved: "Tickets solved", avg: "Average score (best result per ticket)", comms: "Average mark of the notes to the user", labs: "Labs completed", tasks: "Lab tasks done",
      areas: "By area", colArea: "Area", colSolved: "Tickets", colAvg: "Average score", colComms: "Note to the user", colLabs: "Lab tasks", colSkill: "Practice level",
      list: "Tickets solved", none: "None yet.", labList: "Labs", career: "Career path", step: "Step", next: "Recommended next step",
      shows: "What this shows", showsText: "Which kinds of tickets were worked end to end in the simulator (investigate, fix the cause, verify, write the work note and the note to the user), with the score the simulator gave. It does not show experience with real users, real systems or a real service desk.",
      deskWord: "ticket", labWord: "lab", allDone: "Every step is done.",
    },
    es: {
      title: "SysAdmin Desks · Resumen de práctica",
      label: "Práctica en un simulador, no experiencia laboral.",
      disclaimer: "SysAdmin Desks by IGG es un simulador gratuito de tickets de soporte IT con una empresa ficticia (Contoso). Los tickets, sistemas, personas y datos son simulados; los resultados de abajo muestran práctica en ese simulador, no trabajo hecho para una empresa o un cliente, y no son una certificación.",
      who: "Técnico", date: "Fecha", site: "Simulador",
      overview: "Resumen", solved: "Tickets resueltos", avg: "Puntuación media (mejor resultado por ticket)", comms: "Nota media de las notas para el usuario", labs: "Laboratorios completados", tasks: "Tareas de laboratorio hechas",
      areas: "Por área", colArea: "Área", colSolved: "Tickets", colAvg: "Puntuación media", colComms: "Nota al usuario", colLabs: "Tareas de laboratorio", colSkill: "Nivel de práctica",
      list: "Tickets resueltos", none: "Todavía ninguno.", labList: "Laboratorios", career: "Itinerario profesional", step: "Paso", next: "Siguiente paso recomendado",
      shows: "Qué muestra esto", showsText: "Qué tipos de tickets se trabajaron de principio a fin en el simulador (investigar, arreglar la causa, comprobar, escribir la nota de trabajo y la nota para el usuario), con la puntuación que dio el simulador. No muestra experiencia con usuarios reales, sistemas reales ni un service desk real.",
      deskWord: "ticket", labWord: "laboratorio", allDone: "Todos los pasos están hechos.",
    },
  };
  /* opts: { lang, name, date (YYYY-MM-DD), site, deskTitle(id), deskTopic(id), labTitle(id) }. input: the same as aggregate(). */
  function toMarkdown(input, opts) {
    const o = opts || {};
    const L = o.lang === "es" ? "es" : "en";
    const W = MD[L];
    const agg = aggregate(input);
    const car = career(input);
    const dt = o.deskTitle || ((id) => id);
    const lt = o.labTitle || ((id) => id);
    const num = (x) => (x == null ? "–" : String(x));
    const cell = (s) => String(s).replace(/\|/g, "\\|");
    const lines = ["# " + W.title, "", "> **" + W.label + "**", "> " + W.disclaimer, ""];
    if (o.name) lines.push("- " + W.who + ": " + o.name);
    lines.push("- " + W.date + ": " + (o.date || ""), "- " + W.site + ": " + (o.site || "https://sysadmindesksbyigg.pages.dev/"), "");
    const tt = agg.totals;
    lines.push("## " + W.overview, "", `- ${W.solved}: ${tt.solved} / ${tt.desks}`, `- ${W.avg}: ${num(tt.avgPoints)}${tt.avgPoints == null ? "" : " / 100"}`,
      `- ${W.comms}: ${tt.comms == null ? "–" : tt.comms + " / 5"}`, `- ${W.labs}: ${tt.labsComplete} / ${tt.labs}`, `- ${W.tasks}: ${tt.tasks} / ${tt.totalTasks}`, "");
    lines.push("## " + W.areas, "", `| ${W.colArea} | ${W.colSolved} | ${W.colAvg} | ${W.colComms} | ${W.colLabs} | ${W.colSkill} |`, "|---|---|---|---|---|---|");
    agg.areas.forEach((a) => lines.push(`| ${cell(t(Lib.area(a.id).name, L))} | ${a.desks ? a.solved + " / " + a.desks : "–"} | ${num(a.avgPoints)} | ${a.comms == null ? "–" : a.comms + " / 5"} | ${a.labTotal ? a.labDone + " / " + a.labTotal : "–"} | ${a.skill} / 100 |`));
    lines.push("");
    const solved = (input.desks || Object.keys(DESK_AREA)).filter((d) => (input.progress || {})[d]);
    lines.push("## " + W.list, "");
    if (!solved.length) lines.push(W.none);
    solved.forEach((d) => { const p = input.progress[d]; lines.push(`- ${dt(d)}${o.deskTopic ? " (" + o.deskTopic(d) + ")" : ""}: ${p.points} / 100${p.date ? " · " + p.date : ""}`); });
    lines.push("", "## " + W.labList, "");
    Lb.LABS.forEach((l) => { const p = Lb.progressOf(input.labs, l.id); lines.push(`- ${lt(l.id)}: ${p.done} / ${p.total}${p.completed ? " · " + p.completed : ""}`); });
    lines.push("", "## " + W.career, "");
    car.steps.forEach((s, i) => lines.push(`${i + 1}. ${t(s.title, L)}: ${s.done} / ${s.total} (${s.pct} %)`));
    lines.push("", "**" + W.next + ":** " + (car.next ? `${car.next.kind === "desk" ? dt(car.next.id) : lt(car.next.id)} (${car.next.kind === "desk" ? W.deskWord : W.labWord})` : W.allDone), "");
    lines.push("## " + W.shows, "", W.showsText, "", "---", W.label, "");
    return lines.join("\n");
  }
  function fileName(date) { return "sysadmin-desks-practice-" + String(date || "").replace(/[^0-9-]/g, "") + ".md"; }

  return { DESK_AREA, LAB_AREA, CAREER, aggregate, career, radar, toMarkdown, fileName };
});
