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
  const layerUrl = root.dataset.precinctLayer;
  let map;
  let mapReady = false;
  let mapStarted = false;
  let precinctLayer;
  let featuresById = new Map();
  let selectedLocationId = null;
  let selectedPrecinctIds = new Set();
  let pendingSelection = null;

  const locations = cards.map((card, index) => ({
    id: card.dataset.locationId || card.querySelector("[data-show-location-on-map]")?.dataset.showLocationOnMap,
    index: index + 1,
    card,
    name: card.querySelector("h3")?.textContent.trim() || "Polling place",
    street: card.dataset.street || "",
    city: card.dataset.city || "",
    address: card.querySelector("address")?.textContent.replace(/\s+/g, " ").trim() || "",
    search: card.dataset.search || "",
    precincts: [...card.querySelectorAll(".polling-precinct-section li")].map(item => ({
      id: item.querySelector("[data-show-precinct-on-map]")?.dataset.showPrecinctOnMap,
      name: item.querySelector("[data-precinct-name]")?.textContent.trim() || ""
    })),
    directions: card.querySelector(".polling-directions")?.href || ""
  }));
  const precinctById = new Map(locations.flatMap(location => location.precincts.map(precinct => [precinct.id, { ...precinct, location }])));
  const nameKey = value => String(value || "").toLocaleUpperCase("en-US").replace(/[^A-Z0-9]/g, "");
  const precinctAliases = new Map([
    [nameKey("GENEVA ON LAKE VILLAGE"), nameKey("GEN ON LAKE VILL")],
    [nameKey("JEFFERSON VILLAGE 1"), nameKey("JEFF VILL 1")],
    [nameKey("JEFFERSON VILLAGE 2"), nameKey("JEFF VILL 2")],
    [nameKey("JEFFERSON VILLAGE 3"), nameKey("JEFF VILL 3")]
  ]);
  const censusNameKey = name => precinctAliases.get(nameKey(name)) || nameKey(name);

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

  const setSelectionStyles = () => {
    if (!precinctLayer) return;
    precinctLayer.eachLayer(layer => {
      const precinct = featuresById.get(censusNameKey(layer.feature.properties?.NAME));
      const selected = precinct && selectedPrecinctIds.has(precinct.id);
      layer.setStyle(selected
        ? { color: "#005e9e", weight: 3, opacity: 1, fillColor: "#00c8d7", fillOpacity: 0.62 }
        : { color: "#2873a6", weight: 1.25, opacity: 0.9, fillColor: "#54b9e8", fillOpacity: 0.13 });
      const element = layer.getElement?.();
      if (element && precinct) {
        element.setAttribute("tabindex", "0");
        element.setAttribute("role", "button");
        element.setAttribute("aria-label", `${precinct.name}, assigned to ${precinct.location.name}`);
        element.setAttribute("aria-pressed", String(Boolean(selected)));
      }
    });
  };

  const showSelection = (location, precincts, singularPrecinct = null) => {
    selectedDetails.replaceChildren();
    const heading = document.createElement("h4");
    heading.textContent = singularPrecinct ? singularPrecinct.name : location.name;
    const address = document.createElement("p");
    address.textContent = `${location.name} · ${location.address}`;
    const precinctText = document.createElement("p");
    precinctText.textContent = singularPrecinct
      ? `${singularPrecinct.name} is assigned to this polling place for the November 3, 2026 General Election.`
      : `${precincts.length} assigned precinct${precincts.length === 1 ? "" : "s"}: ${precincts.map(item => item.name).join(", ")}`;
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
    selectedDetails.append(heading, address, precinctText, actions);
    selectedDetails.hidden = false;
  };

  const selectLocation = (location, moveMap = true) => {
    selectedLocationId = location.id;
    selectedPrecinctIds = new Set(location.precincts.map(precinct => precinct.id));
    for (const item of locations) {
      item.card.classList.toggle("is-map-selected", item.id === location.id);
      const button = item.card.querySelector("[data-show-location-on-map]");
      if (item.id === location.id) button?.setAttribute("aria-current", "location");
      else button?.removeAttribute("aria-current");
    }
    mapSelection.textContent = `${location.name} serves ${location.precincts.length} precinct${location.precincts.length === 1 ? "" : "s"}. The assigned precinct areas are highlighted on the map.`;
    showSelection(location, location.precincts);
    setSelectionStyles();
    if (moveMap && map && precinctLayer) {
      const selectedLayers = [];
      precinctLayer.eachLayer(layer => {
        const precinct = featuresById.get(censusNameKey(layer.feature.properties?.NAME));
        if (precinct && selectedPrecinctIds.has(precinct.id)) selectedLayers.push(layer);
      });
      if (selectedLayers.length) {
        const bounds = selectedLayers.reduce((result, layer) => result.extend(layer.getBounds()), window.L.latLngBounds([]));
        map.flyToBounds(bounds, { padding: [24, 24], maxZoom: 10, duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.55 });
      }
    }
  };

  const selectPrecinct = (precinct, layer = null) => {
    selectedLocationId = precinct.location.id;
    selectedPrecinctIds = new Set([precinct.id]);
    for (const item of locations) {
      item.card.classList.toggle("is-map-selected", item.id === precinct.location.id);
      const button = item.card.querySelector("[data-show-location-on-map]");
      if (item.id === precinct.location.id) button?.setAttribute("aria-current", "location");
      else button?.removeAttribute("aria-current");
    }
    mapSelection.textContent = `${precinct.name} is assigned to ${precinct.location.name}. This precinct boundary is highlighted.`;
    showSelection(precinct.location, [precinct], precinct);
    setSelectionStyles();
    if (layer && map) map.flyToBounds(layer.getBounds(), { padding: [24, 24], maxZoom: 12, duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.55 });
  };

  const initializeMap = async () => {
    if (mapStarted) return;
    mapStarted = true;
    mapStatus.textContent = "Loading the 2020 precinct boundaries…";
    try {
      const L = await loadLeaflet();
      map = L.map(mapElement, { scrollWheelZoom: false, zoomControl: true, tap: true }).setView([41.88, -80.76], 9);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
      }).addTo(map);

      const endpoint = new URL(`${layerUrl}/query`);
      endpoint.search = new URLSearchParams({ where: "STATE='39' AND COUNTY='007' AND VTDI='A'", outFields: "NAME,GEOID,VTD", returnGeometry: "true", outSR: "4326", f: "geojson" });
      const response = await fetch(endpoint, { headers: { Accept: "application/geo+json,application/json" }, mode: "cors" });
      if (!response.ok) throw new Error(`Census TIGERweb returned ${response.status}.`);
      const geojson = await response.json();
      const features = Array.isArray(geojson.features) ? geojson.features : [];
      const censusPrecincts = new Map();
      for (const location of locations) {
        for (const precinct of location.precincts) {
          const key = censusNameKey(precinct.name);
          if (censusPrecincts.has(key)) throw new Error(`The Board of Elections list repeats precinct ${precinct.name}.`);
          censusPrecincts.set(key, { ...precinct, location });
        }
      }
      featuresById = new Map();
      for (const feature of features) {
        const key = censusNameKey(feature.properties?.NAME);
        const precinct = censusPrecincts.get(key);
        if (!precinct || featuresById.has(key)) throw new Error("Census boundary names do not map uniquely to the current Board of Elections precinct list.");
        featuresById.set(key, precinct);
      }
      if (features.length !== 104 || featuresById.size !== 104 || [...censusPrecincts.keys()].some(key => !featuresById.has(key))) {
        throw new Error(`The Census boundary layer matched ${featuresById.size} of 104 current precincts; complete coverage is required before highlighting.`);
      }

      precinctLayer = L.geoJSON(geojson, {
        style: { color: "#2873a6", weight: 1.25, opacity: 0.9, fillColor: "#54b9e8", fillOpacity: 0.13 },
        onEachFeature(feature, layer) {
          const precinct = featuresById.get(censusNameKey(feature.properties?.NAME));
          if (!precinct) return;
          const popup = document.createElement("div");
          popup.textContent = `${precinct.name} · ${precinct.location.name}`;
          layer.bindPopup(popup);
          layer.on("click", () => selectPrecinct(precinct, layer));
          layer.on("add", () => {
            const element = layer.getElement?.();
            if (!element) return;
            element.addEventListener("keydown", event => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectPrecinct(precinct, layer);
              }
            });
          });
        }
      }).addTo(map);
      mapReady = true;
      const bounds = precinctLayer.getBounds();
      if (!bounds.isValid()) throw new Error("The Census boundary layer did not include usable geometry.");
      map.fitBounds(bounds, { padding: [18, 18] });
      mapElement.setAttribute("aria-label", "Interactive map of the 104 Ashtabula County precinct boundaries from the 2020 U.S. Census. Use Tab and Enter to select map areas, or use the location directory.");
      mapStatus.textContent = "All 104 current Board of Elections precinct names matched to 2020 Census boundaries. Select a map area or a location card to highlight its assigned precincts.";
      setSelectionStyles();
      if (pendingSelection?.type === "precinct") selectPrecinct(pendingSelection.precinct);
      else if (pendingSelection?.type === "location") selectLocation(pendingSelection.location);
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
  input.addEventListener("input", () => {
    const query = input.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const location of locations) {
      const matches = !query || location.search.includes(query);
      location.card.hidden = !matches;
      if (matches) visible++;
    }
    count.textContent = query
      ? `Showing ${visible} of ${cards.length} polling locations matching “${input.value.trim()}”.`
      : `Showing all ${cards.length} polling locations.`;
    empty.hidden = visible !== 0;
  });
  form.addEventListener("reset", () => requestAnimationFrame(() => {
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  }));

  root.addEventListener("click", event => {
    const locationButton = event.target.closest("[data-show-location-on-map]");
    if (locationButton) {
      const location = locations.find(item => item.id === locationButton.dataset.showLocationOnMap);
      if (!location) return;
      if (!mapReady) {
        selectedLocationId = location.id;
        selectedPrecinctIds = new Set(location.precincts.map(precinct => precinct.id));
        pendingSelection = { type: "location", location };
        initializeMap();
        return;
      }
      selectLocation(location);
      if (window.matchMedia("(max-width: 1000px)").matches) mapElement.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const precinctButton = event.target.closest("[data-show-precinct-on-map]");
    if (precinctButton) {
      const precinct = precinctById.get(precinctButton.dataset.showPrecinctOnMap);
      if (!precinct) return;
      if (!mapReady) {
        selectedLocationId = precinct.location.id;
        selectedPrecinctIds = new Set([precinct.id]);
        pendingSelection = { type: "precinct", precinct };
        initializeMap();
        return;
      }
      const feature = [...precinctLayer.getLayers()].find(layer => censusNameKey(layer.feature.properties?.NAME) === censusNameKey(precinct.name));
      selectPrecinct(precinct, feature || null);
      if (window.matchMedia("(max-width: 1000px)").matches) mapElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
})();
