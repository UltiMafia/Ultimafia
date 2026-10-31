// Browser regression: on phones, the in-game warning must not cover the last
// row of a page at full scroll. Checked through showing, hiding and showing the
// warning again, a larger root font size, a narrower window that wraps the
// warning, and keyboard focus on the last row; on desktop no space is added.
//
//   npx rsbuild build --config rsbuild.in-game-warning-test.config.ts
//   PLAYWRIGHT_MODULE=/path/to/playwright node test/run-in-game-warning.cjs
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
    process.argv[2] || "build_public/in-game-warning-test",
  );
  if (!fs.existsSync(path.join(directory, "index.html")))
    throw new Error("Build the in-game warning fixture first.");
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
      viewport: { width: 590, height: 641 },
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
    await page.waitForFunction(() => window.__inGameWarningReady);
    await page.waitForTimeout(200);

    // Scroll to the end and report where the last row sits against the warning.
    const measure = () =>
      page.evaluate(() => {
        const wrapper = document.querySelector(".site-wrapper");
        wrapper.scrollTop = wrapper.scrollHeight;
        const last = document.querySelector('[data-testid="last"]');
        const warning = document.querySelector(".MuiSnackbar-root");
        const r = last.getBoundingClientRect();
        const box = (b) => ({ top: Math.round(b.top), bottom: Math.round(b.bottom), height: Math.round(b.height) });
        const out = { last: box(r), spacer: null, warning: null };
        const spacer = last.nextElementSibling;
        if (spacer && spacer.getAttribute("aria-hidden") === "true")
          out.spacer = Math.round(spacer.getBoundingClientRect().height);
        if (warning) {
          const w = warning.getBoundingClientRect();
          out.warning = box(w);
          out.overlap = r.bottom > w.top && r.top < w.bottom;
        }
        const next = [...last.querySelectorAll("button")].pop();
        const n = next.getBoundingClientRect();
        const hit = document.elementFromPoint(n.left + n.width / 2, n.top + n.height / 2);
        out.lastClickable = !!hit && next.contains(hit);
        return out;
      });
    const show = async (value) => {
      await page.evaluate((v) => window.__setInGame(v), value);
      await page.waitForTimeout(500);
    };

    const none = await measure();
    check(!none.warning && !none.spacer && none.lastClickable, "no game: no warning, no space", none);

    await show("game1");
    const shown = await measure();
    check(
      shown.warning && shown.spacer === shown.warning.height && !shown.overlap && shown.lastClickable,
      "590x641 warning shown: last row clear and clickable",
      shown,
    );

    await page.keyboard.press("Tab");
    let focused = false;
    for (let i = 0; i < 80 && !focused; i++) {
      focused = await page.evaluate(() => document.activeElement?.textContent === "Next page");
      if (!focused) await page.keyboard.press("Tab");
    }
    const focus = focused
      ? await page.evaluate(() => {
          const el = document.activeElement;
          const r = el.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return { top: Math.round(r.top), bottom: Math.round(r.bottom), visible: !!hit && el.contains(hit) };
        })
      : null;
    check(focused && focus.visible, "keyboard: focused last row not under the warning", focus);

    await show(null);
    const hidden = await measure();
    check(!hidden.warning && !hidden.spacer, "warning hidden: space removed", hidden);

    await show("game2");
    const again = await measure();
    check(
      again.spacer === again.warning?.height && !again.overlap && again.lastClickable,
      "warning shown again: last row clear",
      again,
    );

    await page.evaluate(() => (document.documentElement.style.fontSize = "24px"));
    await page.waitForTimeout(400);
    const big = await measure();
    check(
      big.spacer === big.warning?.height && big.warning.height > again.warning.height && !big.overlap && big.lastClickable,
      "root font 24px: space follows the taller warning",
      big,
    );
    await page.evaluate(() => (document.documentElement.style.fontSize = ""));

    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(400);
    const narrow = await measure();
    check(
      narrow.spacer === narrow.warning?.height && !narrow.overlap && narrow.lastClickable,
      "320x568: last row clear",
      narrow,
    );

    await page.setViewportSize({ width: 1180, height: 641 });
    await page.waitForTimeout(400);
    const desktop = await measure();
    check(!desktop.spacer, "1180x641 desktop: no space added", desktop);

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
