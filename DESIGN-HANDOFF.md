# Country Club Dudes: design handoff

**From:** Dezirae (design)
**For:** John, Shawn and John's Claude
**Branch:** `design-refresh` (delivered as a patch file, see "Applying the design" below)

Thank you for the chance to help shape the site. This package gives the site a finished design
direction: the CCD brand system, new layouts for every page type, a Search menu, a hero video and
search bar, and a live Instagram section. Everything was built on top of John's existing site, so his
pages, data files and Netlify lead form keep working exactly as before.

There's a clickable preview of the full design if you'd like to see it before applying anything.

---

## How we'll work together

To keep things simple and moving quickly, here is how the work is shared.

**Dezirae (design)**
- Design direction, brand use, UX and page layouts (included in this package)
- Small design adjustments after you've reviewed it: spacing, colors, section order, new layouts
- Design for new page types as the site grows

**John and John's Claude (build and content)**
- Applying this package and publishing the site (Netlify, domain)
- Site content: club facts, photos, bios, client quotes, and communities without a club
- Connecting the services the design is ready for: IDX Broker (listings and search), Behold (Instagram)
- Lead routing (Netlify form notifications, Follow Up Boss)

Every place that needs content or a connection already has a clearly marked slot, with instructions
below, so nothing in the design needs to change to fill it in. Until a slot is filled, the site shows a
friendly fallback (usually a "coming soon" message with a Club Match button), so the site is never
broken while content is added.

For design changes, send Dezirae a note or screenshot of what you'd like adjusted and she'll send an
updated package.

---

## Applying the design

**For John's Claude.** The package includes `ccd-design-refresh.patch` (10 commits, includes images and video).

```bash
git checkout main && git pull
git checkout -b design-refresh
git am --3way /path/to/ccd-design-refresh.patch
node build.js        # should print "Built 40 club pages ..."
git push -u origin design-refresh
```

Then open a pull request so John can look over the Netlify deploy preview before merging.
If `git am` has trouble, the zip in the package holds the same files at the same paths and can be
copied over the repo instead.

**What the patch touches:** `build.js` (templates and site script), `src/styles.css`, two new data files
(`src/search.json`, `src/communities.json`), new images in `src/images/`, and this document.
`src/clubs.json`, `src/developments.json`, `netlify.toml` and `HANDOFF.md` are not changed.

---

## What changed

**Everywhere**
- CCD brand system: Lora headings, Poppins body, Archivo labels; deep green `#0F301E`, club green
  `#1D4932`, gold `#BC9C22`, cream `#FDFBF5`; pill buttons
- Sticky header with the full CCD logo, a three-column **Search** menu, and a "Get my Club Match" button;
  collapses to a Menu button on phones
- New footer with logo, contact numbers and links

**Home page**
- Full-width hero: club-tour video loop behind a green overlay, headline, and a **search bar**
- "What brings you here?": four paths (buying in a club, outside a club, comparing clubs, selling)
- The Front Nine: nine questions to ask before buying in any club
- Clubs by town, the Club Match form, "Inside the gates" reels, and Meet the Dudes with headshots

**Club pages (all 40 from one template)**
- Hero with photo slot, lifestyle tags, membership at a glance, reel link, The Scorecard (amenities),
  homes for sale (IDX), the Club Match form, and "More clubs in [town]"

**New pages**
- `/search/`: Search all homes, with Club communities and Communities without a club side by side
- `/search/no-club/`: Communities without a club
- `/search/55-plus/`, `/gated/`, `/waterfront/`, `/racquets/`: lifestyle pages with an
  All / With a club / Without a club toggle
- `/search/non-equity/`, `/search/optional-membership/`: membership pages (clubs only)
- `/communities/<slug>/`: a page for each community without a club (built automatically)

---

## Brand rules

- **Logo:** always use the full stacked logo (`src/images/ccd-logo-stacked-light.png` on green,
  `ccd-logo-stacked-dark.png` on light backgrounds). The golf-ball key icon on its own is only for spots
  where the full logo can't fit (the browser tab icon) or as a design accent.
- **Colors and fonts:** use the CSS variables at the top of `src/styles.css` rather than new hex values.
- **Photos:** real CCD photos and footage only, no stock. Don't use AI to add or change scenery in
  photos or video of real clubs; upscaling, stabilizing and color grading are fine.

---

## Content slots

All optional. Add them whenever they're ready; the site fills them in on the next build.

### Photos and media (`src/images/`)

| Slot | File | Notes |
|---|---|---|
| Club page hero photo | any file name, set as `"photo"` on the club in `clubs.json` | Landscape, at least 1600px wide |
| Hero video | `hero/hero.mp4` (+ optional `hero/hero.webm`) | Already included. To replace: muted, 15 to 20 seconds, about 3 to 5 MB |
| Hero still | `hero/hero-poster.jpg` | Shown while the video loads, on phones, and for reduced motion |
| Headshots | `shawn.jpg`, `john.jpg` | Already included |
| Reel covers (only if Behold isn't used) | `reels/<club-slug>.jpg` | Vertical, 9:16 |

### Club fields (`src/clubs.json`)

| Field | Example | Where it shows |
|---|---|---|
| `photo` | `"boca-west.jpg"` | Club page hero |
| `tags` | `["55-plus", "gated", "racquets"]` | Search pages and gold tags on the club page. Tags: `55-plus`, `gated`, `waterfront`, `racquets`, `non-equity`, `optional-membership` |
| `membership` | `"Mandatory with the home"` | Membership at a glance |
| `equity` | `"Equity"` | Membership at a glance |
| `verified` | `"November 2026"` | Membership at a glance |
| `scorecard` | `{"Golf": "Two 18-hole courses", "Dining": "..."}` | The Scorecard. Keys: `Golf`, `Tennis, pickleball & padel`, `Fitness & spa`, `Pools`, `Dining`, `Kids & family`, `Social & events`, `Security & gates` |
| `featuredReel` | `true` | Puts the club's reel in "Inside the gates" (only needed if Behold isn't set up) |
| `idx`, `reel`, `status` | (existing) | Unchanged |

