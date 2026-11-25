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
// Site-wide settings: live URL, Google Analytics / Search Console, home page bios and client quote.
const SITE_CFG = JSON.parse(fs.readFileSync(path.join(SRC, 'site.json'), 'utf8'));
const SITE = SITE_CFG.url.replace(/\/$/, '');

// The Journal: one Markdown file per article in src/journal/ (see src/journal/README.md).
// Front matter between --- lines: title, description, date (YYYY-MM-DD), author, topic, image, clubs, draft.
const JOURNAL_DIR = path.join(SRC, 'journal');
function readPost(file) {
  const raw = fs.readFileSync(path.join(JOURNAL_DIR, file), 'utf8').replace(/\r\n/g, '\n');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta = {};
  if (m) m[1].split('\n').forEach((line) => { const i = line.indexOf(':'); if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, ''); });
  const body = m ? m[2] : raw;
  const words = body.split(/\s+/).filter(Boolean).length;
  return {
    slug: file.replace(/\.md$/, ''), title: meta.title || file, description: meta.description || '',
    date: meta.date || '', author: meta.author || 'The Country Club Dudes', topic: meta.topic || 'Buying guide',
    image: meta.image || '', clubs: (meta.clubs || '').split(',').map((x) => x.trim()).filter(Boolean),
    draft: /^(true|yes)$/i.test(meta.draft || ''), minutes: Math.max(1, Math.round(words / 230)), body,
  };
}
const POSTS = (fs.existsSync(JOURNAL_DIR) ? fs.readdirSync(JOURNAL_DIR).filter((f) => f.endsWith('.md') && f !== 'README.md') : [])
  .map(readPost).filter((p) => !p.draft && p.date).sort((a, b) => b.date.localeCompare(a.date));
