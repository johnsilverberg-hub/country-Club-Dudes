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
const CLUBS = { base: '/clubs/', label: 'Clubs' };
const DEVS = { base: '/new-developments/', label: 'New developments' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function write(rel, html) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

// ---------------------------------------------------------------------------
// Design layer (design-refresh). Layout and styling only: the data files,
// the Club Match form fields and the Netlify form setup are unchanged.
// ---------------------------------------------------------------------------

// Logo: drop the files into src/images and they're used automatically.
// Until then a text wordmark stands in.
const hasImage = (f) => fs.existsSync(path.join(SRC, 'images', f));
// Brand rule: always the full stacked logo. The key icon on its own is only for spots
// where the full logo can't fit, or as a design accent (e.g. behind empty photo slots).
const LOGO = ['ccd-logo-stacked-light.svg', 'ccd-logo-stacked-light.png'].find(hasImage);
const brandMark = () => LOGO
  ? `<img src="/images/${LOGO}" alt="Country Club Dudes" class="logo">`
  : `<span class="wordmark">Country Club Dudes<small>Premier Listings</small></span>`;

// Photo slots: shows the image when the file exists, otherwise a labeled placeholder.
function photo(file, alt, label, cls = 'ph') {
  if (file && hasImage(file)) return `<div class="${cls === 'ph' ? 'hero-photo' : cls}"><img src="/images/${esc(file)}" alt="${esc(alt)}" loading="lazy"></div>`;
  return `<div class="ph"><img class="ph-mark" src="/images/ccd-key-gold.png" alt=""><span>[Photo] ${esc(label)}</span></div>`;
}

// Instagram feed for "Inside the gates". Sign up at behold.so, connect @countryclubdudes,
// create a JSON feed, and paste its feed ID here. Leave empty to show the linked reel tiles only.
const BEHOLD_FEED_ID = '';

// Hero background video. Put the files in src/images/hero/:
//   hero.mp4 (H.264, 1920x1080, 15-20s loop, muted, ~3-5 MB), optional hero.webm,
//   hero-poster.jpg (a still frame, shown while loading, on phones, and for reduced motion).
function heroMedia() {
  const poster = ['hero/hero-poster.jpg', 'hero/hero-poster.webp'].find(hasImage);
  const mp4 = hasImage('hero/hero.mp4'), webm = hasImage('hero/hero.webm');
  const bg = poster ? `<img class="hero-poster" src="/images/${poster}" alt="" fetchpriority="high">` : '';
  if (!mp4 && !webm) {
    return `<div class="hero-media" aria-hidden="true">${bg}${poster ? '' : '<span class="hero-media-note">[Background video] 15–20 second slow-pan loop of club footage</span>'}</div>`;
  }
  return `<div class="hero-media" aria-hidden="true">${bg}
      <video class="hero-video" muted loop playsinline preload="none"${poster ? ` poster="/images/${poster}"` : ''}>
        ${webm ? '<source data-src="/images/hero/hero.webm" type="video/webm">' : ''}
        ${mp4 ? '<source data-src="/images/hero/hero.mp4" type="video/mp4">' : ''}
      </video>
    </div>
    <button class="hero-pause" type="button" aria-label="Pause background video" hidden>Pause</button>`;
}

const PHONES = { shawn: ['(201) 446-0393', '+12014460393'], john: ['(973) 479-9839', '+19734799839'] };

// Clubs grouped by town, biggest towns first.
function byTown(list) {
  const groups = {};
  for (const c of list) (groups[c.town] = groups[c.town] || []).push(c);
  return Object.entries(groups).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
}

function layout({ title, description, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Poppins:wght@300;400;500&family=Archivo:wght@500;600&display=swap">
<link rel="stylesheet" href="/styles.css">
<link rel="icon" type="image/png" href="/images/favicon.png">
<link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
</head>
<body>
<header class="top">
  <div class="wrap">
    <a class="brand" href="/" aria-label="Country Club Dudes home">${brandMark()}</a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav">Menu</button>
    <nav class="main" id="main-nav" aria-label="Main"><ul>
      <li><a href="/clubs/">Clubs</a></li>
      <li><a href="/new-developments/">New Developments</a></li>
      <li><a href="/#front-nine">Buying guide</a></li>
      <li><a href="/#dudes">Meet the Dudes</a></li>
      <li><a class="btn gold sm" href="/#match">Get my Club Match</a></li>
    </ul></nav>
  </div>
</header>
<main>
${body}
</main>
<footer>
  <div class="wrap">
    <div>
      <a class="brand" href="/" aria-label="Country Club Dudes home">${brandMark()}</a>
      <p>Country Club Dudes at Premier Listings<br>Delray Beach, Florida</p>
    </div>
    <div>
      <h4>Talk to a Dude</h4>
      <a href="tel:${PHONES.shawn[1]}">Shawn Miller, ${PHONES.shawn[0]}</a>
      <a href="tel:${PHONES.john[1]}">John Silverberg, ${PHONES.john[0]}</a>
      <a href="https://www.instagram.com/countryclubdudes/" target="_blank" rel="noopener">Instagram @countryclubdudes</a>
    </div>
    <div>
      <h4>Explore</h4>
      <a href="/clubs/">Club guides</a>
      <a href="/new-developments/">New developments</a>
      <a href="/#match">Club Match</a>
      <p class="legal">John Silverberg and Shawn Miller, Premier Listings. Licensed real estate professionals. Equal Housing Opportunity. Club fees and membership terms change; verify current details with each club.</p>
    </div>
  </div>
</footer>
<script>
  (function () {
    // Mobile menu
    var h = document.querySelector('header.top'), b = h && h.querySelector('.menu-toggle');
    if (b) b.addEventListener('click', function () {
      var open = h.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Hero video: desktop only, and not for people who turn off motion. Phones keep the still.
    var v = document.querySelector('.hero-video'), pause = document.querySelector('.hero-pause');
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(max-width: 700px)').matches;
    if (v && !still) {
      v.querySelectorAll('source[data-src]').forEach(function (s) { s.src = s.getAttribute('data-src'); });
      v.load();
      var p = v.play(); if (p && p.catch) p.catch(function () {});
      v.addEventListener('playing', function () { v.classList.add('on'); });
      if (pause) {
        pause.hidden = false;
        pause.addEventListener('click', function () {
          if (v.paused) { v.play(); pause.textContent = 'Pause'; pause.setAttribute('aria-label', 'Pause background video'); }
          else { v.pause(); pause.textContent = 'Play'; pause.setAttribute('aria-label', 'Play background video'); }
        });
      }
    }

    // Inside the gates: live Instagram reels from Behold. Falls back to the linked tiles.
    var grid = document.querySelector('.reels[data-feed]');
    if (grid && window.fetch) {
      fetch(grid.getAttribute('data-feed')).then(function (r) { return r.json(); }).then(function (data) {
        var posts = Array.isArray(data) ? data : (data.posts || []);
        var reels = posts.filter(function (p) { return p.mediaType === 'VIDEO' || p.isReel; });
        var list = (reels.length >= 4 ? reels : posts).slice(0, 4);
        if (list.length < 4) return;
        var esc = function (t) { var d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; };
        grid.innerHTML = list.map(function (p) {
          var img = (p.sizes && p.sizes.medium && p.sizes.medium.mediaUrl) || p.thumbnailUrl || p.mediaUrl;
          var cap = (p.prunedCaption || p.caption || '').split('\\n')[0];
          if (cap.length > 70) cap = cap.slice(0, 67).replace(/\\s+\\S*$/, '') + '…';
          var when = p.timestamp ? new Date(p.timestamp).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Reel';
          return '<a class="reel has-cover" href="' + esc(p.permalink) + '" target="_blank" rel="noopener" aria-label="Watch on Instagram: ' + esc(cap) + '">' +
            (img ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : '') +
            '<span class="eyebrow">' + esc(when) + '</span><div><h3 class="reel-cap">' + esc(cap || 'Watch the reel') + '</h3><span class="views">Watch on Instagram</span></div></a>';
        }).join('');
      }).catch(function () {});
    }
  })();
</script>
</body>
</html>
`;
}

// Netlify Forms picks this up at deploy time (data-netlify). Submissions email John;
// Follow Up Boss gets them through a Netlify form notification or Zapier later.
// Field names are unchanged from the original build.
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
      <button class="btn gold" type="submit">Send my Club Match</button>
      <p class="form-msg">John gets this right away. No spam, ever.</p>
    </form>`;
}

function clubCards(list, base = CLUBS.base) {
  return `<div class="card-grid">
${list.map((c) => `      <a class="club-card" href="${base}${c.slug}/"><span class="eyebrow">${esc(c.town)}${c.status ? ` · ${esc(c.status)}` : ''}</span><h3>${esc(c.name)}</h3><p>${esc(c.blurb)}</p><span class="go">Read the guide →</span></a>`).join('\n')}
    </div>`;
}

// The Front Nine: questions to ask before buying in any club (from the CCD sample site).
const FRONT_NINE = [
  ['Is membership mandatory with the home?', 'Some clubs require it at closing. Others make it optional, which changes both cost and resale.'],
  ['Equity or non-equity?', 'Equity means you own a share of the club. It affects refunds, transfers and who votes on assessments.'],
  ['What is the initiation or capital contribution, and is any of it refundable?', 'Often a six-figure line item separate from the purchase price.'],
  ['What do the annual dues cover?', 'Golf, sports and social tiers vary a lot, and so does what is included.'],
  ['Is there a food and beverage minimum?', 'A yearly spend you owe whether or not you eat at the club.'],
  ['Any current or pending assessments?', 'Clubhouse and course projects get funded by members, sometimes right after you join.'],
  ['How do tee times work in peak season?', 'Easy access in July can look very different in February.'],
  ['Can you rent before you buy, and do renters get club access?', 'The best way to test a club, if its rules allow it.'],
  ['How long does membership approval take?', 'Applications and board reviews can add weeks to a normal closing timeline.'],
];

function matchSection(club) {
  const head = club
    ? `<p class="eyebrow">Interested in ${esc(club.name)}?</p>
      <h2>Get the real numbers and what's for sale.</h2>
      <p class="intro">Tell us a little about what you want and we'll send current listings, membership costs, and similar clubs worth a look.</p>`
    : `<p class="eyebrow">Club Match</p>
      <h2>Tell us how you play. We'll send your short list.</h2>
      <ol class="steps">
        <li><b>1</b><p>Answer a few quick questions about towns, budget and how you'll use the club.</p></li>
        <li><b>2</b><p>We send two or three clubs that fit, with real dues and what's for sale today.</p></li>
        <li><b>3</b><p>Tour them with us, including the clubhouse and the course.</p></li>
      </ol>`;
  return `<section class="band dark match" id="match">
  <div class="wrap">
    <div>
      ${head}
      <p class="contact-line">Rather talk? Call or text Shawn at <a class="text-link" href="tel:${PHONES.shawn[1]}">${PHONES.shawn[0]}</a> or John at <a class="text-link" href="tel:${PHONES.john[1]}">${PHONES.john[0]}</a>.</p>
    </div>
    ${matchForm(club)}
  </div>
</section>`;
}

function homePage() {
  // Inside the gates: real reels from clubs.json. Clubs marked "featuredReel": true come first,
  // then one reel per town. A cover image at src/images/reels/<slug>.jpg is used when present.
  const withReel = clubs.filter((c) => c.reel);
  const picked = withReel.filter((c) => c.featuredReel);
  for (const [, list] of byTown(clubs)) {
    const c = list.find((x) => x.reel && !picked.includes(x));
    if (c && picked.length < 4) picked.push(c);
  }
  const reels = picked.slice(0, 4);
  const doors = [
    ['Buying in a club', 'Match your golf, social life and budget to the right club before you fall for a house in the wrong one.', 'Get my Club Match', '#match', 'solid'],
    ['Comparing clubs', `Our guides to ${clubs.length} Palm Beach County clubs: what each is known for and what's for sale inside the gates.`, 'Browse the club guides', '/clubs/', 'outline'],
    ['Looking at new construction', "New communities with a club attached. What's being built, what it costs and how membership will work.", 'See new developments', '/new-developments/', 'solid'],
    ['Selling a club home', 'Your buyer picks the club first and the house second. We market the membership and lifestyle alongside the home.', 'Talk through a sale', '#match', 'outline'],
  ];
  return layout({
    title: 'Country Club Dudes | Palm Beach County Country Club Homes',
    description: 'Find the Palm Beach County country club that fits how you live, then the home. Club guides, real dues, and live listings from John Silverberg and Shawn Miller.',
    body: `
<section class="hero hero-full dark" id="top">
  ${heroMedia()}
  <div class="wrap">
    <div class="hero-copy">
      <p class="hero-kicker">Palm Beach County country club real estate</p>
      <h1>Find the right country club. Not just the right home.</h1>
      <p class="lede">We film inside these clubs every week. We'll tell you what the membership really costs, who plays where, and which clubs match how you actually want to spend your days.</p>
      <div class="cta-row">
        <a class="btn gold" href="#match">Get my Club Match</a>
        <a class="btn outline" href="/clubs/">Browse the clubs</a>
      </div>
    </div>
  </div>
</section>

<section class="band light">
  <div class="wrap">
    <div class="sec-head">
      <h2>What brings you here?</h2>
      <p>Pick the closest fit. Each path gets you to the right page and the right conversation.</p>
    </div>
    <div class="doors">
${doors.map(([h, p, cta, href, style]) => `      <div class="door"><h3>${h}</h3><p>${esc(p)}</p><a class="btn ${style} sm" href="${href}">${cta}</a></div>`).join('\n')}
    </div>
  </div>
</section>

<section class="band dark" id="front-nine">
  <div class="wrap split">
    <div class="split-intro">
      <h2>The Front Nine</h2>
      <hr class="rule">
      <p>Nine questions to answer before you buy in any club. Listing sites cover none of them. We can answer all nine for the clubs we cover.</p>
      <div class="cta-row"><a class="btn cream sm" href="#match">Ask us about a specific club</a></div>
    </div>
    <table class="card-table">
      <caption class="hidden-field">Nine questions to ask before buying in a country club</caption>
      <thead><tr><th scope="col">Hole</th><th scope="col">Ask</th><th scope="col">Why it matters</th></tr></thead>
      <tbody>
${FRONT_NINE.map(([q, why], i) => `        <tr><td class="n">${i + 1}</td><td class="q">${esc(q)}</td><td class="why">${esc(why)}</td></tr>`).join('\n')}
      </tbody>
    </table>
  </div>
</section>

<section class="band light" id="clubs">
  <div class="wrap">
    <div class="sec-head">
      <h2>Explore clubs by town</h2>
      <p>Each guide covers what the club is known for, membership, and current homes for sale. <a class="text-link" href="/clubs/">See all ${clubs.length} clubs →</a></p>
    </div>
    <div class="towns">
${byTown(clubs).map(([town, list]) => `      <div class="town-col"><h3>${esc(town)}</h3>
${list.map((c) => `        <a href="/clubs/${c.slug}/">${esc(c.name)}</a>`).join('\n')}
      </div>`).join('\n')}
    </div>
  </div>
</section>

${matchSection(null)}

<section class="band light" id="reels">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="eyebrow">@countryclubdudes</p><h2 style="margin-top:12px">Inside the gates</h2></div>
      <p>We film inside these clubs every week. <a class="text-link" href="https://www.instagram.com/countryclubdudes/" target="_blank" rel="noopener">See every reel on Instagram →</a></p>
    </div>
    <div class="reels"${BEHOLD_FEED_ID ? ` data-feed="https://feeds.behold.so/${BEHOLD_FEED_ID}"` : ''}>
${reels.map((c) => { const cover = ['jpg', 'png', 'webp'].map((x) => `reels/${c.slug}.${x}`).find(hasImage); return `      <a class="reel${cover ? ' has-cover' : ''}" href="${esc(c.reel)}" target="_blank" rel="noopener" aria-label="Watch our ${esc(c.name)} reel on Instagram">${cover ? `<img src="/images/${cover}" alt="" loading="lazy">` : ''}<span class="eyebrow">${esc(c.town)}</span><div><h3>${esc(c.name)}</h3><span class="views">Watch the reel</span></div></a>`; }).join('\n')}
    </div>
  </div>
</section>

<section class="band dark-2" id="dudes">
  <div class="wrap">
    <div class="sec-head">
      <h2>Meet the Dudes</h2>
      <p>Two guys who play the courses, eat in the grill rooms and ask the membership director the awkward questions so you don't have to.</p>
    </div>
    <div class="about-intro" id="about">
      <p>We're the Country Club Dudes. We sell homes in Palm Beach County's country club communities, and we film what it's actually like to live in them.</p>
      <p>Buying into a club is two decisions: the house and the membership. We help you get both right, starting with the club.</p>
    </div>
    <div class="dudes">
${[['Shawn Miller', 'shawn', 'shawn.jpg', 'Shawn, candid on course'], ['John Silverberg', 'john', 'john.jpg', 'John, candid at the clubhouse']].map(([name, key, file, label]) => `      <article class="dude">
        ${photo(file, name, label, 'dude-photo')}
        <div class="dude-copy">
          <h3>${name}</h3>
          <p class="role">REALTOR®, Premier Listings</p>
          <p class="ph-text">[Two sentences on ${name.split(' ')[0]}'s background, and the club detail he always checks first.]</p>
          <a class="text-link" href="tel:${PHONES[key][1]}">${PHONES[key][0]}</a>
        </div>
      </article>`).join('\n')}
    </div>
    <figure class="quote">
      <blockquote class="ph-text">“[Client quote that mentions the club guidance, not just the house.]”</blockquote>
      <figcaption>[Client first name], bought in [Club name], [Town]</figcaption>
    </figure>
  </div>
</section>`,
  });
}

function pageHero(eyebrow, h1, lede) {
  return `<section class="page-hero dark">
  <div class="wrap">
    <p class="eyebrow">${eyebrow}</p>
    <h1>${h1}</h1>
    ${lede ? `<p class="lede">${lede}</p>` : ''}
  </div>
</section>`;
}

function developmentsIndex() {
  const list = developments.length
    ? clubCards(developments, DEVS.base)
    : `<div class="listings">
        <p class="pending">We're adding new construction communities here soon.</p>
        <p>Looking at a new build? Send a Club Match and tell us which developments you're watching. We'll send floor plans, pricing, and what the club will offer.</p>
        <a class="btn solid" href="/#match">Send a Club Match</a>
      </div>`;
  return layout({
    title: 'New Country Club Developments | Country Club Dudes',
    description: 'New construction country club communities in Palm Beach County: what is being built, pricing, and how membership will work.',
    body: `
${pageHero('New developments', 'New club communities', "New construction with a club attached. We track what's being built, what it costs, and how membership will work.")}
<section class="band light">
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
${pageHero('Club guides', 'Every club we cover', `${clubs.length} Palm Beach County clubs, grouped by town. Pick one to see homes for sale and what membership costs.`)}
<section class="band light">
  <div class="wrap">
${byTown(clubs).map(([town, list]) => `    <div class="town-group"><h2>${esc(town)}</h2>
    ${clubCards(list)}
    </div>`).join('\n')}
  </div>
</section>`,
  });
}

// Club scorecard rows. Fill in per club with an optional "scorecard" object in clubs.json,
// e.g. "scorecard": {"Golf": "Two 18-hole courses", "Dining": "..."}
const AMENITIES = ['Golf', 'Tennis, pickleball & padel', 'Fitness & spa', 'Pools', 'Dining', 'Kids & family', 'Social & events', 'Security & gates'];

function clubPage(club, section = CLUBS) {
  const sc = club.scorecard || {};
  const ask = '<span class="ph-text">Ask the Dudes</span>';
  const listings = club.idx
    ? `<div id="listings">${club.idx}</div>`
    : `<div class="listings" id="listings">
        <p class="pending">Live listings for ${esc(club.name)} are coming soon.</p>
        <p>Want to see what's for sale here today? Send a Club Match below and John will send you every active listing.</p>
        <a class="btn solid" href="#match">Send me the listings</a>
      </div>`;
  const nearby = (section === DEVS ? developments : clubs).filter((c) => c.town === club.town && c.slug !== club.slug);
  return layout({
    title: `${club.name} Homes for Sale, ${club.town} | Country Club Dudes`,
    description: `${club.name} in ${club.town}: homes for sale, membership, and what it's like to live there.`,
    body: `
<section class="hero club-hero dark">
  <div class="wrap">
    <div class="hero-copy">
      <p class="crumbs"><a href="${section.base}">${section.label}</a> / ${esc(club.town)}</p>
      <p class="eyebrow">${esc(club.town)}${club.status ? ` · ${esc(club.status)}` : ''}</p>
      <h1>${esc(club.name)}</h1>
      <p class="lede">${esc(club.blurb)}</p>
      <div class="cta-row">
        <a class="btn gold" href="#listings">See homes for sale</a>
        <a class="btn outline" href="#match">Ask about this club</a>
      </div>
    </div>
    ${photo(club.photo, club.name, `${club.name}: clubhouse, course or aerial`)}
  </div>
</section>

<section class="band light">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="eyebrow">The first two holes</p><h2 style="margin-top:12px">Membership at a glance</h2></div>
      <p>Membership terms change, so confirm current details with us or the club before you buy.</p>
    </div>
    <div class="glance">
      <div><span class="eyebrow">Membership with the home</span><strong>${club.membership ? esc(club.membership) : ask}</strong></div>
      <div><span class="eyebrow">Equity structure</span><strong>${club.equity ? esc(club.equity) : ask}</strong></div>
      <div><span class="eyebrow">Details last verified</span><strong>${club.verified ? esc(club.verified) : ask}</strong></div>
    </div>
${club.reel ? `    <div class="reel-strip"><div><p class="eyebrow" style="color:var(--gold)">Watch</p><h3 style="margin-top:8px">See ${esc(club.name)} through our camera</h3></div><a class="btn gold" href="${esc(club.reel)}" target="_blank" rel="noopener">Watch the reel</a></div>` : ''}
  </div>
</section>

<section class="band light" style="padding-top:0">
  <div class="wrap split">
    <div class="split-intro">
      <h2>The Scorecard</h2>
      <hr class="rule">
      <p>Amenities at a glance, hole by hole. Offerings change, so confirm before you buy.</p>
      <div class="cta-row"><a class="btn solid sm" href="#match">Ask us how it compares</a></div>
    </div>
    <table class="card-table">
      <caption class="hidden-field">${esc(club.name)} amenities</caption>
      <thead><tr><th scope="col">Hole</th><th scope="col">Amenity</th><th scope="col">What's here</th></tr></thead>
      <tbody>
${AMENITIES.map((a, i) => `        <tr><td class="n">${i + 1}</td><td class="q">${a}</td><td class="why">${sc[a] ? esc(sc[a]) : ask}</td></tr>`).join('\n')}
        <tr><td class="n">9</td><td class="q">The bottom line</td><td class="why">${esc(club.blurb)}</td></tr>
      </tbody>
    </table>
  </div>
</section>

<section class="band sand">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">For sale now</p><h2 style="margin-top:12px">Homes for sale inside the gates</h2></div>
      <p>See one you like? Ask us about the club costs that come with it before you book a showing.</p></div>
    ${listings}
  </div>
</section>

${matchSection(club)}
${nearby.length ? `
<section class="band light">
  <div class="wrap">
    <div class="sec-head"><h2>More clubs in ${esc(club.town)}</h2><p><a class="text-link" href="/clubs/">See all clubs →</a></p></div>
    ${clubCards(nearby.slice(0, 3), section.base)}
  </div>
</section>` : ''}`,
  });
}

function thanksPage() {
  return layout({
    title: 'Thanks | Country Club Dudes',
    description: 'Thanks for reaching out to the Country Club Dudes.',
    body: `
<section class="page-hero dark" style="min-height:60vh">
  <div class="wrap">
    <p class="eyebrow">Club Match received</p>
    <h1>Got it. We'll be in touch soon.</h1>
    <p class="lede">John or Shawn will reach out with your short list, usually the same day.</p>
    <div class="cta-row"><a class="btn gold" href="/clubs/">Keep browsing clubs</a></div>
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
write('new-developments/index.html', developmentsIndex());
for (const dev of developments) write(`new-developments/${dev.slug}/index.html`, clubPage(dev, DEVS));
write('thanks/index.html', thanksPage());
const SITE = 'https://countryclubdudes.com';
const urls = ['/', '/clubs/', ...clubs.map((c) => `/clubs/${c.slug}/`), '/new-developments/', ...developments.map((d) => `/new-developments/${d.slug}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Built ${clubs.length} club pages and ${developments.length} new development pages into dist/`);
