const fs = require("node:fs");
const path = require("node:path");

const read = (name) => JSON.parse(fs.readFileSync(path.join("src", "_data", name), "utf8"));
const races = read("races.json");
const measures = read("measures.json");
const expected = [
  "index.html",
  "district-race-map.json",
  "races/index.html",
  "measures/index.html",
  "measures/liquor/index.html",
  "levies/index.html",
  "worksheet/index.html",
  "about/index.html",
  "voting/index.html",
  "sample-ballots/index.html",
  ...races.map((race) => `races/${race.id}/index.html`),
  ...measures.map((issue) => `measures/${issue.id}/index.html`)
];

const missing = expected.filter((file) => !fs.existsSync(path.join("_site", file)));
if (missing.length) {
  console.error("Generated routes are missing:");
  for (const file of missing) console.error(` - ${file}`);
  process.exit(1);
}

console.log(`Route validation passed: ${expected.length} pages generated.`);
