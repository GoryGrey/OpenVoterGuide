const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

class Element {
  constructor(tag = "div", dataset = {}) {
    this.tagName = tag.toUpperCase();
    this.dataset = dataset;
    this.listeners = {};
    this.children = [];
    this.checked = false;
    this.value = "";
    this.files = [];
    this.attributes = {};
    this.hidden = false;
    this.classList = { add: (...names) => { this.className = [...new Set(`${this.className || ''} ${names.join(' ')}`.trim().split(/\s+/))].join(' '); }, remove: (...names) => { this.className = (this.className || '').split(/\s+/).filter((name) => !names.includes(name)).join(' '); } };
  }
  addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
  dispatch(name) { for (const callback of this.listeners[name] || []) callback({ target: this }); }
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; }
  setAttribute(key, value) { this.attributes[key] = value; }
  click() { this.clicked = true; }
}

const controls = [
  new Element("input", { worksheetId: "race-a", worksheetGroup: "race-1", worksheetLabel: "Race 1: Candidate A" }),
  new Element("input", { worksheetId: "race-b", worksheetGroup: "race-1", worksheetLabel: "Race 1: Candidate B" }),
  new Element("input", { worksheetId: "race-undecided", worksheetGroup: "race-1", worksheetLabel: "Race 1: Undecided" }),
  new Element("input", { worksheetId: "measure-yes", worksheetGroup: "measure-1", worksheetLabel: "Issue 1: YES" }),
  new Element("input", { worksheetId: "measure-no", worksheetGroup: "measure-1", worksheetLabel: "Issue 1: NO" })
];
const nodes = new Map();
const domListeners = {};
const storage = new Map([["ashtabula-worksheet-2026", JSON.stringify({ "race-a": "Race 1: Candidate A" })]]);
let printDocument = "";
const document = {
  addEventListener(name, callback) { (domListeners[name] ||= []).push(callback); },
  getElementById(id) { if (!nodes.has(id)) nodes.set(id, new Element()); return nodes.get(id); },
  querySelectorAll(selector) {
    if (selector === "[data-worksheet-id]") return controls;
    const match = selector.match(/^\[data-worksheet-group="(.*)"\]$/);
    return match ? controls.filter((control) => control.dataset.worksheetGroup === match[1]) : [];
  },
  createElement(tag) { return new Element(tag); },
  createTextNode(text) { const el = new Element("text"); el.textContent = text; return el; }
};
class FileReader {
  readAsText(file) { this.result = file.text; this.onload(); }
}
class BrowserURL extends URL {
  static createObjectURL() { return "blob:test"; }
  static revokeObjectURL() {}
}
const window = {
  OVG_WORKSHEET_ITEMS: [
    { group: "race-1", kind: "Race", title: "U.S. Senator", options: ["Candidate A", "Candidate B"], url: "/races/us-senator/", choices: [{ id: "race-1-candidate-a", value: "Candidate A" }, { id: "race-1-undecided", value: "Undecided" }, { id: "race-1-not-on-ballot", value: "Not on my ballot" }], context: { term_info: "Six-year term", verification_date: "2026-10-11", candidates: [{ name: "Candidate A", party: "Independent", incumbent: false, background: "Community organizer", response_status: "Responded to the voter questionnaire", promises: ["Expand transit"], claim_evidence: { promises: [{ status: "candidate_statement", note: "From the campaign questionnaire", sources: [{ url: "https://example.org/statement", label: "Campaign questionnaire" }] }] }, record: ["No voting record available"], correlation: "Selected statements only.", profile_url: "/candidates/us-senator/candidate-a/", sources: [] }] } },
    { group: "measure-1", kind: "Ballot measure", title: "Issue 1: Measure", options: ["YES", "NO", "Undecided"], url: "/measures/issue-1/", choices: [{ id: "measure-1-yes", value: "YES" }, { id: "measure-1-no", value: "NO" }, { id: "measure-1-undecided", value: "Undecided" }, { id: "measure-1-not-on-ballot", value: "Not on my ballot" }], context: { plain_english: "Creates a county fund.", yes_means: "The fund is created.", no_means: "The fund is not created.", official_ballot_language: "Shall a county fund be created?", supporters_say: "Supporters say it funds services.", opponents_say: "Opponents say it raises costs.", sources: [{ url: "https://example.org/measure", label: "Official guide" }] } },
    { group: "levy-4", kind: "Property tax levy", title: "Issue 4: Parks", options: ["YES", "NO", "Undecided"], url: "/levies/issue-4/", choices: [{ id: "levy-4-yes", value: "YES" }, { id: "levy-4-no", value: "NO" }, { id: "levy-4-undecided", value: "Undecided" }, { id: "levy-4-not-on-ballot", value: "Not on my ballot" }], context: { jurisdiction: "County", purpose: "Parks", levy_type: "additional", millage: .5, term_years: 15, yes_means: "Adds the tax.", no_means: "Does not add the tax.", estimate_at_100k: 17.5, estimate_kind: "new tax", estimate_explainer: "Rough estimate before reductions.", sources: [] } },
    { group: "liquor-2", kind: "Precinct-specific liquor question", title: "Issue 2: Sunday sales", options: ["YES", "NO", "Undecided"], url: "/measures/liquor/", choices: [{ id: "liquor-2-yes", value: "YES" }, { id: "liquor-2-no", value: "NO" }, { id: "liquor-2-undecided", value: "Undecided" }, { id: "liquor-2-not-on-ballot", value: "Not on my ballot" }], context: { precinct: "Ward 1", establishment: "Local Market", address: "10 Main Street", business_type: "Grocery", permit_type: "D-6", sales_type: "Wine on Sundays", plain_english: "Allows Sunday wine sales at one location.", yes_means: "Sunday sales are allowed.", no_means: "Sunday sales remain prohibited.", official_ballot_language: "Shall Sunday sales be permitted?", sources: [] } }
  ],
  location: { origin: "https://openvoterguide.org" },
  confirm: () => true,
  open: () => ({ opener: {}, document: { open() {}, write(html) { printDocument = html; }, close() {} } })
};
const context = {
  window, document, localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key)
  },
  CSS: { escape: (value) => value }, FileReader,
  Blob: class { constructor(parts) { this.parts = parts; } },
  URL: BrowserURL, URLSearchParams,
  Date, JSON, Object, String, Math, Map, console
};
vm.runInNewContext(fs.readFileSync("src/js/worksheet.js", "utf8"), context);
for (const callback of domListeners.DOMContentLoaded || []) callback();

