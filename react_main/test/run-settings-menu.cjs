// Browser regression: the expanded in-game Settings menu must keep its Save
// button reachable in the real game layout on short windows, through opening,
// closing and reopening, a window resize and a larger root font size, and by
// keyboard, and the menu must still animate open.
//
//   npx rsbuild build --config rsbuild.settings-menu-test.config.ts
//   PLAYWRIGHT_MODULE=/path/to/playwright node test/run-settings-menu.cjs
//
// Uses an isolated Playwright install (PLAYWRIGHT_MODULE; CHROMIUM_PATH is
// optional), serves the build on loopback and blocks every external request.
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

async function main() {
  if (!process.env.PLAYWRIGHT_MODULE)
    throw new Error(
      "Set PLAYWRIGHT_MODULE to an isolated Playwright installation.",
    );
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(
    process.argv[2] || "build_public/settings-menu-test",
  );
  if (!fs.existsSync(path.join(directory, "index.html")))
    throw new Error("Build the settings menu fixture first.");
  const mime = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
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
  const passes = [];
  const check = (ok, name, detail) =>
    (ok ? passes : failures).push(
      `${name}${detail ? " " + JSON.stringify(detail) : ""}`,
    );
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.CHROMIUM_PATH
        ? { executablePath: process.env.CHROMIUM_PATH }
        : {}),
    });
    const context = await browser.newContext({
      viewport: { width: 1180, height: 557 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/*", (route) => {
      const u = new URL(route.request().url());
      if (u.protocol === "data:" || u.hostname === "127.0.0.1")
        return route.continue();
      return route.abort();
    });
    await page.goto(url);
    await page.waitForFunction(() => window.__settingsMenuReady);
    await page.waitForTimeout(200);
    const titles = await page.evaluate(() =>
      [...document.querySelectorAll(".side-menu")].map((m) => m.textContent.slice(0, 40)),
    );
    if (!titles.some((t) => /Settings/.test(t)))
      throw new Error(
        "Settings menu not rendered: " + JSON.stringify({ titles, errors, body: await page.evaluate(() => document.body.innerText.slice(0, 300)) }),
      );

    const menu = () =>
      page.evaluate(() => {
        const settings = [...document.querySelectorAll(".side-menu")].find(
          (m) => /Settings/.test(m.querySelector(".MuiAccordionSummary-root")?.textContent || ""),
        );
        const box = (el) => {
          const r = el.getBoundingClientRect();
          return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) };
        };
        const save = [...settings.querySelectorAll("button")].find(
          (b) => b.textContent.trim() === "Save",
        );
        const panel = settings.parentElement;
        const players = [...panel.children].find((c) => c !== settings && c.classList.contains("side-menu"));
        const out = {
          settings: box(settings),
          panel: box(panel),
          players: players ? box(players) : null,
          viewport: window.innerHeight,
        };
        if (save) {
          const visible = save.offsetParent !== null && box(save).height > 0;
          save.scrollIntoView({ block: "nearest" });
          const r = save.getBoundingClientRect();
          const p = panel.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          out.save = box(save);
          out.saveReachable =
            visible &&
            r.top >= Math.max(0, p.top) - 1 &&
            r.bottom <= Math.min(window.innerHeight, p.bottom) + 1 &&
            !!hit &&
            save.contains(hit);
        }
        return out;
      });
    const header = page.locator(".side-menu .MuiAccordionSummary-root", { hasText: "Settings" });

    const collapsed = await menu();
    check(!collapsed.save || !collapsed.saveReachable, "collapsed: form hidden", collapsed.settings);

    // Opening: sample the real MUI Collapse height while it animates.
    await header.click();
    const samples = [];
    for (const t of [40, 80, 120, 160, 200, 300, 400]) {
      await page.waitForTimeout(t - (samples.length ? [40, 80, 120, 160, 200, 300, 400][samples.length - 1] : 0));
      samples.push(
        await page.evaluate(() => {
          const c = [...document.querySelectorAll(".side-menu .MuiCollapse-root")].pop();
          return c ? Math.round(c.getBoundingClientRect().height) : null;
        }),
      );
    }
    await page.waitForTimeout(400);
    const entered = await page.evaluate(() => {
      const c = [...document.querySelectorAll(".side-menu .MuiCollapse-root")].pop();
      return { height: Math.round(c.getBoundingClientRect().height), entered: c.classList.contains("MuiCollapse-entered") };
    });
    check(
      entered.entered && entered.height > 0 && samples.some((h) => h > 0 && h < entered.height - 1),
      "open: Collapse animates through a smaller height, then ends entered",
      { samples, final: entered },
    );
    const opened = await menu();
    check(opened.saveReachable, "1180x557 open: Save reachable", opened);

    // Keyboard: Tab from the Settings header until Save has focus.
    await header.focus();
    let reached = false;
    for (let i = 0; i < 80 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await page.evaluate(() => document.activeElement?.textContent?.trim() === "Save");
    }
    const focused = reached
      ? await page.evaluate(() => {
          const r = document.activeElement.getBoundingClientRect();
          const p = document.activeElement.closest(".side-menu").parentElement.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return {
            top: Math.round(r.top),
            bottom: Math.round(r.bottom),
            onScreen:
              r.top >= Math.max(0, p.top) - 1 &&
              r.bottom <= Math.min(window.innerHeight, p.bottom) + 1 &&
              !!hit &&
              document.activeElement.contains(hit),
          };
        })
      : null;
    check(reached && focused.onScreen, "keyboard: Tab reaches Save on screen", focused);

    // Close and reopen.
    await header.click();
    await page.waitForTimeout(600);
    const closed = await menu();
    check(
      Math.abs(closed.settings.height - collapsed.settings.height) <= 1 &&
        Math.abs((closed.players?.height || 0) - (collapsed.players?.height || 0)) <= 1,
      "closed: sizes back to collapsed",
      { before: collapsed.settings, after: closed.settings, playersBefore: collapsed.players, playersAfter: closed.players },
    );
    await header.click();
    await page.waitForTimeout(600);
    const reopened = await menu();
    check(reopened.saveReachable, "reopened: Save reachable", reopened);

    // Larger root font, as the site's Font size setting applies.
    await page.evaluate(() => (document.documentElement.style.fontSize = "20px"));
    await page.waitForTimeout(300);
    const bigFont = await menu();
    check(bigFont.saveReachable, "root font 20px: Save reachable", bigFont);
    await page.evaluate(() => (document.documentElement.style.fontSize = ""));

    // Resize taller and back.
    await page.setViewportSize({ width: 1180, height: 757 });
    await page.waitForTimeout(300);
    const tall = await menu();
    check(tall.saveReachable, "1180x757: Save reachable", tall);
    await page.setViewportSize({ width: 1180, height: 557 });
    await page.waitForTimeout(300);
    const short = await menu();
    check(short.saveReachable, "back to 1180x557: Save reachable", short);

    check(errors.length === 0, "no page errors", errors);
    await context.close();
  } finally {
    if (browser) await browser.close();
    server.close();
  }
  for (const p of passes) console.log("PASS", p);
  for (const f of failures) console.log("FAIL", f);
  console.log(`${passes.length} passed, ${failures.length} failed`);
  process.exitCode = failures.length ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
