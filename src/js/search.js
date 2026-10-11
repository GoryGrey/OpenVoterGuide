// Client-side search - no backend, no tracking
(function() {
  let searchIndex = [];

  async function buildIndex() {
    try {
      const res = await fetch(window.OVG_SEARCH_INDEX || '/OpenVoterGuide/search-index.json');
      if (!res.ok) throw new Error('Search index request failed');
      searchIndex = await res.json();
    } catch (e) {
      console.warn('Search index not available');
    }
  }

  const input = document.getElementById('site-search');
  const results = document.getElementById('search-results');
  const basePath = document.querySelector('meta[name="ovg-base-path"]')?.content || '/OpenVoterGuide/';
  if (!input || !results) return;

  input.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (q.length < 2) {
      results.style.display = 'none';
      return;
    }
    const matches = searchIndex.filter(item =>
      item.title.toLowerCase().includes(q) ||
      (item.keywords && item.keywords.toLowerCase().includes(q))
    ).slice(0, 8);

    results.innerHTML = '';
    if (matches.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No matching pages found.';
      results.appendChild(empty);
      results.style.display = 'block';
      return;
    }
    matches.forEach((item) => {
      const link = document.createElement('a');
      link.href = basePath + item.url.replace(/^\/+/, '');
      const title = document.createElement('strong');
      title.textContent = item.title;
      const type = document.createElement('small');
      type.textContent = item.type;
      link.append(title, document.createElement('br'), type);
      results.appendChild(link);
    });
    results.style.display = 'block';
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) results.style.display = 'none';
  });

  buildIndex();
})();