// The Search menu and its pages (see src/search.json).
const SEARCH = JSON.parse(fs.readFileSync(path.join(SRC, 'search.json'), 'utf8'));
const FEATURES = [...SEARCH.lifestyle, ...SEARCH.membership];
// Optional src/idx.json (results URL and saved-link URLs) from an IDX sync step; not used by default.
const IDX = fs.existsSync(path.join(SRC, 'idx.json')) ? JSON.parse(fs.readFileSync(path.join(SRC, 'idx.json'), 'utf8')) : { links: {} };
// MLS subdivision names per club / community, used to link each page to its live IDX search.
const SUBS = fs.existsSync(path.join(SRC, 'idx-subdivisions.json')) ? JSON.parse(fs.readFileSync(path.join(SRC, 'idx-subdivisions.json'), 'utf8')) : {};
// A link to the IDX Broker results page with these search fields (plus heroSearch.fixed).
function idxUrl(pairs) {
  const hs = SEARCH.heroSearch || {};
  const base = hs.action || IDX.resultsUrl;
  if (!base) return '';
  const u = new URL(base);
  Object.entries(hs.fixed || {}).forEach(([k, v]) => u.searchParams.append(k, v));
  pairs.forEach(([k, v]) => u.searchParams.append(k, v));
  return u.toString();
}
// An entry is a list of names, or { "city": "<town>", "names": [...] } when the names are common
// enough that the search must also be limited to that town (city IDs from heroSearch.cityIds).
const communityUrl = (slug) => {
  const e = SUBS[slug];
  const names = Array.isArray(e) ? e : (e && e.names) || [];
  if (!names.length) return '';
  const cityId = e && e.city && ((SEARCH.heroSearch || {}).cityIds || {})[e.city];
  return idxUrl([...(cityId ? [['city[]', cityId]] : []), ...names.map((v) => ['a_subdivision[]', v])]);
};
const allHomesUrl = () => idxUrl(Object.values((SEARCH.heroSearch || {}).cityIds || {}).map((id) => ['city[]', id]));
// Communities without a club: same fields as a club (name, slug, town, blurb, tags, idx, photo).
const communities = readList('communities.json');
const COMMS = { base: '/communities/', label: 'Communities' };
const CLUBS = { base: '/clubs/', label: 'Clubs' };
const DEVS = { base: '/new-developments/', label: 'New developments' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function write(rel, html) {
  // Canonical and share-preview URL for this page, from its path in dist/.
  const urlPath = '/' + rel.replace(/index\.html$/, '').replace(/^\/+/, '');
  if (typeof html === 'string') html = html.split('__PAGE_URL__').join(SITE + (rel === '404.html' ? '/' : urlPath));
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
// Photo slot: shows the image when the file exists. With no photo, nothing is shown (the hero goes
// single-column via heroClass), so no placeholder ever appears on the live site.
function photo(file, alt, label, cls = 'ph') {
  if (file && hasImage(file)) return `<div class="${cls === 'ph' ? 'hero-photo' : cls}"><img src="/images/${esc(file)}" alt="${esc(alt)}"${cls === 'ph' ? ' fetchpriority="high"' : ' loading="lazy"'}></div>`;
  return '';
}
const heroClass = (file) => (file && hasImage(file) ? '' : ' no-photo');

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

function layout({ title, description, body, image, type = 'website', noindex = false, jsonld = '' }) {
  const shareImg = SITE + '/images/' + (image && hasImage(image) ? image : 'share/ccd-share.jpg');
  const ga = SITE_CFG.googleAnalyticsId;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : '<link rel="canonical" href="__PAGE_URL__">'}
<meta property="og:site_name" content="Country Club Dudes">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="__PAGE_URL__">
<meta property="og:image" content="${shareImg}">
<meta name="twitter:card" content="summary_large_image">
${SITE_CFG.googleSiteVerification ? `<meta name="google-site-verification" content="${esc(SITE_CFG.googleSiteVerification)}">` : ''}
${ga ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(ga)}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${esc(ga)}');</script>` : ''}
${jsonld ? `<script type="application/ld+json">${jsonld.replace(/</g, '\\u003c')}</script>` : ''}
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
      <li class="has-sub">
        <button class="sub-toggle" type="button" aria-expanded="false" aria-controls="sub-search">Search <span aria-hidden="true">▾</span></button>
        ${searchMenu()}
      </li>
      ${POSTS.length ? '<li><a href="/journal/">Journal</a></li>' : '<li><a href="/#front-nine">Buying guide</a></li>'}
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
      <a href="/search/">Search all homes</a>
      <a href="/search/no-club/">Communities without a club</a>
${developments.length ? '      <a href="/new-developments/">New developments</a>\n' : ''}${POSTS.length ? '      <a href="/journal/">Journal</a>\n' : ''}      <a href="/#match">Club Match</a>
      <a href="/privacy/">Privacy policy</a>
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

    // Search dropdown: click/tap to open; closes on outside click or Escape.
    document.querySelectorAll('.has-sub').forEach(function (li) {
      var t = li.querySelector('.sub-toggle');
      t.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = li.classList.toggle('open');
        t.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
    document.addEventListener('click', function () {
      document.querySelectorAll('.has-sub.open').forEach(function (li) { li.classList.remove('open'); li.querySelector('.sub-toggle').setAttribute('aria-expanded', 'false'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') document.querySelectorAll('.has-sub.open').forEach(function (li) { li.classList.remove('open'); var t = li.querySelector('.sub-toggle'); t.setAttribute('aria-expanded', 'false'); t.focus(); });
    });

    // Hero search bar: typeahead for our clubs and communities, then hands off to IDX Broker.
    var hs = document.querySelector('.hero-search');
    if (hs) {
      var cfg = JSON.parse(document.getElementById('hs-config').textContent);
      var q = hs.querySelector('#hs-q'), list = hs.querySelector('#hs-list'), active = -1, items = [];
      var norm = function (t) { return (t || '').toLowerCase().replace(/[^a-z0-9 ]/g, ''); };
      var escH = function (t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; };
      function close() { list.hidden = true; q.setAttribute('aria-expanded', 'false'); active = -1; q.removeAttribute('aria-activedescendant'); }
      function render() {
        var v = norm(q.value); if (v.length < 2) { close(); return; }
        var type = hs.querySelector('input[name="hs-type"]:checked').value;
        var places = cfg.places.filter(function (p) { return norm(p.n).indexOf(v) > -1 && (type === 'all' || (type === 'club') === (p.k === 'Club')); }).slice(0, 5);
        var towns = cfg.towns.filter(function (t) { return norm(t).indexOf(v) > -1; }).slice(0, 3);
        items = places.map(function (p) { return { label: p.n, sub: p.t + ' · ' + (p.k === 'Club' ? 'Club guide' : 'Community'), url: p.u }; })
          .concat(towns.map(function (t) { return { label: 'Homes in ' + t, sub: 'Search listings', town: t }; }));
        if (!items.length) { close(); return; }
        list.innerHTML = items.map(function (it, i) { return '<li role="option" id="hs-o' + i + '" data-i="' + i + '"><b>' + escH(it.label) + '</b><span>' + escH(it.sub) + '</span></li>'; }).join('');
        list.hidden = false; q.setAttribute('aria-expanded', 'true');
      }
      function pick(it) { if (it.url) { location.href = it.url; return; } q.value = it.town; close(); submit(); }
      function setActive(i) {
        var opts = list.querySelectorAll('li'); if (!opts.length) return;
        active = (i + opts.length) % opts.length;
        opts.forEach(function (o, j) { o.setAttribute('aria-selected', j === active ? 'true' : 'false'); });
        q.setAttribute('aria-activedescendant', 'hs-o' + active);
      }
      function submit() {
        var type = hs.querySelector('input[name="hs-type"]:checked').value;
        var price = hs.querySelector('#hs-price').value, beds = hs.querySelector('#hs-beds').value, where = q.value.trim();
        var base = type === 'all' ? cfg.action : cfg.tabs[type];
        if (!base) { location.href = type === 'club' ? '/clubs/' : type === 'noClub' ? '/search/no-club/' : '/search/'; return; }
        var u = new URL(base, location.href);
        Object.keys(cfg.fixed).forEach(function (k) { u.searchParams.append(k, cfg.fixed[k]); });
        // A 5-digit ZIP filters by ZIP; a known town filters by that town; anything else (or blank)
        // searches all of our towns, matching the "Search homes for sale" buttons.
        if (/^\\d{5}$/.test(where)) u.searchParams.append('zipcode[]', where);
        else {
          var cid = where && cfg.cityIds[Object.keys(cfg.cityIds).filter(function (t) { return norm(t) === norm(where); })[0]];
          (cid ? [cid] : Object.keys(cfg.cityIds).map(function (t) { return cfg.cityIds[t]; })).forEach(function (id) { u.searchParams.append('city[]', id); });
        }
        if (price && cfg.params.maxPrice) u.searchParams.append(cfg.params.maxPrice, price);
        if (beds && cfg.params.minBeds) u.searchParams.append(cfg.params.minBeds, beds);
        location.href = u.toString();
      }
      q.addEventListener('input', render);
      q.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) render(); setActive(active + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
        else if (e.key === 'Enter' && !list.hidden && active > -1) { e.preventDefault(); pick(items[active]); }
        else if (e.key === 'Escape') close();
      });
      list.addEventListener('mousedown', function (e) { var li = e.target.closest('li'); if (li) { e.preventDefault(); pick(items[+li.getAttribute('data-i')]); } });
      q.addEventListener('blur', function () { setTimeout(close, 120); });
      hs.addEventListener('change', function (e) { if (e.target.name === 'hs-type') render(); });
      hs.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
    }

    // Journal topic filter.
    document.querySelectorAll('.journal-filter').forEach(function (seg) {
      seg.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        var t = b.getAttribute('data-topic');
        seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        document.querySelectorAll('.post-card').forEach(function (c) { c.hidden = !(t === 'all' || c.getAttribute('data-topic') === t); });
      });
    });

    // All / With a club / Without a club toggle on lifestyle pages.
    document.querySelectorAll('.seg').forEach(function (seg) {
      var wrap = seg.closest('.wrap'), cards = wrap.querySelectorAll('.club-card[data-type]'), empty = wrap.querySelector('.filter-empty');
      seg.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        var show = b.getAttribute('data-show'), n = 0;
        seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        cards.forEach(function (c) { var on = show === 'all' || c.getAttribute('data-type') === show; c.hidden = !on; if (on) n++; });
        if (empty) empty.hidden = n > 0;
      });
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
      <label class="consent" for="${id}-consent"><input type="checkbox" id="${id}-consent" name="consent" value="Agreed to calls, texts and email" required>
        <span>By checking this box, I agree that Country Club Dudes and Premier Listings may contact me by phone call, text message and email at the number and email above about real estate, including calls and texts sent using automated technology. Consent isn't a condition of buying or selling. Message and data rates may apply; message frequency varies. Reply STOP to opt out of texts or HELP for help. See our <a href="/privacy/">Privacy Policy</a>.</span></label>
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

// Hero search bar. Wiring to IDX Broker lives in src/search.json ("heroSearch").
function heroSearch() {
  const hs = SEARCH.heroSearch || {};
  const places = [
    ...clubs.map((c) => ({ n: c.name, t: c.town, u: `${CLUBS.base}${c.slug}/`, k: 'Club' })),
    ...communities.map((c) => ({ n: c.name, t: c.town, u: `${COMMS.base}${c.slug}/`, k: 'Community' })),
  ];
  const towns = [...new Set([...clubs, ...communities].map((c) => c.town))].sort();
  const tabs = { club: (hs.tabs || {}).club || IDX.links['search-club'] || '', noClub: (hs.tabs || {}).noClub || IDX.links['search-noClub'] || '' };
  const cfg = { action: hs.action || IDX.resultsUrl || '', params: hs.params || {}, tabs, fixed: hs.fixed || {}, cityIds: hs.cityIds || {}, places, towns };
  return `<form class="hero-search" role="search" action="/search/" method="get" novalidate>
        <div class="hs-tabs" role="radiogroup" aria-label="Type of community">
          <label><input type="radio" name="hs-type" value="all" checked><span>All homes</span></label>
          <label><input type="radio" name="hs-type" value="club"><span>With a club</span></label>
          <label><input type="radio" name="hs-type" value="noClub"><span>Without a club</span></label>
        </div>
        <div class="hs-bar">
          <div class="hs-field hs-where">
            <label for="hs-q">Where</label>
            <input id="hs-q" type="text" autocomplete="off" placeholder="Club, community, city or ZIP" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="hs-list">
            <ul class="hs-list" id="hs-list" role="listbox" hidden></ul>
          </div>
          <div class="hs-field">
            <label for="hs-price">Max price</label>
            <select id="hs-price"><option value="">Any price</option><option value="750000">$750K</option><option value="1000000">$1M</option><option value="1500000">$1.5M</option><option value="2500000">$2.5M</option><option value="5000000">$5M</option><option value="10000000">$10M</option></select>
          </div>
          <div class="hs-field">
            <label for="hs-beds">Beds</label>
            <select id="hs-beds"><option value="">Any</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option><option value="5">5+</option></select>
          </div>
          <button class="btn gold hs-go" type="submit"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span>Search</span></button>
        </div>
        <script type="application/json" id="hs-config">${JSON.stringify(cfg).replace(/</g, '\\u003c')}</script>
      </form>`;
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
    ['Buying outside a club, or not sure yet', "Not everyone wants dues. We'll lay out the tradeoff honestly and show you homes with or without a membership attached.", 'Communities without a club', '/search/no-club/', 'outline'],
    ['Comparing clubs', `Our guides to ${clubs.length} Palm Beach County clubs: what each is known for and what's for sale inside the gates.`, 'Browse the club guides', '/clubs/', 'solid'],
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
      ${heroSearch()}
      <p class="hero-alt">Not sure where to start? <a class="text-link" href="#match">Get my Club Match →</a> <span aria-hidden="true">·</span> <a class="text-link" href="/clubs/">Browse the clubs</a></p>
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
      <div class="cta-row"><a class="btn cream sm" href="#match">Ask us about a specific club</a>${POSTS.find((p) => p.slug === 'the-front-nine') ? '<a class="text-link" href="/journal/the-front-nine/">Read the full guide →</a>' : ''}</div>
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

${POSTS.length >= 3 ? `<section class="band sand" id="journal">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">The Journal</p><h2 style="margin-top:12px">Club guides and buying advice</h2></div><p><a class="text-link" href="/journal/">See all articles →</a></p></div>
    ${postCards(POSTS.slice(0, 3))}
  </div>
</section>

` : ''}${matchSection(null)}

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
          ${(SITE_CFG.bios || {})[key] ? `<p>${esc(SITE_CFG.bios[key])}</p>` : ''}
          <a class="text-link" href="tel:${PHONES[key][1]}">${PHONES[key][0]}</a>
        </div>
      </article>`).join('\n')}
    </div>
${(SITE_CFG.clientQuote || {}).text ? `    <figure class="quote">
      <blockquote>“${esc(SITE_CFG.clientQuote.text)}”</blockquote>
      <figcaption>${esc([SITE_CFG.clientQuote.name, SITE_CFG.clientQuote.club && `bought in ${SITE_CFG.clientQuote.club}`, SITE_CFG.clientQuote.town].filter(Boolean).join(', '))}</figcaption>
    </figure>` : ''}
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

// Listings for one club or community. Three sources, in order:
//  1. src/listings/<slug>.json, written at build time from the IDX Broker API (see DESIGN-HANDOFF.md).
//     Shape: { "total": 14, "url": "<IDX saved link for all homes here>", "updated": "2026-11-12",
//              "disclaimer": "...", "items": [ { "price": 1250000, "status": "New", "address": "...",
//              "city": "Boca Raton", "beds": 3, "baths": 3.5, "sqft": 2850, "photo": "https://...",
//              "url": "<IDX listing detail URL>", "courtesy": "Listing brokerage name" } ] }
//  2. "idx" on the club: an IDX Broker widget embed, shown as-is.
//  3. Neither: a "coming soon" panel with the Club Match form.
function listingsBlock(c) {
  const head = (count) => `<div class="sec-head"><div><p class="eyebrow">For sale now${count ? ` · ${count} home${count === 1 ? '' : 's'}` : ''}</p><h2 style="margin-top:12px">Homes for sale inside the gates</h2></div>
      <p>See one you like? Ask us about the club costs that come with it before you book a showing.</p></div>`;
  const file = path.join(SRC, 'listings', `${c.slug}.json`);
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const items = (Array.isArray(data) ? data : data.items || []).slice(0, 6);
    const total = data.total || items.length;
    if (items.length) {
      const money = (n) => '$' + Number(n).toLocaleString('en-US');
      const memb = c.membership ? `Membership: ${esc(c.membership)}` : 'Ask us what membership costs here';
      return `${head(total)}
    ${data.sample ? '<p class="sample-note">Sample listings for design preview. Not real MLS data.</p>' : ''}
    <div class="listing-grid" id="listings">
${items.map((l) => `      <a class="listing" href="${esc(l.url || data.url || '#match')}"${l.url ? ' target="_blank" rel="noopener"' : ''}>
        <div class="listing-photo">${l.photo ? `<img src="${esc(l.photo)}" alt="${esc(l.address)}" loading="lazy">` : ''}${l.status ? `<span class="listing-status">${esc(l.status)}</span>` : ''}</div>
        <div class="listing-body">
          <p class="listing-price">${money(l.price)}</p>
          <p class="listing-facts">${[l.beds && `${l.beds} bd`, l.baths && `${l.baths} ba`, l.sqft && `${Number(l.sqft).toLocaleString('en-US')} sq ft`].filter(Boolean).join(' · ')}</p>
          <p class="listing-addr">${esc(l.address)}${l.city ? `, ${esc(l.city)}` : ''}</p>
          <p class="listing-club">${memb}</p>
          ${l.courtesy ? `<p class="listing-courtesy">Courtesy of ${esc(l.courtesy)}</p>` : ''}
        </div>
      </a>`).join('\n')}
    </div>
    <div class="listing-foot">
      ${data.url ? `<a class="btn solid" href="${esc(data.url)}"${data.sample ? '' : ' target="_blank" rel="noopener"'}>See all ${total} homes in ${esc(c.name)}</a>` : ''}
      <a class="btn outline" href="#match">Get alerts for new listings</a>
    </div>
    ${data.disclaimer ? `<p class="idx-disclaimer">${esc(data.disclaimer)}${data.updated ? ` Updated ${esc(data.updated)}.` : ''}</p>` : ''}`;
    }
  }
  if (c.idx) return `${head(0)}\n    <div id="listings" class="idx">${c.idx}</div>`;
  const live = communityUrl(c.slug);
  if (live) return `${head(0)}
    <div class="listings" id="listings">
        <p class="pending">See every home for sale in ${esc(c.name)} right now, live from the MLS.</p>
        <p>Find one you like? Ask us what the club and HOA costs are before you book a showing.</p>
        <div class="cta-row"><a class="btn solid" href="${esc(live)}" target="_blank" rel="noopener">See homes for sale in ${esc(c.name)}</a><a class="btn outline" href="#match">Get alerts for new listings</a></div>
      </div>`;
  return `${head(0)}
    <div class="listings" id="listings">
        <p class="pending">Live listings for ${esc(c.name)} are coming soon.</p>
        <p>Want to see what's for sale here today? Send a Club Match below and John will send you every active listing.</p>
        <a class="btn solid" href="#match">Send me the listings</a>
      </div>`;
}

// Hero "See homes for sale" button: opens the live IDX search for this club or community when there is
// one, otherwise scrolls to the listings section on the page.
function heroListingsBtn(c) {
  const live = !c.idx && communityUrl(c.slug);
  return live
    ? `<a class="btn gold" href="${esc(live)}" target="_blank" rel="noopener">See homes for sale</a>`
    : `<a class="btn gold" href="#listings">See homes for sale</a>`;
}

// Membership at a glance: only the facts that are filled in. Hidden entirely when there are none
// (the reel strip still shows on its own).
function glanceSection(club) {
  const facts = [['Membership with the home', club.membership], ['Equity structure', club.equity], ['Details last verified', club.verified]].filter(([, v]) => v);
  const reel = club.reel ? `    <div class="reel-strip"${facts.length ? '' : ' style="margin-top:0"'}><div><p class="eyebrow" style="color:var(--gold)">Watch</p><h3 style="margin-top:8px">See ${esc(club.name)} through our camera</h3></div><a class="btn gold" href="${esc(club.reel)}" target="_blank" rel="noopener">Watch the reel</a></div>` : '';
  if (!facts.length && !reel) return '';
  return `<section class="band light">
  <div class="wrap">
${facts.length ? `    <div class="sec-head">
      <div><p class="eyebrow">The first two holes</p><h2 style="margin-top:12px">Membership at a glance</h2></div>
      <p>Membership terms change, so confirm current details with us or the club before you buy.</p>
    </div>
    <div class="glance" style="grid-template-columns:repeat(${facts.length},minmax(0,1fr))">
${facts.map(([k, v]) => `      <div><span class="eyebrow">${k}</span><strong>${esc(v)}</strong></div>`).join('\n')}
    </div>
` : ''}${reel}
  </div>
</section>
`;
}

// The Scorecard: only amenities that are filled in, plus the bottom line. Hidden when none are filled.
function scorecardSection(club) {
  const sc = club.scorecard || {};
  const rows = AMENITIES.filter((a) => sc[a]);
  if (!rows.length) return '';
  return `<section class="band light"${club.membership || club.equity || club.verified || club.reel ? ' style="padding-top:0"' : ''}>
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
${rows.map((a, i) => `        <tr><td class="n">${i + 1}</td><td class="q">${a}</td><td class="why">${esc(sc[a])}</td></tr>`).join('\n')}
        <tr><td class="n">${rows.length + 1}</td><td class="q">The bottom line</td><td class="why">${esc(club.blurb)}</td></tr>
      </tbody>
    </table>
  </div>
</section>
`;
}

function clubPage(club, section = CLUBS) {
  const listings = listingsBlock(club);
  const nearby = (section === DEVS ? developments : clubs).filter((c) => c.town === club.town && c.slug !== club.slug);
  return layout({
    title: `${club.name} Homes for Sale, ${club.town} | Country Club Dudes`,
    description: `${club.name} in ${club.town}: homes for sale, membership, and what it's like to live there.`,
    image: club.photo,
    body: `
<section class="hero club-hero dark${heroClass(club.photo)}">
  <div class="wrap">
    <div class="hero-copy">
      <p class="crumbs"><a href="${section.base}">${section.label}</a> / ${esc(club.town)}</p>
      <p class="eyebrow">${esc(club.town)}${club.status ? ` · ${esc(club.status)}` : ''}</p>
      <h1>${esc(club.name)}</h1>
      <p class="lede">${esc(club.blurb)}</p>
${tagRow(club)}
      <div class="cta-row">
        ${heroListingsBtn(club)}
        <a class="btn outline" href="#match">Ask about this club</a>
      </div>
    </div>
    ${photo(club.photo, club.name, `${club.name}: clubhouse, course or aerial`)}
  </div>
</section>

${glanceSection(club)}${scorecardSection(club)}
<section class="band sand">
  <div class="wrap">
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

// Search menu entries, keyed the way search.json "menu" refers to them.
function menuEntry(key) {
  if (key === 'all') return { key, href: '/search/', label: SEARCH.all.label, group: 'find', cls: 'sub-all' };
  if (key === 'clubs') return { key, href: '/clubs/', label: 'Club communities', group: 'find' };
  if (key === 'no-club') return { key, href: '/search/no-club/', label: SEARCH.noClub.label, group: 'find' };
  if (key === 'new-developments') return developments.length ? { key, href: '/new-developments/', label: 'New developments', group: 'find' } : null;
  const life = SEARCH.lifestyle.find((c) => c.slug === key);
  if (life) return { key, href: `/search/${key}/`, label: life.label, group: 'lifestyle' };
  const mem = SEARCH.membership.find((c) => c.slug === key);
  if (mem) return { key, href: `/search/${key}/`, label: mem.label, group: 'membership' };
  return null;
}
const MENU = (SEARCH.menu || ['all']).map(menuEntry).filter(Boolean);
// Only categories in the menu get pages, tags and sitemap entries. The rest wait until they're added back.
const LIVE = FEATURES.filter((f) => (SEARCH.menu || []).includes(f.slug));
const isLive = (slug) => LIVE.some((f) => f.slug === slug);

// 6 or fewer items: one simple list. 7 or more: three labeled columns.
function searchMenu() {
  const link = (e) => `<li><a${e.cls ? ` class="${e.cls}"` : ''} href="${e.href}">${esc(e.label)}</a></li>`;
  if (MENU.length <= 6) {
    return `<div class="sub simple" id="sub-search"><ul>
            ${MENU.map(link).join('\n            ')}
          </ul></div>`;
  }
  const groups = [['find', 'Find a home'], ['lifestyle', 'By lifestyle'], ['membership', 'By membership']]
    .map(([g, h]) => [h, MENU.filter((e) => e.group === g)]).filter(([, items]) => items.length);
  return `<div class="sub mega" id="sub-search">
${groups.map(([h, items]) => `          <div class="mega-col"><p class="mega-h">${h}</p><ul>
            ${items.map(link).join('\n            ')}
          </ul></div>`).join('\n')}
        </div>`;
}

function searchNav(active) {
  // Same items as the Search menu, so the two always match.
  return `<nav class="chip-nav" aria-label="Search by">${MENU.map((e) => `<a href="${e.href}"${e.key === active ? ' aria-current="page"' : ''}>${esc(e.key === 'all' ? 'All homes' : e.label)}</a>`).join('')}</nav>`;
}

function idxBlock(embed, what, note) {
  const live = allHomesUrl();
  return embed
    ? `<div class="idx">${embed}</div>`
    : live ? `<div class="listings" id="listings">
        <p class="pending">${note || 'Search every home for sale across the towns we cover, live from the MLS.'}</p>
        <p>Filter by price, beds, and town on the search page. Questions about a club or HOA? Ask us anytime.</p>
        <div class="cta-row"><a class="btn solid" href="${esc(live)}" target="_blank" rel="noopener">Search homes for sale</a><a class="btn outline" href="/#match">Send a Club Match</a></div>
      </div>`
    : `<div class="listings" id="listings">
        <p class="pending">Live listings for ${esc(what)} are coming soon.</p>
        <p>Want to see what's for sale today? Send a Club Match and John will send you every active listing that fits.</p>
        <a class="btn solid" href="/#match">Send a Club Match</a>
      </div>`;
}

function emptyList(msg) {
  return `<div class="listings">
        <p class="pending">${msg}</p>
        <p>Tell us what you're looking for and we'll send the places that fit, with real costs and what's for sale today.</p>
        <a class="btn solid" href="/#match">Get my Club Match</a>
      </div>`;
}

// Cards for a mixed list of clubs and communities; each card carries its type for the toggle.
function mixedCards(list) {
  return `<div class="card-grid">
${list.map((c) => `      <a class="club-card" data-type="${c._type}" href="${c._type === 'club' ? CLUBS.base : COMMS.base}${c.slug}/"><span class="eyebrow">${esc(c.town)} · ${c._type === 'club' ? 'Club' : 'No club'}</span><h3>${esc(c.name)}</h3><p>${esc(c.blurb)}</p><span class="go">${c._type === 'club' ? 'Read the guide' : 'See the community'} →</span></a>`).join('\n')}
    </div>`;
}

function searchShell({ title, description, hero, active, listHead, list, idx, idxWhat }) {
  return layout({
    title, description,
    body: `
${hero}
<section class="band light">
  <div class="wrap">
    ${searchNav(active)}
    ${listHead}
    ${list}
  </div>
</section>
<section class="band sand">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">For sale now</p><h2 style="margin-top:12px">Homes for sale</h2></div></div>
    ${idxBlock(idx, idxWhat, 'Open any community above to see just its homes, or search every home for sale across the towns we cover.')}
  </div>
</section>
${matchSection(null)}`,
  });
}

function searchAllPage() {
  const a = SEARCH.all;
  return layout({
    title: 'Search Homes for Sale | Country Club Dudes',
    description: 'Search homes for sale in Palm Beach County, in club communities and communities without a club.',
    body: `
${pageHero('Search', esc(a.title), esc(a.intro))}
<section class="band light">
  <div class="wrap">
    ${searchNav('all')}
    <div class="split-choice">
      <a class="choice" href="/clubs/"><span class="eyebrow">${clubs.length} clubs</span><h3>Club communities</h3><p>Golf, racquets, dining and a social calendar, with membership attached.</p><span class="go">Browse club guides →</span></a>
      <a class="choice" href="/search/no-club/"><span class="eyebrow">No membership required</span><h3>${esc(SEARCH.noClub.label)}</h3><p>Gated, 55+ and waterfront neighborhoods without club dues.</p><span class="go">Browse communities →</span></a>
    </div>
    ${idxBlock(a.idx, 'all homes')}
  </div>
</section>`,
  });
}

function noClubPage() {
  const n = SEARCH.noClub;
  const list = communities.map((c) => ({ ...c, _type: 'community' }));
  return searchShell({
    title: `${n.title} | Country Club Dudes`,
    description: `${n.intro} Palm Beach County homes for sale.`,
    hero: pageHero('Search', esc(n.title), esc(n.intro)),
    active: 'no-club',
    listHead: `<div class="sec-head"><div><p class="eyebrow">${list.length ? `${list.length} communit${list.length === 1 ? 'y' : 'ies'}` : 'Communities'}</p><h2 style="margin-top:12px">Communities</h2></div>${isLive('optional-membership') ? '<p>Not sure you want a club? <a class="text-link" href="/search/optional-membership/">See clubs with optional membership →</a></p>' : ''}</div>`,
    list: list.length ? mixedCards(list) : emptyList("We're putting this list together now."),
    idx: n.idx, idxWhat: 'communities without a club',
  });
}

function featurePage(cat, clubsOnly) {
  const list = [
    ...clubs.filter((c) => (c.tags || []).includes(cat.tag)).map((c) => ({ ...c, _type: 'club' })),
    ...(clubsOnly ? [] : communities.filter((c) => (c.tags || []).includes(cat.tag)).map((c) => ({ ...c, _type: 'community' }))),
  ].sort((a, b) => a.name.localeCompare(b.name));
  const nClub = list.filter((c) => c._type === 'club').length, nComm = list.length - nClub;
  const toggle = clubsOnly ? '' : `<div class="seg" role="group" aria-label="Show">
      <button type="button" data-show="all" aria-pressed="true">All <span>${list.length}</span></button>
      <button type="button" data-show="club" aria-pressed="false">With a club <span>${nClub}</span></button>
      <button type="button" data-show="community" aria-pressed="false">Without a club <span>${nComm}</span></button>
    </div>`;
  return searchShell({
    title: `${cat.title} | Country Club Dudes`,
    description: `${cat.intro} Palm Beach County homes for sale and community guides.`,
    hero: pageHero('Search', esc(cat.title), esc(cat.intro)),
    active: cat.slug,
    listHead: `<div class="sec-head"><div><p class="eyebrow">${clubsOnly ? 'Clubs' : 'Communities'}</p><h2 style="margin-top:12px">${clubsOnly ? 'Clubs that fit' : 'Places that fit'}</h2></div>${toggle}</div>`,
    list: list.length ? `<div class="filterable">${mixedCards(list)}<div class="filter-empty" hidden>${emptyList('Nothing here yet for this filter.')}</div></div>` : emptyList("We're putting this list together now."),
    idx: cat.idx, idxWhat: cat.title.toLowerCase(),
  });
}

// Community without a club: hero, highlights, listings and the Club Match form.
function communityPage(c) {
  return layout({
    title: `${c.name} Homes for Sale, ${c.town} | Country Club Dudes`,
    description: `${c.name} in ${c.town}: homes for sale and what it's like to live there.`,
    image: c.photo,
    body: `
<section class="hero club-hero dark${heroClass(c.photo)}">
  <div class="wrap">
    <div class="hero-copy">
      <p class="crumbs"><a href="/search/no-club/">Communities without a club</a> / ${esc(c.town)}</p>
      <p class="eyebrow">${esc(c.town)} · No club membership</p>
      <h1>${esc(c.name)}</h1>
      <p class="lede">${esc(c.blurb)}</p>
${tagRow(c)}
      <div class="cta-row">${heroListingsBtn(c)}<a class="btn outline" href="#match">Ask about this community</a></div>
    </div>
    ${photo(c.photo, c.name, `${c.name}: entrance, streetscape or aerial`)}
  </div>
</section>
<section class="band sand">
  <div class="wrap">
    ${listingsBlock(c)}
  </div>
</section>
${matchSection(null)}`,
  });
}

function tagRow(c) {
  const tags = LIVE.filter((f) => (c.tags || []).includes(f.tag));
  return tags.length ? `      <div class="tag-row">${tags.map((f) => `<a class="tag" href="/search/${f.slug}/">${esc(f.label)}</a>`).join('')}</div>` : '';
}

// ---- Journal -------------------------------------------------------------------------------

// Small Markdown converter (no installs): ## and ### headings, paragraphs, - and 1. lists,
// > quotes, **bold**, *italic*, [links](url), ![images](src), and raw HTML lines.
function md(src) {
  const inline = (t) => esc(t)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, a, u) => `<img src="${u}" alt="${a}" loading="lazy">`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, a, u) => `<a href="${u}"${/^https?:/.test(u) && !u.includes('countryclubdudes.com') ? ' target="_blank" rel="noopener"' : ''}>${a}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  const out = [], toc = [];
  const blocks = src.trim().split(/\n{2,}/);
  for (const b of blocks) {
    const lines = b.split('\n');
    let mm;
    if (/^</.test(b.trim())) out.push(b);
    else if ((mm = b.match(/^(#{2,3})\s+(.+)$/))) {
      const id = mm[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (mm[1].length === 2) toc.push([id, mm[2]]);
      out.push(`<h${mm[1].length} id="${id}">${inline(mm[2])}</h${mm[1].length}>`);
    } else if (lines.length > 1 && lines.every((l) => /^\s*\|.*\|\s*$/.test(l))) {
      const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((x) => x.trim());
      const rows = lines.filter((l) => !/^\s*\|[\s:|-]+\|\s*$/.test(l)).map(cells);
      out.push(`<div class="table-wrap"><table><thead><tr>${rows[0].map((h) => `<th scope="col">${inline(h)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${inline(c)}</th>` : `<td>${inline(c)}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`);
    } else if (lines.every((l) => /^\s*[-*]\s+/.test(l))) out.push(`<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('')}</ul>`);
    else if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) out.push(`<ol>${lines.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`);
    else if (lines.every((l) => /^>\s?/.test(l))) out.push(`<blockquote>${inline(lines.map((l) => l.replace(/^>\s?/, '')).join(' '))}</blockquote>`);
    else out.push(`<p>${inline(lines.join(' '))}</p>`);
  }
  return { html: out.join('\n'), toc };
}

