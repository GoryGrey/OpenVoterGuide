const configuredUrl = new URL(process.env.OVG_SITE_URL || "https://gorygrey.github.io/OpenVoterGuide");
const pathname = configuredUrl.pathname.replace(/\/+$/, "");
const pathPrefix = pathname ? `${pathname}/` : "/";

module.exports = {
  baseUrl: `${configuredUrl.origin}${pathname}`,
  pathPrefix,
  origin: configuredUrl.origin,
  title: "OpenVoterGuide",
  description: "A clear, nonpartisan guide to Ashtabula County and Ohio candidates, local elections, ballot measures, property tax levies, and voting information.",
  socialImage: "/assets/brand/og-card-1200x630.png?v=20261011-logo-card1",
  electionDate: "2026-11-03",
  electionName: "November 3, 2026 General Election",
  jurisdiction: "Ashtabula County, Ohio"
};
