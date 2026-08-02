# Crew Film Room

Static site for the crew's post-game film review. No backend, no database —
the film itself lives in Cloudflare R2 (bucket `crew-film`, served at
`film.crewfilmroom.com`); this repo is just the home page and the searchable
clip index that link out to it.

## Design

Uses the "Chalk Line" design system from `~/code/whitehat/DESIGN.md` — same
audience (NFHS football officials), same visual language: light paper
surface, cobalt accent, Archivo/Geist/Geist Mono type, hairline rules
instead of cards, zero border-radius, no shadows or gradients. Check that
file before making visual changes here so the two stay in sync.

## Structure

```
index.html          Home page — links out to each section (Clips, and future ones)
clips/index.html     Search / browse page for published game film
assets/site.css      Shared styles
assets/home.js        Renders the home page's section cards from a small array
assets/clips.js       Fetches data/games.json, renders cards, handles search + grid/list view
data/games.json        The real data — one entry per published game. Starts empty.
data/games.example.json  Reference copy of the schema — not loaded by the site.
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

## Adding a new section (e.g. Documents)

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
