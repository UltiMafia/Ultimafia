// Browser regression for the speech filter panel: picking a player from the
// roster must narrow both the full-DOM and the windowed (virtualized)
// transcript, keep the server log, show the active-filter chip, clear back to
// the whole chat, and show a real empty state instead of a blank transcript.
//
//   npx rsbuild build --config rsbuild.speech-filters-test.config.ts
//   PLAYWRIGHT_MODULE=/path/to/playwright node test/run-speech-filters.cjs
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const BOX_MESSAGES = 80;
const BOX_BOB_ROWS = Math.floor((BOX_MESSAGES + 2) / 3); // i % 3 === 1 → 27

async function main() {
  if (!process.env.PLAYWRIGHT_MODULE)
    throw new Error(
      "Set PLAYWRIGHT_MODULE to an isolated Playwright installation.",
    );
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(
    process.argv[2] ||
      process.env.SPEECH_FILTERS_DIST ||
      "/tmp/ultimafia-speech-filters-browser",
  );
  if (!fs.existsSync(path.join(directory, "index.html")))
    throw new Error("Build the speech filters fixture first.");

  const mime = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".map": "application/json",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
  };
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    let filename = path.resolve(directory, "." + pathname);
    if (
      !filename.startsWith(directory + path.sep) ||
      !fs.existsSync(filename) ||
      fs.statSync(filename).isDirectory()
    ) {
      if (path.extname(pathname)) {
        res.writeHead(404);
        res.end();
        return;
      }
      filename = path.join(directory, "index.html");
    }
    res.writeHead(200, {
      "Content-Type":
        mime[path.extname(filename)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(filename).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;

  const failures = [];
  let passes = 0;
  const check = (ok, name) => {
    if (ok) passes++;
    else failures.push(name);
  };

  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
  );
  const shots = process.env.SCREENSHOT_DIR;
  if (shots) fs.mkdirSync(shots, { recursive: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1000, height: 700 },
    });
    page.on("pageerror", (error) =>
      failures.push("page error: " + error.message),
    );
    await page.route("**/*", (route) =>
      route.request().url().startsWith(url) ? route.continue() : route.abort(),
    );

    async function open(query) {
      await page.goto(url + "?" + query);
      await page.waitForFunction(() => window.__ready, null, {
        timeout: 15000,
      });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(
        () => document.querySelectorAll(".game .message").length > 0,
        null,
        { timeout: 15000 },
      );
    }

    async function expandFilters() {
      const input = page.locator('input[placeholder="From player"]');
      if (await input.isVisible().catch(() => false)) return;
      const header = page
        .locator(".side-menu .MuiAccordionSummary-content")
        .first();
      await header.click();
      await page.waitForSelector('input[placeholder="From player"]');
      // Expansion animates; let the list render before measuring.
      await page.waitForTimeout(400);
    }

    async function pickPlayer(name) {
      const input = page.locator('input[placeholder="From player"]');
      await input.click();
      await input.fill(name);
      const option = page
        .locator('.MuiAutocomplete-option[role="option"]')
        .filter({ hasText: new RegExp(`^${name}$`) })
        .first();
      await option.click();
      await page.getByRole("button", { name: "Clear filters" }).waitFor({
        state: "visible",
        timeout: 5000,
      });
      await page.waitForFunction(
        (picked) =>
          document.querySelector('input[placeholder="From player"]')?.value ===
          picked,
        name,
        { timeout: 5000 },
      );
    }

    async function fillContains(text) {
      await page.fill('input[placeholder="Contains"]', text);
    }

    async function clearFilter() {
      await page.getByRole("button", { name: "Clear filters" }).click();
      await page.getByRole("button", { name: "Clear filters" }).waitFor({
        state: "detached",
        timeout: 5000,
      });
    }

    async function renderedIds() {
      return page.evaluate(() =>
        [...document.querySelectorAll(".game .message[data-message-id]")].map(
          (message) => message.dataset.messageId,
        ),
      );
    }

    function allBobOrServer(ids) {
      return ids.length > 0 && ids.every((id) => /^b\d+$/.test(id) || id === "server1");
    }

    async function scrollTranscript(to) {
      await page.evaluate((where) => {
        const scroller = document.querySelector(
          '[data-transcript-window]',
        );
        if (!scroller) return;
        scroller.scrollTop = where === "top" ? 0 : scroller.scrollHeight;
      }, to);
      await page.waitForTimeout(300);
    }

    // ---- Windowed transcript -------------------------------------------
    await open("windowed=1");
    check(
      (await page.locator("[data-transcript-window]").count()) === 1,
      "windowed transcript renders with data-transcript-window",
    );

    const censor = await page.evaluate(() => window.__censorChecks);
    check(censor?.swearMasked, "swear censor masks a known swear");
    check(censor?.slurMasked, "slur censor masks a known slur");
    check(
      censor?.allDisabledUnchanged,
      "disabling both censors leaves text unchanged",
    );

    const renderedBefore = await renderedIds();
    check(
      renderedBefore.length > 0 && renderedBefore.length < BOX_MESSAGES,
      "windowed transcript renders only the visible rows before filtering",
    );
    const heightBefore = await page.evaluate(
      () => document.querySelector("[data-transcript-window]").scrollHeight,
    );

    await page.keyboard.press("Control+f");
    await page.waitForSelector('input[placeholder="From player"]', {
      timeout: 5000,
    });
    check(true, "Ctrl+F opens the speech filter panel");
    check(
      (await page.evaluate(() => document.activeElement?.getAttribute("placeholder"))) ===
        "Contains",
      "Ctrl+F puts the caret in the Contains field",
    );
    await page.keyboard.type("cop");
    check(
      (await page.locator('input[placeholder="Contains"]').inputValue()) === "cop",
      "typing immediately after Ctrl+F enters the field",
    );
    await page.fill('input[placeholder="Contains"]', "");

    await expandFilters();
    await pickPlayer("Bob");

    let ids = await renderedIds();
    check(allBobOrServer(ids), "windowed: only Bob rows remain after From Bob");
    check(
      ids.includes("server1"),
      "windowed: the server log stays visible under a speech filter",
    );
    await page.keyboard.press("Control+f");
    check(
      (await page.evaluate(() => document.activeElement?.getAttribute("placeholder"))) ===
        "Contains",
      "Ctrl+F focuses the field when the panel is already open",
    );
    if (shots)
      await page.screenshot({
        path: path.join(shots, "windowed-from-bob.png"),
      });

    await scrollTranscript("bottom");
    ids = await renderedIds();
    check(
      allBobOrServer(ids) && ids.includes("b79"),
      "windowed: scrolling to the newest matching row keeps the filter",
    );

    await scrollTranscript("top");
    ids = await renderedIds();
    check(
      allBobOrServer(ids) && ids.includes("b1"),
      "windowed: scrolling back to the oldest matching row keeps the filter",
    );

    const heightAfter = await page.evaluate(
      () => document.querySelector("[data-transcript-window]").scrollHeight,
    );
    check(
      heightAfter < heightBefore,
      "windowed: filtering shrinks the virtual scroll height",
    );

    await clearFilter();
    await scrollTranscript("bottom");
    ids = await renderedIds();
    check(
      ids.some((id) => /^v\d+$/.test(id) || /^a\d+$/.test(id)),
      "windowed: clearing the chip restores other senders' rows",
    );

    await pickPlayer("Watcher");
    await scrollTranscript("bottom");
    ids = await renderedIds();
    check(
      ids.includes("s0") &&
        ids.every((id) => id === "s0" || id === "server1"),
      "windowed: the picker lists spectators and filters to their chat",
    );

    await clearFilter();
    await fillContains("zzzz");
    await page.waitForSelector(".speech-filter-empty-note", { timeout: 5000 });
    check(
      (await page.textContent(".speech-filter-empty-note")).includes(
        "No messages containing",
      ),
      "empty state names the active content filter",
    );
    ids = await renderedIds();
    check(
      ids.length === 1 && ids[0] === "server1",
      "empty state keeps the server log but no speech rows",
    );
    if (shots)
      await page.screenshot({
        path: path.join(shots, "windowed-empty.png"),
      });
    await clearFilter();
    await page.waitForFunction(
      () => document.querySelectorAll(".game .message[data-message-id]").length > 0,
      null,
      { timeout: 5000 },
    );

    // ---- Full-DOM transcript -------------------------------------------
    await open("windowed=0");
    check(
      (await page.locator("[data-transcript-window]").count()) === 0,
      "full-DOM transcript has no window marker",
    );
    await expandFilters();
    await pickPlayer("Bob");
    ids = await renderedIds();
    check(
      allBobOrServer(ids) && ids.length === BOX_BOB_ROWS + 1,
      "full-DOM: From Bob renders exactly Bob's rows plus the server log",
    );
    check(
      (await page.locator('input[placeholder="From player"]').inputValue()) ===
        "Bob",
      "full-DOM: the picker keeps the selected player",
    );
    check(
      (await page.locator(".speech-filter-status").textContent()) === "Filtered",
      "full-DOM: the panel title shows a filter is active",
    );
    if (shots)
      await page.screenshot({
        path: path.join(shots, "full-dom-from-bob.png"),
      });

    // ---- Single-state history transcript (windowed) ---------------------
    await open("windowed=1&singleState=1");
    check(
      (await page.locator("[data-transcript-window]").count()) === 1,
      "single-state: history transcript is windowed",
    );
    await expandFilters();
    await pickPlayer("Bob");
    await scrollTranscript("bottom");
    ids = await renderedIds();
    check(
      allBobOrServer(ids) && ids.includes("b79"),
      "single-state: From Bob filters the combined history transcript",
    );

    // ---- Retained but inactive session ---------------------------------
    await open("windowed=1&active=0");
    await page.keyboard.press("Control+f");
    await page.waitForTimeout(300);
    check(
      !(await page
        .locator('input[placeholder="From player"]')
        .isVisible()
        .catch(() => false)),
      "inactive session leaves Ctrl+F to the browser",
    );

    // ---- Pregame lobby --------------------------------------------------
    await open("windowed=1&pregame=1");
    check(
      (await page.locator(".side-menu").count()) === 1,
      "pregame: the Speech Filters panel is present",
    );
    await page.keyboard.press("Control+f");
    await page.waitForSelector('input[placeholder="From player"]', {
      timeout: 5000,
    });
    await pickPlayer("Bob");
    ids = await renderedIds();
    check(
      allBobOrServer(ids) && ids.includes("server1"),
      "pregame: From Bob filters the lobby transcript",
    );
    if (shots)
      await page.screenshot({
        path: path.join(shots, "pregame-from-bob.png"),
      });
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  if (failures.length) {
    console.error(`FAIL (${failures.length})`);
    for (const failure of failures) console.error(" - " + failure);
    process.exit(1);
  }
  console.log(`PASS (${passes} checks)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
