// Competitive layout regressions use production components, never a real game.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const directory = process.env.REDESIGN_BUNDLE_DIR || "/tmp/opencode/ultimafia-redesign-browser";
const phase = process.env.DESIGN_PHASE || "after";
const output = process.env.COMPETITIVE_OUTPUT_DIR || `/tmp/opencode/competitive-${phase}`;
const types = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  let file;
  for (const base of [directory, path.resolve(__dirname, "../public")]) {
    const candidate = path.resolve(base, "." + pathname);
    if (candidate.startsWith(base + path.sep) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) { file = candidate; break; }
  }
  if (!file && !path.extname(pathname)) file = path.join(directory, "index.html");
  if (!file) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
(async () => {
  fs.mkdirSync(output, { recursive: true });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const report = { cases: [], errors: [] };
  try {
    for (const [width, largeText] of [[1848, false], [1440, false], [1024, false], [1440, true]]) for (const theme of ["dark", "light"]) for (const review of [false, true]) {
      const height = width === 1848 ? 960 : width === 1440 ? 1000 : 768;
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
      page.on("pageerror", error => report.errors.push(error.message));
      await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      await page.goto(`${origin}/game/fixture?longnames=1&roles=1&history=1&whisper=1&theme=${theme}${review ? "&review=1&completed=1" : ""}`);
      if (largeText) await page.addStyleTag({ content: "html { font-size: 125% !important; }" });
      await page.locator(".player-row").first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      const name = `${review ? "review" : "live"}-${theme}-${width}${largeText ? "-large-text" : ""}`;
      const geometry = await page.locator(".player-row .user-name-text").evaluateAll(elements => elements.map(element => {
        const range = document.createRange(); range.selectNodeContents(element);
        const text = range.getBoundingClientRect(), row = element.closest('.player-row').getBoundingClientRect();
        return { name: element.textContent, lines: range.getClientRects().length, width: element.getBoundingClientRect().width, clipped: text.right > row.right + 1 };
      }));
      await page.screenshot({ path: path.join(output, `${name}.png`), animations: "disabled" });
      const result = { name, geometry, screenshot: `${name}.png` };
      report.cases.push(result);
      try {
        assert.ok(geometry.length >= 7 && geometry.every(item => item.lines === 1), "Competitive roster names must not wrap into broken pieces");
        assert.ok(geometry.every(item => !item.clipped), "Ordinary full-length names must remain visible, not merely hidden on one line");
        assert.equal(await page.locator(".game .state-timer").count(), review ? 0 : 1, "Only live games have a clock, and exactly one");
        assert.ok(await page.locator(".center-panel").evaluate(element => element.clientWidth >= 400), "Transcript retains usable desktop width");
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        if (!review) {
          const editor = page.locator("#speechInput");
          await editor.fill("Competitive test draft");
          const send = page.getByRole("button", { name: "Send message", exact: true });
          const [inputBox, sendBox, surface] = await Promise.all([editor.boundingBox(), send.boundingBox(), page.locator(".composer-surface").boundingBox()]);
          assert.ok(sendBox.x >= inputBox.x && sendBox.x + sendBox.width <= surface.x + surface.width + 1);
          assert.ok(sendBox.y >= surface.y && sendBox.y + sendBox.height <= surface.y + surface.height + 1);
          await page.getByRole("button", { name: "Speech mode and recipient" }).click();
          assert.ok(await page.getByRole("menuitem", { name: /Whisper/ }).count());
          assert.ok(await page.getByRole("menuitem", { name: /Cry/ }).count());
          await page.keyboard.press("Escape");
        }
        result.passed = true;
      } catch (error) { result.failure = error.message; }
      await page.close();
    }
  } finally {
    await browser.close(); await new Promise(resolve => server.close(resolve));
    fs.writeFileSync(path.join(output, "report.json"), JSON.stringify(report, null, 2));
  }
  const failed = report.cases.filter(item => !item.passed);
  console.log(JSON.stringify({ cases: report.cases.length, passed: report.cases.length - failed.length, failed: failed.map(item => ({ name: item.name, failure: item.failure })), errors: report.errors }));
  if (phase !== "before" && (failed.length || report.errors.length)) process.exitCode = 1;
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