const fmtDate = (d) => (d ? new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '');

function postCards(list, feature = false) {
  return `<div class="post-grid${feature ? ' feature' : ''}">
${list.map((p) => `      <a class="post-card" href="/journal/${p.slug}/" data-topic="${esc(p.topic)}">
        <div class="post-img">${p.image && hasImage(p.image) ? `<img src="/images/${esc(p.image)}" alt="" loading="lazy">` : '<img class="post-mark" src="/images/ccd-key-gold.png" alt="">'}</div>
        <div class="post-body"><span class="eyebrow">${esc(p.topic)}</span><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><span class="post-meta">${fmtDate(p.date)} · ${p.minutes} min read</span></div>
      </a>`).join('\n')}
    </div>`;
}

function journalIndex() {
  const topics = [...new Set(POSTS.map((p) => p.topic))];
  return layout({
    title: 'The Journal: Country Club Buying Guides | Country Club Dudes',
    description: 'Guides to Palm Beach County country clubs: membership costs, club comparisons, and what to ask before you buy in a club community.',
    body: `
${pageHero('The Journal', 'Club guides and buying advice', 'What we learn inside Palm Beach County&#39;s clubs: membership costs, club comparisons, and the questions to ask before you buy.')}
<section class="band light">
  <div class="wrap">
${topics.length > 1 ? `    <div class="seg journal-filter" role="group" aria-label="Topic"><button type="button" data-topic="all" aria-pressed="true">All</button>${topics.map((t) => `<button type="button" data-topic="${esc(t)}" aria-pressed="false">${esc(t)}</button>`).join('')}</div>\n` : ''}    ${postCards(POSTS, true)}
  </div>
</section>
${matchSection(null)}`,
  });
}

