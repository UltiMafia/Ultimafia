// Browser regression: the pregame "Spectate" / "Join open seat" button must be
// on screen in the real game layout at desktop and phone sizes. The game is
// hosted in a fixed, viewport-sized box, so a button rendered outside the
// layout ends up below the screen where it cannot be scrolled to.
//
//   npx rsbuild build --config rsbuild.seat-actions-test.config.ts
//   PLAYWRIGHT_MODULE=/path/to/playwright node test/run-seat-actions.cjs
//
// Uses an isolated Playwright install (PLAYWRIGHT_MODULE; CHROMIUM_PATH is
// optional), serves the build on loopback and blocks every external request.
// SCREENSHOT_DIR, if set, receives a screenshot per viewport and case.
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const VIEWPORTS = [
  { name: "desktop", options: { viewport: { width: 1440, height: 900 } } },
  {
    name: "phone",
    options: {
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    },
  },
];

async function main() {
  if (!process.env.PLAYWRIGHT_MODULE)
    throw new Error(
      "Set PLAYWRIGHT_MODULE to an isolated Playwright installation.",
    );
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(
    process.argv[2] || "/tmp/ultimafia-seat-actions-browser",
  );
  if (!fs.existsSync(path.join(directory, "index.html")))
    throw new Error("Build the seat actions fixture first.");
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
    for (const { name, options } of VIEWPORTS) {
      const vp = options.viewport;
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
      // The Spectate button does a full-page navigation into the game.
      await page.route("**/game/**", (route) =>
        route.fulfill({ contentType: "text/html", body: "<p>spectating</p>" }),
      );
      const open = async (query) => {
        await page.goto(url + "?" + query);
        await page.waitForFunction(() => window.__seatActionsReady);
        await page.waitForTimeout(200);
        if (shots)
          await page.screenshot({
            path: path.join(
              shots,
              `${name}-${query.replace(/[=&]/g, "-")}.png`,
            ),
          });
      };
      // Fully on screen, and the element at its centre is the button itself
      // (not covered by anything).
      const onScreen = (label) =>
        page.evaluate(
          ({ label, w, h }) => {
            const b = [...document.querySelectorAll("button")].find(
              (x) => x.textContent.trim() === label,
            );
            if (!b) return { found: false };
            const r = b.getBoundingClientRect();
            const inside =
              r.width > 0 &&
              r.height > 0 &&
              r.top >= 0 &&
              r.left >= 0 &&
              r.bottom <= h &&
              r.right <= w;
            const hit = inside
              ? document.elementFromPoint(
                  r.left + r.width / 2,
                  r.top + r.height / 2,
                )
              : null;
            return {
              found: true,
              inside,
              topmost: !!hit && b.contains(hit),
              top: Math.round(r.top),
              bottom: Math.round(r.bottom),
            };
          },
          { label, w: vp.width, h: vp.height },
        );
      const count = (label) =>
        page.evaluate(
          (label) =>
            [...document.querySelectorAll("button")].filter(
              (x) => x.textContent.trim() === label,
            ).length,
          label,
        );

      await open("case=seated");
      let r = await onScreen("Spectate");
      check(
        r.found && r.inside && r.topmost,
        `${name}: Spectate on screen when seated`,
        r,
      );
      check((await count("Spectate")) === 1, `${name}: one Spectate button`);
      check(
        (await count("Join open seat")) === 0,
        `${name}: no Join button when seated`,
      );
      await Promise.all([
        page
          .waitForURL("**/game/fixture?spectate=true", { timeout: 5000 })
          .catch(() => {}),
        page.getByRole("button", { name: "Spectate" }).click(),
      ]);
      check(
        page.url().endsWith("/game/fixture?spectate=true"),
        `${name}: Spectate reloads into the game as a spectator`,
        page.url(),
      );

      await open("case=spectator");
      r = await onScreen("Join open seat");
      check(
        r.found && r.inside && r.topmost,
        `${name}: Join open seat on screen when spectating`,
        r,
      );
      check(
        (await count("Spectate")) === 0,
        `${name}: no Spectate button when spectating`,
      );
      await page.getByRole("button", { name: "Join open seat" }).click();
      const sent = await page.evaluate(() => window.__sent);
      check(
        sent.length === 1 && sent[0][0] === "takeSeat",
        `${name}: Join open seat sends takeSeat`,
        sent,
      );

      for (const c of ["started", "review", "nospectating"]) {
        await open("case=" + c);
        const n = (await count("Spectate")) + (await count("Join open seat"));
        check(n === 0, `${name}: no seat button (${c})`, { n });
      }

      if (name === "desktop") {
        // The old desktop placement, after the game Stack: must be caught.
        await open("case=seated&legacy=1");
        r = await onScreen("Spectate");
        check(
          r.found && !r.inside,
          `${name}: old placement is off screen (check is meaningful)`,
          r,
        );
      }

      check(errors.length === 0, `${name}: no page errors`, errors);
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }
  for (const p of passes) console.log("ok   " + p);
  for (const f of failures) console.log("FAIL " + f);
  console.log(`${passes.length} passed, ${failures.length} failed`);
  if (failures.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
