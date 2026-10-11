// Client-side search and opt-in district lookup. Addresses are not saved by this site.
(function() {
  let searchIndex = [];
  let districtRaceMapPromise;
  async function buildIndex() {
    try {
      const res = await fetch(window.OVG_SEARCH_INDEX);
      if (!res.ok) throw new Error('Search index request failed');
      searchIndex = await res.json();
    } catch (e) { console.warn('Search index not available'); }
  }
  const input = document.getElementById('site-search');
  const results = document.getElementById('search-results');
  const basePath = document.querySelector('meta[name="ovg-base-path"]')?.content || '/OpenVoterGuide/';
  if (!input || !results) return;

  function isAddress(query) {
    return /^\s*\d+\s+.+\b(?:street|st|road|rd|avenue|ave|boulevard|blvd|drive|dr|lane|ln|court|ct|circle|cir|highway|hwy|parkway|pkwy|place|pl|terrace|ter|way)\b/i.test(query);
  }
  function addText(parent, tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    parent.appendChild(element);
    return element;
  }
  function makeLink(label, href, external = false) {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    if (external) { link.target = '_blank'; link.rel = 'noopener'; }
    return link;
  }
  function addAddressLookup(query) {
    const panel = document.createElement('section');
    panel.className = 'address-search';
    addText(panel, 'strong', 'Find your districts', 'address-search-title');
    addText(panel, 'p', 'Use a full street address with city and state or ZIP code. When you click the button, your address is sent directly to the U.S. Census Bureau Geocoder to identify current districts. OpenVoterGuide does not save it.');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'address-search-button';
    button.textContent = 'Find districts for this address';
    button.addEventListener('click', () => lookupAddress(query, panel, button));
    panel.appendChild(button);
    results.appendChild(panel);
  }
  function showServiceLinks(parent) {
    const links = document.createElement('p');
    links.className = 'address-official-links';
    links.append(makeLink('Official polling-place lookup', 'https://lookup.boe.ohio.gov/vtrapp/ashtabula/pollfinder.aspx', true),
      document.createTextNode(' · '),
      makeLink('Ashtabula County sample ballot and election notices', 'https://www.boe.ohio.gov/ashtabula/', true));
    parent.appendChild(links);
  }
  function getDistrictNumber(geographies, key) {
    const entry = Object.entries(geographies || {}).find(([name]) => name.toLowerCase() === key.toLowerCase());
    const item = Array.isArray(entry?.[1]) ? entry[1][0] : null;
    if (!item) return '';
    const match = String(item.BASENAME || item.NAME || '').match(/\d+/);
    return match ? String(Number(match[0])) : '';
  }
  function jsonpGeocode(address) {
    return new Promise((resolve, reject) => {
      const callback = '__ovgCensus' + Date.now() + Math.random().toString(36).slice(2);
      const script = document.createElement('script');
      const params = new URLSearchParams({ address, benchmark: 'Public_AR_Current', vintage: 'Current_Current', format: 'jsonp', callback });
      const cleanup = () => {
        clearTimeout(timer);
        script.remove();
        try { delete window[callback]; } catch (_) { window[callback] = undefined; }
      };
      const timer = setTimeout(() => { cleanup(); reject(new Error('The Census address lookup timed out. Please try again.')); }, 15000);
      window[callback] = (data) => { cleanup(); resolve(data); };
      script.onerror = () => { cleanup(); reject(new Error('The Census address service could not be reached. Please try again.')); };
      script.src = 'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?' + params.toString();
      script.referrerPolicy = 'no-referrer';
      document.head.appendChild(script);
    });
  }
  function loadDistrictRaceMap() {
    if (!districtRaceMapPromise) districtRaceMapPromise = fetch(window.OVG_DISTRICT_RACE_MAP).then((response) => {
      if (!response.ok) throw new Error('District links are unavailable');
      return response.json();
    });
    return districtRaceMapPromise;
  }
  async function lookupAddress(address, panel, button) {
    button.disabled = true;
    button.textContent = 'Looking up current districts…';
    const status = addText(panel, 'p', 'Contacting the U.S. Census Bureau Geocoder…', 'address-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    try {
      const [data, districtRaceMap] = await Promise.all([jsonpGeocode(address), loadDistrictRaceMap()]);
      const matches = data?.result?.addressMatches || [];
      if (!matches.length) {
        status.textContent = 'No exact address match was found. Check the street spelling and include the city and state or ZIP code.';
        return;
      }
      const match = matches[0];
      const geographies = match.geographies || {};
      const county = (geographies.Counties || [])[0];
      const state = (geographies.States || [])[0];
      const isOhio = state && ((state.BASENAME || state.NAME || '').toLowerCase() === 'ohio' || state.STATE === '39');
      const isAshtabula = county && /ashtabula/i.test(county.NAME || county.BASENAME || '');
      status.textContent = '';
      addText(panel, 'strong', 'Address matched', 'address-match-title');
      if (match.matchedAddress) addText(panel, 'p', match.matchedAddress);
      if (county?.NAME) addText(panel, 'p', 'County: ' + county.NAME);
      if (state?.NAME) addText(panel, 'p', 'State: ' + state.NAME);
      const districts = [
        ['Congressional district', 'Congressional Districts', 'congressional'],
        ['Ohio Senate district', 'State Legislative Districts - Upper', 'state-upper'],
        ['Ohio House district', 'State Legislative Districts - Lower', 'state-lower']
      ];
      for (const [label, key, kind] of districts) {
        const number = getDistrictNumber(geographies, key);
        if (!number) continue;
        addText(panel, 'p', label + ': ' + number, 'address-geography');
        if (!isOhio || !isAshtabula) continue;
        const race = districtRaceMap.find((entry) => entry.kind === kind && String(entry.district) === number);
        if (race) panel.appendChild(makeLink('View the ' + label.toLowerCase() + ' race, ' + number, basePath + 'races/' + encodeURIComponent(race.race_id) + '/'));
      }
      if (isAshtabula) {
        addText(panel, 'p', 'This guide covers Ashtabula County. District matches help you find races; your official sample ballot is the authority for what is on your ballot.', 'address-guidance');
        showServiceLinks(panel);
      } else {
        addText(panel, 'p', 'This guide currently covers Ashtabula County, Ohio. Use your own county election office to confirm your ballot and polling place.', 'address-guidance');
      }
    } catch (error) {
      status.textContent = error.message || 'Address lookup failed. Please try again.';
    } finally {
      button.disabled = false;
      button.textContent = 'Find districts for this address';
    }
  }
  function renderSearch() {
    const query = input.value.trim();
    const q = query.toLowerCase();
    results.replaceChildren();
    if (q.length < 2) { results.style.display = 'none'; return; }
    const matches = searchIndex.filter((item) =>
      item.title.toLowerCase().includes(q) || (item.keywords && item.keywords.toLowerCase().includes(q))
    ).slice(0, 8);
    if (!matches.length && !isAddress(query)) addText(results, 'p', 'No matching pages found.');
    matches.forEach((item) => {
      const link = makeLink('', basePath + item.url.replace(/^\/+/, ''));
      const title = document.createElement('strong');
      title.textContent = item.title;
      const type = document.createElement('small');
      type.textContent = item.type;
      link.append(title, document.createElement('br'), type);
      results.appendChild(link);
    });
    if (isAddress(query)) addAddressLookup(query);
    results.style.display = 'block';
  }
  input.addEventListener('input', renderSearch);
  input.addEventListener('keydown', (event) => { if (event.key === 'Escape') results.style.display = 'none'; });
  document.addEventListener('click', (event) => { if (!event.target.closest('.search-box')) results.style.display = 'none'; });
  buildIndex();
})();
