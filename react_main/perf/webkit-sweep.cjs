// Measures the name-colour sweep's cost in WebKit, which is where it bites:
// Chromium runs this transcript at 55-60 fps either way, so a Chromium number
// says nothing about the iOS report this change addresses.
//
//   npx rsbuild build --config rsbuild.chat-perf.config.ts
//   PLAYWRIGHT_MODULE=/path/to/playwright \
//   PLAYWRIGHT_BROWSERS_PATH=/path/to/browsers \
//   node perf/webkit-sweep.cjs build-chat-perf
//
// Each configuration gets a fresh browser context, because several
// configurations measured on one page load report mostly cache warming: the same
// region scrolled repeatedly goes 8 fps -> 24 -> 60 as WebKit paints it.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { webkit } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const root = path.resolve(process.argv[2] || "build-chat-perf");
const PORT = Number(process.env.PORT || 3110);
const ROWS = Number(process.env.ROWS || 2214);
const BUDGET = Number(process.env.BUDGET || 2000);
const START_TOP = 1200;

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
};

const server = http
  .createServer((req, res) => {
    let file = path.resolve(root, "." + decodeURIComponent(req.url.split("?")[0]));
    if (!file.startsWith(root)) return res.writeHead(403).end();
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, "index.html");
    if (!fs.existsSync(file)) file = path.join(root, "index.html");
    fs.readFile(file, (err, buf) => {
      if (err) return res.writeHead(404).end("not found");
      res.writeHead(200, {
        "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(buf);
    });
  })
  .listen(PORT, "127.0.0.1");

const MEASURE = ({ startTop, budget }) =>
  new Promise((resolve) => {
    const d = document.querySelector(".speech-display");
    d.scrollTop = startTop;
    requestAnimationFrame(() => {
      const t0 = performance.now();
      const deltas = [];
      let last = 0;
      const step = () => {
        if (last) deltas.push(performance.now() - last);
        last = performance.now();
        d.scrollTop -= 10;
        if (performance.now() - t0 < budget) requestAnimationFrame(step);
        else {
          const s = deltas.slice().sort((a, b) => a - b);
          resolve({
            frames: s.length,
            fps: +(s.length / ((performance.now() - t0) / 1000)).toFixed(2),
            p50: s.length ? +s[Math.floor(s.length * 0.5)].toFixed(1) : null,
          });
        }
      };
      requestAnimationFrame(step);
    });
  });

// "suspended" sets the same attribute the transcript sets on iOS, so the
// measurement exercises the shipped rule rather than a hand-written override.
const CASES = [
  { id: "sweeping", label: "sweep running (attribute absent)", attr: null },
  { id: "suspended", label: 'sweep suspended (data-name-sweep="off")', attr: "off" },
];

(async () => {
  const browser = await webkit.launch();
  const rows = [];
  for (const test of CASES) {
    const runs = [];
    for (let i = 0; i < 3; i++) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      });
      const page = await context.newPage();
      await page.goto(
        `http://127.0.0.1:${PORT}/?count=${ROWS}&nameplates=${Math.floor(ROWS * 0.78)}&cosmetic=mixed`,
        { waitUntil: "load", timeout: 180000 }
      );
      await page.waitForFunction(
        (n) => document.querySelectorAll(".speech-display .message").length >= n,
        Math.min(ROWS, 50),
        { timeout: 180000 }
      );
      await page.waitForTimeout(1500);
      if (test.attr) {
        await page.evaluate(
          (value) => document.querySelector(".speech-display").setAttribute("data-name-sweep", value),
          test.attr
        );
        await page.waitForTimeout(250);
      }
      runs.push(await page.evaluate(MEASURE, { startTop: START_TOP, budget: BUDGET }));
      await context.close();
    }
    const median = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];
    const fps = median(runs.map((r) => r.fps));
    rows.push({ ...test, fps, p50: median(runs.map((r) => r.p50)) });
    console.log(
      `${String(fps).padStart(6)} fps  p50 ${String(median(runs.map((r) => r.p50))).padStart(6)} ms  ${test.label}`
    );
  }
  console.log("\nengine:", await browser.version());
  console.log(`transcript: ${ROWS} rows, 390x844, WebKit, median of 3 cold contexts`);
  await browser.close();
  server.close();
})().catch((e) => {
  console.error("FAILED:", String(e).slice(0, 600));
  server.close();
  process.exit(1);
});
