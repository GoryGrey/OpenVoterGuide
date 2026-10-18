const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const data = require("../src/_data/pollingPlaces.js");

assert.equal(data.locations.length, 48, "official directory should include all listed polling locations");
const precincts = data.locations.flatMap(location => location.precincts.map(precinct => ({ ...precinct, location })));
assert.equal(precincts.length, 104, "official report should include 104 precinct assignments");
assert.equal(new Set(data.locations.map(location => location.id)).size, data.locations.length, "location IDs must be unique");
assert.equal(new Set(precincts.map(precinct => precinct.id)).size, 104, "each precinct must be assigned exactly once");
for (const precinct of precincts) {
  assert.match(precinct.mapUrl, new RegExp(`/precmap/${precinct.id}\\.pdf$`));
}
assert.deepEqual(precincts.map(precinct => Number(precinct.id)).sort((a, b) => a - b), Array.from({ length: 104 }, (_, index) => index + 1), "precinct sequence should be complete and gap-free");
for (const location of data.locations) {
  assert.ok(location.id && location.name && location.address.street && location.address.city && location.address.zip);
  assert.equal(location.sourceUrl, data.sourceUrl);
  assert.equal(location.electionId, "2026-general");
  assert.equal(location.verifiedAt, "2026-10-18");
  assert.ok(location.precincts.length > 0);
}

const htmlPath = path.join(__dirname, "..", "_site", "polling-places", "index.html");
const html = fs.readFileSync(htmlPath, "utf8");
assert.match(html, /<title>Ashtabula County Polling Places Map &amp; Precinct Directory \| OpenVoterGuide<\/title>/);
assert.match(html, /<link rel="canonical" href="https:\/\/openvoterguide\.org\/polling-places\/">/);
assert.match(html, /name="description" content="Explore Ashtabula County polling-place markers and precinct assignments/);
assert.match(html, /data-polling-location/g);
assert.equal((html.match(/data-polling-location/g) || []).length, 48);
assert.match(html, /Verify your assigned polling place/);
assert.match(html, /February 27, 2013/);
assert.match(html, /Interactive polling-place map/);
assert.match(html, /polling-place point layer/);
assert.match(html, /77 map features for 104 precincts/);
assert.match(fs.readFileSync(path.join(__dirname, "..", "_site", "js", "polling-places.js"), "utf8"), /tile\.openstreetmap\.org/);
assert.match(fs.readFileSync(path.join(__dirname, "..", "_site", "js", "polling-places.js"), "utf8"), /services6\.arcgis\.com/);
assert.match(fs.readFileSync(path.join(__dirname, "..", "_site", "sitemap.xml"), "utf8"), /https:\/\/openvoterguide\.org\/polling-places\//);
assert.match(fs.readFileSync(path.join(__dirname, "..", "_site", "index.html"), "utf8"), /Find Your Polling Place/);
assert.match(fs.readFileSync(path.join(__dirname, "..", "_site", "privacy", "index.html"), "utf8"), /Polling-place map/);

console.log("Polling-place tests passed: 48 locations, 104 unique precinct assignments, interactive-map data sources, election provenance, map links, privacy notice, SEO, sitemap, and homepage entry point.");
