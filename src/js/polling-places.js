(() => {
  const root = document.querySelector("[data-polling-explorer]");
  if (!root) return;

  const form = root.querySelector("[data-polling-search-form]");
  const input = root.querySelector("#polling-search-input");
  const cards = [...root.querySelectorAll("[data-polling-location]")];
  const count = root.querySelector("[data-polling-result-count]");
  const empty = root.querySelector("[data-polling-no-results]");
  const mapElement = root.querySelector("[data-polling-map]");
  const mapStatus = root.querySelector("[data-polling-map-status]");
  const mapError = root.querySelector("[data-polling-map-error]");
  const mapSelection = root.querySelector("[data-polling-map-selection]");
  const selectedDetails = root.querySelector("[data-polling-map-selected]");
  let map;
  let mapReady = false;
  let mapStarted = false;
  let markersById = new Map();
  let selectedId = null;

  const locations = cards.map((card, index) => ({
    id: card.dataset.locationId || card.querySelector("[data-show-location-on-map]")?.dataset.showLocationOnMap,
    index: index + 1,
    card,
    name: card.querySelector("h3")?.textContent.trim() || "Polling place",
    street: card.dataset.street || "",
    city: card.dataset.city || "",
    address: card.querySelector("address")?.textContent.replace(/\s+/g, " ").trim() || "",
    search: card.dataset.search || "",
    precincts: [...card.querySelectorAll(".polling-precinct-section li > span")].map(item => item.textContent.trim()),
    directions: card.querySelector(".polling-directions")?.href || ""
  }));

  const normalize = value => String(value || "")
    .toLocaleUpperCase("en-US")
    .replace(/\bSTATE\s+ROUTE\b/g, "ST RT")
    .replace(/\bNORTH\b/g, "N")
    .replace(/\bSOUTH\b/g, "S")
    .replace(/\bEAST\b/g, "E")
    .replace(/\bWEST\b/g, "W")
    .replace(/\b(STREET)\b/g, "ST")
    .replace(/\b(AVENUE)\b/g, "AVE")
    .replace(/\b(ROAD)\b/g, "RD")
    .replace(/\b(BOULEVARD)\b/g, "BLVD")
    .replace(/\b(DRIVE)\b/g, "DR")
    .replace(/\b(HIGHWAY)\b/g, "HWY")
    .replace(/\b(ROUTE)\b/g, "RT")
    .replace(/[^A-Z0-9]/g, "");

  const showMapError = message => {
    mapStatus.textContent = message;
    mapError.hidden = false;
    mapElement.hidden = true;
  };

  const loadLeaflet = () => new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    css.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    css.crossOrigin = "";
    document.head.append(css);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    script.crossOrigin = "";
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("The map controls could not be loaded."));
    document.head.append(script);
  });

  const addressMatches = (location, properties) => {
    const city = normalize(properties.CITY);
    const state = normalize(properties.STATE || "OH");
    const fullAddress = normalize(properties.FULLADD);
    const street = normalize(location.street);
    return city === normalize(location.city)
      && state === "OH"
      && street.length > 5
      && fullAddress.startsWith(street);
  };

  const makeSelectedDetails = location => {
    selectedDetails.replaceChildren();
    const heading = document.createElement("h4");
    heading.textContent = location.name;
    const address = document.createElement("p");
    address.textContent = location.address;
    const precincts = document.createElement("p");
    precincts.textContent = `Serves ${location.precincts.length} precinct${location.precincts.length === 1 ? "" : "s"}: ${location.precincts.join(", ")}`;
    const actions = document.createElement("div");
    actions.className = "polling-selected-actions";
    const directions = document.createElement("a");
    directions.href = location.directions;
    directions.target = "_blank";
    directions.rel = "noopener noreferrer";
    directions.textContent = "Directions ↗";
    const verify = document.createElement("a");
    verify.href = "https://voterlookup.ohiosos.gov/voterlookup.aspx";
    verify.target = "_blank";
    verify.rel = "noopener noreferrer";
    verify.textContent = "Verify your address ↗";
    actions.append(directions, verify);
    selectedDetails.append(heading, address, precincts, actions);
    selectedDetails.hidden = false;
  };

  const selectLocation = (location, moveMap = true) => {
    selectedId = location.id;
    for (const [id, marker] of markersById) {
      marker.setZIndexOffset(id === selectedId ? 1000 : 0);
      marker.setOpacity(id === selectedId ? 1 : 0.78);
      marker.getElement()?.classList.toggle("is-selected", id === selectedId);
    }
    for (const item of locations) {
      item.card.classList.toggle("is-map-selected", item.id === selectedId);
      const button = item.card.querySelector("[data-show-location-on-map]");
      if (item.id === selectedId) button?.setAttribute("aria-current", "location");
      else button?.removeAttribute("aria-current");
    }
    mapSelection.textContent = `${location.name} · ${location.precincts.length} precinct${location.precincts.length === 1 ? "" : "s"} assigned for the November 3, 2026 General Election.`;
    makeSelectedDetails(location);
    if (moveMap && map && markersById.has(location.id)) {
      const marker = markersById.get(location.id);
      map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 12), { duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.6 });
      marker.openPopup();
    }
  };

  const filterLocations = () => {
    const query = input.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const location of locations) {
      const matches = !query || location.search.includes(query);
      location.card.hidden = !matches;
      if (matches) visible++;
      const marker = markersById.get(location.id);
      if (mapReady && marker) {
        if (matches && !map.hasLayer(marker)) marker.addTo(map);
        if (!matches && map.hasLayer(marker)) map.removeLayer(marker);
      }
    }
    count.textContent = query
      ? `Showing ${visible} of ${cards.length} polling locations matching “${input.value.trim()}”.`
      : `Showing all ${cards.length} polling locations.`;
    empty.hidden = visible !== 0;
    if (query && markersById.size) mapStatus.textContent = `${markersById.size} verified map markers are available. The map and directory are filtered together.`;
    else if (!query && mapReady) mapStatus.textContent = `${markersById.size} polling locations matched between the county GIS points and current Board of Elections address list.`;
  };

  const initializeMap = async () => {
    if (mapStarted) return;
    mapStarted = true;
    mapStatus.textContent = "Loading the county map and polling-place locations…";
    try {
      const L = await loadLeaflet();
      map = L.map(mapElement, { scrollWheelZoom: false, zoomControl: true, tap: true, preferCanvas: true }).setView([41.88, -80.76], 9);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
      }).addTo(map);

      const endpoint = "https://services6.arcgis.com/SPg6lw9jlYmTOiLi/ArcGIS/rest/services/ElectoralDistricts/FeatureServer/0/query?where=1%3D1&outFields=NAME,FULLADD,CITY,STATE,POLLINGID&returnGeometry=true&outSR=4326&f=geojson";
      const response = await fetch(endpoint, { headers: { Accept: "application/geo+json,application/json" }, mode: "cors" });
      if (!response.ok) throw new Error(`County GIS returned ${response.status}.`);
      const geojson = await response.json();
      const features = Array.isArray(geojson.features) ? geojson.features : [];
      const bounds = [];

      for (const location of locations) {
        const feature = features.find(item => addressMatches(location, item.properties || {}));
        const coordinates = feature?.geometry?.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length < 2) continue;
        const [longitude, latitude] = coordinates;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < 41 || latitude > 43 || longitude < -82 || longitude > -80) continue;
        const icon = L.divIcon({ className: "polling-pin-icon", html: `<span><b>${location.index}</b></span>`, iconSize: [34, 40], iconAnchor: [17, 38], popupAnchor: [0, -35] });
        const marker = L.marker([latitude, longitude], { icon, title: `${location.name}, ${location.address}`, alt: `Polling place ${location.index}: ${location.name}`, keyboard: true, riseOnHover: true });
        const popup = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = location.name;
        const popupAddress = document.createElement("p");
        popupAddress.textContent = location.address;
        const popupPrecincts = document.createElement("p");
        popupPrecincts.textContent = `${location.precincts.length} assigned precinct${location.precincts.length === 1 ? "" : "s"}`;
        popup.append(title, popupAddress, popupPrecincts);
        marker.bindPopup(popup);
        marker.on("click", () => selectLocation(location, false));
        marker.addTo(map);
        markersById.set(location.id, marker);
        bounds.push([latitude, longitude]);
      }

      mapReady = true;
      mapElement.setAttribute("aria-label", `Interactive map showing ${markersById.size} address-matched Ashtabula County Election Day polling places. Use Tab to focus map markers and Enter to select a location.`);
      if (bounds.length) map.fitBounds(bounds, { padding: [28, 28], maxZoom: 10 });
      else throw new Error("No county GIS polling-place addresses matched the current BOE location list.");
      mapStatus.textContent = `${markersById.size} of ${locations.length} locations matched by address between the county GIS map layer and the current Board of Elections list. Use the search results for full location and precinct details.`;
      if (selectedId) {
        const location = locations.find(item => item.id === selectedId);
        if (location) selectLocation(location);
      }
      filterLocations();
      map.invalidateSize();
    } catch (error) {
      showMapError(`${error.message} The searchable directory and official verification link are still available.`);
    }
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        initializeMap();
      }
    }, { rootMargin: "240px" });
    observer.observe(mapElement);
  } else {
    initializeMap();
  }

  form.addEventListener("submit", event => event.preventDefault());
  input.addEventListener("input", filterLocations);
  form.addEventListener("reset", () => requestAnimationFrame(() => {
    filterLocations();
    input.focus();
  }));

  root.addEventListener("click", event => {
    const button = event.target.closest("[data-show-location-on-map]");
    if (!button) return;
    const location = locations.find(item => item.id === button.dataset.showLocationOnMap);
    if (!location) return;
    if (!mapReady) {
      selectedId = location.id;
      initializeMap();
      return;
    }
    selectLocation(location);
    if (window.matchMedia("(max-width: 1000px)").matches) mapElement.scrollIntoView({ behavior: "smooth", block: "center" });
  });
})();
