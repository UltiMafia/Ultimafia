// Actual production dialog bodies with synthetic options. No live transport.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const phase = process.env.DESIGN_PHASE || "after";
const drawingOnly = process.env.REVIEW_SCOPE === "draw-tools";
const output = process.env.MINIGAME_OUTPUT_DIR || path.resolve(__dirname, `../../docs/frontend-redesign/revision-5/minigames-${phase}`);
const directory = process.env.REDESIGN_BUNDLE_DIR || "/tmp/opencode/ultimafia-redesign-browser";
const publicDir = path.resolve(__dirname, "../public");
const types = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  let file;
  for (const base of [directory, publicDir]) {
    const candidate = path.resolve(base, "." + pathname);
    if (candidate.startsWith(base + path.sep) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) { file = candidate; break; }
  }
  if (!file && !path.extname(pathname)) file = path.join(directory, "index.html");
  if (!file) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
async function main() {
  fs.mkdirSync(output, { recursive: true });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const records = [], errors = [];
  try {
    for (const width of (drawingOnly ? [1440, 390, 320] : [1440, 390])) for (const theme of ["dark", "light"]) {
      const page = await browser.newPage({ viewport: { width, height: width > 900 ? 1000 : 844 }, colorScheme: theme, reducedMotion: "reduce" });
      page.on("pageerror", error => errors.push(error.message));
      await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      if (drawingOnly) {
        await reviewDrawingTools(page, width, theme);
        records.push({ name: "draw-tools", theme, width });
        await page.close();
        continue;
      }
      for (const name of ["liars-dice", "ratscrew", "policy-peek", "loyalty", "veto", "poker-raise"]) {
        await page.goto(`${origin}/?dialog=${name}&theme=${theme}`);
        await page.waitForFunction(() => window.__redesignReady);
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: path.join(output, `${name}-${theme}-${width}.png`), animations: "disabled" });
        if (phase !== "before") {
          const dialog = page.getByRole("dialog");
          await dialog.waitFor();
          assert.ok((await dialog.boundingBox()).width <= width);
          const buttonType = await dialog.getByRole("button").last().evaluate(element => ({ size: getComputedStyle(element).fontSize, family: getComputedStyle(element).fontFamily }));
          assert.equal(buttonType.size, "16px"); assert.match(buttonType.family, /Fira Sans/);
          await page.evaluate(() => window.__setDialogActive(false));
          await dialog.waitFor({ state: "hidden" });
          await page.waitForFunction(() => !history.state?.__overlay);
          await page.evaluate(() => window.__setDialogActive(true));
          await dialog.waitFor();
          assert.equal(await page.evaluate(() => window.__sent.length), 0, "Owner activity changes must not submit decisions");
          if (name === "veto") {
            await page.keyboard.press("Escape");
            assert.ok(await dialog.isVisible(), "Required veto choice cannot be dismissed with Escape");
            await page.getByRole("button", { name: "Accept veto", exact: true }).click();
            assert.ok(await page.evaluate(() => window.__sent.some(([type, data]) => type === "vote" && data.selection === "Yes")));
          } else {
            if (name === "poker-raise") {
              const amount = dialog.getByRole("spinbutton", { name: "Raise amount", exact: true });
              await amount.fill("999"); assert.equal(await amount.inputValue(), "200");
              await dialog.getByRole("button", { name: "Min", exact: true }).click(); assert.equal(await amount.inputValue(), "10");
              await dialog.getByRole("button", { name: "½ Pot", exact: true }).click(); assert.equal(await amount.inputValue(), "40");
              await dialog.getByRole("button", { name: "Pot", exact: true }).click(); assert.equal(await amount.inputValue(), "80");
              await dialog.getByRole("button", { name: "All-in", exact: true }).click(); assert.equal(await amount.inputValue(), "200");
              await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
              assert.ok(await page.evaluate(() => window.__sent.some(([type, value]) => type === "raise" && value === 200)));
              await dialog.waitFor({ state: "hidden" });
              await page.getByRole("button", { name: "Reopen dialog", exact: true }).click();
              await dialog.waitFor();
            }
            await page.keyboard.press("Escape");
            await dialog.waitFor({ state: "hidden" });
            await page.getByRole("button", { name: "Reopen dialog", exact: true }).click();
            await dialog.waitFor();
            await page.goBack();
            await dialog.waitFor({ state: "hidden" });
            assert.equal(new URL(page.url()).pathname, "/");
          }
        }
        records.push({ name, theme, width });
      }
      await page.close();
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, drawingOnly ? "draw-tools-report.json" : "report.json"), JSON.stringify({ phase, records, errors }, null, 2));
    console.log(`${records.length} production ${drawingOnly ? "drawing toolbar" : "minigame dialog"} views captured; ${phase === "before" ? "baseline only" : "interaction checks passed"}. ${output}`);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
