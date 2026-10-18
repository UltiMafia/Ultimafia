// Browser regression: the chat emote picker must open on screen the FIRST
// time, when its lazily loaded emoji picker is not downloaded yet, and stay
// attached to the button when its content changes size.
//
//   npx rsbuild build --config rsbuild.emote-picker-test.config.ts
//   PLAYWRIGHT_MODULE=/path/to/playwright node test/run-emote-picker.cjs
//
// Uses an isolated Playwright install (PLAYWRIGHT_MODULE; CHROMIUM_PATH is
// optional), serves the build on loopback and blocks every external request.
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const VIEWPORTS = [
  { name: "desktop", options: { viewport: { width: 1280, height: 800 } } },
  {
    name: "phone",
    options: {
      viewport: { width: 412, height: 839 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    },
  },
];

async function popoverRect(page) {
  return page.evaluate(() => {
    const el = document.querySelector(".MuiPopover-paper");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      left: Math.round(r.left),
      right: Math.round(r.right),
    };
  });
}

async function settle(page) {
  // Two animation frames plus a little time for ResizeObserver callbacks.
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      )
  );
  await page.waitForTimeout(300);
}

async function main() {
  if (!process.env.PLAYWRIGHT_MODULE)
    throw new Error(
      "Set PLAYWRIGHT_MODULE to an isolated Playwright installation."
    );
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(
    process.argv[2] || "/tmp/ultimafia-emote-picker-browser"
  );
  if (!fs.existsSync(path.join(directory, "index.html")))
    throw new Error("Build the emote picker fixture first.");
  const shots = process.env.SCREENSHOT_DIR;
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
      new URL(req.url, "http://localhost").pathname
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
      `${name}${detail ? " " + JSON.stringify(detail) : ""}`
    );
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.CHROMIUM_PATH
        ? { executablePath: process.env.CHROMIUM_PATH }
        : {}),
    });
    for (const { name, options } of VIEWPORTS) {
      const context = await browser.newContext(options);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.route("**/*", (route) => {
        const u = new URL(route.request().url());
        if (u.protocol === "data:" || u.hostname === "127.0.0.1")
          return route.continue();
        errors.push("blocked external request " + u.origin);
        return route.abort();
      });
      await page.goto(url);
      await page.waitForFunction(() => window.__emotePickerReady);
      const vp = options.viewport;
      const inside = (r) =>
        !!r &&
        r.top >= 0 &&
        r.left >= 0 &&
        r.bottom <= vp.height &&
        r.right <= vp.width;
      const button = page.locator("button:has(img[alt='Emotes'])");
      const buttonTop = async () => Math.round((await button.boundingBox()).y);

      for (const open of [1, 2]) {
        await button.click();
        await page.locator(".EmojiPickerReact").waitFor({ timeout: 15000 });
        await settle(page);
        const r = await popoverRect(page);
        check(
          inside(r),
          `${name}: open ${open} is inside the ${vp.width}x${vp.height} viewport`,
          r
        );
        check(
          r && Math.abs(r.bottom - (await buttonTop())) <= 24,
          `${name}: open ${open} sits just above the emote button`,
          { bottom: r && r.bottom, buttonTop: await buttonTop() }
        );
        if (shots)
          await page.screenshot({
            path: path.join(shots, `${name}-open${open}.png`),
          });
        if (open === 2) {
          await page.getByRole("button", { name: /Stickers/ }).click();
          await settle(page);
          const s = await popoverRect(page);
          check(
            inside(s) && Math.abs(s.bottom - (await buttonTop())) <= 24,
            `${name}: stickers tab stays above the emote button`,
            s
          );
          if (shots)
            await page.screenshot({
              path: path.join(shots, `${name}-stickers.png`),
            });
        }
        await page.keyboard.press("Escape");
        await page.locator(".MuiPopover-paper").waitFor({ state: "detached" });
      }
      check(
        errors.length === 0,
        `${name}: no page errors or external requests`,
        errors.length ? errors : undefined
      );
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
  for (const p of passes) console.log("PASS " + p);
  for (const f of failures) console.log("FAIL " + f);
  console.log(
    failures.length
      ? `\n${failures.length} FAILED, ${passes.length} passed`
      : `\nALL PASS (${passes.length})`
  );
  if (failures.length) process.exitCode = 1;
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
