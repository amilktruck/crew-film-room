# Crew Film Room

Static site for the crew's post-game film review. No backend, no database —
the film itself lives in Cloudflare R2 (bucket `crew-film`, served at
`film.crewfilmroom.com`), and reference documents live in a second bucket
(`crew-documents`, served at `docs.crewfilmroom.com`); this repo is just the
home page and the searchable indexes that link out to both.

## Design

Uses the "Chalk Line" design system from `~/code/whitehat/DESIGN.md` — same
audience (high school football officials), same visual language: light paper
surface, cobalt accent, Archivo/Geist/Geist Mono type, hairline rules
instead of cards, zero border-radius, no shadows or gradients. Check that
file before making visual changes here so the two stay in sync.

## Structure

```
index.html          Home page — links out to each section (Clips, Documents)
clips/index.html     Search / browse page for published game film
documents/index.html   Search / browse page for reference documents
assets/site.css      Shared styles
assets/home.js        Renders the home page's section cards from a small array
assets/clips.js       Fetches data/games.json, renders cards, handles search + grid/list view
assets/documents.js    Same pattern as clips.js, fetches data/documents.json
data/games.json        Published games. Starts empty.
data/games.example.json  Reference copy of the games schema — not loaded by the site.
data/documents.json      Published documents. Starts empty.
data/documents.example.json  Reference copy of the documents schema — not loaded by the site.
```

## Adding a new game

1. Upload the Hudl export folder as-is to the `crew-film` R2 bucket, under a
   slug like `2026-week1-varsity-crew3/` (keep the HTML file and its sibling
   `z/` folder together — the export needs that relative structure to work).
2. Add one entry to `data/games.json`, following the shape in
   `data/games.example.json`:
   - `slug` — matches the folder name you uploaded to R2
   - `title` — the matchup or reel title, e.g. `"Eastside vs. Grant"`
   - `date` — `YYYY-MM-DD`
   - `level` — currently always `"High School"`. There's no level filter in
     the UI right now (everything is High School), so this field isn't
     rendered or filterable — it's kept in the data for when other levels
     get added back
   - `crew` — e.g. `"Crew 3"`; optional, omit the field entirely to hide it
     (used for multi-game compilations that aren't tied to one crew)
   - `tags` — short labels for what the film focuses on; optional, omit or
     use `[]` to hide the tag row
   - `clipCount` — how many clips are in the export (shown on the card)
   - `thumbnail` — optional; a thumbnail URL from the uploaded export's `z/`
     folder. Omit it and a placeholder renders instead.
   - `filmUrl` — the full R2 URL to that game's `index.html`. Cards link
     here with `target="_blank"`, so clicking a clip opens it in a new tab.
3. Commit and push to `main`. Cloudflare Pages redeploys automatically (see
   below) and the game appears on `/clips/`.

## Adding a new document

1. Upload the file as-is to the `crew-documents` R2 bucket (flat — no
   folder structure needed, unlike the Hudl exports).
2. Add one entry to `data/documents.json`, following the shape in
   `data/documents.example.json`:
   - `slug` — a short kebab-case id, doesn't need to match the R2 key
   - `title` — display name, e.g. `"Deep 3 Base Mechanics"`
   - `date` — `YYYY-MM-DD`
   - `fileType` — e.g. `"PPTX"`, shown as a badge on the card
   - `fileSize` — e.g. `"2.0 MB"`; optional, shown next to the date
   - `tags` — optional, same as the games schema
   - `thumbnail` — optional; a preview image URL. Omit it and a generic
     document icon renders instead. To generate one from a PDF's first page:
     `qlmanage -t -s 800 -o <outdir> <file>.pdf` (macOS Quick Look, no extra
     tools needed), then resize/convert with
     `sips -s format jpeg -Z 640 in.png --out out.jpg` and upload it to the
     bucket alongside the document.
   - `docUrl` — the full `docs.crewfilmroom.com` URL. Cards link here with
     `target="_blank"`, so clicking a document opens it in a new tab. PDFs
     preview inline in most browsers; PPTX/DOCX will download instead since
     browsers don't render Office formats natively — converting to PDF
     first (as done for the two entries here) is recommended.
3. Commit and push to `main`.

## Adding a new section (e.g. beyond Clips/Documents)

Add an entry to the `SECTIONS` array in `assets/home.js`. Set `status` to
`"live"` with an `href` once the section has a real page, or `"soon"` with
`href: null` as a placeholder — the home page grid renders whatever is there.

## Local preview

This is plain static HTML/CSS/JS with no build step, but the pages `fetch()`
JSON, which requires a real server (not a `file://` URL):

```bash
npx serve .
```

## Deployment

Hosted on Cloudflare Pages (project `crew-film-room`), connected directly to
this repo's `main` branch — every merge to `main` triggers an automatic
rebuild and deploy. Framework preset: **None**. Build command: **(none)**.
Build output directory: **/** (repo root).

## Why `crew-documents` doesn't need a Worker

Documents are flat, individually-uploaded files with no relative-path
references between them, and cards link to them with a normal `target="_blank"`
navigation rather than embedding them cross-origin on another page — so
neither the double-slash bug nor the CORS issue that affect `crew-film`
apply here. `docs.crewfilmroom.com` uses R2's plain public custom domain
directly, no Worker in front.

## Why there's a `worker/` folder

`film.crewfilmroom.com` doesn't serve the `crew-film` R2 bucket directly.
Hudl's exports embed their video/thumbnail paths as `..//z/<file>` — a
double slash baked into their exporter, not a mistake in any upload. Normal
web servers collapse `//` into `/`; R2 treats the URL path as an exact
object key and does not, so every asset load 404s under R2's plain public
bucket serving. Fixing it with a Transform Rule needs `regex_replace`, which
is gated to Cloudflare's Business plan — so instead, `worker/` is a small
Worker that fronts the bucket, normalizes the path, and streams the object
back (including range requests, for video scrubbing). It costs nothing on
Cloudflare's free Workers tier.

To deploy or update it:

```bash
cd worker
npx wrangler login   # one-time, opens a browser to authorize
npx wrangler deploy
```

Then, one-time only: in the Cloudflare dashboard, remove the R2 bucket's own
custom domain binding for `film.crewfilmroom.com` (Settings → Custom
Domains), and instead add that same hostname as a **Custom Domain** on the
`crew-film-proxy` Worker (Worker → Settings → Domains & Routes). After that,
`wrangler deploy` is all that's needed for future code changes — no need to
touch the domain binding again.
