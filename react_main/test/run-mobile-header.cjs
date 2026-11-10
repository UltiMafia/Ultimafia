// Browser regression for the phone top bar: with the DM button, hearts and
// avatar, every header item must stay inside the viewport at phone widths.
//
//   npx rsbuild build --config rsbuild.mobile-header-test.config.ts
//   PLAYWRIGHT_MODULE=/path/to/playwright node test/run-mobile-header.cjs
//
// Uses an isolated Playwright install (PLAYWRIGHT_MODULE; CHROMIUM_PATH is
// optional), serves the build and public/ on loopback and blocks every other
// request. SCREENSHOT_DIR saves screenshots.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

async function main() {
  assert.ok(process.env.PLAYWRIGHT_MODULE, "Set PLAYWRIGHT_MODULE");
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(
    process.argv[2] || "/tmp/ultimafia-mobile-header-browser",
  );
  const publicDir = path.resolve(__dirname, "../public");
  if (!fs.existsSync(path.join(directory, "index.html")))
    throw new Error("Build the mobile header fixture first.");

  const shots = process.env.SCREENSHOT_DIR;
  const mime = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
  };
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let filename = path.resolve(directory, "." + pathname);
    if (!fs.existsSync(filename) || fs.statSync(filename).isDirectory()) {
      const fromPublic = path.resolve(publicDir, "." + pathname);
      if (
        fromPublic.startsWith(publicDir + path.sep) &&
        fs.existsSync(fromPublic) &&
        !fs.statSync(fromPublic).isDirectory()
      ) {
        filename = fromPublic;
      } else if (path.extname(pathname)) {
        res.writeHead(404);
        return res.end();
      } else filename = path.join(directory, "index.html");
    } else if (!filename.startsWith(directory + path.sep)) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, {
      "Content-Type": mime[path.extname(filename)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(filename).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;

  let passed = 0;
  let failed = 0;
  const check = (ok, name, detail) => {
    if (ok) passed++;
    else failed++;
    console.log(`${ok ? "ok" : "not ok"} - ${name}${detail ? `: ${detail}` : ""}`);
  };

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.CHROMIUM_PATH
        ? { executablePath: process.env.CHROMIUM_PATH }
        : {}),
    });
    for (const width of [414, 390, 375, 360, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.route("**/*", (route) => {
        const requestUrl = new URL(route.request().url());
        return requestUrl.origin === new URL(url).origin
          ? route.continue()
          : route.abort();
      });
      await page.goto(url);
      await page.waitForFunction(() => window.__ready);

      const layout = await page.evaluate(() => {
        const header = document.querySelector("header");
        const row = header.querySelector(":scope > .MuiStack-root");
        const logo = header.querySelector('img[alt="Site logo"]');
        const dm = header.querySelector('[data-testid="dm-button"]');
        const avatar = header.querySelector(".avatar");
        const rect = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { left: r.left, right: r.right, width: r.width };
        };
        return {
          viewport: document.documentElement.clientWidth,
          row: rect(row),
          logo: rect(logo),
          dm: rect(dm),
          avatar: rect(avatar),
        };
      });

      const label = `${width}px`;
      check(layout.row.width <= layout.viewport + 0.5, `${label}: row fits viewport`, `${layout.row.width} <= ${layout.viewport}`);
      check(layout.avatar !== null, `${label}: avatar is rendered`);
      if (layout.avatar) {
        check(
          layout.avatar.right <= layout.viewport + 0.5,
          `${label}: avatar inside viewport`,
          `right ${layout.avatar.right} <= ${layout.viewport}`,
        );
      }
      if (layout.logo) {
        check(layout.logo.width > 0, `${label}: logo keeps visible width`, `${layout.logo.width}px`);
      }
      check(errors.length === 0, `${label}: no page errors`, errors.join("; "));
      if (shots) {
        fs.mkdirSync(shots, { recursive: true });
        await page.screenshot({ path: path.join(shots, `header-${width}.png`) });
      }
      await page.close();
    }
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
