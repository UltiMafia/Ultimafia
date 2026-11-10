const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const phase = process.env.DESIGN_PHASE || "after";
const output = path.resolve(__dirname, `../../docs/frontend-redesign/revision-5/startup-${phase}`);
const directory = "/tmp/opencode/ultimafia-startup-browser";
const publicDir = path.resolve(__dirname, "../public");
const mime = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".mp3": "audio/mpeg" };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  let file;
  for (const base of [directory, publicDir]) {
    const candidate = path.resolve(base, "." + pathname);
    if (candidate.startsWith(base + path.sep) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) { file = candidate; break; }
  }
  if (!file && !path.extname(pathname)) file = path.join(directory, "index.html");
  if (!file) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" }); fs.createReadStream(file).pipe(res);
});
async function main() {
  fs.mkdirSync(output, { recursive: true });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const errors = [], records = [];
  try {
    for (const optionalDelay of [0, 1600]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => { if (message.type() === "error") { errors.push(message.text()); console.error(message.text()); } });
      await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      await page.goto(`${origin}/game/startup?optionalDelay=${optionalDelay}`);
      try { await page.waitForFunction(() => window.__startup?.records.some(record => record.url === "/api/stocks/config"), { timeout: 10000 }); }
      catch (error) { console.error(JSON.stringify({ url: page.url(), errors, state: await page.evaluate(() => window.__startup), text: await page.locator("body").innerText() }, null, 2)); throw error; }
      try { await page.locator("#speechInput").waitFor({ timeout: 12000 }); }
      catch (error) {
        console.error(JSON.stringify({ errors, state: await page.evaluate(() => window.__startup), text: await page.locator("body").innerText() }, null, 2));
        throw error;
      }
      const result = await page.evaluate(() => ({ ...window.__startup, editorAt: performance.now() - window.__startup.started, scripts: performance.getEntriesByType("resource").filter(entry => entry.initiatorType === "script").map(entry => ({ url: entry.name, bytes: entry.encodedBodySize })) }));
      if (phase === "after" && optionalDelay) {
        assert.ok(result.records.filter(record => ["/api/stocks/config", "/api/achievements", "/api/roles/descriptions", "/api/roles/roletags"].includes(record.url)).every(record => !record.end || record.end > result.loadedEventAt), "Game joins before optional metadata completes");
        assert.ok(result.loadedEventAt < optionalDelay, "Optional metadata must not block joining");
      }
      await page.screenshot({ path: path.join(output, `ready-optional-${optionalDelay}.png`), timeout: 5000 });
      records.push({ optionalDelay, ...result });
      await page.close();
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, "report.json"), JSON.stringify({ phase, records, errors, caveat: "Controlled 25ms essential APIs and 0/1600ms optional metadata, local assets and fake socket; not a live-server latency benchmark." }, null, 2));
    console.log(JSON.stringify({ phase, timings: records.map(record => ({ optionalDelay: record.optionalDelay, loadedEventAt: record.loadedEventAt, editorAt: record.editorAt })), errors }, null, 2));
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
