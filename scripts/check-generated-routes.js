const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const races = require("../src/_data/races.json");
const measures = require("../src/_data/measures.json");
const levies = require("../src/_data/levies.json");
const liquor = require("../src/_data/liquor.json");
const candidates = require("../src/_data/candidatePages.js");
const site = require("../src/_data/site.js");

const output = path.resolve("_site");
const routeFile = (route) => path.join(output, route);
const expected = [
  "index.html", "robots.txt", "sitemap.xml", "search-index.json",
  "google4aaa287e48ffc299.html", "district-race-map.json",
  "races/index.html", "measures/index.html", "measures/liquor/index.html",
  "levies/index.html", "worksheet/index.html", "about/index.html",
  "voting/index.html", "sample-ballots/index.html", "share/index.html",
  "privacy/index.html", "terms/index.html", "request-county/index.html",
  ...races.map((race) => `races/${race.id}/index.html`),
  ...measures.map((issue) => `measures/${issue.id}/index.html`),
  ...candidates.map((candidate) => `candidates/${candidate.race_id}/${candidate.slug}/index.html`),
  ...levies.map((levy) => `levies/issue-${levy.issue_number}/index.html`)
];

const missing = expected.filter((file) => !fs.existsSync(routeFile(file)));
assert.deepEqual(missing, [], `Generated routes or SEO files are missing: ${missing.join(", ")}`);
assert.equal(fs.existsSync(path.join("src", "google4aaa287e48ffc299.html")), false,
  "Google verification file must be generated into output, not tracked in src.");

const searchIndex = JSON.parse(fs.readFileSync(routeFile("search-index.json"), "utf8"));
assert.equal(searchIndex.length, races.length + candidates.length + measures.length + levies.length + liquor.length + 4,
  "Search index should cover races, candidate profiles, measures, levies, liquor questions, and voting information.");
for (const candidate of candidates) {
  assert(searchIndex.some((entry) => entry.url === candidate.profile_url), `Search index is missing ${candidate.name}.`);
}

const sitemap = fs.readFileSync(routeFile("sitemap.xml"), "utf8");
assert(!sitemap.includes("ashtabula-voter-guide.pages.dev"), "Sitemap still references the retired Pages domain.");
const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.equal(new Set(sitemapLocations).size, sitemapLocations.length, "Sitemap contains duplicate URLs.");
assert(sitemapLocations.every((url) => url.startsWith(`${site.baseUrl}/`)), "Sitemap contains a URL outside the configured canonical base.");
for (const file of expected.filter((item) => item.endsWith("index.html") && item !== "worksheet/index.html")) {
  const pathname = `/${file.replace(/index\.html$/, "")}`;
  assert(sitemap.includes(`<loc>${site.baseUrl}${pathname}</loc>`), `Sitemap is missing ${pathname}.`);
}
assert(fs.readFileSync(routeFile("robots.txt"), "utf8").includes(`${site.baseUrl}/sitemap.xml`),
  "robots.txt must advertise the sitemap.");
assert(!sitemap.includes(`${site.baseUrl}/worksheet/`), "Private worksheet must not be listed in the public sitemap.");
assert.equal(fs.readFileSync(routeFile("google4aaa287e48ffc299.html"), "utf8"),
  "google-site-verification: google4aaa287e48ffc299.html", "Google verification output must match the supplied token file.");

let htmlPages = 0;
const canonicals = new Set();
function inspectHtml(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) inspectHtml(absolute);
    else if (entry.name.endsWith(".html") && entry.name !== "google4aaa287e48ffc299.html") {
      const html = fs.readFileSync(absolute, "utf8");
      assert(/<title>[^<]+<\/title>/i.test(html), `${absolute} has no title.`);
      assert(/<meta name="description" content="[^"]+"/i.test(html), `${absolute} has no meta description.`);
      assert(/<link rel="canonical" href="https:\/\//i.test(html), `${absolute} has no absolute canonical URL.`);
      const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
      assert(!canonicals.has(canonical), `${absolute} duplicates canonical URL ${canonical}.`);
      canonicals.add(canonical);
      assert(/property="og:title"/i.test(html) && /property="og:image"/i.test(html), `${absolute} has incomplete Open Graph metadata.`);
      assert((html.match(/application\/ld\+json/g) || []).length >= 3, `${absolute} has incomplete structured data.`);
      if (absolute.endsWith(path.join("worksheet", "index.html"))) {
        assert(/<meta name="robots" content="noindex, nofollow">/.test(html), "Private worksheet must be noindex and nofollow.");
      }
      const title = html.match(/<title>([^<]+)<\/title>/i)?.[1] || "";
      assert(!/OpenVoterGuide\s*\|\s*OpenVoterGuide/.test(title), `${absolute} repeats the site name in its title.`);
      htmlPages += 1;
    }
  }
}
inspectHtml(output);
assert(htmlPages >= races.length + candidates.length + measures.length + levies.length,
  "Generated HTML page count is lower than the election data page count.");

console.log(`SEO and route validation passed: ${htmlPages} HTML pages, ${searchIndex.length} searchable records, and all sitemap entries.`);
