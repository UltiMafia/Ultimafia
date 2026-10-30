// Build rsbuild.strategy-windows-test.config.ts first
// (npm run test:strategy-windows:browser does both). Uses an isolated Playwright
// installation via PLAYWRIGHT_MODULE; PLAYWRIGHT_BROWSERS_PATH is passed through.
// BROWSERS defaults to chromium. CHROMIUM_PATH optionally selects a system
// Chrome. No backend is needed: the harness answers the strategy API itself.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const TITLE_BAR = 44;
const MIN_WIDTH = 280;
const MIN_HEIGHT = 200;

function near(actual, expected, tolerance, label) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${label}: expected ~${expected}, got ${actual}`
  );
}

async function main() {
  assert.ok(process.env.PLAYWRIGHT_MODULE, "Set PLAYWRIGHT_MODULE");
  const playwright = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(
    process.argv[2] || "/tmp/opencode/ultimafia-strategy-windows-browser"
  );
  // The harness links the site's icon font from public/ (see the rsbuild
  // config), which is not part of the built bundle.
  const publicDir = path.resolve(__dirname, "../public");
  const server = http.createServer((req, res) => {
    let pathname = new URL(req.url, "http://localhost").pathname;
    if (pathname.startsWith("/public-assets/")) {
      const asset = path.resolve(
        process.env.PUBLIC_DIR || publicDir,
        "." + pathname.slice("/public-assets".length)
      );
      const type = { ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf" };
      res.setHeader("Content-Type", type[path.extname(asset)] || "application/octet-stream");
      fs.createReadStream(asset).on("error", () => res.writeHead(404).end()).pipe(res);
      return;
    }
    const filename = path.resolve(directory, "." + pathname);
    if (filename !== directory && !filename.startsWith(directory + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    const file =
      fs.existsSync(filename) && fs.statSync(filename).isFile()
        ? filename
        : path.join(directory, "index.html");
    const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
    res.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream");
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;
  let checks = 0;

  async function drag(page, from, to, steps = 10) {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps });
    await page.mouse.up();
  }

  try {
    for (const engine of (process.env.BROWSERS || "chromium").split(",")) {
      const browser = await playwright[engine].launch({
        headless: true,
        ...(engine === "chromium" && process.env.CHROMIUM_PATH
          ? { executablePath: process.env.CHROMIUM_PATH }
          : {}),
      });
      try {
        // ---- Desktop: pop out, drag, resize, stack, collapse, persist ----
        const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
        const errors = [];
        page.on("pageerror", (error) => {
          errors.push(error.message);
          console.error(error);
        });
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text());
        });
        await page.route("**/*", (route) =>
          new URL(route.request().url()).origin === new URL(url).origin
            ? route.continue()
            : route.abort()
        );

        await page.goto(url);
        await page.waitForFunction(() => window.__strategyWindowsReady);
        await page.evaluate(() => sessionStorage.clear());
        await page.reload();
        await page.waitForFunction(() => window.__strategyWindowsReady);

        // The guides are in the panel, and each panel offers a pop-out.
        await page.locator("[data-testid=strategy-popout]").first().waitFor();
        assert.equal(
          await page.locator("[data-testid=strategy-popout]").count(),
          2,
          "desktop: one pop-out button per guide panel"
        );
        assert.equal(
          await page.locator("[data-testid=strategy-window]").count(),
          0,
          "desktop: no floating window before the button is pressed"
        );
        checks += 2;

        // Pop out the first panel's guides.
        await page.locator("[data-testid=strategy-popout]").first().click();
        const win = page.locator("[data-testid=strategy-window]");
        await win.waitFor();
        assert.equal(await win.count(), 1, "desktop: one window after one pop-out");
        assert.equal(
          (await page.locator("[data-testid=strategy-window-title]").first().innerText()).trim(),
          "Open Roles 12P",
          "desktop: the window names the setup"
        );
        await win.getByText("Vote on day one").first().waitFor();
        checks += 3;

        // Pressing the same panel's button again focuses instead of duplicating.
        await page.locator("[data-testid=strategy-popout]").first().click();
        assert.equal(await win.count(), 1, "desktop: no duplicate window for one setup");
        checks += 1;

        // Drag by the title bar.
        let box = await win.boundingBox();
        const bar = await page.locator("[data-testid=strategy-window-titlebar]").first().boundingBox();
        await drag(
          page,
          { x: bar.x + 40, y: bar.y + bar.height / 2 },
          { x: bar.x + 160, y: bar.y + bar.height / 2 + 70 }
        );
        let moved = await win.boundingBox();
        near(moved.x - box.x, 120, 2, "desktop: drag moves the window right");
        near(moved.y - box.y, 70, 2, "desktop: drag moves the window down");
        checks += 2;

        // Dragging past the edge keeps the window on screen.
        const bar2 = await page.locator("[data-testid=strategy-window-titlebar]").first().boundingBox();
        await drag(
          page,
          { x: bar2.x + 40, y: bar2.y + bar2.height / 2 },
          { x: -400, y: -400 }
        );
        const clamped = await win.boundingBox();
        assert.equal(Math.round(clamped.x), 4, "desktop: window clamps at the left edge");
        assert.equal(Math.round(clamped.y), 4, "desktop: window clamps at the top edge");
        checks += 2;

        // Resize from the bottom-right corner.
        box = await win.boundingBox();
        const corner = await page.locator("[data-testid=strategy-window-resize]").first().boundingBox();
        await drag(
          page,
          { x: corner.x + corner.width / 2, y: corner.y + corner.height / 2 },
          { x: corner.x + corner.width / 2 + 140, y: corner.y + corner.height / 2 + 90 }
        );
        const bigger = await win.boundingBox();
        near(bigger.width - box.width, 140, 2, "desktop: resize widens the window");
        near(bigger.height - box.height, 90, 2, "desktop: resize heightens the window");
        checks += 2;

        // ...and it cannot be shrunk below the minimum or past the viewport.
        const corner2 = await page.locator("[data-testid=strategy-window-resize]").first().boundingBox();
        await drag(
          page,
          { x: corner2.x + corner2.width / 2, y: corner2.y + corner2.height / 2 },
          { x: corner2.x - 900, y: corner2.y - 900 }
        );
        const smallest = await win.boundingBox();
        assert.equal(Math.round(smallest.width), MIN_WIDTH, "desktop: minimum width");
        assert.equal(Math.round(smallest.height), MIN_HEIGHT, "desktop: minimum height");
        checks += 2;

        // A second setup opens a second window, on top; clicking the first
        // brings it forward.
        await page.locator("[data-testid=strategy-popout]").nth(1).click();
        await page.waitForFunction(
          () => document.querySelectorAll("[data-testid=strategy-window]").length === 2
        );
        // Windows are tracked by setup id: raising one reorders the DOM.
        const windowFor = (setupId) =>
          page.locator(`[data-testid=strategy-window][data-setup-id="${setupId}"]`);
        const zIndexOf = async (setupId) =>
          Number(
            await windowFor(setupId).evaluate((el) => getComputedStyle(el).zIndex)
          );
        assert.ok(
          (await zIndexOf("setupRandom")) > (await zIndexOf("setupOpen")),
          "desktop: the newest window is on top"
        );
        await windowFor("setupOpen")
          .locator("[data-testid=strategy-window-titlebar]")
          .click();
        assert.ok(
          (await zIndexOf("setupOpen")) > (await zIndexOf("setupRandom")),
          "desktop: clicking a window raises it above the other"
        );
        checks += 3;

        // Collapse hides the body but keeps the title bar.
        const openWin = page.locator("[data-testid=strategy-window]").first();
        const openBox = await openWin.boundingBox();
        await openWin.locator("[data-testid=strategy-window-collapse]").click();
        const collapsedBox = await openWin.boundingBox();
        assert.equal(
          Math.round(collapsedBox.height),
          TITLE_BAR,
          "desktop: collapsing leaves just the title bar"
        );
        assert.ok(openBox.height > TITLE_BAR, "desktop: the window had a body to collapse");
        assert.equal(
          await openWin.locator("[data-testid=strategy-window-body]").isVisible(),
          false,
          "desktop: the guide list is hidden while collapsed"
        );
        await openWin.locator("[data-testid=strategy-window-collapse]").click();
        assert.equal(
          await openWin.locator("[data-testid=strategy-window-body]").isVisible(),
          true,
          "desktop: expanding brings the guide list back"
        );
        checks += 4;

        // Geometry and open windows survive a reload.
        const beforeReload = await win.first().boundingBox();
        await page.reload();
        await page.waitForFunction(() => window.__strategyWindowsReady);
        await page.locator("[data-testid=strategy-window]").first().waitFor();
        assert.equal(
          await page.locator("[data-testid=strategy-window]").count(),
          2,
          "desktop: both windows come back after a reload"
        );
        const afterReload = await page
          .locator("[data-testid=strategy-window]")
          .first()
          .boundingBox();
        near(afterReload.x, beforeReload.x, 2, "desktop: position restored");
        near(afterReload.y, beforeReload.y, 2, "desktop: position restored (y)");
        near(afterReload.width, beforeReload.width, 2, "desktop: size restored");
        checks += 4;

        // Closing removes the window and forgets it.
        await page
          .locator("[data-testid=strategy-window]")
          .nth(1)
          .locator("[data-testid=strategy-window-close]")
          .click();
        await page.waitForFunction(
          () => document.querySelectorAll("[data-testid=strategy-window]").length === 1
        );
        const stored = await page.evaluate(() =>
          JSON.parse(sessionStorage.getItem("strategyWindows") || "[]")
        );
        assert.equal(stored.length, 1, "desktop: the closed window is gone from storage");
        checks += 2;

        if (process.env.SCREENSHOT_DIR) {
          await page.screenshot({
            path: path.join(process.env.SCREENSHOT_DIR, `strategies-desktop-${engine}.png`),
          });
        }

        assert.deepEqual(errors, [], `${engine}: no page errors`);
        checks += 1;
        console.log(`ok ${engine} desktop: pop-out, drag, clamp, resize, stack, collapse, reload, close`);
        await page.close();

        // ---- Mobile: guides under the Info tab, no pop-out buttons ----
        const phone = await browser.newPage({ viewport: { width: 390, height: 800 } });
        const phoneErrors = [];
        phone.on("pageerror", (error) => {
          phoneErrors.push(error.message);
          console.error(error);
        });
        phone.on("console", (message) => {
          if (message.type() === "error") phoneErrors.push(message.text());
        });
        await phone.route("**/*", (route) =>
          new URL(route.request().url()).origin === new URL(url).origin
            ? route.continue()
            : route.abort()
        );
        await phone.goto(url + "?mode=mobile");
        await phone.waitForFunction(() => window.__strategyWindowsReady);
        await phone.evaluate(() => sessionStorage.clear());

        // Phones get the guides in the tab, not in a floating window.
        assert.equal(
          await phone.locator("[data-testid=strategy-popout]").count(),
          0,
          "mobile: no pop-out button on a phone"
        );
        const infoTab = phone.locator("[data-testid=info-tab]");
        const tabBox = await infoTab.boundingBox();
        assert.ok(tabBox.height > 400, `mobile: the Info tab has room (${tabBox.height}px)`);
        await infoTab.getByText("Info tab guide 1").waitFor();
        checks += 3;

        // The list fills the tab and scrolls, rather than collapsing.
        const scroller = infoTab.locator("[data-testid=strategy-list-scroll]");
        const metrics = await scroller.evaluate((el) => ({
          clientHeight: el.clientHeight,
          scrollHeight: el.scrollHeight,
        }));
        assert.ok(metrics.clientHeight > 200, "mobile: the guide list has a real height");
        assert.ok(
          metrics.scrollHeight > metrics.clientHeight,
          "mobile: a longer guide list scrolls inside the tab"
        );
        checks += 2;

        // A guide can be opened while the game runs (the tab is not pregame-only).
        await infoTab.getByText("Info tab guide 3").click();
        await infoTab.getByText("Body of guide 3.").waitFor();
        checks += 1;

        if (process.env.SCREENSHOT_DIR) {
          await phone.screenshot({
            path: path.join(process.env.SCREENSHOT_DIR, `strategies-mobile-${engine}.png`),
          });
        }

        assert.deepEqual(phoneErrors, [], `${engine}: no mobile page errors`);
        checks += 1;
        console.log(`ok ${engine} mobile: guides in the Info tab, scrolls, expands`);
        await phone.close();
      } finally {
        await browser.close();
      }
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
  console.log(`${checks} checks passed`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
