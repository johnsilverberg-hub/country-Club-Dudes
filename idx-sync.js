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

const log = (...a) => console.log('[idx]', ...a);

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
  log(`System links: ${system.map((s) => s.name).join(', ') || 'none'}`);

  let idxID = process.env.IDX_ID;
  let disclaimer = '';
  try {
    const mls = asList(await api('GET', 'mls/approvedmls'));
    if (!idxID && mls.length) idxID = mls[0].id || mls[0].idxID;
    log(`Approved MLS: ${mls.map((m) => `${m.name || ''} (${m.id || m.idxID})`).join(', ')}`);
    if (idxID) {
      const d = asList(await api('GET', `mls/disclaimer/${idxID}`))[0] || {};
      disclaimer = String(d.disclaimer || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  } catch (e) { log(`MLS info: ${e.message}`); }

  let saved = asList(await api('GET', 'clients/savedlinks'));
  const byName = () => new Map(saved.map((s) => [String(s.linkName || '').toLowerCase(), s]));

  if (process.env.IDX_CREATE_LINKS === '1' && idxID) {
    const have = byName();
    for (const e of entries) {
      const linkName = `ccd-${e.slug}`;
      if (have.has(linkName)) continue;
      const q = new URLSearchParams();
      q.set('linkName', linkName);
      q.set('pageTitle', `Homes for sale in ${e.name}`);
      q.set('linkTitle', `Homes for sale in ${e.name}`);
      q.set('queryString[idxID]', idxID);
      q.set('queryString[pt]', 'sfr');
      q.append('queryString[a_subdivisionName][]', e.subdivision || e.name);
      if (e.town) q.set('queryString[city][]', e.town);
      try { await api('PUT', 'clients/savedlinks', q.toString()); log(`Created saved link ${linkName}`); }
      catch (err) { log(`Could not create ${linkName}: ${err.message}`); }
    }
    saved = asList(await api('GET', 'clients/savedlinks'));
  }

  const links = byName();
  const config = { resultsUrl: results.url || '', searchUrl: search.url || '', links: {} };
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
  let filled = 0;

  for (const e of entries) {
    const link = links.get(`ccd-${e.slug}`);
    if (!link) continue;
    config.links[e.slug] = link.url;
    try {
      const raw = asList(await api('GET', `clients/savedlinks/${link.id}/results`));
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

  fs.writeFileSync(path.join(SRC, 'idx.json'), JSON.stringify(config, null, 2));
  log(`Saved links found: ${saved.length}. Listing files written: ${filled} of ${entries.length}.`);
}

// Never fail the site build because of IDX: log and carry on with the fallbacks.
main().catch((e) => log(`Skipped: ${e.message}`));