Empty fields show "Ask the Dudes", which works as a soft prompt to get in touch.

### Communities without a club (`src/communities.json`)

Starts empty. Each entry uses the same fields as a club:

```json
{ "name": "Example Community", "slug": "example-community", "town": "Delray Beach",
  "blurb": "One or two sentences.", "tags": ["55-plus", "gated"], "photo": "", "idx": "" }
```

Each one gets its own page, appears on Communities without a club and the matching lifestyle pages,
and shows up in the hero search suggestions.

### Home page copy

Bios ("Two sentences on Shawn's background...") and the client quote are in `homePage()` in
`build.js`, marked with square brackets.

---

## Setup guides for John's Claude

### 1. Hero search bar → IDX Broker

The bar has tabs (All homes / With a club / Without a club), Where, Max price, Beds and Search. All
wiring is in `src/search.json` → `heroSearch`; no template changes needed. IDX Broker results pages
accept plain GET URLs, so the bar builds a results URL and sends the visitor there.

1. **Results URL.** Run any search on the IDX hosted search page and copy the results URL up to the `?`
   (for example `https://<subdomain>.idxbroker.com/idx/results/listings`). Put it in `heroSearch.action`.
2. **Field names.** Run a search with a max price, minimum beds and a city, then read the results URL.
   Fill in `heroSearch.params`: `maxPrice` (pre-filled `hp`, please confirm), `minBeds` (pre-filled `bd`,
   please confirm), and `location` (the field for what's typed in Where). If no single field accepts city,
   ZIP and subdivision, use the city field, or extend `submit()` in `build.js` to send a 5-digit entry as a ZIP.
3. **Tabs.** Create two IDX saved links (club community subdivisions, and communities without a club)
   and put their URLs in `heroSearch.tabs.club` and `heroSearch.tabs.noClub`.
4. **Optional fixed filters** (property type, MLS, sort) go in `heroSearch.fixed` as `{"field": "value"}`.
5. **Test** each tab with and without price and beds.

Before this is set up, Search goes to the site's own pages, so it never dead-ends. Typing two or more
letters suggests clubs, communities and towns automatically from the data files.

### 2. Listings on Search pages → IDX Broker saved links

Each Search page has an `"idx"` slot in `src/search.json`. Paste an IDX Broker widget embed for a
saved link there and it appears under "Homes for sale".

| Page | Suggested saved link |
|---|---|
| Search all homes | Standard IDX search or map search widget |
| 55+ | BeachesMLS **HOPA** field (Yes-Verified / Yes-Unverified) |
| Gated | BeachesMLS **Gated Community** (Y/N) field |
| Waterfront & boating | Waterfront / ocean-access fields, whichever BeachesMLS passes to IDX |
| Racquets | List of the tagged communities' subdivisions (amenity fields are inconsistent) |
| Non-equity | List of the tagged clubs' subdivisions (no reliable MLS field) |
| Optional membership | List of the tagged clubs' subdivisions (no reliable MLS field) |
| Communities without a club | List of those communities' subdivisions |

Notes: check field names under IDX control panel → MLS Settings → Advanced Fields, since only fields
BeachesMLS provides to IDX can be used. Advanced fields generally work within one property type, so a
page may need separate saved links for single-family homes and condos. If a community can't be matched
by subdivision name, IDX Broker Platinum's polygon tool is the alternative.

### 3. "Inside the gates" → Behold (live Instagram reels)

1. Sign up at behold.so and connect the @countryclubdudes Instagram account (Behold will say if the
   account needs to be switched to a Business or Creator account first).
2. Create a **JSON feed** and copy its feed ID.
3. Paste it into `const BEHOLD_FEED_ID = '';` near the top of the design layer in `build.js`.

The section then shows the four latest reels with thumbnails and captions, styled to match the site.
The free plan covers 1,200 views a month with daily updates; the $10/month plan covers 15,000 views
with hourly updates and no Behold logo. If the feed ever fails to load, the section falls back to the
linked reel tiles from `clubs.json`.

---

## Before publishing: quick checklist

- [ ] `node build.js` runs without errors
- [ ] Home page video plays on desktop; phones show the still image
- [ ] Search menu opens on desktop (hover and click) and on mobile
- [ ] Club Match form submits and arrives (Netlify form name `club-match`, fields unchanged)
- [ ] One club page, one Search page and the Thanks page look right on a phone
- [ ] Any filled-in IDX or Behold slot loads

Thank you, John and Shawn. Looking forward to seeing it live.
