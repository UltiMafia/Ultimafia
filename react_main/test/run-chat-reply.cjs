// Browser regression: the chat reply button and reply rows, with the real
// stylesheets and Font Awesome.
//
//   npx rsbuild build --config rsbuild.chat-reply-test.config.ts
//   PLAYWRIGHT_MODULE=/path/to/playwright node test/run-chat-reply.cjs
//
// For every row in each message layout it hovers the row and checks that:
// the pin sits exactly where it does without the reply feature (top-right),
// the reply button sits below it (bottom-right) with a clear gap, both stay
// inside their own row and can be clicked there, and hovering does not change
// any row's height. Reply rows must show the reply arrow. SCREENSHOT_DIR, if
// set, receives a screenshot per layout.
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const LAYOUTS = ["default", "compact", "compactInline", "compactAligned"];
const MIN_GAP = 3;

async function main() {
  if (!process.env.PLAYWRIGHT_MODULE)
    throw new Error(
      "Set PLAYWRIGHT_MODULE to an isolated Playwright installation.",
    );
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(
    process.argv[2] || "/tmp/ultimafia-chat-reply-browser",
  );
  if (!fs.existsSync(path.join(directory, "index.html")))
    throw new Error("Build the chat reply fixture first.");
  const shots = process.env.SCREENSHOT_DIR;
  const mime = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
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
  try {
    const page = await browser.newPage({
      viewport: { width: 700, height: 900 },
    });
    page.on("pageerror", (e) => failures.push("page error: " + e.message));
    await page.route("**/*", (route) =>
      route.request().url().startsWith(url) ? route.continue() : route.abort(),
    );

    // Pin box per row, hovered, with the reply feature off.
    async function hoverRows(query) {
      await page.goto(url + "?" + query);
      await page.waitForFunction(() => window.__ready, null, {
        timeout: 15000,
      });
      await page.evaluate(() => document.fonts.ready);
      const heights = () =>
        page.evaluate(() =>
          [...document.querySelectorAll(".game .message")].map(
            (m) => m.getBoundingClientRect().height,
          ),
        );
      const before = await heights();
      const rows = [];
      for (let i = 0; i < before.length; i++) {
        const row = (await page.$$(".game .message"))[i];
        await row.scrollIntoViewIfNeeded();
        await row.hover();
        rows.push(
          await page.evaluate((i) => {
            const m = document.querySelectorAll(".game .message")[i];
            const box = (e) => {
              if (!e) return null;
              const r = e.getBoundingClientRect();
              return { x: r.x, y: r.y, w: r.width, h: r.height };
            };
            const hit = (e) => {
              if (!e) return null;
              const r = e.getBoundingClientRect();
              const at = document.elementFromPoint(
                r.x + r.width / 2,
                r.y + r.height / 2,
              );
              return !!at && (at === e || e.contains(at));
            };
            const pin = m.querySelector(".pin-button-wrapper .fa-thumbtack");
            const reply = m.querySelector(".reply-button");
            const offset = (b) =>
              b && {
                ...b,
                x: b.x - m.getBoundingClientRect().x,
                y: b.y - m.getBoundingClientRect().y,
              };
            return {
              text: m.innerText.replace(/\s+/g, " ").trim().slice(0, 40),
              merged: m.classList.contains("reply-merged"),
              fallback: m.classList.contains("reply-message"),
              arrowBeforePreview: !!m.querySelector(
                ".reply-quote-preview > .reply-marker:first-child + .quote-info",
              ),
              arrow: !!m.querySelector(".reply-marker"),
              row: box(m),
              pin: box(pin),
              pinInRow: offset(box(pin)),
              reply: box(reply),
              pinHit: pin ? hit(pin.parentElement) : null,
              replyHit: hit(reply),
            };
          }, i),
        );
      }
      const after = await heights();
      return { rows, before, after };
    }

    for (const layout of LAYOUTS) {
      for (const st of [1, -1]) {
        const query = `layout=${layout}&st=${st}`;
        const off = await hoverRows(query + "&noreply=1");
        const on = await hoverRows(query);
        check(
          on.before.every((h, i) => Math.abs(h - on.after[i]) < 0.01),
          `${query}: hovering changes no row height`,
        );
        check(
          on.rows.length === off.rows.length,
          `${query}: same rows with and without replies`,
        );
        on.rows.forEach((r, i) => {
          const name = `${query} row ${i} (${r.text})`;
          const o = off.rows[i];
          // The pin shows on the same rows and in the same place in its row
          // as without the reply feature.
          check(!!r.pin === !!o.pin, `${name}: pin shown as without replies`);
          if (r.pin && o.pin) {
            check(
              Math.abs(r.pinInRow.x - o.pinInRow.x) < 0.5 &&
                Math.abs(r.pinInRow.y - o.pinInRow.y) < 0.5 &&
                r.pin.w === o.pin.w &&
                r.pin.h === o.pin.h,
              `${name}: pin at the top-right as without replies`,
            );
            check(r.pinHit, `${name}: pin clickable`);
          }
          if (r.merged)
            check(r.arrowBeforePreview, `${name}: arrow before the preview`);
          if (r.fallback) check(r.arrow, `${name}: reply arrow`);
          for (const k of ["pin", "reply"]) {
            const b = r[k];
            if (!b) continue;
            check(
              b.y >= r.row.y - 0.5 &&
                b.y + b.h <= r.row.y + r.row.h + 0.5 &&
                b.x + b.w <= r.row.x + r.row.w + 0.5,
              `${name}: ${k} inside its row`,
            );
          }
          if (r.reply) {
            check(r.replyHit, `${name}: reply clickable`);
            check(
              Math.abs(r.reply.y + r.reply.h - (r.row.y + r.row.h)) < 1.5,
              `${name}: reply at the bottom of the row`,
            );
          }
          if (r.pin && r.reply)
            check(
              r.reply.y - (r.pin.y + r.pin.h) >= MIN_GAP &&
                Math.abs(r.reply.x + r.reply.w / 2 - (r.pin.x + r.pin.w / 2)) <
                  1,
              `${name}: reply under the pin with a ${MIN_GAP}px gap`,
            );
        });
        check(
          on.rows.some((r) => r.reply),
          `${query}: some row offers a reply`,
        );
        if (st === 1)
          check(
            on.rows.some((r) => r.pin && r.reply),
            `${query}: some row shows pin and reply`,
          );
        if (shots) {
          fs.mkdirSync(shots, { recursive: true });
          await page.screenshot({
            path: path.join(shots, `${layout}_st${st}.png`),
          });
        }
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`${passes} checks passed`);
  if (failures.length) {
    for (const f of failures) console.log("FAIL " + f);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
