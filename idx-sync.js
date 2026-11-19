// Pulls live listings from the IDX Broker API before the site is built.
// Runs on Netlify as part of the build command: `node idx-sync.js && node build.js`.
//
// The API key is read from the IDX_API_KEY environment variable (set in Netlify:
// Site configuration > Environment variables). It is never written to the repo or the logs.
// Without a key this script does nothing and the site shows its "coming soon" panels.
//
// What it writes (both are build output and are git-ignored):
//   src/listings/<slug>.json  listing cards for each club / community page (see DESIGN-HANDOFF.md)
//   src/idx.json              IDX results URL and saved-link URLs, used by the hero search bar
//
// Saved links: one per club and per community without a club, named "ccd-<slug>".
// Set IDX_CREATE_LINKS=1 for one build to create any that are missing, matched by MLS
// subdivision name ("subdivision" on the entry in clubs.json / communities.json, or its name).
// Optional: IDX_ID (MLS id in IDX Broker, found automatically if left out).

const fs = require('fs');
const path = require('path');

const KEY = process.env.IDX_API_KEY;
const API = 'https://api.idxbroker.com';
const SRC = path.join(__dirname, 'src');
const OUT_DIR = path.join(SRC, 'listings');
const PER_PAGE = 6;

const LOG = [];
const log = (...a) => { LOG.push(a.join(' ')); console.log('[idx]', ...a); };
// On deploy previews only, the log lines (never the key) are published at /idx-status.txt for checking.
// They are also sent as requests to the site's own /idx-status-beacon path, so they show in its Netlify request logs.
const saveLog = async () => {
  if (process.env.CONTEXT !== 'deploy-preview') return;
  fs.writeFileSync(path.join(SRC, 'idx-status.txt'), LOG.join('\n') + '\n');
  const base = process.env.URL;
  if (!base) return;
  const chunks = LOG.flatMap((line, i) => (line.match(/[\s\S]{1,900}/g) || ['']).map((c, j) => `${i}.${j} ${c}`));
  for (const c of chunks) { try { await fetch(`${base}/idx-status-beacon?l=${encodeURIComponent(c)}`); } catch {} }
};

