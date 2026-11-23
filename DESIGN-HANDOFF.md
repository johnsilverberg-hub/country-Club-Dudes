# Country Club Dudes: design handoff

**From:** Dezirae (design)
**For:** John, Shawn and John's Claude
**Pull request:** `design-refresh` branch

This pull request gives the site the CCD brand system, new layouts for every page type, a Search
menu, a hero video and search bar, listing cards and a live Instagram section. It builds on the
existing site, so the current pages, data files and Netlify lead form keep working as before.

---

## Scope

**Dezirae: design**
- Design direction, brand use, UX and page layouts
- Design changes and new page layouts as the site grows

**John's Claude: build and content**
- Reviewing, merging and publishing the site (Netlify, domain)
- Site content: club facts, photos, bios, client quotes, communities without a club
- Connecting services: IDX Broker (search and listings), Behold (Instagram)
- Lead routing (Netlify form notifications, Follow Up Boss)

Every spot that needs content or a connection has a marked slot and instructions below. Until a
slot is filled, the site shows a fallback (usually a "coming soon" message with a Club Match button).

For design changes, send Dezirae a note or a screenshot.

---

## Reviewing and merging

1. Open the Netlify deploy preview on this pull request and check it on desktop and phone.
2. Run `node build.js` locally if needed (it should print "Built 40 club pages ...").
3. Merge when John approves. Netlify publishes `main` automatically.

**What changed in the repo:** `build.js` (templates and site script), `src/styles.css`, two new
data files (`src/search.json`, `src/communities.json`), an empty `src/listings/` folder, new images
in `src/images/`, and this document. `src/clubs.json`, `src/developments.json`, `netlify.toml`,
`README.md` and `HANDOFF.md` are not changed.

---

## What changed

**Everywhere**
- CCD brand system: Lora headings, Poppins body, Archivo labels; deep green `#0F301E`, club green
  `#1D4932`, gold `#BC9C22`, cream `#FDFBF5`; pill buttons
- Sticky header with the full CCD logo, a **Search** menu, and a "Get my Club Match" button;
  collapses to a Menu button on phones
- New footer with logo, contact numbers and links

**Home page**
- Full-width hero: club-tour video loop behind a green overlay, headline, and a **search bar**
- "What brings you here?": four paths (buying in a club, outside a club, comparing clubs, selling)
- The Front Nine: nine questions to ask before buying in any club
- Clubs by town, the Club Match form, "Inside the gates" reels, and Meet the Dudes with headshots

**Club pages (all 40 from one template)**
- Hero with photo slot, lifestyle tags, membership at a glance, reel link, The Scorecard (amenities),
  homes for sale (designed listing cards fed by IDX), the Club Match form, and "More clubs in [town]"

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
| `idx`, `reel`, `status` | (existing) | Unchanged. `idx` is now the fallback when there's no `src/listings/<slug>.json` |

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

### Search menu (`src/search.json` → `menu`)

The `menu` list sets what appears under Search, in order. It currently shows Search all homes,
Communities without a club and 55+. Available keys: `all`, `clubs`, `no-club`, `new-developments`,
and any category slug in `search.json` (`55-plus`, `gated`, `waterfront`, `racquets`, `non-equity`,
`optional-membership`).

- **Only categories in the menu are live.** Their pages, the gold tags on club and community pages,
  and their sitemap entries are built. The others stay defined in `search.json` and come back as soon
  as their slug is added to `menu`. Tags already in the data files can stay as they are.
- **6 or fewer items:** a single list. **7 or more:** the three-column layout (Find a home /
  By lifestyle / By membership).
- The buttons along the top of each Search page follow the same list.

---

### Club photos from Google Drive

Club pages show a photo slot in the hero until a photo is added. The source photos are in Google Drive:
**CountryClubDudes Content Bank** (shared by Premier Listings),
https://drive.google.com/drive/folders/1p_5NedXzl69oAa6vPO4yL2lwTb_YVQwh, organized as
`Town / Club / Photo-####.jpg`. The folders also hold videos (`.mp4`) and small Mac system files whose
names start with `._`; skip both.

**Don't link to Drive from the site.** Drive isn't a web host (its image links are slow, rate-limited
and can stop working), the originals are 7 to 39 MB each, and the folder's sharing is controlled by
another account. Instead, make a web copy of each chosen photo and commit it to the repo; Netlify
serves it from its CDN.

**Steps for each club**

1. Open the club's folder (table below) and choose **one** hero photo.
2. Make a web copy: landscape, 2000px wide, JPEG quality about 80 (aim for 250 to 450 KB), and remove
   the photo's metadata (EXIF, including GPS). Keep the Drive original untouched.
3. Save it as `src/images/clubs/<club-slug>.jpg`.
4. In `src/clubs.json`, set `"photo": "clubs/<club-slug>.jpg"` on that club.
5. Run `node build.js`, check the club page on the deploy preview (desktop and phone), and open a pull
   request. A batch of clubs per pull request is fine.

**Choosing the photo (design direction)**

- The clubhouse, a signature hole, the entrance or an aerial. The club page frame is taller than wide
  on desktop (about 3:4) and wide on phones, so the photo is cropped to fit: keep the main subject in
  the center third, with some sky or fairway around it.
