const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const output = process.env.REVISION_REVIEW_DIR || path.resolve(__dirname, "../../docs/frontend-redesign/revision-5/after");
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
  res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" }); fs.createReadStream(file).pipe(res);
});
async function main() {
  fs.mkdirSync(output, { recursive: true });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const errors = [], records = [];
  const capture = async (page, name) => {
    await page.mouse.move(0, 0); await page.screenshot({ path: path.join(output, name + ".png"), animations: "disabled" }); records.push(name);
  };
  const open = async (width, theme) => {
    const page = await browser.newPage({ viewport: { width, height: width > 900 ? 1000 : 844 }, colorScheme: theme, reducedMotion: "reduce" });
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    return page;
  };
  try {
    for (const theme of ["dark", "light"]) {
      for (const width of [390, 320]) {
        const page = await open(width, theme);
        await page.goto(`${origin}/game/fixture?history=1&theme=${theme}`);
        const editor = page.locator("#speechInput"); await editor.waitFor();
        await page.evaluate(() => document.fonts.ready);
        const clock = page.locator(".state-timer:visible");
        assert.equal(await page.locator('.game-mobile-nav svg[data-icon-set="hackernoon-solid"]').count(), 3, "Chosen solid family is used by all bottom panel controls");
        assert.equal(await clock.count(), 1);
        assert.ok((await clock.boundingBox()).y < 70, "Clock floats in a top corner, never in bottom navigation");
        const nav = page.getByRole("navigation", { name: "Game panels" });
        assert.equal(await nav.getByRole("button").count(), 3, "Only frequent game panels at the bottom");
        assert.equal(await nav.getByRole("combobox").count(), 0, "History is separate from Chat");
        const phase = page.getByRole("combobox", { name: "View phase" });
        assert.ok((await phase.boundingBox()).y < 70);
        await editor.fill("Keep this draft while checking history.");
        await capture(page, `game-${theme}-${width}`);
        await phase.selectOption("0");
        await page.getByText("Viewing history", { exact: true }).waitFor();
        await capture(page, `history-${theme}-${width}`);
        await page.getByRole("button", { name: "Return to current", exact: true }).click();
        assert.equal(await editor.inputValue(), "Keep this draft while checking history.");
        await page.getByRole("button", { name: "Menu", exact: true }).click();
        await page.getByRole("button", { name: "Game info", exact: true }).click();
        await page.locator('[data-testid="game-info-tab"]').waitFor();
        await nav.getByRole("button", { name: "Chat", exact: true }).click();
        assert.equal(await editor.inputValue(), "Keep this draft while checking history.");
        await page.evaluate(() => { document.documentElement.style.setProperty("--app-bottom", "300px"); document.documentElement.dataset.keyboard = "open"; });
        assert.equal(await page.locator(".game-mobile-tools").isVisible(), false);
        assert.equal(await nav.isVisible(), false);
        assert.equal(await clock.isVisible(), true);
        const bounds = await editor.boundingBox(); assert.ok(bounds.y + bounds.height < 544);
        await editor.fill("A message with more space while typing."); await editor.press("Enter");
        assert.ok(await page.evaluate(() => window.__sent.some(([event, data]) => event === "speak" && data.content === "A message with more space while typing.")));
        await capture(page, `typing-inset-simulated-${theme}-${width}`);
        await page.close();
      }
      const page = await open(1440, theme);
      await page.goto(`${origin}/play?theme=${theme}`);
      const join = page.locator('[data-game-id="open"] .game-row-actions').getByRole("link", { name: "Join", exact: true }); await join.waitFor();
      const raised = await join.evaluate(element => ({ shadow: getComputedStyle(element).boxShadow, transform: getComputedStyle(element).transform }));
      assert.match(raised.shadow, /0px 3px 0px/);
      await capture(page, `lobby-raised-${theme}`);
      const wall = page.getByRole("region", { name: "Community wall" });
      await wall.getByText("Anyone up for Classic this evening?", { exact: true }).waitFor();
      await wall.evaluate(element => element.scrollIntoView({ block: "start" }));
      await capture(page, `community-wall-${theme}-1440`);
      await page.setViewportSize({ width: 390, height: 844 });
      await wall.evaluate(element => element.scrollIntoView({ block: "start" }));
      await capture(page, `community-wall-comments-${theme}-390`);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await wall.getByRole("button", { name: "Post Comment", exact: true }).click();
      const wallEditor = wall.locator("textarea").first();
      await wallEditor.fill("Keep my community wall draft.");
      await page.getByRole("tab", { name: "Chat", exact: true }).click();
      await page.getByRole("tab", { name: "Games", exact: true }).click();
      assert.equal(await wallEditor.inputValue(), "Keep my community wall draft.");
      await page.setViewportSize({ width: 390, height: 844 });
      await wall.evaluate(element => element.scrollIntoView({ block: "start" }));
      await capture(page, `community-wall-${theme}-390`);
      await page.locator(".site-wrapper").evaluate(element => { element.scrollTop = element.scrollHeight; });
      await capture(page, `community-wall-bottom-${theme}-390`);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await join.scrollIntoViewIfNeeded();
      const joinBounds = await join.boundingBox(); await page.mouse.move(joinBounds.x + 10, joinBounds.y + 10); await page.mouse.down();
      const pressed = await join.evaluate(element => ({ shadow: getComputedStyle(element).boxShadow, transform: getComputedStyle(element).transform }));
      assert.match(pressed.shadow, /0px 1px 0px/); assert.notEqual(pressed.transform, "none");
      await page.screenshot({ path: path.join(output, `join-pressed-${theme}.png`), animations: "disabled" });
      // Release away from the link so this visual test does not navigate.
      await page.mouse.move(0, 0); await page.mouse.up();
      await page.goto(`${origin}/?iconChoices=1&theme=${theme}`);
      await page.locator('[data-icon-choice="bootstrap-fill"]').waitFor(); await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('[data-icon-choice]').count(), 5);
      await capture(page, `icon-choices-${theme}-1440`);
      await page.setViewportSize({ width: 390, height: 844 });
      for (const choice of ["current", "pixel-solid", "phosphor-fill", "phosphor-duotone", "bootstrap-fill"]) {
        await page.getByRole("combobox", { name: "Preview icon family" }).selectOption(choice);
        await page.locator('.icon-choices-review').evaluate(element => { element.scrollTop = 0; });
        await capture(page, `icons-${choice}-${theme}-390`);
        await page.locator('.icon-choices-review').evaluate(element => { element.scrollTop = element.scrollHeight; });
        await capture(page, `icons-${choice}-${theme}-390-bottom`);
      }
      await page.close();
    }
    const pending = await open(390, "light");
    await pending.clock.install();
    await pending.goto(`${origin}/?pendingReview=1&theme=light`);
    await pending.locator(".ui-pending").waitFor();
    await pending.clock.runFor(160);
    await pending.getByRole("status").getByText("Loading…", { exact: true }).waitFor();
    assert.ok((await pending.getByRole("status").boundingBox()).height < 120, "Loading does not replace the viewport with a full-screen animation");
    await capture(pending, "shared-loading-light-390");
    await pending.evaluate(() => window.__finishPending());
    await pending.locator("[data-ready-content]").waitFor();
    assert.equal(await pending.getByRole("status").count(), 0, "Content appears immediately; no minimum loading hold");
    await pending.close();
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, "report.json"), JSON.stringify({ records, errors, caveat: "Local production components, controlled transports and simulated keyboard insets; no live or physical-device coverage." }, null, 2));
    console.log(`${records.length + 2} captures; top clock/history, frequent bottom panels, keyboard chrome, drafts/sends and raised/pressed primary actions checked.`);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
