// Personal voting worksheet - localStorage only, nothing leaves the browser
(function() {
  const KEY = 'ashtabula-worksheet-2026';

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch { return {}; }
  }
  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  // Restore checked boxes on page load
  document.addEventListener('DOMContentLoaded', () => {
    const saved = load();
    document.querySelectorAll('[data-worksheet-id]').forEach(el => {
      const id = el.getAttribute('data-worksheet-id');
      if (saved[id]) el.checked = true;
      el.addEventListener('change', () => {
        const current = load();
        if (el.checked) current[id] = el.getAttribute('data-worksheet-label') || id;
        else delete current[id];
        save(current);
        updateSummary();
      });
    });
    updateSummary();
  });

  function updateSummary() {
    const saved = load();
    const count = Object.keys(saved).length;
    const el = document.getElementById('worksheet-count');
    if (el) el.textContent = count;
  }

  // Print worksheet
  window.printWorksheet = function() {
    const saved = load();
    const win = window.open('', '_blank');
    win.document.write('<html><head><title>My Ballot Worksheet</title>');
    win.document.write('<style>body{font-family:sans-serif;max-width:700px;margin:2rem auto;padding:0 1rem}h1{font-size:1.5rem}li{margin:0.5rem 0}</style>');
    win.document.write('</head><body>');
    win.document.write('<h1>My Ballot Worksheet - Nov 3, 2026</h1>');
    win.document.write('<p>Ashtabula County, Ohio General Election</p><ul>');
    for (const [id, label] of Object.entries(saved)) {
      win.document.write(`<li><strong>${label}</strong></li>`);
    }
    win.document.write('</ul><p><em>Private reference only. Not an official ballot.</em></p>');
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  window.clearWorksheet = function() {
    if (confirm('Clear all your worksheet choices?')) {
      localStorage.removeItem(KEY);
      document.querySelectorAll('[data-worksheet-id]').forEach(el => el.checked = false);
      updateSummary();
    }
  };
})();
