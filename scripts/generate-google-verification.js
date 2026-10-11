const fs = require("node:fs");
const path = require("node:path");

// Keep Google's requested file out of source control. Generate it only in the
// published build output so GitHub Pages can serve the exact verification file.
const filename = "google4aaa287e48ffc299.html";
const outputDirectory = path.resolve("_site");
fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(
  path.join(outputDirectory, filename),
  `google-site-verification: ${filename}`,
  "utf8"
);
console.log(`Generated ${filename} in _site for the GitHub Pages artifact.`);
