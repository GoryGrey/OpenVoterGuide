// Voting worksheet state stays in this browser. No choices or notes are transmitted.
(function () {
  const KEY = 'ashtabula-worksheet-2026';
  const LEGACY_KEY = KEY;
  const ELECTION = 'November 3, 2026 General Election';

  function read() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
      if (raw && raw.version === 2 && raw.choices) return raw;
      // Preserve the original { id: label } format; upgrade it without dropping entries.
      return { version: 2, choices: raw && typeof raw === 'object' ? raw : {}, groups: {}, notes: {} };
    } catch { return { version: 2, choices: {}, groups: {}, notes: {} }; }
  }
  function write(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch { announce('Your browser could not save this worksheet. Export a backup or free up browser storage.'); }
  }
  function announce(message) {
    const status = document.getElementById('worksheet-status');
    if (status) status.textContent = message;
  }
  function selected(state) { return Object.entries(state.choices || {}).filter(([, label]) => typeof label === 'string'); }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  }
  function render() {
    const state = read();
    const count = selected(state).length;
    const countNode = document.getElementById('worksheet-count');
    if (countNode) countNode.textContent = count;
    const progress = document.getElementById('worksheet-progress');
    if (progress) { progress.value = count; progress.textContent = `${count} choices marked`; }
    const remaining = document.getElementById('worksheet-remaining');
    if (remaining && progress) remaining.textContent = `${Math.max(0, Number(progress.max) - count)} guide items remain undecided`;
    const list = document.getElementById('worksheet-list');
    if (!list) return;
    list.replaceChildren();
    const rows = selected(state);
    if (!rows.length) {
      const p = document.createElement('p');
      p.textContent = 'No choices marked yet. Browse races and ballot issues, then return here to review your plan.';
      list.append(p);
      return;
    }
    const groups = new Map();
    for (const [id, label] of rows) {
      const group = state.groups?.[id] || id;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push({ id, label });
    }
    for (const [group, choices] of groups) {
      const card = document.createElement('section');
      card.className = 'worksheet-entry';
      const title = document.createElement('h2');
      title.textContent = choices[0].label;
      card.append(title);
      if (choices.length > 1) {
        const warning = document.createElement('p');
        warning.className = 'worksheet-conflict';
        warning.textContent = 'More than one saved choice exists for this contest from an older worksheet. Review it on the race or issue page.';
        card.append(warning);
      }
      const noteLabel = document.createElement('label');
      noteLabel.htmlFor = `note-${group.replace(/[^a-z0-9_-]/gi, '-')}`;
      noteLabel.textContent = 'My research notes';
      const note = document.createElement('textarea');
      note.id = noteLabel.htmlFor;
      note.rows = 3;
      note.maxLength = 2000;
      note.value = state.notes?.[group] || '';
      note.addEventListener('input', () => {
        const current = read(); current.notes ||= {}; current.notes[group] = note.value; write(current);
      });
      card.append(noteLabel, note);
      list.append(card);
    }
  }
  function escapeDoc(value) { return escapeHTML(value).replace(/\n/g, '<br>'); }
  function itemFor(id, state) {
    const group = state.groups?.[id];
    const items = window.OVG_WORKSHEET_ITEMS || [];
    return items.find(item => item.group === group) || items.find(item => id === item.group || id.startsWith(`${item.group}-`));
  }
  function referenceLink(item) {
    if (!item?.url) return '';
    const href = new URL(item.url, window.location.origin).href;
    return `<a href="${escapeHTML(href)}">${escapeHTML(item.title || 'Review the guide page')}</a>`;
  }
  function worksheetHTML(state, mode) {
    const rows = selected(state);
    const title = mode === 'blank' ? 'Blank ballot research worksheet' : mode === 'detailed' ? 'Detailed personal ballot worksheet' : 'Quick ballot reference';
    const items = rows.length ? rows.map(([id, label]) => {
      const item = itemFor(id, state);
      const reference = mode === 'detailed' && item ? `<p class="reference">Guide page and linked sources: ${referenceLink(item)}</p>` : '';
      const note = mode === 'detailed' && state.notes?.[state.groups?.[id] || id] ? `<p class="note">${escapeDoc(state.notes[state.groups?.[id] || id])}</p>` : '';
      return `<li><strong>${escapeDoc(label)}</strong>${note}${reference}</li>`;
    }).join('') : '';
    const sampleBallotUrl = new URL('/sample-ballots/', window.location.origin).href;
    const blank = mode === 'blank' ? `<h2>Blank research worksheet</h2><p>Countywide research list; your exact contests may vary by precinct. <a href="${escapeHTML(sampleBallotUrl)}">Confirm your official precinct-specific sample ballot</a>.</p>${(window.OVG_WORKSHEET_ITEMS || []).map(item => `<section class="blank-item"><h2>${escapeHTML(item.title)}</h2><p class="kind">${escapeHTML(item.kind)}${item.kind.includes('Precinct-specific') ? ' · Verify this appears on your ballot' : ''}</p><p>Choice: ${item.options.map(escapeHTML).join(' / ')}</p><p>Research / notes: __________________________________________________________</p><p>Sources / reference: ${referenceLink(item) || '___________________________________________________________________'}</p></section>`).join('')}` : '';
    return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><style>
      @page{size:letter;margin:.65in}*{box-sizing:border-box}body{font:11pt/1.45 Arial,sans-serif;color:#102a43;margin:auto;max-width:7.2in}h1{font-size:21pt;margin:0 0 .2in}h2{font-size:14pt;margin:.22in 0 .08in}.brand{margin:0 0 .2in}.brand img{display:block;width:2.2in;height:auto;max-height:.48in;object-fit:contain;object-position:left center}.meta{color:#52687b;margin-bottom:.25in}ol{padding-left:.28in}li{padding:.1in 0;break-inside:avoid}.note{border-left:2px solid #18bfe0;padding-left:.12in;white-space:pre-wrap}.reference{font-size:9pt;overflow-wrap:anywhere}.notice{margin-top:.35in;padding:.12in;border:1px solid #9fb3c8;font-size:9pt}.blank-item{break-inside:avoid;border-bottom:1px solid #b9cad8;padding:.08in 0}.kind{font-size:9pt;color:#50677c;margin:.02in 0}@media print{body{max-width:none}}
    </style><body><p class="brand"><img src="${escapeHTML(new URL('/assets/brand/logo-horizontal-light.svg', window.location.origin).href)}" alt="OpenVoterGuide"></p><h1>${title}</h1><p class="meta">${ELECTION} · Ashtabula County, Ohio</p>${mode === 'blank' ? blank : `<ol>${items}</ol>`}<p class="notice">Private reference only, not an official ballot. Confirm all contests and selections against your official precinct-specific ballot. This file contains your personal selections and notes; keep it private.</p><script>window.addEventListener('load',()=>window.print())<\/script></body></html>`;
  }
  window.printWorksheet = function (mode = 'quick') {
    const win = window.open('', '_blank');
    if (!win) { announce('Allow pop-ups for this site to print or save a PDF.'); return; }
    win.opener = null;
    win.document.open(); win.document.write(worksheetHTML(read(), mode)); win.document.close();
  };
  window.exportWorksheet = function () {
    const blob = new Blob([JSON.stringify({ format: 'OpenVoterGuide worksheet', version: 2, election: ELECTION, exportedAt: new Date().toISOString(), data: read() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = 'openvoterguide-worksheet-backup.json'; link.click(); URL.revokeObjectURL(url);
    announce('Backup downloaded. It contains your private selections and notes.');
  };
  window.importWorksheet = function (file) {
    if (!file) return;
    const reader = new FileReader(); reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const incoming = parsed.data?.version === 2 ? parsed.data : parsed.version === 2 && parsed.choices ? parsed : null;
        if (!incoming || !incoming.choices || typeof incoming.choices !== 'object') throw new Error('This file is not a valid OpenVoterGuide worksheet backup.');
        const current = read();
        // Merge so importing never silently overwrites current choices or notes.
        current.choices = { ...incoming.choices, ...current.choices };
        current.groups = { ...incoming.groups, ...current.groups };
        current.notes = { ...incoming.notes, ...current.notes };
        write(current); render(); announce('Backup imported and merged with this browser’s existing worksheet.');
      } catch (error) { announce(error.message || 'Could not read this worksheet backup.'); }
    }; reader.readAsText(file);
  };
  window.clearWorksheet = function () {
    if (!window.confirm('Delete all worksheet choices and notes from this browser?')) return;
    localStorage.removeItem(LEGACY_KEY);
    document.querySelectorAll('[data-worksheet-id]').forEach(el => { el.checked = false; });
    render(); announce('Worksheet choices and notes cleared from this browser.');
  };
  document.addEventListener('DOMContentLoaded', () => {
    const state = read();
    document.querySelectorAll('[data-worksheet-id]').forEach(el => {
      const id = el.dataset.worksheetId;
      el.checked = Boolean(state.choices[id]);
      el.addEventListener('change', () => {
        const current = read(); const group = el.dataset.worksheetGroup || id;
        if (el.checked) {
          document.querySelectorAll(`[data-worksheet-group="${CSS.escape(group)}"]`).forEach(other => {
            if (other !== el) { other.checked = false; delete current.choices[other.dataset.worksheetId]; delete current.groups[other.dataset.worksheetId]; }
          });
          current.choices[id] = el.dataset.worksheetLabel || id; current.groups[id] = group;
        } else { delete current.choices[id]; delete current.groups[id]; }
        write(current); render();
      });
    });
    const importer = document.getElementById('worksheet-import');
    importer?.addEventListener('change', () => { window.importWorksheet(importer.files?.[0]); importer.value = ''; });
    render();
  });
})();