- Bright, daytime or golden hour; level horizon; sharp. Skip dark, hazy or tilted shots.
- No identifiable members or staff, no other brokerages' signs, no cars or construction in front.
- Real photos only. Color correction and straightening are fine; don't use AI to add, remove or change
  anything in the scene.
- If a folder only has video, a sharp frame from the video can be used (export at full resolution,
  then follow step 2).

**Drive folder → club page**

| Drive folder (Town / Club) | Club page slug |
|---|---|
| Boca Raton / Boca Grove | `boca-grove` |
| Boca Raton / Boca West | `boca-west` |
| Boca Raton / Boca Woods | `boca-woods` |
| Boca Raton / Bocaire | `bocaire` |
| Boca Raton / Broken Sound | `broken-sound` |
| Boca Raton / Royal Palm Yacht Club | `royal-palm` |
| Boca Raton / St. Andrews | `st-andrews` |
| Boca Raton / Stonebridge | `stonebridge` |
| Boca Raton / Woodfield County Club | `woodfield` |
| Delray Beach / Addison Reserve | `addison-reserve` |
| Delray Beach / Delaire | `delaire` |
| Delray Beach / Glen Eagles | `gleneagles` |
| Delray Beach / Polo Club | `polo-club` |
| Boynton / Delray Dunes | `delray-dunes` |
| Boynton / Hunters Run (also West Palm Beach / Hunter's Run) | `hunters-run` |
| Boynton / Quail Ridge | `quail-ridge` |
| Boynton / Wycliffe (also West Palm Beach / Wycliffe) | `wycliffe` |
| West Palm Beach / Admirals Cove | `admirals-cove` |
| West Palm Beach / BALLEN ISLES | `ballenisles` |
| West Palm Beach / FRENCHMENS CREEK | `frenchmans-creek` |
| West Palm Beach / FRENCHMENS RESERVE | `frenchmans-reserve` |
| West Palm Beach / IBIS | `ibis` |
| West Palm Beach / Mirasol | `mirasol` |
| West Palm Beach / PGA NATIONAL | `pga-national` |
| Jupiter / EASTPOINT | `eastpointe` |
| Jupiter / JOHNATHANS LANDING | `jonathans-landing` |
| Jupiter / Jupiter Hills | `jupiter-hills` |
| Jupiter / Old Palm | `old-palm` |

**Folders with no club page yet:** Delray Beach / Minzer (Mizner Country Club) and Jupiter / Palm Trail.
Leave them until those pages exist.

**Club pages with no Drive folder yet** (they keep the photo slot until photos are shot):
`aberdeen`, `abacoa`, `bear-lakes`, `boca-greens`, `boca-lago`, `boca-pointe`, `boca-teeca`,
`indian-spring`, `panther-national`, `seagate`, `tequesta`, `the-bears-club`.

Communities without a club (`src/communities.json`) use the same `"photo"` field and the same steps,
saved under `src/images/communities/<slug>.jpg`.

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

### 3. Listings on each club page → IDX Broker

Each club page (and each community page) has a "Homes for sale inside the gates" section with
designed listing cards: photo, status badge (New, Price reduced, Open house), price, beds, baths,
square feet, address, a line about the club's membership, the listing brokerage, and buttons for
"See all homes in [club]" and "Get alerts for new listings". On phones the cards become a swipeable row.

The page fills the section from the first of these that exists:

1. **`src/listings/<club-slug>.json` (recommended, matches the design).** A small build script fetches
   each club's listings from the IDX Broker API (for example, the results of a saved link per club;
   see developers.idxbroker.com for the current endpoints) and writes one file per club before
   `node build.js` runs. Shape:

   ```json
   { "total": 14, "url": "<IDX saved link showing all homes in this club>", "updated": "Nov 12, 2026",
     "disclaimer": "<BeachesMLS IDX disclaimer text>",
     "items": [ { "price": 1250000, "status": "New", "address": "123 Example Dr", "city": "Boca Raton",
                  "beds": 3, "baths": 3.5, "sqft": 2850, "photo": "https://...",
                  "url": "<IDX listing detail URL>", "courtesy": "<listing brokerage>" } ] }
   ```

   The first 6 items are shown. Keep the IDX API key in a Netlify environment variable (never in the
   repo), and use a Netlify build hook on a daily schedule so listings stay current.
2. **`"idx"` on the club in `clubs.json`:** an IDX Broker widget embed, shown as-is. Quickest to set up,
   but it uses IDX Broker's own styling.
3. **Neither:** a "coming soon" panel with the Club Match button (current state).

**MLS display rules:** BeachesMLS IDX rules decide what must appear with listings (for example the
listing brokerage, the MLS disclaimer and logo, and which fields may be shown). The cards include a
brokerage line and the section has a disclaimer slot; please check the current rules and adjust the
`courtesy` and `disclaimer` values to match.

### 4. "Inside the gates" → Behold (live Instagram reels)

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
- [ ] Listing cards show the brokerage line and MLS disclaimer required by BeachesMLS

