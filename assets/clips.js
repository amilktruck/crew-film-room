const playSvg = `<svg viewBox="0 0 24 24" fill="rgba(20,22,26,0.85)"><path d="M9.5 7.5v9l7-4.5z"/></svg>`;

const grid = document.getElementById("grid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("search");
const viewGridBtn = document.getElementById("viewGrid");
const viewListBtn = document.getElementById("viewList");
const sortNewestBtn = document.getElementById("sortNewest");
const sortOldestBtn = document.getElementById("sortOldest");

let games = [];
let sortOrder = "newest";

function cardHtml(g) {
  const thumb = g.thumbnail
    ? `<img src="${g.thumbnail}" alt="" loading="lazy" />`
    : `<div class="play">${playSvg}</div>`;
  const metaParts = [g.date, g.crew].filter(Boolean);
  const metaHtml = metaParts
    .map((p) => `<span>${p}</span>`)
    .join('<span class="dot">&middot;</span>');
  const tagsHtml = g.tags && g.tags.length
    ? `<div class="tag-row">${g.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>`
    : "";
  return `
    <a class="card" href="${g.filmUrl}" target="_blank" rel="noopener noreferrer">
      <div class="thumb">
        ${thumb}
        ${g.clipCount ? `<div class="thumb-badge">${g.clipCount} clips</div>` : ""}
      </div>
      <div class="card-body">
        <div class="matchup">${g.title}</div>
        <div class="card-meta">${metaHtml}</div>
        ${tagsHtml}
      </div>
    </a>
  `;
}

function render(list) {
  if (list.length === 0) {
    grid.classList.add("is-hidden");
    emptyState.style.display = "block";
    return;
  }
  grid.classList.remove("is-hidden");
  emptyState.style.display = "none";
  grid.innerHTML = list.map(cardHtml).join("");
}

function applyFilters() {
  const q = searchInput.value.toLowerCase();
  const list = games
    .filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        (g.crew || "").toLowerCase().includes(q) ||
        g.date.toLowerCase().includes(q)
    )
    .sort((a, b) =>
      sortOrder === "newest" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
    );
  render(list);
}

function setView(view) {
  grid.classList.toggle("is-list", view === "list");
  viewGridBtn.setAttribute("aria-pressed", String(view === "grid"));
  viewListBtn.setAttribute("aria-pressed", String(view === "list"));
}

function setSort(order) {
  sortOrder = order;
  sortNewestBtn.setAttribute("aria-pressed", String(order === "newest"));
  sortOldestBtn.setAttribute("aria-pressed", String(order === "oldest"));
  applyFilters();
}

searchInput.addEventListener("input", applyFilters);
viewGridBtn.addEventListener("click", () => setView("grid"));
viewListBtn.addEventListener("click", () => setView("list"));
sortNewestBtn.addEventListener("click", () => setSort("newest"));
sortOldestBtn.addEventListener("click", () => setSort("oldest"));

fetch("/data/games.json")
  .then((r) => r.json())
  .then((data) => {
    games = data;
    applyFilters();
  })
  .catch(() => {
    render([]);
  });
