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
const window = {
  OVG_WORKSHEET_ITEMS: [],
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
  URL: { createObjectURL: () => "blob:test", revokeObjectURL() {} },
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
assert(!/fetch\s*\(|XMLHttpRequest|sendBeacon/.test(fs.readFileSync("src/js/worksheet.js", "utf8")),
  "worksheet code must not send personal data over the network");
assert(!printDocument.includes("?choice=") && !printDocument.includes("#race-b"), "choices must not be added to public URLs");

window.clearWorksheet();
assert.equal(storage.has("ashtabula-worksheet-2026"), false, "clear should delete local worksheet data");
console.log("Worksheet tests passed: legacy migration, exclusive choices, backup merge, private print, and local deletion.");
