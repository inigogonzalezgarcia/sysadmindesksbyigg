/* SysAdmin Desks by IGG - user interface. Every text is set with textContent (no HTML strings). */
(function () {
  "use strict";
  const E = window.SDEngine;
  const SCENARIOS = window.SDScenarios;
  const t = E.t;

  const UI = {
    en: {
      progress: (d, n, s) => `${d} of ${n} desks solved · ${s} stars`,
      level: "Level", back: "← Ticket queue",
      ticket: "Ticket", context: "What you have", stages: "Progress", hint: "Hint", restart: "Restart",
      guide: "Read the guide", termHelp: "Type help for the basics. ↑/↓ repeat commands.",
      points: "points",
      found: "Your note covers", sample: "An example note", solution: "One way to solve it",
      next: "Next ticket", home: "Ticket queue", noteEmpty: "Write a few lines first.",
      hintsUsed: (h) => `Hints used: ${h}`, guides: "Guides",
      welcome: "Connected to {host} as {user}. Type help if you need it.",
      langBtn: "ES", langLabel: "Español", notFound: "That desk does not exist.",
      startTag: "Help desk · morning shift", startTitle: "Clock in and start your support shift",
      startText: "SysAdmin Desks puts you at the help desk of a fictional company. Real tickets, a console that answers like a real machine, and a work note that is scored when you close the ticket.",
      startPoints: ["6 tickets: Active Directory, DNS, Windows, printers, Exchange Online and Intune", "Hints when you are stuck, and the tempting fix that does not solve it", "Each desk links to its step-by-step guide", "Your progress is saved in your account and follows you to any device"],
      deskHost: "CONTOSO-HD-07", deskDomain: "contoso.local", cardTitle: "Contoso help desk · technician sign-in",
      tabLogin: "Sign in", tabRegister: "Create account", fName: "Technician name", fAvatar: "Avatar", fEmail: "Email", fPassword: "Password",
      phName: "Alex Moreno", phEmail: "you@example.com", show: "Show password", hide: "Hide password",
      rules: { length: "8 characters or more", capital: "One capital letter", number: "One number" },
      consentA: "I have read the ", consentLink: "privacy policy", consentB: ".",
      btnLogin: "Clock in", btnRegister: "Create my account", or: "or", google: "Continue with Google",
      googleNote: "If you continue with Google you accept the privacy policy.",
      forgot: "Forgot your password?", forgotText: "Use Continue with Google if your account uses that email, or write to me from the contact form on my website and I will help you get back in.",
      contact: "Contact form",
      errors: { credentials: "Wrong email or password.", exists: "There is already an account with that email: sign in instead.",
        name: "Write a name of 2 to 40 characters.", email: "Check the email address.", password: "The password needs 8 characters or more, a capital letter and a number.",
        consent: "Accept the privacy policy to create the account.", locked: "Too many attempts. Wait 15 minutes and try again.",
        google_only: "This account signs in with Google: use Continue with Google.", unavailable: "Accounts are not available right now. Try again in a few minutes.",
        server: "Something went wrong. Try again in a minute.", google_off: "Sign-in with Google is not ready yet. Use your email and password.",
        google_error: "Sign-in with Google did not finish. Try again.", network: "No connection to the server.", origin: "Reload the page and try again.", bad_request: "Reload the page and try again.", need_login: "Sign in or create a free account to open this desk." },
      signIn: "Sign in", account: "My account", signOut: "Sign out", hello: (n) => `Hi, ${n}. Pick a ticket to start your shift.`,
      accTitle: "My account", accSynced: "Your progress is saved in your account.", accGoogle: "Signs in with Google", accPassword: "Signs in with email and password",
      accDelete: "Delete my account", accDeleteText: "This deletes your account, your sessions and your saved progress. It cannot be undone.",
      accConfirm: "Yes, delete everything", accCancel: "Cancel", accDeleted: "Your account has been deleted.",
      footUser: "Fictional company and people. Your progress is saved in your account.", privacy: "Privacy",
      footAnon: "Fictional company and people.", backHome: "← Back to the home page",
      navLabel: "Help desk", deskName: "Contoso help desk", navTickets: "Tickets", navProgress: "Progress", navGuides: "Guides", navAccount: "My account", navTour: "Take the tour",
      qTitle: "Ticket queue", shift: "Morning shift · on duty", tabOpen: "Open", tabClosed: "Closed",
      colTicket: "Ticket", colSubject: "Subject", colRequester: "Requester", colPriority: "Priority", colStatus: "Status", colAssignee: "Assigned to",
      colResult: "Result", colPoints: "Score", colDate: "Closed on", colTopic: "Topic", colBest: "Best result",
      status: { new: "New", progress: "In progress", closed: "Closed" }, unassigned: "Unassigned", replay: "Replay",
      lvl: { resolved: "Resolved", observations: "Resolved with observations", unresolved: "Not resolved" },
      slaTarget: (m) => `${m} min`, slaLeft: (m) => `${m} left`, slaOver: (m) => `${m} min over`,
      emptyOpen: "No open tickets. Good shift! You can replay any of them from Closed.", emptyClosed: "You have not closed any ticket yet.",
      console: "Console", assign: "Assign to me", assignedTo: "Assigned to",
      lockedTitle: "Assign the ticket to yourself to start", lockedText: (m, p) => `The SLA starts when you take it: ${m} minutes for a ${p}.`,
      requester: "Requester", fUser: "User", fLocation: "Location", fDevice: "Device", actionsT: "Actions", guiRan: "[ticket page]",
      readyMsg: "Ready to close: choose the resolution code and write the work note below.",
      resTitle: "Resolve the ticket", resText: "Choose the resolution code and write the work note: cause, what you changed, how you checked it and the follow-up. Close it when you think it is fixed; if it is not, it comes back.",
      resCode: "Resolution code", resPick: "Choose a code", resNote: "Work note", resPlaceholder: "Cause: …  Change: …  Check: …  Follow-up: …",
      resolveBtn: "Resolve", needCode: "Choose a resolution code.",
      unresolvedTitle: "The ticket is not fixed yet", unresolvedText: "The user would call back within the hour. The ticket stays open and the SLA keeps running; closing it unfixed costs 10 points.",
      whyT: "What is missing", obsT: "Observations", keepWorking: "Back to the ticket", queueBtn: "Ticket queue",
      timeUsed: (m, l) => `Time: ${m} of ${l} min`, codeUsed: (c) => `Code: ${c}`,
      pTitle: "Your progress", pSub: "Your best result on each ticket, saved in your account.", tClosed: "Tickets closed", tStars: "Stars", tPoints: "Points", tAvg: "Average score", notYet: "Not yet",
      tour: [
        ["Welcome to the Contoso help desk", "You are the technician on the morning shift. In two minutes: where the tickets are, how the SLA works and how a ticket is closed."],
        ["Your ticket queue", "Every row is a ticket from a user of the fictional company, with its priority and status. Open shows what is waiting; Closed, what you have solved and how."],
        ["The SLA", "The clock starts when you assign a ticket to yourself: 20 minutes for a P1, 30 for a P2, 45 for a P3. Closing in time counts."],
        ["Open a ticket", "On the ticket page, press Assign to me and the console comes alive. Investigate, fix the cause, prove it works, then choose the resolution code and write the note."],
        ["Your progress", "Points and stars for your best result on each ticket, saved in your account and on any device."],
        ["Take the tour again", "This button shows the tour whenever you want. Each ticket also links to its step-by-step guide. Good shift!"],
      ],
      tourNext: "Next", tourBack: "Back", tourSkip: "Skip the tour", tourDone: "Start the shift", tourStep: (i, n) => `${i} of ${n}`,
      navDirectory: "Directory", navInventory: "Inventory",
      tabConsole: "Console", tabDesk: (h) => `Go to the desk · ${h}`, evTitle: "Event Viewer", terminal: "Terminal", deskRan: "[desk]", equivalent: "Same as typing:",
      lvlNames: { error: "Error", warning: "Warning", information: "Information" }, evSource: "Source", evId: "Event ID",
      dTitle: "Directory", dSub: "contoso.local · Active Directory (simulated). The same users and computers as the tickets.", dTree: "Organisational units",
      dTasks: "Practice requests", dTasksSub: "Do them with the buttons or with PowerShell below: both run the same command.", dResetAll: "Reset the directory",
      dResetDone: "Directory reset to how it was at the start of the shift.", dSearch: "Search by name or user", dObjects: (n) => `${n} objects`,
      dUsers: "Users", dGroups: "Groups", dComputers: "Computers", dNone: "Nothing matches.", dPick: "Pick a user, group or computer to see its details.",
      dEnabled: "Enabled", dDisabled: "Disabled", dLocked: "Locked out", dMustChangeShort: "Must change password",
      dTicket: "Part of an open ticket:", dTitleF: "Job title", dDept: "Department", dPwdSet: "Password last set", dMustChange: "Change password at next sign-in",
      yes: "Yes", no: "No", dLastLogon: "Last sign-in", dDevice: "Computer", dUnlock: "Unlock", dReset: "Reset password", dDisable: "Disable account", dEnable: "Enable account",
      dGroupsT: "Member of", dRemove: (g) => `Remove from ${g}`, dAddGroup: "Add to a group", dChoose: "Choose a group", dAdd: "Add",
      dResetTitle: "Reset password", dResetText: "A temporary password is set. Give it to the user by phone, never by email.", dResetMust: "User must change password at next sign-in",
      dResetUnlock: "Unlock the user's account", dResetOk: "Reset", dCancel: "Cancel", dScope: "Scope", dScopeVal: "Global security group",
      dMembers: "Members", dNoMembers: "No members.", dAssigned: "Assigned user", dNote: "Note", dInInventory: "Show in the inventory",
      dConsole: "PowerShell · ActiveDirectory module", dConsoleHelp: "Type help for the commands. Every button shows the command it runs. ↑/↓ repeat commands.",
      dWelcome: "Connected to ADM-WS01 as CONTOSO\\it.admin with the ActiveDirectory module. Type help if you need it.",
      dRouted: (id) => `(Sent to ticket ${id}: the account belongs to an open ticket.)`,
      dAssignFirst: (n, id) => `${n}'s account is part of ticket ${id}, still unassigned. Assign the ticket to yourself to work on it.`,
      iTitle: "Inventory", iSub: "Servers and printers at head office. The status follows the open tickets.", iAll: "All", iServers: "Servers", iPrinters: "Printers", iProblems: "With an incident",
      colName: "Name", colType: "Type", colRole: "Role / model", colLocation: "Location", colTickets: "Tickets", iServer: "Server", iPrinter: "Printer",
      st: { ok: "OK", warn: "Warning", bad: "Error" }, iNoProblem: "Nothing to report.", iPick: "Pick a row to see the details.", iNoIssue: "Nothing to report.",
      iOs: "Operating system", iOwner: "Owner", iPatched: "Last patched", iQueue: "Print server", iJobs: "Jobs in the queue", iNone: "No tickets.", iInDir: "Show in the directory",
      land: {
        tag: "IT support simulator · free", title: "SysAdmin Desks",
        lead: "Practise the job of a support technician in your browser. Take a ticket from a fictional company, investigate in a console that answers like a real machine, fix the cause, prove it works and write the work note. Free, with your own account and nothing to install.",
        cta: "Start free", how: "How it works", guides: "Guides",
        newTicket: "New ticket", heroTicket: "Internet works, the intranet does not",
        sections: [
          { k: "01 · Read the ticket", h: "Real tickets,\none support desk.",
            p: "Six tickets you will meet in your first months on a help desk: a user locked out every morning, a mailbox that bounces customer emails, a printer queue that will not empty, a laptop that loses Outlook and Teams. Each one comes with the user, the priority and what you have to work with.",
            chips: ["Active Directory", "Network / DNS", "Windows", "Printers", "Exchange Online", "Intune"] },
          { k: "02 · Investigate", h: "A console that answers\nlike a real machine.",
            p: "Type the commands you would use at work, in PowerShell or cmd: Get-ADUser, Get-WinEvent, ipconfig, nslookup, Get-Printer, Get-Mailbox and more. The output changes with what you do. Hints when you are stuck, and one tempting fix that looks right but does not solve the ticket.",
            chips: ["PowerShell and cmd", "Simulated directory and desktop", "Hints", "The tempting fix"] },
          { k: "03 · Fix and prove it", h: "Fix the cause,\nnot only the symptom.",
            p: "Each desk has a checklist: find the cause, fix it and check it stays fixed. The ticket only closes when you have proved it, like on a real shift, where unlocking an account again does not help if the old password is still saved somewhere.",
            chips: ["Investigate", "Fix", "Verify"] },
          { k: "04 · Write the note", h: "The note the next\ntechnician will thank you for.",
            p: "Close the ticket with a work note: cause, change, check and follow-up. It is scored, you see what was missing and an example note, and every desk links to its step-by-step guide. Your progress is saved in your account and follows you to any device.",
            chips: ["Scored work notes", "Step-by-step guides", "Progress in your account"] },
        ],
        endK: "05 · Start your shift", endH: "Ready for your first shift?", endP: "Create a free account and take your first ticket. Sign in with email or with Google.",
        footBlurb: "Hands-on IT support practice with realistic tickets, a simulated console and scored work notes.",
        colDesks: "Desks", colGuides: "Guides", colProject: "Project",
        guideLinks: [["All guides", "guias.html"], ["Level 1: first steps", "guias/nivel-1.html"], ["Level 2: solid foundations", "guias/nivel-2.html"], ["Level 3: advanced", "guias/nivel-3.html"]],
        projectLinks: [["About me", "about.html"], ["Blog", "blog/"], ["Contact", "about.html#contacto"]],
        legal: "Educational simulation with a fictional company and people. Not real IT access.",
        t1: ["The account that locks every morning", "P2"], t2: ["The reception printer queue will not empty", "P2"], t3: ["Customer emails bounce", "P1"],
        noteTitle: "Work note", noteText: "Cause: scheduled task with an old password on FS-SCAN01…", score: "100 points", resolved: "Resolved", stagesDemo: ["Find the source of the lockouts", "Remove the cause and unlock", "Check it stays unlocked"],
      },
    },
    es: {
      progress: (d, n, s) => `${d} de ${n} puestos resueltos · ${s} estrellas`,
      level: "Nivel", back: "← Cola de tickets",
      ticket: "Ticket", context: "Lo que tienes", stages: "Progreso", hint: "Pista", restart: "Reiniciar",
      guide: "Leer la guía", termHelp: "Escribe help para lo básico. ↑/↓ repiten comandos.",
      points: "puntos",
      found: "Tu nota incluye", sample: "Una nota de ejemplo", solution: "Una forma de resolverlo",
      next: "Siguiente ticket", home: "Cola de tickets", noteEmpty: "Escribe unas líneas primero.",
      hintsUsed: (h) => `Pistas usadas: ${h}`, guides: "Guías",
      welcome: "Conectado a {host} como {user}. Escribe help si lo necesitas.",
      langBtn: "EN", langLabel: "English", notFound: "Ese puesto no existe.",
      startTag: "Mesa de soporte · turno de mañana", startTitle: "Ficha y empieza tu turno de soporte",
      startText: "SysAdmin Desks te sienta en la mesa de soporte de una empresa ficticia. Tickets reales, una consola que responde como un equipo de verdad y una nota de trabajo que se puntúa al cerrar el ticket.",
      startPoints: ["6 tickets: Active Directory, DNS, Windows, impresoras, Exchange Online e Intune", "Pistas cuando te atascas, y el arreglo tentador que no lo resuelve", "Cada puesto enlaza con su guía paso a paso", "Tu progreso se guarda en tu cuenta y te sigue a cualquier equipo"],
      deskHost: "CONTOSO-HD-07", deskDomain: "contoso.local", cardTitle: "Mesa de soporte de Contoso · acceso de técnicos",
      tabLogin: "Entrar", tabRegister: "Crear cuenta", fName: "Nombre de técnico", fAvatar: "Avatar", fEmail: "Email", fPassword: "Contraseña",
      phName: "Alex Moreno", phEmail: "tu@ejemplo.com", show: "Mostrar contraseña", hide: "Ocultar contraseña",
      rules: { length: "8 caracteres o más", capital: "Una mayúscula", number: "Un número" },
      consentA: "He leído la ", consentLink: "política de privacidad", consentB: ".",
      btnLogin: "Fichar entrada", btnRegister: "Crear mi cuenta", or: "o", google: "Continuar con Google",
      googleNote: "Si continúas con Google aceptas la política de privacidad.",
      forgot: "¿Has olvidado la contraseña?", forgotText: "Usa Continuar con Google si tu cuenta usa ese email, o escríbeme desde el formulario de contacto de mi web y te ayudo a recuperar el acceso.",
      contact: "Formulario de contacto",
      errors: { credentials: "Email o contraseña incorrectos.", exists: "Ya hay una cuenta con ese email: entra con ella.",
        name: "Escribe un nombre de 2 a 40 caracteres.", email: "Revisa el email.", password: "La contraseña necesita 8 caracteres o más, una mayúscula y un número.",
        consent: "Acepta la política de privacidad para crear la cuenta.", locked: "Demasiados intentos. Espera 15 minutos y vuelve a probar.",
        google_only: "Esta cuenta entra con Google: usa Continuar con Google.", unavailable: "Las cuentas no están disponibles ahora mismo. Prueba de nuevo en unos minutos.",
        server: "Algo ha fallado. Prueba de nuevo en un minuto.", google_off: "El acceso con Google aún no está listo. Usa tu email y contraseña.",
        google_error: "El acceso con Google no terminó. Prueba otra vez.", network: "Sin conexión con el servidor.", origin: "Recarga la página y prueba otra vez.", bad_request: "Recarga la página y prueba otra vez.", need_login: "Entra o crea una cuenta gratis para abrir este puesto." },
      signIn: "Entrar", account: "Mi cuenta", signOut: "Salir", hello: (n) => `Hola, ${n}. Elige un ticket para empezar el turno.`,
      accTitle: "Mi cuenta", accSynced: "Tu progreso se guarda en tu cuenta.", accGoogle: "Entra con Google", accPassword: "Entra con email y contraseña",
      accDelete: "Borrar mi cuenta", accDeleteText: "Se borran tu cuenta, tus sesiones y tu progreso guardado. No se puede deshacer.",
      accConfirm: "Sí, borrar todo", accCancel: "Cancelar", accDeleted: "Tu cuenta se ha borrado.",
      footUser: "Empresa y personas ficticias. Tu progreso se guarda en tu cuenta.", privacy: "Privacidad",
      footAnon: "Empresa y personas ficticias.", backHome: "← Volver a la portada",
      navLabel: "Mesa de soporte", deskName: "Mesa de soporte de Contoso", navTickets: "Tickets", navProgress: "Progreso", navGuides: "Guías", navAccount: "Mi cuenta", navTour: "Ver el tour",
      qTitle: "Cola de tickets", shift: "Turno de mañana · de guardia", tabOpen: "Abiertos", tabClosed: "Cerrados",
      colTicket: "Ticket", colSubject: "Asunto", colRequester: "Solicitante", colPriority: "Prioridad", colStatus: "Estado", colAssignee: "Asignado a",
      colResult: "Resultado", colPoints: "Puntuación", colDate: "Cerrado el", colTopic: "Tema", colBest: "Mejor resultado",
      status: { new: "Nuevo", progress: "En curso", closed: "Cerrado" }, unassigned: "Sin asignar", replay: "Repetir",
      lvl: { resolved: "Resuelto", observations: "Resuelto con observaciones", unresolved: "No resuelto" },
      slaTarget: (m) => `${m} min`, slaLeft: (m) => `quedan ${m}`, slaOver: (m) => `vencido hace ${m} min`,
      emptyOpen: "No quedan tickets abiertos. ¡Buen turno! Puedes repetir cualquiera desde Cerrados.", emptyClosed: "Aún no has cerrado ningún ticket.",
      console: "Consola", assign: "Asignarme", assignedTo: "Asignado a",
      lockedTitle: "Asígnate el ticket para empezar", lockedText: (m, p) => `El SLA empieza a contar cuando lo coges: ${m} minutos para una ${p}.`,
      requester: "Solicitante", fUser: "Usuario", fLocation: "Ubicación", fDevice: "Equipo", actionsT: "Acciones", guiRan: "[ficha del ticket]",
      readyMsg: "Listo para cerrar: elige el código de resolución y escribe la nota de trabajo abajo.",
      resTitle: "Resolver el ticket", resText: "Elige el código de resolución y escribe la nota de trabajo: causa, qué cambiaste, cómo lo comprobaste y el seguimiento. Ciérralo cuando creas que está arreglado; si no lo está, vuelve.",
      resCode: "Código de resolución", resPick: "Elige un código", resNote: "Nota de trabajo", resPlaceholder: "Causa: …  Cambio: …  Comprobación: …  Seguimiento: …",
      resolveBtn: "Resolver", needCode: "Elige un código de resolución.",
      unresolvedTitle: "El ticket aún no está arreglado", unresolvedText: "El usuario volvería a llamar antes de una hora. El ticket sigue abierto y el SLA sigue corriendo; cerrarlo sin arreglar resta 10 puntos.",
      whyT: "Qué falta", obsT: "Observaciones", keepWorking: "Volver al ticket", queueBtn: "Cola de tickets",
      timeUsed: (m, l) => `Tiempo: ${m} de ${l} min`, codeUsed: (c) => `Código: ${c}`,
      pTitle: "Tu progreso", pSub: "Tu mejor resultado en cada ticket, guardado en tu cuenta.", tClosed: "Tickets cerrados", tStars: "Estrellas", tPoints: "Puntos", tAvg: "Puntuación media", notYet: "Aún no",
      tour: [
        ["Bienvenido a la mesa de soporte de Contoso", "Eres el técnico del turno de mañana. En dos minutos: dónde están los tickets, cómo funciona el SLA y cómo se cierra un ticket."],
        ["Tu cola de tickets", "Cada fila es un ticket de un usuario de la empresa ficticia, con su prioridad y su estado. En Abiertos ves lo que espera; en Cerrados, lo que has resuelto y cómo."],
        ["El SLA", "El reloj empieza cuando te asignas un ticket: 20 minutos para una P1, 30 para una P2 y 45 para una P3. Cerrar a tiempo cuenta."],
        ["Abre un ticket", "En la ficha, pulsa Asignarme y la consola se activa. Investiga, arregla la causa, demuestra que funciona y después elige el código de resolución y escribe la nota."],
        ["Tu progreso", "Puntos y estrellas de tu mejor resultado en cada ticket, guardados en tu cuenta y en cualquier equipo."],
        ["Repite el tour", "Este botón vuelve a mostrar el tour cuando quieras. Cada ticket enlaza también con su guía paso a paso. ¡Buen turno!"],
      ],
      tourNext: "Siguiente", tourBack: "Atrás", tourSkip: "Saltar el tour", tourDone: "Empezar el turno", tourStep: (i, n) => `${i} de ${n}`,
      navDirectory: "Directorio", navInventory: "Inventario",
      tabConsole: "Consola", tabDesk: (h) => `Ir al puesto · ${h}`, evTitle: "Visor de eventos", terminal: "Terminal", deskRan: "[puesto]", equivalent: "Igual que escribir:",
      lvlNames: { error: "Error", warning: "Advertencia", information: "Información" }, evSource: "Origen", evId: "Id. del evento",
      dTitle: "Directorio", dSub: "contoso.local · Active Directory (simulado). Los mismos usuarios y equipos que los tickets.", dTree: "Unidades organizativas",
      dTasks: "Peticiones de práctica", dTasksSub: "Hazlas con los botones o con PowerShell abajo: los dos ejecutan el mismo comando.", dResetAll: "Restablecer el directorio",
      dResetDone: "Directorio restablecido a como estaba al empezar el turno.", dSearch: "Buscar por nombre o usuario", dObjects: (n) => `${n} objetos`,
      dUsers: "Usuarios", dGroups: "Grupos", dComputers: "Equipos", dNone: "No hay resultados.", dPick: "Elige un usuario, grupo o equipo para ver sus datos.",
      dEnabled: "Habilitada", dDisabled: "Deshabilitada", dLocked: "Bloqueada", dMustChangeShort: "Debe cambiar la contraseña",
      dTicket: "Forma parte de un ticket abierto:", dTitleF: "Puesto", dDept: "Departamento", dPwdSet: "Último cambio de contraseña", dMustChange: "Cambiar la contraseña al iniciar sesión",
      yes: "Sí", no: "No", dLastLogon: "Último inicio de sesión", dDevice: "Equipo", dUnlock: "Desbloquear", dReset: "Restablecer contraseña", dDisable: "Deshabilitar cuenta", dEnable: "Habilitar cuenta",
      dGroupsT: "Miembro de", dRemove: (g) => `Quitar de ${g}`, dAddGroup: "Añadir a un grupo", dChoose: "Elige un grupo", dAdd: "Añadir",
      dResetTitle: "Restablecer contraseña", dResetText: "Se pone una contraseña temporal. Dásela al usuario por teléfono, nunca por correo.", dResetMust: "El usuario debe cambiar la contraseña al iniciar sesión",
      dResetUnlock: "Desbloquear la cuenta del usuario", dResetOk: "Restablecer", dCancel: "Cancelar", dScope: "Ámbito", dScopeVal: "Grupo de seguridad global",
      dMembers: "Miembros", dNoMembers: "Sin miembros.", dAssigned: "Usuario asignado", dNote: "Nota", dInInventory: "Ver en el inventario",
      dConsole: "PowerShell · módulo ActiveDirectory", dConsoleHelp: "Escribe help para ver los comandos. Cada botón muestra el comando que ejecuta. ↑/↓ repiten comandos.",
      dWelcome: "Conectado a ADM-WS01 como CONTOSO\\it.admin con el módulo ActiveDirectory. Escribe help si lo necesitas.",
      dRouted: (id) => `(Enviado al ticket ${id}: la cuenta forma parte de un ticket abierto.)`,
      dAssignFirst: (n, id) => `La cuenta de ${n} forma parte del ticket ${id}, aún sin asignar. Asígnate el ticket para trabajar en ella.`,
      iTitle: "Inventario", iSub: "Servidores e impresoras de la oficina central. El estado sigue a los tickets abiertos.", iAll: "Todo", iServers: "Servidores", iPrinters: "Impresoras", iProblems: "Con incidencia",
      colName: "Nombre", colType: "Tipo", colRole: "Función / modelo", colLocation: "Ubicación", colTickets: "Tickets", iServer: "Servidor", iPrinter: "Impresora",
      st: { ok: "Correcto", warn: "Aviso", bad: "Error" }, iNoProblem: "Nada que destacar.", iPick: "Elige una fila para ver el detalle.", iNoIssue: "Nada que destacar.",
      iOs: "Sistema operativo", iOwner: "Responsable", iPatched: "Último parcheo", iQueue: "Servidor de impresión", iJobs: "Trabajos en cola", iNone: "Sin tickets.", iInDir: "Ver en el directorio",
      land: {
        tag: "Simulador de soporte IT · gratis", title: "SysAdmin Desks",
        lead: "Practica el trabajo de un técnico de soporte en el navegador. Coge un ticket de una empresa ficticia, investiga en una consola que responde como un equipo de verdad, arregla la causa, demuestra que funciona y escribe la nota de trabajo. Gratis, con tu propia cuenta y sin instalar nada.",
        cta: "Empieza gratis", how: "Cómo funciona", guides: "Guías",
        newTicket: "Nuevo ticket", heroTicket: "Internet funciona, la intranet no",
        sections: [
          { k: "01 · Lee el ticket", h: "Tickets reales,\nuna mesa de soporte.",
            p: "Seis tickets que te vas a encontrar en tus primeros meses en soporte: un usuario que se bloquea cada mañana, un buzón que rebota los correos de clientes, una cola de impresión que no se vacía, un portátil que se queda sin Outlook ni Teams. Cada uno llega con el usuario, la prioridad y lo que tienes para trabajar.",
            chips: ["Active Directory", "Red / DNS", "Windows", "Impresoras", "Exchange Online", "Intune"] },
          { k: "02 · Investiga", h: "Una consola que responde\ncomo un equipo de verdad.",
            p: "Escribe los comandos que usarías en el trabajo, en PowerShell o cmd: Get-ADUser, Get-WinEvent, ipconfig, nslookup, Get-Printer, Get-Mailbox y más. La salida cambia según lo que haces. Pistas cuando te atascas, y un arreglo tentador que parece bueno pero no resuelve el ticket.",
            chips: ["PowerShell y cmd", "Directorio y escritorio simulados", "Pistas", "El arreglo tentador"] },
          { k: "03 · Arregla y compruébalo", h: "Arregla la causa,\nno solo el síntoma.",
            p: "Cada puesto tiene su checklist: encontrar la causa, arreglarla y comprobar que sigue arreglado. El ticket solo se cierra cuando lo has demostrado, como en un turno real, donde desbloquear otra vez la cuenta no sirve si la contraseña antigua sigue guardada en algún sitio.",
            chips: ["Investigar", "Arreglar", "Verificar"] },
          { k: "04 · Escribe la nota", h: "La nota que el siguiente\ntécnico te agradecerá.",
            p: "Cierra el ticket con una nota de trabajo: causa, cambio, comprobación y seguimiento. Se puntúa, ves lo que faltaba y una nota de ejemplo, y cada puesto enlaza con su guía paso a paso. Tu progreso se guarda en tu cuenta y te sigue a cualquier equipo.",
            chips: ["Notas puntuadas", "Guías paso a paso", "Progreso en tu cuenta"] },
        ],
        endK: "05 · Empieza tu turno", endH: "¿Listo para tu primer turno?", endP: "Crea una cuenta gratis y coge tu primer ticket. Entra con email o con Google.",
        footBlurb: "Práctica real de soporte IT con tickets realistas, una consola simulada y notas de trabajo puntuadas.",
        colDesks: "Puestos", colGuides: "Guías", colProject: "Proyecto",
        guideLinks: [["Todas las guías", "guias.html"], ["Nivel 1: primeros pasos", "guias/nivel-1.html"], ["Nivel 2: base sólida", "guias/nivel-2.html"], ["Nivel 3: avanzado", "guias/nivel-3.html"]],
        projectLinks: [["Sobre mí", "about.html"], ["Blog", "blog/"], ["Contacto", "about.html#contacto"]],
        legal: "Simulación educativa con empresa y personas ficticias. No es acceso real a sistemas.",
        t1: ["La cuenta que se bloquea cada mañana", "P2"], t2: ["La cola de la impresora no se vacía", "P2"], t3: ["Rebotan los correos de clientes", "P1"],
        noteTitle: "Nota de trabajo", noteText: "Causa: tarea programada con una contraseña antigua en FS-SCAN01…", score: "100 puntos", resolved: "Resuelto", stagesDemo: ["Encontrar el origen de los bloqueos", "Quitar la causa y desbloquear", "Comprobar que sigue desbloqueada"],
      },
    },
  };

  /* ---------- storage (per-viewer convenience only; the page works without it) */
  function load(key, fallback) {
    try { const v = localStorage.getItem("sd." + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem("sd." + key, JSON.stringify(value)); } catch (e) { /* private mode: ignore */ }
  }

  let lang = load("lang", (navigator.language || "en").toLowerCase().startsWith("es") ? "es" : "en");
  // links from the guides on the website say which language to open in: ?lang=es or ?lang=en
  const asked = new URLSearchParams(location.search).get("lang");
  if (asked === "es" || asked === "en") { lang = asked; save("lang", lang); }
  let progress = load("progress", {});
  let user = null;      // signed-in technician {name, email, avatar, google, password}
  let afterLogin = null;  // the page someone asked for before signing in (a desk linked from a guide)
  const AVATARS = ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8"];
  const SITE = "https://inigogonzalezgarcia.github.io/";

  /* ---------- accounts (Pages Functions under /api; the page still works if they are not there) */
  async function api(path, method, body) {
    try {
      const r = await fetch(path, { method: method || "GET", credentials: "same-origin",
        headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
      let data = {};
      try { data = await r.json(); } catch (e) { data = { error: r.status === 404 ? "unavailable" : "server" }; }
      return { ok: r.ok, status: r.status, data };
    } catch (e) {
      return { ok: false, status: 0, data: { error: "network" } };
    }
  }
  // the best of the browser's and the account's results; anything better in the browser is sent to the account
  async function adopt(data) {
    user = data.user;
    const server = data.progress || {};
    const better = {};
    Object.entries(progress).forEach(([id, p]) => { if (!server[id] || p.points > server[id].points) better[id] = { points: p.points, stars: p.stars }; });
    const local = progress;
    progress = Object.assign({}, server);
    Object.keys(progress).forEach((id) => { if (local[id] && local[id].level && local[id].points === progress[id].points) progress[id].level = local[id].level; });
    if (Object.keys(better).length) {
      const r = await api("/api/progress", "PUT", { results: better });
      if (r.ok) progress = r.data.progress;
    }
    save("progress", progress);
  }
  function avatarImg(id, cls) {
    return el("img", { class: cls || "avatar", src: "assets/avatars/" + (AVATARS.includes(id) ? id : "a1") + ".svg", alt: "", width: "36", height: "36" });
  }

  function L() { return UI[lang]; }

  /* ---------- tiny DOM helper */
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    });
    kids.flat(Infinity).forEach((k) => { if (k != null && k !== false) n.append(typeof k === "string" ? document.createTextNode(k) : k); });
    return n;
  }
  function stars(n) {
    return el("span", { class: "stars", "aria-label": n + "/3" }, "★".repeat(n), el("span", { class: "off" }, "★".repeat(3 - n)));
  }

  /* ---------- chrome */
  function chrome() {
    document.documentElement.lang = lang;
    const b = document.getElementById("lang");
    b.textContent = L().langBtn;
    b.setAttribute("aria-label", L().langLabel);
    document.getElementById("nav-guides").textContent = L().guides;
    document.getElementById("foot-text").textContent = user ? L().footUser : L().footAnon;
    document.getElementById("foot-privacy").textContent = L().privacy;
    const who = document.getElementById("who");
    who.replaceChildren(user
      ? el("a", { class: "who", href: "#/account", title: L().account }, avatarImg(user.avatar, "avatar sm"), el("span", { text: user.name }))
      : el("a", { class: "who signin", href: "#/start", text: L().signIn }));
  }

  /* ---------- tickets in progress: when each one was assigned (this browser), and the live console of each one (this page) */
  let ticker = null;      // updates the SLA counters every second
  let queueTab = "open";
  const live = {};        // deskId -> {sess, log: [{text, kind}], hist: [], pos: 0, closed: false, result: null}
  function work() { return load("work", {}); }
  function setWork(id, value) {
    const w = work();
    if (value) w[id] = value; else delete w[id];
    save("work", w);
  }
  function liveOf(id, sc) {
    if (!live[id]) live[id] = { sess: E.createSession(sc, lang), log: [], hist: [], pos: 0, closed: false, result: null };
    return live[id];
  }
  function minutesOn(id) {
    const w = work()[id];
    return w ? Math.max(0, (Date.now() - w.startedAt) / 60000) : 0;
  }
  // {text, tone} for the SLA of a ticket; long: mm:ss for the ticket page
  function slaInfo(sc, long) {
    const limit = E.sla(sc);
    const w = work()[sc.id];
    if (!w) return { text: L().slaTarget(limit), tone: "" };
    const left = limit - minutesOn(sc.id);
    if (left < 0) return { text: L().slaOver(Math.ceil(-left)), tone: "bad" };
    const mmss = Math.floor(left) + ":" + String(Math.floor((left % 1) * 60)).padStart(2, "0");
    return { text: L().slaLeft(long ? mmss : Math.ceil(left) + " min"), tone: left < limit / 4 ? "warn" : "ok" };
  }
  function tick() {
    document.querySelectorAll("[data-sla]").forEach((n) => {
      const sc = SCENARIOS.find((s) => s.id === n.getAttribute("data-sla"));
      if (!sc) return;
      const info = slaInfo(sc, n.hasAttribute("data-long"));
      n.textContent = info.text;
      n.className = "sla " + info.tone;
    });
  }
  function isOpen(sc) { return !progress[sc.id] || Boolean(work()[sc.id]); }
  function statusOf(sc) { return work()[sc.id] ? "progress" : progress[sc.id] ? "closed" : "new"; }
  function pill(cls, text) { return el("span", { class: "pill " + cls, text }); }
  function prioPill(p) { return el("span", { class: "prio " + p, text: p }); }

  function refreshBadge() {
    const n = SCENARIOS.filter(isOpen).length;
    const item = document.getElementById("nav-tickets");
    if (!item) return;
    let badge = item.querySelector(".badge");
    if (!n) { if (badge) badge.remove(); return; }
    if (!badge) { badge = el("span", { class: "badge" }); item.append(badge); }
    badge.textContent = String(n);
  }

  /* ---------- the signed-in shell: sidebar + view */
  function shell(active) {
    const app = document.getElementById("app");
    app.replaceChildren();
    const open = SCENARIOS.filter(isOpen).length;
    const item = (href, icon, text, key, extra) => el("a", { href, class: "side-item" + (active === key ? " on" : ""), id: "nav-" + key,
      "aria-current": active === key ? "page" : null }, el("span", { class: "side-ico", "aria-hidden": "true", text: icon }), el("span", { text }), extra || null);
    const nav = el("nav", { class: "side", "aria-label": L().navLabel },
      el("p", { class: "side-h", text: L().deskName }),
      item("#/", "▤", L().navTickets, "tickets", open ? el("span", { class: "badge", text: String(open) }) : null),
      item("#/directory", "◫", L().navDirectory, "directory"),
      item("#/inventory", "▦", L().navInventory, "inventory"),
      item("#/progress", "★", L().navProgress, "progress"),
      el("a", { class: "side-item", href: SITE + "guias.html", target: "_blank", rel: "noopener noreferrer" },
        el("span", { class: "side-ico", "aria-hidden": "true", text: "↗" }), el("span", { text: L().navGuides })),
      item("#/account", "●", L().navAccount, "account"),
      el("button", { type: "button", class: "side-item side-tour", id: "nav-tour", onclick: () => { if (location.hash !== "#/" && location.hash !== "") { location.hash = "#/"; setTimeout(() => tour(0), 50); } else tour(0); } },
        el("span", { class: "side-ico", "aria-hidden": "true", text: "?" }), el("span", { text: L().navTour })));
    const view = el("section", { class: "view" });
    app.append(el("div", { class: "shell" }, nav, view));
    return view;
  }

  /* ---------- ticket queue */
  function queue() {
    const view = shell("tickets");
    document.title = L().qTitle + " · SysAdmin Desks";
    const w = work();
    const open = SCENARIOS.filter(isOpen).sort((a, b) => (w[b.id] ? 1 : 0) - (w[a.id] ? 1 : 0) || a.ticket.priority.localeCompare(b.ticket.priority));
    const closed = SCENARIOS.filter((s) => progress[s.id] && !w[s.id]);
    const tabs = el("div", { class: "qtabs", role: "tablist" }, [["open", L().tabOpen, open.length], ["closed", L().tabClosed, closed.length]].map(([k, text, n]) =>
      el("button", { type: "button", role: "tab", class: "qtab" + (queueTab === k ? " on" : ""), "aria-selected": queueTab === k ? "true" : "false",
        onclick: () => { queueTab = k; queue(); } }, text + " ", el("span", { class: "count", text: String(n) }))));
    const th = (text, id) => el("th", { scope: "col", id: id || null, text });
    let table;
    if (queueTab === "open") {
      table = open.length ? el("table", { class: "qtable", id: "tour-queue" },
        el("thead", {}, el("tr", {}, th(L().colTicket), th(L().colSubject), th(L().colRequester), th(L().colPriority), th("SLA", "tour-sla"), th(L().colStatus), th(L().colAssignee))),
        el("tbody", {}, open.map((sc, i) => {
          const st = statusOf(sc);
          const sla = slaInfo(sc, false);
          return el("tr", { id: i === 0 ? "tour-row" : null, class: st === "progress" ? "active" : "" },
            el("td", { class: "mono", "data-label": L().colTicket, text: sc.ticket.id }),
            el("td", { class: "subj", "data-label": L().colSubject }, el("a", { href: "#/desk/" + sc.id, text: t(sc.title, lang) }),
              el("span", { class: "sub" }, `${t(sc.topic, lang)} · ${L().level} ${sc.level}`)),
            el("td", { "data-label": L().colRequester, text: t(sc.requester.name, lang) }),
            el("td", { "data-label": L().colPriority }, prioPill(sc.ticket.priority)),
            el("td", { "data-label": "SLA" }, el("span", { class: "sla " + sla.tone, "data-sla": sc.id, text: sla.text })),
            el("td", { "data-label": L().colStatus }, pill(st, L().status[st])),
            el("td", { "data-label": L().colAssignee }, w[sc.id] && user ? el("span", { class: "assignee" }, avatarImg(user.avatar, "avatar sm"), el("span", { text: user.name }))
              : el("span", { class: "muted", text: L().unassigned })));
        }))) : el("p", { class: "empty", text: L().emptyOpen });
    } else {
      table = closed.length ? el("table", { class: "qtable" },
        el("thead", {}, el("tr", {}, th(L().colTicket), th(L().colSubject), th(L().colResult), th(L().colPoints), th(L().colDate), th(""))),
        el("tbody", {}, closed.map((sc) => {
          const p = progress[sc.id];
          const lvl = p.level || (p.stars === 3 ? "resolved" : "observations");
          return el("tr", {},
            el("td", { class: "mono", "data-label": L().colTicket, text: sc.ticket.id }),
            el("td", { class: "subj", "data-label": L().colSubject }, el("span", { class: "strong", text: t(sc.title, lang) }), el("span", { class: "sub", text: t(sc.topic, lang) })),
            el("td", { "data-label": L().colResult }, pill(lvl, L().lvl[lvl])),
            el("td", { "data-label": L().colPoints }, stars(p.stars), " ", el("span", { text: String(p.points) })),
            el("td", { "data-label": L().colDate, text: p.date || "" }),
            el("td", {}, el("a", { class: "btn ghost sm", href: "#/desk/" + sc.id, text: L().replay, onclick: () => { delete live[sc.id]; } })));
        }))) : el("p", { class: "empty", text: L().emptyClosed });
    }
    view.append(
      el("header", { class: "view-head" }, el("div", {}, el("h1", { text: L().qTitle }), el("p", { class: "sub", text: user ? L().hello(user.name) : "" })),
        el("p", { class: "shift" }, el("span", { class: "dot", "aria-hidden": "true" }), L().shift)),
      tabs, el("div", { class: "qwrap" }, table));
    if (!load("tourDone", false) && queueTab === "open") setTimeout(() => { if (document.getElementById("tour-queue") && !document.querySelector(".tour")) tour(0); }, 400);
  }

  /* ---------- ticket page */
  function desk(id) {
    const sc = SCENARIOS.find((s) => s.id === id);
    const view = shell("tickets");
    if (!sc) { view.append(el("p", { text: L().notFound }), el("a", { class: "btn", href: "#/", text: L().home })); return; }
    const lv = liveOf(id, sc);
    const sess = lv.sess;
    sess.lang = lang;   // the narration and the cards follow the language switch
    document.title = sc.ticket.id + " · " + t(sc.title, lang) + " · SysAdmin Desks";
    const assigned = () => Boolean(work()[id]);

    const out = el("div", { class: "out", "aria-live": "polite" });
    const input = el("input", { type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", "aria-label": L().console });
    const form = el("form", { onsubmit: (ev) => { ev.preventDefault(); exec(input.value); input.value = ""; } }, el("span", { class: "ps", text: E.prompt(sess) }), input);
    const term = el("div", { class: "term", onclick: () => { if (!window.getSelection().toString()) input.focus(); } }, out, form);
    const pc = el("div", { class: "pc", hidden: true });
    const termBox = el("div", { class: "term-box" }, term, pc);
    const hasDesk = Boolean(sc.desktop);
    const tabsBox = el("div", { class: "desk-tabs", role: "tablist" });
    function setView(v) {
      lv.view = v;
      term.hidden = v !== "console";
      pc.hidden = v !== "desk";
      renderTabs();
      if (v === "desk") renderDesk(); else if (assigned() && !lv.closed) input.focus();
    }
    function renderTabs() {
      if (!hasDesk) return;
      const tab = (k, text) => el("button", { type: "button", role: "tab", class: "qtab" + ((lv.view || "console") === k ? " on" : ""), "aria-selected": (lv.view || "console") === k ? "true" : "false",
        onclick: () => setView(k) }, text);
      tabsBox.replaceChildren(el("div", { class: "qtabs" }, tab("console", ">_ " + L().tabConsole), tab("desk", "▣ " + L().tabDesk(sc.machine.host))));
    }
    function deskSay(appId, r) {
      lv.deskMsg = { app: appId, lines: r.lines.filter((l) => ["say", "err", "ok", "event"].includes(l.kind)) };
    }
    function openApp(id) {
      if (!assigned() || lv.closed) return;
      lv.app = id;
      lv.deskMsg = null;
      const r = id === "log" ? null : E.deskOpen(sess, id);
      if (r) {
        const app = E.desktop(sess).apps.find((a) => a.id === id);
        print(`${L().deskRan} ${app.title} → ${r.command}`, "dim");
        after(r);
      } else renderDesk();
    }
    function deskAction(appId, x) {
      const r = E.deskAct(sess, appId, x.id);
      if (!r) return;
      print(`${L().deskRan} ${x.label} → ${r.command}`, "dim");
      deskSay(appId, r);
      after(r);
    }
    function renderDesk() {
      if (!hasDesk || pc.hidden) return;
      const d = E.desktop(sess);
      const app = lv.app === "log" ? "log" : d.apps.find((a) => a.id === lv.app) || null;
      const icon = (glyph, title, on, fn) => el("button", { type: "button", class: "pc-icon" + (on ? " on" : ""), onclick: fn },
        el("span", { class: "pc-glyph", "aria-hidden": "true", text: glyph }), el("span", { text: title }));
      const icons = el("div", { class: "pc-icons" }, d.apps.map((a) => icon(a.icon, a.title, app === a, () => openApp(a.id))),
        icon("≡", L().evTitle, app === "log", () => openApp("log")), icon(">_", L().terminal, false, () => setView("console")));
      let win = null;
      if (app) {
        const title = app === "log" ? L().evTitle : app.title;
        let body;
        if (app === "log") {
          body = d.log.length ? el("ul", { class: "ev" }, d.log.map((e) => el("li", { class: "ev-" + e.level },
            el("p", { class: "ev-head" }, el("span", { class: "ev-lvl", text: L().lvlNames[e.level] }), el("span", { text: e.time }),
              el("span", { text: L().evSource + ": " + e.source }), el("span", { text: L().evId + ": " + e.id })), el("p", { text: e.text }))))
            : el("p", { class: "sub", text: d.logNote });
          if (d.log.length && d.logNote) body = el("div", {}, body, el("p", { class: "sub", text: d.logNote }));
        } else {
          const acts = app.actions.filter((x) => x.enabled);
          const msg = lv.deskMsg && lv.deskMsg.app === app.id && lv.deskMsg.lines.length ? el("div", { class: "pc-msg" }, lv.deskMsg.lines.map((l) => el("p", { class: "line " + l.kind, text: l.text }))) : null;
          body = el("div", {},
            app.page ? el("div", { class: "pc-page" }, el("div", { class: "pc-url", text: app.page.url }),
              el("div", { class: "pc-site " + app.page.tone }, el("h3", { text: app.page.title }), el("p", { text: app.page.text }))) : null,
            app.fields.length ? fieldsDl(app.fields) : null,
            acts.length && !lv.closed ? el("div", { class: "acts" }, acts.map((x) => el("button", { type: "button", class: "btn ghost sm", text: x.label, onclick: () => deskAction(app.id, x) }))) : null,
            msg,
            app.look ? el("p", { class: "pc-eq" }, el("span", { text: L().equivalent + " " }), el("code", { text: app.look })) : null);
        }
        win = el("div", { class: "pc-win", role: "dialog", "aria-label": title },
          el("div", { class: "pc-title" }, el("span", { text: title }), el("button", { type: "button", class: "pc-x", "aria-label": L().accCancel, text: "×", onclick: () => { lv.app = null; renderDesk(); } })),
          el("div", { class: "pc-body" }, body));
      }
      pc.replaceChildren(el("div", { class: "pc-screen" }, icons, win),
        el("div", { class: "pc-bar" }, el("span", { class: "pc-brand", text: ">_ " + d.host }), app ? el("span", { class: "pc-task", text: app === "log" ? L().evTitle : app.title }) : null,
          el("span", { class: "grow" }), el("span", { text: sc.machine.domain + "\\" + sc.machine.user }), el("span", { class: "pc-clock", text: "09:41" })));
    }
    const stagesList = el("ul", { class: "stages" });
    const assetBox = el("div");
    const headBox = el("div", { class: "tbar" });
    const resolveBox = el("div");
    const resultBox = el("div");

    function print(text, kind, keep) {
      out.append(el("div", { class: "line " + (kind || "out"), text }));
      if (keep !== false) lv.log.push({ text, kind });
    }
    function renderStages() {
      stagesList.replaceChildren(...E.stages(sess).map((s) =>
        el("li", { class: s.done ? "done" : "" }, el("span", { class: "box", "aria-hidden": "true", text: s.done ? "✓" : "" }), el("span", { text: t(s.label, lang) }))));
    }
    function renderAsset() {
      const c = E.cards(sess);
      const actions = c.actions.filter((a) => a.enabled);
      assetBox.replaceChildren(el("section", { class: "panel asset" }, el("h2", { text: c.asset.title }),
        el("dl", { class: "fields" }, c.asset.fields.map((f) => [el("dt", { text: f.label }),
          el("dd", { class: f.tone ? "tone " + f.tone : "" }, f.tone ? el("span", { class: "tdot", "aria-hidden": "true" }) : null, el("span", { text: f.value }))])),
        actions.length && assigned() && !lv.closed ? el("div", { class: "acts" }, el("p", { class: "acts-h", text: L().actionsT }),
          actions.map((a) => el("button", { type: "button", class: "btn ghost sm", text: a.label, onclick: () => gui(a.id, a.label) }))) : null));
    }
    function renderHead() {
      const st = lv.closed ? "closed" : statusOf(sc) === "progress" ? "progress" : "new";
      const sla = slaInfo(sc, true);
      headBox.replaceChildren(...[
        el("span", { class: "mono strong", text: sc.ticket.id }), prioPill(sc.ticket.priority), pill(st, L().status[st]),
        lv.closed ? null : el("span", { class: "sla-wrap" }, el("span", { class: "muted", text: "SLA " }),
          el("span", { class: "sla " + sla.tone, "data-sla": sc.id, "data-long": "", text: sla.text })),
        el("span", { class: "grow" }),
        assigned() || lv.closed ? el("span", { class: "assignee" }, el("span", { class: "muted", text: L().assignedTo + " " }), avatarImg(user.avatar, "avatar sm"), el("span", { text: user.name }))
          : el("button", { type: "button", class: "btn", id: "assign", text: L().assign, onclick: assign })].filter(Boolean));
    }
    function lockConsole() {
      termBox.querySelectorAll(".term-lock").forEach((n) => n.remove());
      input.disabled = !assigned() || lv.closed;
      if (!assigned() && !lv.closed) {
        termBox.append(el("div", { class: "term-lock" }, el("p", { class: "strong", text: L().lockedTitle }),
          el("p", { text: L().lockedText(E.sla(sc), sc.ticket.priority) }), el("button", { type: "button", class: "btn", text: L().assign, onclick: assign })));
      }
    }
    function assign() {
      if (!assigned()) setWork(id, { startedAt: Date.now() });
      renderHead(); renderAsset(); lockConsole(); renderResolve(); tick();
      input.focus();
    }
    function after(r) {
      if (r.clear) { out.replaceChildren(); lv.log = []; }
      if (r.ticket) ticketLines();
      r.lines.forEach((l) => print(l.text, l.kind));
      renderStages(); renderAsset(); renderDesk();
      if (r.resolvedNow) { print(L().readyMsg, "ok"); const ta = resolveBox.querySelector("textarea"); if (ta) ta.scrollIntoView({ behavior: "smooth", block: "center" }); }
      term.scrollTop = term.scrollHeight;
    }
    function ticketLines() {
      print(`[${sc.ticket.id}] ${sc.ticket.priority} · ${sc.ticket.from}`, "dim");
      print(t(sc.ticket.subject, lang), "say");
      print(t(sc.ticket.body, lang), "dim");
    }
    function exec(cmd) {
      if (!cmd.trim() || !assigned() || lv.closed) return;
      lv.hist.push(cmd); lv.pos = lv.hist.length;
      print(E.prompt(sess) + cmd, "cmd");
      after(E.run(sess, cmd));
    }
    function gui(actionId, label) {
      const r = E.act(sess, actionId);
      if (!r) return;
      print(`${L().guiRan} ${label} → ${r.command}`, "dim");
      after(r);
    }
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowUp" && lv.pos > 0) { lv.pos -= 1; input.value = lv.hist[lv.pos]; ev.preventDefault(); }
      else if (ev.key === "ArrowDown") { lv.pos = Math.min(lv.hist.length, lv.pos + 1); input.value = lv.hist[lv.pos] || ""; ev.preventDefault(); }
    });

    function renderResolve() {
      if (!assigned() || lv.closed) { resolveBox.replaceChildren(); return; }
      const code = el("select", { "aria-label": L().resCode },
        el("option", { value: "", text: L().resPick }), E.CODES.map((c) => el("option", { value: c.id, text: t(c.label, lang) })));
      const ta = el("textarea", { "aria-label": L().resNote, maxlength: "2000", placeholder: L().resPlaceholder });
      if (lv.draft) { ta.value = lv.draft.note; code.value = lv.draft.code; }
      const keep = () => { lv.draft = { note: ta.value, code: code.value }; };
      ta.addEventListener("input", keep); code.addEventListener("change", keep);
      const msg = el("p", { class: "form-msg", role: "alert" });
      resolveBox.replaceChildren(el("section", { class: "panel note" }, el("h2", { text: L().resTitle }), el("p", { text: L().resText }),
        el("label", { class: "field" }, el("span", { class: "field-label", text: L().resCode }), code),
        el("label", { class: "field" }, el("span", { class: "field-label", text: L().resNote }), ta), msg,
        el("div", { class: "row" }, el("button", { type: "button", class: "btn", text: L().resolveBtn, onclick: () => {
          if (!code.value) { msg.textContent = L().needCode; code.focus(); return; }
          if (ta.value.trim().length < 10) { msg.textContent = L().noteEmpty; ta.focus(); return; }
          close(code.value, ta.value);
        } }))));
    }

    function close(codeId, text) {
      const note = E.checkNote(sc, text, lang);
      const minutes = minutesOn(id);
      const v = E.verdict(sess, note, { code: codeId, minutes });
      lv.result = { v, note, minutes, code: codeId };
      if (v.level !== "unresolved") {
        lv.closed = true;
        const prev = progress[sc.id];
        if (!prev || v.points >= prev.points) {
          progress[sc.id] = { points: v.points, stars: v.stars, date: new Date().toISOString().slice(0, 10), level: v.level };
          save("progress", progress);
        }
        api("/api/progress", "PUT", { results: { [sc.id]: { points: v.points, stars: v.stars } } });
        setWork(id, null);
        lv.draft = null;
        refreshBadge();
      }
      renderHead(); renderAsset(); lockConsole(); renderResolve(); showResult();
      resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function showResult() {
      if (!lv.result) { resultBox.replaceChildren(); return; }
      const { v, note, minutes, code } = lv.result;
      const nextSc = SCENARIOS.find((s) => s.id !== sc.id && isOpen(s));
      const list = (title, items, cls) => items.length ? el("div", {}, el("b", { text: title }), el("ul", { class: cls }, items.map((x) => el("li", { text: x })))) : null;
      if (v.level === "unresolved") {
        resultBox.replaceChildren(el("section", { class: "panel result lvl-unresolved" },
          el("p", { class: "lvl" }, pill("unresolved", L().lvl.unresolved)), el("h3", { text: L().unresolvedTitle }), el("p", { text: L().unresolvedText }),
          list(L().whyT, v.reasons, "missing"),
          el("details", {}, el("summary", { text: L().solution }), el("div", { class: "solution", text: sc.solution.join("\n") })),
          el("div", { class: "row" }, el("button", { type: "button", class: "btn", text: L().keepWorking, onclick: () => {
            lv.result = null; showResult(); input.focus(); term.scrollIntoView({ behavior: "smooth", block: "start" });
          } }), el("a", { class: "btn ghost", href: sc.guide, target: "_blank", rel: "noopener noreferrer", text: L().guide }))));
        return;
      }
      resultBox.replaceChildren(el("section", { class: "panel result lvl-" + v.level },
        el("p", { class: "lvl" }, pill(v.level, L().lvl[v.level])),
        el("div", { class: "big-stars" }, "★".repeat(v.stars), el("span", { class: "off", text: "★".repeat(3 - v.stars) })),
        el("h3", { text: `${v.points} ${L().points}` }),
        el("p", { class: "facts" }, el("span", { text: L().timeUsed(Math.ceil(minutes), E.sla(sc)) }), el("span", { text: L().codeUsed(E.codeLabel(code, lang)) }),
          el("span", { text: L().hintsUsed(sess.hints) })),
        list(L().obsT, v.reasons, "missing"),
        list(L().found, note.found, "found"),
        el("details", {}, el("summary", { text: L().sample }), el("blockquote", { text: t(sc.sampleNote, lang) })),
        el("details", {}, el("summary", { text: L().solution }), el("div", { class: "solution", text: sc.solution.join("\n") })),
        el("div", { class: "row" }, nextSc ? el("a", { class: "btn", href: "#/desk/" + nextSc.id, text: L().next }) : null,
          el("a", { class: "btn ghost", href: "#/", text: L().queueBtn }),
          el("a", { class: "btn ghost", href: sc.guide, target: "_blank", rel: "noopener noreferrer", text: L().guide }))));
    }

    const c = E.cards(sess);
    const r = c.requester;
    view.append(
      el("div", { class: "desk-bar" }, el("a", { href: "#/", text: L().back }), el("h1", { text: t(sc.title, lang) })),
      headBox,
      el("div", { class: "desk" },
        el("aside", {},
          el("section", { class: "panel" }, el("h2", { text: L().ticket }),
            el("p", { class: "ticket-subject", text: t(sc.ticket.subject, lang) }), el("p", { class: "ticket-body", text: t(sc.ticket.body, lang) })),
          el("section", { class: "panel" }, el("h2", { text: L().requester }),
            el("p", { class: "req-name" }, el("span", { class: "initials", "aria-hidden": "true", text: r.name.split(" ").map((x) => x[0]).join("").slice(0, 2) }),
              el("span", {}, el("b", { text: r.name }), el("span", { class: "sub", text: r.team }))),
            el("dl", { class: "fields" }, el("dt", { text: L().fUser }), el("dd", { class: "mono", text: r.user }),
              el("dt", { text: L().fLocation }), el("dd", { text: r.location }), el("dt", { text: L().fDevice }), el("dd", { class: "mono", text: r.device }))),
          assetBox,
          el("section", { class: "panel" }, el("h2", { text: L().context }), el("p", { class: "intro", text: t(sc.intro, lang) })),
          el("section", { class: "panel" }, el("h2", { text: L().stages }), stagesList),
          el("section", { class: "panel tools" },
            el("button", { type: "button", class: "btn ghost", text: L().hint, onclick: () => { if (assigned() && !lv.closed) { exec("hint"); input.focus(); } } }),
            el("button", { type: "button", class: "btn ghost", text: L().restart, onclick: () => { delete live[id]; desk(id); } }),
            el("a", { class: "btn ghost", href: sc.guide, target: "_blank", rel: "noopener noreferrer", text: L().guide }))),
        el("div", {}, tabsBox, termBox, el("p", { class: "term-help", text: L().termHelp }), resolveBox, resultBox)));

    if (!lv.log.length) {
      print(L().welcome.replace("{host}", sc.machine.host).replace("{user}", sc.machine.domain + "\\" + sc.machine.user), "dim");
      print("", "out");
    } else lv.log.forEach((l) => print(l.text, l.kind, false));
    renderHead(); renderStages(); renderAsset(); lockConsole(); renderResolve(); showResult();
    if (hasDesk) setView(lv.view || "console");
    term.scrollTop = term.scrollHeight;
    if (assigned() && !lv.closed) input.focus();
  }

  /* ---------- progress */
  function progressPage() {
    const view = shell("progress");
    document.title = L().pTitle + " · SysAdmin Desks";
    const done = SCENARIOS.filter((s) => progress[s.id]);
    const starsSum = done.reduce((a, s) => a + progress[s.id].stars, 0);
    const pointsSum = done.reduce((a, s) => a + progress[s.id].points, 0);
    const tile = (n, label) => el("div", { class: "tile" }, el("p", { class: "tile-n", text: n }), el("p", { class: "tile-l", text: label }));
    view.append(
      el("header", { class: "view-head" }, el("div", {}, el("h1", { text: L().pTitle }), el("p", { class: "sub", text: L().pSub }))),
      el("div", { class: "tiles" }, tile(`${done.length}/${SCENARIOS.length}`, L().tClosed), tile(`${starsSum}/${SCENARIOS.length * 3}`, L().tStars),
        tile(String(pointsSum), L().tPoints), tile(done.length ? String(Math.round(pointsSum / done.length)) : "–", L().tAvg)),
      el("div", { class: "qwrap" }, el("table", { class: "qtable" },
        el("thead", {}, el("tr", {}, ["", L().colSubject, L().colTopic, L().colBest, L().colDate, ""].map((x) => el("th", { scope: "col", text: x })))),
        el("tbody", {}, SCENARIOS.map((sc) => {
          const p = progress[sc.id];
          return el("tr", {},
            el("td", { class: "mono", "data-label": L().colTicket, text: sc.ticket.id }),
            el("td", { class: "subj", "data-label": L().colSubject }, el("a", { href: "#/desk/" + sc.id, text: t(sc.title, lang) })),
            el("td", { "data-label": L().colTopic, text: t(sc.topic, lang) }),
            el("td", { "data-label": L().colBest }, p ? [stars(p.stars), " ", el("span", { text: String(p.points) })] : el("span", { class: "muted", text: L().notYet })),
            el("td", { "data-label": L().colDate, text: p ? p.date || "" : "" }),
            el("td", {}, el("a", { class: "link", href: sc.guide, target: "_blank", rel: "noopener noreferrer", text: L().guide })));
        })))));
  }

  /* ---------- v0.3: the shared world (directory and inventory) and what the open tickets say about it */
  const Wd = window.SDWorld;
  let world = Wd.restore(load("world", null));
  let dirOu = "users";       // selected OU id (null = the whole domain)
  let dirSel = null;         // {type: "user"|"group"|"computer", id}
  let dirQuery = "";
  let dirLog = [];           // the directory console, kept while the page is open
  const dirHist = [];
  let dirPos = 0;
  let invFilter = "all";
  let invSel = null;

  // [{kind, id, set, note, sc, sess, live}] for every open ticket that touches the directory or the inventory
  function bindings() {
    const out = [];
    SCENARIOS.forEach((sc) => {
      if (!sc.bind || !isOpen(sc)) return;
      const working = Boolean(work()[sc.id]);
      const lv = working ? liveOf(sc.id, sc) : null;
      const sess = lv ? lv.sess : E.createSession(sc, lang);
      sess.lang = lang;
      E.bound(sess).forEach((b) => out.push(Object.assign(b, { sc, sess, live: working && !lv.closed })));
    });
    return out;
  }
  // replaceChildren with arrays and empty slots (like el() accepts)
  function put(node, ...kids) { node.replaceChildren(...kids.flat(Infinity).filter((k) => k != null && k !== false)); }
  function syncOverlay() {
    world.overlay = {};
    bindings().filter((b) => b.kind === "user").forEach((b) => { world.overlay[b.id] = b.set; });
  }
  function saveWorld() { save("world", Wd.snapshot(world)); }
  const ticketPill = (sc) => { const st = statusOf(sc); return el("a", { class: "tkt", href: "#/desk/" + sc.id }, el("span", { class: "mono", text: sc.ticket.id }), pill(st, L().status[st])); };
  function fieldsDl(fields) {
    return el("dl", { class: "fields" }, fields.map((f) => [el("dt", { text: f.label }),
      el("dd", { class: f.tone ? "tone " + f.tone : "" }, f.tone ? el("span", { class: "tdot", "aria-hidden": "true" }) : null, el("span", { text: f.value }))]));
  }

  // a directory command for a user that belongs to an open ticket goes to that ticket, so both always agree
  const MUTATING = /^(unlock-adaccount|set-adaccountpassword|enable-adaccount|disable-adaccount|set-aduser)$/;
  function dirRoute(cmd, p) {
    const sam = String(p.id || "").toLowerCase();
    const b = bindings().find((x) => x.kind === "user" && x.id === sam);
    if (!b) return null;
    if (b.live) {
      if (!E.matches(b.sess, cmd)) return null;
      const r = E.run(b.sess, cmd);
      const lv = live[b.sc.id];
      lv.log.push({ text: E.prompt(b.sess) + cmd, kind: "cmd" });
      r.lines.forEach((l) => lv.log.push({ text: l.text, kind: l.kind }));
      if (r.resolvedNow) lv.log.push({ text: L().readyMsg, kind: "ok" });
      r.lines.push({ text: L().dRouted(b.sc.ticket.id), kind: "dim" });
      return { lines: r.lines, changed: false };
    }
    if (MUTATING.test(p.verb)) return { lines: [{ text: L().dAssignFirst(Wd.user(world, sam).name, b.sc.ticket.id), kind: "say" }], changed: false };
    return null;
  }

  /* ---------- directory */
  function directory() {
    const view = shell("directory");
    document.title = L().dTitle + " · SysAdmin Desks";
    syncOverlay();
    const out = el("div", { class: "out", "aria-live": "polite" });
    const input = el("input", { type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", "aria-label": L().dConsole });
    const ps = "PS C:\\Users\\it.admin> ";
    const term = el("div", { class: "term dir-term", onclick: () => { if (!window.getSelection().toString()) input.focus(); } }, out,
      el("form", { onsubmit: (ev) => { ev.preventDefault(); exec(input.value); input.value = ""; } }, el("span", { class: "ps", text: ps }), input));
    const tasksBox = el("section", { class: "panel dir-tasks" });
    const treeBox = el("nav", { class: "panel dir-tree", "aria-label": L().dTree });
    const listBox = el("section", { class: "panel dir-list" });
    const detailBox = el("section", { class: "panel dir-detail" });

    function print(text, kind, keep) {
      out.append(el("div", { class: "line " + (kind || "out"), text }));
      if (keep !== false) dirLog.push({ text, kind });
      if (dirLog.length > 400) dirLog = dirLog.slice(-300);
    }
    function exec(cmd, quiet) {
      cmd = String(cmd || "").trim();
      if (!cmd) return;
      if (!quiet) { dirHist.push(cmd); dirPos = dirHist.length; }
      print(ps + cmd, "cmd");
      syncOverlay();
      const r = Wd.run(world, cmd, lang, dirRoute);
      if (r.clear) { out.replaceChildren(); dirLog = []; }
      r.lines.forEach((l) => print(l.text, l.kind));
      if (r.changed) saveWorld();
      syncOverlay();
      renderAll();
      term.scrollTop = term.scrollHeight;
    }
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowUp" && dirPos > 0) { dirPos -= 1; input.value = dirHist[dirPos]; ev.preventDefault(); }
      else if (ev.key === "ArrowDown") { dirPos = Math.min(dirHist.length, dirPos + 1); input.value = dirHist[dirPos] || ""; ev.preventDefault(); }
    });

    function renderTasks() {
      const list = Wd.tasks(world, lang);
      const done = list.filter((x) => x.done).length;
      tasksBox.replaceChildren(el("div", { class: "row" }, el("h2", { text: L().dTasks }), el("span", { class: "count-pill", text: `${done}/${list.length}` }), el("span", { class: "grow" }),
        el("button", { type: "button", class: "link-btn", text: L().dResetAll, onclick: () => { world = Wd.restore(null); saveWorld(); print(L().dResetDone, "say"); renderAll(); } })),
        el("p", { class: "sub", text: L().dTasksSub }),
        el("ul", { class: "stages" }, list.map((x) => el("li", { class: x.done ? "done" : "" }, el("span", { class: "box", "aria-hidden": "true", text: x.done ? "✓" : "" }), el("span", { text: x.label })))));
    }
    function renderTree() {
      const item = (id, name, depth) => el("button", { type: "button", class: "ou" + (dirOu === id ? " on" : "") + " d" + depth, onclick: () => { dirOu = id; renderAll(); } },
        el("span", { class: "ou-ico", "aria-hidden": "true", text: id ? "▸" : "◆" }), el("span", { text: name }));
      const rows = [item(null, "contoso.local", 0)];
      const walk = (parent, depth) => Wd.OUS.filter((o) => o.parent === parent).forEach((o) => { rows.push(item(o.id, o.name, depth)); walk(o.id, depth + 1); });
      walk(null, 1);
      put(treeBox, el("h2", { text: L().dTree }), rows);
    }
    function objects() {
      const ous = dirOu ? Wd.under(dirOu) : null;
      const q = E.fold(dirQuery.trim());
      const inOu = (ou) => !ous || ous.includes(ou);
      const hit = (...xs) => !q || xs.some((x) => E.fold(x).includes(q));
      return {
        users: world.users.filter((u) => inOu(u.ou) && hit(u.name, u.sam)).map((u) => Wd.view(world, u.sam)),
        groups: Wd.GROUPS.filter((g) => inOu(g.ou) && hit(g.name)),
        computers: Wd.allComputers().filter((c) => inOu(c.ou) && hit(c.name)),
      };
    }
    function renderList() {
      const o = objects();
      const sel = (type, id) => dirSel && dirSel.type === type && dirSel.id === id;
      const row = (type, id, icon, name, sub, badges) => el("button", { type: "button", class: "obj" + (sel(type, id) ? " on" : ""), onclick: () => { dirSel = { type, id }; renderAll(); } },
        el("span", { class: "obj-ico", "aria-hidden": "true", text: icon }), el("span", { class: "obj-txt" }, el("b", { text: name }), el("span", { class: "sub", text: sub })), badges || null);
      const search = el("input", { type: "search", class: "dir-search", placeholder: L().dSearch, "aria-label": L().dSearch, value: dirQuery });
      search.addEventListener("input", () => { dirQuery = search.value; renderList(); const s = listBox.querySelector(".dir-search"); s.focus(); s.setSelectionRange(s.value.length, s.value.length); });
      const total = o.users.length + o.groups.length + o.computers.length;
      put(listBox, search, el("p", { class: "sub", text: L().dObjects(total) }),
        o.users.length ? el("div", { class: "obj-group" }, el("h3", { text: L().dUsers }), o.users.map((u) => row("user", u.sam, "●", u.name, u.sam + " · " + Wd.t(u.title, lang),
          [!u.enabled ? pill("unresolved", L().dDisabled) : null, u.locked ? pill("unresolved", L().dLocked) : null]))) : null,
        o.groups.length ? el("div", { class: "obj-group" }, el("h3", { text: L().dGroups }), o.groups.map((g) => row("group", g.name, "◇", g.name, Wd.t(g.desc, lang)))) : null,
        o.computers.length ? el("div", { class: "obj-group" }, el("h3", { text: L().dComputers }), o.computers.map((c) => row("computer", c.name, "▭", c.name, c.os))) : null,
        total ? null : el("p", { class: "empty", text: L().dNone }));
    }
    function renderDetail() {
      if (!dirSel) { put(detailBox, el("p", { class: "empty", text: L().dPick })); return; }
      if (dirSel.type === "user") return userDetail(Wd.view(world, dirSel.id));
      if (dirSel.type === "group") return groupDetail(Wd.group(dirSel.id));
      return computerDetail(Wd.computer(dirSel.id));
    }
    function userDetail(u) {
      const b = bindings().find((x) => x.kind === "user" && x.id === u.sam);
      const groupsNotIn = Wd.GROUPS.filter((g) => !u.groups.includes(g.name));
      const pick = el("select", { "aria-label": L().dAddGroup }, el("option", { value: "", text: L().dChoose }), groupsNotIn.map((g) => el("option", { value: g.name, text: g.name })));
      const resetBox = el("div");
      const must = el("input", { type: "checkbox", checked: true });
      const unl = el("input", { type: "checkbox", checked: u.locked });
      function resetForm() {
        resetBox.replaceChildren(el("div", { class: "reset-form" }, el("b", { text: L().dResetTitle }), el("p", { class: "sub", text: L().dResetText }),
          el("label", { class: "check" }, must, el("span", { text: L().dResetMust })),
          u.locked ? el("label", { class: "check" }, unl, el("span", { text: L().dResetUnlock })) : null,
          el("div", { class: "row" }, el("button", { type: "button", class: "btn sm", text: L().dResetOk, onclick: () => {
            exec(Wd.CMD.reset(u.sam), true);
            exec(Wd.CMD.mustChange(u.sam, must.checked), true);
            if (u.locked && unl.checked) exec(Wd.CMD.unlock(u.sam), true);
          } }), el("button", { type: "button", class: "btn ghost sm", text: L().dCancel, onclick: () => resetBox.replaceChildren() }))));
      }
      put(detailBox, 
        el("div", { class: "req-name" }, el("span", { class: "initials", "aria-hidden": "true", text: u.name.split(" ").map((x) => x[0]).join("").slice(0, 2) }),
          el("span", {}, el("b", { text: u.name }), el("span", { class: "sub", text: u.sam + "@contoso.com" }))),
        el("p", { class: "pills" }, pill(u.enabled ? "resolved" : "unresolved", u.enabled ? L().dEnabled : L().dDisabled), u.locked ? pill("unresolved", L().dLocked) : null,
          u.mustChange ? pill("progress", L().dMustChangeShort) : null),
        b ? el("p", { class: "dir-ticket" }, el("span", { text: L().dTicket + " " }), ticketPill(b.sc)) : null,
        fieldsDl([{ label: L().dTitleF, value: Wd.t(u.title, lang) }, { label: L().dDept, value: u.dept }, { label: L().dPwdSet, value: u.pwdLastSet },
          { label: L().dMustChange, value: u.mustChange ? L().yes : L().no }, { label: L().dLastLogon, value: u.lastLogon }, { label: L().dDevice, value: u.device },
          { label: "DN", value: Wd.userDn(u) }]),
        el("div", { class: "acts" }, el("p", { class: "acts-h", text: L().actionsT }),
          u.locked ? el("button", { type: "button", class: "btn sm", text: L().dUnlock, onclick: () => exec(Wd.CMD.unlock(u.sam), true) }) : null,
          el("button", { type: "button", class: "btn ghost sm", text: L().dReset, onclick: resetForm }),
          el("button", { type: "button", class: "btn ghost sm", text: u.enabled ? L().dDisable : L().dEnable, onclick: () => exec(u.enabled ? Wd.CMD.disable(u.sam) : Wd.CMD.enable(u.sam), true) })),
        resetBox,
        el("h3", { text: L().dGroupsT }),
        el("ul", { class: "chips" }, u.groups.map((g) => el("li", {}, el("button", { type: "button", class: "chip-link", text: g, onclick: () => { dirSel = { type: "group", id: g }; renderAll(); } }),
          el("button", { type: "button", class: "chip-x", "aria-label": L().dRemove(g), title: L().dRemove(g), text: "×", onclick: () => exec(Wd.CMD.removeGroup(u.sam, g), true) })))),
        groupsNotIn.length ? el("div", { class: "row add-group" }, pick, el("button", { type: "button", class: "btn ghost sm", text: L().dAdd, onclick: () => { if (pick.value) exec(Wd.CMD.addGroup(u.sam, pick.value), true); } })) : null);
    }
    function groupDetail(g) {
      const m = Wd.members(world, g);
      put(detailBox, el("h3", { class: "dtitle", text: g.name }), el("p", { class: "sub", text: Wd.t(g.desc, lang) }),
        fieldsDl([{ label: "DN", value: `CN=${g.name},${Wd.ouPath(g.ou)}` }, { label: L().dScope, value: L().dScopeVal }]),
        el("h3", { text: `${L().dMembers} (${m.length})` }),
        m.length ? el("ul", { class: "chips" }, m.map((u) => el("li", {}, el("button", { type: "button", class: "chip-link", text: u.name, onclick: () => { dirSel = { type: "user", id: u.sam }; renderAll(); } })))) : el("p", { class: "sub", text: L().dNoMembers }));
    }
    function computerDetail(c) {
      const srv = Wd.SERVERS.find((s) => s.id === c.name);
      const u = c.user && Wd.user(world, c.user);
      put(detailBox, el("h3", { class: "dtitle", text: c.name }),
        fieldsDl([{ label: L().iOs, value: c.os }, { label: "DN", value: `CN=${c.name},${Wd.ouPath(c.ou)}` },
          u ? { label: L().dAssigned, value: u.name } : null, srv ? { label: L().colRole, value: Wd.t(srv.role, lang) } : null, srv ? { label: "IP", value: srv.ip } : null,
          c.note ? { label: L().dNote, value: Wd.t(c.note, lang) } : null].filter(Boolean)),
        srv ? el("p", {}, el("a", { href: "#/inventory", onclick: () => { invSel = srv.id; }, text: L().dInInventory })) : null);
    }
    function renderAll() { renderTasks(); renderTree(); renderList(); renderDetail(); }

    view.append(
      el("header", { class: "view-head" }, el("div", {}, el("h1", { text: L().dTitle }), el("p", { class: "sub", text: L().dSub }))),
      tasksBox,
      el("div", { class: "dir" }, treeBox, listBox, detailBox),
      el("h2", { class: "dir-ps", text: L().dConsole }), term, el("p", { class: "term-help", text: L().dConsoleHelp }));
    if (dirLog.length) dirLog.forEach((l) => print(l.text, l.kind, false));
    else print(L().dWelcome, "dim");
    renderAll();
    term.scrollTop = term.scrollHeight;
  }

  /* ---------- inventory */
  function inventory() {
    const view = shell("inventory");
    document.title = L().iTitle + " · SysAdmin Desks";
    const binds = bindings();
    const linked = (id) => SCENARIOS.filter((sc) => (sc.bind || []).some((b) => b.id === id));
    const items = Wd.SERVERS.map((s) => ({ kind: "server", id: s.id, d: s })).concat(Wd.PRINTERS.map((p) => ({ kind: "printer", id: p.id, d: p }))).map((x) => {
      const b = binds.filter((y) => y.kind === x.kind && y.id === x.id);
      const status = b.map((y) => y.set.status).find((s) => s && s !== "ok") || "ok";
      return Object.assign(x, { status, notes: b.map((y) => y.note).filter(Boolean), jobs: (b.find((y) => "jobs" in y.set) || { set: { jobs: 0 } }).set.jobs, tickets: linked(x.id) });
    });
    const shown = items.filter((x) => invFilter === "all" || (invFilter === "problems" ? x.status !== "ok" : x.kind === invFilter));
    const chips = el("div", { class: "qtabs", role: "tablist" }, [["all", L().iAll], ["server", L().iServers], ["printer", L().iPrinters], ["problems", L().iProblems]].map(([k, text]) =>
      el("button", { type: "button", role: "tab", class: "qtab" + (invFilter === k ? " on" : ""), "aria-selected": invFilter === k ? "true" : "false", onclick: () => { invFilter = k; inventory(); } },
        text + " ", el("span", { class: "count", text: String(items.filter((x) => k === "all" || (k === "problems" ? x.status !== "ok" : x.kind === k)).length) }))));
    const stPill = (s) => el("span", { class: "inv-st " + s }, el("span", { class: "tdot", "aria-hidden": "true" }), el("span", { text: L().st[s] }));
    const table = shown.length ? el("table", { class: "qtable inv" },
      el("thead", {}, el("tr", {}, [L().colStatus, L().colName, L().colType, L().colRole, "IP", L().colTickets].map((x) => el("th", { scope: "col", text: x })))),
      el("tbody", {}, shown.map((x) => el("tr", { class: invSel === x.id ? "active" : "" },
        el("td", { "data-label": L().colStatus }, stPill(x.status)),
        el("td", { class: "subj", "data-label": L().colName }, el("button", { type: "button", class: "link-row", text: x.id, onclick: () => { invSel = x.id; inventory(); } })),
        el("td", { "data-label": L().colType, text: x.kind === "server" ? L().iServer : L().iPrinter }),
        el("td", { "data-label": L().colRole, text: Wd.t(x.kind === "server" ? x.d.role : x.d.model, lang) }),
        el("td", { class: "mono", "data-label": "IP", text: x.d.ip }),
        el("td", { "data-label": L().colTickets }, x.tickets.length ? x.tickets.map((sc) => el("a", { class: "tkt mono", href: "#/desk/" + sc.id, text: sc.ticket.id }))
          : el("span", { class: "muted", text: "–" })))))) : el("p", { class: "empty", text: L().iNoProblem });
    const sel = items.find((x) => x.id === invSel);
    let detail = el("section", { class: "panel inv-detail" }, el("p", { class: "empty", text: L().iPick }));
    if (sel) {
      const d = sel.d;
      detail = el("section", { class: "panel inv-detail" },
        el("div", { class: "row" }, el("h2", { class: "dtitle", text: sel.id }), stPill(sel.status)),
        sel.notes.length ? el("ul", { class: "inv-notes" }, sel.notes.map((n) => el("li", { text: n }))) : el("p", { class: "sub", text: L().iNoIssue }),
        fieldsDl(sel.kind === "server" ? [{ label: L().colRole, value: Wd.t(d.role, lang) }, { label: L().iOs, value: d.os }, { label: "IP", value: d.ip },
          { label: L().colLocation, value: Wd.t(d.location, lang) }, { label: L().iOwner, value: Wd.t(d.owner, lang) }, { label: L().iPatched, value: d.patched }]
          : [{ label: L().colRole, value: Wd.t(d.model, lang) }, { label: "IP", value: d.ip }, { label: L().iQueue, value: d.queue },
            { label: L().iJobs, value: String(sel.jobs), tone: sel.jobs ? "bad" : "" }, { label: L().colLocation, value: Wd.t(d.location, lang) }]),
        el("h3", { text: L().colTickets }),
        sel.tickets.length ? el("ul", { class: "inv-tickets" }, sel.tickets.map((sc) => el("li", {}, ticketPill(sc), el("span", { text: " " + t(sc.title, lang) })))) : el("p", { class: "sub", text: L().iNone }),
        sel.kind === "server" ? el("p", {}, el("a", { href: "#/directory", onclick: () => { dirOu = "servers"; dirSel = { type: "computer", id: sel.id }; }, text: L().iInDir })) : null);
    }
    view.append(el("header", { class: "view-head" }, el("div", {}, el("h1", { text: L().iTitle }), el("p", { class: "sub", text: L().iSub }))),
      chips, el("div", { class: "inv-grid" }, el("div", { class: "qwrap" }, table), detail));
  }

  /* ---------- welcome tour: a card at the bottom and the element it talks about highlighted; skip it or take it again from the sidebar */
  function closeTour(done) {
    document.querySelectorAll(".tour").forEach((n) => n.remove());
    document.querySelectorAll(".tour-focus").forEach((n) => n.classList.remove("tour-focus"));
    document.removeEventListener("keydown", tourKeys);
    if (done) save("tourDone", true);
  }
  function tourKeys(ev) { if (ev.key === "Escape") closeTour(true); }
  function tour(i) {
    closeTour(false);
    const steps = L().tour;
    const targets = [null, "tour-queue", "tour-sla", "tour-row", "nav-progress", "nav-tour"];
    const step = steps[i];
    const target = targets[i] && document.getElementById(targets[i]);
    if (target) { target.classList.add("tour-focus"); target.scrollIntoView({ behavior: "smooth", block: "center" }); }
    const last = i === steps.length - 1;
    const card = el("div", { class: "tour", role: "dialog", "aria-labelledby": "tour-h" },
      el("p", { class: "tour-step", text: L().tourStep(i + 1, steps.length) }),
      el("h2", { id: "tour-h", text: step[0] }), el("p", { text: step[1] }),
      el("div", { class: "row" },
        el("button", { type: "button", class: "link-btn", text: L().tourSkip, onclick: () => closeTour(true) }),
        el("span", { class: "grow" }),
        i ? el("button", { type: "button", class: "btn ghost sm", text: L().tourBack, onclick: () => tour(i - 1) }) : null,
        el("button", { type: "button", class: "btn sm", text: last ? L().tourDone : L().tourNext, onclick: () => last ? closeTour(true) : tour(i + 1) })));
    document.body.append(card);
    document.addEventListener("keydown", tourKeys);
    card.querySelector(".btn.sm:last-child").focus();
  }


  /* ---------- landing page (signed out) */
  function laptop(screen, extra) {
    return el("div", { class: "laptop" + (extra ? " " + extra : ""), "aria-hidden": "true" },
      el("div", { class: "lt-lid" }, el("div", { class: "lt-cam" }), el("div", { class: "lt-screen" }, screen)),
      el("div", { class: "lt-base" }, el("div", { class: "lt-notch" })));
  }
  function ticketCard(title, prio, cls, label) {
    return el("div", { class: "float-card " + (cls || "") },
      el("span", { class: "fc-icon", text: "▤" }),
      el("div", {}, label ? el("p", { class: "fc-label", text: label }) : null, el("p", { class: "fc-title", text: title }),
        el("p", { class: "fc-meta" }, el("span", { class: "prio " + prio, text: prio }), el("span", { class: "fc-bar" }), el("span", { class: "fc-bar short" }))));
  }
  function termScreen(lines) {
    return el("div", { class: "mini-term" }, lines.map(([k, t]) => el("div", { class: "mt-line " + k, text: t })), el("div", { class: "mt-line cur", text: "PS C:\\> " }));
  }
  function landing() {
    const app = document.getElementById("app");
    app.replaceChildren();
    const T = L().land;
    document.title = "SysAdmin Desks by IGG · " + (lang === "es" ? "simulador de soporte IT" : "IT support simulator");
    const howBtn = el("button", { type: "button", class: "land-link", text: T.how, onclick: () => {
      const target = document.getElementById("land-s1");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    } });
    const heroArt = el("div", { class: "art" },
      laptop(termScreen([["dim", "Connected to PC-SALES-14 as CONTOSO\\jruiz"], ["cmd", "PS C:\\> ipconfig /all"], ["out", "DNS Servers . . . : 8.8.8.8"],
        ["cmd", "PS C:\\> nslookup intranet.contoso.local"], ["err", "*** can't find intranet.contoso.local: Non-existent domain"]])),
      ticketCard(T.heroTicket, "P3", "fc-hero", T.newTicket));
    const sectionArt = [
      el("div", { class: "art" }, laptop(el("div", { class: "mini-desk" }, el("div", { class: "md-bar" }), el("div", { class: "md-row" }), el("div", { class: "md-row" }), el("div", { class: "md-row short" }))),
        ticketCard(T.t3[0], T.t3[1], "fc-a"), ticketCard(T.t1[0], T.t1[1], "fc-b"), ticketCard(T.t2[0], T.t2[1], "fc-c")),
      el("div", { class: "art" }, laptop(termScreen([["cmd", "PS C:\\> Get-ADUser mgarcia -Properties LockedOut"], ["out", "LockedOut : True"],
        ["cmd", "PS C:\\> Get-WinEvent -FilterHashtable @{LogName='Security';Id=4740}"], ["ev", "Caller Computer Name: FS-SCAN01"],
        ["cmd", "PS C:\\> Get-ScheduledTask -CimSession FS-SCAN01"], ["out", "ScanToFinance   Ready   CONTOSO\\mgarcia"]]))),
      el("div", { class: "art" }, laptop(el("div", { class: "mini-desk" }, el("div", { class: "md-bar" }), el("div", { class: "md-row" }), el("div", { class: "md-row short" }))),
        el("div", { class: "float-card fc-check" }, el("p", { class: "fc-label", text: L().stages }),
          el("ul", {}, T.stagesDemo.map((x) => el("li", {}, el("span", { class: "tick", text: "✓" }), el("span", { text: x }))))),
        el("div", { class: "float-pill", text: "● " + T.resolved })),
      el("div", { class: "art" }, laptop(el("div", { class: "mini-desk" }, el("div", { class: "md-bar" }), el("div", { class: "md-row" }), el("div", { class: "md-row" }))),
        el("div", { class: "float-card fc-note" }, el("p", { class: "fc-label", text: T.noteTitle }), el("p", { class: "fc-note-text", text: T.noteText }),
          el("p", { class: "fc-score" }, el("span", { class: "stars", text: "★★★" }), el("span", { text: T.score })))),
    ];
    const sections = T.sections.map((sec, i) => el("section", { class: "land-sec" + (i % 2 ? " flip" : ""), id: "land-s" + (i + 1) },
      el("div", { class: "land-copy" },
        el("p", { class: "land-kicker", text: sec.k }),
        el("h2", {}, sec.h.split("\n").map((line, j) => [j ? el("br") : null, line])),
        el("p", { class: "land-p", text: sec.p }),
        el("ul", { class: "land-chips" }, sec.chips.map((c) => el("li", { text: c })))),
      sectionArt[i]));
    const site = (path) => SITE + path;
    const ext = (href, text) => el("a", { href, target: "_blank", rel: "noopener noreferrer", text });
    app.append(el("div", { class: "landing" },
      el("section", { class: "land-hero" },
        el("div", { class: "land-copy" },
          el("p", { class: "land-tag" }, el("span", { class: "dot", "aria-hidden": "true" }), T.tag),
          el("h1", { class: "land-title", text: T.title }),
          el("p", { class: "land-lead", text: T.lead }),
          el("div", { class: "land-ctas" }, el("a", { class: "btn land-cta", href: "#/register", text: T.cta }), howBtn,
            ext(site("guias.html"), T.guides))),
        heroArt),
      sections,
      el("section", { class: "land-end" },
        laptop(el("div", { class: "end-screen" }, el("p", { class: "land-kicker", text: T.endK }), el("h2", { text: T.endH }), el("p", { text: T.endP }),
          el("a", { class: "btn land-cta", href: "#/register", text: T.cta })), "big")),
      el("footer", { class: "land-foot" },
        el("div", { class: "lf-cols" },
          el("div", { class: "lf-brand" }, el("p", { class: "brand" }, el("span", { class: "mark", text: ">_" }), el("span", { text: "SysAdmin Desks" })),
            el("p", { text: T.footBlurb })),
          el("div", {}, el("p", { class: "lf-h", text: T.colDesks }), el("ul", {}, SCENARIOS.map((sc) => el("li", {}, el("a", { href: "#/desk/" + sc.id, text: t(sc.title, lang) }))))),
          el("div", {}, el("p", { class: "lf-h", text: T.colGuides }), el("ul", {}, T.guideLinks.map(([x, h]) => el("li", {}, ext(site(h), x))))),
          el("div", {}, el("p", { class: "lf-h", text: T.colProject }), el("ul", {}, T.projectLinks.map(([x, h]) => el("li", {}, ext(site(h), x))),
            el("li", {}, ext("https://www.linkedin.com/in/igonzalez93", "LinkedIn")), el("li", {}, el("a", { href: "privacy.html", text: L().privacy }))))),
        el("div", { class: "lf-bottom" }, el("span", { text: "© 2026 Iñigo González · SysAdmin Desks by IGG" }), el("span", { text: T.legal })))));
  }

  /* ---------- start page: sign in or create an account */
  function start(mode, notice) {
    const app = document.getElementById("app");
    app.replaceChildren();
    document.title = "SysAdmin Desks by IGG · " + (lang === "es" ? "acceso" : "sign in");
    let tab = mode || "login";
    let avatar = AVATARS[0];
    const msg = el("p", { class: "form-msg", role: "alert" });
    if (notice) msg.textContent = L().errors[notice] || "";
    if (notice === "need_login") msg.classList.add("info");
    const body = el("div", { class: "signin-body" });

    function field(label, input, extra) {
      return el("label", { class: "field" }, el("span", { class: "field-label", text: label }), input, extra || null);
    }
    function passwordField(withRules) {
      const input = el("input", { type: "password", name: "password", required: true, maxlength: "128",
        autocomplete: withRules ? "new-password" : "current-password" });
      const eye = el("button", { type: "button", class: "eye", "aria-label": L().show, text: "👁" });
      eye.addEventListener("click", () => {
        const hidden = input.type === "password";
        input.type = hidden ? "text" : "password";
        eye.setAttribute("aria-label", hidden ? L().hide : L().show);
      });
      const wrap = el("span", { class: "pw" }, input, eye);
      if (!withRules) return { input, node: field(L().fPassword, wrap) };
      const items = Object.keys(L().rules).map((k) => el("li", { "data-rule": k, text: L().rules[k] }));
      const list = el("ul", { class: "rules" }, items);
      input.addEventListener("input", () => {
        const v = input.value;
        const ok = { length: v.length >= 8, capital: /[A-ZÁÉÍÓÚÑ]/.test(v), number: /[0-9]/.test(v) };
        items.forEach((li) => li.classList.toggle("ok", ok[li.getAttribute("data-rule")]));
      });
      return { input, node: field(L().fPassword, wrap, list) };
    }
    function busy(btn, on) { btn.disabled = on; btn.classList.toggle("busy", on); }
    async function done(r) {
      if (!r.ok) { msg.textContent = L().errors[r.data.error] || L().errors.server; return; }
      await adopt(r.data);
      const next = afterLogin || "#/";
      afterLogin = null;
      try { sessionStorage.removeItem("sd.next"); } catch (e) { /* ignore */ }
      if (location.hash === next) route(); else location.hash = next;
    }

    function render() {
      const tabs = el("div", { class: "tabs", role: "tablist" },
        ["login", "register"].map((k) => el("button", { type: "button", role: "tab", class: "tab" + (tab === k ? " on" : ""),
          "aria-selected": tab === k ? "true" : "false", text: k === "login" ? L().tabLogin : L().tabRegister,
          onclick: () => { tab = k; msg.textContent = ""; render(); } })));
      const email = el("input", { type: "email", name: "email", required: true, maxlength: "254", autocomplete: "email", placeholder: L().phEmail });
      let form;
      if (tab === "login") {
        const pw = passwordField(false);
        const forgotText = el("p", { class: "forgot-text", hidden: true }, L().forgotText + " ",
          el("a", { href: SITE + "about.html#contacto", target: "_blank", rel: "noopener noreferrer", text: L().contact }));
        const submit = el("button", { type: "submit", class: "btn wide", text: L().btnLogin });
        form = el("form", { class: "signin-form", novalidate: true, onsubmit: async (ev) => {
          ev.preventDefault();
          busy(submit, true);
          const r = await api("/api/auth/login", "POST", { email: email.value, password: pw.input.value });
          busy(submit, false);
          await done(r);
        } },
          field(L().fEmail, email), pw.node,
          el("button", { type: "button", class: "link-btn", text: L().forgot, onclick: () => { forgotText.hidden = !forgotText.hidden; } }), forgotText,
          submit);
      } else {
        const name = el("input", { type: "text", name: "name", required: true, minlength: "2", maxlength: "40", autocomplete: "nickname", placeholder: L().phName });
        const pics = el("div", { class: "avatars", role: "radiogroup", "aria-label": L().fAvatar }, AVATARS.map((a) =>
          el("button", { type: "button", role: "radio", class: "pick" + (a === avatar ? " on" : ""), "aria-checked": a === avatar ? "true" : "false",
            "aria-label": L().fAvatar + " " + a.slice(1), onclick: (ev) => {
              avatar = a;
              pics.querySelectorAll(".pick").forEach((b) => { b.classList.remove("on"); b.setAttribute("aria-checked", "false"); });
              ev.currentTarget.classList.add("on"); ev.currentTarget.setAttribute("aria-checked", "true");
            } }, avatarImg(a))));
        const pw = passwordField(true);
        const consent = el("input", { type: "checkbox", name: "consent" });
        const submit = el("button", { type: "submit", class: "btn wide", text: L().btnRegister });
        form = el("form", { class: "signin-form", novalidate: true, onsubmit: async (ev) => {
          ev.preventDefault();
          busy(submit, true);
          const r = await api("/api/auth/register", "POST", { name: name.value, email: email.value, password: pw.input.value, avatar, consent: consent.checked });
          busy(submit, false);
          await done(r);
        } },
          field(L().fName, name), el("div", { class: "field" }, el("span", { class: "field-label", text: L().fAvatar }), pics),
          field(L().fEmail, email), pw.node,
          el("label", { class: "check" }, consent, el("span", {}, L().consentA,
            el("a", { href: "privacy.html", target: "_blank", rel: "noopener noreferrer", text: L().consentLink }), L().consentB)),
          submit);
      }
      body.replaceChildren(tabs, msg, form,
        el("div", { class: "or" }, el("span", { text: L().or })),
        el("a", { class: "btn google", href: "/api/auth/google", onclick: () => {
          try { if (afterLogin) sessionStorage.setItem("sd.next", afterLogin); } catch (e) { /* ignore */ }
        } }, el("span", { class: "g", "aria-hidden": "true", text: "G" }), el("span", { text: L().google })),
        el("p", { class: "fine", text: L().googleNote }));
    }
    render();

    app.append(el("section", { class: "start" },
      el("div", { class: "start-pitch" },
        el("p", { class: "start-tag" }, el("span", { class: "dot", "aria-hidden": "true" }), L().startTag),
        el("h1", { text: L().startTitle }),
        el("p", { class: "start-text", text: L().startText }),
        el("ul", { class: "start-points" }, L().startPoints.map((x) => el("li", { text: x }))),
        el("p", { class: "guest" }, el("a", { href: "#/", class: "btn ghost", text: L().backHome }))),
      el("div", { class: "signin" },
        el("div", { class: "signin-bar" }, el("span", { text: "🖥 " + L().deskHost }), el("span", { text: L().deskDomain })),
        el("div", { class: "signin-card" },
          el("div", { class: "signin-head" }, el("span", { class: "lock", "aria-hidden": "true", text: "🔒" }), el("span", { text: L().cardTitle })),
          body))));
  }

  /* ---------- account */
  function account() {
    if (!user) { start("login"); return; }
    const app = document.getElementById("app");
    const view = shell("account");
    document.title = L().accTitle + " · SysAdmin Desks";
    const solved = Object.keys(progress).length;
    const totalStars = Object.values(progress).reduce((a, p) => a + (p.stars || 0), 0);
    const zone = el("div", { class: "danger" });
    const msg = el("p", { class: "form-msg", role: "alert" });
    function ask() {
      zone.replaceChildren(el("p", { text: L().accDeleteText }), el("div", { class: "row" },
        el("button", { type: "button", class: "btn danger-btn", text: L().accConfirm, onclick: async () => {
          const r = await api("/api/me", "DELETE");
          if (!r.ok) { msg.textContent = L().errors[r.data.error] || L().errors.server; return; }
          user = null; progress = {}; save("progress", progress); save("work", {});
          document.body.classList.remove("shell-on");
          chrome();
          app.replaceChildren(el("section", { class: "panel account" }, el("p", { text: L().accDeleted }), el("a", { class: "btn", href: "#/start", text: L().signIn })));
        } }),
        el("button", { type: "button", class: "btn ghost", text: L().accCancel, onclick: idle })));
    }
    function idle() { zone.replaceChildren(el("button", { type: "button", class: "btn ghost", text: L().accDelete, onclick: ask })); }
    idle();
    view.append(el("section", { class: "panel account" },
      el("div", { class: "acc-head" }, avatarImg(user.avatar, "avatar lg"), el("div", {}, el("h1", { text: user.name }), el("p", { class: "from", text: user.email }))),
      el("p", { text: L().progress(solved, SCENARIOS.length, totalStars) }),
      el("p", { class: "fine", text: (user.google ? L().accGoogle : L().accPassword) + " · " + L().accSynced }),
      el("div", { class: "row" }, el("a", { class: "btn", href: "#/", text: L().home }),
        el("button", { type: "button", class: "btn ghost", text: L().signOut, onclick: async () => {
          await api("/api/auth/logout", "POST");
          user = null; progress = {}; save("progress", progress); save("work", {});
          Object.keys(live).forEach((k) => delete live[k]);
          location.hash = "#/start"; route();
        } })),
      msg, zone));
  }

  /* ---------- routing */
  function route(notice) {
    chrome();
    clearInterval(ticker);
    closeTour(false);
    let h = location.hash;
    if (user && (h === "#/start" || h === "#/register")) { history.replaceState(null, "", location.pathname + location.search + "#/"); h = "#/"; }
    const m = h.match(/^#\/desk\/([a-z0-9-]+)$/);
    document.body.classList.toggle("landing-on", !user && (h === "" || h === "#/"));
    document.body.classList.toggle("shell-on", Boolean(user));
    if (m && user) desk(m[1]);
    else if (m) { afterLogin = h; start("login", notice || "need_login"); }
    else if (h === "#/start") start("login", notice);
    else if (h === "#/register") start("register", notice);
    else if (h === "#/account") account();
    else if (h === "#/progress" && user) progressPage();
    else if (h === "#/directory" && user) directory();
    else if (h === "#/inventory" && user) inventory();
    else if (user) queue();
    else landing();
    if (user) ticker = setInterval(tick, 1000);
    window.scrollTo(0, 0);
  }
  document.getElementById("lang").addEventListener("click", () => {
    lang = lang === "es" ? "en" : "es";
    save("lang", lang);
    route();
  });
  window.addEventListener("hashchange", () => route());

  // who is signed in, then the first view; ?auth=... comes back from the Google sign-in
  (async function boot() {
    const params = new URLSearchParams(location.search);
    const notice = params.get("auth");
    if (notice) history.replaceState(null, "", location.pathname + (asked ? "?lang=" + asked : "") + location.hash);
    const r = await api("/api/me");
    if (r.ok && r.data.user) {
      await adopt(r.data);
      let next = null;
      try { next = sessionStorage.getItem("sd.next"); sessionStorage.removeItem("sd.next"); } catch (e) { /* ignore */ }
      if (next && /^#\/desk\/[a-z0-9-]+$/.test(next) && location.hash !== next) { history.replaceState(null, "", location.pathname + next); }
    }
    route(notice && notice !== "ok" ? notice : undefined);
  })();
})();
