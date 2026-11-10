// Revision-4 interaction/geometry evidence for the real shared UI. Local only.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const http = require("node:http");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const output = process.env.DESIGN_SYSTEM_OUTPUT_DIR || path.resolve(__dirname, "../../docs/frontend-redesign/revision-5/system-after");
const directory = "/tmp/opencode/ultimafia-redesign-browser";
const publicDir = path.resolve(__dirname, "../public");
const mime = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  let file;
  for (const base of [directory, publicDir]) {
    const candidate = path.resolve(base, "." + pathname);
    if (candidate.startsWith(base + path.sep) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) { file = candidate; break; }
  }
  if (!file && !path.extname(pathname)) file = path.join(directory, "index.html");
  if (!file) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
async function main() {
  fs.mkdirSync(output, { recursive: true });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const records = [], errors = [];
  const capture = async (page, name, metrics) => {
    await page.mouse.move(0, 0);
    await page.screenshot({ path: path.join(output, name + ".png"), animations: "disabled" });
    records.push({ name, viewport: page.viewportSize(), metrics });
  };
  const originalPhase = (image, name) => {
    const asset = path.resolve(directory, "." + decodeURIComponent(new URL(image, origin).pathname));
    assert.ok(asset.startsWith(directory + path.sep));
    assert.equal(hash(fs.readFileSync(asset)), hash(fs.readFileSync(path.resolve(__dirname, `../src/images/game_state/${name}-state.png`))), `Original ${name} sprite preserved`);
  };
  try {
    for (const width of [1440, 390, 320]) for (const palette of ["dark", "light"]) {
      const page = await browser.newPage({ viewport: { width, height: width > 900 ? 1000 : 844 }, colorScheme: palette, reducedMotion: "reduce" });
      page.on("pageerror", error => errors.push(error.message));
      await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      await page.goto(`${origin}/play?theme=${palette}`);
      await page.getByText("Classic", { exact: true }).first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      const type = await page.evaluate(() => {
        const join = document.querySelector('[data-game-id="open"] .game-row-actions a');
        const header = document.querySelector(".site-header");
        const sample = document.createElement("span"); sample.style.backgroundColor = "var(--scheme-color)"; document.body.append(sample);
        const result = { font: getComputedStyle(document.body).fontFamily, body: getComputedStyle(document.body).fontSize, action: getComputedStyle(join).fontSize, header: getComputedStyle(header).backgroundColor, surface: getComputedStyle(sample).backgroundColor, loadedFira: [...document.fonts].some(font => font.family === "Fira Sans" && font.status === "loaded") };
        sample.remove(); return result;
      });
      assert.match(type.font, /Fira Sans/); assert.ok(type.loadedFira);
      assert.equal(type.action, type.body); assert.equal(type.action, "16px");
      assert.equal(type.header, type.surface, "Header follows its palette, not a fixed dark bar");
      await capture(page, `lobby-${palette}-${width}`, type);
      if (width <= 900) {
        await page.locator(".site-wrapper").evaluate(element => { element.scrollTop = element.scrollHeight; });
        await capture(page, `lobby-bottom-${palette}-${width}`);
      }
      await page.goto(`${origin}/game/fixture?history=1&theme=${palette}`);
      const editor = page.locator("#speechInput");
      await editor.waitFor();
      assert.equal(await page.locator(".meeting-tabs").count(), width <= 900 ? 0 : 1, "Desktop retains its familiar meeting header; phones avoid a redundant single tab");
      const phase = page.getByRole("combobox", { name: "View phase" });
      if (width <= 900) assert.ok((await phase.boundingBox()).y < 70, "Occasional phone phase/history control is at the top, separate from Chat");
      originalPhase(await page.locator('img[alt="day"]').first().getAttribute("src"), "day");
      const timer = page.locator(".state-timer:visible");
      assert.equal(await timer.count(), 1, "One visible game clock");
      await editor.fill("Keep this draft while viewing history.");
      const composer = await page.locator(".game-composer").evaluate(element => ({ border: getComputedStyle(element).borderTopWidth, background: getComputedStyle(element).backgroundColor, editorBorder: getComputedStyle(element.querySelector("textarea")).borderTopWidth }));
      assert.equal(composer.border, "0px"); assert.equal(composer.editorBorder, "0px");
      await capture(page, `game-${palette}-${width}`, composer);
      if (width <= 900) await phase.selectOption("0");
      else await page.getByRole("tab", { name: "Night 1", exact: true }).click();
      await page.getByText("Viewing history. Messages are read-only.").waitFor();
      originalPhase(await page.locator('img[alt="night"]').first().getAttribute("src"), "night");
      await capture(page, `history-${palette}-${width}`);
      await page.getByRole("button", { name: "Return to current", exact: true }).click();
      assert.equal(await editor.inputValue(), "Keep this draft while viewing history.");
      if (width <= 900) {
        await page.evaluate(() => { document.documentElement.style.setProperty("--app-bottom", "300px"); document.documentElement.dataset.keyboard = "open"; });
        const editorBounds = await editor.boundingBox();
        assert.ok(editorBounds.y + editorBounds.height < 544, "Editor stays above simulated keyboard");
        assert.equal(await phase.isVisible(), false, "Occasional phase controls hide while typing");
        assert.equal(await page.locator(".game-mobile-nav").isVisible(), false, "Panel navigation hides while typing");
        assert.ok(await page.locator(".game-mobile-clock").isVisible(), "The compact clock remains readable");
        await capture(page, `keyboard-inset-simulated-${palette}-${width}`);
      }
      await page.goto(`${origin}/game/fixture?multimeeting=1&theme=${palette}`);
      await page.getByRole("tab", { name: "Private", exact: true }).waitFor();
      assert.equal(await page.locator(".meeting-tabs").getByRole("tab").count(), 2);
      await page.getByRole("tab", { name: "Private", exact: true }).click();
      await editor.fill("A private meeting message"); await editor.press("Enter");
      assert.ok(await page.evaluate(() => window.__sent.some(([type, data]) => type === "speak" && data.meetingId === "private" && data.content === "A private meeting message")));
      await page.waitForFunction(() => document.querySelector("#speechInput").value === "");
      await capture(page, `multi-meeting-${palette}-${width}`);
      await page.close();
    }
    for (const palette of ["dark", "light"]) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1120 }, colorScheme: palette });
      page.on("pageerror", error => errors.push(error.message));
      await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      await page.goto(`${origin}/?icons=1&theme=${palette}`);
      await page.locator("[data-pixel-icon-example]").last().waitFor();
      await capture(page, `icon-comparison-${palette}`);
      await page.close();
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, "report.json"), JSON.stringify({ records, errors, evidence: "Production components with local synthetic data. Native-size type/phase sprites and draft/meeting behavior checked. Keyboard images simulate visual insets, not physical devices." }, null, 2));
    console.log(`${records.length} design-system views captured; typography, theme, original phase sprites, top status/history, frequent bottom controls, drafts, floating composer and multi-meeting sends checked.`);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
