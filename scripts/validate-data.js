const fs = require("node:fs");
const path = require("node:path");

const read = (name) => JSON.parse(fs.readFileSync(path.join("src", "_data", name), "utf8"));
const races = read("races.json");
const measures = read("measures.json");
const levies = read("levies.json");
const liquor = read("liquor.json");
const election = read("election.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function unique(items, getKey, label) {
  const keys = items.map(getKey);
  assert(keys.every((key) => key !== undefined && key !== null && key !== ""), `${label}: missing key`);
  assert(new Set(keys).size === keys.length, `${label}: duplicate key`);
}

function checkSources(sources, label) {
  assert(Array.isArray(sources) && sources.length > 0, `${label}: no sources`);
  for (const source of sources) {
    let url;
    try {
      url = new URL(source.url);
    } catch {
      throw new Error(`${label}: invalid source URL ${source.url}`);
    }
    assert(["http:", "https:"].includes(url.protocol), `${label}: unsupported source protocol ${url.protocol}`);
    assert(source.label, `${label}: source has no label`);
  }
}

assert(Array.isArray(races) && races.length > 0, "races.json must contain races");
unique(races, (race) => race.id, "races");
for (const race of races) {
  assert(race.office && Array.isArray(race.candidates) && race.candidates.length > 0, `Race ${race.id}: missing office or candidates`);
  unique(race.candidates, (candidate) => candidate.name, `candidates in ${race.id}`);
  for (const candidate of race.candidates) checkSources(candidate.sources, `Candidate ${candidate.name}`);
}

unique(measures, (issue) => issue.issue_number, "measures");
for (const issue of measures) checkSources(issue.sources, `Measure ${issue.issue_number}`);
unique(levies, (issue) => issue.issue_number, "levies");
for (const issue of levies) {
  assert(Number.isFinite(issue.millage) && issue.millage > 0, `Levy ${issue.issue_number}: invalid millage`);
  assert(issue.tax_change === (issue.type !== "renewal"), `Levy ${issue.issue_number}: tax_change conflicts with type`);
  checkSources(issue.sources, `Levy ${issue.issue_number}`);
}
unique(liquor, (issue) => issue.issue_number, "liquor questions");
for (const issue of liquor) checkSources(issue.sources, `Liquor issue ${issue.issue_number}`);
checkSources(election.sources, "Election dates");

const issueNumbers = [...measures, ...levies, ...liquor].map((issue) => Number(issue.issue_number)).sort((a, b) => a - b);
const expectedIssueNumbers = Array.from({ length: 41 }, (_, index) => index + 3);
assert(JSON.stringify(issueNumbers) === JSON.stringify(expectedIssueNumbers), "Ballot issue numbers must cover 3 through 43 exactly once");
assert(levies.length === 36, `Expected 36 property-tax levies; found ${levies.length}`);
const levyTypes = levies.reduce((counts, levy) => {
  counts[levy.type] = (counts[levy.type] || 0) + 1;
  return counts;
}, {});
assert(levyTypes.renewal === 25 && levyTypes.additional === 7 && levyTypes.renewal_increase === 3 && levyTypes.renewal_reduction === 1,
  `Unexpected levy breakdown: ${JSON.stringify(levyTypes)}`);
assert(election.election_date === "2026-11-03", "Election date must match this guide's election");

console.log(`Data validation passed: ${races.length} races, ${measures.length} measures, ${levies.length} levies, ${liquor.length} liquor questions.`);
