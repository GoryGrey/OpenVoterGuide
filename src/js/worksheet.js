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
  const guidedItems = window.OVG_WORKSHEET_ITEMS || [];
  let guidedIndex = 0;

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = String(text);
    if (className) node.className = className;
    return node;
  }
  function appendLink(parent, href, label) {
    if (!href || !label) return;
    const link = element('a', label);
    link.href = new URL(href, window.location.origin).href;
    if (/^https?:\/\//i.test(link.href) && new URL(link.href).origin !== window.location.origin) {
      link.target = '_blank'; link.rel = 'noopener noreferrer';
    }
    parent.append(link);
  }
  function appendLinks(parent, links) {
    if (!links?.length) return;
    const list = element('ul', null, 'guided-source-list');
    for (const source of links) {
      const item = element('li'); appendLink(item, source.url, source.label); list.append(item);
    }
    parent.append(list);
  }
  function appendList(parent, title, entries, evidenceField) {
    if (!entries?.length) return;
    parent.append(element('h5', title));
    const list = element('ul', null, 'guided-fact-list');
    entries.forEach((entry, index) => {
      const row = element('li'); row.append(element('p', entry));
      const evidence = evidenceField?.[index];
      if (evidence) {
        const citation = element('p', `${evidence.status ? `Evidence: ${evidence.status.replaceAll('_', ' ')}. ` : ''}${evidence.note || ''}`, 'guided-evidence');
        if (evidence.sources?.length) {
          for (const source of evidence.sources) {
            appendLink(citation, source.url, source.label);
          }
        }
        row.append(citation);
      }
      list.append(row);
    });
    parent.append(list);
  }
  function appendFact(parent, label, value, className = '') {
    if (!value) return;
    const row = element('div', null, `guided-fact ${className}`.trim());
    row.append(element('dt', label), element('dd', value)); parent.append(row);
  }
  function activeChoiceId(item, state) {
    const choices = Object.keys(state.choices || {});
    return choices.find(id => state.groups?.[id] === item.group) || choices.find(id => id.startsWith(`${item.group}-`)) || '';
  }
  function saveGuidedChoice(item, choice) {
    const state = read(); state.groups ||= {};
    for (const id of Object.keys(state.choices || {})) {
      if (state.groups[id] === item.group || id.startsWith(`${item.group}-`)) {
        delete state.choices[id]; delete state.groups[id];
      }
    }
    state.choices[choice.id] = choice.label || choice.value || choice.id; state.groups[choice.id] = item.group;
    write(state); render();
    const status = document.getElementById('worksheet-guided-status');
    if (status) status.textContent = `${choice.value === choice.label ? choice.label : choice.value} saved in this browser. Review the information, then continue when you’re ready.`;
    updateGuidedControls();
  }
  function renderGuidedItem(item, container, state) {
    container.replaceChildren();
    container.append(element('p', item.kind, 'guided-kind'));
    container.append(element('h3', item.title, 'guided-item-title'));
    const summary = element('p', 'Review the information and sources below. Your choice saves only in this browser.', 'guided-item-intro');
    container.append(summary);

    const choices = element('fieldset', null, 'guided-choices');
    choices.append(element('legend', item.kind === 'Race' ? 'Choose a candidate or mark this contest' : 'Your worksheet response'));
    const selectedId = activeChoiceId(item, state);
    for (const choice of item.choices || []) {
      const label = element('label', null, 'guided-choice');
      const input = element('input'); input.type = 'radio'; input.name = `guided-${item.group}`; input.value = choice.id;
      input.checked = choice.id === selectedId;
      input.addEventListener('change', () => saveGuidedChoice(item, choice));
      label.append(input, element('span', choice.value)); choices.append(label);
    }
    container.append(choices);

    const context = item.context || {};
    if (item.kind === 'Race') {
      const raceFacts = element('dl', null, 'guided-facts');
      appendFact(raceFacts, context.district ? 'District' : '', context.district);
      appendFact(raceFacts, 'Term and seat', context.term_info);
      appendFact(raceFacts, 'Contest details checked', context.verification_date);
      if (raceFacts.children.length) container.append(raceFacts);
      container.append(element('p', 'The candidate summaries below include sourced backgrounds, campaign statements, and available voting records. Open a full profile to read its complete evidence.', 'guided-source-note'));
      const candidates = element('div', null, 'guided-candidates');
      for (const candidate of context.candidates || []) {
        const card = element('article', null, 'guided-candidate');
        const heading = element('div', null, 'guided-candidate-heading');
        heading.append(element('h4', candidate.name));
        const affiliation = [candidate.party, candidate.incumbent ? 'Incumbent' : ''].filter(Boolean).join(' · ');
        if (affiliation) heading.append(element('p', affiliation));
        card.append(heading);
        if (candidate.response_status) card.append(element('p', candidate.response_status, 'guided-response-status'));
        if (candidate.background) {
          card.append(element('h5', 'Background'));
          card.append(element('p', candidate.background));
          const evidence = candidate.claim_evidence?.background?.[0];
          if (evidence) {
            const ev = element('p', `${evidence.status ? `Evidence: ${evidence.status.replaceAll('_', ' ')}. ` : ''}${evidence.note || ''}`, 'guided-evidence');
            appendLinks(ev, evidence.sources); card.append(ev);
          }
        } else card.append(element('p', 'No sourced background summary is listed yet. That absence is not evidence for or against the candidate.', 'guided-source-note'));
        appendList(card, 'Campaign statements and positions', candidate.promises, candidate.claim_evidence?.promises);
        appendList(card, 'Voting record', candidate.record, candidate.claim_evidence?.record);
        if (candidate.correlation) card.append(element('p', candidate.correlation, 'guided-source-note'));
        appendList(card, 'Statements about ballot issues', (candidate.measure_positions || []).map(entry => `${entry.issue_label}: ${entry.position}. ${entry.statement} (checked ${entry.checked_on})`));
        if (candidate.sources?.length) {
          const sources = element('details', null, 'guided-sources'); sources.open = true;
          sources.append(element('summary', 'Sources for this candidate'));
          appendLinks(sources, candidate.sources); card.append(sources);
        }
        const profile = element('p', null, 'guided-profile-link'); appendLink(profile, candidate.profile_url, `Read ${candidate.name}’s full profile and evidence`); card.append(profile);
        candidates.append(card);
      }
      container.append(candidates);
      appendLink(container, item.url, `Read the full ${item.title} race guide`);
    } else if (item.kind === 'Ballot measure') {
      container.append(element('h4', 'What this measure would do'));
      container.append(element('p', context.plain_english));
      const impacts = element('div', null, 'guided-impact-grid');
      impacts.append(element('section', null, 'guided-impact guided-impact-yes'));
      impacts.children[0].append(element('h4', 'A YES vote means'), element('p', context.yes_means));
      impacts.append(element('section', null, 'guided-impact guided-impact-no'));
      impacts.children[1].append(element('h4', 'A NO vote means'), element('p', context.no_means));
      container.append(impacts);
      if (context.supporters_say || context.opponents_say) {
        const argumentSection = element('section', null, 'guided-arguments');
        argumentSection.append(element('h4', 'Arguments in the official voter information'));
        if (context.supporters_say) argumentSection.append(element('p', `Supporters: ${context.supporters_say}`));
        if (context.opponents_say) argumentSection.append(element('p', `Opponents: ${context.opponents_say}`));
        container.append(argumentSection);
      }
      if (context.official_ballot_language) {
        const language = element('details', null, 'guided-official-language');
        language.append(element('summary', 'Show official ballot language'), element('p', context.official_ballot_language));
        container.append(language);
      }
      if (context.verification_date) container.append(element('p', `Sources checked ${context.verification_date}. The official wording on your precinct ballot controls.`, 'guided-source-note'));
      appendLinks(container, context.sources);
      appendLink(container, item.url, 'Open full issue guide, including candidate statements');
    } else if (item.kind === 'Property tax levy') {
      const facts = element('dl', null, 'guided-facts');
      appendFact(facts, 'Jurisdiction', context.jurisdiction);
      appendFact(facts, 'Purpose', context.purpose);
      appendFact(facts, 'Type', `${String(context.levy_type || '').replaceAll('_', ' ')}${context.tax_change ? ' · changes the tax' : ' · renewal'}`);
      appendFact(facts, 'Proposed rate', `${context.millage} ${Number(context.millage) === 1 ? 'mill' : 'mills'}`);
      appendFact(facts, 'Term', context.term_years ? `${context.term_years} years` : 'Not listed');
      appendFact(facts, 'Details checked', context.verification_date);
      container.append(facts);
      container.append(element('p', context.yes_means, 'guided-impact guided-impact-yes'));
      container.append(element('p', context.no_means, 'guided-impact guided-impact-no'));
      if (context.notes) container.append(element('p', `For the district: ${context.notes}`, 'guided-source-note'));
      if (Number.isFinite(context.estimate_at_100k)) {
        container.append(element('h4', 'Example individual impact'));
        container.append(element('p', `At a $100,000 appraised home value: about $${context.estimate_at_100k.toFixed(2)} per year (${context.estimate_kind}), before reductions.`, 'guided-estimate'));
        container.append(element('p', context.estimate_explainer, 'guided-source-note'));
      }
      container.append(element('p', 'The rate and estimated amount may not apply to your property. Check the district, full explanation, and the County Auditor’s personalized estimator before deciding.', 'guided-source-note'));
      appendLinks(container, context.sources);
      appendLink(container, item.url, 'Open full levy page and personalized property-tax estimator');
    } else if (item.kind === 'Precinct-specific liquor question') {
      const facts = element('dl', null, 'guided-facts');
      appendFact(facts, 'Precinct', context.precinct);
      appendFact(facts, 'Establishment', context.establishment);
      appendFact(facts, 'Address', context.address);
      appendFact(facts, 'Business and permit', `${context.business_type || ''}${context.permit_type ? ` · ${context.permit_type} permit` : ''}`);
      appendFact(facts, 'Sunday sales requested', context.sales_type);
      appendFact(facts, 'Ballot details checked', context.verification_date);
      container.append(facts);
      container.append(element('p', context.plain_english));
      container.append(element('p', `A YES vote: ${context.yes_means}`, 'guided-impact guided-impact-yes'));
      container.append(element('p', `A NO vote: ${context.no_means}`, 'guided-impact guided-impact-no'));
      if (context.official_ballot_language) {
        const language = element('details', null, 'guided-official-language');
        language.append(element('summary', 'Show official ballot language'), element('p', context.official_ballot_language));
        container.append(language);
      }
      container.append(element('p', `This question applies only to voters in ${context.precinct}. Confirm that it appears on your official sample ballot.`, 'guided-source-note'));
      appendLinks(container, context.sources);
      appendLink(container, item.url, 'Open this liquor question on the full guide');
    }
  }
  function updateGuidedControls() {
    const item = guidedItems[guidedIndex];
    const next = document.getElementById('worksheet-guided-next');
    const back = document.getElementById('worksheet-guided-back');
    const skip = document.getElementById('worksheet-guided-skip');
    if (!item || !next) return;
    const hasChoice = Boolean(activeChoiceId(item, read()));
    next.disabled = !hasChoice;
    next.textContent = guidedIndex === guidedItems.length - 1 ? 'Finish and review my worksheet' : hasChoice ? 'Next item' : 'Choose an option to continue';
    if (back) back.disabled = guidedIndex === 0;
    if (skip) skip.textContent = guidedIndex === guidedItems.length - 1 ? 'Skip this item and finish' : 'Skip for now';
  }
  function renderGuidedStep() {
    if (!guidedItems.length) return;
    const item = guidedItems[guidedIndex];
    const position = document.getElementById('worksheet-guided-position');
    const progress = document.getElementById('worksheet-guided-progress');
    const step = document.getElementById('worksheet-guided-step');
    const status = document.getElementById('worksheet-guided-status');
    if (position) position.textContent = `Step ${guidedIndex + 1} of ${guidedItems.length} · ${item.kind}`;
    if (progress) { progress.max = guidedItems.length; progress.value = guidedIndex + 1; }
    if (status) status.textContent = '';
    if (step) renderGuidedItem(item, step, read());
    updateGuidedControls();
  }
  function openGuidedSetup() {
    const state = read();
    const requestedItem = new URLSearchParams(window.location.search).get('item');
    const requestedIndex = guidedItems.findIndex(item => item.group === requestedItem);
    const firstUnanswered = guidedItems.findIndex(item => !activeChoiceId(item, state));
    guidedIndex = requestedIndex >= 0 ? requestedIndex : firstUnanswered < 0 ? 0 : firstUnanswered;
    const root = document.getElementById('worksheet-root');
    root?.classList.add('is-guided');
    const launch = document.getElementById('worksheet-guided-launch'); if (launch) launch.hidden = true;
    const guided = document.getElementById('worksheet-guided'); if (guided) guided.hidden = false;
    renderGuidedStep();
    document.getElementById('worksheet-guided-step')?.focus?.();
  }
  function closeGuidedSetup(message = 'Guided setup paused. Your choices remain saved in this browser.') {
    document.getElementById('worksheet-root')?.classList.remove('is-guided');
    const launch = document.getElementById('worksheet-guided-launch'); if (launch) launch.hidden = false;
    const guided = document.getElementById('worksheet-guided'); if (guided) guided.hidden = true;
    const status = document.getElementById('worksheet-status'); if (status) status.textContent = message;
    render();
  }
  function advanceGuided(skip = false) {
    const status = document.getElementById('worksheet-guided-status');
    if (skip && status) status.textContent = 'Skipped for now. No choice was changed; you can return to this item later.';
    if (guidedIndex < guidedItems.length - 1) { guidedIndex += 1; renderGuidedStep(); }
    else closeGuidedSetup('You reached the end of the guided worksheet. Review your saved choices and check your official precinct ballot.');
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
    document.getElementById('worksheet-guided-start')?.addEventListener('click', openGuidedSetup);
    document.getElementById('worksheet-guided-back')?.addEventListener('click', () => {
      if (guidedIndex > 0) { guidedIndex -= 1; renderGuidedStep(); }
    });
    document.getElementById('worksheet-guided-skip')?.addEventListener('click', () => advanceGuided(true));
    document.getElementById('worksheet-guided-next')?.addEventListener('click', () => {
      if (activeChoiceId(guidedItems[guidedIndex], read())) advanceGuided(false);
    });
    document.getElementById('worksheet-guided-exit')?.addEventListener('click', () => closeGuidedSetup());
    render();
    const linkedItem = new URLSearchParams(window.location.search).get('item');
    if (linkedItem && guidedItems.some(item => item.group === linkedItem)) openGuidedSetup();
  });
})();
