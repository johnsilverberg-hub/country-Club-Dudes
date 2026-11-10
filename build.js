// Builds the static site into dist/. No dependencies: run `node build.js`.
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const OUT = path.join(__dirname, 'dist');
const readList = (file) => JSON.parse(fs.readFileSync(path.join(SRC, file), 'utf8'))
  .sort((a, b) => a.name.localeCompare(b.name));
const clubs = readList('clubs.json');
// New construction communities. Same fields as a club, plus an optional "status" like "Now selling".
const developments = readList('developments.json');
// 55+ resort-style communities: club life without the golf (pickleball, tennis, clubhouse).
const resort = readList('active-adult.json');
// Waterfront communities: ocean and Intracoastal living with tennis and pickleball.
const waterfront = readList('waterfront.json');
const CLUBS = { base: '/clubs/', label: 'Clubs' };
const DEVS = { base: '/new-developments/', label: 'New developments' };
const RESORT = { base: '/active-adult/', label: '55+ communities' };
const WATER = { base: '/waterfront/', label: 'Waterfront' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function write(rel, html) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

const FLAG = `<svg width="26" height="30" viewBox="0 0 26 30" aria-hidden="true"><rect x="5" y="2" width="2.4" height="26" fill="currentColor"/><path d="M7.4 3 L24 8.5 L7.4 14 Z" fill="var(--flag)"/><ellipse cx="9" cy="28" rx="8" ry="1.6" fill="currentColor" opacity=".5"/></svg>`;

function layout({ title, description, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Young+Serif&family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap">
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<header class="top">
  <div class="wrap">
    <a class="brand" href="/" aria-label="Country Club Dudes home">${FLAG} Country Club Dudes</a>
    <nav aria-label="Main"><ul>
      <li><a href="/clubs/">Clubs</a></li>
      <li><a href="/active-adult/">55+ Communities</a></li>
      <li><a href="/waterfront/">Waterfront</a></li>
      <li><a href="/new-developments/">New Developments</a></li>
      <li><a href="/#match">Club Match</a></li>
      <li><a href="/#reels">Reels</a></li>
      <li><a href="/#about">About</a></li>
    </ul></nav>
  </div>
</header>
${body}
<footer>
  <div class="wrap">
    <div><strong style="font-family:var(--display);font-size:20px;font-weight:400">Country Club Dudes</strong><p>John Silverberg and Shawn Miller, Premier Listings, Delray Beach, Florida. Licensed real estate professionals. Equal Housing Opportunity.</p></div>
    <p>countryclubdudes.com</p>
  </div>
</footer>
</body>
</html>
`;
}

// Netlify Forms picks this up at deploy time (data-netlify). Submissions email John;
// Follow Up Boss gets them through a Netlify form notification or Zapier later.
function matchForm(club) {
  const id = club ? club.slug : 'home';
  return `<form name="club-match" method="POST" action="/thanks/" data-netlify="true" netlify-honeypot="company">
      <input type="hidden" name="form-name" value="club-match">
      <input type="hidden" name="club" value="${club ? esc(club.name) : ''}">
      <p class="hidden-field"><label>Leave this empty <input name="company" tabindex="-1" autocomplete="off"></label></p>
      <fieldset>
        <legend>What matters most?</legend>
        <div class="chips">
          <label><input type="checkbox" id="${id}-golf" name="focus" value="Golf" checked> Golf</label>
          <label><input type="checkbox" id="${id}-tennis" name="focus" value="Tennis and pickleball"> Tennis &amp; pickleball</label>
          <label><input type="checkbox" id="${id}-social" name="focus" value="Social and dining" checked> Social &amp; dining</label>
          <label><input type="checkbox" id="${id}-water" name="focus" value="Boating"> Boating</label>
        </div>
      </fieldset>
      <div class="two">
        <div class="field"><label for="${id}-town">Area</label>
          <select id="${id}-town" name="area"><option>Boca Raton</option><option>Delray Beach</option><option>Palm Beach Gardens / Jupiter</option><option>Open to anywhere</option></select></div>
        <div class="field"><label for="${id}-budget">Home budget</label>
          <select id="${id}-budget" name="budget"><option>Under $1M</option><option selected>$1M – $2.5M</option><option>$2.5M – $5M</option><option>$5M+</option></select></div>
      </div>
      <div class="field"><label for="${id}-membership">Membership</label>
        <select id="${id}-membership" name="membership"><option>Bundled is fine</option><option>Prefer equity</option><option>Prefer no mandatory membership</option><option>Not sure, explain it to me</option></select></div>
      <div class="two">
        <div class="field"><label for="${id}-name">Name</label><input id="${id}-name" name="name" autocomplete="name" required></div>
        <div class="field"><label for="${id}-phone">Mobile</label><input id="${id}-phone" name="phone" type="tel" autocomplete="tel" required></div>
      </div>
      <div class="field"><label for="${id}-email">Email</label><input id="${id}-email" name="email" type="email" autocomplete="email" required></div>
      <button class="btn primary" type="submit">Send my Club Match</button>
      <p class="form-msg">John gets this right away. No spam, ever.</p>
    </form>`;
}

function scorecard(list, base = '/clubs/', noun = 'Club') {
  return `<div class="scorecard" role="list">
      <div class="sc-row head" aria-hidden="true"><span>Hole</span><span>${noun}</span><span>Town</span><span>Known for</span><span></span></div>
${list.map((c, i) => `      <div class="sc-row" role="listitem"><span class="hole">${i + 1}</span><h3><a href="${base}${c.slug}/">${esc(c.name)}</a></h3><span class="town">${esc(c.town)}</span><p class="note">${esc(c.blurb)}</p><a class="go" href="${base}${c.slug}/">Guide →</a></div>`).join('\n')}
    </div>`;
}

function homePage() {
  const reels = [
    ['Boca Raton', 'Boca Pointe'],
    ['Palm Beach Gardens', 'Old Palm golf'],
    ['Delray Beach', 'Bobby Jones'],
    ['Buyer advice', "Don't fall in love with the house"],
  ];
  return layout({
    title: 'Country Club Dudes | Palm Beach County Country Club Homes',
    description: 'Find the Palm Beach County country club that fits how you live, then the home. Club guides, real dues, and live listings from John Silverberg and Shawn Miller.',
    body: `
<section class="hero" id="top">
  <div class="wrap">
    <div>
      <p class="eyebrow" style="color:var(--flag)">Palm Beach County country club real estate</p>
      <h1 style="margin-top:14px">Find the club that fits <em>your game</em>, then the home.</h1>
      <p class="lede">We film inside these clubs every week. We'll tell you what the membership really costs, who plays where, and which clubs match how you actually want to spend your days.</p>
      <div class="cta-row">
        <a class="btn primary" href="#match">Get my Club Match</a>
        <a class="btn ghost" href="/clubs/">Browse the clubs</a>
      </div>
    </div>
    <aside class="card-mini" aria-label="What we compare for every club">
      <p class="eyebrow">What we compare, club by club</p>
      <table>
        <tr><td>Membership type</td><td>Equity / Bundled</td></tr>
        <tr><td>Initiation &amp; annual dues</td><td>$ / yr</td></tr>
        <tr><td>Capital contribution</td><td>On resale</td></tr>
        <tr><td>Golf holes</td><td>18 / 36 / 54</td></tr>
        <tr><td>Tennis &amp; pickleball</td><td>Courts</td></tr>
        <tr><td>Homes for sale</td><td>Live</td></tr>
      </table>
    </aside>
  </div>
</section>

<section class="band" id="ways" style="padding-bottom:0">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">Three ways to live the club life</p><h2>Golf, 55+, or on the water</h2></div></div>
    <div class="club-grid ways">
      <a href="/clubs/"><strong>Golf country clubs</strong><span class="town">${clubs.length} clubs</span><span>Private golf, tennis and pickleball, dining and a full social calendar.</span></a>
      <a href="/active-adult/"><strong>55+ communities</strong><span class="town">${resort.length ? `${resort.length} communities` : 'Coming soon'}</span><span>Clubhouse, pickleball, tennis and pools, with no golf membership.</span></a>
      <a href="/waterfront/"><strong>Waterfront living</strong><span class="town">Ocean and Intracoastal</span><span>Homes on the water with tennis, pickleball and a club lifestyle.</span></a>
    </div>
  </div>
</section>

<section class="band" id="clubs">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="eyebrow">The course</p><h2>Club guides</h2></div>
      <p>Each club has its own page with homes for sale and what membership costs. <a href="/clubs/">See all clubs →</a></p>
    </div>
    ${scorecard(clubs.slice(0, 9))}
  </div>
</section>

<section class="band match" id="match">
  <div class="wrap">
    <div>
      <p class="eyebrow">Club Match</p>
      <h2 style="font-size:clamp(30px,4vw,44px);margin-top:10px">Tell us how you play. We'll send your short list.</h2>
      <ol class="steps">
        <li><b>1</b><p>Answer a few quick questions about towns, budget and how you'll use the club.</p></li>
        <li><b>2</b><p>We send two or three clubs that fit, with real dues and what's for sale today.</p></li>
        <li><b>3</b><p>Tour them with us, including the clubhouse and the course.</p></li>
      </ol>
    </div>
    ${matchForm(null)}
  </div>
</section>

<section class="band" id="reels">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="eyebrow">@countryclubdudes</p><h2>Inside the gates</h2></div>
      <p>Our most-shared reels on Instagram.</p>
    </div>
    <div class="reels">
${reels.map(([where, title]) => `      <a class="reel" href="https://www.instagram.com/countryclubdudes/" target="_blank" rel="noopener"><span class="eyebrow">${esc(where)}</span><div><h3>${esc(title)}</h3><span class="views">Watch on Instagram</span></div></a>`).join('\n')}
    </div>
  </div>
</section>

<section class="band about" id="about" style="padding-top:0">
  <div class="wrap">
    <div>
      <p class="eyebrow">About</p>
      <h2 style="font-size:clamp(30px,4vw,44px);margin:10px 0 20px">John Silverberg and Shawn Miller, Premier Listings</h2>
      <p>We're the Country Club Dudes. We sell homes in Palm Beach County's country club communities, and we film what it's actually like to live in them.</p>
      <p>Buying into a club is two decisions: the house and the membership. We help you get both right, starting with the club.</p>
      <div class="cta-row"><a class="btn primary" href="#match">Start with Club Match</a></div>
    </div>
    <div class="facts">
      <div><strong>${clubs.length}</strong><span>clubs covered</span></div>
      <div><strong>89</strong><span>club reels this year</span></div>
      <div><strong>Delray</strong><span>office at Premier Listings</span></div>
      <div><strong>PBC</strong><span>Boca to Jupiter</span></div>
    </div>
  </div>
</section>`,
  });
}

function sectionIndex({ list, section, title, description, eyebrow, h1, lede, empty, extra = '' }) {
  const body = list.length
    ? scorecard(list, section.base, 'Community')
    : `<div class="listings">
        <p class="pending">${empty}</p>
        <div><a class="btn primary" href="/#match">Send a Club Match</a></div>
      </div>`;
  return layout({
    title,
    description,
    body: `
<section class="hero">
  <div class="wrap" style="grid-template-columns:1fr">
    <div>
      <p class="eyebrow" style="color:var(--flag)">${eyebrow}</p>
      <h1 style="margin-top:14px">${h1}</h1>
      <p class="lede">${lede}</p>
    </div>
  </div>
</section>
<section class="band">
  <div class="wrap">
    ${body}
  </div>
</section>${extra}`,
  });
}

function resortIndex() {
  return sectionIndex({
    list: resort, section: RESORT,
    title: '55+ Resort-Style Communities in Palm Beach County | Country Club Dudes',
    description: '55+ communities in Palm Beach County with a country club lifestyle and no golf course: clubhouses, pickleball, tennis, pools and a full social calendar.',
    eyebrow: '55+ communities',
    h1: 'Club life, <em>no golf required</em>',
    lede: "Palm Beach County's 55+ communities with a clubhouse, pickleball, tennis, pools and a social calendar that never slows down, without the golf membership.",
    empty: "We're adding 55+ communities here soon. Tell us which ones you're looking at.",
  });
}

function waterfrontIndex() {
  const waterClubs = clubs.filter((c) => c.water);
  const extra = waterClubs.length ? `
<section class="band" style="padding-top:0">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">Also on the water</p><h2>Country clubs on the water</h2></div><p>These golf clubs have waterfront homes, docks or a beach club too.</p></div>
    <div class="club-grid">
${waterClubs.map((c) => `      <a href="/clubs/${c.slug}/"><strong>${esc(c.name)}</strong><span class="town">${esc(c.town)}</span></a>`).join('\n')}
    </div>
  </div>
</section>` : '';
  return sectionIndex({
    list: waterfront, section: WATER,
    title: 'Waterfront Homes, Ocean and Intracoastal | Country Club Dudes',
    description: 'Ocean and Intracoastal waterfront communities in Palm Beach County with tennis, pickleball and a club lifestyle.',
    eyebrow: 'Waterfront living',
    h1: 'Ocean and <em>Intracoastal</em> living',
    lede: 'Waterfront communities on the ocean and the Intracoastal, with tennis, pickleball, a clubhouse and a club lifestyle.',
    empty: "We're adding waterfront communities here soon. Tell us whether you want ocean, Intracoastal, or a dock out back.",
    extra,
  });
}

function developmentsIndex() {
  const list = developments.length
    ? scorecard(developments, DEVS.base)
    : `<div class="listings">
        <p class="pending">We're adding new construction communities here soon.</p>
        <p>Looking at a new build? Send a Club Match and tell us which developments you're watching. We'll send floor plans, pricing, and what the club will offer.</p>
        <div><a class="btn primary" href="/#match">Send a Club Match</a></div>
      </div>`;
  return layout({
    title: 'New Country Club Developments | Country Club Dudes',
    description: 'New construction country club communities in Palm Beach County: what is being built, pricing, and how membership will work.',
    body: `
<section class="hero">
  <div class="wrap" style="grid-template-columns:1fr">
    <div>
      <p class="eyebrow" style="color:var(--flag)">New developments</p>
      <h1 style="margin-top:14px">New club communities</h1>
      <p class="lede">New construction with a club attached. We track what's being built, what it costs, and how membership will work.</p>
    </div>
  </div>
</section>
<section class="band">
  <div class="wrap">
    ${list}
  </div>
</section>`,
  });
}

function clubsIndex() {
  return layout({
    title: 'Country Club Guides | Country Club Dudes',
    description: 'Every Palm Beach County country club we cover, with homes for sale and membership details.',
    body: `
<section class="hero">
  <div class="wrap" style="grid-template-columns:1fr">
    <div>
      <p class="eyebrow" style="color:var(--flag)">Club guides</p>
      <h1 style="margin-top:14px">Every club we cover</h1>
      <p class="lede">Pick a club to see homes for sale and what membership costs.</p>
    </div>
  </div>
</section>
<section class="band">
  <div class="wrap">
    ${scorecard(clubs)}
  </div>
</section>`,
  });
}

function clubPage(club, section = CLUBS) {
  const listings = club.idx
    ? `<div class="listings" id="listings">${club.idx}</div>`
    : `<div class="listings" id="listings">
        <p class="pending">Live listings for ${esc(club.name)} are coming soon.</p>
        <p>Want to see what's for sale here today? Send a Club Match below and John will send you every active listing.</p>
        <div><a class="btn primary" href="#match">Send me the listings</a></div>
      </div>`;
  return layout({
    title: `${club.name} Homes for Sale, ${club.town} | Country Club Dudes`,
    description: `${club.name} in ${club.town}: homes for sale, membership, and what it's like to live there.`,
    body: `
<section class="hero club-hero">
  <div class="wrap">
    <div>
      <p class="crumbs"><a href="${section.base}">${section.label}</a> / ${esc(club.name)}</p>
      <p class="eyebrow" style="color:var(--flag)">${esc(club.town)}</p>
      <h1 style="margin-top:14px">${esc(club.name)}</h1>
      <p class="lede">${esc(club.blurb)}</p>
      <div class="cta-row">
        <a class="btn primary" href="#listings">Homes for sale</a>
        <a class="btn ghost" href="#match">Ask about membership</a>
      </div>
    </div>
    <aside class="card-mini" aria-label="${esc(club.name)} at a glance">
      <p class="eyebrow">${esc(club.name)} at a glance</p>
      <table>
        <tr><td>Town</td><td>${esc(club.town)}</td></tr>${club.status ? `
        <tr><td>Status</td><td>${esc(club.status)}</td></tr>` : ''}
        <tr><td>Membership</td><td>Ask John</td></tr>
        <tr><td>Initiation &amp; dues</td><td>Ask John</td></tr>
      </table>
    </aside>
  </div>
</section>

${club.photo || club.reel ? `<section class="band" style="padding-bottom:0">
  <div class="wrap club-media">
    ${club.photo ? `<img src="/images/${esc(club.photo)}" alt="${esc(club.name)}" loading="lazy">` : ''}
    ${club.reel ? `<p><a class="btn primary" href="${esc(club.reel)}" target="_blank" rel="noopener">Watch our ${esc(club.name)} reel</a></p>` : ''}
  </div>
</section>` : ''}
<section class="band">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">For sale now</p><h2>${esc(club.name)} homes for sale</h2></div></div>
    ${listings}
  </div>
</section>

<section class="band match" id="match">
  <div class="wrap">
    <div>
      <p class="eyebrow">Interested in ${esc(club.name)}?</p>
      <h2 style="font-size:clamp(30px,4vw,44px);margin-top:10px">Get the real numbers and what's for sale.</h2>
      <p style="margin-top:16px;color:var(--muted)">Tell us a little about what you want and we'll send current listings, membership costs, and similar clubs worth a look.</p>
    </div>
    ${matchForm(club)}
  </div>
</section>`,
  });
}

