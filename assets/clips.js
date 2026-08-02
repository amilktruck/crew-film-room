const playSvg = `<svg viewBox="0 0 24 24" fill="rgba(255,255,255,0.92)"><circle cx="12" cy="12" r="11" fill="rgba(0,0,0,0.35)"/><path d="M9.5 7.5v9l7-4.5z"/></svg>`;

const grid = document.getElementById("grid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("search");
const levelChips = document.getElementById("levelChips");

let games = [];

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
    <a class="card" href="${g.filmUrl}">
      <div class="thumb">
        ${thumb}
        ${g.clipCount ? `<div class="clipcount">${g.clipCount} clips</div>` : ""}
      </div>
      <div class="card-body">
        <div class="card-top">
          <div class="matchup">${g.title}</div>
          <div class="level-pill">${g.level}</div>
        </div>
        <div class="card-meta">${metaHtml}</div>
        ${tagsHtml}
      </div>
    </a>
  `;
}

function render(list) {
  if (list.length === 0) {
    grid.style.display = "none";
    emptyState.style.display = "block";
    return;
  }
  grid.style.display = "grid";
  emptyState.style.display = "none";
  grid.innerHTML = list.map(cardHtml).join("");
}

function applyFilters() {
  const q = searchInput.value.toLowerCase();
  const level = levelChips.querySelector(".chip.active").dataset.level;
  render(
    games.filter(
      (g) =>
        (level === "all" || g.level === level) &&
        (g.title.toLowerCase().includes(q) ||
          (g.crew || "").toLowerCase().includes(q) ||
          g.date.toLowerCase().includes(q))
    )
  );
}

searchInput.addEventListener("input", applyFilters);
levelChips.addEventListener("click", (e) => {
  if (!e.target.classList.contains("chip")) return;
  [...levelChips.querySelectorAll(".chip")].forEach((c) => c.classList.remove("active"));
  e.target.classList.add("active");
  applyFilters();
});

fetch("/data/games.json")
  .then((r) => r.json())
  .then((data) => {
    games = data;
    render(games);
  })
  .catch(() => {
    render([]);
  });
