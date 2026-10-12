const configuredUrl = new URL(process.env.OVG_SITE_URL || "https://openvoterguide.org/");
const races = require("./races.json");
const measures = require("./measures.json");
const levies = require("./levies.json");
const liquor = require("./liquor.json");
const pathname = configuredUrl.pathname.replace(/\/+$/, "");
const pathPrefix = pathname ? `${pathname}/` : "/";
const candidateEntryCount = races.reduce((total, race) => total + race.candidates.length, 0);
const worksheetItemCount = races.length + measures.length + levies.length + liquor.length;

module.exports = {
  baseUrl: `${configuredUrl.origin}${pathname}`,
  pathPrefix,
  origin: configuredUrl.origin,
  title: "OpenVoterGuide",
  raceCount: races.length,
  candidateEntryCount,
  worksheetItemCount,
  liquorPage: "/measures/liquor/",
  description: "A clear, nonpartisan guide to Ashtabula County and Ohio candidates, local elections, ballot measures, property tax levies, and voting information.",
  socialImage: "/assets/brand/og-card-1200x630.png?v=20261011-opendomain1",
  electionDate: "2026-11-03",
  electionName: "November 3, 2026 General Election",
  jurisdiction: "Ashtabula County, Ohio"
};
