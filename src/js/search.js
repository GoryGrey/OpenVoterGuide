// Client-side search - no backend, no tracking
(function() {
  let searchIndex = [];

  // Build index from page data
  async function buildIndex() {
    try {
      const res = await fetch('/search-index.json');
      searchIndex = await res.json();
    } catch (e) {
      console.warn('Search index not available');
    }
  }

  const input = document.getElementById('site-search');
  const results = document.getElementById('search-results');
  if (!input || !results) return;

  input.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (q.length < 2) {
      results.style.display = 'none';
      return;
    }
    const matches = searchIndex
      .filter(item =>
        item.title.toLowerCase().includes(q) ||
        (item.keywords && item.keywords.toLowerCase().includes(q))
      )
      .slice(0, 8);

    if (matches.length === 0) {
      results.style.display = 'none';
      return;
    }
    results.innerHTML = matches
      .map(m => `<a href="${m.url}"><strong>${m.title}</strong><br><small>${m.type}</small></a>`)
      .join('');
    results.style.display = 'block';
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) results.style.display = 'none';
  });

  buildIndex();
})();
