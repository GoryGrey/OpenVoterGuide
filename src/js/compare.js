// Candidate comparison - side by side view
window.showComparison = async function(raceId) {
  const aSlug = document.getElementById('compare-a').value;
  const bSlug = document.getElementById('compare-b').value;
  const result = document.getElementById('comparison-result');

  if (!aSlug || !bSlug) {
    alert('Please select two candidates to compare.');
    return;
  }
  if (aSlug === bSlug) {
    alert('Please select two different candidates.');
    return;
  }

  try {
    const res = await fetch('/search-index.json');
    const racesRes = await fetch(`/races/${raceId}/`).then(r => r.text());

    // Parse candidates from the page's data
    // We'll fetch the race JSON directly
    const raceData = await fetch('/api/races.json').then(r => r.json()).catch(() => null);

    // Fallback: extract from DOM
    const cardA = document.getElementById(aSlug);
    const cardB = document.getElementById(bSlug);

    if (!cardA || !cardB) {
      alert('Could not find candidate data.');
      return;
    }

    result.style.display = 'block';
    result.innerHTML = `
      <div class="comparison-grid">
        <div class="comparison-col">${cardA.outerHTML}</div>
        <div class="comparison-col">${cardB.outerHTML}</div>
      </div>
      <button onclick="document.getElementById('comparison-result').style.display='none'">Close comparison</button>
    `;
    result.scrollIntoView({ behavior: 'smooth' });
  } catch (e) {
    console.error('Comparison failed:', e);
    alert('Could not load comparison. Please try again.');
  }
};