async function api(method, endpoint, body) {
  const headers = { accesskey: KEY, outputtype: 'json', apiversion: '1.7.0' };
  const opts = { method, headers };
  if (body) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    opts.body = body;
  }
  const res = await fetch(`${API}/${endpoint}`, opts);
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${endpoint} -> ${res.status} ${text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)}`);
  if (!text.trim()) return null;
  try { return JSON.parse(text); } catch { return text; }
}

const asList = (x) => (Array.isArray(x) ? x : x && typeof x === 'object' ? Object.values(x) : []);
const pick = (o, keys) => { for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k]; return undefined; };
const num = (v) => { const n = Number(String(v ?? '').replace(/[^0-9.]/g, '')); return Number.isFinite(n) && n > 0 ? n : undefined; };

function photoOf(l) {
  const img = l.image;
  if (typeof img === 'string') return img;
  const first = asList(img).find((i) => i && (i.url || typeof i === 'string'));
  return first ? first.url || first : undefined;
}

function statusOf(l) {
  const s = String(pick(l, ['propStatus', 'status', 'listingStatus']) || '');
  if (/pending|contract/i.test(s)) return 'Pending';
  if (l.openHouse || l.openHouses) return 'Open house';
  if (num(l.previousPrice) && num(l.previousPrice) > num(pick(l, ['listingPrice', 'price', 'listPrice']))) return 'Price reduced';
  const days = Number(pick(l, ['daysOnMarket', 'dom']));
  if (Number.isFinite(days) && days <= 7) return 'New';
  return undefined;
}

function card(l) {
  const address = pick(l, ['address']) || [pick(l, ['streetNumber']), pick(l, ['streetName'])].filter(Boolean).join(' ');
  return {
    price: num(pick(l, ['listingPrice', 'price', 'listPrice'])),
    status: statusOf(l),
    address: String(address || '').trim(),
    city: pick(l, ['cityName', 'city']),
    beds: num(pick(l, ['bedrooms', 'beds'])),
    baths: num(pick(l, ['totalBaths', 'baths', 'fullBaths'])),
    sqft: num(pick(l, ['sqFt', 'squareFeet', 'sqft'])),
    photo: photoOf(l),
    url: pick(l, ['fullDetailsURL', 'detailsURL', 'url']),
    courtesy: pick(l, ['listingOfficeName', 'officeName', 'listingOffice', 'courtesy']),
  };
}

async function main() {
  if (!KEY) { log('No IDX_API_KEY set, skipping live listings.'); return; }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const entries = [
    ...JSON.parse(fs.readFileSync(path.join(SRC, 'clubs.json'), 'utf8')),
    ...JSON.parse(fs.readFileSync(path.join(SRC, 'communities.json'), 'utf8')),
  ];

  // The account's own search pages (used for the hero search bar).
  const system = asList(await api('GET', 'clients/systemlinks'));
  const results = system.find((s) => /results/i.test(`${s.name} ${s.url}`)) || {};
  const search = system.find((s) => /^(basic|advanced)?\s*search$/i.test(String(s.name || ''))) || {};
  log(`Connected. Results page: ${results.url || 'none'}`);

  let idxID = process.env.IDX_ID;
  let disclaimer = '';
  try {
    const mls = asList(await api('GET', 'mls/approvedmls'));
    if (!idxID && mls.length) idxID = mls[0].id || mls[0].idxID;
    log(`Approved MLS: ${mls.map((m) => `${m.name || ''} (${m.id || m.idxID})`).join(', ')}`);
  } catch (e) { log(`MLS info: ${e.message}`); }

  // MLS subdivision names per club / community (src/idx-subdivisions.json), kept in sync with
  // one IDX saved link each, named "ccd-<slug>". Links are only written from deploy previews
  // (or with IDX_CREATE_LINKS=1), so production builds only read.
  const SUBS = JSON.parse(fs.readFileSync(path.join(SRC, 'idx-subdivisions.json'), 'utf8'));
  const query = (names) => {
    const q = new URLSearchParams();
    q.set('idxID', idxID);
    q.set('pt', '1');
    names.forEach((n, i) => q.set(`a_subdivision[${i}]`, n));
    return q;
  };
  const wanted = [];
  for (const e of entries) {
    const names = SUBS[e.slug];
    if (Array.isArray(names) && names.length) wanted.push({ linkName: `ccd-${e.slug}`, title: `Homes for sale in ${e.name}`, names });
  }
  const clubSlugs = new Set(JSON.parse(fs.readFileSync(path.join(SRC, 'clubs.json'), 'utf8')).map((c) => c.slug));
  const union = (fn) => [...new Set(entries.filter(fn).flatMap((e) => SUBS[e.slug] || []))];
  wanted.push({ linkName: 'ccd-search-club', title: 'Homes for sale in club communities', names: union((e) => clubSlugs.has(e.slug)) });
  wanted.push({ linkName: 'ccd-search-noclub', title: 'Homes for sale in communities without a club', names: union((e) => !clubSlugs.has(e.slug)) });

  let saved = asList(await api('GET', 'clients/savedlinks'));
  const byName = () => new Map(saved.map((s) => [String(s.linkName || '').toLowerCase(), s]));
  const canWrite = (process.env.CONTEXT === 'deploy-preview' || process.env.IDX_CREATE_LINKS === '1') && idxID;

  if (canWrite) {
    const have = byName();
    let made = 0, updated = 0;
    for (const w of wanted) {
      const qs = query(w.names);
      const body = new URLSearchParams({ linkName: w.linkName, pageTitle: w.title, linkTitle: w.title });
      for (const [k, v] of qs) body.set(`queryString[${k}]`, v);
      const cur = have.get(w.linkName);
      const want = `page=listings&${qs.toString()}`;
      try {
        if (!cur) { await api('PUT', 'clients/savedlinks', body.toString()); made++; }
        else if (String(cur.queryString) !== want) { await api('POST', `clients/savedlinks/${cur.id}`, body.toString()); updated++; }
      } catch (err) { log(`Saved link ${w.linkName}: ${err.message}`); }
    }
    log(`Saved links created: ${made}, updated: ${updated}, wanted: ${wanted.length}`);
    saved = asList(await api('GET', 'clients/savedlinks'));
  }

  if (process.env.CONTEXT === 'deploy-preview' && idxID) {
    // One-off lookups for names still to be matched (field values only, no listing data).
    try {
      const subs = asList(await api('GET', `mls/searchfieldvalues/${idxID}?mlsPtID=1&name=subdivision`)).map(String);
      for (const [label, re] of [['oaks', /^(THE )?OAKS( AT| OF)? ?(BOCA)?/i], ['preserve', /^(THE )?PRESERVE( AT| OF)? ?(BOCA)?/i], ['orchard', /ORCHARD/i], ['broken sound', /BROKEN SOUND|BOCA RATON.*(COUNTRY|GOLF)/i], ['delaire', /DELAIRE/i], ['century boca', /CENTURY VILLAGE/i]]) {
        const hits = subs.filter((v) => re.test(v));
        log(`LOOKUP ${label} ${hits.length}: ${hits.slice(0, 80).join(' ; ')}`);
      }
      const cities = asList(await api('GET', `mls/cities/${idxID}`));
      log(`CITIES ${cities.length}: ${cities.filter((c) => /boca|delray|boynton|jupiter|palm beach gardens|wellington|tequesta|west palm|lake worth|westlake/i.test(JSON.stringify(c))).map((c) => JSON.stringify(c)).join(' ; ').slice(0, 2500)}`);
    } catch (e) { log(`Lookups: ${e.message}`); }
  }

  const links = byName();
  const config = { resultsUrl: results.url || '', searchUrl: search.url || '', links: {} };
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
  let filled = 0;
  const counts = [];

  for (const e of entries) {
    const link = links.get(`ccd-${e.slug}`);
    if (!link) continue;
    config.links[e.slug] = link.url;
    try {
      const raw = asList(await api('GET', `clients/savedlinks/${link.id}/results`));
      counts.push(`${e.slug}=${raw.length}`);
      if (!filled && raw[0]) log(`Listing fields: ${Object.keys(raw[0]).join(', ')} | sample subdivision/city/status/price/office: ${['subdivision', 'cityName', 'propStatus', 'listingPrice', 'listingOfficeName', 'propSubType'].map((k) => raw[0][k]).join(' / ')}`);
      const items = raw.map(card).filter((c) => c.price && c.address);
      fs.writeFileSync(path.join(OUT_DIR, `${e.slug}.json`), JSON.stringify({
        total: raw.length, url: link.url, updated: today, disclaimer, items: items.slice(0, PER_PAGE),
      }, null, 2));
      filled++;
    } catch (err) { log(`Listings for ${e.slug}: ${err.message}`); }
  }

  for (const key of ['club', 'noClub', 'all']) {
    const l = links.get(`ccd-search-${key.toLowerCase()}`);
    if (l) config.links[`search-${key}`] = l.url;
  }

  log(`RESULTS ${counts.join(' ')}`);
  fs.writeFileSync(path.join(SRC, 'idx.json'), JSON.stringify(config, null, 2));
  log(`Saved links found: ${saved.length}. Listing files written: ${filled} of ${entries.length}.`);
}

// Never fail the site build because of IDX: log and carry on with the fallbacks.
main().catch((e) => log(`Skipped: ${e.message}`)).finally(saveLog);
