const races = require("./races.json");
const measures = require("./measures.json");
const levies = require("./levies.json");
const liquor = require("./liquor.json");
const candidatePages = require("./candidatePages.js");

// Keep these IDs identical to the candidateSlug filter used by race and candidate pages.
function choiceSlug(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9/'’]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function option(group, id, label, value = label) {
  return { group, id, label, value };
}

function yesNoForLevy(levy) {
  const rate = Number(levy.millage || 0);
  const current = Number(levy.existing_millage || 0);
  if (levy.type === "additional") {
    return {
      yes: `Adds a new ${rate}-mill property tax for ${levy.term_years || "the stated term"} in this district.`,
      no: "The proposed new tax is not added."
    };
  }
  if (levy.type === "renewal_increase") {
    const increase = Math.max(0, rate - current);
    return {
      yes: `Continues the levy at ${rate} mills, adding ${increase} mills over its current rate.`,
      no: "The existing levy expires rather than being renewed."
    };
  }
  if (levy.type === "renewal_reduction") {
    return {
      yes: `Continues the levy at a lower rate of ${rate} mills (down from ${current} mills).`,
      no: "The existing levy expires rather than being renewed."
    };
  }
  return {
    yes: `Continues the existing ${rate}-mill tax for ${levy.term_years || "the stated term"}; this is a renewal, not a new charge.`,
    no: "The existing levy expires rather than being renewed."
  };
}

function levyEstimate(levy) {
  const rate = Number(levy.millage || 0);
  const current = Number(levy.existing_millage || 0);
  if (levy.type === "additional") return { amount: rate * 35, kind: "new tax" };
  if (levy.type === "renewal_increase") return { amount: Math.max(0, rate - current) * 35, kind: "added each year" };
  if (levy.type === "renewal_reduction") return { amount: Math.max(0, current - rate) * 35, kind: "estimated annual savings" };
  return { amount: rate * 35, kind: "existing levy total, not a new charge" };
}

module.exports = [
  ...races.map((race) => {
    const group = `race-${race.id}`;
    const candidates = candidatePages.filter((candidate) => candidate.race_id === race.id);
    const candidateChoices = candidates.map((candidate) => option(
      group,
      `${group}-${choiceSlug(candidate.name)}`,
      `${race.office}: ${candidate.name}`,
      candidate.name
    ));
    return {
      group, kind: "Race", title: race.office, options: race.candidates.map((candidate) => candidate.name),
      url: `/races/${race.id}/`,
      choices: [...candidateChoices, option(group, `${group}-undecided`, `${race.office}: Undecided`), option(group, `${group}-not-on-ballot`, `${race.office}: Not on my ballot`)],
      context: {
        district: race.district,
        term_info: race.term_info,
        verification_date: race.verification_date,
        candidates: candidates.map((candidate) => ({
          name: candidate.name, party: candidate.party, incumbent: candidate.incumbent,
          background: candidate.background, response_status: candidate.response_status,
          promises: candidate.promises || [], record: candidate.record || [],
          correlation: candidate.correlation, claim_evidence: candidate.claim_evidence || {},
          measure_positions: candidate.measure_positions || [],
          profile_url: candidate.profile_url, sources: candidate.sources || []
        }))
      }
    };
  }),
  ...measures.map((measure) => {
    const group = `measure-${measure.id}`;
    return {
      group, kind: "Ballot measure", title: `Issue ${measure.issue_number}: ${measure.title}`,
      options: ["YES", "NO", "Undecided"], url: `/measures/${measure.id}/`,
      choices: [option(group, `${group}-yes`, `${measure.title}: YES`), option(group, `${group}-no`, `${measure.title}: NO`), option(group, `${group}-undecided`, `${measure.title}: Undecided`), option(group, `${group}-not-on-ballot`, `${measure.title}: Not on my ballot`)],
      context: {
        issue_number: measure.issue_number, plain_english: measure.plain_english,
        yes_means: measure.yes_means, no_means: measure.no_means,
        official_ballot_language: measure.official_ballot_language,
        supporters_say: measure.supporters_say, opponents_say: measure.opponents_say,
        verification_date: measure.verification_date, sources: measure.sources || []
      }
    };
  }),
  ...levies.map((levy) => {
    const group = `levy-${levy.issue_number}`;
    const effects = yesNoForLevy(levy);
    const estimate = levyEstimate(levy);
    return {
      group, kind: "Property tax levy",
      title: `Issue ${levy.issue_number}: ${levy.jurisdiction} — ${levy.purpose}`,
      options: ["YES", "NO", "Undecided"], url: `/levies/issue-${levy.issue_number}/`,
      choices: [option(group, `${group}-yes`, `Issue ${levy.issue_number} (${levy.jurisdiction}): YES`), option(group, `${group}-no`, `Issue ${levy.issue_number} (${levy.jurisdiction}): NO`), option(group, `${group}-undecided`, `Issue ${levy.issue_number} (${levy.jurisdiction}): Undecided`), option(group, `${group}-not-on-ballot`, `Issue ${levy.issue_number} (${levy.jurisdiction}): Not on my ballot`)],
      context: {
        issue_number: levy.issue_number, jurisdiction: levy.jurisdiction, purpose: levy.purpose,
        levy_type: levy.type, millage: levy.millage, existing_millage: levy.existing_millage || null,
        term_years: levy.term_years, tax_change: levy.tax_change, notes: levy.notes,
        yes_means: effects.yes, no_means: effects.no,
        estimate_at_100k: Math.round(estimate.amount * 100) / 100, estimate_kind: estimate.kind,
        estimate_explainer: "Example only: Ohio taxes real property at 35% of appraised value. This rough amount excludes parcel-specific rates, credits, rollbacks, and other reductions; it is not a tax bill. Use the County Auditor's estimator for your property.",
        verification_date: levy.verification_date, sources: levy.sources || []
      }
    };
  }),
  ...liquor.map((item) => {
    const group = `liquor-${item.issue_number}`;
    return {
      group, kind: "Precinct-specific liquor question",
      title: `Issue ${item.issue_number}: ${item.precinct} — ${item.establishment}`,
      options: ["YES", "NO", "Undecided"], url: `/measures/liquor/#${item.id}`,
      choices: [option(group, `${group}-yes`, `Issue ${item.issue_number} (${item.precinct}): YES`), option(group, `${group}-no`, `Issue ${item.issue_number} (${item.precinct}): NO`), option(group, `${group}-undecided`, `Issue ${item.issue_number} (${item.precinct}): Undecided`), option(group, `${group}-not-on-ballot`, `Issue ${item.issue_number} (${item.precinct}): Not on my ballot`)],
      context: {
        issue_number: item.issue_number, precinct: item.precinct, establishment: item.establishment,
        address: item.address, business_type: item.business_type, permit_type: item.permit_type,
        sales_type: item.sales_type, plain_english: item.plain_english,
        yes_means: item.yes_means, no_means: item.no_means,
        official_ballot_language: item.official_ballot_language,
        verification_date: item.verification_date, sources: item.sources || []
      }
    };
  })
];

