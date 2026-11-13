// A name whose webfont arrives after it painted changes its line box and pushes
// every message below it down - the "spaces between messages grew" report. The
// app warms those faces before a transcript renders (src/utils/fontWarmup.js);
// this test pins the underlying fact in both engines, on the shipped stylesheet:
//
//   1. painted before the face is available, the name line grows when it lands
//   2. loaded first, the name line is the same height before and after
//
// If (1) ever stops being true the warm-up is unnecessary and can go; if (2)
// fails the warm-up does not actually work.
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const pw = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const BUILD = process.argv[2] || "build-chat-perf";
const ROOT = path.resolve(__dirname, "..", BUILD);

const TYPES = {
  ".css": "text/css",
  ".js": "application/javascript",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function stylesheetHref() {
  const dir = path.join(ROOT, "static/css");
  const name = fs.readdirSync(dir).find((entry) => entry.endsWith(".css"));
  if (!name) throw new Error(`no stylesheet in ${dir}`);
  return `/static/css/${name}`;
}

function harness() {
  return `<!doctype html>
<html class="theme-dark"><head><meta charset="utf-8">
<link rel="stylesheet" href="${stylesheetHref()}">
<style>body{margin:0;background:#14161a}.game{width:420px;padding:12px}</style>
</head><body><div class="game"><div id="host"></div></div>
<script>
  window.render = (font) => {
    document.getElementById('host').innerHTML =
      '<div class="message"><div class="nameplate-aligned"><div class="name-with-avatar">' +
      '<span class="user-name name-font-' + font + '"><span class="user-name-text">Somebody</span></span>' +
      '</div></div></div>';
  };
  window.nameHeight = () => {
    const name = document.querySelector('.user-name');
    return name ? +name.getBoundingClientRect().height.toFixed(2) : null;
  };
  window.loadNameFont = (family) => document.fonts.load('bold 16px "' + family + '"').then(() => true);
</script></body></html>`;
}

function serve() {
  const page = harness();
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    if (url === "/" || url === "/harness.html") {
      res.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-store" });
      return res.end(page);
    }
    const file = path.join(ROOT, url);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404);
      return res.end("not found");
    }
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    return fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

async function settle(page) {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

(async () => {
  const { server, port } = await serve();
  const base = `http://127.0.0.1:${port}`;
  let failures = 0;
  const report = (name, ok, detail) => {
    console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
    if (!ok) failures += 1;
  };

  for (const [label, engine] of [
    ["chromium", pw.chromium],
    ["webkit", pw.webkit],
  ]) {
    // 1. Paint a Poppins name while its file is held back, then release it.
    //    Poppins is the widest departure from the fallback in this font set, so
    //    the line-height change is not masked by similar fallback metrics.
    const browser = await engine.launch();
    const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    await page.route("**/static/font/poppins*.ttf", async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto(`${base}/harness.html`, { waitUntil: "load" });
    await page.evaluate(() => window.render("poppins"));
    await page.waitForTimeout(150);
    const painted = await page.evaluate(() => window.nameHeight());
    release();
    await page.evaluate(() => document.fonts.ready);
    await settle(page);
    const settled = await page.evaluate(() => window.nameHeight());
    report(
      `${label}: a late face changes the name line`,
      painted !== null && settled !== null && Math.abs(settled - painted) > 0.4,
      `${painted} -> ${settled}px`
    );
    await browser.close();

    // 2. Load the face first, the way the game does before it renders rows.
    const browser2 = await engine.launch();
    const page2 = await browser2.newPage({ viewport: { width: 900, height: 600 } });
    await page2.goto(`${base}/harness.html`, { waitUntil: "load" });
    const loaded = await page2.evaluate(() => window.loadNameFont("Poppins"));
    await page2.evaluate(() => window.render("poppins"));
    await page2.waitForTimeout(150);
    const preHeight = await page2.evaluate(() => window.nameHeight());
    await settle(page2);
    const postHeight = await page2.evaluate(() => window.nameHeight());
    report(
      `${label}: a warmed face leaves the line stable`,
      loaded === true && preHeight !== null && preHeight === postHeight,
      `${preHeight} -> ${postHeight}px`
    );
    await browser2.close();
  }

  server.close();
  console.log(failures ? `failureCount ${failures}` : "failureCount 0");
  process.exit(failures ? 1 : 0);
})();
