const fs = require("node:fs");
const path = require("node:path");

const read = (name) => JSON.parse(fs.readFileSync(path.join("src", "_data", name), "utf8"));
const races = read("races.json");
const measures = read("measures.json");
const levies = read("levies.json");
const liquor = read("liquor.json");
const election = read("election.json");
const districtRaceMap = JSON.parse(fs.readFileSync(path.join("src", "district-race-map.json"), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function candidateSlug(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9/'’]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function profileSlug(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s*[\/’']+\s*/g, "-and-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
  unique(race.candidates, (candidate) => profileSlug(candidate.name), `candidate profile slugs in ${race.id}`);
  for (const candidate of race.candidates) {
    checkSources(candidate.sources, `Candidate ${candidate.name}`);

    if (candidate.claim_evidence !== undefined) {
      assert(candidate.claim_evidence && typeof candidate.claim_evidence === "object" && !Array.isArray(candidate.claim_evidence), `Candidate ${candidate.name}: claim_evidence must be an object`);
      for (const [field, entries] of Object.entries(candidate.claim_evidence)) {
        assert(["background", "promises", "record", "correlation"].includes(field), `Candidate ${candidate.name}: unsupported claim evidence field ${field}`);
        assert(Array.isArray(entries), `Candidate ${candidate.name}: claim_evidence.${field} must be an array`);
        const claimCount = field === "background" || field === "correlation" ? (candidate[field] ? 1 : 0) : (Array.isArray(candidate[field]) ? candidate[field].length : 0);
        assert(entries.length <= claimCount, `Candidate ${candidate.name}: claim_evidence.${field} has entries without matching claims`);
        for (const [index, evidence] of entries.entries()) {
          if (evidence === null || evidence === undefined) continue;
          assert(["candidate_statement", "official_record", "editorial_summary", "pending"].includes(evidence.status), `Candidate ${candidate.name}: invalid evidence status for ${field}[${index}]`);
          assert(typeof evidence.note === "string" && evidence.note.trim(), `Candidate ${candidate.name}: claim evidence needs an explanatory note for ${field}[${index}]`);
          assert(typeof evidence.checked_on === "string" && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(evidence.checked_on) && !Number.isNaN(Date.parse(evidence.checked_on)), `Candidate ${candidate.name}: claim evidence needs checked_on for ${field}[${index}]`);
          if (evidence.status === "pending") assert(Array.isArray(evidence.sources) && evidence.sources.length === 0, `Candidate ${candidate.name}: pending evidence must not claim supporting sources`);
          else checkSources(evidence.sources, `Candidate ${candidate.name}, ${field} claim ${index + 1}`);
        }
      }
    }
    if (candidate.response_status !== undefined) {
      assert(typeof candidate.response_status === "string" && candidate.response_status.trim(), `Candidate ${candidate.name}: response_status must be non-empty text`);
      assert(candidate.sources.some((source) => source.url.includes("ideastream.org")), `Candidate ${candidate.name}: response_status needs its voter-guide source`);
    }
    assert(profileSlug(candidate.name), `Candidate ${candidate.name}: invalid candidate profile slug`);
    if (candidate.measure_positions !== undefined) {
      assert(Array.isArray(candidate.measure_positions), `Candidate ${candidate.name}: measure_positions must be an array`);
      for (const position of candidate.measure_positions) {
        assert(["support", "oppose", "unclear"].includes(position.position), `Candidate ${candidate.name}: invalid ballot issue position`);
        assert(typeof position.issue_number === "string" && /^[0-9]+$/.test(position.issue_number) && Number(position.issue_number) >= 3 && Number(position.issue_number) <= 43, `Candidate ${candidate.name}: ballot issue position needs a valid issue_number`);
        assert(typeof position.issue_label === "string" && position.issue_label.trim(), `Candidate ${candidate.name}: ballot issue position needs an issue_label`);
        assert(typeof position.statement === "string" && position.statement.trim(), `Candidate ${candidate.name}: ballot issue position needs a sourced statement`);
        assert(typeof position.checked_on === "string" && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(position.checked_on) && !Number.isNaN(Date.parse(position.checked_on)), `Candidate ${candidate.name}: ballot issue position needs a checked_on date`);
        assert(position.issue_path === undefined || (typeof position.issue_path === "string" && position.issue_path.startsWith("/")), `Candidate ${candidate.name}: issue_path must be a site path`);
        checkSources([position.source], `Candidate ${candidate.name}, issue ${position.issue_number}`);
      }
      unique(candidate.measure_positions, (position) => position.issue_number, `ballot issue positions for ${candidate.name}`);
    }
  }
}

unique(measures, (issue) => issue.issue_number, "measures");
for (const issue of measures) checkSources(issue.sources, `Measure ${issue.issue_number}`);
unique(levies, (issue) => issue.issue_number, "levies");
assert(levies.every((issue) => !Object.prototype.hasOwnProperty.call(issue, "annual_cost_per_100k")), "Do not store one-size-fits-all levy dollar estimates; use the parcel-specific auditor estimator");
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

const requiredRaceIds = [
  "ohio-appeals-11-2027-02-09",
  "ohio-appeals-11-2027-02-10",
  "common-pleas-2027-01-01",
  "common-pleas-2027-01-02",
  "common-pleas-2027-02-09",
  "common-pleas-probate-2027-02-09",
  "county-commissioner",
  "county-auditor",
  "county-coroner"
];
for (const raceId of requiredRaceIds) {
  assert(races.some((race) => race.id === raceId), `Missing Ashtabula 2026 candidate-list race: ${raceId}`);
}
assert(races.length === 20, `Expected 20 Ashtabula race pages from the reviewed candidate list; found ${races.length}`);
const namedWriteIns = {
  governor: ["Timothy Grady / Andrea Neutzling", "Heather Hill / Patrick Manley", "Renea Turner / Jalen Turner", "Ron Ula / Michael C. Lehnerd"],
  senator: ["Stephen Faris", "Anthony Holliman", "Timothy Telymonde"]
};
for (const [raceId, names] of [["governor", namedWriteIns.governor], ["us-senator", namedWriteIns.senator]]) {
  const race = races.find((item) => item.id === raceId);
  for (const name of names) {
    assert(race.candidates.some((candidate) => candidate.name === name && candidate.party === "Write-in"), `Missing listed write-in candidate in ${raceId}: ${name}`);
  }
}

console.log(`Data validation passed: ${races.length} races, ${measures.length} measures, ${levies.length} levies, ${liquor.length} liquor questions.`);

assert(Array.isArray(districtRaceMap), "district-race-map.json must be an array");
unique(districtRaceMap, (entry) => entry.kind + ":" + entry.district, "district race map");
for (const entry of districtRaceMap) {
  assert(["congressional", "state-upper", "state-lower"].includes(entry.kind), "District map " + entry.race_id + ": invalid kind");
  assert(typeof entry.district === "string" && /^\d+$/.test(entry.district), "District map " + entry.race_id + ": district must be numeric text");
  const race = races.find((candidate) => candidate.id === entry.race_id);
  assert(race, "District map references unknown race " + entry.race_id);
  const number = String(race.district || "").match(/\d+/)?.[0];
  assert(number && String(Number(number)) === String(Number(entry.district)), "District map " + entry.race_id + ": district does not match race data");
  if (entry.kind === "congressional") assert(/U\.S\. House/i.test(race.office), "District map " + entry.race_id + ": expected a congressional race");
  if (entry.kind === "state-lower") assert(/State Representative/i.test(race.office), "District map " + entry.race_id + ": expected a state House race");
  if (entry.kind === "state-upper") assert(/State Senator/i.test(race.office), "District map " + entry.race_id + ": expected a state Senate race");
}

for (const race of races.filter((candidate) => candidate.office === "State Representative")) {
  const district = String(race.district || "").match(/\d+/)?.[0];
  assert(district && districtRaceMap.some((entry) => entry.kind === "state-lower" && Number(entry.district) === Number(district) && entry.race_id === race.id), "State Representative race " + race.id + " must be included in the district race map");
}
