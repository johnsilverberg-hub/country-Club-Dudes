// Builds the static site into dist/. No dependencies: run `node build.js`.
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const OUT = path.join(__dirname, 'dist');
const clubs = JSON.parse(fs.readFileSync(path.join(SRC, 'clubs.json'), 'utf8'))
  .sort((a, b) => a.name.localeCompare(b.name));

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

function scorecard(list) {
  return `<div class="scorecard" role="list">
      <div class="sc-row head" aria-hidden="true"><span>Hole</span><span>Club</span><span>Town</span><span>Known for</span><span></span></div>
${list.map((c, i) => `      <div class="sc-row" role="listitem"><span class="hole">${i + 1}</span><h3><a href="/clubs/${c.slug}/">${esc(c.name)}</a></h3><span class="town">${esc(c.town)}</span><p class="note">${esc(c.blurb)}</p><a class="go" href="/clubs/${c.slug}/">Guide →</a></div>`).join('\n')}
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
      <div><strong>34</strong><span>clubs covered</span></div>
      <div><strong>89</strong><span>club reels this year</span></div>
      <div><strong>Delray</strong><span>office at Premier Listings</span></div>
      <div><strong>PBC</strong><span>Boca to Jupiter</span></div>
    </div>
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

function clubPage(club) {
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
      <p class="crumbs"><a href="/clubs/">Clubs</a> / ${esc(club.name)}</p>
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
        <tr><td>Town</td><td>${esc(club.town)}</td></tr>
        <tr><td>Membership</td><td>Ask John</td></tr>
        <tr><td>Initiation &amp; dues</td><td>Ask John</td></tr>
      </table>
    </aside>
  </div>
</section>

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
write('index.html', homePage());
write('clubs/index.html', clubsIndex());
for (const club of clubs) write(`clubs/${club.slug}/index.html`, clubPage(club));
write('thanks/index.html', thanksPage());
console.log(`Built ${clubs.length} club pages into dist/`);