function thanksPage() {
  return layout({
    title: 'Thanks | Country Club Dudes',
    description: 'Thanks for reaching out to the Country Club Dudes.',
    body: `
<section class="hero">
  <div class="wrap" style="grid-template-columns:1fr">
    <div>
      <h1>Got it. We'll be in touch soon.</h1>
      <p class="lede">John or Shawn will reach out with your short list, usually the same day.</p>
      <div class="cta-row"><a class="btn primary" href="/clubs/">Keep browsing clubs</a></div>
    </div>
  </div>
</section>`,
  });
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.copyFileSync(path.join(SRC, 'styles.css'), path.join(OUT, 'styles.css'));
if (fs.existsSync(path.join(SRC, 'images'))) fs.cpSync(path.join(SRC, 'images'), path.join(OUT, 'images'), { recursive: true });
write('index.html', homePage());
write('clubs/index.html', clubsIndex());
for (const club of clubs) write(`clubs/${club.slug}/index.html`, clubPage(club));
write('active-adult/index.html', resortIndex());
for (const c of resort) write(`active-adult/${c.slug}/index.html`, clubPage(c, RESORT));
write('waterfront/index.html', waterfrontIndex());
for (const c of waterfront) write(`waterfront/${c.slug}/index.html`, clubPage(c, WATER));
write('new-developments/index.html', developmentsIndex());
for (const dev of developments) write(`new-developments/${dev.slug}/index.html`, clubPage(dev, DEVS));
write('thanks/index.html', thanksPage());
const SITE = 'https://countryclubdudes.com';
const urls = ['/', '/clubs/', ...clubs.map((c) => `/clubs/${c.slug}/`), '/active-adult/', ...resort.map((c) => `/active-adult/${c.slug}/`), '/waterfront/', ...waterfront.map((c) => `/waterfront/${c.slug}/`), '/new-developments/', ...developments.map((d) => `/new-developments/${d.slug}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Built ${clubs.length} club, ${resort.length} 55+, ${waterfront.length} waterfront and ${developments.length} new development pages into dist/`);
