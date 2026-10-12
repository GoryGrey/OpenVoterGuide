const fs = require("node:fs");
const path = require("node:path");
const site = require("../src/_data/site.js");

const output = path.resolve("_site");
const base = new URL(`${site.baseUrl}/`);
const prefixPath = base.pathname;
const errors = [];
let checked = 0;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

const htmlFiles = walk(output).filter((file) => file.endsWith(".html"));
const idsByFile = new Map(htmlFiles.map((file) => {
  const html = fs.readFileSync(file, "utf8");
  const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]));
  return [file, ids];
}));

function outputFileFor(urlPath) {
  let relative = decodeURIComponent(urlPath);
  if (!relative.startsWith(prefixPath)) return null;
  relative = relative.slice(prefixPath.length);
  if (!relative || relative.endsWith("/")) relative += "index.html";
  let candidate = path.resolve(output, relative);
  if (!candidate.startsWith(`${output}${path.sep}`) && candidate !== path.join(output, "index.html")) return null;
  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) candidate = path.join(candidate, "index.html");
  if (!path.extname(candidate) && fs.existsSync(path.join(candidate, "index.html"))) candidate = path.join(candidate, "index.html");
  return candidate;
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const currentRelative = path.relative(output, file).replace(/\\/g, "/");
  const currentUrl = new URL(currentRelative.endsWith("index.html") ? currentRelative.slice(0, -10) : currentRelative, base);
  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const raw = match[1].trim();
    if (!raw || raw.startsWith("#") || /^(?:javascript:|data:|mailto:|tel:|blob:)/i.test(raw)) continue;
    let target;
    try { target = new URL(raw, currentUrl); } catch { errors.push(`${currentRelative}: invalid URL ${raw}`); continue; }
    if (target.origin !== base.origin || !target.pathname.startsWith(prefixPath)) continue;
    const targetFile = outputFileFor(target.pathname);
    checked += 1;
    if (!targetFile || !fs.existsSync(targetFile)) {
      errors.push(`${currentRelative}: ${raw} points to a missing local file`);
      continue;
    }
    if (target.hash && targetFile.endsWith(".html")) {
      const ids = idsByFile.get(targetFile);
      const fragment = decodeURIComponent(target.hash.slice(1));
      if (ids && !ids.has(fragment)) errors.push(`${currentRelative}: ${raw} points to a missing #${fragment} fragment`);
    }
  }
}

if (errors.length) {
  console.error(`Found ${errors.length} broken internal links:`);
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}
console.log(`Internal link validation passed: ${checked} local links and assets checked across ${htmlFiles.length} pages.`);
