const races = require("./races.json");

function slugify(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s*[\/’']+\s*/g, "-and-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

module.exports = races.flatMap((race) => race.candidates.map((candidate) => ({
  ...candidate,
  slug: slugify(candidate.name),
  race_id: race.id,
  race_office: race.office,
  race_district: race.district,
  race_term_info: race.term_info,
  race_verification_date: race.verification_date,
  profile_url: `/candidates/${race.id}/${slugify(candidate.name)}/`,
  seo_description: `${candidate.name} is listed for ${race.office}${race.district ? `, ${race.district}` : ""} in the November 3, 2026 Ashtabula County, Ohio election. Review background, campaign statements, records, and linked sources.`
})));
