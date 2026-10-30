/* SysAdmin Desks by IGG - user interface. Every text is set with textContent (no HTML strings). */
(function () {
  "use strict";
  const E = window.SDEngine;
  const W = window.SDWorkflow;
  const C = window.SDComms;
  const SH = window.SDShip;      // v0.7b: shipments and RMA
  const SCENARIOS = window.SDScenarios;
  const Lib = window.SDLibrary;  // v0.8: the documentation library
  const Lb = window.SDLabs;      // v0.8: labs by area
  const PF = window.SDProfile;   // v0.8: profile and career path
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
      startPoints: ["21 tickets: from Active Directory, Windows and Microsoft 365 to VPN, backups, Citrix, Linux, SQL Server and Cisco, HP and FortiGate network devices", "Hints when you are stuck, and the tempting fix that does not solve it", "Each desk links to its step-by-step guide", "Your progress is saved in your account and follows you to any device"],
      deskHost: "CONTOSO-HD-07", deskDomain: "contoso.local", cardTitle: "Contoso help desk · technician sign-in",
      tabLogin: "Sign in", tabRegister: "Create account", fName: "Technician name", fAvatar: "Avatar", fEmail: "Email", fPassword: "Password",
      phName: "Alex Moreno", phEmail: "you@example.com", show: "Show password", hide: "Hide password",
      rules: { length: "8 characters or more", capital: "One capital letter", number: "One number" },
      consentA: "I have read the ", consentLink: "privacy policy", consentB: " and accept the ", consentTerms: "terms of use", consentC: ".",
      btnLogin: "Clock in", btnRegister: "Create my account", or: "or", google: "Continue with Google",
      googleNote: "If you continue with Google you accept the terms of use and the privacy policy.",
      forgot: "Forgot your password?", forgotTitle: "Reset your password", forgotText: "Write the email of your account and we will send you a link to choose a new password.",
      forgotSend: "Send me the link", forgotBack: "← Back to sign in",
      forgotSent: "If there is an account with that email, we have sent you a link to choose a new password. It expires in 30 minutes. Check the spam folder too.",
      forgotOff: "Password reset by email is not available yet. Use Continue with Google if your account uses that email, or write to me from the contact form and I will help you get back in.",
      contact: "Contact form",
      resetTitle: "Choose a new password", resetText: "Your new password signs you out on every device. Then sign in with it.",
      fNewPassword: "New password", fConfirm: "Repeat the new password", resetBtn: "Save the new password", resetMismatch: "The two passwords do not match.",
      resetDone: "Your password has been changed and every session has been closed. Sign in with the new password.", resetNoToken: "Open the link from the email again, or ask for a new one.",
      resetAgain: "Ask for a new link",
      errors: { credentials: "Wrong email or password.", exists: "There is already an account with that email: sign in instead.",
        name: "Write a name of 2 to 40 characters.", email: "Check the email address.", password: "The password needs 8 characters or more, a capital letter and a number.",
        consent: "Accept the privacy policy and the terms of use to create the account.", locked: "Too many attempts. Wait 15 minutes and try again.",
        google_only: "This account signs in with Google: use Continue with Google.", unavailable: "Accounts are not available right now. Try again in a few minutes.",
        server: "Something went wrong. Try again in a minute.", google_off: "Sign-in with Google is not ready yet. Use your email and password.",
        google_error: "Sign-in with Google did not finish. Try again.", network: "No connection to the server.", origin: "Reload the page and try again.", bad_request: "Reload the page and try again.", need_login: "Sign in or create a free account to open this desk.",
        reset_invalid: "This link is not valid or has expired. Ask for a new one.", reset_unavailable: "Password reset by email is not available yet." },
      signIn: "Sign in", account: "My account", signOut: "Sign out", hello: (n) => `Hi, ${n}. Pick a ticket to start your shift.`,
      accTitle: "My account", accSynced: "Your progress is saved in your account.", accGoogle: "Signs in with Google", accPassword: "Signs in with email and password",
      accDelete: "Delete my account", accDeleteText: "This deletes your account, your sessions and your saved progress. It cannot be undone.",
      accConfirm: "Yes, delete everything", accCancel: "Cancel", accDeleted: "Your account has been deleted.",
      footUser: "Fictional company and people. Your progress is saved in your account.", privacy: "Privacy",
      footAnon: "Fictional company and people.", backHome: "← Back to the home page",
      about: "About", help: "Help", faq: "FAQ", terms: "Terms", report: "Report a problem", cookies: "Cookie settings", navHelp: "Help", accHelp: "Something not working, or an idea for a ticket?",
      navLabel: "Help desk", deskName: "Contoso help desk", navTickets: "Tickets", navProgress: "Progress", navGuides: "Guides", navAccount: "My account", navTour: "Take the tour",
      qTitle: "Ticket queue", shift: "Morning shift · on duty", tabOpen: "Open", tabClosed: "Closed",
      colTicket: "Ticket", colSubject: "Subject", colRequester: "Requester", colPriority: "Priority", colStatus: "Status", colAssignee: "Assigned to",
      colResult: "Result", colPoints: "Score", colDate: "Closed on", colTopic: "Topic", colBest: "Best result",
      status: { new: "New", progress: "In progress", "pending-user": "Pending user", "pending-vendor": "Pending vendor", closed: "Closed" }, unassigned: "Unassigned", replay: "Replay",
      lvl: { resolved: "Resolved", observations: "Resolved with observations", unresolved: "Not resolved" },
      slaTarget: (m) => `${m} min`, slaLeft: (m) => `${m} left`, slaOver: (m) => `${m} min over`,
      slaPausedShort: "Paused", slaPaused: (l, p) => `Paused · ${l} · on hold ${p}`,
      pendBtn: "Set pending", unassignBtn: "Unassign", resumeBtn: "Resume",
      pendTitle: "Put the ticket on hold", pendText: "Use it when you are waiting for the user or a vendor. The SLA is paused until you resume, and the reason goes into the activity.",
      pendState: "State", pendReason: "Reason", pendPh: "Waiting for the user to restart the laptop after the update",
      pendCount: (n, m) => n >= m ? `${n} characters` : `${n} of ${m} characters minimum`, pendOk: "Set pending", pendNeedReason: (m) => `Write a reason of at least ${m} characters.`,
      pausedTitle: (st) => `${st}: the SLA is paused`, pausedText: "The console and the actions are read-only while the ticket waits. Resume it to keep working.",
      unassignedTitle: "Ticket unassigned", unassignedText: (l) => `The SLA keeps running (${l}). Assign it to yourself again to carry on where you left off.`,
      resolvePending: "A ticket on hold cannot be resolved. Resume it first.",
      tlTitle: "Activity", tlEmpty: "No changes yet: assign the ticket to start.", pausedUsed: (m) => `SLA paused: ${m} (not counted)`,
      dPendingTicket: (n, id) => `${n}'s account is part of ticket ${id}, which is on hold. Resume the ticket to work on it.`,
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
      pTitle: "Your progress", pSub: "Your best result on each ticket is saved in your account. Your streak, goal, badges, articles and mail answers stay in this browser.", tClosed: "Tickets closed", tStars: "Stars", tPoints: "Points", tAvg: "Average score", notYet: "Not yet",
      tourNext: "Next", tourBack: "Back", tourSkip: "Skip the tour", tourDone: "Start the shift", tourStep: (i, n) => `${i} of ${n}`,
      navDirectory: "Directory", navInventory: "Inventory", navNetwork: "Network room",
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
      iTitle: "Inventory", iSub: "Servers, printers and network devices. The status follows the open tickets.", iAll: "All", iServers: "Servers", iPrinters: "Printers", iProblems: "With an incident",
      colName: "Name", colType: "Type", colRole: "Role / model", colLocation: "Location", colTickets: "Tickets", iServer: "Server", iPrinter: "Printer",
      st: { ok: "OK", warn: "Warning", bad: "Error" }, iNoProblem: "Nothing to report.", iPick: "Pick a row to see the details.", iNoIssue: "Nothing to report.",
      navMail: "Mail", navKb: "Knowledge base", unreadN: (n) => `${n} unread`,
      kbTitle: "Knowledge base", kbSub: "Your own articles, written from the work notes of the tickets you closed well. Kept in this browser.",
      kbEmptyT: "No articles yet", kbEmpty: "An article is saved when you close a ticket as fixed and your work note covers everything it asks for (cause, change, check and follow-up). Close the same ticket again with a newer note and the article gets a new version: v1.0, v1.1…",
      kbEmptyBtn: "Go to the ticket queue", kbSearch: "Search the articles", kbAll: "All", kbNone: "No article matches.", kbCount: (n) => n === 1 ? "1 article" : `${n} articles`,
      colVersion: "Version", kbDownload: "Download Markdown", kbPrint: "Print or save as PDF", kbBack: "← Knowledge base", kbReplay: "Replay the ticket",
      kbNoArticle: "This ticket has no article yet.", kbSaved: (v) => `Saved in your knowledge base as v${v}.`, kbSame: "This note is already in your knowledge base.",
      kbOpenArticle: "Open the article", kbNotSaved: "To save it in your knowledge base, the note needs every element: see what was missing above.", kbDownloaded: (f) => `Downloaded ${f}.`,
      newBadge: (n) => `New badge: ${n}`,
      pTickets: "Tickets", gStreak: "Day streak", gBest: (n) => `Best: ${n} ${n === 1 ? "day" : "days"}`, gToday: "Practise today to keep it going.", gTodayDone: "Done for today.",
      gWeek: "This week", gGoalLabel: "Weekly goal", gGoalHelp: "Tickets closed and mail exercises answered, Monday to Sunday.", gGoalMet: "Goal met. Good week!",
      gMail: "Mail exercises correct", gKb: "Knowledge base articles", gOpen: "Open",
      bTitle: "Badges", bEarned: (d) => `Earned on ${d}`, bLocked: "Not yet earned", bCount: (n, m) => `${n} of ${m}`,
      mScoreTitle: "Mail exercises", colMessage: "Message", mNotAnswered: "Not answered",
      res: { correct: "Correct", partial: "Partly correct", wrong: "Wrong" },
      mTitle: "Mail", mSub: "The service desk inbox. Requests, notices and some messages that are not what they seem: decide what to do with each one.",
      mInbox: "Inbox", mPick: "Pick a message to read it.", mFrom: "From", mTo: "To", mCc: "Cc", mDate: "Date",
      mHeadersShow: "Show headers", mHeadersHide: "Hide headers", mLinks: "Links", mDirectory: "Directory",
      mDirNone: "No account in contoso.local uses this address.", mDirClaims: (n, a) => `No account uses this address. In the directory, ${n} is ${a}.`,
      mLinkTip: "Point at or focus a link to see where it really goes.", mLinkTo: (u) => `Opens: ${u}`, mLinkBlocked: (u) => `Blocked in the simulation. This link opens: ${u}`,
      mWhat: "What do you do?", mCreate: "Create ticket from this message", mHandled: (id) => `Ticket ${id} created from this message.`, mOpenTicket: (id) => `Open ${id}`,
      mClues: "The clues", mProcedure: "The right procedure", mRetry: "Try again", mBack: "← Inbox", mNext: "Next message",
      iOs: "Operating system", iOwner: "Owner", iPatched: "Last patched", iQueue: "Print server", iJobs: "Jobs in the queue", iNone: "No tickets.", iInDir: "Show in the directory",
      // v0.7a: the network room
      nTitle: "Network room", nSub: "Contoso's switches, the Valencia branch router and the firewall. A device that belongs to an open ticket shows that ticket's state, and its CLI works on the ticket; outside tickets, what you change here lasts while the page is open.",
      nReset: "Reset the network room", nResetDone: "Network room reset: every device outside a ticket is back as it was at the start of the shift.",
      colDevice: "Device", colModel: "Model", colMgmt: "Management IP", nType: { switch: "Switch", router: "Router", firewall: "Firewall" },
      nTabs: { general: "General", health: "Health", diag: "Diagnostics" }, nPick: "Pick a device to see its details.",
      nModel: "Model", nSerial: "Serial number", nOs: "OS / firmware", nLocation: "Location and rack", nMgmt: "Management IP", nOwner: "Owner", nRole: "Role", nSite: "Site",
      nSites: { HQ: "Head office", VLC: "Valencia branch" },
      nCpu: "CPU (5 min)", nMem: "Memory", nUptime: "Uptime", nTemp: "Temperature", nPsu: "Power supplies", nFans: "Fans", nPorts: "Ports up", nPortsVal: (u, n) => `${u} of ${n}`,
      nErrDis: "Err-disabled ports", nNone: "None", nErrors: "Interface errors", nErrorsVal: (p, c) => `${p}: ${c} CRC/FCS`, nConfig: "Configuration",
      nSaved: "Saved (running = startup)", nUnsaved: "Unsaved changes (running ≠ startup)", nUnsavedShort: "Unsaved", nSessions: "Sessions", nPolicies: "Firewall policies",
      nAutoSave: "Saved automatically (FortiOS)", nHealthNote: "Read from the device: it changes with what you do in the CLI or in a ticket.",
      nDiagWhat: "Test", nPing: "Ping", nTrace: "Traceroute", nTarget: "Destination", nTargetPh: "10.20.1.10 or erp.contoso.local", nRun: "Run", nLog: "Show the end of the log", nDiagNote: "Run from the device itself. Nothing changes.",
      nOpenCli: "Open CLI", nCloseCli: "Close the CLI", nCliTitle: (d) => `CLI · ${d}`, nCliHelp: "Type ? for the commands of each mode. exit closes the session and leaves you on your workstation, where ssh <device> opens another. ↑/↓ repeat commands.",
      nRouted: (id) => `(Run on ticket ${id}: this device belongs to an open ticket.)`, nAssignFirst: (id) => `This device belongs to ticket ${id}, still unassigned. Assign the ticket to yourself to work on it.`,
      nPausedTicket: (id) => `This device belongs to ticket ${id}, which is on hold. Resume the ticket to work on it.`, nReadyRoom: (id) => `Ticket ${id} is ready to close.`, nOpenTicket: "Open the ticket",
      iNetwork: "Network", iInRoom: "Open in the network room",
      // v0.7b: shipments and RMA
      navShipping: "Shipments", shTitle: "Shipments and RMA", shSub: "Vendor RMAs, shipments to users, device returns and loans, with a simulated clock and tracking. Each button runs a ship command.",
      shNew: "New shipment", shList: "Shipments", shNone: "No shipments yet. Create one with the form, or from a ticket that needs one.",
      shColId: "Shipment", shColTicket: "Ticket", shColType: "Type", shColAsset: "Asset", shColState: "State", shColTracking: "Tracking", shPractice: "Practice (no ticket)",
      shPick: "Pick a shipment to see its tracking.", shTicketLabel: "Ticket", shTicketNone: "Practice, not linked to a ticket", shType: "Type", shAsset: "Asset (serial from the inventory)",
      shVendor: "Vendor", shVendorNone: "None", shFault: "Fault description", shFaultPh: "What fails, since when, what you tested", shEvidence: "Evidence attached",
      shEvidencePh: "Diagnostic code, log line, photo… comma separated", shContract: "Support contract or warranty", shCarrier: "Carrier", shFrom: "Pickup at", shTo: "Deliver to",
      shData: "Data handling (laptops)", shDataPick: "Choose…", shEscrow: "BitLocker recovery key checked in Entra ID before it leaves", shItems: "Checklist (returns)",
      shCreate: "Create draft", shCreated: (id) => `${id} created as a draft. Check it and press Request.`, shCmd: "Command:",
      shSubmit: "Request", shAdvance: (st) => `Next step: ${st}`, shLost: "Report lost", shDamaged: "Report damaged", shClose: "Close shipment",
      shRma: "RMA number", shTracking: "Tracking", shEvents: "Tracking events", shNoTicket: "Practice shipment: no ticket, no SLA.",
      shNeedAssign: (id) => `Ticket ${id} is not assigned to you: assign it to work on its shipments.`, shPaused: "The ticket is pending: the shipping time does not count against the SLA.",
      shRunning: "The ticket is in progress: each step's shipping time counts against the SLA. Set it to Pending vendor while you wait.",
      shCost: (h) => `+${h} of SLA`, shFree: "SLA paused", shTicketShips: "Shipments of this ticket", shOpenAll: "Open in Shipments", shNewForTicket: "New shipment for this ticket",
      shTl: (id, st) => `Shipment ${id}: ${st}`, shWarn: "Warnings", shMissing: "Missing before it can be requested:", shDeviceNote: "Device state in the inventory:",
      shPracticeReset: "Clear practice shipments", shRan: "Shipments:", shNoTicketShips: "No shipments yet for this ticket.",
      iEndpoints: "Endpoints", iEndpoint: { laptop: "Laptop", phone: "Mobile phone", part: "Spare part" }, iSerial: "Serial number", iUser: "Assigned to", iWarranty: "Warranty / contract",
      iDevState: "State", iShipments: "Shipments", iToShipping: "Open in Shipments",
      netWelcome: "Network devices: ssh SW-CORE-01, SW-ACC-2F, SW-ACC-1F, RTR-VLC-01 or FGT-HQ-01. exit closes the session. onsite: what can be done on site.",
      // v0.6a: contacting the requester and the note for the user
      cContact: "Contact the requester", cOff: { unassigned: "Assign the ticket to yourself to contact the requester.", pending: "The ticket is on hold: resume it to contact the requester.", closed: "" },
      cTitle: (n) => `Conversation with ${n}`, cIntro: "Pick a question. Each one takes 1 minute of the SLA. Some help, some do not, and some are bad practice.",
      cQuestions: "What do you ask?", cCost: "+1 min", cNoMore: "No more questions for now.", cConfirmLater: "Once a fix is in, you can ask them to confirm it works.",
      cClose: "Close the conversation", cYou: "You", cBad: "Bad practice", cPassword: "Never ask for a password", cClueAdded: "Added to What you know",
      cConfirm: "Ask to confirm", cOk: "Confirmed: it works", cFailed: "It still fails", cTimeAdded: (n) => `Talking to the requester: +${n} min of SLA`,
      cVia: (n, tm) => `You will talk to ${n} (${tm}).`, kTitle: "What you know", kNone: "Nothing yet from the requester.",
      tlContact: "Contact", tlContactQ: (q) => `Contact: ${q}`,
      uNote: "Note to the user", uHelp: "What the requester will read: what was wrong, in plain words, and what they need to do (or that nothing is needed). No server names, admin accounts or passwords. Start from a template and replace every [gap].",
      uTemplates: "Insert a template:", uPh: "Hi …,", uLive: (n) => `Note to the user: ${n}/5 so far`,
      mWork: "Work note", mUser: "Note to the user", mUserNone: "not written",
      commsT: "Communication", commsBonus: (n) => `Communication bonus: +${n} (apart from the ticket score)`,
      commsCredit: { note: (p) => `Note to the user, +${p}`, questions: (n, p) => `${n === 1 ? "A useful question" : n + " useful questions"} and no bad ones, +${p}`, confirmed: (p) => `The requester confirmed it works, +${p}` },
      commsRemark: { "no-note": "No note for the user: they do not know what happened or what to do next.", password: "You asked the requester for a password: never do it, not even from IT.",
        bad: (n) => n === 1 ? "One question was bad practice (leading, blaming or jargon)." : `${n} questions were bad practice (leading, blaming or jargon).` },
      gComms: "Communication", gCommsX: (u, a) => `${u} useful ${u === 1 ? "question" : "questions"} asked · user note average ${a == null ? "–" : a + "/5"}`,
      land: {
        tag: "IT support simulator · free", title: "SysAdmin Desks",
        lead: "Practise the job of a support technician in your browser. Take a ticket from a fictional company, investigate in a console that answers like a real machine, fix the cause, prove it works and write the work note. Free, with your own account and nothing to install.",
        cta: "Start free", how: "How it works", guides: "Guides",
        newTicket: "New ticket", heroTicket: "Internet works, the intranet does not",
        sections: [
          { k: "01 · Read the ticket", h: "Real tickets,\none support desk.",
            p: "Twenty-one tickets from first and second line: a user locked out every morning, a new starter with no Outlook, a VPN that will not connect from home, a desk port the switch shut down, a backup that fails every night, an ERP that cannot save. Each one comes with the user, the priority and what you have to work with.",
            chips: ["Active Directory", "Microsoft 365", "Windows", "VPN", "Veeam", "Citrix", "Linux", "SQL Server", "Cisco", "FortiGate"] },
          { k: "02 · Investigate", h: "A console that answers\nlike a real machine.",
            p: "Type the commands you would use at work, in PowerShell or cmd: Get-ADUser, Get-WinEvent, ipconfig, nslookup, Get-Printer, Get-Mailbox and more. The output changes with what you do. Hints when you are stuck, and one tempting fix that looks right but does not solve the ticket.",
            chips: ["PowerShell and cmd", "Cisco IOS, HP and FortiOS CLI", "Simulated directory, desktop and network room", "Hints", "The tempting fix"] },
          { k: "03 · Fix and prove it", h: "Fix the cause,\nnot only the symptom.",
            p: "Each desk has a checklist: find the cause, fix it and check it stays fixed. The ticket only closes when you have proved it, like on a real shift, where unlocking an account again does not help if the old password is still saved somewhere.",
            chips: ["Investigate", "Fix", "Verify"] },
          { k: "04 · Write the note", h: "The note the next\ntechnician will thank you for.",
            p: "Close the ticket with a work note: cause, change, check and follow-up. It is scored, you see what was missing and an example note, and every desk links to its step-by-step guide. Your progress is saved in your account and follows you to any device.",
            chips: ["Scored work notes", "Step-by-step guides", "Progress in your account"] },
        ],
        endK: "05 · Start your shift", endH: "Ready for your first shift?", endP: "Create a free account and take your first ticket. Sign in with email or with Google.",
        footBlurb: "Hands-on IT support practice with realistic tickets, a simulated console and scored work notes.",
        colDesks: "Desks", colGuides: "Guides", colProject: "Project", colHelp: "Help",
        guideLinks: [["All guides", "guias.html"], ["Level 1: first steps", "guias/nivel-1.html"], ["Level 2: solid foundations", "guias/nivel-2.html"], ["Level 3: advanced", "guias/nivel-3.html"], ["Level 4: expert", "guias/nivel-4.html"]],
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
      startPoints: ["21 tickets: de Active Directory, Windows y Microsoft 365 a VPN, copias, Citrix, Linux, SQL Server y equipos de red Cisco, HP y FortiGate", "Pistas cuando te atascas, y el arreglo tentador que no lo resuelve", "Cada puesto enlaza con su guía paso a paso", "Tu progreso se guarda en tu cuenta y te sigue a cualquier equipo"],
      deskHost: "CONTOSO-HD-07", deskDomain: "contoso.local", cardTitle: "Mesa de soporte de Contoso · acceso de técnicos",
      tabLogin: "Entrar", tabRegister: "Crear cuenta", fName: "Nombre de técnico", fAvatar: "Avatar", fEmail: "Email", fPassword: "Contraseña",
      phName: "Alex Moreno", phEmail: "tu@ejemplo.com", show: "Mostrar contraseña", hide: "Ocultar contraseña",
      rules: { length: "8 caracteres o más", capital: "Una mayúscula", number: "Un número" },
      consentA: "He leído la ", consentLink: "política de privacidad", consentB: " y acepto los ", consentTerms: "términos de uso", consentC: ".",
      btnLogin: "Fichar entrada", btnRegister: "Crear mi cuenta", or: "o", google: "Continuar con Google",
      googleNote: "Si continúas con Google aceptas los términos de uso y la política de privacidad.",
      forgot: "¿Has olvidado la contraseña?", forgotTitle: "Restablecer la contraseña", forgotText: "Escribe el email de tu cuenta y te enviaremos un enlace para elegir una contraseña nueva.",
      forgotSend: "Enviarme el enlace", forgotBack: "← Volver a entrar",
      forgotSent: "Si existe una cuenta con ese email, te hemos enviado un enlace para elegir una contraseña nueva. Caduca en 30 minutos. Mira también en la carpeta de spam.",
      forgotOff: "El restablecimiento por email todavía no está disponible. Usa Continuar con Google si tu cuenta usa ese email, o escríbeme desde el formulario de contacto y te ayudo a recuperar el acceso.",
      contact: "Formulario de contacto",
      resetTitle: "Elige una contraseña nueva", resetText: "Al guardarla se cierra tu sesión en todos los equipos. Después entra con ella.",
      fNewPassword: "Contraseña nueva", fConfirm: "Repite la contraseña nueva", resetBtn: "Guardar la contraseña nueva", resetMismatch: "Las dos contraseñas no coinciden.",
      resetDone: "Tu contraseña se ha cambiado y se han cerrado todas las sesiones. Entra con la contraseña nueva.", resetNoToken: "Vuelve a abrir el enlace del email o pide uno nuevo.",
      resetAgain: "Pedir un enlace nuevo",
      errors: { credentials: "Email o contraseña incorrectos.", exists: "Ya hay una cuenta con ese email: entra con ella.",
        name: "Escribe un nombre de 2 a 40 caracteres.", email: "Revisa el email.", password: "La contraseña necesita 8 caracteres o más, una mayúscula y un número.",
        consent: "Acepta la política de privacidad y los términos de uso para crear la cuenta.", locked: "Demasiados intentos. Espera 15 minutos y vuelve a probar.",
        google_only: "Esta cuenta entra con Google: usa Continuar con Google.", unavailable: "Las cuentas no están disponibles ahora mismo. Prueba de nuevo en unos minutos.",
        server: "Algo ha fallado. Prueba de nuevo en un minuto.", google_off: "El acceso con Google aún no está listo. Usa tu email y contraseña.",
        google_error: "El acceso con Google no terminó. Prueba otra vez.", network: "Sin conexión con el servidor.", origin: "Recarga la página y prueba otra vez.", bad_request: "Recarga la página y prueba otra vez.", need_login: "Entra o crea una cuenta gratis para abrir este puesto.",
        reset_invalid: "El enlace no es válido o ha caducado. Pide uno nuevo.", reset_unavailable: "El restablecimiento por email todavía no está disponible." },
      signIn: "Entrar", account: "Mi cuenta", signOut: "Salir", hello: (n) => `Hola, ${n}. Elige un ticket para empezar el turno.`,
      accTitle: "Mi cuenta", accSynced: "Tu progreso se guarda en tu cuenta.", accGoogle: "Entra con Google", accPassword: "Entra con email y contraseña",
      accDelete: "Borrar mi cuenta", accDeleteText: "Se borran tu cuenta, tus sesiones y tu progreso guardado. No se puede deshacer.",
      accConfirm: "Sí, borrar todo", accCancel: "Cancelar", accDeleted: "Tu cuenta se ha borrado.",
      footUser: "Empresa y personas ficticias. Tu progreso se guarda en tu cuenta.", privacy: "Privacidad",
      footAnon: "Empresa y personas ficticias.", backHome: "← Volver a la portada",
      about: "Qué es", help: "Ayuda", faq: "Preguntas frecuentes", terms: "Términos", report: "Informar de un error", cookies: "Preferencias de cookies", navHelp: "Ayuda", accHelp: "¿Algo no funciona o tienes una idea para un ticket?",
      navLabel: "Mesa de soporte", deskName: "Mesa de soporte de Contoso", navTickets: "Tickets", navProgress: "Progreso", navGuides: "Guías", navAccount: "Mi cuenta", navTour: "Ver el tour",
      qTitle: "Cola de tickets", shift: "Turno de mañana · de guardia", tabOpen: "Abiertos", tabClosed: "Cerrados",
      colTicket: "Ticket", colSubject: "Asunto", colRequester: "Solicitante", colPriority: "Prioridad", colStatus: "Estado", colAssignee: "Asignado a",
      colResult: "Resultado", colPoints: "Puntuación", colDate: "Cerrado el", colTopic: "Tema", colBest: "Mejor resultado",
      status: { new: "Nuevo", progress: "En curso", "pending-user": "Pendiente del usuario", "pending-vendor": "Pendiente del proveedor", closed: "Cerrado" }, unassigned: "Sin asignar", replay: "Repetir",
      lvl: { resolved: "Resuelto", observations: "Resuelto con observaciones", unresolved: "No resuelto" },
      slaTarget: (m) => `${m} min`, slaLeft: (m) => `quedan ${m}`, slaOver: (m) => `vencido hace ${m} min`,
      slaPausedShort: "En pausa", slaPaused: (l, p) => `En pausa · ${l} · en espera ${p}`,
      pendBtn: "Poner en espera", unassignBtn: "Desasignarme", resumeBtn: "Reanudar",
      pendTitle: "Poner el ticket en espera", pendText: "Úsalo cuando esperas al usuario o a un proveedor. El SLA se pausa hasta que lo reanudes, y el motivo queda en la actividad.",
      pendState: "Estado", pendReason: "Motivo", pendPh: "Esperando a que el usuario reinicie el portátil tras la actualización",
      pendCount: (n, m) => n >= m ? `${n} caracteres` : `${n} de ${m} caracteres como mínimo`, pendOk: "Poner en espera", pendNeedReason: (m) => `Escribe un motivo de al menos ${m} caracteres.`,
      pausedTitle: (st) => `${st}: el SLA está en pausa`, pausedText: "La consola y las acciones son de solo lectura mientras el ticket espera. Reanúdalo para seguir trabajando.",
      unassignedTitle: "Ticket sin asignar", unassignedText: (l) => `El SLA sigue corriendo (${l}). Vuelve a asignártelo para seguir donde lo dejaste.`,
      resolvePending: "Un ticket en espera no se puede resolver. Reanúdalo primero.",
      tlTitle: "Actividad", tlEmpty: "Aún no hay cambios: asígnate el ticket para empezar.", pausedUsed: (m) => `SLA en pausa: ${m} (no cuenta)`,
      dPendingTicket: (n, id) => `La cuenta de ${n} forma parte del ticket ${id}, que está en espera. Reanuda el ticket para trabajar en ella.`,
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
      pTitle: "Tu progreso", pSub: "Tu mejor resultado en cada ticket se guarda en tu cuenta. Tu racha, objetivo, insignias, artículos y respuestas de correo se quedan en este navegador.", tClosed: "Tickets cerrados", tStars: "Estrellas", tPoints: "Puntos", tAvg: "Puntuación media", notYet: "Aún no",
      tourNext: "Siguiente", tourBack: "Atrás", tourSkip: "Saltar el tour", tourDone: "Empezar el turno", tourStep: (i, n) => `${i} de ${n}`,
      navDirectory: "Directorio", navInventory: "Inventario", navNetwork: "Sala de red",
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
      iTitle: "Inventario", iSub: "Servidores, impresoras y equipos de red. El estado sigue a los tickets abiertos.", iAll: "Todo", iServers: "Servidores", iPrinters: "Impresoras", iProblems: "Con incidencia",
      colName: "Nombre", colType: "Tipo", colRole: "Función / modelo", colLocation: "Ubicación", colTickets: "Tickets", iServer: "Servidor", iPrinter: "Impresora",
      st: { ok: "Correcto", warn: "Aviso", bad: "Error" }, iNoProblem: "Nada que destacar.", iPick: "Elige una fila para ver el detalle.", iNoIssue: "Nada que destacar.",
      navMail: "Correo", navKb: "Base de conocimiento", unreadN: (n) => `${n} sin leer`,
      kbTitle: "Base de conocimiento", kbSub: "Tus propios artículos, redactados a partir de las notas de trabajo de los tickets que cerraste bien. Se guardan en este navegador.",
      kbEmptyT: "Aún no hay artículos", kbEmpty: "Se guarda un artículo cuando cierras un ticket arreglado y tu nota de trabajo incluye todo lo que pide (causa, cambio, comprobación y seguimiento). Si vuelves a cerrar el mismo ticket con una nota nueva, el artículo pasa a otra versión: v1.0, v1.1…",
      kbEmptyBtn: "Ir a la cola de tickets", kbSearch: "Buscar en los artículos", kbAll: "Todos", kbNone: "Ningún artículo coincide.", kbCount: (n) => n === 1 ? "1 artículo" : `${n} artículos`,
      colVersion: "Versión", kbDownload: "Descargar Markdown", kbPrint: "Imprimir o guardar PDF", kbBack: "← Base de conocimiento", kbReplay: "Repetir el ticket",
      kbNoArticle: "Este ticket aún no tiene artículo.", kbSaved: (v) => `Guardado en tu base de conocimiento como v${v}.`, kbSame: "Esta nota ya está en tu base de conocimiento.",
      kbOpenArticle: "Abrir el artículo", kbNotSaved: "Para guardarlo en tu base de conocimiento, la nota tiene que incluir todos los elementos: mira arriba lo que faltaba.", kbDownloaded: (f) => `Descargado ${f}.`,
      newBadge: (n) => `Insignia nueva: ${n}`,
      pTickets: "Tickets", gStreak: "Racha de días", gBest: (n) => `Mejor: ${n} ${n === 1 ? "día" : "días"}`, gToday: "Practica hoy para mantenerla.", gTodayDone: "Hoy ya has practicado.",
      gWeek: "Esta semana", gGoalLabel: "Objetivo semanal", gGoalHelp: "Tickets cerrados y ejercicios de correo respondidos, de lunes a domingo.", gGoalMet: "Objetivo cumplido. ¡Buena semana!",
      gMail: "Ejercicios de correo correctos", gKb: "Artículos de la base de conocimiento", gOpen: "Abrir",
      bTitle: "Insignias", bEarned: (d) => `Conseguida el ${d}`, bLocked: "Por conseguir", bCount: (n, m) => `${n} de ${m}`,
      mScoreTitle: "Ejercicios de correo", colMessage: "Mensaje", mNotAnswered: "Sin responder",
      res: { correct: "Correcto", partial: "Parcialmente correcto", wrong: "Incorrecto" },
      mTitle: "Correo", mSub: "El buzón de la mesa de soporte. Peticiones, avisos y algún mensaje que no es lo que parece: decide qué hacer con cada uno.",
      mInbox: "Bandeja de entrada", mPick: "Elige un mensaje para leerlo.", mFrom: "De", mTo: "Para", mCc: "CC", mDate: "Fecha",
      mHeadersShow: "Ver cabeceras", mHeadersHide: "Ocultar cabeceras", mLinks: "Enlaces", mDirectory: "Directorio",
      mDirNone: "Ninguna cuenta de contoso.local usa esta dirección.", mDirClaims: (n, a) => `Ninguna cuenta usa esta dirección. En el directorio, ${n} es ${a}.`,
      mLinkTip: "Pasa el ratón o el foco por un enlace para ver adónde lleva de verdad.", mLinkTo: (u) => `Abre: ${u}`, mLinkBlocked: (u) => `Bloqueado en la simulación. Este enlace abre: ${u}`,
      mWhat: "¿Qué haces?", mCreate: "Crear ticket desde este mensaje", mHandled: (id) => `Ticket ${id} creado desde este mensaje.`, mOpenTicket: (id) => `Abrir ${id}`,
      mClues: "Las pistas", mProcedure: "Lo que toca hacer", mRetry: "Intentarlo de nuevo", mBack: "← Bandeja de entrada", mNext: "Siguiente mensaje",
      iOs: "Sistema operativo", iOwner: "Responsable", iPatched: "Último parcheo", iQueue: "Servidor de impresión", iJobs: "Trabajos en cola", iNone: "Sin tickets.", iInDir: "Ver en el directorio",
      // v0.6a: contactar al solicitante y la nota para el usuario
      // v0.7a: la sala de red
      nTitle: "Sala de red", nSub: "Los switches de Contoso, el router de la sucursal de Valencia y el cortafuegos. Un equipo que forma parte de un ticket abierto muestra el estado de ese ticket, y su CLI trabaja sobre el ticket; fuera de los tickets, lo que cambies aquí dura mientras la página esté abierta.",
      nReset: "Restablecer la sala de red", nResetDone: "Sala de red restablecida: los equipos que no están en un ticket vuelven a estar como al empezar el turno.",
      colDevice: "Equipo", colModel: "Modelo", colMgmt: "IP de gestión", nType: { switch: "Switch", router: "Router", firewall: "Cortafuegos" },
      nTabs: { general: "General", health: "Salud", diag: "Diagnóstico" }, nPick: "Elige un equipo para ver sus detalles.",
      nModel: "Modelo", nSerial: "Número de serie", nOs: "Sistema / firmware", nLocation: "Ubicación y rack", nMgmt: "IP de gestión", nOwner: "Responsable", nRole: "Función", nSite: "Sede",
      nSites: { HQ: "Oficina central", VLC: "Sucursal de Valencia" },
      nCpu: "CPU (5 min)", nMem: "Memoria", nUptime: "Tiempo encendido", nTemp: "Temperatura", nPsu: "Fuentes de alimentación", nFans: "Ventiladores", nPorts: "Puertos activos", nPortsVal: (u, n) => `${u} de ${n}`,
      nErrDis: "Puertos en err-disabled", nNone: "Ninguno", nErrors: "Errores de interfaz", nErrorsVal: (p, c) => `${p}: ${c} CRC/FCS`, nConfig: "Configuración",
      nSaved: "Guardada (running = startup)", nUnsaved: "Cambios sin guardar (running ≠ startup)", nUnsavedShort: "Sin guardar", nSessions: "Sesiones", nPolicies: "Políticas del cortafuegos",
      nAutoSave: "Se guarda sola (FortiOS)", nHealthNote: "Leído del propio equipo: cambia con lo que hagas en la CLI o en un ticket.",
      nDiagWhat: "Prueba", nPing: "Ping", nTrace: "Traceroute", nTarget: "Destino", nTargetPh: "10.20.1.10 o erp.contoso.local", nRun: "Ejecutar", nLog: "Ver el final del registro", nDiagNote: "Se lanza desde el propio equipo. No cambia nada.",
      nOpenCli: "Abrir CLI", nCloseCli: "Cerrar la CLI", nCliTitle: (d) => `CLI · ${d}`, nCliHelp: "Escribe ? para ver los comandos de cada modo. exit cierra la sesión y te deja en tu equipo, donde ssh <equipo> abre otra. ↑/↓ repiten comandos.",
      nRouted: (id) => `(Ejecutado en el ticket ${id}: este equipo forma parte de un ticket abierto.)`, nAssignFirst: (id) => `Este equipo forma parte del ticket ${id}, aún sin asignar. Asígnate el ticket para trabajar en él.`,
      nPausedTicket: (id) => `Este equipo forma parte del ticket ${id}, que está en espera. Reanuda el ticket para trabajar en él.`, nReadyRoom: (id) => `El ticket ${id} está listo para cerrar.`, nOpenTicket: "Abrir el ticket",
      iNetwork: "Red", iInRoom: "Abrir en la sala de red",
      // v0.7b: envíos y RMA
      navShipping: "Envíos", shTitle: "Envíos y RMA", shSub: "RMA a fabricante, envíos a usuarios, devoluciones de equipos y préstamos, con un reloj simulado y seguimiento. Cada botón ejecuta un comando ship.",
      shNew: "Nuevo envío", shList: "Envíos", shNone: "Todavía no hay envíos. Crea uno con el formulario o desde un ticket que lo necesite.",
      shColId: "Envío", shColTicket: "Ticket", shColType: "Tipo", shColAsset: "Equipo", shColState: "Estado", shColTracking: "Seguimiento", shPractice: "Práctica (sin ticket)",
      shPick: "Elige un envío para ver su seguimiento.", shTicketLabel: "Ticket", shTicketNone: "Práctica, sin ticket", shType: "Tipo", shAsset: "Equipo (número de serie del inventario)",
      shVendor: "Fabricante", shVendorNone: "Ninguno", shFault: "Descripción de la avería", shFaultPh: "Qué falla, desde cuándo, qué has probado", shEvidence: "Evidencias adjuntas",
      shEvidencePh: "Código de diagnóstico, línea de log, foto… separadas por comas", shContract: "Contrato de soporte o garantía", shCarrier: "Transportista", shFrom: "Recogida en", shTo: "Entrega en",
      shData: "Tratamiento de datos (portátiles)", shDataPick: "Elige…", shEscrow: "Clave de recuperación de BitLocker comprobada en Entra ID antes de que salga", shItems: "Lista (devoluciones)",
      shCreate: "Crear borrador", shCreated: (id) => `${id} creado como borrador. Revísalo y pulsa Solicitar.`, shCmd: "Comando:",
      shSubmit: "Solicitar", shAdvance: (st) => `Siguiente paso: ${st}`, shLost: "Avisar de pérdida", shDamaged: "Avisar de daños", shClose: "Cerrar el envío",
      shRma: "Número de RMA", shTracking: "Seguimiento", shEvents: "Eventos de seguimiento", shNoTicket: "Envío de práctica: sin ticket y sin SLA.",
      shNeedAssign: (id) => `El ticket ${id} no está asignado a ti: asígnatelo para trabajar en sus envíos.`, shPaused: "El ticket está pendiente: el tiempo del envío no cuenta para el SLA.",
      shRunning: "El ticket está en curso: el tiempo de cada paso del envío cuenta para el SLA. Ponlo en Pendiente del proveedor mientras esperas.",
      shCost: (h) => `+${h} de SLA`, shFree: "SLA en pausa", shTicketShips: "Envíos de este ticket", shOpenAll: "Abrir en Envíos", shNewForTicket: "Nuevo envío para este ticket",
      shTl: (id, st) => `Envío ${id}: ${st}`, shWarn: "Avisos", shMissing: "Falta antes de poder solicitarlo:", shDeviceNote: "Estado del equipo en el inventario:",
      shPracticeReset: "Borrar los envíos de práctica", shRan: "Envíos:", shNoTicketShips: "Este ticket todavía no tiene envíos.",
      iEndpoints: "Equipos", iEndpoint: { laptop: "Portátil", phone: "Móvil", part: "Pieza" }, iSerial: "Número de serie", iUser: "Asignado a", iWarranty: "Garantía / contrato",
      iDevState: "Estado", iShipments: "Envíos", iToShipping: "Abrir en Envíos",
      netWelcome: "Equipos de red: ssh SW-CORE-01, SW-ACC-2F, SW-ACC-1F, RTR-VLC-01 o FGT-HQ-01. exit cierra la sesión. onsite: lo que se puede hacer en el sitio.",
      cContact: "Contactar al solicitante", cOff: { unassigned: "Asígnate el ticket para contactar al solicitante.", pending: "El ticket está en espera: reanúdalo para contactar al solicitante.", closed: "" },
      cTitle: (n) => `Conversación con ${n}`, cIntro: "Elige una pregunta. Cada una consume 1 minuto del SLA. Unas ayudan, otras no, y algunas son mala práctica.",
      cQuestions: "¿Qué preguntas?", cCost: "+1 min", cNoMore: "No quedan preguntas por ahora.", cConfirmLater: "Cuando hayas aplicado un arreglo, podrás pedirle que confirme que funciona.",
      cClose: "Cerrar la conversación", cYou: "Tú", cBad: "Mala práctica", cPassword: "Nunca pidas una contraseña", cClueAdded: "Añadido a Lo que sabes",
      cConfirm: "Pedir confirmación", cOk: "Confirmado: funciona", cFailed: "Sigue fallando", cTimeAdded: (n) => `Hablando con el solicitante: +${n} min de SLA`,
      cVia: (n, tm) => `Hablarás con ${n} (${tm}).`, kTitle: "Lo que sabes", kNone: "Aún nada del solicitante.",
      tlContact: "Contacto", tlContactQ: (q) => `Contacto: ${q}`,
      uNote: "Nota para el usuario", uHelp: "Lo que leerá el solicitante: qué pasaba, con palabras sencillas, y qué tiene que hacer (o que no tiene que hacer nada). Sin nombres de servidores, cuentas de administración ni contraseñas. Parte de una plantilla y sustituye cada [hueco].",
      uTemplates: "Insertar una plantilla:", uPh: "Hola …:", uLive: (n) => `Nota para el usuario: ${n}/5 por ahora`,
      mWork: "Nota de trabajo", mUser: "Nota al usuario", mUserNone: "sin escribir",
      commsT: "Comunicación", commsBonus: (n) => `Bonus de comunicación: +${n} (aparte de la puntuación del ticket)`,
      commsCredit: { note: (p) => `Nota para el usuario, +${p}`, questions: (n, p) => `${n === 1 ? "Una pregunta útil" : n + " preguntas útiles"} y ninguna inadecuada, +${p}`, confirmed: (p) => `El solicitante confirmó que funciona, +${p}` },
      commsRemark: { "no-note": "Sin nota para el usuario: no sabe qué ha pasado ni qué tiene que hacer.", password: "Pediste una contraseña al solicitante: nunca se hace, tampoco desde IT.",
        bad: (n) => n === 1 ? "Una pregunta fue mala práctica (dirigida, culpabilizadora o con jerga)." : `${n} preguntas fueron mala práctica (dirigidas, culpabilizadoras o con jerga).` },
      gComms: "Comunicación", gCommsX: (u, a) => `${u} ${u === 1 ? "pregunta útil" : "preguntas útiles"} · media de la nota al usuario ${a == null ? "–" : a + "/5"}`,
      land: {
        tag: "Simulador de soporte IT · gratis", title: "SysAdmin Desks",
        lead: "Practica el trabajo de un técnico de soporte en el navegador. Coge un ticket de una empresa ficticia, investiga en una consola que responde como un equipo de verdad, arregla la causa, demuestra que funciona y escribe la nota de trabajo. Gratis, con tu propia cuenta y sin instalar nada.",
        cta: "Empieza gratis", how: "Cómo funciona", guides: "Guías",
        newTicket: "Nuevo ticket", heroTicket: "Internet funciona, la intranet no",
        sections: [
          { k: "01 · Lee el ticket", h: "Tickets reales,\nuna mesa de soporte.",
            p: "Veintiún tickets de primera y segunda línea: un usuario que se bloquea cada mañana, una incorporación sin Outlook, una VPN que no conecta desde casa, un puesto cuyo puerto ha apagado el switch, una copia que falla cada noche, un ERP que no puede guardar. Cada uno llega con el usuario, la prioridad y lo que tienes para trabajar.",
            chips: ["Active Directory", "Microsoft 365", "Windows", "VPN", "Veeam", "Citrix", "Linux", "SQL Server", "Cisco", "FortiGate"] },
          { k: "02 · Investiga", h: "Una consola que responde\ncomo un equipo de verdad.",
            p: "Escribe los comandos que usarías en el trabajo, en PowerShell o cmd: Get-ADUser, Get-WinEvent, ipconfig, nslookup, Get-Printer, Get-Mailbox y más. La salida cambia según lo que haces. Pistas cuando te atascas, y un arreglo tentador que parece bueno pero no resuelve el ticket.",
            chips: ["PowerShell y cmd", "CLI de Cisco IOS, HP y FortiOS", "Directorio, escritorio y sala de red simulados", "Pistas", "El arreglo tentador"] },
          { k: "03 · Arregla y compruébalo", h: "Arregla la causa,\nno solo el síntoma.",
            p: "Cada puesto tiene su checklist: encontrar la causa, arreglarla y comprobar que sigue arreglado. El ticket solo se cierra cuando lo has demostrado, como en un turno real, donde desbloquear otra vez la cuenta no sirve si la contraseña antigua sigue guardada en algún sitio.",
            chips: ["Investigar", "Arreglar", "Verificar"] },
          { k: "04 · Escribe la nota", h: "La nota que el siguiente\ntécnico te agradecerá.",
            p: "Cierra el ticket con una nota de trabajo: causa, cambio, comprobación y seguimiento. Se puntúa, ves lo que faltaba y una nota de ejemplo, y cada puesto enlaza con su guía paso a paso. Tu progreso se guarda en tu cuenta y te sigue a cualquier equipo.",
            chips: ["Notas puntuadas", "Guías paso a paso", "Progreso en tu cuenta"] },
        ],
        endK: "05 · Empieza tu turno", endH: "¿Listo para tu primer turno?", endP: "Crea una cuenta gratis y coge tu primer ticket. Entra con email o con Google.",
        footBlurb: "Práctica real de soporte IT con tickets realistas, una consola simulada y notas de trabajo puntuadas.",
        colDesks: "Puestos", colGuides: "Guías", colProject: "Proyecto", colHelp: "Ayuda",
        guideLinks: [["Todas las guías", "guias.html"], ["Nivel 1: primeros pasos", "guias/nivel-1.html"], ["Nivel 2: base sólida", "guias/nivel-2.html"], ["Nivel 3: avanzado", "guias/nivel-3.html"], ["Nivel 4: experto", "guias/nivel-4.html"]],
        projectLinks: [["Sobre mí", "about.html"], ["Blog", "blog/"], ["Contacto", "about.html#contacto"]],
        legal: "Simulación educativa con empresa y personas ficticias. No es acceso real a sistemas.",
        t1: ["La cuenta que se bloquea cada mañana", "P2"], t2: ["La cola de la impresora no se vacía", "P2"], t3: ["Rebotan los correos de clientes", "P1"],
        noteTitle: "Nota de trabajo", noteText: "Causa: tarea programada con una contraseña antigua en FS-SCAN01…", score: "100 puntos", resolved: "Resuelto", stagesDemo: ["Encontrar el origen de los bloqueos", "Quitar la causa y desbloquear", "Comprobar que sigue desbloqueada"],
      },
    },
  };

  /* ---------- v0.8: learning (library, labs, profile and career) and the guided first ticket */
  Object.assign(UI.en, {
    navLibrary: "Library", navLabs: "Labs", navProfile: "Profile and career",
    libTitle: "Library", libSub: "One short reference per area: what it is, the commands you use in this simulator, common causes and where to practise it. No ticket is given away.",
    libSearch: "Search the library (a command, a word…)", libCount: (n) => `${n} article${n === 1 ? "" : "s"}`, libNone: "No article matches. Try a command (journalctl) or a word (licence).",
    libTickets: "Public list of every ticket", libBack: "← Library", libKicker: "Library", libWhat: "What it is", libTools: "Commands and tools in the simulator",
    libCmd: "Command or tool", libGives: "What it tells you", libWhere: "Where", libCauses: "Common causes", libTips: "Good practice", libDesks: "Practise it in these tickets",
    libLabs: "Practise it in a lab", libGuides: "Step-by-step guides (on my website)", libNoLab: "No lab for this area yet: the tickets are the practice.",
    libPlace: { ad: "Directory · AD lab", lab: (x) => x, desk: (x) => x, device: (x) => `${x} (network room · network lab)`, page: (x) => x },
    libDownload: "Download Markdown", libNotSpoiler: "This page teaches the area; it does not say what is wrong in any ticket.",
    libSolved: "Solved", libOpen: "Open", libOneArticle: "Library article", labTasks: (d, n) => `${d}/${n} tasks`,
    labsTitle: "Labs", labsSub: "Free practice by area: a console and a few guided tasks that tick themselves. No SLA, no score, and nothing here changes the tickets.",
    labOpen: "Open the lab", labContinue: "Continue", labDone: "Completed", labBack: "← Labs", labNoPressure: "No SLA and no score: try, get it wrong, try again.",
    labTasksT: "Tasks", labHow: "Show how", labReset: "Reset the lab", labResetDone: "Lab reset: a fresh copy and no tasks done.", labConsole: (x) => `Lab console · ${x}`,
    labWelcome: "A copy for practice: nothing here reaches the tickets, the Directory or the network room. Type help to start.",
    labTaskDone: (x) => `✓ Task done: ${x}`, labComplete: "Lab completed. Well done!", labRead: "Read about it in the library",
    labHelp: "Type the commands you would use at work. ↑/↓ repeat commands.", labStored: "Your progress in the labs is kept in this browser.",
    pfTitle: "Profile and career", pfSub: "Your practice by area and the path from first-line support to infrastructure, from your results in this browser and your account.",
    pfSolved: "Tickets solved", pfAvg: "Average score", pfComms: "Note to the user (average)", pfLabs: "Labs completed",
    pfSkills: "Practice by area", pfSkillsNote: "Practice level: three quarters the area's tickets solved and one quarter its lab's tasks; areas without a lab count only tickets; the service desk process is the average mark of your notes to the user.",
    pfRadar: "Practice level by area, from 0 to 100", pfAreas: "By area", colArea: "Area", colTickets: "Tickets", colAvg: "Average", colComms: "Note to the user", colLabTasks: "Lab tasks", colLevel: "Level",
    pfCareer: "Career path", pfCareerSub: "A simple path, not a job description: each step lists the tickets and labs that practise it.",
    pfStepDone: "Done", pfStepNow: "You are here", pfStepLater: "Next", pfNext: "Recommended next step", pfNextDesk: (x) => `Solve the ticket «${x}»`, pfNextLab: (x) => `Complete the ${x}`,
    pfNextGo: "Go", pfAllDone: "Every step is done: replay the tickets to improve your scores, or try them in the other language.",
    pfExport: "Summary of your practice", pfExportText: "A Markdown file with your results by area, the tickets you solved, the labs and the career path. It says clearly that it is practice in a simulator, not work experience.",
    pfExportBtn: "Download summary (Markdown)", pfDownloaded: (f) => `Downloaded ${f}.`, pfLabel: "Practice in a simulator, not work experience.",
    tourGuided: [
      ["Your first shift", "Let's work one ticket together, from the queue to the note. It takes three minutes; skip it whenever you want and take it again from the sidebar."],
      ["The sidebar", "Everything you need: the ticket queue, mail, the Directory, the inventory and the network room, shipments, your knowledge base, the library, the labs, your progress and your profile."],
      ["The queue", "Every row is a ticket from a user of the fictional company Contoso, with its priority, its SLA and its state."],
      ["Open a ticket", "Start with this one. Next opens it for you."],
      ["Assign it to yourself", "Press Assign to me: the SLA starts (20 min for a P1, 30 for a P2, 45 for a P3) and the console unlocks. Go ahead, the tour waits."],
      ["The console", "Investigate with the commands you would use at work. help lists the basics and hint gives a hint (it costs 10 points). The checklist on the left ticks itself as you go."],
      ["Resolve", "When the cause is gone and you have proved it, pick the resolution code and write the work note: cause, what you changed, how you checked it and what is left."],
      ["The note to the user", "What the requester reads: plain words, what was wrong and what they need to do. The templates help; it is marked apart from the score."],
      ["Learn and practise", "Stuck? The library explains each area, the labs let you practise without an SLA, and your profile shows your progress by area and the next step. Good shift!"],
    ],
    tourWait: "Assign the ticket to see this part, or press Next.",
    newTitle: "New in 0.9", newText: "0.9a: your work survives a reload (a ticket's console, the network room and the labs), a fuller mailbox (folders, replies, report as spam), Preferences in My account (reminder, sounds, time zone, reduced motion), a folding sidebar, full screen on the user's desktop and free tickets you log yourself. 0.9b: levels from Support intern to Infrastructure engineer with a progress bar, three weekly goals with rewards, clean / with observations / false closure counters, badges by area and a Full shift at the end of each lab.",
    newGot: "Got it",
  });
  Object.assign(UI.es, {
    navLibrary: "Biblioteca", navLabs: "Laboratorios", navProfile: "Perfil y carrera",
    libTitle: "Biblioteca", libSub: "Una referencia corta por área: qué es, los comandos que usas en este simulador, causas habituales y dónde practicarlo. No destripa ningún ticket.",
    libSearch: "Busca en la biblioteca (un comando, una palabra…)", libCount: (n) => `${n} artículo${n === 1 ? "" : "s"}`, libNone: "Ningún artículo coincide. Prueba con un comando (journalctl) o una palabra (licencia).",
    libTickets: "Lista pública de todos los tickets", libBack: "← Biblioteca", libKicker: "Biblioteca", libWhat: "Qué es", libTools: "Comandos y herramientas en el simulador",
    libCmd: "Comando o herramienta", libGives: "Qué te dice", libWhere: "Dónde", libCauses: "Causas habituales", libTips: "Buenas prácticas", libDesks: "Practícalo en estos tickets",
    libLabs: "Practícalo en un laboratorio", libGuides: "Guías paso a paso (en mi web)", libNoLab: "Esta área aún no tiene laboratorio: la práctica son los tickets.",
    libPlace: { ad: "Directorio · laboratorio de AD", lab: (x) => x, desk: (x) => x, device: (x) => `${x} (sala de red · laboratorio de red)`, page: (x) => x },
    libDownload: "Descargar Markdown", libNotSpoiler: "Esta página enseña el área; no dice qué falla en ningún ticket.",
    libSolved: "Resuelto", libOpen: "Abierto", libOneArticle: "Artículo de la biblioteca", labTasks: (d, n) => `${d}/${n} tareas`,
    labsTitle: "Laboratorios", labsSub: "Práctica libre por área: una consola y unas pocas tareas guiadas que se marcan solas. Sin SLA, sin puntuación, y nada de aquí cambia los tickets.",
    labOpen: "Abrir el laboratorio", labContinue: "Continuar", labDone: "Completado", labBack: "← Laboratorios", labNoPressure: "Sin SLA ni puntuación: prueba, equivócate y vuelve a probar.",
    labTasksT: "Tareas", labHow: "Ver cómo", labReset: "Reiniciar el laboratorio", labResetDone: "Laboratorio reiniciado: una copia nueva y ninguna tarea hecha.", labConsole: (x) => `Consola del laboratorio · ${x}`,
    labWelcome: "Una copia para practicar: nada de aquí llega a los tickets, al Directorio ni a la sala de red. Escribe help para empezar.",
    labTaskDone: (x) => `✓ Tarea hecha: ${x}`, labComplete: "Laboratorio completado. ¡Bien hecho!", labRead: "Léelo en la biblioteca",
    labHelp: "Escribe los comandos que usarías en el trabajo. ↑/↓ repite comandos.", labStored: "Tu progreso en los laboratorios se guarda en este navegador.",
    pfTitle: "Perfil y carrera", pfSub: "Tu práctica por área y el camino del soporte de primera línea a la infraestructura, con tus resultados de este navegador y de tu cuenta.",
    pfSolved: "Tickets resueltos", pfAvg: "Puntuación media", pfComms: "Nota al usuario (media)", pfLabs: "Laboratorios completados",
    pfSkills: "Práctica por área", pfSkillsNote: "Nivel de práctica: tres cuartas partes los tickets resueltos del área y una cuarta parte las tareas de su laboratorio; las áreas sin laboratorio cuentan solo los tickets; el proceso de service desk es la nota media de tus notas para el usuario.",
    pfRadar: "Nivel de práctica por área, de 0 a 100", pfAreas: "Por área", colArea: "Área", colTickets: "Tickets", colAvg: "Media", colComms: "Nota al usuario", colLabTasks: "Tareas de laboratorio", colLevel: "Nivel",
    pfCareer: "Itinerario profesional", pfCareerSub: "Un camino sencillo, no una descripción de puesto: cada paso indica los tickets y laboratorios que lo practican.",
    pfStepDone: "Hecho", pfStepNow: "Estás aquí", pfStepLater: "Después", pfNext: "Siguiente paso recomendado", pfNextDesk: (x) => `Resuelve el ticket «${x}»`, pfNextLab: (x) => `Completa el ${x.charAt(0).toLowerCase() + x.slice(1)}`,
    pfNextGo: "Ir", pfAllDone: "Todos los pasos están hechos: repite los tickets para mejorar tus puntuaciones o pruébalos en el otro idioma.",
    pfExport: "Resumen de tu práctica", pfExportText: "Un archivo Markdown con tus resultados por área, los tickets resueltos, los laboratorios y el itinerario. Dice claramente que es práctica en un simulador, no experiencia laboral.",
    pfExportBtn: "Descargar resumen (Markdown)", pfDownloaded: (f) => `Descargado ${f}.`, pfLabel: "Práctica en un simulador, no experiencia laboral.",
    tourGuided: [
      ["Tu primer turno", "Vamos a trabajar un ticket juntos, de la cola a la nota. Son tres minutos; sáltalo cuando quieras y repítelo desde la barra lateral."],
      ["La barra lateral", "Todo lo que necesitas: la cola de tickets, el correo, el Directorio, el inventario y la sala de red, los envíos, tu base de conocimiento, la biblioteca, los laboratorios, tu progreso y tu perfil."],
      ["La cola", "Cada fila es un ticket de un usuario de la empresa ficticia Contoso, con su prioridad, su SLA y su estado."],
      ["Abre un ticket", "Empieza por este. Siguiente lo abre por ti."],
      ["Asígnatelo", "Pulsa Asignarme: empieza el SLA (20 min para una P1, 30 para una P2, 45 para una P3) y se activa la consola. Adelante, el tour te espera."],
      ["La consola", "Investiga con los comandos que usarías en el trabajo. help muestra lo básico y hint da una pista (cuesta 10 puntos). La lista de la izquierda se marca sola según avanzas."],
      ["Resolver", "Cuando la causa ya no esté y lo hayas comprobado, elige el código de resolución y escribe la nota de trabajo: causa, qué cambiaste, cómo lo comprobaste y qué queda."],
      ["La nota para el usuario", "Lo que lee el solicitante: palabras sencillas, qué pasaba y qué tiene que hacer. Las plantillas ayudan; se evalúa aparte de la puntuación."],
      ["Aprende y practica", "¿Atascado? La biblioteca explica cada área, los laboratorios te dejan practicar sin SLA y tu perfil muestra tu progreso por área y el siguiente paso. ¡Buen turno!"],
    ],
    tourWait: "Asígnate el ticket para ver esta parte, o pulsa Siguiente.",
    newTitle: "Novedades de la 0.9", newText: "0.9a: tu trabajo sobrevive a una recarga (la consola de un ticket, la sala de red y los laboratorios), un correo más completo (carpetas, respuestas, reportar como spam), Preferencias en Mi cuenta (recordatorio, sonidos, zona horaria, menos movimiento), barra lateral plegable, pantalla completa en el escritorio del usuario y tickets libres que registras tú. 0.9b: niveles de Becario/a de soporte a Ingeniero/a de infraestructura con barra de progreso, tres objetivos semanales con recompensa, contadores de cierres limpios / con observaciones / en falso, insignias por área y un Turno completo al final de cada laboratorio.",
    newGot: "Entendido",
  });

  /* ---------- v0.9: persistence after a reload, the fuller mailbox, preferences, the folding sidebar, the desk's taskbar and free tickets */
  Object.assign(UI.en, {
    sideFold: "Fold the sidebar", sideUnfold: "Unfold the sidebar",
    // the desktop: taskbar, full screen and leaving the desk
    pcFull: "Full screen", pcFullExit: "Exit full screen", pcLeave: "Leave the desk", pcWindows: "Open windows", pcClock: (z) => `Time zone: ${z}`,
    pcMin: "Minimise", pcRestore: (x) => `Show ${x}`,
    slaDue: (h) => `due ${h}`, slaDueTitle: (z) => `Time zone: ${z} (My account → Preferences)`,
    restored: "Restored after the reload: your console, the devices and the shipments are as you left them.",
    // mail
    mFolders: "Folders", mCompose: "New message", mStar: "Star", mUnstar: "Remove star", mArchive: "Archive", mToInbox: "Move to Inbox",
    mReport: "Report as spam / phishing", mNotSpam: "Not spam", mReply: "Reply", mReplyTo: (a) => `To: ${a} (the Reply-To)`,
    mReported: (r) => `Moved to Spam and reported to security. Exercise: ${r}.`, mArchived: "Archived.", mMoved: "Moved to the Inbox.",
    mEmptyFolder: "Nothing in this folder.", mSentEmpty: "You have not sent anything yet.", mTemplates: "Templates", mReplyPh: "Write your reply…",
    mSend: "Send", mCancel: "Cancel", mSentOk: "Sent. You can find it in Sent.", mErr: { empty: "Write at least 10 characters.", gaps: "Replace the [gaps] first.", to: "Pick a contact from the list.", subject: "Write a subject." },
    mFlags: { "phish-reply": "Bad practice: you replied to a phishing or impersonation email. The reply went to the attacker's Reply-To and confirms the mailbox is read. Report it instead.",
      password: "Bad practice: this message contains a password. Passwords are never sent by email.", secret: "Bad practice: this message contains a verification code. Codes are never shared." },
    mNewTitle: "New message", mToLabel: "To", mSubject: "Subject", mBody: "Message", mPickContact: "Pick a contact", mContactsNote: "Fictional internal contacts: the team mailboxes and the people in the directory.",
    mSentTitle: "Sent message", mRepliesSent: (n) => `You have replied ${n === 1 ? "once" : n + " times"}.`, mLintLive: "Careful:",
    // preferences
    prTitle: "Preferences", prSub: "Kept in this browser only.", prReminder: "Daily practice reminder", prReminderOn: "Remind me to practise every day",
    prReminderAt: "At", prNotify: "Also with a browser notification (while the site is open)", prNotifyDenied: "The browser did not allow notifications: the reminder stays as a banner.",
    prNotifyNo: "This browser has no notifications: the reminder stays as a banner.", prSounds: "Celebration sounds", prSoundsOn: "Play a short sound when you solve a ticket, earn a badge or finish a lab task",
    prTest: "Try it", prZone: "Time zone", prZoneAuto: (z) => `Automatic (this browser: ${z})`, prZoneNow: (h, o) => `Now: ${h} (${o}). Used for the SLA due time, the timelines, the desk clock and the days of your streak.`,
    prMotion: "Reduce motion", prMotionOn: "Fewer animations and no smooth scrolling", prMotionSys: "Your system already asks for reduced motion.",
    prSaved: "Saved.", prData: "Work kept in this browser", prDataText: "Tickets in progress keep their console, the network room its changes and the labs their sandbox after a reload. This clears all of that (the tickets stay assigned; your results are not touched).",
    prDataBtn: "Clear saved work", prDataDone: "Saved work cleared.",
    remTitle: "Time to practise", remText: "Your daily practice: one ticket, one lab task or one email is enough to keep your streak.", remGo: "Open the queue", remLater: "Not today",
    notifTitle: "SysAdmin Desks", notifText: "Your daily practice is waiting: one ticket keeps your streak.",
    // free tickets
    ftNew: "New ticket", ftNewTitle: "Log a free ticket", ftNewSub: "A practice ticket of your own: it has an SLA, states, notes and a closure, but no automatic grading and it does not count in your scores.",
    ftSubject: "Subject", ftRequester: "Requester", ftPriority: "Priority", ftCategory: "Category", ftDesc: "Description", ftPick: "Pick one",
    ftCreate: "Create ticket", ftCancel: "Cancel", ftFree: "free ticket", ftFreeLong: "Free ticket · not graded",
    ftErr: { subject: "Write a subject (5+ characters).", requester: "Pick a requester from the directory.", priority: "Pick a priority.", category: "Pick a category.", description: "Describe the problem (10+ characters).", full: "You have too many free tickets open." },
    ftNotes: "Work notes", ftNotePh: "What you did or found…", ftAddNote: "Add note", ftNoNotes: "No notes yet.", ftNoteShort: "Write at least 5 characters.",
    ftClose: "Close the ticket", ftCloseText: "Pick a code and write how it was solved. A free ticket is not graded.", ftCode: "Resolution code", ftCloseNote: "Resolution", ftCloseBtn: "Close ticket",
    ftCloseErr: { code: "Pick a resolution code.", note: "Write the resolution (10+ characters).", state: "Resume the ticket first." },
    ftClosed: (m, sla) => `Closed in ${m} min of SLA (${sla} min). No score: free tickets do not count.`, ftDelete: "Delete this free ticket", ftDeleted: "Free ticket deleted.",
    ftNoScore: "—", ftDescT: "Description", ftOpen: "Open",
  });
  Object.assign(UI.es, {
    sideFold: "Plegar la barra lateral", sideUnfold: "Desplegar la barra lateral",
    pcFull: "Pantalla completa", pcFullExit: "Salir de pantalla completa", pcLeave: "Salir del puesto", pcWindows: "Ventanas abiertas", pcClock: (z) => `Zona horaria: ${z}`,
    pcMin: "Minimizar", pcRestore: (x) => `Mostrar ${x}`,
    slaDue: (h) => `vence a las ${h}`, slaDueTitle: (z) => `Zona horaria: ${z} (Mi cuenta → Preferencias)`,
    restored: "Recuperado tras la recarga: tu consola, los equipos y los envíos están como los dejaste.",
    mFolders: "Carpetas", mCompose: "Redactar", mStar: "Destacar", mUnstar: "Quitar destacado", mArchive: "Archivar", mToInbox: "Mover a la bandeja de entrada",
    mReport: "Reportar como spam / phishing", mNotSpam: "No es spam", mReply: "Responder", mReplyTo: (a) => `Para: ${a} (el Reply-To)`,
    mReported: (r) => `Movido a Spam y reportado a seguridad. Ejercicio: ${r}.`, mArchived: "Archivado.", mMoved: "Movido a la bandeja de entrada.",
    mEmptyFolder: "No hay nada en esta carpeta.", mSentEmpty: "Todavía no has enviado nada.", mTemplates: "Plantillas", mReplyPh: "Escribe tu respuesta…",
    mSend: "Enviar", mCancel: "Cancelar", mSentOk: "Enviado. Lo tienes en Enviados.", mErr: { empty: "Escribe al menos 10 caracteres.", gaps: "Sustituye antes los [huecos].", to: "Elige un contacto de la lista.", subject: "Escribe un asunto." },
    mFlags: { "phish-reply": "Mala práctica: has respondido a un correo de phishing o de suplantación. La respuesta ha ido al Reply-To del atacante y le confirma que el buzón se lee. Lo correcto es reportarlo.",
      password: "Mala práctica: este mensaje contiene una contraseña. Las contraseñas no se envían nunca por correo.", secret: "Mala práctica: este mensaje contiene un código de verificación. Los códigos no se comparten nunca." },
    mNewTitle: "Mensaje nuevo", mToLabel: "Para", mSubject: "Asunto", mBody: "Mensaje", mPickContact: "Elige un contacto", mContactsNote: "Contactos internos ficticios: los buzones de equipo y las personas del directorio.",
    mSentTitle: "Mensaje enviado", mRepliesSent: (n) => `Has respondido ${n === 1 ? "una vez" : n + " veces"}.`, mLintLive: "Cuidado:",
    prTitle: "Preferencias", prSub: "Se guardan solo en este navegador.", prReminder: "Recordatorio diario de práctica", prReminderOn: "Recordarme practicar cada día",
    prReminderAt: "A las", prNotify: "También con una notificación del navegador (con la web abierta)", prNotifyDenied: "El navegador no ha permitido las notificaciones: el recordatorio se queda como aviso en la página.",
    prNotifyNo: "Este navegador no tiene notificaciones: el recordatorio se queda como aviso en la página.", prSounds: "Sonidos de celebración", prSoundsOn: "Un sonido corto al resolver un ticket, ganar una insignia o terminar una tarea de laboratorio",
    prTest: "Probar", prZone: "Zona horaria", prZoneAuto: (z) => `Automática (este navegador: ${z})`, prZoneNow: (h, o) => `Ahora: ${h} (${o}). Se usa para la hora de vencimiento del SLA, las actividades, el reloj del puesto y los días de tu racha.`,
    prMotion: "Reducir el movimiento", prMotionOn: "Menos animaciones y sin desplazamiento suave", prMotionSys: "Tu sistema ya pide reducir el movimiento.",
    prSaved: "Guardado.", prData: "Trabajo guardado en este navegador", prDataText: "Los tickets en curso conservan su consola, la sala de red sus cambios y los laboratorios su entorno después de recargar. Esto lo borra todo (los tickets siguen asignados; tus resultados no se tocan).",
    prDataBtn: "Borrar el trabajo guardado", prDataDone: "Trabajo guardado borrado.",
    remTitle: "Hora de practicar", remText: "Tu práctica diaria: con un ticket, una tarea de laboratorio o un correo mantienes la racha.", remGo: "Abrir la cola", remLater: "Hoy no",
    notifTitle: "SysAdmin Desks", notifText: "Tu práctica diaria te espera: con un ticket mantienes la racha.",
    ftNew: "Crear ticket", ftNewTitle: "Registrar un ticket libre", ftNewSub: "Un ticket de práctica tuyo: tiene SLA, estados, notas y cierre, pero no se corrige automáticamente ni cuenta en tus puntuaciones.",
    ftSubject: "Asunto", ftRequester: "Solicitante", ftPriority: "Prioridad", ftCategory: "Categoría", ftDesc: "Descripción", ftPick: "Elige uno",
    ftCreate: "Crear ticket", ftCancel: "Cancelar", ftFree: "ticket libre", ftFreeLong: "Ticket libre · sin corrección",
    ftErr: { subject: "Escribe un asunto (5 caracteres o más).", requester: "Elige un solicitante del directorio.", priority: "Elige una prioridad.", category: "Elige una categoría.", description: "Describe el problema (10 caracteres o más).", full: "Tienes demasiados tickets libres abiertos." },
    ftNotes: "Notas de trabajo", ftNotePh: "Qué has hecho o encontrado…", ftAddNote: "Añadir nota", ftNoNotes: "Todavía no hay notas.", ftNoteShort: "Escribe al menos 5 caracteres.",
    ftClose: "Cerrar el ticket", ftCloseText: "Elige un código y escribe cómo se resolvió. Un ticket libre no se corrige.", ftCode: "Código de resolución", ftCloseNote: "Resolución", ftCloseBtn: "Cerrar ticket",
    ftCloseErr: { code: "Elige un código de resolución.", note: "Escribe la resolución (10 caracteres o más).", state: "Reanuda antes el ticket." },
    ftClosed: (m, sla) => `Cerrado con ${m} min de SLA (${sla} min). Sin puntuación: los tickets libres no cuentan.`, ftDelete: "Eliminar este ticket libre", ftDeleted: "Ticket libre eliminado.",
    ftNoScore: "—", ftDescT: "Descripción", ftOpen: "Abrir",
  });

  /* ---------- v0.9b: levels, weekly goals, close counters, badges by area and the labs' full shift (levels.js) */
  Object.assign(UI.en, {
    lvChip: (l) => `Level: ${l.name}, ${l.total} points` + (l.next ? `, ${l.toNext} to ${l.next.name}` : ""),
    lvTitle: "Your level", lvPoints: (n) => `${n} points`, lvNext: (n, name) => `${n} points to ${name}`, lvTop: "Top level: well done.",
    lvBreak: (p) => `Tickets ${p.tickets} · Labs ${p.labs} · Communication ${p.comms} · Weekly goals ${p.goals} · Full shifts ${p.shifts}`,
    lvHow: "Points: the best result of each ticket (a replay counts only if it beats it), 10 per lab task, the best communication bonus of each ticket, the weekly goals' rewards and each lab's first full shift. Free tickets never count.",
    lvLadder: "The levels", lvFrom: (n) => `from ${n}`, lvUpTitle: "New level!", lvUpText: (n) => `You are now ${n}. Keep it up.`, lvUpOk: "Great",
    ccTitle: "How you close tickets", ccClean: "Clean closes", ccCleanX: "Resolved the first time, with no remarks", ccRemarks: "With observations", ccRemarksX: "Resolved with observations to improve",
    ccFalse: "False closures", ccFalseX: "Closing attempts before it was fixed (Not resolved)",
    wgTitle: "This week's goals", wgSub: (w) => `Three goals for ${w}, the same for everyone. They change on Monday at 00:00 in your time zone; each reward counts once.`,
    wgReward: (n) => `+${n} points`, wgDone: (d) => `Done · ${d}`, wgOpen: "To do", wgHistory: "Past weeks", wgNoHistory: "No past weeks yet: they appear here from next Monday.",
    wgRow: (done, total, pts) => `${done}/${total} goals · +${pts} points`, wgFull: "every goal", wgFresh: (label, n) => `Weekly goal done: ${label} (+${n} points)`,
    bGroups: { core: "General", area: "Mastery by area", docs: "Documentation", goals: "Weekly goals", shift: "Full shifts" },
    shTitle: "Full shift", shSub: "The end of the lab: four real tickets of this area (or the nearest ones) in a row, against a shift timer. A ticket counts when you close it fixed, in order, after the shift starts.",
    shLocked: "Finish every task of this lab to unlock its full shift.", shStart: "Start the full shift", shBusy: (lab) => `You already have a full shift running: ${lab}. Finish or abandon it first.`,
    shNotEnough: "There are not enough tickets free for this shift right now (some are in progress in the queue). Finish them and come back.",
    shTimer: "Shift time", shGo: "Open the next ticket", shAbandon: "Abandon the shift", shAbandoned: "Shift abandoned. You can start it again whenever you like.",
    shState: { done: "Done", now: "Now", later: "Next" }, shSummaryT: "Shift summary",
    shSummary: (s) => `${s.tickets} tickets in ${s.minutes} min · average ${s.avg == null ? "–" : s.avg} · clean ${s.clean} · with remarks ${s.remarks} · hints ${s.hints}`,
    shReward: (n, b) => `+${n} points and the badge ${b}.`, shRewardOnce: "The points and the badge come with the first full shift of each lab; this one goes into the log.",
    shAgain: "Start another shift", shBest: (d) => `First full shift finished on ${d}.`, shStrip: (lab, k, n) => `Full shift · ${lab}: ticket ${k} of ${n}`,
    shCounted: (k, n) => `Counted for the full shift (${k} of ${n}).`, shFinished: "Full shift finished!", shSeeSummary: "See the summary", shCard: "Full shift done", shCardRun: "Full shift running",
    shOther: "This ticket is not the shift's next one: it will not count for the shift.",
  });
  Object.assign(UI.es, {
    lvChip: (l) => `Nivel: ${l.name}, ${l.total} puntos` + (l.next ? `, faltan ${l.toNext} para ${l.next.name}` : ""),
    lvTitle: "Tu nivel", lvPoints: (n) => `${n} puntos`, lvNext: (n, name) => `Faltan ${n} puntos para ${name}`, lvTop: "Nivel máximo: buen trabajo.",
    lvBreak: (p) => `Tickets ${p.tickets} · Laboratorios ${p.labs} · Comunicación ${p.comms} · Objetivos semanales ${p.goals} · Turnos completos ${p.shifts}`,
    lvHow: "Puntos: el mejor resultado de cada ticket (repetirlo solo cuenta si lo mejora), 10 por tarea de laboratorio, el mejor bonus de comunicación de cada ticket, las recompensas de los objetivos semanales y el primer turno completo de cada laboratorio. Los tickets libres nunca cuentan.",
    lvLadder: "Los niveles", lvFrom: (n) => `desde ${n}`, lvUpTitle: "¡Nivel nuevo!", lvUpText: (n) => `Ahora eres ${n}. Sigue así.`, lvUpOk: "Genial",
    ccTitle: "Cómo cierras los tickets", ccClean: "Cierres limpios", ccCleanX: "Resueltos a la primera y sin observaciones", ccRemarks: "Con observaciones", ccRemarksX: "Resueltos, con observaciones que mejorar",
    ccFalse: "Cierres en falso", ccFalseX: "Intentos de cierre antes de estar arreglado (No resuelto)",
    wgTitle: "Objetivos de la semana", wgSub: (w) => `Tres objetivos para la ${w}, los mismos para todo el mundo. Cambian el lunes a las 00:00 de tu zona horaria; cada recompensa cuenta una vez.`,
    wgReward: (n) => `+${n} puntos`, wgDone: (d) => `Hecho · ${d}`, wgOpen: "Pendiente", wgHistory: "Semanas anteriores", wgNoHistory: "Todavía no hay semanas anteriores: aparecerán aquí a partir del lunes.",
    wgRow: (done, total, pts) => `${done}/${total} objetivos · +${pts} puntos`, wgFull: "todos los objetivos", wgFresh: (label, n) => `Objetivo semanal cumplido: ${label} (+${n} puntos)`,
    bGroups: { core: "Generales", area: "Dominio por área", docs: "Documentación", goals: "Objetivos semanales", shift: "Turnos completos" },
    shTitle: "Turno completo", shSub: "El final del laboratorio: cuatro tickets reales de esta área (o de las más cercanas) seguidos, con un cronómetro de turno. Un ticket cuenta cuando lo cierras arreglado, en orden y después de empezar el turno.",
    shLocked: "Termina todas las tareas de este laboratorio para desbloquear su turno completo.", shStart: "Empezar el turno completo", shBusy: (lab) => `Ya tienes un turno completo en marcha: ${lab}. Termínalo o abandónalo antes.`,
    shNotEnough: "Ahora mismo no hay tickets libres suficientes para este turno (algunos están en curso en la cola). Termínalos y vuelve.",
    shTimer: "Tiempo de turno", shGo: "Abrir el siguiente ticket", shAbandon: "Abandonar el turno", shAbandoned: "Turno abandonado. Puedes empezarlo otra vez cuando quieras.",
    shState: { done: "Hecho", now: "Ahora", later: "Después" }, shSummaryT: "Resumen del turno",
    shSummary: (s) => `${s.tickets} tickets en ${s.minutes} min · media ${s.avg == null ? "–" : s.avg} · limpios ${s.clean} · con observaciones ${s.remarks} · pistas ${s.hints}`,
    shReward: (n, b) => `+${n} puntos y la insignia ${b}.`, shRewardOnce: "Los puntos y la insignia llegan con el primer turno completo de cada laboratorio; este queda en el registro.",
    shAgain: "Empezar otro turno", shBest: (d) => `Primer turno completo terminado el ${d}.`, shStrip: (lab, k, n) => `Turno completo · ${lab}: ticket ${k} de ${n}`,
    shCounted: (k, n) => `Cuenta para el turno completo (${k} de ${n}).`, shFinished: "¡Turno completo terminado!", shSeeSummary: "Ver el resumen", shCard: "Turno completo hecho", shCardRun: "Turno completo en marcha",
    shOther: "Este ticket no es el siguiente del turno: no contará para el turno.",
  });

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
  // the static intro in index.html (for search engines and slow connections) carries both languages: show only this one
  // until the first view replaces it
  function introLang() { document.body.classList.remove("intro-es", "intro-en"); document.body.classList.add("intro-" + lang); }
  introLang();
  let progress = load("progress", {});
  let user = null;      // signed-in technician {name, email, avatar, google, password}
  let afterLogin = null;  // the page someone asked for before signing in (a desk linked from a guide)
  const AVATARS = ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8"];
  const SITE = "https://inigogonzalezgarcia.github.io/";
  // the static pages next to the app, and the contact form with the subject filled in
  const DOCS = [["about", "/about"], ["help", "/help"], ["faq", "/faq"], ["terms", "/terms"], ["privacy", "/privacy"]];
  const REPORT = SITE + "about.html?tema=sysadmindesks#contacto";

  /* ---------- v0.9: preferences (prefs.js, sd.prefs): time zone, reduced motion, sounds and the daily reminder */
  const Pf = window.SDPrefs;
  const PS = window.SDPersist;
  const MB = window.SDMail;
  const FT = window.SDFree;
  let prefsCache = null;
  function prefs() { if (!prefsCache) prefsCache = Pf.normalise(load("prefs", null)); return prefsCache; }
  function setPrefs(p) { prefsCache = Pf.normalise(p); save("prefs", prefsCache); applyMotion(); }
  function zone() { return Pf.zoneOf(prefs()); }
  // the calendar day in the chosen zone (the streak, the weekly goal and the badges count these days)
  function today() { return Pf.dayIn(Date.now(), zone()); }
  // "HH:MM" in the chosen zone
  function clock(ms, seconds) { return Pf.timeIn(ms == null ? Date.now() : ms, zone(), seconds); }
  const sysReduce = () => Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function motion() { return prefs().motion || sysReduce() ? "auto" : "smooth"; }
  function applyMotion() { document.documentElement.classList.toggle("reduce-motion", prefs().motion); }
  applyMotion();
  // celebration sounds: short WebAudio blips, only when turned on (off by default)
  let audioCtx = null;
  function celebrate(kind) {
    const notes = Pf.sound(prefs(), kind);
    if (!notes.length) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = audioCtx || new AC();
      const t0 = audioCtx.currentTime + 0.01;
      notes.forEach((n) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = "sine"; o.frequency.value = n.f;
        g.gain.setValueAtTime(0.0001, t0 + n.at);
        g.gain.exponentialRampToValueAtTime(0.12, t0 + n.at + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.d);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(t0 + n.at); o.stop(t0 + n.at + n.d + 0.03);
      });
      document.documentElement.setAttribute("data-sound", kind);
    } catch (e) { /* no audio: ignore */ }
  }

  /* ---------- v0.9: work kept across a reload (persist.js). Each piece is an envelope with the format and the owner (a hash of the
     signed-in email), so another account in this browser starts clean. sd.live: {deskId: envelope} for the tickets in progress;
     sd.room: the network room outside tickets; sd.labbox: {labId: envelope} for the labs' sandboxes. */
  const SAVED_KEYS = ["live", "room", "labbox"];
  const ownerTag = () => (user ? PS.owner(user.email) : "");
  function envOf(env) { return PS.unpack(env, { owner: ownerTag() }); }
  function packed(data) { return PS.pack(data, { owner: ownerTag() }); }
  function mapOf(key) { const m = load(key, {}); return m && typeof m === "object" && !Array.isArray(m) ? m : {}; }
  function clearSaved() { SAVED_KEYS.forEach((k) => { try { localStorage.removeItem("sd." + k); } catch (e) { /* ignore */ } }); }

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
    introLang();
    const b = document.getElementById("lang");
    b.textContent = L().langBtn;
    b.setAttribute("aria-label", L().langLabel);
    document.getElementById("nav-guides").textContent = L().guides;
    document.getElementById("foot-text").textContent = user ? L().footUser : L().footAnon;
    ["about", "help", "faq", "terms", "privacy", "report", "cookies"].forEach((k) => { const a = document.getElementById("foot-" + k); if (a) a.textContent = L()[k]; });
    const nh = document.getElementById("nav-help"); if (nh) nh.textContent = L().navHelp;
    const who = document.getElementById("who");
    who.replaceChildren(...(user
      ? [levelChip(), el("a", { class: "who", href: "#/account", title: L().account }, avatarImg(user.avatar, "avatar sm"), el("span", { text: user.name }))]
      : [el("a", { class: "who signin", href: "#/start", text: L().signIn })]));
  }

  /* ---------- tickets in progress: when each one was assigned (this browser), and the live console of each one (this page) */
  let ticker = null;      // updates the SLA counters every second
  let fsHandler = null;   // v0.9: the open desk's reaction to entering or leaving full screen
  document.addEventListener("fullscreenchange", () => { if (fsHandler) fsHandler(); });
  let queueTab = "open";
  const live = {};        // deskId -> {sess, log: [{text, kind}], hist: [], pos: 0, closed: false, result: null}
  function work() { return load("work", {}); }
  function setWork(id, value) {
    const w = work();
    if (value) w[id] = value; else delete w[id];
    save("work", w);
  }
  function liveOf(id, sc) {
    if (!live[id]) {
      // v0.9: a ticket still open in the workflow comes back as it was before the reload
      let back = null;
      if (work()[id]) {
        const data = envOf(mapOf("live")[id]);
        if (data) back = PS.ticketFromJSON(sc, data, lang);
        if (back) back.restored = true;
      }
      live[id] = back || { sess: E.createSession(sc, lang), log: [], hist: [], pos: 0, closed: false, result: null };
    }
    return live[id];
  }
  // v0.9: write a ticket in progress (or forget it once it is closed or gone from the workflow)
  function persistLive(id) {
    const lv = live[id];
    const m = mapOf("live");
    if (!lv || lv.closed || !work()[id]) { if (id in m) { delete m[id]; save("live", m); } return; }
    m[id] = packed(PS.ticketToJSON(lv));
    save("live", PS.prune(m, Object.keys(work())));
  }
  function dropLive(id) { delete live[id]; persistLive(id); }
  // v0.6: the workflow record of a ticket (state, SLA start, pauses and activity), or null when nobody has assigned it yet
  function rec(id) { return W.normalise(work()[id]); }
  // SLA minutes used: since the first assignment, without the time spent pending
  function minutesOn(id) {
    const r = rec(id);
    return r ? W.slaMinutesUsed(r, Date.now()) : 0;
  }
  // v0.7b: simulated shipping time, as "2 h 30 min"
  function hours(ms) {
    const m = Math.round(ms / 60000);
    return m < 60 ? m + " min" : Math.floor(m / 60) + " h" + (m % 60 ? " " + (m % 60) + " min" : "");
  }
  function mmss(min) {
    const s = Math.max(0, Math.floor(min * 60));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }
  // {text, tone} for the SLA of a ticket; long: mm:ss for the ticket page
  function slaInfo(sc, long) { return slaOf(rec(sc.id), E.sla(sc), long); }
  // v0.9: the same for any workflow record and SLA (the desks and the free tickets)
  function slaOf(r, limit, long) {
    if (!r) return { text: L().slaTarget(limit), tone: "" };
    const now = Date.now();
    const left = W.slaRemaining(r, limit, now);
    const leftText = left < 0 ? L().slaOver(Math.ceil(-left)) : L().slaLeft(long ? mmss(left) : Math.ceil(left) + " min");
    if (W.isPaused(r)) return { text: long ? L().slaPaused(leftText, mmss(W.pausedMs(r, now) / 60000)) : L().slaPausedShort, tone: "paused" };
    if (left < 0) return { text: leftText, tone: "bad" };
    return { text: leftText, tone: left < limit / 4 ? "warn" : "ok" };
  }
  // v0.9: the wall-clock time the SLA runs out, in the chosen time zone ("" while paused or not started)
  function dueOf(r, limit) {
    if (!r || W.isPaused(r) || r.status === "closed") return "";
    const now = Date.now();
    return L().slaDue(clock(now + W.slaRemaining(r, limit, now) * 60000));
  }
  function slaDueEl(key, r, limit) {
    return el("span", { class: "sla-due mono", "data-sla-due": key, title: L().slaDueTitle(zone()), text: dueOf(r, limit) });
  }
  function freeRec(id) { const tk = FT.find(freeStore(), id); return tk ? { tk, r: tk.rec, limit: FT.sla(tk) } : null; }
  // v0.9b: a shift timer, "MM:SS" (or "H:MM:SS" past an hour)
  function mmssMs(ms) {
    const sec = Math.floor(ms / 1000);
    const h = Math.floor(sec / 3600);
    const p2 = (n) => String(n).padStart(2, "0");
    return (h ? h + ":" : "") + p2(Math.floor((sec % 3600) / 60)) + ":" + p2(sec % 60);
  }
  function tick() {
    const shA = document.querySelector("[data-shift-timer]") ? shiftStore().active : null;
    document.querySelectorAll("[data-shift-timer]").forEach((n) => { if (shA) n.textContent = mmssMs(Lv.elapsed(shA, Date.now())); });
    document.querySelectorAll("[data-sla]").forEach((n) => {
      const sc = SCENARIOS.find((s) => s.id === n.getAttribute("data-sla"));
      if (!sc) return;
      const info = slaInfo(sc, n.hasAttribute("data-long"));
      n.textContent = info.text;
      n.className = "sla " + info.tone;
    });
    document.querySelectorAll("[data-free-sla]").forEach((n) => {
      const f = freeRec(n.getAttribute("data-free-sla"));
      if (!f || f.tk.closed) return;
      const info = slaOf(f.r, f.limit, n.hasAttribute("data-long"));
      n.textContent = info.text;
      n.className = "sla " + info.tone;
    });
    document.querySelectorAll("[data-sla-due]").forEach((n) => {
      const k = n.getAttribute("data-sla-due");
      const sc = SCENARIOS.find((x) => x.id === k);
      const f = sc ? null : freeRec(k);
      n.textContent = sc ? dueOf(rec(sc.id), E.sla(sc)) : f ? dueOf(f.r, f.limit) : "";
    });
    document.querySelectorAll("[data-clock]").forEach((n) => { n.textContent = clock(); });
  }
  function isOpen(sc) { return !progress[sc.id] || Boolean(work()[sc.id]); }
  function statusOf(sc) { const r = rec(sc.id); return r ? r.status : progress[sc.id] ? "closed" : "new"; }
  // assigned to me: in progress or pending (not "new" after Unassign)
  function mine(id) { const r = rec(id); return Boolean(r && r.status !== "new" && r.status !== "closed"); }
  function pill(cls, text) { return el("span", { class: "pill " + cls, text }); }
  function prioPill(p) { return el("span", { class: "prio " + p, text: p }); }

  function refreshBadge() {
    const n = SCENARIOS.filter(isOpen).length + freeStore().list.filter(FT.isOpen).length;
    const item = document.getElementById("nav-tickets");
    if (!item) return;
    let badge = item.querySelector(".badge");
    if (!n) { if (badge) badge.remove(); return; }
    if (!badge) { badge = el("span", { class: "badge" }); item.append(badge); }
    badge.textContent = String(n);
  }

  /* ---------- v0.4: progress and knowledge, kept only in this browser (sd.activity, sd.kb, sd.mail, sd.mailRead, sd.badges, sd.goal) */
  const G = window.SDGrowth;
  const GROWTH_KEYS = ["activity", "kb", "mail", "mailRead", "badges", "goal", "ships", "labs", "mailbox", "free", "prefs", "remind", "side", "live", "room", "labbox", "level", "weekly", "shifts"];
  const activity = () => { const a = load("activity", []); return Array.isArray(a) ? a : []; };
  const mailAnswers = () => load("mail", {}) || {};
  const unread = () => { const r = load("mailRead", []); return MB.counts(mbox(), Array.isArray(r) ? r : []).unread; };
  function markRead(id) {
    const r = load("mailRead", []);
    const list = Array.isArray(r) ? r : [];
    if (!list.includes(id)) { list.push(id); save("mailRead", list); }
  }
  // a day with something done: a ticket closed fixed or a mail exercise answered; then any badge it unlocks (returns the new ones)
  function logActivity(entry) {
    const a = activity();
    a.push(Object.assign({ day: today() }, entry));
    save("activity", a.slice(-1000));
    return awardNow();
  }
  // v0.9b: the weekly goals are credited first (their rewards and the goal-cycle badges), then every badge (growth.js + levels.js),
  // then the level in the header (with its celebration)
  function awardNow() {
    const day = today();
    const c = Lv.claim(load("weekly", null), Lv.weekAt(Date.now(), zone()), activity(), { day, levels: DESK_LEVELS() });
    save("weekly", c.store);
    if (c.fresh.length) { freshGoals = freshGoals.concat(c.fresh); celebrate("task"); }
    const f = Lv.facts({ activity: activity(), progress, desks: SCENARIOS.map((s) => s.id), kb: load("kb", {}), mail: mailAnswers(), today: day,
      weekly: c.store, shifts: shiftStore() });
    const r = Lv.award(load("badges", {}), f, day);
    if (r.fresh.length) save("badges", r.awards);
    setTimeout(refreshLevel, 0);
    return r.fresh;
  }
  const badgeName = (id) => (Lv.badges({}, lang).find((b) => b.id === id) || {}).name || id;

  /* ---------- v0.9b: levels by points, weekly goals and the labs' full shift (levels.js). sd.level: the level last shown (so a level-up is
     celebrated once); sd.weekly: the weekly goals credited; sd.shifts: the full shifts, in an envelope with the owner like persist.js's keys */
  const Lv = window.SDLevels;
  const DESK_LEVELS = () => Object.fromEntries(SCENARIOS.map((s) => [s.id, s.level]));
  let freshGoals = [];   // goals credited since the last time they were shown
  function shiftStore() {
    const raw = load("shifts", null);
    const d = raw && raw.v === PS.FORMAT && "u" in raw ? envOf(raw) : null;
    return Lv.normaliseShifts(d, SCENARIOS.map((s) => s.id));
  }
  // a ticket of the shift closed earlier in this page starts again when the shift sends you to it
  function freeShiftDesk(d) { if (d && live[d] && live[d].closed) delete live[d]; }
  function setShifts(st) { if (user) save("shifts", packed(Lv.normaliseShifts(st, SCENARIOS.map((s) => s.id)))); }
  function levelInput() {
    return { desks: SCENARIOS.map((s) => s.id), progress, activity: activity(), labs: load("labs", {}), weekly: load("weekly", null), shifts: shiftStore() };
  }
  function levelNow() { const p = Lv.points(levelInput()); return Object.assign(Lv.level(p.total, lang), { parts: p }); }
  function levelBar(l, id) {
    return el("progress", { class: "goal-bar lvl-bar", id: id || null, max: String(l.span || 1), value: String(l.next ? l.into : 1), "aria-label": L().lvChip(l) });
  }
  function levelChip() {
    const l = levelNow();
    return el("a", { class: "lvl-chip", id: "lvl-chip", href: "#/profile", title: L().lvChip(l), "aria-label": L().lvChip(l) },
      el("span", { class: "lvl-name" }, el("span", { class: "lvl-long", text: l.name }), el("span", { class: "lvl-short", text: l.short })),
      el("span", { class: "lvl-pts mono", text: String(l.total) }), levelBar(l));
  }
  // the header chip follows every change; a level higher than the one last shown is celebrated once (sound and motion follow Preferences)
  function refreshLevel() {
    if (!user) return;
    const chip = document.getElementById("lvl-chip");
    if (chip) chip.replaceWith(levelChip());
    const l = levelNow();
    const r = Lv.levelUp(load("level", null), l.total);
    save("level", r.seen);
    if (r.up) levelUpCard(l);
  }
  function levelUpCard(l) {
    const old = document.getElementById("lvl-up");
    if (old) old.remove();
    celebrate("level");
    const box = el("div", { class: "lvl-up", id: "lvl-up", role: "status", "aria-live": "polite" },
      el("span", { class: "lvl-up-ico", "aria-hidden": "true", text: "▲" }),
      el("div", { class: "grow" }, el("b", { text: L().lvUpTitle }), el("p", { text: L().lvUpText(l.name) }), levelBar(l)),
      el("button", { type: "button", class: "btn sm", id: "lvl-up-ok", text: L().lvUpOk, onclick: () => box.remove() }));
    document.body.append(box);
    setTimeout(() => { if (box.isConnected) box.remove(); }, 9000);
  }
  function goalToast() {
    if (!freshGoals.length) return null;
    const items = freshGoals.map((id) => { const g = Lv.goal(id); return el("p", { class: "badge-new goal-new" }, el("span", { class: "side-ico", "aria-hidden": "true", text: "◔" }), el("span", { text: L().wgFresh(t(g.label, lang), g.points) })); });
    freshGoals = [];
    return items;
  }

  /* ---------- v0.9: the daily practice reminder: a banner at the chosen time (prefs.js decides), and a browser notification only if the
     user turned it on and the browser allowed it. sd.remind: {lastShown, notified} (local days in the chosen zone). */
  function practisedToday() { const d = today(); return activity().some((a) => a.day === d); }
  function reminderState() { const r = load("remind", null); return r && typeof r === "object" ? r : {}; }
  function dismissReminder() { save("remind", Object.assign(reminderState(), Pf.reminderShown(prefs(), Date.now()))); }
  function maybeNotify() {
    const p = prefs();
    const st = reminderState();
    if (!p.reminder.notify || st.notified === today() || !("Notification" in window) || Notification.permission !== "granted") return;
    try { new Notification(L().notifTitle, { body: L().notifText, icon: "assets/icon.svg", tag: "sd-reminder" }); } catch (e) { /* ignore */ }
    save("remind", Object.assign(st, { notified: today() }));
  }
  function reminderBanner() {
    if (!user || !Pf.reminderDue(prefs(), Date.now(), reminderState(), practisedToday())) return null;
    maybeNotify();
    const box = el("aside", { class: "reminder", id: "reminder", role: "status", "aria-label": L().remTitle },
      el("span", { class: "side-ico", "aria-hidden": "true", text: "⏰" }),
      el("div", { class: "grow" }, el("b", { text: L().remTitle }), el("p", { text: L().remText })),
      el("div", { class: "row" }, el("a", { class: "btn sm", href: "#/", id: "reminder-go", text: L().remGo, onclick: () => dismissReminder() }),
        el("button", { type: "button", class: "btn ghost sm", id: "reminder-later", text: L().remLater, onclick: () => { dismissReminder(); box.remove(); } })));
    return box;
  }
  // checked every 30 seconds while signed in, so the banner appears at the time even if the page stays open
  setInterval(() => {
    if (!user || document.getElementById("reminder")) return;
    const v = document.querySelector(".shell .view");
    const b = v && reminderBanner();
    if (b) v.prepend(b);
  }, 30000);

  /* ---------- the signed-in shell: sidebar + view */
  function shell(active) {
    const app = document.getElementById("app");
    app.replaceChildren();
    const open = SCENARIOS.filter(isOpen).length + freeStore().list.filter(FT.isOpen).length;
    const unreadN = unread();
    // v0.9: the sidebar folds to icons only (remembered in sd.side); the labels stay for screen readers and as tooltips
    const mini = load("side", "open") === "mini";
    const item = (href, icon, text, key, extra) => el("a", { href, class: "side-item" + (active === key ? " on" : ""), id: "nav-" + key, title: mini ? text : null,
      "aria-current": active === key ? "page" : null }, el("span", { class: "side-ico", "aria-hidden": "true", text: icon }), el("span", { class: "side-txt", text }), extra || null);
    const fold = el("button", { type: "button", class: "side-fold", id: "side-fold", "aria-controls": "side-nav", "aria-expanded": mini ? "false" : "true",
      "aria-label": mini ? L().sideUnfold : L().sideFold, title: mini ? L().sideUnfold : L().sideFold, onclick: () => {
        const now = load("side", "open") === "mini" ? "open" : "mini";
        save("side", now);
        const sh = document.querySelector(".shell");
        if (sh) sh.classList.toggle("side-mini", now === "mini");
        fold.setAttribute("aria-expanded", now === "mini" ? "false" : "true");
        fold.setAttribute("aria-label", now === "mini" ? L().sideUnfold : L().sideFold);
        fold.title = now === "mini" ? L().sideUnfold : L().sideFold;
        fold.firstChild.textContent = now === "mini" ? "»" : "«";
        document.querySelectorAll("#side-nav .side-item").forEach((n) => { const tx = n.querySelector(".side-txt"); if (now === "mini" && tx) n.title = tx.textContent; else n.removeAttribute("title"); });
      } }, el("span", { "aria-hidden": "true", text: mini ? "»" : "«" }));
    const nav = el("nav", { class: "side", id: "side-nav", "aria-label": L().navLabel },
      el("div", { class: "side-top" }, el("p", { class: "side-h", text: L().deskName }), fold),
      item("#/", "▤", L().navTickets, "tickets", open ? el("span", { class: "badge", text: String(open) }) : null),
      item("#/mail", "✉", L().navMail, "mail", unreadN ? el("span", { class: "badge", "aria-label": L().unreadN(unreadN), text: String(unreadN) }) : null),
      item("#/directory", "◫", L().navDirectory, "directory"),
      item("#/inventory", "▦", L().navInventory, "inventory"),
      item("#/network", "⌗", L().navNetwork, "network"),
      item("#/shipping", "⇪", L().navShipping, "shipping"),
      item("#/kb", "▧", L().navKb, "kb"),
      item("#/library", "❏", L().navLibrary, "library"),
      item("#/labs", "⚗", L().navLabs, "labs"),
      item("#/progress", "★", L().navProgress, "progress"),
      item("#/profile", "◎", L().navProfile, "profile"),
      el("a", { class: "side-item", href: SITE + "guias.html", target: "_blank", rel: "noopener noreferrer", title: mini ? L().navGuides : null },
        el("span", { class: "side-ico", "aria-hidden": "true", text: "↗" }), el("span", { class: "side-txt", text: L().navGuides })),
      el("a", { class: "side-item", href: "/help", id: "nav-side-help", title: mini ? L().navHelp : null },
        el("span", { class: "side-ico", "aria-hidden": "true", text: "i" }), el("span", { class: "side-txt", text: L().navHelp })),
      item("#/account", "●", L().navAccount, "account"),
      el("button", { type: "button", class: "side-item side-tour", id: "nav-tour", title: mini ? L().navTour : null, onclick: () => tour(0) },
        el("span", { class: "side-ico", "aria-hidden": "true", text: "?" }), el("span", { class: "side-txt", text: L().navTour })));
    const view = el("section", { class: "view" });
    app.append(el("div", { class: "shell" + (mini ? " side-mini" : "") }, nav, view));
    const rem = reminderBanner();
    if (rem) view.append(rem);
    return view;
  }

  /* ---------- ticket queue */
  function queue() {
    const view = shell("tickets");
    document.title = L().qTitle + " · SysAdmin Desks";
    const w = work();
    const open = SCENARIOS.filter(isOpen).sort((a, b) => (w[b.id] ? 1 : 0) - (w[a.id] ? 1 : 0) || a.ticket.priority.localeCompare(b.ticket.priority));
    const closed = SCENARIOS.filter((s) => progress[s.id] && !w[s.id]);
    // v0.9: free tickets (freetix.js): the user's own practice tickets, marked and never graded
    const frees = freeStore().list;
    const freeOpen = frees.filter(FT.isOpen).sort((a, b) => a.priority.localeCompare(b.priority));
    const freeClosed = frees.filter((x) => !FT.isOpen(x)).sort((a, b) => b.closed.at - a.closed.at);
    const person = (sam) => { const u = Wd.user(world, sam); return u ? u.name : sam; };
    const freeTag = () => el("span", { class: "pill free-pill", text: L().ftFree });
    const tabs = el("div", { class: "qtabs", role: "tablist" }, [["open", L().tabOpen, open.length + freeOpen.length], ["closed", L().tabClosed, closed.length + freeClosed.length]].map(([k, text, n]) =>
      el("button", { type: "button", role: "tab", class: "qtab" + (queueTab === k ? " on" : ""), "aria-selected": queueTab === k ? "true" : "false",
        onclick: () => { queueTab = k; queue(); } }, text + " ", el("span", { class: "count", text: String(n) }))));
    const th = (text, id) => el("th", { scope: "col", id: id || null, text });
    let table;
    if (queueTab === "open") {
      table = open.length || freeOpen.length ? el("table", { class: "qtable", id: open.length ? "tour-queue" : null },
        el("thead", {}, el("tr", {}, th(L().colTicket), th(L().colSubject), th(L().colRequester), th(L().colPriority), th("SLA", "tour-sla"), th(L().colStatus), th(L().colAssignee))),
        el("tbody", {}, open.map((sc, i) => {
          const st = statusOf(sc);
          const sla = slaInfo(sc, false);
          return el("tr", { id: sc.id === tourDesk() ? "tour-row" : null, class: (st === "progress" ? "active" : W.isPending(st) ? "active paused" : "") || null },
            el("td", { class: "mono", "data-label": L().colTicket, text: sc.ticket.id }),
            el("td", { class: "subj", "data-label": L().colSubject }, el("a", { href: "#/desk/" + sc.id, text: t(sc.title, lang) }),
              el("span", { class: "sub" }, `${t(sc.topic, lang)} · ${L().level} ${sc.level}`)),
            el("td", { "data-label": L().colRequester, text: t(sc.requester.name, lang) }),
            el("td", { "data-label": L().colPriority }, prioPill(sc.ticket.priority)),
            el("td", { "data-label": "SLA" }, el("span", { class: "sla " + sla.tone, "data-sla": sc.id, text: sla.text })),
            el("td", { "data-label": L().colStatus }, pill(st, L().status[st])),
            el("td", { "data-label": L().colAssignee }, mine(sc.id) && user ? el("span", { class: "assignee" }, avatarImg(user.avatar, "avatar sm"), el("span", { text: user.name }))
              : el("span", { class: "muted", text: L().unassigned })));
        }).concat(freeOpen.map((tk) => {
          const st = FT.status(tk);
          const sla = slaOf(tk.rec, FT.sla(tk), false);
          return el("tr", { class: (["progress"].includes(st) ? "active free-row" : W.isPending(st) ? "active paused free-row" : "free-row"), "data-free": tk.id },
            el("td", { class: "mono", "data-label": L().colTicket, text: tk.id }),
            el("td", { class: "subj", "data-label": L().colSubject }, el("a", { href: "#/free/" + tk.id, text: tk.subject }),
              el("span", { class: "sub" }, freeTag(), " " + FT.t((FT.CATEGORIES.find((c) => c.id === tk.category) || {}).name, lang))),
            el("td", { "data-label": L().colRequester, text: person(tk.requester) }),
            el("td", { "data-label": L().colPriority }, prioPill(tk.priority)),
            el("td", { "data-label": "SLA" }, el("span", { class: "sla " + sla.tone, "data-free-sla": tk.id, text: sla.text })),
            el("td", { "data-label": L().colStatus }, pill(st, L().status[st])),
            el("td", { "data-label": L().colAssignee }, tk.rec && st !== "new" && user ? el("span", { class: "assignee" }, avatarImg(user.avatar, "avatar sm"), el("span", { text: user.name }))
              : el("span", { class: "muted", text: L().unassigned })));
        })))) : el("p", { class: "empty", text: L().emptyOpen });
    } else {
      table = closed.length || freeClosed.length ? el("table", { class: "qtable" },
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
            el("td", {}, el("a", { class: "btn ghost sm", href: "#/desk/" + sc.id, text: L().replay, onclick: () => { dropLive(sc.id); } })));
        }).concat(freeClosed.map((tk) => el("tr", { class: "free-row", "data-free": tk.id },
          el("td", { class: "mono", "data-label": L().colTicket, text: tk.id }),
          el("td", { class: "subj", "data-label": L().colSubject }, el("a", { href: "#/free/" + tk.id, class: "strong", text: tk.subject }), el("span", { class: "sub" }, freeTag())),
          el("td", { "data-label": L().colResult }, pill("closed", L().status.closed)),
          el("td", { "data-label": L().colPoints }, el("span", { class: "muted", title: L().ftFreeLong, text: L().ftNoScore })),
          el("td", { "data-label": L().colDate, text: Pf.dayIn(tk.closed.at, zone()) }),
          el("td", {}, el("a", { class: "btn ghost sm", href: "#/free/" + tk.id, text: L().ftOpen }))))))) : el("p", { class: "empty", text: L().emptyClosed });
    }
    view.append(
      el("header", { class: "view-head" }, el("div", {}, el("h1", { text: L().qTitle }), el("p", { class: "sub", text: user ? L().hello(user.name) : "" })),
        el("div", { class: "q-head-r" }, el("p", { class: "shift" }, el("span", { class: "dot", "aria-hidden": "true" }), L().shift),
          el("a", { class: "btn sm", href: "#/free/new", id: "free-new", text: "＋ " + L().ftNew }))),
      tabs, el("div", { class: "qwrap" }, table));
    // v0.8: the guided first ticket for a new technician; "what's new" once for one who already took the tour
    if (queueTab === "open" && tourAt == null) setTimeout(() => {
      if (!document.getElementById("tour-queue") || document.querySelector(".tour")) return;
      if (!load("tourDone", false)) tour(0); else if (load("whatsNew", "") !== WHATS_NEW) whatsNew();
    }, 400);
  }

  /* ---------- v0.9: free tickets (#/free/new, #/free/<id>): logged by the user, with an SLA, states, notes and a closure, never graded */
  let freeCache = null;
  function freeStore() { if (!freeCache) freeCache = FT.normalise(load("free", null)); return freeCache; }
  function setFree(st) { freeCache = FT.normalise(st); save("free", freeCache); }
  const requesters = () => world.users.filter((u) => !/^(svc-|it\.admin$)/.test(u.sam));
  let freeUi = { pendOpen: false };
  function freeNew() {
    const view = shell("tickets");
    document.title = L().ftNewTitle + " · SysAdmin Desks";
    const field = (label, ctl, idf) => el("label", { class: "field", for: idf }, el("span", { class: "field-label", text: label }), ctl);
    const subject = el("input", { type: "text", id: "ft-subject", maxlength: String(FT.LIMITS.subject), autocomplete: "off" });
    const reqSel = el("select", { id: "ft-requester" }, el("option", { value: "", text: L().ftPick }),
      requesters().map((u) => el("option", { value: u.sam, text: `${u.name} · ${Wd.t(u.title, lang)} (${u.sam})` })));
    const prio = el("select", { id: "ft-priority" }, FT.PRIORITIES.map((p) => el("option", { value: p, selected: p === "P3", text: `${p} · SLA ${FT.SLA[p]} min` })));
    const cat = el("select", { id: "ft-category" }, el("option", { value: "", text: L().ftPick }), FT.CATEGORIES.map((c) => el("option", { value: c.id, text: FT.t(c.name, lang) })));
    const desc = el("textarea", { id: "ft-desc", rows: "5", maxlength: String(FT.LIMITS.desc) });
    const msg = el("p", { class: "form-msg", role: "alert", id: "ft-msg" });
    view.append(el("p", { class: "kb-back" }, el("a", { href: "#/", text: L().back })),
      el("header", { class: "view-head" }, el("div", {}, el("h1", { text: L().ftNewTitle }), el("p", { class: "sub", text: L().ftNewSub }))),
      el("section", { class: "panel note free-form" },
        field(L().ftSubject, subject, "ft-subject"), field(L().ftRequester, reqSel, "ft-requester"),
        el("div", { class: "free-2" }, field(L().ftPriority, prio, "ft-priority"), field(L().ftCategory, cat, "ft-category")),
        field(L().ftDesc, desc, "ft-desc"), msg,
        el("div", { class: "row" }, el("button", { type: "button", class: "btn", id: "ft-create", text: L().ftCreate, onclick: () => {
          const r = FT.create(freeStore(), { subject: subject.value, requester: reqSel.value, priority: prio.value, category: cat.value, description: desc.value }, requesters(), Date.now());
          if (!r.ok) { msg.textContent = r.errors.map((e) => L().ftErr[e]).join(" "); return; }
          setFree(r.store); location.hash = "#/free/" + r.ticket.id;
        } }), el("a", { class: "btn ghost", href: "#/", text: L().ftCancel }))));
    subject.focus();
  }
  function freePage(fid) {
    const view = shell("tickets");
    const tk = FT.find(freeStore(), fid);
    if (!tk) { view.append(el("p", { text: L().notFound }), el("a", { class: "btn", href: "#/", text: L().home })); return; }
    document.title = tk.id + " · " + tk.subject + " · SysAdmin Desks";
    const u = Wd.user(world, tk.requester);
    const st = FT.status(tk);
    const r = tk.rec;
    const sla = slaOf(r, FT.sla(tk), true);
    const commit = (res, keepOpen) => { if (!res.ok) return res; setFree(res.store); freeUi.pendOpen = Boolean(keepOpen); freePage(fid); refreshBadge(); return res; };
    const who = user ? el("span", { class: "assignee" }, el("span", { class: "muted", text: L().assignedTo + " " }), avatarImg(user.avatar, "avatar sm"), el("span", { text: user.name })) : null;
    let buttons;
    if (tk.closed) buttons = [who];
    else if (st === "progress") buttons = [who,
      el("button", { type: "button", class: "btn ghost sm", id: "ft-pend", "aria-expanded": freeUi.pendOpen ? "true" : "false", text: L().pendBtn, onclick: () => { freeUi.pendOpen = !freeUi.pendOpen; freePage(fid); } }),
      el("button", { type: "button", class: "btn ghost sm", id: "ft-unassign", text: L().unassignBtn, onclick: () => commit(FT.move(freeStore(), fid, "new", { now: Date.now() })) })];
    else if (W.isPending(st)) buttons = [who, el("button", { type: "button", class: "btn sm", id: "ft-resume", text: L().resumeBtn, onclick: () => commit(FT.move(freeStore(), fid, "progress", { now: Date.now() })) })];
    else buttons = [el("button", { type: "button", class: "btn", id: "ft-assign", text: L().assign, onclick: () => commit(FT.assign(freeStore(), fid, Date.now())) })];
    const head = el("div", { class: "tbar" }, el("span", { class: "mono strong", text: tk.id }), prioPill(tk.priority), pill(st, L().status[st]), el("span", { class: "pill free-pill", text: L().ftFreeLong }),
      tk.closed ? null : el("span", { class: "sla-wrap" }, el("span", { class: "muted", text: "SLA " }), el("span", { class: "sla " + sla.tone, "data-free-sla": tk.id, "data-long": "", text: sla.text }), " ", slaDueEl(tk.id, r, FT.sla(tk))),
      el("span", { class: "grow" }), el("span", { class: "wf-btns" }, buttons));
    // pending: state and reason, like a desk
    let pend = null;
    if (freeUi.pendOpen && st === "progress") {
      const state = el("select", { id: "ft-pend-state", "aria-label": L().pendState }, W.PENDING.map((k) => el("option", { value: k, text: L().status[k] })));
      const ta = el("textarea", { id: "ft-pend-reason", maxlength: String(W.REASON_MAX), placeholder: L().pendPh });
      const m = el("p", { class: "form-msg", role: "alert" });
      pend = el("section", { class: "panel note wf-pend" }, el("h2", { text: L().pendTitle }), el("p", { text: L().pendText }),
        el("label", { class: "field" }, el("span", { class: "field-label", text: L().pendState }), state),
        el("label", { class: "field" }, el("span", { class: "field-label", text: L().pendReason }), ta), m,
        el("div", { class: "row" }, el("button", { type: "button", class: "btn", id: "ft-pend-ok", text: L().pendOk, onclick: () => {
          const res = commit(FT.move(freeStore(), fid, state.value, { now: Date.now(), reason: ta.value }), true);
          if (!res.ok) m.textContent = res.error === "reason" ? L().pendNeedReason(W.REASON_MIN) : L().errors.bad_request;
          else { freeUi.pendOpen = false; freePage(fid); }
        } }), el("button", { type: "button", class: "btn ghost", text: L().accCancel, onclick: () => { freeUi.pendOpen = false; freePage(fid); } })));
    }
    // notes
    const notes = el("section", { class: "panel ft-notes", id: "ft-notes" }, el("h2", { text: L().ftNotes }),
      tk.notes.length ? el("ol", { class: "tl" }, tk.notes.slice().reverse().map((n) => el("li", {}, el("p", { class: "tl-head" }, el("time", { datetime: new Date(n.at).toISOString(), text: clock(n.at) })), el("p", { class: "tl-reason", text: n.text }))))
        : el("p", { class: "sub", text: L().ftNoNotes }));
    if (!tk.closed && r && st !== "new") {
      const ta = el("textarea", { id: "ft-note", rows: "3", maxlength: String(FT.LIMITS.note), placeholder: L().ftNotePh, "aria-label": L().ftNotes });
      const m = el("p", { class: "form-msg", role: "alert" });
      notes.append(ta, m, el("div", { class: "row" }, el("button", { type: "button", class: "btn ghost sm", id: "ft-add-note", text: L().ftAddNote, onclick: () => {
        const res = FT.addNote(freeStore(), fid, ta.value, Date.now());
        if (!res.ok) { m.textContent = L().ftNoteShort; return; }
        commit(res);
      } })));
    }
    // closing (in progress only) or the closed summary
    let closeBox = null;
    if (tk.closed) {
      closeBox = el("section", { class: "panel result lvl-resolved", id: "ft-result" }, el("p", { class: "lvl" }, pill("closed", L().status.closed), " ", el("span", { class: "pill free-pill", text: L().ftFreeLong })),
        el("p", { text: L().ftClosed(Math.ceil(tk.closed.minutes), FT.sla(tk)) }),
        el("p", {}, el("b", { text: FT.t((FT.CODES.find((c) => c.id === tk.closed.code) || {}).name, lang) + ": " }), tk.closed.note),
        el("div", { class: "row" }, el("a", { class: "btn ghost", href: "#/", text: L().queueBtn }),
          el("button", { type: "button", class: "link-btn", id: "ft-delete", text: L().ftDelete, onclick: () => { setFree(FT.remove(freeStore(), fid)); location.hash = "#/"; } })));
    } else if (st === "progress") {
      const code = el("select", { id: "ft-code", "aria-label": L().ftCode }, el("option", { value: "", text: L().resPick }), FT.CODES.map((c) => el("option", { value: c.id, text: FT.t(c.name, lang) })));
      const ta = el("textarea", { id: "ft-close-note", rows: "4", maxlength: String(FT.LIMITS.note), "aria-label": L().ftCloseNote });
      const m = el("p", { class: "form-msg", role: "alert" });
      closeBox = el("section", { class: "panel note", id: "ft-close" }, el("h2", { text: L().ftClose }), el("p", { text: L().ftCloseText }),
        el("label", { class: "field" }, el("span", { class: "field-label", text: L().ftCode }), code),
        el("label", { class: "field" }, el("span", { class: "field-label", text: L().ftCloseNote }), ta), m,
        el("div", { class: "row" }, el("button", { type: "button", class: "btn", id: "ft-close-btn", text: L().ftCloseBtn, onclick: () => {
          const res = FT.close(freeStore(), fid, { code: code.value, note: ta.value }, Date.now());
          if (!res.ok) { m.textContent = L().ftCloseErr[res.error] || L().errors.bad_request; return; }
          commit(res);
        } })));
    } else if (W.isPending(st)) closeBox = el("section", { class: "panel note" }, el("h2", { text: L().ftClose }), el("p", { class: "wf-hold", text: L().resolvePending }));
    const items = r ? r.timeline : [];
    const timeline = el("section", { class: "panel timeline", id: "ft-timeline" }, el("h2", { text: L().tlTitle }),
      items.length ? el("ol", { class: "tl" }, items.slice().reverse().map((x) => el("li", { class: "tl-" + x.to },
        el("p", { class: "tl-head" }, el("time", { datetime: new Date(x.at).toISOString(), text: clock(x.at) }), el("span", { text: `${L().status[x.from] || x.from} → ${L().status[x.to] || x.to}` })),
        x.reason ? el("p", { class: "tl-reason", text: x.reason }) : null))) : el("p", { class: "sub", text: L().tlEmpty }));
    view.append(el("div", { class: "desk-bar" }, el("a", { href: "#/", text: L().back }), el("h1", { text: tk.subject })), head,
      el("div", { class: "desk" },
        el("aside", {},
          el("section", { class: "panel" }, el("h2", { text: L().ftDescT }), el("p", { class: "ticket-body", text: tk.description }),
            el("p", { class: "sub", text: FT.t((FT.CATEGORIES.find((c) => c.id === tk.category) || {}).name, lang) })),
          el("section", { class: "panel" }, el("h2", { text: L().requester }),
            u ? el("p", { class: "req-name" }, el("span", { class: "initials", "aria-hidden": "true", text: u.name.split(" ").map((x) => x[0]).join("").slice(0, 2) }),
              el("span", {}, el("b", { text: u.name }), el("span", { class: "sub", text: Wd.t(u.title, lang) + " · " + u.dept }))) : el("p", { text: tk.requester }),
            u ? el("dl", { class: "fields" }, el("dt", { text: L().fUser }), el("dd", { class: "mono", text: u.sam }), el("dt", { text: L().fDevice }), el("dd", { class: "mono", text: u.device || "–" })) : null),
          timeline),
        el("div", {}, pend, notes, closeBox)));
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
    const assigned = () => mine(id);                // in progress or pending, assigned to me
    const working = () => W.canWork(rec(id));       // in progress: the console and the actions work

    const out = el("div", { class: "out", "aria-live": "polite" });
    const input = el("input", { type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", "aria-label": L().console });
    const psSpan = el("span", { class: "ps", text: E.prompt(sess) });   // v0.7a: the prompt follows the device and its mode
    const form = el("form", { onsubmit: (ev) => { ev.preventDefault(); exec(input.value); input.value = ""; } }, psSpan, input);
    const term = el("div", { class: "term", onclick: () => { if (!window.getSelection().toString()) input.focus(); } }, out, form);
    const pc = el("div", { class: "pc", hidden: true });
    const termBox = el("div", { class: "term-box", id: "tour-term" }, term, pc);
    const hasDesk = Boolean(sc.desktop);
    const tabsBox = el("div", { class: "desk-tabs", role: "tablist" });
    function setView(v) {
      lv.view = v;
      term.hidden = v !== "console";
      pc.hidden = v !== "desk";
      if (v !== "desk") deskFull(false);
      renderTabs();
      if (v === "desk") renderDesk(); else if (working() && !lv.closed) input.focus();
      persistLive(id);
    }
    /* v0.9: full screen for the desk (Fullscreen API on the desk box; where it is not available, the box fills the window) */
    const isFull = () => document.fullscreenElement === termBox || termBox.classList.contains("pc-max");
    function deskFull(on) {
      if (on) {
        if (termBox.requestFullscreen && document.fullscreenEnabled) termBox.requestFullscreen().then(() => renderDesk()).catch(() => { termBox.classList.add("pc-max"); renderDesk(); });
        else { termBox.classList.add("pc-max"); renderDesk(); }
      } else {
        termBox.classList.remove("pc-max");
        if (document.fullscreenElement === termBox && document.exitFullscreen) document.exitFullscreen().catch(() => {});
      }
    }
    fsHandler = () => { if (!document.fullscreenElement) termBox.classList.remove("pc-max"); renderDesk(); };
    function leaveDesk() { deskFull(false); setView("console"); const tb = tabsBox.querySelector(".qtab"); if (tb) tb.focus(); }
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
      if (!working() || lv.closed) return;
      lv.wins = (lv.wins || []).filter((x) => x !== id).concat(id);   // v0.9: the taskbar's open windows
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
      if (!working() || lv.closed) return;
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
            acts.length && !lv.closed && working() ? el("div", { class: "acts" }, acts.map((x) => el("button", { type: "button", class: "btn ghost sm", text: x.label, onclick: () => deskAction(app.id, x) }))) : null,
            msg,
            app.look ? el("p", { class: "pc-eq" }, el("span", { text: L().equivalent + " " }), el("code", { text: app.look })) : null);
        }
        win = el("div", { class: "pc-win", role: "dialog", "aria-label": title },
          el("div", { class: "pc-title" }, el("span", { text: title }), el("span", { class: "pc-title-btns" },
            el("button", { type: "button", class: "pc-x pc-min", "aria-label": L().pcMin, title: L().pcMin, text: "–", onclick: () => { lv.app = null; renderDesk(); persistLive(id); } }),
            el("button", { type: "button", class: "pc-x", "aria-label": L().accCancel, title: L().accCancel, text: "×", onclick: () => {
              lv.wins = (lv.wins || []).filter((x) => x !== (app === "log" ? "log" : app.id)); lv.app = lv.wins[lv.wins.length - 1] || null; renderDesk(); persistLive(id); } }))),
          el("div", { class: "pc-body" }, body));
      }
      // v0.9: the taskbar: the open windows (the active one pressed), full screen, leaving the desk and a clock in the chosen time zone
      const winTitle = (w) => (w === "log" ? L().evTitle : (d.apps.find((a) => a.id === w) || {}).title || w);
      lv.wins = (lv.wins || []).filter((w) => w === "log" || d.apps.some((a) => a.id === w));
      if (app && !lv.wins.includes(app === "log" ? "log" : app.id)) lv.wins.push(app === "log" ? "log" : app.id);
      const activeId = app ? (app === "log" ? "log" : app.id) : null;
      const full = isFull();
      pc.replaceChildren(el("div", { class: "pc-screen" }, icons, win),
        el("div", { class: "pc-bar", role: "toolbar", "aria-label": L().pcWindows },
          el("span", { class: "pc-brand", text: ">_ " + d.host }),
          el("span", { class: "pc-tasks", role: "group", "aria-label": L().pcWindows }, lv.wins.map((w) => el("button", { type: "button", class: "pc-task" + (w === activeId ? " on" : ""),
            "aria-pressed": w === activeId ? "true" : "false", title: w === activeId ? L().pcMin : L().pcRestore(winTitle(w)), "data-win": w,
            onclick: () => { lv.app = w === activeId ? null : w; lv.deskMsg = null; renderDesk(); persistLive(id); } }, winTitle(w)))),
          el("span", { class: "pc-user", text: sc.machine.domain + "\\" + sc.machine.user }),
          el("button", { type: "button", class: "pc-bar-btn", id: "pc-full", "aria-pressed": full ? "true" : "false", onclick: () => deskFull(!isFull()) },
            el("span", { "aria-hidden": "true", text: full ? "⤡ " : "⤢ " }), full ? L().pcFullExit : L().pcFull),
          el("button", { type: "button", class: "pc-bar-btn", id: "pc-leave", onclick: leaveDesk }, el("span", { "aria-hidden": "true", text: "⏻ " }), L().pcLeave),
          el("span", { class: "pc-clock", "data-clock": "", title: L().pcClock(zone()), text: clock() })));
    }
    const stagesList = el("ul", { class: "stages" });
    const assetBox = el("div");
    const headBox = el("div", { class: "tbar" });
    const shiftBox = el("div", { class: "shift-strip", id: "shift-strip", role: "status", hidden: true });
    const resolveBox = el("div");
    const resultBox = el("div");
    const pendBox = el("div");
    const timelineBox = el("div");
    const chatBox = el("div");        // v0.6a: the conversation with the requester
    const knowBox = el("div");        // v0.6a: "What you know", the clues from the conversation
    const contactBox = el("div", { class: "contact-cta" });
    const shipBox = el("div");        // v0.7b: the shipments of this ticket
    const person = C.who(sc, lang);

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
        actions.length && working() && !lv.closed ? el("div", { class: "acts" }, el("p", { class: "acts-h", text: L().actionsT }),
          actions.map((a) => el("button", { type: "button", class: "btn ghost sm", text: a.label, onclick: () => gui(a.id, a.label) }))) : null));
    }
    // v0.9b: the full shift's strip when this ticket is part of the running shift
    function renderShift() {
      const a = shiftStore().active;
      if (!a || !a.desks.includes(sc.id)) { shiftBox.replaceChildren(); shiftBox.hidden = true; return; }
      const k = a.desks.indexOf(sc.id);
      const isNext = k === a.results.length;
      shiftBox.hidden = false;
      put(shiftBox, el("span", { class: "side-ico", "aria-hidden": "true", text: "⏱" }),
        el("b", { text: L().shStrip(labTitle(a.lab), k + 1, a.desks.length) }),
        el("span", { class: "muted", text: " · " + L().shTimer + " " }), el("span", { class: "mono", "data-shift-timer": "", text: mmssMs(Lv.elapsed(a, Date.now())) }),
        k < a.results.length ? pill("resolved", L().shState.done) : isNext ? null : el("span", { class: "sub", text: " · " + L().shOther }),
        el("span", { class: "grow" }), el("a", { class: "link", href: "#/labs/" + a.lab, text: L().shTitle }));
    }
    function renderHead() {
      const st = lv.closed ? "closed" : statusOf(sc);
      const sla = slaInfo(sc, true);
      const r = rec(id);
      const who = el("span", { class: "assignee" }, el("span", { class: "muted", text: L().assignedTo + " " }), avatarImg(user.avatar, "avatar sm"), el("span", { text: user.name }));
      let buttons;
      if (lv.closed) buttons = [who];
      else if (r && r.status === "progress") buttons = [who,
        el("button", { type: "button", class: "btn ghost sm", id: "wf-pend", "aria-expanded": lv.pendOpen ? "true" : "false", "aria-controls": "wf-pend-box", text: L().pendBtn,
          onclick: () => { lv.pendOpen = !lv.pendOpen; renderHead(); renderPend(); if (lv.pendOpen) { const ta = pendBox.querySelector("textarea"); if (ta) ta.focus(); } } }),
        el("button", { type: "button", class: "btn ghost sm", id: "wf-unassign", text: L().unassignBtn, onclick: () => move("new") })];
      else if (r && W.isPending(r.status)) buttons = [who, el("button", { type: "button", class: "btn sm", id: "wf-resume", text: L().resumeBtn, onclick: () => move("progress") })];
      else buttons = [el("button", { type: "button", class: "btn", id: "assign", text: L().assign, onclick: assign })];
      headBox.replaceChildren(...[
        el("span", { class: "mono strong", text: sc.ticket.id }), prioPill(sc.ticket.priority), pill(st, L().status[st]),
        lv.closed ? null : el("span", { class: "sla-wrap" }, el("span", { class: "muted", text: "SLA " }),
          el("span", { class: "sla " + sla.tone, "data-sla": sc.id, "data-long": "", text: sla.text }), " ", slaDueEl(sc.id, r, E.sla(sc))),
        el("span", { class: "grow" }), el("span", { class: "wf-btns" }, buttons)].filter(Boolean));
    }
    function lockConsole() {
      termBox.querySelectorAll(".term-lock").forEach((n) => n.remove());
      input.disabled = !working() || lv.closed;
      if (lv.closed) return;
      const r = rec(id);
      if (!r) {
        termBox.append(el("div", { class: "term-lock" }, el("p", { class: "strong", text: L().lockedTitle }),
          el("p", { text: L().lockedText(E.sla(sc), sc.ticket.priority) }), el("button", { type: "button", class: "btn", text: L().assign, onclick: assign })));
      } else if (r.status === "new") {
        termBox.append(el("div", { class: "term-lock" }, el("p", { class: "strong", text: L().unassignedTitle }),
          el("p", { text: L().unassignedText(slaInfo(sc, true).text) }), el("button", { type: "button", class: "btn", text: L().assign, onclick: assign })));
      } else if (W.isPending(r.status)) {
        termBox.append(el("div", { class: "term-lock paused", role: "status" }, el("p", { class: "strong", text: L().pausedTitle(L().status[r.status]) }),
          el("p", { text: L().pausedText }), el("button", { type: "button", class: "btn", text: L().resumeBtn, onclick: () => move("progress") })));
      }
    }
    function refreshWork() {
      renderHead(); renderAsset(); lockConsole(); renderResolve(); renderPend(); renderTimeline(); renderDesk(); renderContact(); renderShips(); tick();
    }

    /* ---------- v0.7b: the shipments of this ticket. Their buttons work while the ticket is pending (the vendor and the courier
       go on); each step's simulated time counts against the SLA only while the ticket is in progress */
    function renderShips() {
      if (!sc.ship) return;
      const can = assigned() && !lv.closed;
      const r = rec(id);
      const note = !can ? (lv.closed ? null : L().shNeedAssign(sc.ticket.id)) : W.isPending(r.status) ? L().shPaused : L().shRunning;
      put(shipBox, el("section", { class: "panel ship-card", id: "ship-card" }, el("h2", { text: L().shTicketShips }),
        sess.ships.list.length ? el("ul", { class: "ship-mini" }, sess.ships.list.map((x) => {
          const last = x.events[x.events.length - 1];
          return el("li", {}, el("p", { class: "ship-mini-h" }, el("a", { class: "mono", href: "#/shipping/" + x.id, text: x.id }), " ", shipPill(x),
            el("span", { class: "sub", text: " " + SH.t(SH.TYPES[x.type], lang) + " · " + x.serial })),
            last ? el("p", { class: "fine", text: `${SH.stamp(last.at)} · ${SH.eventText(x, last, lang)}` }) : null,
            can ? el("div", { class: "acts ship-acts" }, shipButtons(x, (cmd) => shipBtn(cmd))) : null);
        })) : el("p", { class: "sub", text: L().shNoTicketShips }),
        note ? el("p", { class: "fine", id: "ship-sla-note", text: note }) : null,
        el("p", { class: "ship-links" }, can ? el("a", { class: "btn ghost sm", href: "#/shipping/new/" + sc.id, id: "ship-new-ticket", text: L().shNewForTicket }) : null,
          " ", el("a", { href: "#/shipping", text: L().shOpenAll }))));
    }
    function shipBtn(cmd) {
      if (!assigned() || lv.closed) return;
      print(`${L().shRan} → ${cmd}`, "dim");
      const r = E.run(sess, cmd, { local: true });
      chargeShip(id, r);
      after(r);
      renderTimeline(); tick();
    }

    /* ---------- v0.6a: contacting the requester. Scripted questions (comms.js), 1 minute of SLA each, kept in the ticket record */
    function renderContact() { renderContactBtn(); renderChat(); renderKnow(); }
    function renderContactBtn() {
      if (lv.closed) { contactBox.replaceChildren(); return; }
      const can = C.canContact(rec(id));
      put(contactBox,
        el("button", { type: "button", class: "btn ghost sm contact-btn", id: "contact-btn", disabled: can.ok ? null : true,
          "aria-expanded": lv.chatOpen && can.ok ? "true" : "false", "aria-controls": "chat-box", "aria-describedby": can.ok ? null : "contact-why",
          onclick: () => { lv.chatOpen = !lv.chatOpen; renderContact(); if (lv.chatOpen) chatBox.scrollIntoView({ behavior: motion(), block: "nearest" }); } },
          el("span", { "aria-hidden": "true", text: "✆ " }), L().cContact),
        can.ok ? null : el("p", { class: "fine contact-why", id: "contact-why", text: L().cOff[can.reason] || "" }),
        (sc.contact || {}).who ? el("p", { class: "fine", text: L().cVia(person.name, person.team) }) : null);
    }
    function renderChat() {
      const r = rec(id);
      if (!lv.chatOpen || lv.closed || !C.canContact(r).ok) { chatBox.replaceChildren(); return; }
      const conv = C.conversation(r, sc, lang);
      const qs = C.questions(sc, sess, r, lang);
      const open = qs.filter((q) => q.available);
      const confirmLater = qs.some((q) => q.confirm && !q.available && !q.asked);
      const bubbles = conv.map((x) => el("li", { class: "chat-ex" + (x.kind === "bad" ? " bad" : "") },
        el("div", { class: "bub me" }, el("span", { class: "bub-who", text: L().cYou }), el("p", { text: x.q }),
          x.kind === "bad" ? el("p", { class: "bub-flag" }, el("b", { text: (x.password ? L().cPassword : L().cBad) + ". " }), x.why) : null),
        el("div", { class: "bub them" + (x.result ? " " + x.result : "") }, el("span", { class: "bub-who", text: person.name }), el("p", { text: x.a }),
          x.result ? el("p", { class: "bub-tag " + x.result, text: x.result === "ok" ? "✓ " + L().cOk : "✗ " + L().cFailed }) : null,
          x.clue ? el("p", { class: "bub-clue", text: "+ " + L().cClueAdded }) : null)));
      chatBox.replaceChildren(el("section", { class: "panel chat", id: "chat-box", "aria-label": L().cTitle(person.name) },
        el("div", { class: "chat-head" }, el("span", { class: "initials", "aria-hidden": "true", text: person.initials }),
          el("span", { class: "chat-h" }, el("b", { text: L().cTitle(person.name) }), el("span", { class: "sub", text: person.team })),
          el("button", { type: "button", class: "pc-x chat-x", "aria-label": L().cClose, title: L().cClose, text: "×", onclick: () => { lv.chatOpen = false; renderContact(); } })),
        el("p", { class: "chat-intro", text: L().cIntro }),
        conv.length ? el("ol", { class: "chat-log", "aria-live": "polite" }, bubbles) : null,
        el("p", { class: "chat-q-h", text: L().cQuestions }),
        open.length ? el("div", { class: "chat-qs" }, open.map((q) => el("button", { type: "button", class: "chat-q" + (q.confirm ? " confirm" : ""), "data-q": q.id,
          onclick: () => askQ(q.id) }, q.confirm ? el("b", { text: L().cConfirm + ": " }) : null, el("span", { text: q.text }), el("span", { class: "chat-cost", text: L().cCost }))))
          : el("p", { class: "sub", text: L().cNoMore }),
        confirmLater ? el("p", { class: "fine", text: L().cConfirmLater }) : null,
        conv.length ? el("p", { class: "fine chat-time", text: L().cTimeAdded(conv.length) }) : null));
    }
    function renderKnow() {
      const list = lv.closed && lv.result && lv.result.clues ? lv.result.clues : C.clues(rec(id), sc, lang);
      put(knowBox, list.length ? el("section", { class: "panel know", id: "know-box" }, el("h2", { text: L().kTitle }),
        el("ul", { class: "know-list" }, list.map((c) => el("li", { text: c })))) : null);
    }
    function askQ(qid) {
      const res = C.ask(rec(id), sess, qid, { now: Date.now(), lang });
      if (!res.ok) { renderContact(); return; }
      setWork(id, res.rec);
      renderContact(); renderTimeline(); tick();
      const log = chatBox.querySelector(".chat-log");
      if (log && log.lastElementChild) log.lastElementChild.scrollIntoView({ behavior: motion(), block: "nearest" });
    }
    function assign() {
      setWork(id, W.assign(work()[id], Date.now()));
      lv.pendOpen = false;
      refreshWork();
      input.focus();
    }
    // a workflow change (pending, resume, unassign): recorded in the activity with its reason
    function move(to, reason) {
      const res = W.transition(work()[id], to, { now: Date.now(), reason });
      if (!res.ok) return res;
      setWork(id, res.rec);
      lv.pendOpen = false;
      refreshWork();
      if (to === "progress") input.focus();
      return res;
    }
    function renderPend() {
      const r = rec(id);
      if (!lv.pendOpen || lv.closed || !r || r.status !== "progress") { pendBox.replaceChildren(); return; }
      const state = el("select", { id: "wf-state", "aria-label": L().pendState },
        W.PENDING.map((k) => el("option", { value: k, text: L().status[k] })));
      const ta = el("textarea", { id: "wf-reason", maxlength: String(W.REASON_MAX), placeholder: L().pendPh, "aria-describedby": "wf-count" });
      const count = el("p", { class: "fine wf-count", id: "wf-count", "aria-live": "polite" });
      const msg = el("p", { class: "form-msg", role: "alert" });
      const upd = () => { const n = W.cleanReason(ta.value).length; count.textContent = L().pendCount(n, W.REASON_MIN); count.classList.toggle("ok", n >= W.REASON_MIN); };
      ta.addEventListener("input", upd); upd();
      pendBox.replaceChildren(el("section", { class: "panel note wf-pend", id: "wf-pend-box" }, el("h2", { text: L().pendTitle }), el("p", { text: L().pendText }),
        el("label", { class: "field" }, el("span", { class: "field-label", text: L().pendState }), state),
        el("label", { class: "field" }, el("span", { class: "field-label", text: L().pendReason }), ta), count, msg,
        el("div", { class: "row" },
          el("button", { type: "button", class: "btn", id: "wf-pend-ok", text: L().pendOk, onclick: () => {
            const res = move(state.value, ta.value);
            if (!res.ok) { msg.textContent = res.error === "reason" ? L().pendNeedReason(W.REASON_MIN) : L().errors.bad_request; ta.focus(); }
          } }),
          el("button", { type: "button", class: "btn ghost", text: L().accCancel, onclick: () => { lv.pendOpen = false; renderHead(); renderPend(); } }))));
    }
    function renderTimeline() {
      const r = rec(id);
      const items = lv.closed && lv.timeline ? lv.timeline : r ? r.timeline : [];
      const time = (ts) => clock(ts);
      timelineBox.replaceChildren(el("section", { class: "panel timeline", id: "wf-timeline" }, el("h2", { text: L().tlTitle }),
        items.length ? el("ol", { class: "tl" }, items.slice().reverse().map((x) => x.ship
          // v0.7b: a step of one of the ticket's shipments, with what it cost the SLA
          ? el("li", { class: "tl-ship" }, el("p", { class: "tl-head" }, el("time", { datetime: new Date(x.at).toISOString(), text: time(x.at) }),
              el("span", { text: L().shTl(x.ship, SH.t(SH.STATE[x.state] || { en: x.state }, lang)) }),
              x.ms > 0 ? el("span", { class: "tl-cost" + (x.charged ? "" : " free"), text: x.charged ? L().shCost(hours(x.ms)) : L().shFree }) : null))
          : x.contact
          // v0.6a: a question to the requester
          ? el("li", { class: "tl-contact" }, el("p", { class: "tl-head" }, el("time", { datetime: new Date(x.at).toISOString(), text: time(x.at) }),
              el("span", { text: L().tlContact }), el("span", { class: "tl-cost", text: L().cCost })),
            el("p", { class: "tl-reason", text: L().tlContactQ(C.questionText(sc, x.contact, lang)) }))
          : el("li", { class: "tl-" + x.to },
          el("p", { class: "tl-head" }, el("time", { datetime: new Date(x.at).toISOString(), text: time(x.at) }),
            el("span", { text: `${L().status[x.from] || x.from} → ${L().status[x.to] || x.to}` })),
          x.reason ? el("p", { class: "tl-reason", text: x.reason }) : null)))
          : el("p", { class: "sub", text: L().tlEmpty })));
    }
    function after(r) {
      after0(r);
      persistLive(id);
    }
    function after0(r) {
      if (r.clear) { out.replaceChildren(); lv.log = []; }
      if (r.ticket) ticketLines();
      r.lines.forEach((l) => print(l.text, l.kind));
      psSpan.textContent = E.prompt(sess);
      renderStages(); renderAsset(); renderDesk(); renderShips();
      if (lv.chatOpen) renderChat();   // the confirmation question appears once a fix is in
      if (r.resolvedNow) { print(L().readyMsg, "ok"); const ta = resolveBox.querySelector("textarea"); if (ta) ta.scrollIntoView({ behavior: motion(), block: "center" }); }
      term.scrollTop = term.scrollHeight;
    }
    function ticketLines() {
      print(`[${sc.ticket.id}] ${sc.ticket.priority} · ${sc.ticket.from}`, "dim");
      print(t(sc.ticket.subject, lang), "say");
      print(t(sc.ticket.body, lang), "dim");
    }
    function exec(cmd) {
      if (!cmd.trim() || !working() || lv.closed) return;
      lv.hist.push(cmd); lv.pos = lv.hist.length;
      print(E.prompt(sess) + cmd, "cmd");
      const r = E.run(sess, cmd);
      chargeShip(id, r);     // v0.7b: a `ship` step typed in the console costs its simulated time (in progress: always)
      after(r);
      if (r.ship) { renderTimeline(); tick(); }
    }
    function gui(actionId, label) {
      if (!working() || lv.closed) return;
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
      if (!working()) {
        resolveBox.replaceChildren(el("section", { class: "panel note" }, el("h2", { text: L().resTitle }), el("p", { class: "wf-hold", text: L().resolvePending }),
          el("div", { class: "row" }, el("button", { type: "button", class: "btn", text: L().resumeBtn, onclick: () => move("progress") }))));
        return;
      }
      const code = el("select", { "aria-label": L().resCode },
        el("option", { value: "", text: L().resPick }), E.CODES.map((c) => el("option", { value: c.id, text: t(c.label, lang) })));
      const ta = el("textarea", { "aria-label": L().resNote, maxlength: "2000", placeholder: L().resPlaceholder });
      // v0.6a: the note the requester reads, marked apart (comms.js), with closing templates whose [gaps] must be replaced
      const ua = el("textarea", { id: "user-note", "aria-label": L().uNote, "aria-describedby": "user-note-help user-note-live", maxlength: "1500", placeholder: L().uPh });
      if (lv.draft) { ta.value = lv.draft.note; code.value = lv.draft.code; ua.value = lv.draft.userNote || ""; }
      const live = el("div", { class: "unote-live", id: "user-note-live", "aria-live": "polite" });
      const ctx = { name: person.first, device: sc.requester.device, lang };
      const updLive = () => {
        if (!ua.value.trim()) { live.replaceChildren(); return; }
        const chk = C.checkUserNote(ua.value, ctx);
        live.replaceChildren(el("p", { class: "unote-score", text: L().uLive(chk.score) }),
          el("ul", { class: "unote-rules" }, C.describe(chk, lang).map((rl) => el("li", { class: rl.ok ? "ok" : "no" },
            el("span", { "aria-hidden": "true", text: rl.ok ? "✓ " : "✗ " }), rl.label, rl.problems.length ? el("span", { class: "sub", text: " · " + rl.problems.join(" · ") }) : null))));
      };
      const keep = () => { lv.draft = { note: ta.value, code: code.value, userNote: ua.value }; clearTimeout(lv.saveT); lv.saveT = setTimeout(() => persistLive(id), 500); };
      ta.addEventListener("input", keep); code.addEventListener("change", keep);
      ua.addEventListener("input", () => { keep(); updLive(); });
      const insert = (tid) => {
        const text = C.template(tid, lang, { name: person.first, me: user ? user.name : "" });
        ua.value = ua.value.trim() ? ua.value.replace(/\s+$/, "") + "\n\n" + text : text;
        keep(); updLive(); ua.focus();
        const gap = ua.value.indexOf("[");
        if (gap !== -1) ua.setSelectionRange(gap, ua.value.indexOf("]", gap) + 1);
      };
      updLive();
      const msg = el("p", { class: "form-msg", role: "alert" });
      resolveBox.replaceChildren(el("section", { class: "panel note", id: "resolve-panel" }, el("h2", { text: L().resTitle }), el("p", { text: L().resText }),
        el("label", { class: "field" }, el("span", { class: "field-label", text: L().resCode }), code),
        el("label", { class: "field" }, el("span", { class: "field-label", text: L().resNote }), ta),
        el("div", { class: "field unote" }, el("label", { class: "field-label", for: "user-note", text: L().uNote }),
          el("p", { class: "fine", id: "user-note-help", text: L().uHelp }),
          el("div", { class: "tpl-row", role: "group", "aria-label": L().uTemplates }, el("span", { class: "tpl-h", text: L().uTemplates }),
            C.TEMPLATES.map((tp) => el("button", { type: "button", class: "chip-btn", "data-tpl": tp.id, text: t(tp.label, lang), onclick: () => insert(tp.id) }))),
          ua, live), msg,
        el("div", { class: "row" }, el("button", { type: "button", class: "btn", text: L().resolveBtn, onclick: () => {
          if (!code.value) { msg.textContent = L().needCode; code.focus(); return; }
          if (ta.value.trim().length < 10) { msg.textContent = L().noteEmpty; ta.focus(); return; }
          close(code.value, ta.value, ua.value);
        } }))));
    }

    function close(codeId, text, userText) {
      if (!W.canResolve(rec(id))) { renderResolve(); return; }   // pending: resume first
      const note = E.checkNote(sc, text, lang);
      const now = Date.now();
      const minutes = minutesOn(id);                   // without the pauses: a legitimate wait is never penalised (talking to the requester counts)
      const paused = W.pausedMs(rec(id), now) / 60000;
      const v = E.verdict(sess, note, { code: codeId, minutes });
      // v0.6a: the user note and the conversation are marked apart: they never change the verdict or the points
      const uCheck = String(userText || "").trim() ? C.checkUserNote(userText, { name: person.first, device: sc.requester.device, lang }) : null;
      const cSum = C.summary(rec(id), sc);
      const comms = C.evaluate(cSum, uCheck);
      lv.result = { v, note, minutes, code: codeId, paused, uCheck, cSum, comms, clues: C.clues(rec(id), sc, lang) };
      if (v.level !== "unresolved") {
        lv.closed = true;
        const fin = W.transition(work()[id], "closed", { now });
        lv.timeline = fin.ok ? fin.rec.timeline : rec(id).timeline;
        const prev = progress[sc.id];
        if (!prev || v.points >= prev.points) {
          progress[sc.id] = { points: v.points, stars: v.stars, date: today(), level: v.level };
          save("progress", progress);
        }
        api("/api/progress", "PUT", { results: { [sc.id]: { points: v.points, stars: v.stars } } });
        // v0.4: a complete note becomes (a new version of) the knowledge base article, and the close counts for the streak and the badges
        if (G.qualifies(v.level, note)) {
          const k = G.saveArticle(load("kb", {}), { deskId: sc.id, ticketId: sc.ticket.id, note: text, code: codeId, points: v.points, lang, day: today() });
          if (k.changed) save("kb", k.kb);
          lv.result.kb = { saved: k.changed, version: k.entry.version };
        }
        // v0.9b: the full shift counts this close if it is the shift's next ticket (before the badges, so a finished shift earns its badge now)
        const sh = Lv.record(shiftStore(), { id: sc.id, level: v.level, points: v.points, hints: sess.hints, at: now }, today());
        if (sh.counted) {
          setShifts(sh.store);
          const n = sh.entry ? sh.entry.results.length : sh.store.active.desks.length;
          lv.result.shift = { lab: sh.entry ? sh.entry.lab : sh.store.active.lab, k: sh.entry ? n : sh.store.active.results.length, n, finished: sh.finished, firstTime: sh.firstTime,
            next: sh.finished ? null : Lv.current(sh.store) };
        }
        freshGoals = [];
        lv.result.fresh = logActivity({ type: "ticket", id: sc.id, level: v.level, points: v.points, hints: sess.hints, slaOk: v.slaOk, codeOk: v.codeOk,
          code: codeId, noteComplete: note.missing.length === 0 && note.words >= 15, failed: sess.failedCloses,
          userNote: comms.userNote, useful: cSum.useful, bad: cSum.bad, asked: cSum.asked, bonus: comms.bonus });
        lv.result.goals = freshGoals.slice();
        freshGoals = [];
        setWork(id, null);
        lv.draft = null;
        persistLive(id);   // v0.9: a closed ticket forgets its saved console
        refreshBadge();
        celebrate(lv.result.fresh && lv.result.fresh.length ? "badge" : "resolved");
      } else {
        // v0.9b: a false closure (closed before it was fixed) is counted apart; it is not a day of practice for the streak
        logActivity({ type: "attempt", id: sc.id, failed: sess.failedCloses });
        persistLive(id);
      }
      renderShift();
      renderHead(); renderAsset(); lockConsole(); renderResolve(); renderPend(); renderTimeline(); renderContact(); showResult();
      resultBox.scrollIntoView({ behavior: motion(), block: "start" });
    }

    function showResult() {
      if (!lv.result) { resultBox.replaceChildren(); return; }
      const { v, note, minutes, code, paused } = lv.result;
      const nextSc = SCENARIOS.find((s) => s.id !== sc.id && isOpen(s));
      const list = (title, items, cls) => items.length ? el("div", {}, el("b", { text: title }), el("ul", { class: cls }, items.map((x) => el("li", { text: x })))) : null;
      if (v.level === "unresolved") {
        resultBox.replaceChildren(el("section", { class: "panel result lvl-unresolved" },
          el("p", { class: "lvl" }, pill("unresolved", L().lvl.unresolved)), el("h3", { text: L().unresolvedTitle }), el("p", { text: L().unresolvedText }),
          list(L().whyT, v.reasons, "missing"),
          el("details", {}, el("summary", { text: L().solution }), el("div", { class: "solution", text: sc.solution.join("\n") })),
          el("div", { class: "row" }, el("button", { type: "button", class: "btn", text: L().keepWorking, onclick: () => {
            lv.result = null; showResult(); input.focus(); term.scrollIntoView({ behavior: motion(), block: "start" });
          } }), el("a", { class: "btn ghost", href: sc.guide, target: "_blank", rel: "noopener noreferrer", text: L().guide }))));
        return;
      }
      resultBox.replaceChildren(el("section", { class: "panel result lvl-" + v.level },
        el("p", { class: "lvl" }, pill(v.level, L().lvl[v.level])),
        el("div", { class: "big-stars" }, "★".repeat(v.stars), el("span", { class: "off", text: "★".repeat(3 - v.stars) })),
        el("h3", { text: `${v.points} ${L().points}` }),
        el("p", { class: "facts" }, el("span", { text: L().timeUsed(Math.ceil(minutes), E.sla(sc)) }), el("span", { text: L().codeUsed(E.codeLabel(code, lang)) }),
          el("span", { text: L().hintsUsed(sess.hints) }), paused >= 1 / 60 ? el("span", { class: "wf-paused", text: L().pausedUsed(mmss(paused)) }) : null),
        list(L().obsT, v.reasons, "missing"),
        list(L().found, note.found, "found"),
        commsResult(lv.result, note),
        lv.result.kb ? el("p", { class: "kb-saved" }, el("span", { class: "side-ico", "aria-hidden": "true", text: "▧" }),
          el("span", { text: (lv.result.kb.saved ? L().kbSaved(lv.result.kb.version) : L().kbSame) + " " }), el("a", { href: "#/kb/" + sc.id, text: L().kbOpenArticle }))
          : el("p", { class: "kb-saved muted", text: L().kbNotSaved }),
        (lv.result.fresh || []).map((b) => el("p", { class: "badge-new" }, el("span", { class: "side-ico", "aria-hidden": "true", text: "★" }), el("span", { text: L().newBadge(badgeName(b)) }))),
        (lv.result.goals || []).map((gid) => { const g = Lv.goal(gid); return g ? el("p", { class: "badge-new goal-new" }, el("span", { class: "side-ico", "aria-hidden": "true", text: "◔" }), el("span", { text: L().wgFresh(t(g.label, lang), g.points) })) : null; }),
        lv.result.shift ? el("p", { class: "badge-new shift-new", id: "shift-result" }, el("span", { class: "side-ico", "aria-hidden": "true", text: "⏱" }),
          el("span", { text: (lv.result.shift.finished ? L().shFinished + " " : L().shCounted(lv.result.shift.k, lv.result.shift.n) + " ") }),
          lv.result.shift.finished ? el("a", { href: "#/labs/" + lv.result.shift.lab, id: "shift-summary-link", text: L().shSeeSummary })
            : el("a", { href: "#/desk/" + lv.result.shift.next, id: "shift-next-link", onclick: () => freeShiftDesk(lv.result.shift.next), text: L().shGo })) : null,
        el("details", {}, el("summary", { text: L().sample }), el("blockquote", { text: t(sc.sampleNote, lang) })),
        el("details", {}, el("summary", { text: L().solution }), el("div", { class: "solution", text: sc.solution.join("\n") })),
        el("div", { class: "row" }, nextSc ? el("a", { class: "btn", href: "#/desk/" + nextSc.id, text: L().next }) : null,
          el("a", { class: "btn ghost", href: "#/", text: L().queueBtn }),
          el("a", { class: "btn ghost", href: sc.guide, target: "_blank", rel: "noopener noreferrer", text: L().guide }))));
    }

    // v0.6a: the two marks side by side (work note, note to the user), then the communication bonus and remarks
    function commsResult(res, note) {
      const total = note.found.length + note.missing.length;
      const u = res.uCheck;
      const words = u ? C.describe(u, lang) : [];
      const cm = res.comms || { bonus: 0, credits: [], remarks: [] };
      const credit = (cr) => cr.id === "questions" ? L().commsCredit.questions(cr.n, cr.points) : L().commsCredit[cr.id](cr.points);
      const remark = (rm) => rm.id === "bad" ? L().commsRemark.bad(rm.n) : L().commsRemark[rm.id];
      return el("div", { class: "comms-res", id: "comms-result" },
        el("div", { class: "marks" },
          el("p", { class: "mark" + (note.missing.length ? " part" : " full"), id: "mark-work" }, el("span", { class: "mark-l", text: L().mWork + ": " }),
            el("span", { class: "mark-n", text: `${note.found.length}/${total}` })),
          el("p", { class: "mark" + (!u ? " none" : u.score === 5 ? " full" : " part"), id: "mark-user" }, el("span", { class: "mark-l", text: L().mUser + ": " }),
            el("span", { class: "mark-n", text: u ? `${u.score}/5` : L().mUserNone }))),
        u && u.score < 5 ? el("ul", { class: "missing unote-miss" }, words.filter((w) => !w.ok).map((w) => el("li", {}, w.label, w.problems.length ? el("span", { class: "sub", text: " · " + w.problems.join(" · ") }) : null))) : null,
        el("b", { text: L().commsT }),
        el("p", { class: "comms-bonus" + (cm.bonus ? "" : " muted"), text: L().commsBonus(cm.bonus) }),
        cm.credits.length ? el("ul", { class: "found" }, cm.credits.map((cr) => el("li", { text: credit(cr) }))) : null,
        cm.remarks.length ? el("ul", { class: "missing" }, cm.remarks.map((rm) => el("li", { class: rm.id === "password" ? "pw" : null, text: remark(rm) }))) : null);
    }

    const c = E.cards(sess);
    const r = c.requester;
    view.append(
      el("div", { class: "desk-bar" }, el("a", { href: "#/", text: L().back }), el("h1", { text: t(sc.title, lang) })),
      headBox, shiftBox,
      el("div", { class: "desk" },
        el("aside", {},
          el("section", { class: "panel" }, el("h2", { text: L().ticket }),
            el("p", { class: "ticket-subject", text: t(sc.ticket.subject, lang) }), el("p", { class: "ticket-body", text: t(sc.ticket.body, lang) })),
          el("section", { class: "panel" }, el("h2", { text: L().requester }),
            el("p", { class: "req-name" }, el("span", { class: "initials", "aria-hidden": "true", text: r.name.split(" ").map((x) => x[0]).join("").slice(0, 2) }),
              el("span", {}, el("b", { text: r.name }), el("span", { class: "sub", text: r.team }))),
            el("dl", { class: "fields" }, el("dt", { text: L().fUser }), el("dd", { class: "mono", text: r.user }),
              el("dt", { text: L().fLocation }), el("dd", { text: r.location }), el("dt", { text: L().fDevice }), el("dd", { class: "mono", text: r.device })),
            contactBox),
          knowBox,
          assetBox,
          shipBox,
          el("section", { class: "panel" }, el("h2", { text: L().context }), el("p", { class: "intro", text: t(sc.intro, lang) })),
          el("section", { class: "panel" }, el("h2", { text: L().stages }), stagesList),
          timelineBox,
          el("section", { class: "panel tools" },
            el("button", { type: "button", class: "btn ghost", text: L().hint, onclick: () => { if (working() && !lv.closed) { exec("hint"); input.focus(); } } }),
            el("button", { type: "button", class: "btn ghost", text: L().restart, onclick: () => { dropLive(id); desk(id); } }),
            el("a", { class: "btn ghost", href: sc.guide, target: "_blank", rel: "noopener noreferrer", text: L().guide }),
            // v0.8: the library article of the ticket's area (it teaches the area, never the ticket)
            Lib.forDesk(sc.id).slice(0, 1).map((a) => el("a", { class: "btn ghost", href: "#/library/" + a.id, id: "desk-library", text: L().libOneArticle })))),
        el("div", {}, pendBox, chatBox, tabsBox, termBox, el("p", { class: "term-help", text: L().termHelp }), resolveBox, resultBox)));

    if (!lv.log.length) {
      print(L().welcome.replace("{host}", sc.machine.host).replace("{user}", sc.machine.domain + "\\" + sc.machine.user), "dim");
      if (sc.net) print(L().netWelcome, "dim");
      print("", "out");
    } else lv.log.forEach((l) => print(l.text, l.kind, false));
    if (lv.restored) { lv.restored = false; print(L().restored, "dim"); }
    renderHead(); renderShift(); renderStages(); renderAsset(); lockConsole(); renderResolve(); renderPend(); renderTimeline(); renderContact(); renderShips(); showResult();
    if (hasDesk) setView(lv.view || "console");
    term.scrollTop = term.scrollHeight;
    if (working() && !lv.closed) input.focus();
  }

  /* ---------- v0.9b: the level panel and the close counters (Progress and Profile) */
  function levelPanel(pfx) {
    const l = levelNow();
    return el("section", { class: "panel lvl-panel", id: pfx + "-level" },
      el("div", { class: "lvl-top" }, el("span", { class: "lvl-badge", "aria-hidden": "true", text: String(l.index + 1) }),
        el("div", { class: "grow" }, el("p", { class: "tile-l", text: L().lvTitle }), el("h2", { class: "lvl-h", id: pfx + "-level-name", text: l.name })),
        el("p", { class: "lvl-total" }, el("b", { class: "mono", id: pfx + "-level-pts", text: String(l.total) }), el("span", { class: "sub", text: " " + L().lvPoints(l.total).replace(/^\d+\s*/, "") }))),
      levelBar(l, pfx + "-level-bar"),
      el("p", { class: "tile-x", id: pfx + "-level-next", text: l.next ? L().lvNext(l.toNext, l.next.name) : L().lvTop }),
      el("p", { class: "fine", text: L().lvBreak(l.parts) }),
      el("details", { class: "lvl-how" }, el("summary", { text: L().lvLadder }), el("p", { class: "fine", text: L().lvHow }),
        el("ol", { class: "lvl-ladder" }, Lv.LEVELS.map((x, k) => el("li", { class: k === l.index ? "on" : k < l.index ? "past" : "" },
          el("b", { text: t(x.name, lang) }), el("span", { class: "mono", text: " · " + L().lvFrom(x.min) }))))));
  }
  function countersBlock(pfx) {
    const c = Lv.closeCounts(activity());
    const tile = (n, label, x, id) => el("div", { class: "tile closes-" + id, id: pfx + "-cc-" + id }, el("p", { class: "tile-n", text: String(n) }), el("p", { class: "tile-l", text: label }), el("p", { class: "tile-x", text: x }));
    return el("section", { class: "closes", "aria-label": L().ccTitle }, el("h2", { class: "closes-h", text: L().ccTitle }),
      el("div", { class: "tiles closes-tiles" }, tile(c.clean, L().ccClean, L().ccCleanX, "clean"), tile(c.remarks, L().ccRemarks, L().ccRemarksX, "remarks"), tile(c.false, L().ccFalse, L().ccFalseX, "false")));
  }

  /* ---------- progress */
  function progressPage() {
    const view = shell("progress");
    document.title = L().pTitle + " · SysAdmin Desks";
    const done = SCENARIOS.filter((s) => progress[s.id]);
    const starsSum = done.reduce((a, s) => a + progress[s.id].stars, 0);
    const pointsSum = done.reduce((a, s) => a + progress[s.id].points, 0);
    const tile = (n, label, ...extra) => el("div", { class: "tile" }, el("p", { class: "tile-n", text: n }), el("p", { class: "tile-l", text: label }), extra);
    // v0.4: streak, weekly goal, mail score and knowledge base, from this browser
    awardNow();
    const day = today();
    const act = activity();
    const st = G.streak(act, day);
    const goal = G.goalValue(load("goal", G.GOAL.def));
    const wk = G.week(act, day, goal);
    const answers = mailAnswers();
    const ms = G.mailScore(answers);
    const kbN = Object.keys(load("kb", {}) || {}).length;
    const cs = G.commsStats(act);
    const goalSel = el("select", { class: "goal-sel", id: "goal-sel", onchange: (ev) => { save("goal", G.goalValue(ev.target.value)); progressPage(); } },
      Array.from({ length: G.GOAL.max - G.GOAL.min + 1 }, (_, i) => G.GOAL.min + i).map((n) => el("option", { value: String(n), selected: n === goal, text: String(n) })));
    const bar = el("progress", { class: "goal-bar", max: String(wk.target), value: String(Math.min(wk.done, wk.target)), "aria-label": `${L().gWeek}: ${wk.done} / ${wk.target}` });
    const list = Lv.badges(load("badges", {}), lang);
    const earned = list.filter((b) => b.earned).length;
    const h2 = (text, extra) => el("div", { class: "p-h" }, el("h2", { text }), extra || null);
    // v0.9b: this week's goals and the past weeks
    const wkKey = Lv.weekAt(Date.now(), zone());
    const weekly = load("weekly", null);
    const goals = Lv.goalProgress(wkKey, act, { weekly, lang, levels: DESK_LEVELS() });
    const past = Lv.history(weekly, wkKey);
    view.append(
      el("header", { class: "view-head" }, el("div", {}, el("h1", { text: L().pTitle }), el("p", { class: "sub", text: L().pSub }))),
      levelPanel("p"),
      countersBlock("p"),
      h2(L().wgTitle, el("span", { class: "count-pill", id: "wg-count", text: `${goals.filter((g) => g.claimed).length}/${goals.length}` })),
      el("p", { class: "sub", text: L().wgSub(wkKey) }),
      el("ul", { class: "wgoals", id: "wgoals" }, goals.map((g) => el("li", { class: "panel wgoal" + (g.claimed ? " on" : ""), "data-goal": g.id },
        el("p", { class: "wgoal-h" }, el("span", { class: "wgoal-box", "aria-hidden": "true", text: g.claimed ? "✓" : "" }), el("b", { text: g.label })),
        el("progress", { class: "goal-bar", max: String(g.target), value: String(g.have), "aria-label": `${g.label}: ${g.have} / ${g.target}` }),
        el("p", { class: "tile-x" }, el("span", { class: "mono", text: `${g.have}/${g.target}` }), " · ",
          el("span", { class: "wgoal-pts", text: L().wgReward(g.points) }), " · ", g.claimed ? pill("resolved", L().wgDone(g.claimed)) : el("span", { class: "muted", text: L().wgOpen }))))),
      el("details", { class: "wg-hist", id: "wg-history" }, el("summary", { text: L().wgHistory + ` (${past.length})` }),
        past.length ? el("ul", { class: "wg-past" }, past.map((w) => el("li", { class: w.full ? "on" : "" }, el("b", { class: "mono", text: w.week }), " ",
          el("span", { text: L().wgRow(w.done, w.total, w.points) }), w.full ? [" ", pill("resolved", L().wgFull)] : null,
          el("span", { class: "sub", text: w.goals.map((id) => t(Lv.goal(id).label, lang)).join(" · ") })))) : el("p", { class: "fine", text: L().wgNoHistory })),
      el("div", { class: "tiles growth" },
        tile(String(st.current), L().gStreak, el("p", { class: "tile-x", text: L().gBest(st.best) + " · " + (st.today ? L().gTodayDone : L().gToday) })),
        tile(`${wk.done}/${wk.target}`, L().gWeek, bar,
          el("p", { class: "tile-x goal-row" }, el("label", { for: "goal-sel", text: L().gGoalLabel }), goalSel),
          el("p", { class: "tile-x", text: wk.met ? L().gGoalMet : L().gGoalHelp })),
        tile(`${ms.correct}/${ms.total}`, L().gMail, el("p", { class: "tile-x" }, el("a", { href: "#/mail", text: L().gOpen + " " + L().navMail.toLowerCase() }))),
        tile(String(kbN), L().gKb, el("p", { class: "tile-x" }, el("a", { href: "#/kb", text: L().gOpen + " " + L().navKb.toLowerCase() }))),
        // v0.6a: useful questions asked and the average mark of the notes for the user
        tile(cs.average == null ? "–" : `${cs.average}/5`, L().gComms, el("p", { class: "tile-x", id: "comms-tile", text: L().gCommsX(cs.useful, cs.average) }))),
      h2(L().pTickets),
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
        })))),
      h2(L().bTitle, el("span", { class: "count-pill", text: L().bCount(earned, list.length) })),
      el("div", { id: "badges" }, ["core", "area", "docs", "goals", "shift"].map((grp) => {
        const items = list.filter((b) => b.group === grp);
        return [el("h3", { class: "bdg-group", text: L().bGroups[grp] + ` · ${items.filter((b) => b.earned).length}/${items.length}` }),
          el("ul", { class: "badges", "data-group": grp }, items.map((b) => el("li", { class: "bdg" + (b.earned ? " on" : ""), "data-badge": b.id },
            el("span", { class: "bdg-ico", "aria-hidden": "true", text: b.icon }),
            el("span", { class: "bdg-txt" }, el("b", { text: b.name }), el("span", { class: "sub", text: b.rule }),
              el("span", { class: "bdg-st", text: b.earned ? L().bEarned(b.day) : L().bLocked })))))];
      })),
      h2(L().mScoreTitle, el("span", { class: "count-pill", text: `${ms.correct}/${ms.total}` })),
      el("div", { class: "qwrap" }, el("table", { class: "qtable" },
        el("thead", {}, el("tr", {}, [L().colMessage, L().colResult, L().mDate].map((x) => el("th", { scope: "col", text: x })))),
        el("tbody", {}, G.MAIL.map((m) => {
          const a = answers[m.id];
          return el("tr", {},
            el("td", { class: "subj", "data-label": L().colMessage }, el("a", { href: "#/mail/" + m.id, text: t(m.subject, lang) }), el("span", { class: "sub", text: t(m.from.name, lang) })),
            el("td", { "data-label": L().colResult }, a ? pill(RES_PILL[a.result], L().res[a.result]) : el("span", { class: "muted", text: L().mNotAnswered })),
            el("td", { "data-label": L().mDate, text: a ? a.day : "" }));
        })))));
  }
  const RES_PILL = { correct: "resolved", partial: "observations", wrong: "unresolved" };

  /* ---------- v0.4: knowledge base (#/kb, #/kb/<deskId>) */
  let kbQuery = "";
  let kbTopic = "";
  function kbArticles() {
    const kb = load("kb", {}) || {};
    return SCENARIOS.filter((sc) => kb[sc.id]).map((sc) => G.buildArticle(sc, kb[sc.id], lang, E.codeLabel));
  }
  function kbPage(id) {
    const view = shell("kb");
    const all = kbArticles();
    if (id) return kbArticle(view, all.find((a) => a.deskId === id), id);
    document.title = L().kbTitle + " · SysAdmin Desks";
    view.append(el("header", { class: "view-head" }, el("div", {}, el("h1", { text: L().kbTitle }), el("p", { class: "sub", text: L().kbSub }))));
    if (!all.length) {
      view.append(el("section", { class: "panel kb-empty" }, el("span", { class: "kb-empty-ico", "aria-hidden": "true", text: "▧" }), el("h2", { text: L().kbEmptyT }),
        el("p", { text: L().kbEmpty }), el("a", { class: "btn", href: "#/", text: L().kbEmptyBtn })));
      return;
    }
    const topics = Array.from(new Set(all.map((a) => a.topic)));
    if (kbTopic && !topics.includes(kbTopic)) kbTopic = "";
    const listBox = el("div");
    const search = el("input", { type: "search", class: "dir-search kb-search", placeholder: L().kbSearch, "aria-label": L().kbSearch, value: kbQuery });
    search.addEventListener("input", () => { kbQuery = search.value; renderList(); });
    const chips = el("div", { class: "qtabs", role: "tablist" });
    function renderChips() {
      chips.replaceChildren(...[["", L().kbAll]].concat(topics.map((x) => [x, x])).map(([k, text]) => el("button", { type: "button", role: "tab", class: "qtab" + (kbTopic === k ? " on" : ""),
        "aria-selected": kbTopic === k ? "true" : "false", onclick: () => { kbTopic = k; renderChips(); renderList(); } }, text + " ",
        el("span", { class: "count", text: String(all.filter((a) => !k || a.topic === k).length) }))));
    }
    function renderList() {
      const shown = G.searchKb(all, kbQuery, kbTopic);
      put(listBox, el("p", { class: "sub kb-count", "aria-live": "polite", text: L().kbCount(shown.length) }),
        shown.length ? el("div", { class: "qwrap" }, el("table", { class: "qtable" },
          el("thead", {}, el("tr", {}, [L().colTicket, L().colSubject, L().colTopic, L().colVersion, L().colDate].map((x) => el("th", { scope: "col", text: x })))),
          el("tbody", {}, shown.map((a) => el("tr", {},
            el("td", { class: "mono", "data-label": L().colTicket, text: a.ticketId }),
            el("td", { class: "subj", "data-label": L().colSubject }, el("a", { href: "#/kb/" + a.deskId, text: a.title }), el("span", { class: "sub", text: a.symptom.subject })),
            el("td", { "data-label": L().colTopic, text: a.topic }),
            el("td", { class: "mono", "data-label": L().colVersion, text: "v" + a.version }),
            el("td", { "data-label": L().colDate, text: a.day }))))))
          : el("p", { class: "empty", text: L().kbNone }));
    }
    renderChips(); renderList();
    view.append(el("div", { class: "kb-filters" }, search, chips), listBox);
  }
  function kbArticle(view, a, id) {
    const sc = SCENARIOS.find((s) => s.id === id);
    if (!a) {
      document.title = L().kbTitle + " · SysAdmin Desks";
      view.append(el("p", { class: "kb-back" }, el("a", { href: "#/kb", text: L().kbBack })),
        el("section", { class: "panel kb-empty" }, el("h2", { text: L().kbNoArticle }), el("p", { text: L().kbEmpty }),
          sc ? el("a", { class: "btn", href: "#/desk/" + sc.id, text: L().kbReplay }) : el("a", { class: "btn", href: "#/", text: L().kbEmptyBtn })));
      return;
    }
    const Lb = a.labels;
    document.title = `${a.title} · KB ${a.ticketId} v${a.version}`;
    const msg = el("p", { class: "kb-msg", role: "status" });
    function download() {
      const name = G.fileName(a);
      try {
        const url = URL.createObjectURL(new Blob([G.toMarkdown(a)], { type: "text/markdown;charset=utf-8" }));
        const link = el("a", { href: url, download: name, class: "kb-dl" });
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        msg.textContent = L().kbDownloaded(name);
      } catch (e) { msg.textContent = L().errors.server; }
    }
    const meta = [[Lb.ticket, a.ticketId], [Lb.version, "v" + a.version], [Lb.date, a.day], [Lb.topic, a.topic], [Lb.code, a.code]];
    view.append(
      el("p", { class: "kb-back" }, el("a", { href: "#/kb", text: L().kbBack })),
      el("article", { class: "panel kb-article", "aria-labelledby": "kb-h" },
        el("p", { class: "kb-kicker", text: `${Lb.kb} · ${a.ticketId} · v${a.version}` }),
        el("h1", { id: "kb-h", text: a.title }),
        el("dl", { class: "fields kb-meta" }, meta.map(([k, v]) => [el("dt", { text: k }), el("dd", { text: v })])),
        el("h2", { text: Lb.symptom }), el("p", { class: "strong", text: a.symptom.subject }), el("p", { text: a.symptom.body }),
        el("h2", { text: Lb.environment }), el("dl", { class: "fields" }, a.environment.map((x) => [el("dt", { text: x.label }), el("dd", { text: x.value })])),
        a.sections.map((sec) => [el("h2", { text: sec.label }), sec.text.length ? sec.text.map((x) => el("p", { class: "kb-own", text: x })) : el("p", { class: "muted", text: Lb.none })]),
        el("h2", { text: Lb.guide }), el("p", {}, el("a", { href: a.guide, target: "_blank", rel: "noopener noreferrer", text: a.guide })),
        a.history.length ? [el("h2", { text: Lb.history }), el("ul", {}, a.history.map((h) => el("li", { text: `v${h.version} · ${h.day}` })))] : null,
        el("p", { class: "kb-foot", text: Lb.foot })),
      el("div", { class: "row kb-tools" },
        el("button", { type: "button", class: "btn", id: "kb-download", text: L().kbDownload, onclick: download }),
        el("button", { type: "button", class: "btn ghost", id: "kb-print", text: L().kbPrint, onclick: () => window.print() }),
        el("a", { class: "btn ghost", href: "#/desk/" + a.deskId, text: L().kbReplay, onclick: () => { dropLive(a.deskId); } })),
      msg);
  }

  /* ---------- v0.4: internal mail (#/mail, #/mail/<id>): every message is an exercise */
  const mailRetry = {};
  let mailFresh = { id: null, list: [] };   // badges earned by the last answer, shown under it
  /* v0.9: the mailbox (mail.js, sd.mailbox): folders, star, archive, spam, replies and new messages */
  let mboxCache = null;
  let mailFolder = "inbox";
  let mailNote = null;       // {text, tone}: what the last action did, shown once
  let mailReplyOpen = null;  // the message whose reply box is open
  function mbox() { if (!mboxCache) mboxCache = MB.normalise(load("mailbox", null)); return mboxCache; }
  function setMbox(st) { mboxCache = MB.normalise(st); save("mailbox", mboxCache); }
  const dirPeople = () => world.users.map((u) => ({ sam: u.sam, name: u.name, dept: Wd.t(u.title, lang) + " · " + u.dept }));
  // a mail exercise answered (a button, "Create ticket" or "Report"): recorded, counted for the streak and the badges
  function answerMail(m, optId) {
    const g = G.grade(m, optId);
    if (!g) return null;
    const all = mailAnswers();
    const prev = all[m.id];
    all[m.id] = { answer: optId, result: g.result, day: today(), tries: (prev ? prev.tries || 0 : 0) + 1 };
    save("mail", all);
    delete mailRetry[m.id];
    mailFresh = { id: m.id, list: logActivity({ type: "mail", id: m.id, result: g.result }) };
    if (mailFresh.list.length) celebrate("badge"); else if (g.result === "correct") celebrate("task");
    return g;
  }
  function mailPage(id) {
    const st = mbox();
    const sentOne = id && /^s-\d+$/.test(id) ? MB.sentItem(st, id) : null;
    const compose = id === "new";
    const msg = id && !sentOne && !compose ? G.mail(id) : null;
    if (msg) { markRead(msg.id); if (mailFolder !== "starred") mailFolder = MB.folderOf(st, msg.id); }
    if (sentOne) mailFolder = "sent";
    const view = shell("mail");
    document.title = (msg ? t(msg.subject, lang) : sentOne ? sentOne.subject : compose ? L().mNewTitle : L().mTitle) + " · SysAdmin Desks";
    const answers = mailAnswers();
    const name = (m) => t(m.from.name, lang);
    const readList = load("mailRead", []) || [];
    const counts = MB.counts(st, readList);
    const folders = el("ul", { class: "mail-folders", role: "list" }, MB.FOLDERS.map((f) => el("li", {},
      el("button", { type: "button", class: "mail-folder" + (mailFolder === f && !compose ? " on" : ""), id: "mail-f-" + f, "aria-pressed": mailFolder === f && !compose ? "true" : "false",
        onclick: () => { mailFolder = f; mailNote = null; if (location.hash === "#/mail") mailPage(null); else location.hash = "#/mail"; } },
        el("span", { text: t(MB.NAMES[f], lang) }),
        f === "inbox" && counts.unread ? el("span", { class: "count", "aria-label": L().unreadN(counts.unread), text: String(counts.unread) })
          : f !== "inbox" && counts[f] ? el("span", { class: "count muted", text: String(counts[f]) }) : null))));
    const rows = MB.list(st, mailFolder);
    let listBody;
    if (mailFolder === "sent") {
      listBody = rows.length ? el("ul", {}, rows.map((x) => el("li", {}, el("a", { href: "#/mail/" + x.id, class: "mail-item" + (sentOne && sentOne.id === x.id ? " on" : ""), "aria-current": sentOne && sentOne.id === x.id ? "true" : null },
        el("span", { class: "mail-row" }, el("b", { text: x.toName || x.to }), el("span", { class: "mono muted", text: clock(x.at) })),
        el("span", { class: "mail-subj", text: x.subject }),
        x.flags.length ? pill("unresolved", "⚠") : null)))) : el("p", { class: "empty", text: L().mSentEmpty });
    } else {
      listBody = rows.length ? el("ul", {}, rows.map((m) => {
        const a = answers[m.id];
        const isNew = !readList.includes(m.id);
        return el("li", {}, el("a", { href: "#/mail/" + m.id, class: "mail-item" + (msg && msg.id === m.id ? " on" : "") + (isNew ? " new" : ""), "aria-current": msg && msg.id === m.id ? "true" : null },
          el("span", { class: "mail-row" }, el("b", {}, MB.starred(st, m.id) ? el("span", { class: "mail-star", "aria-label": L().mStar, text: "★ " }) : null, name(m)), el("span", { class: "mono muted", text: m.time })),
          el("span", { class: "mail-subj", text: t(m.subject, lang) }),
          a ? pill(RES_PILL[a.result], L().res[a.result]) : isNew ? el("span", { class: "mail-dot", "aria-label": L().unreadN(1) }) : null));
      })) : el("p", { class: "empty", text: L().mEmptyFolder });
    }
    const list = el("nav", { class: "panel mail-list", "aria-label": L().mFolders },
      el("a", { class: "btn sm mail-compose", href: "#/mail/new", id: "mail-compose", text: "✎ " + L().mCompose }),
      folders, el("h2", { class: "mail-fh", text: t(MB.NAMES[mailFolder], lang) }), listBody);
    const has = Boolean(msg || sentOne || compose);
    const pane = msg ? mailMessage(msg, answers[msg.id]) : sentOne ? mailSent(sentOne) : compose ? mailCompose()
      : el("section", { class: "panel mail-msg mail-none" }, el("p", { class: "empty", text: L().mPick }));
    const noteTop = !has && mailNote ? el("p", { class: "mail-note " + (mailNote.tone || ""), id: "mail-note", role: "status", text: mailNote.text }) : null;
    mailNote = null;
    put(view, Array.from(view.childNodes), el("header", { class: "view-head" }, el("div", {}, el("h1", { text: L().mTitle }), el("p", { class: "sub", text: L().mSub }))),
      noteTop, el("div", { class: "mail" + (has ? " has-msg" : "") }, list, pane));
  }
  // a message you sent: who, when, what, and any bad practice flagged
  function mailSent(x) {
    const re = x.re ? G.mail(x.re) : null;
    return el("article", { class: "panel mail-msg", "aria-labelledby": "mail-subj", id: "mail-sent" },
      el("p", { class: "mail-back" }, el("a", { href: "#/mail", text: L().mBack })),
      el("p", { class: "lvl" }, pill("closed", L().mSentTitle)),
      el("h2", { class: "mail-title", id: "mail-subj", text: x.subject }),
      el("dl", { class: "fields mail-meta" }, el("dt", { text: L().mTo }), el("dd", { text: `${x.toName} <${x.to}>` }),
        el("dt", { text: L().mDate }), el("dd", { text: today() === Pf.dayIn(x.at, zone()) ? clock(x.at) : Pf.dayIn(x.at, zone()).split("-").reverse().join("/") + " " + clock(x.at) })),
      x.flags.map((f) => el("p", { class: "mail-flag", role: "note", text: "⚠ " + L().mFlags[f] })),
      el("div", { class: "mail-body mail-sent-body", text: x.body }),
      re ? el("p", { class: "fine" }, el("a", { href: "#/mail/" + re.id, text: "↩ " + t(re.subject, lang) })) : null);
  }
  // a new message to a fictional internal contact
  function mailCompose() {
    const contacts = MB.contacts(dirPeople(), lang);
    const to = el("select", { id: "mail-to", "aria-label": L().mToLabel }, el("option", { value: "", text: L().mPickContact }),
      contacts.map((c) => el("option", { value: c.id, text: `${c.name} <${c.address}>${c.sub ? " · " + c.sub : ""}` })));
    const subj = el("input", { type: "text", id: "mail-subject", maxlength: String(MB.LIMITS.subject), autocomplete: "off" });
    const body = el("textarea", { id: "mail-body", maxlength: String(MB.LIMITS.body), rows: "8" });
    const warn = el("p", { class: "mail-flag", role: "status", hidden: true });
    body.addEventListener("input", () => { const f = MB.lint(body.value); warn.hidden = !f.length; warn.textContent = f.length ? "⚠ " + L().mFlags[f[0]] : ""; });
    const msg = el("p", { class: "form-msg", role: "alert" });
    return el("section", { class: "panel mail-msg mail-new", "aria-labelledby": "mail-new-h" },
      el("p", { class: "mail-back" }, el("a", { href: "#/mail", text: L().mBack })),
      el("h2", { class: "mail-title", id: "mail-new-h", text: L().mNewTitle }),
      el("label", { class: "field" }, el("span", { class: "field-label", text: L().mToLabel }), to),
      el("p", { class: "fine", text: L().mContactsNote }),
      el("label", { class: "field" }, el("span", { class: "field-label", text: L().mSubject }), subj),
      el("label", { class: "field" }, el("span", { class: "field-label", text: L().mBody }), body), warn, msg,
      el("div", { class: "row" }, el("button", { type: "button", class: "btn", id: "mail-send", text: L().mSend, onclick: () => {
        const r = MB.compose(mbox(), { to: to.value, subject: subj.value, body: body.value, now: Date.now() }, contacts);
        if (!r.ok) { msg.textContent = r.errors.map((e) => L().mErr[e]).join(" "); return; }
        setMbox(r.state); mailFolder = "sent"; location.hash = "#/mail/" + r.item.id;
      } }), el("a", { class: "btn ghost", href: "#/mail", text: L().mCancel })));
  }
  function mailMessage(m, answer) {
    const sc = m.ticket ? SCENARIOS.find((s) => s.id === m.ticket) : null;
    const dirUser = m.directory ? Wd.user(world, m.directory) : null;
    const claims = m.claims ? Wd.user(world, m.claims) : null;
    const fromAddr = m.from.address;
    const h = m.headers;
    const tone = (v) => (v === "pass" ? "ok" : v === "none" ? "warn" : "bad");
    const dirText = dirUser ? `${dirUser.name} · ${Wd.t(dirUser.title, lang)} · ${dirUser.dept}`
      : m.dirNote ? t(m.dirNote, lang) : claims ? L().mDirClaims(claims.name, claims.sam + "@contoso.com") : L().mDirNone;
    const status = el("p", { class: "mail-status", "aria-live": "polite", text: m.links.length ? L().mLinkTip : "" });
    const headers = el("div", { class: "mail-headers", id: "mail-h-" + m.id, hidden: true },
      fieldsDl([
        { label: "From", value: `${t(m.from.name, lang)} <${fromAddr}>` },
        { label: "Reply-To", value: h.replyTo, tone: h.replyTo === fromAddr ? "" : "bad" },
        { label: "Return-Path", value: `<${h.returnPath}>`, tone: G.domainOf(h.returnPath) === G.domainOf(fromAddr) ? "" : "bad" },
        { label: "Received", value: h.received },
        { label: "Received-SPF", value: h.spf, tone: tone(h.spf) },
        { label: "DKIM", value: h.dkim, tone: tone(h.dkim) },
        { label: "DMARC", value: h.dmarc, tone: tone(h.dmarc) },
      ].concat(m.links.map((x) => ({ label: L().mLinks, value: `${x.text} → ${x.href}`, tone: x.text === x.href ? "" : "bad" })),
        [{ label: L().mDirectory, value: dirText, tone: dirUser || m.dirNote ? "ok" : "bad" }])));
    const toggle = el("button", { type: "button", class: "btn ghost sm", "aria-expanded": "false", "aria-controls": headers.id, text: L().mHeadersShow, onclick: () => {
      headers.hidden = !headers.hidden;
      toggle.setAttribute("aria-expanded", headers.hidden ? "false" : "true");
      toggle.textContent = headers.hidden ? L().mHeadersShow : L().mHeadersHide;
    } });
    const linkEl = (i) => {
      const x = m.links[i];
      const show = () => { status.textContent = L().mLinkTo(x.href); };
      return el("a", { href: "#/mail/" + m.id, class: "mail-link", title: x.href, onmouseenter: show, onfocus: show,
        onclick: (ev) => { ev.preventDefault(); status.textContent = L().mLinkBlocked(x.href); } }, x.text);
    };
    const body = el("div", { class: "mail-body" }, t(m.body, lang).map((p) => el("p", {}, G.paragraph(p).map((part) => part.link != null ? linkEl(part.link) : part.text))));
    const handled = answer && answer.answer === "ticket" && answer.result === "correct";
    const showAnswer = answer && !mailRetry[m.id];
    function choose(optId) {
      if (!answerMail(m, optId)) return;
      mailPage(m.id);
      const r = document.getElementById("mail-result");
      if (r) { r.scrollIntoView({ behavior: motion(), block: "nearest" }); r.focus({ preventScroll: true }); }
    }
    // v0.9: the mailbox actions on this message
    const st = mbox();
    const where = MB.folderOf(st, m.id);
    const isStar = MB.starred(st, m.id);
    const act = (text, id, fn, cls) => el("button", { type: "button", class: "btn ghost sm " + (cls || ""), id, onclick: fn }, text);
    const tools2 = el("div", { class: "row mail-actions", role: "group", "aria-label": L().mFolders },
      el("button", { type: "button", class: "btn ghost sm mail-star-btn", id: "mail-star", "aria-pressed": isStar ? "true" : "false",
        onclick: () => { setMbox(MB.toggleStar(mbox(), m.id)); mailPage(m.id); } }, (isStar ? "★ " : "☆ ") + (isStar ? L().mUnstar : L().mStar)),
      where === "archive" ? act(L().mToInbox, "mail-inbox", () => { setMbox(MB.move(mbox(), m.id, "inbox")); mailNote = { text: L().mMoved }; mailFolder = "inbox"; mailPage(m.id); })
        : where === "inbox" ? act("▣ " + L().mArchive, "mail-archive", () => { setMbox(MB.move(mbox(), m.id, "archive")); mailNote = { text: L().mArchived }; location.hash = "#/mail"; }) : null,
      where === "spam" ? act(L().mNotSpam, "mail-notspam", () => { setMbox(MB.notSpam(mbox(), m.id)); mailNote = { text: L().mMoved }; mailFolder = "inbox"; mailPage(m.id); })
        : act("⚑ " + L().mReport, "mail-report", () => {
          const r = MB.report(mbox(), m);
          setMbox(r.state);
          if (r.answer) answerMail(m, r.answer);
          mailNote = { text: L().mReported(L().res[r.result] || "–"), tone: r.result };
          mailFolder = "spam"; location.hash = "#/mail";
        }, "mail-report"),
      act("↩ " + L().mReply, "mail-reply", () => { mailReplyOpen = mailReplyOpen === m.id ? null : m.id; mailPage(m.id); const ta = document.getElementById("mail-reply-text"); if (ta) ta.focus(); }));
    const replies = MB.repliesTo(st, m.id);
    let replyBox = null;
    if (mailReplyOpen === m.id) {
      const tpls = MB.templates(m, lang, { ticket: sc ? sc.ticket.id : null, prio: sc ? sc.ticket.priority : null, me: user ? user.name : "" });
      const ta = el("textarea", { id: "mail-reply-text", rows: "7", maxlength: String(MB.LIMITS.body), placeholder: L().mReplyPh, "aria-label": L().mReply });
      const warn = el("p", { class: "mail-flag", role: "status", hidden: true });
      const lintNow = () => { const f = MB.lint(ta.value); warn.hidden = !f.length; warn.textContent = f.length ? "⚠ " + L().mFlags[f[0]] : ""; };
      ta.addEventListener("input", lintNow);
      let used = null;
      const errMsg = el("p", { class: "form-msg", role: "alert" });
      replyBox = el("section", { class: "mail-reply", id: "mail-reply-box", "aria-label": L().mReply },
        el("p", { class: "fine mono", text: L().mReplyTo(m.headers.replyTo || fromAddr) }),
        el("div", { class: "tpl-row", role: "group", "aria-label": L().mTemplates }, el("span", { class: "tpl-h", text: L().mTemplates }),
          tpls.map((x) => el("button", { type: "button", class: "chip-btn", "data-tpl": x.id, text: x.label, onclick: () => {
            used = x.id; ta.value = x.text; lintNow(); ta.focus();
            const gap = ta.value.indexOf("["); if (gap !== -1) ta.setSelectionRange(gap, ta.value.indexOf("]", gap) + 1);
          } }))),
        ta, warn, errMsg,
        el("div", { class: "row" }, el("button", { type: "button", class: "btn sm", id: "mail-reply-send", text: L().mSend, onclick: () => {
          const r = MB.reply(mbox(), m, { text: ta.value, template: used, now: Date.now() }, lang);
          if (!r.ok) { errMsg.textContent = L().mErr[r.error]; ta.focus(); return; }
          setMbox(r.state); mailReplyOpen = null;
          mailNote = r.item.flags.length ? { text: r.item.flags.map((f) => "⚠ " + L().mFlags[f]).join(" "), tone: "wrong" } : { text: L().mSentOk, tone: "correct" };
          mailPage(m.id);
          const n = document.getElementById("mail-note"); if (n) n.scrollIntoView({ behavior: motion(), block: "nearest" });
        } }), el("button", { type: "button", class: "btn ghost sm", text: L().mCancel, onclick: () => { mailReplyOpen = null; mailPage(m.id); } })));
    }
    const noteEl = mailNote ? el("p", { class: "mail-note " + (mailNote.tone || ""), id: "mail-note", role: "status", text: mailNote.text }) : null;
    const opts = el("div", { class: "mail-opts", role: "group", "aria-labelledby": "mail-what" }, m.options.map((o) =>
      el("button", { type: "button", class: "mail-opt" + (showAnswer && answer.answer === o.id ? " picked " + o.result : ""), disabled: Boolean(showAnswer),
        "aria-pressed": showAnswer && answer.answer === o.id ? "true" : "false", onclick: () => choose(o.id) }, t(o.label, lang))));
    let result = null;
    if (showAnswer) {
      const o = m.options.find((x) => x.id === answer.answer);
      const order = MB.list(MB.empty(), "inbox");
      const next = order[(order.indexOf(m) + 1) % order.length];
      result = el("div", { class: "mail-result " + answer.result, id: "mail-result", tabindex: "-1" },
        el("p", { class: "lvl" }, pill(RES_PILL[answer.result], L().res[answer.result])),
        el("p", { text: t(o.why, lang) }),
        (mailFresh.id === m.id ? mailFresh.list : []).map((b) => el("p", { class: "badge-new" }, el("span", { class: "side-ico", "aria-hidden": "true", text: "★" }), el("span", { text: L().newBadge(badgeName(b)) }))),
        el("h3", { text: L().mClues }), el("ul", { class: "mail-clues" }, t(m.clues, lang).map((c) => el("li", { text: c }))),
        el("h3", { text: L().mProcedure }), el("p", { text: t(m.procedure, lang) }),
        el("div", { class: "row" },
          answer.result === "correct" && sc ? el("a", { class: "btn", href: "#/desk/" + sc.id, text: L().mOpenTicket(sc.ticket.id) }) : null,
          answer.result === "correct" && m.link ? el("a", { class: "btn", href: m.link.href, text: t(m.link.label, lang) }) : null,
          el("button", { type: "button", class: "btn ghost", text: L().mRetry, onclick: () => { mailRetry[m.id] = true; mailFresh = { id: null, list: [] }; mailPage(m.id); } }),
          el("a", { class: "btn ghost", href: "#/mail/" + next.id, text: L().mNext })));
    }
    return el("article", { class: "panel mail-msg", "aria-labelledby": "mail-subj" },
      el("p", { class: "mail-back" }, el("a", { href: "#/mail", text: L().mBack })),
      el("h2", { class: "mail-title", id: "mail-subj", text: t(m.subject, lang) }),
      el("dl", { class: "fields mail-meta" },
        el("dt", { text: L().mFrom }), el("dd", { text: `${t(m.from.name, lang)} <${fromAddr}>` }),
        el("dt", { text: L().mTo }), el("dd", { text: m.to }),
        m.cc ? [el("dt", { text: L().mCc }), el("dd", { text: m.cc })] : null,
        el("dt", { text: L().mDate }), el("dd", { text: m.day.split("-").reverse().join("/") + " " + m.time })),
      el("div", { class: "row mail-tools" }, toggle,
        sc && !handled ? el("button", { type: "button", class: "btn sm", id: "mail-create", text: L().mCreate, onclick: () => choose("ticket") }) : null,
        handled && sc ? el("span", { class: "mail-handled" }, pill("resolved", L().mHandled(sc.ticket.id)), " ", el("a", { href: "#/desk/" + sc.id, text: L().mOpenTicket(sc.ticket.id) })) : null),
      tools2, noteEl, headers, body, status,
      replies.length ? el("p", { class: "fine mail-replies" }, L().mRepliesSent(replies.length) + " ", replies.map((x) => el("a", { href: "#/mail/" + x.id, class: "mono", text: x.id + (x.flags.length ? " ⚠" : "") + " " }))) : null,
      replyBox,
      el("section", { class: "mail-ex" }, el("h3", { id: "mail-what", text: L().mWhat }), opts, result));
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
      const has = Boolean(work()[sc.id]);
      const lv = has ? liveOf(sc.id, sc) : null;
      const sess = lv ? lv.sess : E.createSession(sc, lang);
      sess.lang = lang;
      const r = rec(sc.id);
      E.bound(sess).forEach((b) => out.push(Object.assign(b, { sc, sess, live: W.canWork(r) && !lv.closed, paused: W.isPaused(r) })));
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
      persistLive(b.sc.id);
      r.lines.push({ text: L().dRouted(b.sc.ticket.id), kind: "dim" });
      return { lines: r.lines, changed: false };
    }
    if (MUTATING.test(p.verb)) return { lines: [{ text: (b.paused ? L().dPendingTicket : L().dAssignFirst)(Wd.user(world, sam).name, b.sc.ticket.id), kind: "say" }], changed: false };
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
    }).concat(NN.list(roomNet).map((d) => {
      // v0.7a: the switches, the router and the firewall, with the status of the network room (health and open tickets)
      const ns = netStatus(d.id);
      return { kind: "network", id: d.id, d: Object.assign({}, d, { ip: d.mgmt }), status: ns.tone, notes: ns.notes.concat(ns.health.unsaved && !ns.notes.length ? [L().nUnsaved] : []), jobs: 0, tickets: netTickets(d.id), health: ns.health };
    })).concat(SH.ASSETS.map((a) => {
      // v0.7b: laptops, phones and spare parts from the asset register, in the state their shipments give them (in RMA, on loan, replaced...)
      const ds = SH.deviceState(allStores(), a.serial);
      const tone = ["rma", "returning", "received", "loan"].includes(ds) ? "warn" : "ok";
      const label = SH.t(SH.DEVICE[ds], lang);
      const tk = SCENARIOS.filter((sc) => sc.ship && (sc.requester.device === a.id || JSON.stringify(sc.ship.flags).includes('"' + a.serial + '"')));
      return { kind: "endpoint", id: a.id, d: Object.assign({}, a, { ip: "–", role: `${a.model} · ${label}` }), status: tone, notes: tone === "ok" ? [] : [L().shDeviceNote + " " + label], jobs: 0, tickets: tk, devState: ds };
    }));
    const shown = items.filter((x) => invFilter === "all" || (invFilter === "problems" ? x.status !== "ok" : x.kind === invFilter));
    const chips = el("div", { class: "qtabs inv-chips", role: "tablist" }, [["all", L().iAll], ["server", L().iServers], ["printer", L().iPrinters], ["network", L().iNetwork], ["endpoint", L().iEndpoints], ["problems", L().iProblems]].map(([k, text]) =>
      el("button", { type: "button", role: "tab", class: "qtab" + (invFilter === k ? " on" : ""), "aria-selected": invFilter === k ? "true" : "false", onclick: () => { invFilter = k; inventory(); } },
        text + " ", el("span", { class: "count", text: String(items.filter((x) => k === "all" || (k === "problems" ? x.status !== "ok" : x.kind === k)).length) }))));
    const stPill = (s) => el("span", { class: "inv-st " + s }, el("span", { class: "tdot", "aria-hidden": "true" }), el("span", { text: L().st[s] }));
    const table = shown.length ? el("table", { class: "qtable inv" },
      el("thead", {}, el("tr", {}, [L().colStatus, L().colName, L().colType, L().colRole, "IP", L().colTickets].map((x) => el("th", { scope: "col", text: x })))),
      el("tbody", {}, shown.map((x) => el("tr", { class: invSel === x.id ? "active" : "" },
        el("td", { "data-label": L().colStatus }, stPill(x.status)),
        el("td", { class: "subj", "data-label": L().colName }, el("button", { type: "button", class: "link-row", text: x.id, onclick: () => { invSel = x.id; inventory(); } })),
        el("td", { "data-label": L().colType, text: x.kind === "server" ? L().iServer : x.kind === "network" ? L().nType[x.d.kind] : x.kind === "endpoint" ? L().iEndpoint[x.d.kind] : L().iPrinter }),
        el("td", { "data-label": L().colRole, text: Wd.t(x.kind === "printer" ? x.d.model : x.d.role, lang) }),
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
        fieldsDl(sel.kind === "endpoint" ? [{ label: L().colRole, value: d.model }, { label: L().iSerial, value: d.serial }, { label: L().iUser, value: d.user || "–" },
          { label: L().iDevState, value: SH.t(SH.DEVICE[sel.devState], lang), tone: sel.status === "ok" ? "ok" : "warn" }, { label: L().iWarranty, value: SH.t(d.warranty, lang) }]
          : sel.kind === "network" ? [{ label: L().colRole, value: Wd.t(d.role, lang) }, { label: L().nModel, value: d.model }, { label: L().nOs, value: d.version },
          { label: L().nMgmt, value: d.mgmt }, { label: L().colLocation, value: Wd.t(d.location, lang) }, { label: L().iOwner, value: Wd.t(d.owner, lang) },
          { label: L().nConfig, value: sel.health.unsaved ? L().nUnsaved : d.os === "fortios" ? L().nAutoSave : L().nSaved, tone: sel.health.unsaved ? "warn" : "ok" }]
          : sel.kind === "server" ? [{ label: L().colRole, value: Wd.t(d.role, lang) }, { label: L().iOs, value: d.os }, { label: "IP", value: d.ip },
          { label: L().colLocation, value: Wd.t(d.location, lang) }, { label: L().iOwner, value: Wd.t(d.owner, lang) }, { label: L().iPatched, value: d.patched }]
          : [{ label: L().colRole, value: Wd.t(d.model, lang) }, { label: "IP", value: d.ip }, { label: L().iQueue, value: d.queue },
            { label: L().iJobs, value: String(sel.jobs), tone: sel.jobs ? "bad" : "" }, { label: L().colLocation, value: Wd.t(d.location, lang) }]),
        el("h3", { text: L().colTickets }),
        sel.tickets.length ? el("ul", { class: "inv-tickets" }, sel.tickets.map((sc) => el("li", {}, ticketPill(sc), el("span", { text: " " + t(sc.title, lang) })))) : el("p", { class: "sub", text: L().iNone }),
        sel.kind === "server" ? el("p", {}, el("a", { href: "#/directory", onclick: () => { dirOu = "servers"; dirSel = { type: "computer", id: sel.id }; }, text: L().iInDir })) : null,
        sel.kind === "network" ? el("p", {}, el("a", { href: "#/network/" + sel.id, id: "inv-to-room", text: L().iInRoom })) : null,
        sel.kind === "endpoint" ? el("div", {}, el("h3", { text: L().iShipments }),
          (() => { const list = allShips().filter((y) => y.ship.serial === sel.d.serial); return list.length ? el("ul", { class: "inv-tickets" }, list.map((y) => el("li", {},
            el("a", { class: "mono", href: "#/shipping/" + y.ship.id, text: y.ship.id }), " ", shipPill(y.ship)))) : el("p", { class: "sub", text: L().iNone }); })(),
          el("p", {}, el("a", { href: "#/shipping", id: "inv-to-shipping", text: L().iToShipping }))) : null);
    }
    view.append(el("header", { class: "view-head" }, el("div", {}, el("h1", { text: L().iTitle }), el("p", { class: "sub", text: L().iSub }))),
      chips, el("div", { class: "inv-grid" }, el("div", { class: "qwrap" }, table), detail));
  }

  /* ---------- v0.7a: the network room. Devices of an open network ticket show that ticket's net (and their CLI works on the
     ticket, like the directory hands a command to its ticket); the rest use the room's own net, kept while the page is open. */
  const NN = window.SDNet;
  let roomNet = NN.createNet([]);
  const netPreview = {};     // deskId -> a fresh session, to show an unassigned ticket's fault
  let netSel = null;
  let netTab = "general";
  let netDiag = { what: "ping", target: "", out: [] };
  let netCli = null;         // {dev, term, src, log: [{text, kind}], hist: [], pos}
  // v0.9: the room outside tickets is kept in this browser (sd.room) and comes back after a reload
  let roomLoaded = false;
  function ensureRoom() {
    if (roomLoaded || !user) return;
    roomLoaded = true;
    const d = envOf(load("room", null));
    const r = d && PS.roomFromJSON(d);
    if (r) { roomNet = r.net; if (r.sel) netSel = r.sel; netCli = r.cli; }
  }
  function saveRoom() { if (user && roomLoaded) save("room", packed(PS.roomToJSON({ net: roomNet, sel: netSel, cli: netCli }))); }
  // after signing out or clearing the saved work: the room and the labs start fresh (and are read again for the next account)
  function forgetSandboxes() {
    roomLoaded = false; roomNet = NN.createNet([]); netSel = null; netCli = null;
    Object.keys(labLive).forEach((k) => delete labLive[k]);
  }
  function persistAll() {
    if (!user) return;
    Object.keys(live).forEach(persistLive);
    saveRoom();
    Object.keys(labLive).forEach(saveLab);
  }
  window.addEventListener("pagehide", persistAll);
  function netSources() {
    return SCENARIOS.filter((sc) => sc.net && isOpen(sc)).map((sc) => {
      const has = Boolean(work()[sc.id]);
      const lv = has ? liveOf(sc.id, sc) : null;
      const sess = lv ? lv.sess : (netPreview[sc.id] || (netPreview[sc.id] = E.createSession(sc, lang)));
      sess.lang = lang;
      const r = rec(sc.id);
      return { sc, sess, lv, live: Boolean(lv) && W.canWork(r) && !lv.closed, paused: W.isPaused(r) };
    }).filter((x) => !(x.lv && x.lv.closed));
  }
  // the net a device lives in right now: {net, src} (src: the open ticket it belongs to, or null)
  function netFor(id) {
    ensureRoom();
    // v0.7b: two open tickets can share a device (SW-ACC-2F): the one assigned to you wins, then the first one
    const all = netSources().filter((x) => x.sc.net.devices.includes(id));
    const src = all.find((x) => x.live) || all.find((x) => x.lv) || all[0] || null;
    return { net: src ? src.sess.net : roomNet, src };
  }
  // status for the room and the inventory: the worst of the device's health and what its tickets say
  function netStatus(id) {
    const { net, src } = netFor(id);
    const h = NN.health(net, id);
    const marks = src ? E.bound(src.sess).filter((b) => b.kind === "network" && b.id === id) : [];
    const order = ["ok", "warn", "bad"];
    const tone = [h.tone].concat(marks.map((b) => b.set.status || "ok")).sort((a, b) => order.indexOf(b) - order.indexOf(a))[0];
    return { tone, health: h, notes: marks.map((b) => b.note).filter(Boolean), src, net };
  }
  const netTickets = (id) => SCENARIOS.filter((sc) => sc.net && sc.net.devices.includes(id));
  const stPillN = (s) => el("span", { class: "inv-st " + s }, el("span", { class: "tdot", "aria-hidden": "true" }), el("span", { text: L().st[s] }));

  function networkRoom(selId) {
    const view = shell("network");
    document.title = L().nTitle + " · SysAdmin Desks";
    ensureRoom();
    if (selId && roomNet.devices[selId]) netSel = selId;
    const devs = NN.list(roomNet);
    const rows = devs.map((d) => Object.assign({ d }, netStatus(d.id)));
    const table = el("table", { class: "qtable inv net-table" },
      el("thead", {}, el("tr", {}, [L().colStatus, L().colDevice, L().colMgmt, L().colTickets].map((x) => el("th", { scope: "col", text: x })))),
      el("tbody", {}, rows.map((x) => el("tr", { class: netSel === x.d.id ? "active" : "" },
        el("td", { "data-label": L().colStatus }, stPillN(x.tone), x.health.unsaved ? el("span", { class: "pill observations net-unsaved", text: L().nUnsavedShort }) : null),
        el("td", { class: "subj", "data-label": L().colDevice }, el("a", { class: "link-row", href: "#/network/" + x.d.id, text: x.d.id }), el("span", { class: "sub", text: `${L().nType[x.d.kind]} · ${x.d.model}` })),
        el("td", { class: "mono", "data-label": L().colMgmt, text: x.d.mgmt }),
        el("td", { "data-label": L().colTickets }, netTickets(x.d.id).length ? netTickets(x.d.id).map((sc) => el("a", { class: "tkt mono", href: "#/desk/" + sc.id, text: sc.ticket.id })) : el("span", { class: "muted", text: "–" }))))));
    const detail = el("section", { class: "panel inv-detail net-detail", id: "net-detail" });
    const cliBox = el("div", { id: "net-cli-box" });
    view.append(el("header", { class: "view-head" }, el("div", {}, el("h1", { text: L().nTitle }), el("p", { class: "sub", text: L().nSub })),
      el("button", { type: "button", class: "link-btn", id: "net-reset", text: L().nReset, onclick: () => {
        roomNet = NN.createNet([]); netCli = null; netDiag = { what: "ping", target: "", out: [L().nResetDone] }; try { localStorage.removeItem("sd.room"); } catch (e) { /* ignore */ } networkRoom(netSel); } })),
      el("div", { class: "inv-grid net-grid" }, el("div", { class: "qwrap" }, table), detail), cliBox);
    renderNetDetail(detail, cliBox);
    renderNetCli(cliBox);
    saveRoom();
  }

  function renderNetDetail(box, cliBox) {
    const d = netSel && roomNet.devices[netSel];
    if (!d) { box.replaceChildren(el("p", { class: "empty", text: L().nPick })); return; }
    const st = netStatus(d.id);
    const dev = st.net.devices[d.id];
    const h = st.health;
    const tabs = el("div", { class: "qtabs net-tabs", role: "tablist" }, ["general", "health", "diag"].map((k) => el("button", { type: "button", role: "tab", id: "net-tab-" + k,
      class: "qtab" + (netTab === k ? " on" : ""), "aria-selected": netTab === k ? "true" : "false", onclick: () => { netTab = k; renderNetDetail(box, cliBox); } }, L().nTabs[k])));
    let body;
    if (netTab === "general") {
      body = fieldsDl([{ label: L().nRole, value: t(dev.role, lang) }, { label: L().nModel, value: dev.model }, { label: L().nSerial, value: dev.serial },
        { label: L().nOs, value: dev.os === "ios" ? "Cisco IOS XE " + dev.version : dev.os === "aruba" ? "ArubaOS-Switch " + dev.version : "FortiOS " + dev.version },
        { label: L().nLocation, value: t(dev.location, lang) }, { label: L().nSite, value: L().nSites[dev.site] }, { label: L().nMgmt, value: dev.mgmt }, { label: L().nOwner, value: t(dev.owner, lang) }]);
    } else if (netTab === "health") {
      const pct = (n) => el("span", { class: "net-meter" }, el("meter", { min: "0", max: "100", low: "60", high: "85", optimum: "10", value: String(n) }), el("span", { text: n + " %" }));
      const fields = [{ label: L().nCpu, value: pct(h.cpu) }, { label: L().nMem, value: pct(h.mem) }, { label: L().nUptime, value: h.uptimeText },
        { label: L().nTemp, value: h.temp + " °C", tone: h.temp >= 60 ? "warn" : "ok" }, { label: L().nPsu, value: h.psu.map((x) => x.join(" ")).join(" · "), tone: (h.psuFailed || []).length ? "warn" : "ok" },
        { label: L().nFans, value: h.fans, tone: (h.psuFailed || []).length ? "warn" : "ok" }];
      if (dev.os === "fortios") fields.push({ label: L().nSessions, value: String(h.sessions) }, { label: L().nPolicies, value: String(h.policies) }, { label: L().nConfig, value: L().nAutoSave, tone: "ok" });
      else fields.push({ label: L().nPorts, value: L().nPortsVal(h.up, h.ports) },
        { label: L().nErrDis, value: h.errDisabled.length ? h.errDisabled.map((x) => `${x.port} (${x.reason})`).join(", ") : L().nNone, tone: h.errDisabled.length ? "bad" : "ok" },
        { label: L().nErrors, value: h.errors.length ? h.errors.map((x) => L().nErrorsVal(x.port, x.crc + x.inErr)).join(", ") : L().nNone, tone: h.errors.some((x) => x.crc >= 100) ? "warn" : "" },
        { label: L().nConfig, value: h.unsaved ? L().nUnsaved : L().nSaved, tone: h.unsaved ? "warn" : "ok" });
      body = el("div", {}, netFields(fields), el("p", { class: "fine", text: L().nHealthNote }));
    } else {
      const what = el("select", { id: "net-diag-what", "aria-label": L().nDiagWhat }, [["ping", L().nPing], ["trace", L().nTrace]].map(([v, x]) => el("option", { value: v, selected: netDiag.what === v, text: x })));
      const target = el("input", { type: "text", id: "net-diag-target", class: "net-target", autocomplete: "off", spellcheck: "false", placeholder: L().nTargetPh, "aria-label": L().nTarget, value: netDiag.target });
      const go = () => { netDiag = { what: what.value, target: target.value.trim(), out: NN.diag(st.net, dev.id, what.value, target.value), cmd: `${NN.LOOK[dev.os][what.value]} ${target.value.trim()}` }; renderNetDetail(box, cliBox); };
      target.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); go(); } });
      body = el("div", { class: "net-diag" },
        el("div", { class: "net-diag-row" }, el("label", { class: "field" }, el("span", { class: "field-label", text: L().nDiagWhat }), what),
          el("label", { class: "field grow" }, el("span", { class: "field-label", text: L().nTarget }), target),
          el("button", { type: "button", class: "btn sm", id: "net-diag-run", text: L().nRun, onclick: go })),
        el("button", { type: "button", class: "btn ghost sm", id: "net-diag-log", text: L().nLog, onclick: () => { netDiag = { what: netDiag.what, target: netDiag.target, out: NN.diag(st.net, dev.id, "log"), cmd: NN.LOOK[dev.os].log }; renderNetDetail(box, cliBox); } }),
        netDiag.out.length ? el("pre", { class: "net-out", id: "net-diag-out", text: netDiag.out.join("\n") }) : null,
        netDiag.cmd ? el("p", { class: "pc-eq" }, el("span", { text: L().equivalent + " " }), el("code", { text: netDiag.cmd })) : null,
        el("p", { class: "fine", text: L().nDiagNote }));
    }
    const src = st.src;
    const blocked = src && !src.live;
    put(box,
      el("div", { class: "row" }, el("h2", { class: "dtitle", text: dev.id }), stPillN(st.tone)),
      el("p", { class: "sub", text: `${L().nType[dev.kind]} · ${dev.model}` }),
      st.notes.length ? el("ul", { class: "inv-notes" }, st.notes.map((n) => el("li", { text: n }))) : null,
      src ? el("p", { class: "dir-ticket" }, el("span", { text: L().dTicket + " " }), ticketPill(src.sc)) : null,
      tabs, el("div", { class: "net-tab-body", role: "tabpanel" }, body),
      el("div", { class: "acts" },
        el("button", { type: "button", class: "btn sm", id: "net-open-cli", disabled: blocked ? true : null, "aria-describedby": blocked ? "net-cli-why" : null,
          onclick: () => { openNetCli(dev.id); renderNetCli(cliBox); const i = cliBox.querySelector("input"); if (i) { i.focus(); cliBox.scrollIntoView({ behavior: motion(), block: "nearest" }); } } },
          el("span", { "aria-hidden": "true", text: ">_ " }), L().nOpenCli)),
      blocked ? el("p", { class: "fine", id: "net-cli-why" }, (src.paused ? L().nPausedTicket : L().nAssignFirst)(src.sc.ticket.id) + " ", el("a", { href: "#/desk/" + src.sc.id, text: L().nOpenTicket })) : null);
  }
  // like fieldsDl, but a value can be an element (the meters)
  function netFields(fields) {
    return el("dl", { class: "fields" }, fields.map((f) => [el("dt", { text: f.label }),
      el("dd", { class: f.tone ? "tone " + f.tone : "" }, f.tone ? el("span", { class: "tdot", "aria-hidden": "true" }) : null, typeof f.value === "string" ? el("span", { text: f.value }) : f.value)]));
  }
  function openNetCli(id) {
    const { net, src } = netFor(id);
    if (src && !src.live) return;
    const term = NN.terminal(net);
    const log = [{ text: NN.connect(term, id).join("\n"), kind: "out" }];
    if (src) log.push({ text: L().nRouted(src.sc.ticket.id), kind: "dim" });
    netCli = { dev: id, term, src, log, hist: [], pos: 0 };
    saveRoom();
  }
  function renderNetCli(box) {
    if (!netCli) { box.replaceChildren(); return; }
    const c = netCli;
    const out = el("div", { class: "out", "aria-live": "polite" });
    const input = el("input", { type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", "aria-label": L().nCliTitle(c.dev) });
    const ps = el("span", { class: "ps", text: NN.prompt(c.term) });
    const print = (text, kind) => { c.log.push({ text, kind }); if (c.log.length > 600) c.log = c.log.slice(-400); out.append(el("div", { class: "line " + (kind || "out"), text })); };
    c.log.forEach((l) => out.append(el("div", { class: "line " + (l.kind || "out"), text: l.text })));
    function exec(cmd) {
      cmd = String(cmd || "").trim();
      if (!cmd) return;
      c.hist.push(cmd); c.pos = c.hist.length;
      const before = NN.prompt(c.term);
      print(before + cmd, "cmd");
      const src = c.src && netSources().find((x) => x.sc.id === c.src.sc.id);
      let r;
      if (src && src.live) {
        // the same rules as the ticket console: a ticket's device answers through the ticket (traps, flags and the result included)
        r = E.run(src.sess, cmd, { term: c.term });
        const lv = live[src.sc.id];
        lv.log.push({ text: before + cmd, kind: "cmd" });
        r.lines.forEach((l) => lv.log.push({ text: l.text, kind: l.kind }));
        if (r.resolvedNow) lv.log.push({ text: L().readyMsg, kind: "ok" });
        persistLive(src.sc.id);
      } else if (c.src) {
        r = { lines: [{ text: (c.src.paused ? L().nPausedTicket : L().nAssignFirst)(c.src.sc.ticket.id), kind: "say" }] };
      } else { r = NN.exec(c.term, cmd, { lang }); setTimeout(saveRoom, 0); }
      if (r.clear) { out.replaceChildren(); c.log = []; }
      r.lines.forEach((l) => print(l.text, l.kind));
      if (r.resolvedNow) print(L().nReadyRoom(c.src.sc.ticket.id), "ok");
      ps.textContent = NN.prompt(c.term);
      term.scrollTop = term.scrollHeight;
      const det = document.getElementById("net-detail");
      if (det) renderNetDetail(det, box);
      refreshNetTable();
    }
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowUp" && c.pos > 0) { c.pos -= 1; input.value = c.hist[c.pos]; ev.preventDefault(); }
      else if (ev.key === "ArrowDown") { c.pos = Math.min(c.hist.length, c.pos + 1); input.value = c.hist[c.pos] || ""; ev.preventDefault(); }
    });
    const term = el("div", { class: "term net-term", onclick: () => { if (!window.getSelection().toString()) input.focus(); } }, out,
      el("form", { onsubmit: (ev) => { ev.preventDefault(); exec(input.value); input.value = ""; } }, ps, input));
    box.replaceChildren(el("section", { class: "panel net-cli", id: "net-cli", "aria-label": L().nCliTitle(c.dev) },
      el("div", { class: "row" }, el("h2", { text: L().nCliTitle(c.dev) }), el("span", { class: "grow" }),
        el("button", { type: "button", class: "pc-x", "aria-label": L().nCloseCli, title: L().nCloseCli, text: "×", onclick: () => { netCli = null; renderNetCli(box); saveRoom(); } })),
      term, el("p", { class: "term-help", text: L().nCliHelp })));
    term.scrollTop = term.scrollHeight;
  }
  // the status column follows the CLI without rebuilding the page (the CLI keeps its focus)
  function refreshNetTable() {
    document.querySelectorAll(".net-table tbody tr").forEach((tr) => {
      const id = tr.querySelector(".link-row") && tr.querySelector(".link-row").textContent;
      if (!id) return;
      const x = netStatus(id);
      const td = tr.querySelector("td");
      put(td, stPillN(x.tone), x.health.unsaved ? el("span", { class: "pill observations net-unsaved", text: L().nUnsavedShort }) : null);
    });
  }


  /* ---------- v0.7b: shipments and RMA. A ticket's shipments live in its session (like its console); practice shipments, not linked
     to any ticket, are kept in this browser (sd.ships). Every button builds a `ship` line and runs it, so the console and the page agree. */
  let practice = null;
  let shipOut = null;        // {id, cmd, lines}: what the last button on the Shipments page did
  let shipSel = null;
  function practiceStore() { if (!practice) practice = SH.normalise(load("ships", null), {}); return practice; }
  function savePractice() { save("ships", practiceStore()); }
  // the shipping desks with a session in this page: [{sc, lv, sess}]
  function shipSources() {
    return SCENARIOS.filter((sc) => sc.ship && (work()[sc.id] || live[sc.id])).map((sc) => {
      const lv = liveOf(sc.id, sc);
      lv.sess.lang = lang;
      return { sc, lv, sess: lv.sess };
    });
  }
  function allStores() { return [practiceStore()].concat(shipSources().map((x) => x.sess.ships)); }
  function allShips() {
    const out = practiceStore().list.map((ship) => ({ ship, src: null }));
    shipSources().forEach((src) => src.sess.ships.list.forEach((ship) => out.push({ ship, src })));
    return out;
  }
  // a ticket's shipments can be worked on while it is assigned to me (in progress or pending)
  function canShip(src) {
    if (!src) return true;
    const r = rec(src.sc.id);
    return Boolean(r && r.status !== "new" && r.status !== "closed" && !src.lv.closed);
  }
  // a step that changed a ticket's shipment goes into its Activity, and its simulated time into the SLA unless the ticket is pending
  function chargeShip(id, r) {
    if (!r || !r.ship || !(r.tags || []).some((tg) => /^ship state /.test(tg)) || !work()[id]) return;
    setWork(id, SH.charge(work()[id], { id: r.ship.id, state: r.ship.state, ms: r.shipMs || 0 }, Date.now()));
  }
  function shipRun(src, cmd) {
    if (!src) {
      const r = SH.exec(practiceStore(), cmd, { lang, stores: allStores() });
      savePractice();
      return r;
    }
    const r = E.run(src.sess, cmd, { local: true });
    const lv = src.lv;
    lv.log.push({ text: L().shRan + " → " + cmd, kind: "dim" });
    r.lines.forEach((l) => lv.log.push({ text: l.text, kind: l.kind }));
    if (r.resolvedNow) lv.log.push({ text: L().readyMsg, kind: "ok" });
    chargeShip(src.sc.id, r);
    return r;
  }
  const SHIP_TONE = { draft: "new", requested: "progress", pickup: "progress", transit: "pending-vendor", delivered: "resolved", closed: "closed", incident: "unresolved" };
  function shipPill(x) { return el("span", { class: "pill " + SHIP_TONE[x.state] + " ship-st", text: SH.stateLabel(x, lang) }); }
  // the buttons for the steps a shipment can take now; run(cmd) does it
  function shipButtons(x, run) {
    const nxt = SH.next(x);
    const after = { requested: "pickup", pickup: "transit", transit: "delivered", incident: "transit" }[x.state];
    const b = (cls, label, cmd, idx) => el("button", { type: "button", class: "btn sm " + cls, "data-ship": x.id, "data-step": idx, text: label, onclick: () => run(cmd) });
    const out = [];
    if (nxt.includes("submit")) out.push(b("", L().shSubmit, SH.command("submit", x.id), "submit"));
    if (nxt.includes("advance")) out.push(b("", L().shAdvance(SH.stateLabel(x, lang, after)), SH.command("advance", x.id), "advance"));
    if (nxt.includes("incident")) out.push(b("ghost", L().shLost, SH.command("incident", x.id, "lost"), "lost"), b("ghost", L().shDamaged, SH.command("incident", x.id, "damaged"), "damaged"));
    if (nxt.includes("close")) out.push(b("", L().shClose, SH.command("close", x.id), "close"));
    return out;
  }
  const FIELD_LABEL = () => ({ serial: L().shAsset, carrier: L().shCarrier, from: L().shFrom, to: L().shTo, vendor: L().shVendor, fault: L().shFault,
    evidence: L().shEvidence, data: L().shData, items: L().shItems });

  function shippingPage(seg, deskId) {
    const view = shell("shipping");
    document.title = L().shTitle + " · SysAdmin Desks";
    const ships = allShips();
    if (seg && seg !== "new") shipSel = seg;
    const sel = ships.find((x) => x.ship.id === shipSel) || null;
    const table = ships.length ? el("table", { class: "qtable inv ship-table" },
      el("thead", {}, el("tr", {}, [L().shColState, L().shColId, L().shColType, L().shColAsset, L().shColTicket, L().shColTracking].map((x) => el("th", { scope: "col", text: x })))),
      el("tbody", {}, ships.map(({ ship: x, src }) => el("tr", { class: sel && sel.ship.id === x.id ? "active" : "" },
        el("td", { "data-label": L().shColState }, shipPill(x)),
        el("td", { class: "subj", "data-label": L().shColId }, el("a", { class: "link-row mono", href: "#/shipping/" + x.id, text: x.id })),
        el("td", { "data-label": L().shColType, text: SH.t(SH.TYPES[x.type], lang) }),
        el("td", { class: "mono", "data-label": L().shColAsset, text: x.serial || "–" }),
        el("td", { "data-label": L().shColTicket }, src ? el("a", { class: "tkt mono", href: "#/desk/" + src.sc.id, text: src.sc.ticket.id }) : el("span", { class: "muted", text: L().shPractice })),
        el("td", { class: "mono", "data-label": L().shColTracking, text: x.tracking || "–" }))))) : el("p", { class: "empty", text: L().shNone });
    const detail = el("section", { class: "panel inv-detail ship-detail", id: "ship-detail" });
    renderShipDetail(detail, sel);
    const form = el("div", { id: "ship-form-box" });
    renderShipForm(form, deskId || (seg === "new" ? null : null), seg === "new");
    view.append(el("header", { class: "view-head" }, el("div", {}, el("h1", { text: L().shTitle }), el("p", { class: "sub", text: L().shSub })),
      practiceStore().list.length ? el("button", { type: "button", class: "link-btn", id: "ship-reset", text: L().shPracticeReset,
        onclick: () => { practice = SH.createStore({}); savePractice(); shipOut = null; shippingPage(); } }) : null),
      el("div", { class: "inv-grid ship-grid" }, el("div", { class: "qwrap" }, table), detail), form);
    if (seg === "new") setTimeout(() => { const f = document.getElementById("ship-form"); if (f) f.scrollIntoView({ block: "start" }); }, 0);
  }

  function renderShipDetail(box, sel) {
    if (!sel) { box.replaceChildren(el("p", { class: "empty", text: L().shPick })); return; }
    const { ship: x, src } = sel;
    const a = SH.asset(x.serial);
    const can = canShip(src);
    const r = src ? rec(src.sc.id) : null;
    const name = (k) => (SH.ADDRESSES[k] ? `${SH.t(SH.ADDRESSES[k].name, lang)} · ${SH.ADDRESSES[k].line}` : "–");
    const v = SH.validate(x);
    const fields = [{ label: L().shType, value: SH.t(SH.TYPES[x.type], lang) },
      { label: L().shAsset, value: a ? `${a.id} · ${a.model} · ${a.serial}` : x.serial || "–" },
      { label: L().shDeviceNote, value: a ? SH.t(SH.DEVICE[SH.deviceState(allStores(), a.serial)], lang) : "–" }];
    if (x.type === "rma") fields.push({ label: L().shVendor, value: x.vendor ? SH.t((SH.VENDORS[x.vendor] || {}).name, lang) || x.vendor : "–" },
      { label: L().shRma, value: x.rma || "–" }, { label: L().shFault, value: x.fault || "–" }, { label: L().shEvidence, value: x.evidence.join("; ") || "–" },
      { label: L().shContract, value: x.contract || "–" });
    if (a && a.kind === "laptop" && x.type !== "loan" && x.type !== "to-user") fields.push({ label: L().shData, value: x.data ? SH.t(SH.DATA[x.data], lang) || x.data : "–" },
      { label: "BitLocker", value: x.escrow ? "✓ " + L().shEscrow : "✗ " + L().shEscrow, tone: x.escrow ? "ok" : x.type === "rma" ? "warn" : "" });
    if (x.type === "return") fields.push({ label: L().shItems, value: x.items.map((i) => SH.t(SH.ITEMS[i] || { en: i }, lang)).join(", ") || "–" });
    fields.push({ label: L().shCarrier, value: SH.CARRIERS[x.carrier] ? SH.t(SH.CARRIERS[x.carrier].name, lang) : "–" }, { label: L().shTracking, value: x.tracking || "–" },
      { label: L().shFrom, value: name(x.from) }, { label: L().shTo, value: name(x.to) });
    const run = (cmd) => {
      const fresh = src ? shipSources().find((y) => y.sc.id === src.sc.id) : null;
      const res = shipRun(fresh, cmd);
      shipOut = { id: x.id, cmd, lines: res.lines };
      shippingPage(x.id);
    };
    const out = shipOut && shipOut.id === x.id ? shipOut : null;
    const labels = FIELD_LABEL();
    put(box,
      el("div", { class: "row" }, el("h2", { class: "dtitle mono", text: x.id }), shipPill(x)),
      src ? el("p", { class: "dir-ticket" }, el("span", { text: L().dTicket + " " }), ticketPill(src.sc)) : el("p", { class: "sub", text: L().shNoTicket }),
      src ? el("p", { class: "fine", id: "ship-sla", text: !can ? L().shNeedAssign(src.sc.ticket.id) : W.isPending(r.status) ? L().shPaused : L().shRunning }) : null,
      fieldsDl(fields),
      x.state === "draft" && v.errors.length ? el("div", { class: "ship-missing" }, el("b", { text: L().shMissing }), el("ul", { class: "missing" }, v.errors.map((k) => el("li", { text: labels[k] || k })))) : null,
      can && SH.next(x).length ? el("div", { class: "acts" }, shipButtons(x, run)) : null,
      out ? el("div", { class: "ship-out", id: "ship-out", "aria-live": "polite" }, el("p", { class: "pc-eq" }, el("span", { text: L().equivalent + " " }), el("code", { text: out.cmd })),
        (() => { const ls = out.lines.filter((l) => ["say", "err", "ok", "event"].includes(l.kind)); return ls.length ? el("div", { class: "pc-msg" }, ls.map((l) => el("p", { class: "line " + l.kind, text: l.text }))) : null; })()) : null,
      el("h3", { text: L().shEvents }),
      el("ol", { class: "tl ship-tl" }, x.events.slice().reverse().map((e) => el("li", { class: "tl-" + (e.state === "closed" ? "closed" : e.state === "incident" ? "new" : "progress") },
        el("p", { class: "tl-head" }, el("time", { text: SH.stamp(e.at) }), el("span", { class: "strong", text: SH.stateLabel(x, lang, e.state) })),
        el("p", { class: "tl-reason", text: SH.eventText(x, e, lang) })))));
  }

  // the form: the ticket (or practice), what ships, and the details the vendor and the carrier need
  function renderShipForm(box, deskId) {
    const sources = shipSources().filter(canShip);
    const ticket = el("select", { id: "ship-ticket", name: "ticket" }, el("option", { value: "", text: L().shTicketNone }),
      SCENARIOS.filter((sc) => sc.ship).map((sc) => {
        const ok = sources.some((x) => x.sc.id === sc.id);
        return el("option", { value: sc.id, disabled: ok ? null : true, selected: deskId === sc.id && ok ? true : null, text: `${sc.ticket.id} · ${t(sc.title, lang)}${ok ? "" : " (" + L().unassigned.toLowerCase() + ")"}` });
      }));
    const opt = (v, text, on) => el("option", { value: v, text, selected: on ? true : null });
    const type = el("select", { id: "ship-type", name: "type" }, Object.keys(SH.TYPES).map((k) => opt(k, SH.t(SH.TYPES[k], lang))));
    const asset = el("select", { id: "ship-asset", name: "serial" }, el("option", { value: "", text: L().shDataPick }),
      SH.ASSETS.map((a) => opt(a.serial, `${a.id} · ${a.serial} · ${SH.t(SH.DEVICE[SH.deviceState(allStores(), a.serial)], lang)}`)));
    const vendor = el("select", { id: "ship-vendor", name: "vendor" }, opt("", L().shVendorNone), Object.keys(SH.VENDORS).map((k) => opt(k, SH.t(SH.VENDORS[k].name, lang))));
    const txt = (idn, ph, max) => el("input", { type: "text", id: idn, autocomplete: "off", maxlength: String(max || 200), placeholder: ph || null });
    const fault = txt("ship-fault", L().shFaultPh);
    const evidence = txt("ship-evidence", L().shEvidencePh);
    const contract = txt("ship-contract", "", 60);
    const carrier = el("select", { id: "ship-carrier", name: "carrier" }, Object.keys(SH.CARRIERS).map((k) => opt(k, SH.t(SH.CARRIERS[k].name, lang))));
    const place = (idn, def) => el("select", { id: idn }, Object.keys(SH.ADDRESSES).map((k) => opt(k, SH.t(SH.ADDRESSES[k].name, lang), k === def)));
    const from = place("ship-from", "hq-it");
    const to = place("ship-to", "home-jruiz");
    const data = el("select", { id: "ship-data", name: "data" }, opt("", L().shDataPick), Object.keys(SH.DATA).map((k) => opt(k, SH.t(SH.DATA[k], lang))));
    const escrow = el("input", { type: "checkbox", id: "ship-escrow" });
    const items = Object.keys(SH.ITEMS).map((k) => el("label", { class: "ship-check" }, el("input", { type: "checkbox", value: k, "data-item": k }), el("span", { text: SH.t(SH.ITEMS[k], lang) })));
    const msg = el("p", { class: "form-msg", role: "alert" });
    const field = (label, input, cls) => el("label", { class: "field" + (cls ? " " + cls : "") }, el("span", { class: "field-label", text: label }), input);
    const rmaOnly = el("div", { class: "ship-rma" }, field(L().shVendor, vendor), field(L().shContract, contract), field(L().shFault, fault, "wide"), field(L().shEvidence, evidence, "wide"));
    const itemsBox = el("fieldset", { class: "ship-items" }, el("legend", { text: L().shItems }), items);
    const sync = () => { rmaOnly.hidden = type.value !== "rma"; itemsBox.hidden = type.value !== "return"; };
    type.addEventListener("change", sync);
    sync();
    const submit = (ev) => {
      ev.preventDefault();
      const src = ticket.value ? shipSources().find((x) => x.sc.id === ticket.value) : null;
      if (ticket.value && !canShip(src)) { msg.textContent = L().shNeedAssign(ticket.value); return; }
      if (!asset.value) { msg.textContent = L().shMissing + " " + L().shAsset; asset.focus(); return; }
      const fields = { serial: asset.value, carrier: carrier.value, from: from.value, to: to.value };
      if (type.value === "rma") Object.assign(fields, { vendor: vendor.value, fault: fault.value.trim(), evidence: evidence.value.trim(), contract: contract.value.trim() });
      if (type.value === "return") fields.items = items.map((l) => l.querySelector("input")).filter((i) => i.checked).map((i) => i.value);
      if (data.value) fields.data = data.value;
      fields.escrow = escrow.checked;
      const cmd = SH.command("new", type.value, fields);
      const res = shipRun(src, cmd);
      if (!res.ship) { msg.textContent = res.lines.map((l) => l.text).join(" "); return; }
      shipOut = { id: res.ship.id, cmd, lines: [{ text: L().shCreated(res.ship.id), kind: "ok" }].concat(res.lines) };
      shipSel = res.ship.id;
      location.hash = "#/shipping/" + res.ship.id;
    };
    box.replaceChildren(el("section", { class: "panel note ship-form", id: "ship-form", "aria-label": L().shNew }, el("h2", { text: L().shNew }),
      el("form", { onsubmit: submit, novalidate: true },
        el("div", { class: "ship-grid-f" }, field(L().shTicketLabel, ticket, "wide"), field(L().shType, type), field(L().shAsset, asset),
          rmaOnly, field(L().shCarrier, carrier), field(L().shFrom, from), field(L().shTo, to), field(L().shData, data)),
        el("label", { class: "ship-check ship-escrow" }, escrow, el("span", { text: L().shEscrow })),
        itemsBox, msg,
        el("div", { class: "row" }, el("button", { type: "submit", class: "btn", id: "ship-create", text: L().shCreate })))));
  }

  /* ---------- v0.8: the documentation library (#/library, #/library/<area>): one reference article per area (library.js) */
  let libQuery = "";
  const deskById = (id) => SCENARIOS.find((s) => s.id === id);
  const labTitle = (id) => t(Lb.lab(id).title, lang);
  const labStore = () => Lb.normalise(load("labs", {}));
  function download(name, text, msg, done) {
    try {
      const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
      const link = el("a", { href: url, download: name, class: "kb-dl" });
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      msg.textContent = done(name);
    } catch (e) { msg.textContent = L().errors.server; }
  }
  function deskChip(id) {
    const sc = deskById(id);
    const p = progress[id];
    return el("li", { class: "lib-desk" }, el("a", { href: "#/desk/" + id }, el("span", { class: "mono", text: sc.ticket.id }), " ", el("span", { text: t(sc.title, lang) })),
      el("span", { class: "sub", text: " · " + t(sc.topic, lang) + " · " + L().level + " " + sc.level + " " }),
      p ? pill("resolved", L().libSolved + " · " + p.points) : pill("new", L().libOpen));
  }
  function labChip(id) {
    const pr = Lb.progressOf(labStore(), id);
    return el("li", { class: "lib-desk" }, el("a", { href: "#/labs/" + id, text: labTitle(id) }), " ",
      pr.complete ? pill("resolved", L().labDone) : el("span", { class: "count-pill", text: L().labTasks(pr.done, pr.total) }));
  }
  function libraryPage(id) {
    const view = shell("library");
    if (id) return libArticle(view, Lib.article(id));
    document.title = L().libTitle + " · SysAdmin Desks";
    const listBox = el("div", { id: "lib-list" });
    const search = el("input", { type: "search", class: "dir-search kb-search", id: "lib-search", placeholder: L().libSearch, "aria-label": L().libSearch, value: libQuery });
    search.addEventListener("input", () => { libQuery = search.value; renderList(); });
    function renderList() {
      const hits = Lib.search(libQuery, lang);
      put(listBox, el("p", { class: "sub kb-count", "aria-live": "polite", text: L().libCount(hits.length) }),
        hits.length ? el("ul", { class: "lib-grid" }, hits.map((x) => {
          const a = x.article;
          const ar = Lib.area(a.id);
          return el("li", { class: "lib-card" }, el("a", { href: "#/library/" + a.id, class: "lib-link" },
            el("span", { class: "lib-ico", "aria-hidden": "true", text: ar.icon }),
            el("span", { class: "lib-txt" }, el("span", { class: "lib-area", text: t(ar.name, lang) }), el("b", { text: t(a.title, lang) }),
              el("span", { class: "sub", text: libQuery.trim() ? x.snippet : t(a.summary, lang) }),
              el("span", { class: "lib-meta", text: `${a.desks.length} tickets · ${a.labs.length ? labTitle(a.labs[0]) : "–"}` }))));
        })) : el("p", { class: "empty", text: L().libNone }));
    }
    renderList();
    view.append(el("header", { class: "view-head" }, el("div", {}, el("h1", { text: L().libTitle }), el("p", { class: "sub", text: L().libSub })),
      el("a", { class: "btn ghost sm", href: "/tickets/", id: "lib-tickets", text: L().libTickets })),
      el("div", { class: "kb-filters" }, search), listBox);
  }
  function libArticle(view, a) {
    if (!a) { view.append(el("p", { class: "kb-back" }, el("a", { href: "#/library", text: L().libBack })), el("p", { class: "empty", text: L().notFound })); return; }
    const ar = Lib.area(a.id);
    document.title = t(a.title, lang) + " · " + L().libTitle + " · SysAdmin Desks";
    const msg = el("p", { class: "kb-msg", role: "status" });
    const placeLabel = (tool) => {
      const w = Lib.toolPlace(tool);
      if (w.kind === "ad") return el("a", { href: "#/directory", text: L().libPlace.ad });
      if (w.kind === "lab") return el("a", { href: "#/labs/" + w.id, text: labTitle(w.id) });
      if (w.kind === "desk") { const sc = deskById(w.id); return el("a", { href: "#/desk/" + w.id, text: sc.ticket.id + " · " + t(sc.title, lang) }); }
      if (w.kind === "page") return el("a", { href: w.id, text: tool.cmd });
      return el("a", { href: "#/network/" + w.id, text: L().libPlace.device(w.id) });
    };
    const ul = (list) => el("ul", {}, list.map((x) => el("li", { text: x })));
    view.append(
      el("p", { class: "kb-back" }, el("a", { href: "#/library", text: L().libBack })),
      el("article", { class: "panel kb-article lib-article", id: "lib-article", "aria-labelledby": "lib-h" },
        el("p", { class: "kb-kicker", text: `${L().libKicker} · ${t(ar.name, lang)}` }),
        el("h1", { id: "lib-h", text: t(a.title, lang) }),
        el("p", { class: "lib-summary", text: t(a.summary, lang) }),
        el("h2", { text: L().libWhat }), a.what[lang === "es" ? "es" : "en"].map((p) => el("p", { text: p })),
        el("h2", { text: L().libTools }),
        el("div", { class: "qwrap lib-tools" }, el("table", { class: "qtable" },
          el("thead", {}, el("tr", {}, [L().libCmd, L().libGives, L().libWhere].map((x) => el("th", { scope: "col", text: x })))),
          el("tbody", {}, a.tools.map((x) => el("tr", {},
            el("td", { "data-label": L().libCmd }, Lib.toolPlace(x).kind === "page" ? el("b", { text: x.cmd }) : el("code", { class: "lib-cmd", text: x.cmd })),
            el("td", { "data-label": L().libGives, text: t(x.what, lang) }),
            el("td", { "data-label": L().libWhere }, placeLabel(x))))))),
        el("h2", { text: L().libCauses }), ul(a.causes[lang === "es" ? "es" : "en"]),
        el("h2", { text: L().libTips }), ul(a.tips[lang === "es" ? "es" : "en"]),
        el("h2", { text: L().libDesks }), el("ul", { class: "lib-desks", id: "lib-desks" }, a.desks.map(deskChip)),
        el("h2", { text: L().libLabs }), a.labs.length ? el("ul", { class: "lib-desks", id: "lib-labs" }, a.labs.map(labChip)) : el("p", { class: "muted", text: L().libNoLab }),
        el("h2", { text: L().libGuides }), el("ul", { class: "lib-guides", id: "lib-guides" }, a.guides.map((g) => el("li", {}, el("a", { href: Lib.guideUrl(g), target: "_blank", rel: "noopener noreferrer", text: (g.charAt(0).toUpperCase() + g.slice(1)).replace(/-/g, " ") })))),
        el("p", { class: "kb-foot", text: L().libNotSpoiler })),
      el("div", { class: "row kb-tools" },
        el("button", { type: "button", class: "btn", id: "lib-download", text: L().libDownload, onclick: () => download("library-" + a.id + "-" + lang + ".md",
          Lib.toMarkdown(a, lang, (d) => deskById(d).ticket.id + " · " + t(deskById(d).title, lang), labTitle), msg, L().kbDownloaded) }),
        el("button", { type: "button", class: "btn ghost", text: L().kbPrint, onclick: () => window.print() })),
      msg);
  }

  /* ---------- v0.8: labs by area (#/labs, #/labs/<id>): a console and guided tasks that tick themselves (labs.js). The sandbox lives in
     this page; the tasks done are kept in this browser (sd.labs) */
  const labLive = {};        // labId -> {s: the lab session, log: [{text, kind}], hist: [], pos}
  function labOf(id) {
    if (!labLive[id]) {
      // v0.9: the sandbox comes back after a reload (sd.labbox)
      const d = user ? envOf(mapOf("labbox")[id]) : null;
      const back = d ? PS.labFromJSON(id, d, lang) : null;
      labLive[id] = back || { s: Lb.create(id, lang), log: [{ text: L().labWelcome, kind: "dim" }], hist: [], pos: 0 };
    }
    return labLive[id];
  }
  function saveLab(id) {
    if (!user) return;
    const m = mapOf("labbox");
    if (labLive[id]) m[id] = packed(PS.labToJSON(labLive[id])); else delete m[id];
    save("labbox", m);
  }
  function labsPage(id) {
    const view = shell("labs");
    if (id && Lb.lab(id)) return labPage(view, id);
    document.title = L().labsTitle + " · SysAdmin Desks";
    const store = labStore();
    const shifts = shiftStore();
    view.append(el("header", { class: "view-head" }, el("div", {}, el("h1", { text: L().labsTitle }), el("p", { class: "sub", text: L().labsSub }))),
      el("ul", { class: "lib-grid labs-grid", id: "labs-list" }, Lb.LABS.map((l) => {
        const pr = Lb.progressOf(store, l.id);
        const ar = Lib.area(l.area);
        return el("li", { class: "lib-card lab-card" + (pr.complete ? " done" : "") }, el("a", { href: "#/labs/" + l.id, class: "lib-link" },
          el("span", { class: "lib-ico", "aria-hidden": "true", text: ar.icon }),
          el("span", { class: "lib-txt" }, el("span", { class: "lib-area", text: t(ar.name, lang) }), el("b", { text: t(l.title, lang) }), el("span", { class: "sub", text: t(l.summary, lang) }),
            el("progress", { class: "goal-bar", max: String(pr.total), value: String(pr.done), "aria-label": L().labTasks(pr.done, pr.total) }),
            el("span", { class: "lib-meta" }, pr.complete ? pill("resolved", L().labDone + (pr.completed ? " · " + pr.completed : "")) : el("span", { text: L().labTasks(pr.done, pr.total) + " · " + (pr.done ? L().labContinue : L().labOpen) }),
              shifts.active && shifts.active.lab === l.id ? pill("progress", L().shCardRun) : shifts.done[l.id] ? pill("resolved", "⏱ " + L().shCard) : null))));
      })),
      el("p", { class: "fine", text: L().labStored }));
  }
  function labPage(view, id) {
    const def = Lb.lab(id);
    const lv = labOf(id);
    document.title = t(def.title, lang) + " · " + L().labsTitle + " · SysAdmin Desks";
    const out = el("div", { class: "out", "aria-live": "polite" });
    const input = el("input", { type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", id: "lab-input", "aria-label": L().labConsole(t(def.title, lang)) });
    const ps = el("span", { class: "ps", text: Lb.prompt(lv.s) });
    const tasksBox = el("section", { class: "panel lab-tasks", id: "lab-tasks" });
    const doneBox = el("div", { role: "status" });
    const print = (text, kind) => { lv.log.push({ text, kind }); if (lv.log.length > 600) lv.log = lv.log.slice(-400); out.append(el("div", { class: "line " + (kind || "out"), text })); };
    lv.log.forEach((l) => out.append(el("div", { class: "line " + (l.kind || "out"), text: l.text })));
    function renderTasks() {
      const list = Lb.tasks(lv.s, lang);
      const pr = Lb.progressOf(labStore(), id);
      const stored = (labStore()[id] || { done: [] }).done;
      put(tasksBox, el("div", { class: "row" }, el("h2", { text: L().labTasksT }), el("span", { class: "count-pill", id: "lab-count", text: `${pr.done}/${pr.total}` }), el("span", { class: "grow" }),
        el("button", { type: "button", class: "link-btn", id: "lab-reset", text: L().labReset, onclick: () => {
          delete labLive[id]; saveLab(id); save("labs", Lb.reset(load("labs", {}), id)); labOf(id).log.push({ text: L().labResetDone, kind: "say" }); labsPage(id);
        } })),
        el("ol", { class: "stages lab-list" }, list.map((x) => {
          const done = x.done || stored.includes(x.id);
          return el("li", { class: done ? "done" : "", "data-task": x.id }, el("span", { class: "box", "aria-hidden": "true", text: done ? "✓" : "" }),
            el("div", { class: "lab-task" }, el("span", { text: x.label }),
              el("details", { class: "lab-how" }, el("summary", { text: L().labHow }), el("code", { text: x.hint }))));
        })),
        el("p", { class: "fine", text: L().labNoPressure }));
      put(doneBox, pr.complete ? el("p", { class: "badge-new lab-complete", id: "lab-complete" }, el("span", { class: "side-ico", "aria-hidden": "true", text: "★" }), el("span", { text: L().labComplete })) : null);
    }
    function exec(cmd) {
      cmd = String(cmd || "").trim();
      if (!cmd) return;
      lv.hist.push(cmd); lv.pos = lv.hist.length;
      print(Lb.prompt(lv.s) + cmd, "cmd");
      const r = Lb.run(lv.s, cmd, lang);
      if (r.clear) { out.replaceChildren(); lv.log = []; }
      r.lines.forEach((l) => print(l.text, l.kind));
      const now = Lb.tasks(lv.s, lang).filter((x) => x.done);
      const rec = Lb.record(load("labs", {}), id, now.map((x) => x.id), today());
      if (rec.fresh.length) {
        save("labs", rec.store);
        rec.fresh.forEach((tid) => print(L().labTaskDone(now.find((x) => x.id === tid).label), "ok"));
        if (rec.completedNow) print(L().labComplete, "ok");
        celebrate(rec.completedNow ? "complete" : "task");
        // v0.9b: each new task goes into the activity (weekly goals) and the points; a weekly goal met here is said in the console
        const day = today();
        const a = activity().concat(rec.fresh.map((tid) => ({ type: "lab", id: id + ":" + tid, lab: id, day })));
        save("activity", a.slice(-1000));
        freshGoals = [];
        awardNow();
        freshGoals.forEach((gid) => { const g = Lv.goal(gid); print(L().wgFresh(t(g.label, lang), g.points), "ok"); });
        freshGoals = [];
        if (rec.completedNow) renderShiftPanel();
      }
      saveLab(id);
      ps.textContent = Lb.prompt(lv.s);
      renderTasks();
      term.scrollTop = term.scrollHeight;
    }
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowUp" && lv.pos > 0) { lv.pos -= 1; input.value = lv.hist[lv.pos]; ev.preventDefault(); }
      else if (ev.key === "ArrowDown") { lv.pos = Math.min(lv.hist.length, lv.pos + 1); input.value = lv.hist[lv.pos] || ""; ev.preventDefault(); }
    });
    const term = el("div", { class: "term lab-term", onclick: () => { if (!window.getSelection().toString()) input.focus(); } }, out,
      el("form", { onsubmit: (ev) => { ev.preventDefault(); exec(input.value); input.value = ""; } }, ps, input));
    // v0.9b: the full shift at the end of the lab
    const shiftPanel = el("section", { class: "panel lab-shift", id: "lab-shift", "aria-labelledby": "lab-shift-h" });
    function renderShiftPanel() {
      const st = shiftStore();
      const a = st.active;
      const unlocked = Lb.progressOf(labStore(), id).complete;
      const body = [el("h2", { id: "lab-shift-h" }, el("span", { "aria-hidden": "true", text: "⏱ " }), L().shTitle), el("p", { class: "sub", text: L().shSub })];
      const deskLi = (d, state) => el("li", { class: "shift-desk " + state, "data-desk": d },
        el("span", { class: "career-n", "aria-hidden": "true", text: state === "done" ? "✓" : "" }),
        el("a", { href: "#/desk/" + d, text: deskById(d).ticket.id + " · " + t(deskById(d).title, lang) }),
        pill(state === "done" ? "resolved" : state === "now" ? "progress" : "new", L().shState[state]));
      const last = st.log.filter((x) => x.lab === id).slice(-1)[0];
      if (!unlocked) body.push(el("p", { class: "fine shift-locked", id: "shift-locked", text: L().shLocked }));
      else if (a && a.lab !== id) body.push(el("p", { class: "fine", id: "shift-busy" }, L().shBusy(labTitle(a.lab)) + " ", el("a", { href: "#/labs/" + a.lab, text: labTitle(a.lab) })));
      else if (a) {
        const nx = Lv.current(st);
        body.push(el("p", { class: "shift-timer" }, el("span", { class: "muted", text: L().shTimer + " " }), el("b", { class: "mono", "data-shift-timer": "", id: "shift-timer", text: mmssMs(Lv.elapsed(a, Date.now())) }),
          el("span", { class: "count-pill", id: "shift-count", text: `${a.results.length}/${a.desks.length}` })),
          el("ol", { class: "shift-desks", id: "shift-desks" }, a.desks.map((d, k) => deskLi(d, k < a.results.length ? "done" : k === a.results.length ? "now" : "later"))),
          el("div", { class: "row" }, el("a", { class: "btn", id: "shift-go", href: "#/desk/" + nx, onclick: () => freeShiftDesk(nx), text: L().shGo }),
            el("button", { type: "button", class: "btn ghost", id: "shift-abandon", text: L().shAbandon, onclick: () => {
              setShifts(Lv.abandon(shiftStore())); renderShiftPanel(); shiftMsg.textContent = L().shAbandoned; } })));
      } else {
        const pick = Lv.pickShift(id, { desks: SCENARIOS.map((x) => x.id), levels: DESK_LEVELS(), unavailable: SCENARIOS.filter((x) => mine(x.id)).map((x) => x.id) });
        if (last) {
          const sm = Lv.summary(last);
          body.push(el("div", { class: "shift-sum", id: "shift-summary" }, el("h3", { text: L().shSummaryT }), el("p", { class: "mono", text: L().shSummary(sm) }),
            el("ol", { class: "shift-desks" }, last.results.map((r) => el("li", { class: "shift-desk done" }, el("span", { class: "career-n", "aria-hidden": "true", text: "✓" }),
              el("span", { text: deskById(r.id).ticket.id + " · " + t(deskById(r.id).title, lang) }), pill(r.level, L().lvl[r.level]), el("span", { class: "mono", text: String(r.points) }))))));
        }
        if (st.done[id]) body.push(el("p", { class: "badge-new", id: "shift-reward" }, el("span", { class: "side-ico", "aria-hidden": "true", text: "★" }),
          el("span", { text: L().shReward(Lv.SHIFT.points, badgeName("shift-" + id)) + " " + L().shBest(st.done[id].day) + (st.log.filter((x) => x.lab === id).length > 1 ? " " + L().shRewardOnce : "") })));
        if (pick.length < Lv.SHIFT.size) body.push(el("p", { class: "fine", id: "shift-short", text: L().shNotEnough }));
        else body.push(el("ol", { class: "shift-desks preview" }, pick.map((d) => deskLi(d, "later"))),
          el("div", { class: "row" }, el("button", { type: "button", class: "btn", id: "shift-start", text: last ? L().shAgain : L().shStart, onclick: () => {
            const r = Lv.start(shiftStore(), id, pick, Date.now(), labStore());
            if (!r.ok) { shiftMsg.textContent = r.error === "busy" ? L().shBusy(labTitle(r.lab)) : L().shNotEnough; return; }
            setShifts(r.store);
            pick.forEach(freeShiftDesk);
            renderShiftPanel();
            const go = document.getElementById("shift-go"); if (go) go.focus();
          } })));
      }
      body.push(shiftMsg);
      put(shiftPanel, body);
    }
    const shiftMsg = el("p", { class: "kb-msg", role: "status", id: "shift-msg" });
    const art = Lib.forLab(id)[0];
    renderTasks();
    renderShiftPanel();
    view.append(el("p", { class: "kb-back" }, el("a", { href: "#/labs", text: L().labBack })),
      el("header", { class: "view-head" }, el("div", {}, el("h1", { text: t(def.title, lang) }), el("p", { class: "sub", text: t(def.summary, lang) })),
        art ? el("a", { class: "btn ghost sm", href: "#/library/" + art.id, id: "lab-library", text: L().labRead }) : null),
      doneBox,
      el("div", { class: "lab-grid" }, tasksBox,
        el("div", {}, el("h2", { class: "dir-ps", text: L().labConsole(t(def.title, lang)) }), term, el("p", { class: "term-help", text: L().labHelp }))),
      shiftPanel);
    term.scrollTop = term.scrollHeight;
    input.focus({ preventScroll: true });
  }

  /* ---------- v0.8: profile and career (#/profile): progress per area, a radar, the career path and a Markdown summary (profile.js) */
  function profileInput() {
    return { desks: SCENARIOS.map((s) => s.id), levels: Object.fromEntries(SCENARIOS.map((s) => [s.id, s.level])), progress, activity: activity(), labs: load("labs", {}) };
  }
  function radarSvg(agg) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = (tag, attrs, ...kids) => { const n = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); kids.forEach((k) => n.append(k)); return n; };
    const g = PF.radar(agg.areas.map((a) => a.skill), 300);
    const short = (id) => ({ ad: "AD", windows: "Windows", m365: "M365", endpoint: "Intune", linux: "Linux", vdi: "Citrix", data: lang === "es" ? "Copias/SQL" : "Backup/SQL", network: lang === "es" ? "Red" : "Network", hardware: "RMA", itsm: "ITSM" })[id];
    const title = svg("title", {}); title.textContent = L().pfRadar;
    return svg("svg", { viewBox: `-30 0 ${g.size + 60} ${g.size}`, class: "radar", role: "img", "aria-labelledby": "radar-t", id: "pf-radar" },
      Object.assign(title, { id: "radar-t" }),
      ...g.rings.map((p) => svg("polygon", { points: p, class: "radar-ring" })),
      ...g.axes.map((x) => svg("line", { x1: g.center, y1: g.center, x2: x.end[0], y2: x.end[1], class: "radar-axis" })),
      svg("polygon", { points: g.shape, class: "radar-shape" }),
      ...g.axes.map((x, i) => { const tx = svg("text", { x: x.label[0], y: x.label[1] + 4, class: "radar-label", "text-anchor": Math.abs(x.label[0] - g.center) < 8 ? "middle" : x.label[0] > g.center ? "start" : "end" }); tx.textContent = short(agg.areas[i].id); return tx; }));
  }
  function profilePage() {
    const view = shell("profile");
    document.title = L().pfTitle + " · SysAdmin Desks";
    const input = profileInput();
    const agg = PF.aggregate(input);
    const car = PF.career(input);
    const tt = agg.totals;
    const tile = (n, label, id) => el("div", { class: "tile", id: id || null }, el("p", { class: "tile-n", text: n }), el("p", { class: "tile-l", text: label }));
    const h2 = (text, extra) => el("div", { class: "p-h" }, el("h2", { text }), extra || null);
    const areaName = (id) => t(Lib.area(id).name, lang);
    const msg = el("p", { class: "kb-msg", role: "status" });
    const next = car.next;
    const nextText = !next ? L().pfAllDone : next.kind === "desk" ? L().pfNextDesk(t(deskById(next.id).title, lang)) : L().pfNextLab(labTitle(next.id));
    const stLabel = { done: L().pfStepDone, current: L().pfStepNow, later: L().pfStepLater };
    view.append(
      el("header", { class: "view-head" }, el("div", {}, el("h1", { text: L().pfTitle }), el("p", { class: "sub", text: L().pfSub }))),
      levelPanel("pf"),
      countersBlock("pf"),
      el("div", { class: "tiles", id: "pf-tiles" }, tile(`${tt.solved}/${tt.desks}`, L().pfSolved, "pf-solved"), tile(tt.avgPoints == null ? "–" : String(tt.avgPoints), L().pfAvg, "pf-avg"),
        tile(tt.comms == null ? "–" : `${tt.comms}/5`, L().pfComms, "pf-comms"), tile(`${tt.labsComplete}/${tt.labs}`, L().pfLabs, "pf-labs")),
      el("section", { class: "panel pf-next", id: "pf-next" }, el("h2", { text: L().pfNext }), el("p", { class: "pf-next-t", text: nextText }),
        next ? el("a", { class: "btn", id: "pf-next-go", href: next.kind === "desk" ? "#/desk/" + next.id : "#/labs/" + next.id, text: L().pfNextGo }) : null),
      h2(L().pfSkills),
      el("div", { class: "pf-skills" },
        el("figure", { class: "panel pf-radar" }, radarSvg(agg), el("figcaption", { class: "fine", text: L().pfSkillsNote })),
        el("ul", { class: "panel pf-bars", id: "pf-bars", "aria-label": L().pfRadar }, agg.areas.map((a) => el("li", {},
          el("span", { class: "pf-bar-l" }, el("a", { href: "#/library/" + a.id, text: areaName(a.id) }), el("span", { class: "mono", text: String(a.skill) })),
          el("progress", { class: "goal-bar", max: "100", value: String(a.skill), "aria-label": `${areaName(a.id)}: ${a.skill} / 100` }))))),
      h2(L().pfAreas),
      el("div", { class: "qwrap" }, el("table", { class: "qtable", id: "pf-areas" },
        el("thead", {}, el("tr", {}, [L().colArea, L().colTickets, L().colAvg, L().colComms, L().colLabTasks, L().colLevel].map((x) => el("th", { scope: "col", text: x })))),
        el("tbody", {}, agg.areas.map((a) => el("tr", { "data-area": a.id },
          el("td", { class: "subj", "data-label": L().colArea }, el("a", { href: "#/library/" + a.id, text: areaName(a.id) })),
          el("td", { "data-label": L().colTickets, text: a.desks ? `${a.solved}/${a.desks}` : "–" }),
          el("td", { "data-label": L().colAvg, text: a.avgPoints == null ? "–" : String(a.avgPoints) }),
          el("td", { "data-label": L().colComms, text: a.comms == null ? "–" : `${a.comms}/5` }),
          el("td", { "data-label": L().colLabTasks }, a.labTotal ? el("a", { href: "#/labs/" + a.labs[0], text: `${a.labDone}/${a.labTotal}` }) : el("span", { class: "muted", text: "–" })),
          el("td", { "data-label": L().colLevel, class: "mono", text: `${a.skill}/100` })))))),
      h2(L().pfCareer),
      el("p", { class: "sub pf-career-sub", text: L().pfCareerSub }),
      el("ol", { class: "career", id: "pf-career" }, car.steps.map((s, i) => el("li", { class: "career-step " + s.status, "data-step": s.id },
        el("p", { class: "career-h" }, el("span", { class: "career-n", "aria-hidden": "true", text: s.status === "done" ? "✓" : String(i + 1) }), el("b", { text: t(s.title, lang) }),
          el("span", { class: "pill " + (s.status === "done" ? "resolved" : s.status === "current" ? "progress" : "new"), text: stLabel[s.status] })),
        el("p", { class: "sub", text: t(s.what, lang) }),
        el("progress", { class: "goal-bar", max: String(s.total), value: String(s.done), "aria-label": `${t(s.title, lang)}: ${s.done} / ${s.total}` }),
        el("p", { class: "fine", text: `${s.done}/${s.total} · ${s.areas.map(areaName).join(" · ")}` }),
        el("ul", { class: "career-items" },
          s.desks.map((d) => el("li", { class: d.solved ? "on" : "" }, el("span", { "aria-hidden": "true", text: d.solved ? "✓ " : "○ " }), el("a", { href: "#/desk/" + d.id, text: t(deskById(d.id).title, lang) }))),
          s.labs.map((l) => el("li", { class: l.complete ? "on" : "" }, el("span", { "aria-hidden": "true", text: l.complete ? "✓ " : "⚗ " }), el("a", { href: "#/labs/" + l.id, text: labTitle(l.id) + ` (${l.done}/${l.total})` }))))))),
      h2(L().pfExport),
      el("section", { class: "panel pf-export", id: "pf-export" }, el("p", { class: "pf-label" }, el("b", { text: L().pfLabel })), el("p", { class: "sub", text: L().pfExportText }),
        el("div", { class: "row" }, el("button", { type: "button", class: "btn", id: "pf-download", text: L().pfExportBtn, onclick: () => {
          const day = today();
          download(PF.fileName(day), PF.toMarkdown(profileInput(), { lang, name: user ? user.name : "", date: day, site: location.origin + "/",
            deskTitle: (d) => deskById(d).ticket.id + " · " + t(deskById(d).title, lang), deskTopic: (d) => t(deskById(d).topic, lang), labTitle }), msg, L().pfDownloaded);
        } })), msg));
  }

  /* ---------- the tour (v0.8): a guided first ticket for a new technician. A card at the bottom and the element it talks about
     highlighted; it moves between the queue and one ticket, waits while you assign it, and can be skipped or taken again from the sidebar.
     A technician who already took the earlier tour sees one "what's new" card instead (sd.whatsNew). */
  const WHATS_NEW = "0.9";
  const TOUR = [
    { route: "#/", targets: [] }, { route: "#/", targets: ["side-nav"] }, { route: "#/", targets: ["tour-queue"] }, { route: "#/", targets: ["tour-row"] },
    { route: "desk", targets: ["assign", "wf-pend", "wf-resume"] }, { route: "desk", targets: ["tour-term"] },
    { route: "desk", targets: ["resolve-panel"], wait: true }, { route: "desk", targets: ["user-note"], wait: true }, { route: "#/", targets: ["nav-library"] },
  ];
  let tourAt = null;         // the step on show (or about to show after a page change)
  let tourDeskId = null;     // the ticket the tour works on
  function tourDesk() {
    if (tourDeskId) return tourDeskId;
    const pick = ["ad-lockout", "print-queue", "disk-full", "dns-intranet"].map(deskById).find((sc) => sc && isOpen(sc)) || SCENARIOS.find(isOpen) || SCENARIOS[0];
    return pick.id;
  }
  const tourRoute = (i) => (TOUR[i].route === "desk" ? "#/desk/" + tourDesk() : "#/");
  function closeTour(done) {
    document.querySelectorAll(".tour").forEach((n) => n.remove());
    document.querySelectorAll(".tour-focus").forEach((n) => n.classList.remove("tour-focus"));
    document.removeEventListener("keydown", tourKeys);
    if (done) { save("tourDone", true); save("whatsNew", WHATS_NEW); tourAt = null; tourDeskId = null; }
  }
  function tourKeys(ev) { if (ev.key === "Escape") closeTour(true); }
  function tourCard(stepText, title, text, buttons) {
    const card = el("div", { class: "tour", role: "dialog", "aria-labelledby": "tour-h", id: "tour-card" },
      stepText ? el("p", { class: "tour-step", text: stepText }) : null, el("h2", { id: "tour-h", text: title }), el("p", { text }), el("div", { class: "row" }, buttons));
    document.body.append(card);
    document.addEventListener("keydown", tourKeys);
    const main = card.querySelector(".btn.sm:last-child");
    if (main) main.focus({ preventScroll: true });
    return card;
  }
  function tour(i) {
    closeTour(false);
    if (i === 0 && tourAt == null) tourDeskId = null;
    tourDeskId = tourDesk();
    tourAt = i;
    const want = tourRoute(i);
    if ((location.hash || "#/") !== want) { location.hash = want; return; }   // route() shows it once the page is there
    const steps = L().tourGuided;
    const meta = TOUR[i];
    const target = meta.targets.map((x) => document.getElementById(x)).find(Boolean);
    if (target) { target.classList.add("tour-focus"); target.scrollIntoView({ behavior: motion(), block: "center" }); }
    const last = i === steps.length - 1;
    tourCard(L().tourStep(i + 1, steps.length), steps[i][0], steps[i][1] + (meta.wait && !target ? " " + L().tourWait : ""), [
      el("button", { type: "button", class: "link-btn", id: "tour-skip", text: L().tourSkip, onclick: () => closeTour(true) }),
      el("span", { class: "grow" }),
      i ? el("button", { type: "button", class: "btn ghost sm", id: "tour-back", text: L().tourBack, onclick: () => tour(i - 1) }) : null,
      el("button", { type: "button", class: "btn sm", id: "tour-next", text: last ? L().tourDone : L().tourNext, onclick: () => last ? closeTour(true) : tour(i + 1) })]);
  }
  // after a page change: the tour carries on if the page is the one its step needs; leaving it elsewhere ends the tour
  function tourResume() {
    if (tourAt == null) return;
    const here = location.hash || "#/";
    // opening the ticket yourself at "Open a ticket" (or going back to the queue from it) moves the tour along
    const i = here === tourRoute(tourAt) ? tourAt : TOUR[tourAt + 1] && here === tourRoute(tourAt + 1) ? tourAt + 1 : tourAt > 0 && here === tourRoute(tourAt - 1) ? tourAt - 1 : null;
    if (user && i != null) { tourAt = i; setTimeout(() => { if (tourAt === i) tour(i); }, 150); }
    else closeTour(true);
  }
  function whatsNew() {
    closeTour(false);
    const done = () => { save("whatsNew", WHATS_NEW); closeTour(false); };
    const go = (href) => () => { done(); location.hash = href; };
    tourCard(null, L().newTitle, L().newText, [
      el("button", { type: "button", class: "btn ghost sm", id: "new-mail", text: L().navMail, onclick: go("#/mail") }),
      el("button", { type: "button", class: "btn ghost sm", id: "new-prefs", text: L().prTitle, onclick: go("#/account") }),
      el("button", { type: "button", class: "btn ghost sm", id: "new-free", text: L().ftNew, onclick: go("#/free/new") }),
      el("span", { class: "grow" }),
      el("button", { type: "button", class: "btn sm", id: "new-ok", text: L().newGot, onclick: done })]).classList.add("tour-new");
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
    document.title = lang === "es" ? "SysAdmin Desks · simulador gratuito de soporte IT" : "SysAdmin Desks · free IT support simulator";
    const howBtn = el("button", { type: "button", class: "land-link", text: T.how, onclick: () => {
      const target = document.getElementById("land-s1");
      if (target) target.scrollIntoView({ behavior: motion(), block: "start" });
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
            el("li", {}, ext("https://www.linkedin.com/in/igonzalez93", "LinkedIn")))),
          el("div", {}, el("p", { class: "lf-h", text: T.colHelp }), el("ul", {}, DOCS.map(([k, h]) => el("li", {}, el("a", { href: h, text: L()[k] }))),
            el("li", {}, ext(REPORT, L().report)),
            el("li", {}, el("button", { type: "button", class: "linkbtn", "data-cookie-settings": "", text: L().cookies }))))),
        el("div", { class: "lf-bottom" }, el("span", { text: "© 2026 Iñigo González · SysAdmin Desks by IGG" }), el("span", { text: T.legal })))));
  }

  /* ---------- start page: sign in or create an account */
  let resetToken = null;   // from #/reset?token=..., kept in memory only (the address bar drops it at once)
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
    function passwordField(withRules, label, name) {
      const input = el("input", { type: "password", name: name || "password", required: true, maxlength: "128",
        autocomplete: withRules ? "new-password" : "current-password" });
      const eye = el("button", { type: "button", class: "eye", "aria-label": L().show, text: "👁" });
      eye.addEventListener("click", () => {
        const hidden = input.type === "password";
        input.type = hidden ? "text" : "password";
        eye.setAttribute("aria-label", hidden ? L().hide : L().show);
      });
      const wrap = el("span", { class: "pw" }, input, eye);
      if (!withRules) return { input, node: field(label || L().fPassword, wrap) };
      const items = Object.keys(L().rules).map((k) => el("li", { "data-rule": k, text: L().rules[k] }));
      const list = el("ul", { class: "rules" }, items);
      input.addEventListener("input", () => {
        const v = input.value;
        const ok = { length: v.length >= 8, capital: /[A-ZÁÉÍÓÚÑ]/.test(v), number: /[0-9]/.test(v) };
        items.forEach((li) => li.classList.toggle("ok", ok[li.getAttribute("data-rule")]));
      });
      return { input, node: field(label || L().fPassword, wrap, list) };
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

    function info(text) { msg.textContent = text; msg.classList.add("info"); }
    function problem(text) { msg.textContent = text; msg.classList.remove("info"); }
    // "Forgot your password?": the same answer whether or not the account exists
    function forgotForm() {
      const email = el("input", { type: "email", name: "email", required: true, maxlength: "254", autocomplete: "email", placeholder: L().phEmail, id: "forgot-email" });
      const submit = el("button", { type: "submit", class: "btn wide", id: "forgot-send", text: L().forgotSend });
      return el("form", { class: "signin-form", novalidate: true, onsubmit: async (ev) => {
        ev.preventDefault();
        busy(submit, true);
        const r = await api("/api/auth/forgot", "POST", { email: email.value, lang });
        busy(submit, false);
        if (r.ok) info(L().forgotSent);
        else if (r.data.error === "reset_unavailable") info(L().forgotOff);
        else problem(L().errors[r.data.error] || L().errors.server);
      } },
        el("h2", { class: "signin-h", text: L().forgotTitle }), el("p", { class: "forgot-text", text: L().forgotText }),
        field(L().fEmail, email), submit,
        el("button", { type: "button", class: "link-btn", text: L().forgotBack, onclick: () => { tab = "login"; problem(""); render(); } }));
    }
    // the link from the email: a new password with the same rules as sign-up
    function resetForm() {
      if (!resetToken) {
        return el("div", { class: "signin-form" }, el("h2", { class: "signin-h", text: L().resetTitle }), el("p", { class: "forgot-text", text: L().resetNoToken }),
          el("button", { type: "button", class: "btn wide", text: L().resetAgain, onclick: () => { tab = "forgot"; problem(""); render(); } }));
      }
      const pw = passwordField(true, L().fNewPassword);
      const pw2 = passwordField(false, L().fConfirm, "confirm");
      pw2.input.setAttribute("autocomplete", "new-password");
      const submit = el("button", { type: "submit", class: "btn wide", id: "reset-save", text: L().resetBtn });
      return el("form", { class: "signin-form", novalidate: true, onsubmit: async (ev) => {
        ev.preventDefault();
        const v = pw.input.value;
        if (!(v.length >= 8 && /[A-ZÁÉÍÓÚÑ]/.test(v) && /[0-9]/.test(v))) { problem(L().errors.password); pw.input.focus(); return; }
        if (v !== pw2.input.value) { problem(L().resetMismatch); pw2.input.focus(); return; }
        busy(submit, true);
        const r = await api("/api/auth/reset", "POST", { token: resetToken, password: v });
        busy(submit, false);
        if (!r.ok) {
          problem(L().errors[r.data.error] || L().errors.server);
          if (r.data.error === "reset_invalid") { resetToken = null; render(); problem(L().errors.reset_invalid); }
          return;
        }
        resetToken = null;
        user = null; save("work", {});
        Object.keys(live).forEach((k) => delete live[k]); save("live", {}); forgetSandboxes();
        chrome();
        tab = "login"; render(); info(L().resetDone);
      } },
        el("h2", { class: "signin-h", text: L().resetTitle }), el("p", { class: "forgot-text", text: L().resetText }), pw.node, pw2.node, submit);
    }

    function render() {
      if (tab === "forgot" || tab === "reset") {
        body.replaceChildren(msg, tab === "forgot" ? forgotForm() : resetForm());
        return;
      }
      const tabs = el("div", { class: "tabs", role: "tablist" },
        ["login", "register"].map((k) => el("button", { type: "button", role: "tab", class: "tab" + (tab === k ? " on" : ""),
          "aria-selected": tab === k ? "true" : "false", text: k === "login" ? L().tabLogin : L().tabRegister,
          onclick: () => { tab = k; msg.textContent = ""; render(); } })));
      const email = el("input", { type: "email", name: "email", required: true, maxlength: "254", autocomplete: "email", placeholder: L().phEmail });
      let form;
      if (tab === "login") {
        const pw = passwordField(false);
        const submit = el("button", { type: "submit", class: "btn wide", text: L().btnLogin });
        form = el("form", { class: "signin-form", novalidate: true, onsubmit: async (ev) => {
          ev.preventDefault();
          busy(submit, true);
          const r = await api("/api/auth/login", "POST", { email: email.value, password: pw.input.value });
          busy(submit, false);
          await done(r);
        } },
          field(L().fEmail, email), pw.node,
          el("button", { type: "button", class: "link-btn", id: "forgot", text: L().forgot, onclick: () => { tab = "forgot"; problem(""); render(); } }),
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
            el("a", { href: "/privacy", target: "_blank", rel: "noopener noreferrer", text: L().consentLink }), L().consentB,
            el("a", { href: "/terms", target: "_blank", rel: "noopener noreferrer", text: L().consentTerms }), L().consentC)),
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
          GROWTH_KEYS.forEach((k) => { try { localStorage.removeItem("sd." + k); } catch (e) { /* ignore */ } });
          Object.keys(live).forEach((k) => delete live[k]); forgetSandboxes(); prefsCache = null; mboxCache = null; freeCache = null; applyMotion();
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
          persistAll();   // v0.9: the room and the labs stay for this account (tagged with it); the tickets' work goes with the workflow
          user = null; progress = {}; save("progress", progress); save("work", {});
          Object.keys(live).forEach((k) => delete live[k]); save("live", {}); forgetSandboxes();
          location.hash = "#/start"; route();
        } })),
      el("p", { class: "fine acc-help" }, L().accHelp + " ",
        el("a", { href: REPORT, target: "_blank", rel: "noopener noreferrer", text: L().report }), " · ",
        el("a", { href: "/help", text: L().help }), " · ", el("a", { href: "/terms", text: L().terms }), " · ", el("a", { href: "/privacy", text: L().privacy }),
        el("span", { class: "cc-link" }, " · ", el("button", { type: "button", class: "linkbtn", "data-cookie-settings": "", text: L().cookies }))),
      msg, zone), prefsPanel());
  }

  /* ---------- v0.9: My account → Preferences (prefs.js, sd.prefs): reminder, sounds, time zone, reduced motion, and the saved work */
  function prefsPanel() {
    const p = prefs();
    const saved = el("p", { class: "fine pr-saved", role: "status", "aria-live": "polite" });
    const done = (text) => { saved.textContent = text || L().prSaved; };
    const sw = (idf, checked, label, onchange, disabled) => {
      const box = el("input", { type: "checkbox", id: idf, checked: checked ? true : null, disabled: disabled ? true : null });
      box.addEventListener("change", () => onchange(box));
      return el("label", { class: "pr-check", for: idf }, box, el("span", { text: label }));
    };
    // reminder
    const time = el("input", { type: "time", id: "pr-time", value: p.reminder.time, disabled: p.reminder.on ? null : true, "aria-label": L().prReminderAt });
    time.addEventListener("change", () => { if (Pf.validTime(time.value)) { setPrefs(Pf.update(prefs(), { reminder: { time: time.value } })); done(); } });
    const notifyNote = el("p", { class: "fine", id: "pr-notify-note" });
    const reminder = el("fieldset", { class: "pr-group" }, el("legend", { text: L().prReminder }),
      sw("pr-reminder", p.reminder.on, L().prReminderOn, (b) => { setPrefs(Pf.update(prefs(), { reminder: { on: b.checked } })); done(); account(); focusPref("pr-reminder"); }),
      el("label", { class: "pr-inline", for: "pr-time" }, el("span", { text: L().prReminderAt + " " }), time),
      sw("pr-notify", p.reminder.notify, L().prNotify, async (b) => {
        if (!b.checked) { setPrefs(Pf.update(prefs(), { reminder: { notify: false } })); done(); return; }
        // the permission is asked only now, when the user turns it on
        if (!("Notification" in window)) { b.checked = false; notifyNote.textContent = L().prNotifyNo; return; }
        let perm = Notification.permission;
        try { if (perm === "default") perm = await Notification.requestPermission(); } catch (e) { perm = "denied"; }
        if (perm !== "granted") { b.checked = false; setPrefs(Pf.update(prefs(), { reminder: { notify: false } })); notifyNote.textContent = L().prNotifyDenied; return; }
        setPrefs(Pf.update(prefs(), { reminder: { notify: true } })); done();
      }, !p.reminder.on), notifyNote);
    // sounds
    const sounds = el("fieldset", { class: "pr-group" }, el("legend", { text: L().prSounds }),
      sw("pr-sounds", p.sounds, L().prSoundsOn, (b) => { setPrefs(Pf.update(prefs(), { sounds: b.checked })); done(); }),
      el("button", { type: "button", class: "btn ghost sm", id: "pr-sound-test", text: "♪ " + L().prTest, onclick: () => celebrate("resolved") }));
    // time zone
    const bz = Pf.browserZone();
    const tz = el("select", { id: "pr-zone", "aria-label": L().prZone }, el("option", { value: "", text: L().prZoneAuto(bz) }),
      Pf.zones().map((z) => el("option", { value: z, selected: p.tz === z ? true : null, text: z.replace(/_/g, " ") })));
    const now = el("p", { class: "fine", id: "pr-zone-now" });
    const showNow = () => { now.textContent = L().prZoneNow(clock(), Pf.offsetLabel(Date.now(), zone()) + " · " + zone()); };
    tz.addEventListener("change", () => { setPrefs(Pf.update(prefs(), { tz: tz.value })); showNow(); done(); });
    showNow();
    const zoneBox = el("fieldset", { class: "pr-group" }, el("legend", { text: L().prZone }), tz, now);
    // motion
    const motionBox = el("fieldset", { class: "pr-group" }, el("legend", { text: L().prMotion }),
      sw("pr-motion", p.motion, L().prMotionOn, (b) => { setPrefs(Pf.update(prefs(), { motion: b.checked })); done(); }),
      sysReduce() ? el("p", { class: "fine", text: L().prMotionSys }) : null);
    // the work kept in this browser (the reset path)
    const dataMsg = el("p", { class: "fine", role: "status" });
    const dataBox = el("fieldset", { class: "pr-group" }, el("legend", { text: L().prData }), el("p", { class: "fine", text: L().prDataText }),
      el("button", { type: "button", class: "btn ghost sm", id: "pr-clear", text: L().prDataBtn, onclick: () => {
        clearSaved(); Object.keys(live).forEach((k) => delete live[k]); forgetSandboxes(); dataMsg.textContent = L().prDataDone;
      } }), dataMsg);
    return el("section", { class: "panel account prefs", id: "prefs", "aria-labelledby": "prefs-h" },
      el("h2", { id: "prefs-h", text: L().prTitle }), el("p", { class: "sub", text: L().prSub }),
      reminder, sounds, zoneBox, motionBox, dataBox, saved);
  }
  function focusPref(idf) { const n = document.getElementById(idf); if (n) { n.focus({ preventScroll: true }); } }

  /* ---------- routing */
  function route(notice) {
    freshGoals = [];
    chrome();
    clearInterval(ticker);
    closeTour(false);
    fsHandler = null;
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    let h = location.hash;
    if (user && (h === "#/start" || h === "#/register")) { history.replaceState(null, "", location.pathname + location.search + "#/"); h = "#/"; }
    const m = h.match(/^#\/desk\/([a-z0-9-]+)$/);
    const km = h.match(/^#\/kb(?:\/([a-z0-9-]+))?$/);
    const mm = h.match(/^#\/mail(?:\/([a-z0-9-]+))?$/);
    const nm = h.match(/^#\/network(?:\/([A-Za-z0-9-]+))?$/);
    const lbm = h.match(/^#\/library(?:\/([a-z0-9-]+))?$/);
    const lam = h.match(/^#\/labs(?:\/([a-z0-9-]+))?$/);
    const sm = h.match(/^#\/shipping(?:\/([A-Za-z0-9-]+))?(?:\/([a-z0-9-]+))?$/);
    const rm = h.match(/^#\/reset(?:\?token=([A-Za-z0-9_-]{20,128}))?$/);
    const fm = h.match(/^#\/free\/(new|FREE-\d{4})$/);   // v0.9: free tickets
    freeUi.pendOpen = false;
    if (rm && rm[1]) { resetToken = rm[1]; history.replaceState(null, "", location.pathname + location.search + "#/reset"); }
    document.body.classList.toggle("landing-on", !user && (h === "" || h === "#/"));
    document.body.classList.toggle("shell-on", Boolean(user) && !rm);
    if (rm) start("reset");
    else if (m && user) desk(m[1]);
    else if (m) { afterLogin = h; start("login", notice || "need_login"); }
    else if (h === "#/start") start("login", notice);
    else if (h === "#/register") start("register", notice);
    else if (h === "#/account") account();
    else if (h === "#/progress" && user) progressPage();
    else if (h === "#/directory" && user) directory();
    else if (h === "#/inventory" && user) inventory();
    else if (nm && user) networkRoom(nm[1] || null);
    else if (sm && user) shippingPage(sm[1] || null, sm[2] || null);
    else if (km && user) kbPage(km[1] || null);
    else if (lbm && user) libraryPage(lbm[1] || null);
    else if (lam && user) labsPage(lam[1] || null);
    else if (h === "#/profile" && user) profilePage();
    else if (mm && user) mailPage(mm[1] || null);
    else if (fm && user) { if (fm[1] === "new") freeNew(); else freePage(fm[1]); }
    else if (user) queue();
    else landing();
    if (user) ticker = setInterval(tick, 1000);
    window.scrollTo(0, 0);
    tourResume();
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
