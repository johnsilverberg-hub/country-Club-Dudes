# Country Club Dudes website

The site for countryclubdudes.com: club guides, live listings for each club, and the Club Match lead form.

## How it works

- `src/clubs.json` is the list of clubs. Each club gets its own page at `/clubs/<slug>/`.
- `src/styles.css` holds the look of the site.
- `node build.js` builds every page into `dist/`. There is nothing to install.
- Netlify runs the build and publishes `dist/` on every push (see `netlify.toml`).

## Adding a club

Add an entry to `src/clubs.json`:

```json
{"slug": "club-name", "name": "Club Name", "town": "Boca Raton", "blurb": "One line about the club.", "idx": ""}
```

`idx` holds the IDX Broker widget code for that club's saved search. Leave it empty until the IDX feed is approved, and the page shows a "send me the listings" form instead.

## Leads

The Club Match form uses Netlify Forms. Each submission records which club page it came from.
