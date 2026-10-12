const fs = require("node:fs");
const path = require("node:path");

const dataDirectory = path.resolve("src", "_data");
const urls = new Set();

function collect(value) {
  if (Array.isArray(value)) return value.forEach(collect);
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (key === "url" && typeof child === "string" && /^https?:\/\//i.test(child)) urls.add(child);
    else collect(child);
  }
}

for (const filename of fs.readdirSync(dataDirectory).filter((file) => file.endsWith(".json"))) {
  collect(JSON.parse(fs.readFileSync(path.join(dataDirectory, filename), "utf8")));
}

const queue = [...urls];
const dead = [];
const unavailable = [];
let reachable = 0;

async function checkUrl(url) {
  const headers = { "user-agent": "OpenVoterGuide source link audit" };
  let response;
  try {
    response = await fetch(url, { method: "HEAD", headers, signal: AbortSignal.timeout(10000), redirect: "follow" });
    if ([403, 405, 501].includes(response.status)) {
      response = await fetch(url, {
        method: "GET",
        headers: { ...headers, range: "bytes=0-0" },
        signal: AbortSignal.timeout(10000),
        redirect: "follow"
      });
      await response.body?.cancel();
    }
    if (response.status === 404 || response.status === 410) dead.push({ url, status: response.status });
    else if (response.status >= 500 || response.status === 403 || response.status === 429) unavailable.push({ url, status: response.status });
    else reachable += 1;
  } catch (error) {
    unavailable.push({ url, status: error.name === "TimeoutError" ? "timeout" : error.cause?.code || error.name });
  }
}

async function worker() {
  while (queue.length) await checkUrl(queue.pop());
}

Promise.all(Array.from({ length: 12 }, worker)).then(() => {
  console.log(`External link audit: ${urls.size} unique source URLs; ${reachable} responded; ${dead.length} confirmed dead; ${unavailable.length} blocked, errored, or timed out.`);
  for (const item of dead) console.error(`DEAD ${item.status} ${item.url}`);
  for (const item of unavailable) console.warn(`UNVERIFIED ${item.status} ${item.url}`);
  if (dead.length) process.exitCode = 1;
});
