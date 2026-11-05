# Finishing the Country Club Dudes website

For Dezirae (and her Claude). Last updated November 5, 2026.

## Where it stands

- **Test site:** https://country-club-dudes.netlify.app
- **Code:** this repo. Every push to `main` rebuilds the site on Netlify by itself.
- **Pages:** home, all clubs, one page per club (40 so far), thanks page.
- **Lead form:** "Club Match" on the home page and every club page. It runs on Netlify Forms (form name `club-match`) and records which club page it came from.
- **Listings:** IDX Broker account is open on Beaches MLS. MLS approval is still in progress (John is handling the agreement).
- **Domain:** countryclubdudes.com is at GoDaddy and still forwards to Premier Listings.

## Accounts

| Account | Who has it | What Dezirae needs |
| --- | --- | --- |
| GitHub repo | John | Accept the invite sent to dezirae.design@gmail.com |
| Netlify (team "john-silverberg") | John | John invites her under Team settings, then Members |
| GoDaddy (domain) | John | John's login, or GoDaddy "Delegate Access" |
| IDX Broker | John | Login from John once MLS approves |

## To do, in order

### 1. Make the test site public
Netlify currently asks visitors to log in to the team. In Netlify, open the **country-club-dudes** project, then **Project configuration**, then **Access & security**, then **Visitor access**, and set it so anyone can view. Check it in a private window afterward.

### 2. Send leads to John, Shawn, and Follow Up Boss
In Netlify, go to **Forms**, then **Form notifications**, then **Add notification**, then **Email notification**, and add John and Shawn. For Follow Up Boss, add one more email notification to John's Follow Up Boss lead-inbox address (found in Follow Up Boss under Admin, then Lead Flow). Then send one test lead through the form and confirm it arrives in all three places.

### 3. Club photos and reels
Each club is one line in `src/clubs.json`. Two optional fields are ready to use:

- `"photo": "old-palm.jpg"` shows a photo on the club page. Put the file in `src/images/`. Wide photos about 1600px across work best. Only use photos we have rights to.
- `"reel": "https://www.instagram.com/reel/..."` adds a "Watch our reel" button.

### 4. Check every club's facts
Most towns and every one-line `blurb` in `src/clubs.json` were written as drafts. Please correct anything that's wrong. The club spreadsheet John emailed has the same list.

### 5. Brand
Send or add the logo and headshots of John and Shawn. The About section is on the home page in `build.js` (search for `id="about"`).

### 6. Live listings (after MLS approval)
For each club, build a saved search or widget in IDX Broker for that community, then paste its embed code into that club's `"idx"` field in `src/clubs.json`. Club pages show the listings automatically once `idx` is filled in.

### 7. Point countryclubdudes.com at the new site
Only do this once John is happy with the site.
1. In Netlify, open **Domain management**, then **Add a domain**, and enter `countryclubdudes.com`.
2. In GoDaddy, turn off the forwarding to Premier Listings.
3. In GoDaddy DNS, add the records Netlify shows. Usually that's an `A` record for `@` pointing to Netlify's load balancer IP, and a `CNAME` for `www` pointing to `country-club-dudes.netlify.app`. Use the exact values Netlify displays.
4. Leave the MX (email) records alone, so email keeps working.
5. Netlify adds the free SSL certificate by itself within about an hour.

### 8. Ads
Point the Club Match Facebook ads at the matching club pages (for example, https://countryclubdudes.com/clubs/boca-west/ once the domain is live). If you want a Meta Pixel on the site, send the Pixel ID and it can be added to `build.js`.

## How to make changes

- `node build.js` builds the site into `dist/`. There is nothing to install.
- Work on a branch and open a pull request so John can approve it before it goes live.
- Keep "Premier Listings" in the footer, because Florida advertising rules require the brokerage name.
