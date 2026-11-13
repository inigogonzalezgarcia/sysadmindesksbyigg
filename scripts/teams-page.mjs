// /equipos: SysAdmin Desks for IT teams (the service for companies). Built by build-ticket-pages.mjs with the same shell as /tickets/.
// Only what exists today is promised: the public catalogue, desks written for a team (fictional data), a path by role, the
// downloadable profile summary and a review session. No prices, no customers, no team dashboard (it does not exist).
export const CONTACT_TEAMS = "https://inigogonzalezgarcia.github.io/about.html?tema=sysadmindesks-equipos#contacto";
const LINKEDIN = "https://www.linkedin.com/in/igonzalez93";
const ext = (href, text) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;

export const TEAMS_META = {
  path: "/equipos",
  title: "SysAdmin Desks para equipos de IT · tickets a medida y onboarding",
  titleEn: "SysAdmin Desks for IT teams · custom tickets and onboarding",
  desc: "Para mesas de soporte y equipos de sistemas: tickets a medida de vuestro entorno con datos ficticios, onboarding por puesto y revisión de notas de trabajo.",
};

export function teamsArticle(lang, n) {
  if (lang === "es") return `<article class="es" lang="es">
<p class="tk-crumbs"><a href="/">SysAdmin Desks</a> › Para equipos</p>
<h1>SysAdmin Desks para equipos de IT</h1>
<p class="lead-p">Que tu equipo practique con tickets que se parecen a los vuestros antes de que lleguen de verdad: con SLA, una consola que responde como un equipo real y una nota de trabajo que se corrige.</p>
<p class="tk-cta"><a class="btn tk-btn" href="${CONTACT_TEAMS}" target="_blank" rel="noopener noreferrer">Cuéntame tu caso</a></p>

<h2 id="para-quien">Para quién es</h2>
<ul>
  <li><strong>Mesas de soporte y service desks</strong> que incorporan técnicos de N1 y N2 y quieren que lleguen al primer turno con práctica.</li>
  <li><strong>Proveedores de servicios gestionados</strong> que atienden a varios clientes y necesitan que el equipo conozca sus procedimientos.</li>
  <li><strong>Equipos de sistemas</strong> que quieren que sus técnicos suban de nivel: servidores, red, cloud, y casos de decisión para quien empieza a gestionar.</li>
  <li><strong>Centros de formación</strong> que buscan prácticas de soporte realistas para su alumnado.</li>
</ul>

<h2 id="que-incluye">Qué incluye</h2>
<ol>
  <li><strong>Tickets a medida de vuestro entorno.</strong> Me pasáis tickets reales anonimizados (sin nombres, datos de clientes ni direcciones internas) y los convierto en escenarios del simulador: el síntoma tal como lo cuenta el usuario, las herramientas que usáis, la trampa que suele pillar al técnico y la nota que esperáis. Se escriben en la empresa ficticia del simulador, Contoso, así que no revelan nada de la vuestra.</li>
  <li><strong>Un itinerario de incorporación por puesto.</strong> Del catálogo de ${n} tickets, de becario/a a CIO, elijo con vosotros los que debe hacer cada persona según su puesto y en qué orden, junto con los tickets a medida.</li>
  <li><strong>Seguimiento del progreso.</strong> Cada técnico tiene su perfil con su progreso por área y puede descargar su resumen para compartirlo con su responsable.</li>
  <li><strong>Una sesión de revisión con el equipo.</strong> Repasamos juntos las notas de trabajo y las trampas en las que se cae más: dónde se tapa el síntoma en lugar de arreglar la causa y cómo se comprueba que está resuelto.</li>
</ol>

<h2 id="como-funciona">Cómo funciona</h2>
<ol>
  <li><strong>Me cuentas tu caso</strong> en el formulario: el equipo, cuántas personas son y qué queréis practicar.</li>
  <li><strong>Una llamada de 30 minutos</strong> para ver vuestros tickets más frecuentes y lo que os cuesta más.</li>
  <li><strong>Un piloto</strong> con unos pocos tickets a medida y el itinerario para un grupo pequeño.</li>
  <li><strong>Decidís</strong> con los resultados del piloto si seguimos y con qué alcance.</li>
</ol>

<h2 id="precio">Precio</h2>
<p>A medida, según el número de tickets que haya que escribir y de personas. El alcance y el precio del piloto se acuerdan antes de empezar. El simulador sigue siendo gratis para todo el mundo.</p>

<h2 id="datos">Vuestros datos</h2>
<ul>
  <li>No necesito acceso a vuestros sistemas, a vuestro directorio ni a datos personales.</li>
  <li>Los tickets a medida se escriben con datos ficticios. Por ahora los tickets del simulador son públicos, así que nunca llevan nombres, datos ni configuraciones reales de vuestra empresa.</li>
  <li>Cada técnico usa su propia cuenta gratuita del simulador.</li>
</ul>

<h2 id="contacto">Hablamos</h2>
<p>Escríbeme desde el ${ext(CONTACT_TEAMS, "formulario de contacto")} (el mensaje ya viene preparado) o por ${ext(LINKEDIN, "LinkedIn")}. Si quieres ver antes cómo es un ticket, <a href="/tickets/">echa un vistazo a la lista</a> o <a href="/?lang=es#/register">pruébalo gratis</a>.</p>
</article>`;
  return `<article class="en" lang="en" id="en">
<p class="tk-crumbs"><a href="/">SysAdmin Desks</a> › For teams</p>
<h1>SysAdmin Desks for IT teams</h1>
<p class="lead-p">Let your team practise on tickets that look like yours before the real ones arrive: with an SLA, a console that answers like a real machine and a work note that gets scored.</p>
<p class="tk-cta"><a class="btn tk-btn" href="${CONTACT_TEAMS}" target="_blank" rel="noopener noreferrer">Tell me about your team</a></p>

<h2 id="para-quien-en">Who it is for</h2>
<ul>
  <li><strong>Help desks and service desks</strong> bringing in Tier 1 and Tier 2 technicians who should reach their first shift with practice.</li>
  <li><strong>Managed service providers</strong> looking after several clients, whose team needs to know each client's procedures.</li>
  <li><strong>Systems teams</strong> who want their technicians to move up: servers, network, cloud, and decision cases for those starting to manage.</li>
  <li><strong>Training centres</strong> looking for realistic support practice for their students.</li>
</ul>

<h2 id="que-incluye-en">What is included</h2>
<ol>
  <li><strong>Tickets written for your environment.</strong> You send me real tickets with the personal details removed (no names, client data or internal addresses) and I turn them into simulator desks: the symptom as the user reports it, the tools you use, the trap that usually catches the technician and the note you expect. They are written for the simulator's fictional company, Contoso, so they reveal nothing about yours.</li>
  <li><strong>An onboarding path by role.</strong> From the catalogue of ${n} tickets, from intern to CIO, we pick together the ones each person should do for their role and in what order, alongside the custom tickets.</li>
  <li><strong>Progress you can follow.</strong> Each technician has a profile with their progress by area and can download their summary to share with their manager.</li>
  <li><strong>A review session with the team.</strong> We go through the work notes and the traps people fall into most: where the symptom gets hidden instead of the cause fixed, and how to prove it is solved.</li>
</ol>

<h2 id="como-funciona-en">How it works</h2>
<ol>
  <li><strong>Tell me about your team</strong> in the form: the team, how many people and what you want to practise.</li>
  <li><strong>A 30-minute call</strong> to look at your most frequent tickets and what your team finds hardest.</li>
  <li><strong>A pilot</strong> with a few custom tickets and the path for a small group.</li>
  <li><strong>You decide</strong>, with the pilot's results, whether to carry on and with what scope.</li>
</ol>

<h2 id="precio-en">Price</h2>
<p>Tailored to the number of tickets to write and of people. The scope and price of the pilot are agreed before starting. The simulator stays free for everyone.</p>

<h2 id="datos-en">Your data</h2>
<ul>
  <li>I need no access to your systems, your directory or personal data.</li>
  <li>Custom tickets are written with fictional data. The simulator's tickets are public for now, so they never carry real names, data or configuration from your company.</li>
  <li>Each technician uses their own free simulator account.</li>
</ul>

<h2 id="contacto-en">Let's talk</h2>
<p>Write to me through the ${ext(CONTACT_TEAMS, "contact form")} (the message comes ready to fill in) or on ${ext(LINKEDIN, "LinkedIn")}. If you want to see what a ticket is like first, <a href="/tickets/">have a look at the list</a> or <a href="/?lang=en#/register">try it free</a>.</p>
</article>`;
}
