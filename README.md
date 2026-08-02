# Crew Film Room

Static site for the crew's post-game film review. No backend, no database —
the film itself lives in Cloudflare R2 (bucket `crew-film`, served at
`film.crewfilmroom.com`); this repo is just the home page and the searchable
clip index that link out to it.

## Structure

```
index.html          Home page — links out to each section (Clips, and future ones)
clips/index.html     Search / browse page for published game film
assets/site.css      Shared styles
assets/home.js        Renders the home page's section cards from a small array
assets/clips.js       Fetches data/games.json, renders cards, handles search + level filter
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
   - `title` — the matchup, e.g. `"Eastside vs. Grant"`
   - `date` — `YYYY-MM-DD`
   - `level` — `"Varsity"`, `"JV"`, or `"Playoff"` (drives the filter chips)
   - `crew` — e.g. `"Crew 3"`
   - `tags` — short labels for what the film focuses on
   - `clipCount` — how many clips are in the export (shown on the card)
   - `thumbnail` — optional; a thumbnail URL from the uploaded export's `z/`
     folder. Omit it and a placeholder renders instead.
   - `filmUrl` — the full R2 URL to that game's `index.html`
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