function postPage(p) {
  const { html, toc } = md(p.body);
  const related = POSTS.filter((x) => x.slug !== p.slug).sort((a, b) => (b.topic === p.topic) - (a.topic === p.topic)).slice(0, 3);
  const mentioned = p.clubs.map((slug) => clubs.find((c) => c.slug === slug) || communities.find((c) => c.slug === slug)).filter(Boolean);
  const url = `${SITE}/journal/${p.slug}/`;
  const jsonld = JSON.stringify([
    { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, datePublished: p.date, dateModified: p.date,
      author: { '@type': p.author === 'The Country Club Dudes' ? 'Organization' : 'Person', name: p.author },
      publisher: { '@type': 'Organization', name: 'Country Club Dudes', logo: { '@type': 'ImageObject', url: `${SITE}/images/ccd-logo-stacked-dark.png` } },
      image: `${SITE}/images/${p.image && hasImage(p.image) ? p.image : 'share/ccd-share.jpg'}`, mainEntityOfPage: url },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Journal', item: `${SITE}/journal/` },
      { '@type': 'ListItem', position: 2, name: p.title, item: url }] },
  ]);
  return layout({
    title: `${p.title} | Country Club Dudes`, description: p.description, image: p.image, type: 'article', jsonld,
    body: `
<section class="page-hero dark post-hero">
  <div class="wrap">
    <p class="crumbs"><a href="/journal/">Journal</a> / ${esc(p.topic)}</p>
    <h1>${esc(p.title)}</h1>
    ${p.description ? `<p class="lede">${esc(p.description)}</p>` : ''}
    <p class="post-byline">${esc(p.author)} · ${fmtDate(p.date)} · ${p.minutes} min read</p>
  </div>
</section>
${p.image && hasImage(p.image) ? `<div class="post-cover wrap"><img src="/images/${esc(p.image)}" alt="" fetchpriority="high"></div>` : ''}
<section class="band light post-band">
  <div class="wrap post-layout">
    <article class="prose">
${toc.length >= 3 ? `      <nav class="toc" aria-label="In this article"><p class="eyebrow">In this article</p><ul>${toc.map(([id, t]) => `<li><a href="#${id}">${esc(t)}</a></li>`).join('')}</ul></nav>\n` : ''}${html}
      <aside class="post-cta"><p class="eyebrow">Club Match</p><h3>Want this for the clubs you're considering?</h3><p>Tell us how you play and what you want to spend. We'll send two or three clubs that fit, with real dues and what's for sale today.</p><a class="btn gold" href="#match">Get my Club Match</a></aside>
    </article>
  </div>
</section>
${mentioned.length ? `<section class="band sand">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">In this article</p><h2 style="margin-top:12px">Clubs and communities mentioned</h2></div></div>
    ${clubCards(mentioned)}
  </div>
</section>` : ''}
${related.length ? `<section class="band light">
  <div class="wrap">
    <div class="sec-head"><h2>Keep reading</h2><p><a class="text-link" href="/journal/">All articles →</a></p></div>
    ${postCards(related)}
  </div>
</section>` : ''}
${matchSection(null)}`,
  });
}

