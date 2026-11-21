// Build rsbuild.ready-check-test.config.ts first. Uses an isolated Playwright
// installation via PLAYWRIGHT_MODULE. No backend is needed: the fixture mounts
// the real dialog with stub callbacks. SCREENSHOT_DIR saves the desktop and
// phone shots in both schemes.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const LABELS = { spectate: "Spectate instead", ready: "I am Ready", leave: "Leave Game" };

async function main() {
  assert.ok(process.env.PLAYWRIGHT_MODULE, "Set PLAYWRIGHT_MODULE");
  const playwright = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(
    process.argv[2] || "/tmp/ultimafia-ready-check-browser",
  );
  const shots = process.env.SCREENSHOT_DIR;
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    const filename = path.resolve(directory, "." + pathname);
    if (filename !== directory && !filename.startsWith(directory + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    const file = fs.existsSync(filename) && fs.statSync(filename).isFile()
      ? filename : path.join(directory, "index.html");
    const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
    res.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream");
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;

  let checks = 0;
  const check = (condition, message) => {
    assert.ok(condition, message);
    checks += 1;
  };
  const calls = (page) => page.evaluate(() => window.__calls.slice());
  const clearCalls = (page) => page.evaluate(() => { window.__calls.length = 0; });

  const open = async (page, query) => {
    await page.goto(url + query);
    await page.waitForFunction(() => window.__ready, null, { timeout: 20000 });
    await page.waitForSelector('[role="dialog"]', { state: "visible" });
  };
  const button = (page, label) =>
    page.locator('[role="dialog"] button', { hasText: label });

  try {
    for (const engine of (process.env.BROWSERS || "chromium").split(",")) {
      const browser = await playwright[engine].launch({ headless: true });
      try {
        for (const viewport of [
          { name: "desktop", width: 1000, height: 800 },
          { name: "phone", width: 390, height: 800 },
        ]) {
          for (const mode of ["dark", "light"]) {
            const page = await browser.newPage({ viewport });
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            page.on("console", (message) => {
              if (message.type() === "error") errors.push(message.text());
            });
            await page.route("**/*", (route) =>
              new URL(route.request().url()).origin === new URL(url).origin
                ? route.continue() : route.abort(),
            );

            await open(page, `?mode=${mode}`);

            // The dialog offers all three choices and counts down.
            for (const [name, label] of Object.entries(LABELS)) {
              check(
                await button(page, label).isVisible(),
                `${name} button is visible (${viewport.name}, ${mode})`,
              );
            }
            check(
              /^\d+s$/.test((await page.locator('[role="dialog"] h4').innerText()).trim()),
              "the countdown still renders",
            );
            check(
              (await page.locator('[role="dialog"]').innerText()).includes(
                "Failure to ready up will move you to spectators.",
              ),
              "the failure hint is still shown",
            );

            // Each button asks the game for its own action, and only that.
            await clearCalls(page);
            await button(page, LABELS.spectate).click();
            check(
              JSON.stringify(await calls(page)) === JSON.stringify(["spectate"]),
              "Spectate instead sends the spectate action and nothing else",
            );
            check(
              await page.locator('[role="dialog"]').isVisible(),
              "the dialog stays up until the server answers",
            );

            await clearCalls(page);
            await button(page, LABELS.ready).click();
            check(
              JSON.stringify(await calls(page)) === JSON.stringify(["ready"]),
              "I am Ready still confirms the ready check",
            );

            await clearCalls(page);
            await button(page, LABELS.leave).click();
            check(
              JSON.stringify(await calls(page)) === JSON.stringify(["leave"]),
              "Leave Game still leaves",
            );

            // Enter anywhere else confirms Ready, once.
            await clearCalls(page);
            await page.evaluate(() => document.activeElement.blur());
            await page.keyboard.press("Enter");
            check(
              JSON.stringify(await calls(page)) === JSON.stringify(["ready"]),
              "Enter confirms Ready once from outside the buttons",
            );

            // Enter on a secondary button belongs to that button, not to Ready.
            await clearCalls(page);
            await button(page, LABELS.spectate).focus();
            await page.keyboard.press("Enter");
            check(
              JSON.stringify(await calls(page)) === JSON.stringify(["spectate"]),
              "Enter on Spectate instead does not also confirm Ready",
            );

            await clearCalls(page);
            await button(page, LABELS.leave).focus();
            await page.keyboard.press("Enter");
            check(
              JSON.stringify(await calls(page)) === JSON.stringify(["leave"]),
              "Enter on Leave Game does not also confirm Ready",
            );

            // Nothing is clipped or pushed off a phone screen.
            const layout = await page.evaluate(() => {
              const dialog = document.querySelector('[role="dialog"]');
              const buttons = [...dialog.querySelectorAll("button")].map((el) => ({
                label: el.textContent.trim(),
                clipped: el.scrollWidth > el.clientWidth + 1,
                width: Math.round(el.getBoundingClientRect().width),
              }));
              return {
                dialogWidth: dialog.getBoundingClientRect().width,
                viewportWidth: window.innerWidth,
                pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
                buttons,
              };
            });
            check(
              layout.dialogWidth <= layout.viewportWidth,
              `the dialog fits the ${viewport.name} width`,
            );
            check(
              layout.pageOverflow <= 0,
              `the page does not scroll sideways (${viewport.name}, ${mode})`,
            );
            // The extra choice is a normal-sized button, not a stretched bar.
            const spectateWidth = layout.buttons.find(
              (entry) => entry.label === LABELS.spectate,
            ).width;
            check(
              spectateWidth < layout.dialogWidth * 0.75,
              `Spectate instead keeps the footprint of a button (${spectateWidth}px of ${Math.round(layout.dialogWidth)}px)`,
            );
            for (const entry of layout.buttons) {
              check(
                !entry.clipped,
                `"${entry.label}" text is not clipped (${viewport.name}, ${mode})`,
              );
            }

            if (shots) {
              fs.mkdirSync(shots, { recursive: true });
              const dialog = page.locator('[role="dialog"]');
              await dialog.screenshot({
                path: path.join(shots, `ready-check-${viewport.name}-${mode}.png`),
              });
              await page.screenshot({
                path: path.join(shots, `ready-check-page-${viewport.name}-${mode}.png`),
              });
            }

            assert.deepEqual(errors, [], `page errors (${viewport.name}, ${mode})`);
            await page.close();
          }
        }

        // A lobby with spectating off passes no handler, so the choice is gone.
        const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
        await open(page, "?mode=dark&spectate=0");
        check(
          (await button(page, LABELS.spectate).count()) === 0,
          "no Spectate instead button when the lobby does not allow spectating",
        );
        check(
          await button(page, LABELS.ready).isVisible() &&
            await button(page, LABELS.leave).isVisible(),
          "the other two choices remain without spectating",
        );
        await page.close();
      } finally {
        await browser.close();
      }
    }
    console.log(`${checks} checks passed`);
  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
