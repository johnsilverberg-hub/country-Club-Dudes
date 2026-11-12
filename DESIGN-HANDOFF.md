# Design handoff: Country Club Dudes site

From Dezirae (design). This branch (`design-refresh`) changes layout, styling and navigation only.
Content, data, IDX/MLS setup, hosting and lead routing stay with John.

More sections of this note (brand rules, photo slots, data fields) will be added before final handoff.

---

## Hero search bar → IDX Broker (for John's Claude)

The home page hero has a branded search bar: tabs (All homes / With a club / Without a club),
a "Where" box, Max price, Beds, and a Search button. The design is final; please keep the markup
and styles. What's left is wiring it to IDX Broker. All wiring lives in **`src/search.json` → `heroSearch`**,
no template edits needed.

IDX Broker results pages accept plain GET URLs, so the bar builds a results URL and sends the visitor there.

### Steps

1. **Find the results URL.** In IDX Broker, run any search on the hosted search page. Copy the results
   page URL up to the `?` (it looks like `https://<subdomain>.idxbroker.com/idx/results/listings`, or the
   custom subdomain if one is set up). Put it in `heroSearch.action`.
2. **Confirm the field names.** Run a search with a max price, a minimum bed count and a city, then read
   the results URL. Put the field names into `heroSearch.params`:
   - `maxPrice`: max price field (pre-filled as `hp`, confirm)
   - `minBeds`: minimum beds field (pre-filled as `bd`, confirm)
   - `location`: the field that takes what the visitor typed in "Where" (city, ZIP or subdivision).
     IDX Broker uses different fields for city, ZIP and subdivision. If no single field accepts all
     three, use the city field, or extend the submit code in `build.js` to send a 5-digit entry as a
     ZIP and anything else as a city.
3. **Point the club tabs at saved links (recommended).** In IDX Broker, create two saved links:
   one covering the club communities' subdivisions, one covering the communities without a club.
   Paste their URLs into `heroSearch.tabs.club` and `heroSearch.tabs.noClub`. When a tab is selected,
   the bar uses that saved link as the base and adds price/beds on top. "All homes" uses `action`.
4. **Fixed parameters (optional).** Anything that should go with every search (property type, MLS ID,
   sort order) goes in `heroSearch.fixed` as `{"field": "value"}`.
5. **Test** each tab with and without price/beds, and check the results match.

### How it behaves (already built)

- **Typeahead:** typing 2+ letters suggests matching clubs and communities (opens their guide page)
  and towns ("Homes in Boca Raton", which runs an IDX search for that town). Respects the selected tab.
  The list comes from `clubs.json` and `communities.json` automatically.
- **Before IDX is wired** (`action` empty): Search sends people to the site's own pages
  (`/search/`, `/clubs/`, `/search/no-club/`), so nothing breaks.
- **Keyboard and screen reader:** arrow keys, Enter and Escape work in the suggestions, and the
  tabs are a labeled radio group.
- Field names were checked against IDX Broker's developer docs on custom search forms, but those
  docs note IDX support doesn't cover custom forms and the details can change, so step 2 matters.
