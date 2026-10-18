(() => {
  const root = document.querySelector("[data-polling-explorer]");
  if (!root) return;

  const form = root.querySelector("[data-polling-search-form]");
  const input = root.querySelector("#polling-search-input");
  const cards = [...root.querySelectorAll("[data-polling-location]")];
  const count = root.querySelector("[data-polling-result-count]");
  const empty = root.querySelector("[data-polling-no-results]");
  const frameWrap = root.querySelector("[data-polling-map-frame-wrap]");
  const frame = root.querySelector("[data-polling-map-frame]");
  const openMap = root.querySelector("[data-polling-map-open]");
  const selection = root.querySelector("[data-polling-map-selection]");

  const filterLocations = () => {
    const query = input.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const card of cards) {
      const matches = !query || card.dataset.search.includes(query);
      card.hidden = !matches;
      if (matches) visible++;
    }
    count.textContent = query
      ? `Showing ${visible} of ${cards.length} polling locations matching “${input.value.trim()}”.`
      : `Showing all ${cards.length} polling locations.`;
    empty.hidden = visible !== 0;
  };

  form.addEventListener("submit", event => event.preventDefault());
  input.addEventListener("input", filterLocations);
  form.addEventListener("reset", () => requestAnimationFrame(() => {
    filterLocations();
    input.focus();
  }));

  root.addEventListener("click", event => {
    const button = event.target.closest("[data-map-url]");
    if (!button) return;
    const url = button.dataset.mapUrl;
    if (!url || !url.startsWith("https://www.boe.ohio.gov/ashtabula/c/precmap/")) return;
    frame.src = url;
    frameWrap.hidden = false;
    openMap.href = url;
    openMap.hidden = false;
    selection.textContent = `${button.dataset.precinctName} · Official county reference map`;
    for (const selected of root.querySelectorAll("[data-map-url][aria-pressed='true']")) selected.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-pressed", "true");
  });
})();