// ---- Privacy policy (template: John and Premier Listings should review before launch) ------------
function privacyPage() {
  const updated = 'November 24, 2026';
  const sec = (h, ...ps) => `<h2>${h}</h2>\n${ps.map((x) => (x.startsWith('<') ? x : `<p>${x}</p>`)).join('\n')}`;
  return layout({
    title: 'Privacy Policy | Country Club Dudes',
    description: 'How Country Club Dudes and Premier Listings collect, use and protect your information, including phone calls, texts and email.',
    body: `
${pageHero('Legal', 'Privacy policy', `Last updated ${updated}`)}
<section class="band light post-band">
  <div class="wrap post-layout">
    <article class="prose">
<p>This policy explains how Country Club Dudes, a team of licensed real estate agents with Premier Listings ("we", "us"), collects, uses and protects information when you use countryclubdudes.com (the "site").</p>
${sec('Information we collect',
  '<ul><li><strong>Information you give us:</strong> your name, mobile number, email address and anything you share in our forms, such as the areas, budget, clubs and amenities you&#39;re interested in.</li><li><strong>Information collected automatically:</strong> basic technical and usage information, such as pages viewed, device and browser type, approximate location and how you arrived at the site, collected through cookies and similar tools (for example Google Analytics).</li></ul>')}
${sec('How we use your information',
  '<ul><li>To respond to your inquiry and send the clubs, communities and listings you asked about.</li><li>To contact you by phone call, text message and email about real estate, as you agreed when you submitted a form.</li><li>To improve the site and understand which pages are useful.</li><li>To meet legal, licensing and record-keeping requirements.</li></ul>')}
${sec('Calls, text messages and email',
  'When you check the consent box on our form, you agree that Country Club Dudes and Premier Listings may contact you by phone, text message and email at the number and address you provided, including calls and texts sent using automated technology. Consent isn&#39;t a condition of buying or selling a home.',
  'Message and data rates may apply, and message frequency varies. You can reply <strong>STOP</strong> to any text to opt out, or <strong>HELP</strong> for help. You can unsubscribe from emails using the link in any email, or ask us to stop calling at any time.',
  '<strong>We do not sell, rent or share your mobile number or text messaging consent with third parties or affiliates for their marketing purposes.</strong>')}
${sec('How we share information',
  'We share information only as needed to run the site and serve you:',
  '<ul><li><strong>Our brokerage,</strong> Premier Listings, and the agents on our team.</li><li><strong>Service providers</strong> that work on our behalf, such as website hosting and forms (Netlify), our customer relationship manager (Follow Up Boss), listing search (IDX Broker), email and texting tools, and analytics (Google). They may use your information only to provide their services to us.</li><li><strong>When required by law,</strong> or to protect our rights, our clients or others.</li></ul>',
  'We do not sell your personal information.')}
${sec('Cookies and analytics',
  'We use cookies and similar tools to understand how the site is used and, where enabled, to measure advertising. You can block or delete cookies in your browser settings; the site will still work.')}
${sec('Listing information and other sites',
  'Home searches open on our listing search provider&#39;s site, and some links go to Instagram and other sites. Those sites have their own privacy policies. Listing information is provided by the MLS and is deemed reliable but not guaranteed.')}
${sec('How long we keep information',
  'We keep your information for as long as needed to serve you and to meet legal and brokerage record-keeping requirements.')}
${sec('Your choices',
  'You can ask us to update or delete your contact information, or to stop contacting you, at any time using the details below.')}
${sec('Children',
  'This site is not meant for children under 13, and we don&#39;t knowingly collect their information.')}
${sec('Changes to this policy',
  'We may update this policy from time to time. The date at the top shows when it last changed.')}
${sec('Contact us',
  `Country Club Dudes at Premier Listings, Delray Beach, Florida<br>Shawn Miller: <a href="tel:${PHONES.shawn[1]}">${PHONES.shawn[0]}</a><br>John Silverberg: <a href="tel:${PHONES.john[1]}">${PHONES.john[0]}</a>`)}
    </article>
  </div>
</section>`,
  });
}

