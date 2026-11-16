# Finishing the Country Club Dudes website

For Dezirae, who now owns finishing the site (design and build). Last updated November 16, 2026.
DESIGN-HANDOFF.md has the design system and the setup guides for IDX Broker and Instagram.

## Where it stands

- **Test site:** https://country-club-dudes.netlify.app (Netlify project `country-club-dudes`, team "john-silverberg").
- **Code:** this repo. Every push to `main` rebuilds and publishes the site on Netlify by itself, usually within a minute. Pull requests get their own preview link from Netlify.
- **Design:** your design refresh (#2) is live. Your Search menu trim (#3) is open and ready to merge.
- **Pages:** home, 40 club pages, 42 communities without a club (33 55+ communities plus 9 Boca and Delray gated communities), the Search pages (55+, gated, waterfront, racquets, non-equity, optional membership, no club), New Developments, Thanks.
- **Lead form:** "Club Match" (Netlify Forms, form name `club-match`). It works, but no submissions yet, and nobody is notified yet (see step 2).
- **Listings:** IDX Broker is approved for BeachesMLS (account ID 71715). No saved links or widgets are set up yet.
- **Domain:** countryclubdudes.com is at GoDaddy and still forwards to the Premier Listings site.

## Data files

| File | What it holds | Pages it makes |
| --- | --- | --- |
| `src/clubs.json` | 40 golf clubs, with `tags`, `reel`, `photo`, `idx` | `/clubs/<slug>/` |
| `src/communities.json` | Communities without a club (55+, gated, etc.), with `tags` | `/communities/<slug>/` |
| `src/developments.json` | New construction (empty) | `/new-developments/<slug>/` |
| `src/search.json` | Search menu, hero search bar, IDX slots for Search pages | `/search/...` |

Every list can grow with no limit. Adding a line gives that community its own page and puts it on the matching Search pages. Tags in use: `55-plus`, `gated`, `waterfront`, `racquets`, `non-equity`, `optional-membership`.

## Accounts

| Account | Status |
| --- | --- |
| GitHub repo | You have write access (you've pushed branches here). |
| Netlify team "john-silverberg" | John invited you. Accept the email invite from Netlify if you haven't. |
| IDX Broker | John's account. Ask John for a login of your own; never put the password or API key in the repo or in chat. |
| GoDaddy (domain) | John's account. Ask him for GoDaddy "Delegate Access" when you're ready for step 8. |
| Follow Up Boss | John's account. Needed only for the lead-inbox address in step 2. |

## To do, in order

### 1. Clean up Netlify
- Delete the duplicate project **nimble-pie-79e35c** (Project configuration, then Delete project). Keep **country-club-dudes**.

### 2. Send leads to John, Shawn and Follow Up Boss
In the country-club-dudes project: **Forms**, then **Form notifications**, then **Add notification**, then **Email notification**. Add John (johnsilverberg@premierlistings.com) and Shawn. Add one more to John's Follow Up Boss lead-inbox address (Follow Up Boss, Admin, Lead Flow). Send one test lead and confirm it arrives in all three places.

### 3. Fill in the placeholders
These show on the live pages in square brackets until they're filled:
- John's and Shawn's bios and the client quote, in `homePage()` in `build.js`.
- Club photos: the "[Photo]" slot on every club page. Add a photo with the club's `"photo"` field.
- "Ask the Dudes" fields on club pages: `membership`, `equity`, `verified`, `scorecard` (see DESIGN-HANDOFF.md).

### 4. Check the drafts
- Club towns and one-line blurbs in `src/clubs.json`. Eleven were rewritten from our reels; the rest are drafts.
- All 42 entries in `src/communities.json` are drafts from public lists. Check the towns, blurbs and tags (for example, which 55+ communities are gated or have racquets).
- Waterfront: only five clubs are tagged `waterfront` so far. John still wants ocean and Intracoastal communities added.

### 5. Listings (IDX Broker)
Follow sections 1 to 3 of the setup guides in DESIGN-HANDOFF.md: one saved link per club and community, the hero search bar, and the Search page slots. Keep the IDX API key in a Netlify environment variable, never in the repo.

### 6. Instagram reels
Optional: set up Behold (DESIGN-HANDOFF.md, section 4). Until then, "Inside the gates" uses the reel links in `clubs.json`. Sixteen clubs have no reel yet: Aberdeen, Bear Lakes, The Bear's Club, Boca Greens, Boca Teeca, Boca West, Boca Woods, Broken Sound, Delray Dunes, Frenchman's Reserve, Indian Spring, Panther National, PGA National, Quail Ridge, Seagate, Tequesta.

### 7. Make the site public
When John is happy with it: **Project configuration**, then **Access & security**, then **Visitor access**, and set it so anyone can view. Check it in a private window.

### 8. Point countryclubdudes.com at the new site
Only once John approves.
1. In Netlify, open **Domain management**, then **Add a domain**, and enter `countryclubdudes.com`.
2. In GoDaddy, turn off the forwarding to Premier Listings.
3. In GoDaddy DNS, add the exact records Netlify shows (usually an `A` record for `@` and a `CNAME` for `www`).
4. Leave the MX (email) records alone so email keeps working.
5. Netlify adds the SSL certificate by itself within about an hour.

### 9. Ads
Point the Club Match Facebook ads at matching club pages once the domain is live. A Meta Pixel can be added to `build.js` if John wants one.

## Open questions from John
- Jacaranda Country Club (Plantation, Broward County): John asked whether it fits. Adding it means the site's "Palm Beach County" wording would need to change to "South Florida". Waiting on his answer.

## How to make changes
- `node build.js` builds the site into `dist/`. There is nothing to install.
- Work on a branch and open a pull request. Merge when John is happy; Netlify publishes `main`.
- Keep "Premier Listings" in the footer. Florida advertising rules require the brokerage name.