assert.equal(controls[0].checked, true, "legacy saved choice should migrate and restore");
assert.equal(controls[1].checked, false);
controls[1].checked = true;
controls[1].dispatch("change");
let saved = JSON.parse(storage.get("ashtabula-worksheet-2026"));
assert.equal(saved.version, 2);
assert.deepEqual(Object.keys(saved.choices), ["race-b"], "selecting a candidate must remove the prior choice in that race");
assert.equal(saved.groups["race-b"], "race-1");

const start = document.getElementById("worksheet-guided-start");
start.dispatch("click");
const guided = document.getElementById("worksheet-guided");
assert.equal(guided.hidden, false, "guided setup should open when requested");
const step = document.getElementById("worksheet-guided-step");
const allText = (node) => [node.textContent || "", ...(node.children || []).map(allText)].join(" ");
document.getElementById("worksheet-guided-back").dispatch("click");
assert(allText(step).includes("Responded to the voter questionnaire"));
assert(allText(step).includes("Contest details checked"));
assert(allText(step).includes("Expand transit"));
document.getElementById("worksheet-guided-next").dispatch("click");
assert(allText(step).includes("Creates a county fund."));
assert(allText(step).includes("A YES vote means"));
assert(allText(step).includes("A NO vote means"));
assert(allText(step).includes("Supporters:"));
assert(allText(step).includes("Opponents:"));
assert(allText(step).includes("official ballot language"));
const choiceInputs = (node) => [node, ...(node.children || []).flatMap(choiceInputs)].filter((child) => child.tagName === "INPUT");
const measureYes = choiceInputs(step).find((input) => input.value === "measure-1-yes");
measureYes.dispatch("change");
document.getElementById("worksheet-guided-next").dispatch("click");
assert(allText(step).includes("Example individual impact"));
assert(allText(step).includes("$17.50 per year"));
assert(allText(step).includes("before reductions"));
document.getElementById("worksheet-guided-skip").dispatch("click");
assert(allText(step).includes("Precinct-specific"));
assert(allText(step).includes("official ballot language"));
assert(allText(step).includes("10 Main Street"));
document.getElementById("worksheet-guided-exit").dispatch("click");
assert.equal(guided.hidden, true, "exit should return to the regular worksheet");
window.location.search = "?item=levy-4";
start.dispatch("click");
assert.equal(document.getElementById("worksheet-guided-position").textContent, "Step 3 of 4 · Property tax levy",
  "a link to a specific item should open that item directly in the guided review");
document.getElementById("worksheet-guided-exit").dispatch("click");
window.location.search = "";

controls[3].checked = true;
controls[3].dispatch("change");
controls[4].checked = true;
controls[4].dispatch("change");
saved = JSON.parse(storage.get("ashtabula-worksheet-2026"));
assert.equal(saved.choices["measure-yes"], undefined, "YES and NO must be mutually exclusive");
assert.equal(saved.choices["measure-no"], "Issue 1: NO");

window.importWorksheet({ text: JSON.stringify({ format: "OpenVoterGuide worksheet", version: 2, data: {
  version: 2, choices: { "race-a": "Race 1: Candidate A", "import-only": "Imported item" },
  groups: { "race-a": "race-1", "import-only": "imported" }, notes: { "race-1": "backup note" }
} }) });
saved = JSON.parse(storage.get("ashtabula-worksheet-2026"));
assert.equal(saved.choices["race-b"], "Race 1: Candidate B", "import should preserve current choices");
assert.equal(saved.choices["import-only"], "Imported item");
assert.equal(saved.notes["race-1"], "backup note");

window.printWorksheet("detailed");
assert(printDocument.includes("Detailed personal ballot worksheet"));
assert(printDocument.includes("backup note"));
assert(printDocument.includes("https://openvoterguide.org/races/us-senator/"), "detailed print should include the relevant public research page");
assert(printDocument.includes("U.S. Senator"), "detailed print should identify the reference page");
assert(printDocument.includes("/assets/brand/logo-horizontal-light.svg"), "printable worksheets should carry the OpenVoterGuide brand mark");
window.printWorksheet("blank");
assert(printDocument.includes("https://openvoterguide.org/sample-ballots/"), "blank research worksheet should link to the official precinct ballot selector");
assert(printDocument.includes("https://openvoterguide.org/measures/liquor/"), "blank worksheet should include relevant public references");
assert(printDocument.includes("Precinct-specific liquor question"), "blank worksheet should distinguish precinct-specific contests");
assert(!/fetch\s*\(|XMLHttpRequest|sendBeacon/.test(fs.readFileSync("src/js/worksheet.js", "utf8")),
  "worksheet code must not send personal data over the network");
assert(!printDocument.includes("?choice=") && !printDocument.includes("#race-b"), "choices must not be added to public URLs");

window.clearWorksheet();
assert.equal(storage.has("ashtabula-worksheet-2026"), false, "clear should delete local worksheet data");
console.log("Worksheet tests passed: legacy migration, exclusive choices, backup merge, private print, and local deletion.");

