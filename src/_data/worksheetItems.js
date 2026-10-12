const races = require("./races.json");
const measures = require("./measures.json");
const levies = require("./levies.json");
const liquor = require("./liquor.json");

module.exports = [
  ...races.map((item) => ({ group: `race-${item.id}`, kind: "Race", title: item.office, options: item.candidates.map((candidate) => candidate.name), url: `/races/${item.id}/` })),
  ...measures.map((item) => ({ group: `measure-${item.id}`, kind: "Measure", title: `Issue ${item.issue_number}: ${item.title}`, options: ["YES", "NO", "Undecided"], url: `/measures/${item.id}/` })),
  ...levies.map((item) => ({ group: `levy-${item.issue_number}`, kind: "Property tax levy", title: `Issue ${item.issue_number}: ${item.jurisdiction} — ${item.purpose}`, options: ["YES", "NO", "Undecided"], url: `/levies/issue-${item.issue_number}/` })),
  ...liquor.map((item) => ({ group: `liquor-${item.issue_number}`, kind: "Precinct-specific liquor question", title: `Issue ${item.issue_number}: ${item.precinct} — ${item.establishment}`, options: ["YES", "NO", "Undecided"], url: "/measures/liquor/" }))
];
