const docSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="rgba(20,22,26,0.7)" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></svg>`;

const grid = document.getElementById("grid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("search");
const viewGridBtn = document.getElementById("viewGrid");
const viewListBtn = document.getElementById("viewList");

let docs = [];

function cardHtml(d) {
  const thumb = d.thumbnail
    ? `<img src="${d.thumbnail}" alt="" loading="lazy" />`
    : `<div class="play">${docSvg}</div>`;
  const metaParts = [d.date, d.fileSize].filter(Boolean);
  const metaHtml = metaParts
    .map((p) => `<span>${p}</span>`)
    .join('<span class="dot">&middot;</span>');
  const tagsHtml = d.tags && d.tags.length
    ? `<div class="tag-row">${d.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>`
    : "";
  return `
    <a class="card" href="${d.docUrl}" target="_blank" rel="noopener noreferrer">
      <div class="thumb">
        ${thumb}
        ${d.fileType ? `<div class="thumb-badge">${d.fileType}</div>` : ""}
      </div>
      <div class="card-body">
        <div class="matchup">${d.title}</div>
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
  render(
    docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.date.toLowerCase().includes(q)
    )
  );
}

function setView(view) {
  grid.classList.toggle("is-list", view === "list");
  viewGridBtn.setAttribute("aria-pressed", String(view === "grid"));
  viewListBtn.setAttribute("aria-pressed", String(view === "list"));
}

searchInput.addEventListener("input", applyFilters);
viewGridBtn.addEventListener("click", () => setView("grid"));
viewListBtn.addEventListener("click", () => setView("list"));

fetch("/data/documents.json")
  .then((r) => r.json())
  .then((data) => {
    docs = data;
    render(docs);
  })
  .catch(() => {
    render([]);
  });