async function reviewDrawingTools(page, width, theme) {
  const origin = `http://127.0.0.1:${server.address().port}`;
  await page.goto(`${origin}/?drawingTools=1&theme=${theme}`);
  await page.waitForFunction(() => window.__redesignReady);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(output, `draw-tools-${theme}-${width}.png`), animations: "disabled" });
  if (phase === "before") return;
  const dialog = page.getByRole("dialog");
  const clear = page.getByRole("button", { name: "Clear", exact: true });
  const open = async () => { await clear.click(); await dialog.waitFor(); };
  const count = () => page.evaluate(() => window.__sent.filter(([event]) => event === "clear").length);
  assert.equal(await clear.evaluate(element => getComputedStyle(element).fontSize), "16px");
  const bounds = await page.locator(".draw-tools").evaluate(element => [...element.querySelectorAll("button")].map(button => {
    const rect = button.getBoundingClientRect(); return { left: rect.left, right: rect.right };
  }));
  assert.ok(bounds.every(rect => rect.left >= 0 && rect.right <= width), "Every drawing action fits the viewport");
  assert.deepEqual(await page.locator(".draw-tools-size-dot").evaluateAll(elements => elements.map(element => getComputedStyle(element).width)), ["10px", "25px", "40px"]);
  await page.getByRole("button", { name: "color #d32f2f", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "color #d32f2f", exact: true }).getAttribute("aria-pressed"), "true");
  await page.getByRole("button", { name: "brush L", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "brush L", exact: true }).getAttribute("aria-pressed"), "true");
  await page.getByRole("button", { name: "eraser", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "eraser", exact: true }).getAttribute("aria-pressed"), "true");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.ok(await page.evaluate(() => window.__sent.some(([event]) => event === "undo")));
  await open();
  await page.screenshot({ path: path.join(output, `draw-clear-${theme}-${width}.png`), animations: "disabled" });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await dialog.waitFor({ state: "hidden" }); assert.equal(await count(), 0);
  await open(); await page.keyboard.press("Escape"); await dialog.waitFor({ state: "hidden" });
  await open(); await page.goBack(); await dialog.waitFor({ state: "hidden" });
  await open();
  await page.evaluate(() => window.__setDrawingHidden(true)); await dialog.waitFor({ state: "hidden" });
  await page.evaluate(() => window.__setDrawingHidden(false)); assert.equal(await dialog.count(), 0);
  await open();
  await page.evaluate(() => window.__setDrawingActive(false)); await dialog.waitFor({ state: "hidden" });
  await page.evaluate(() => window.__setDrawingActive(true)); assert.equal(await dialog.count(), 0);
  await open();
  await page.evaluate(() => window.__setDrawingTurn(2)); await dialog.waitFor({ state: "hidden" });
  assert.equal(await count(), 0, "Dismissal and turn/view changes cannot clear the canvas");
  await open();
  await dialog.getByRole("button", { name: "Clear canvas", exact: true }).click();
  await dialog.waitFor({ state: "hidden" }); assert.equal(await count(), 1);
}
main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
