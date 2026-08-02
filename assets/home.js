// Sections shown on the home page. Add an entry here to add a new area of
// the site (e.g. Documents) — the grid below renders whatever is in this list.
const SECTIONS = [
  {
    title: "Clips",
    description: "Search and watch reviewed game film with the original mechanics and judgment comments overlaid.",
    href: "/clips/",
    status: "live",
  },
  {
    title: "Documents",
    description: "Mechanics manuals, points of emphasis, and other crew references.",
    href: null,
    status: "soon",
  },
];

const grid = document.getElementById("sectionsGrid");

grid.innerHTML = SECTIONS.map((s) => {
  const tag = s.status === "live" ? "a" : "div";
  const hrefAttr = s.status === "live" ? ` href="${s.href}"` : "";
  const pill = s.status === "live"
    ? `<span class="status-pill live">Open</span>`
    : `<span class="status-pill soon">Coming soon</span>`;
  const arrow = s.status === "live" ? `<span class="row-arrow" aria-hidden="true">&rarr;</span>` : "";
  return `
    <${tag} class="section-card${s.status === "soon" ? " is-soon" : ""}"${hrefAttr}>
      <div class="card-top">
        <h2>${s.title}</h2>
        ${pill}
      </div>
      <p>${s.description}</p>
      ${arrow}
    </${tag}>
  `;
}).join("");