// ---- Page not found (Netlify serves dist/404.html for any missing page) --------------------------
function notFoundPage() {
  return layout({
    title: 'Page not found | Country Club Dudes',
    description: 'That page could not be found.',
    noindex: true,
    body: `
<section class="hero hero-full dark nf">
  ${heroMedia()}
  <div class="wrap">
    <div class="hero-copy">
      <p class="hero-kicker">Error 404</p>
      <h1>That shot went out of bounds.</h1>
      <p class="lede">The page you were looking for isn&#39;t here. It may have moved, or the link may have a typo. Try a search, or pick up from one of these.</p>
      ${heroSearch()}
      <p class="hero-alt"><a class="text-link" href="/">Home</a> <span aria-hidden="true">·</span> <a class="text-link" href="/clubs/">Club guides</a> <span aria-hidden="true">·</span> <a class="text-link" href="/search/">Search all homes</a>${POSTS.length ? ' <span aria-hidden="true">·</span> <a class="text-link" href="/journal/">Journal</a>' : ''} <span aria-hidden="true">·</span> <a class="text-link" href="/#match">Get my Club Match</a></p>
    </div>
  </div>
</section>`,
  });
}

function thanksPage() {
  return layout({
    title: 'Thanks | Country Club Dudes',
    description: 'Thanks for reaching out to the Country Club Dudes.',
    noindex: true,
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
// New Developments is hidden until src/developments.json has at least one entry.
if (developments.length) {
  write('new-developments/index.html', developmentsIndex());
  for (const dev of developments) write(`new-developments/${dev.slug}/index.html`, clubPage(dev, DEVS));
}
write('search/index.html', searchAllPage());
write('search/no-club/index.html', noClubPage());
for (const cat of SEARCH.lifestyle.filter((c) => isLive(c.slug))) write(`search/${cat.slug}/index.html`, featurePage(cat, false));
for (const cat of SEARCH.membership.filter((c) => isLive(c.slug))) write(`search/${cat.slug}/index.html`, featurePage(cat, true));
for (const c of communities) write(`communities/${c.slug}/index.html`, communityPage(c));
write('thanks/index.html', thanksPage());
write('privacy/index.html', privacyPage());
write('404.html', notFoundPage());
if (POSTS.length) {
  write('journal/index.html', journalIndex());
  for (const p of POSTS) write(`journal/${p.slug}/index.html`, postPage(p));
}
const urls = ['/', '/clubs/', '/search/', '/search/no-club/', ...LIVE.map((c) => `/search/${c.slug}/`), ...communities.map((c) => `/communities/${c.slug}/`), ...clubs.map((c) => `/clubs/${c.slug}/`), ...(developments.length ? ['/new-developments/', ...developments.map((d) => `/new-developments/${d.slug}/`)] : []), ...(POSTS.length ? ['/journal/', ...POSTS.map((p) => `/journal/${p.slug}/`)] : []), '/privacy/'];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Built ${clubs.length} club pages and ${developments.length} new development pages into dist/`);
