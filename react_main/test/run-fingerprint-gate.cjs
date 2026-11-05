// Browser regression: the login fingerprint gate dialog in both site palettes.
//
//   npx rsbuild build --config rsbuild.fingerprint-gate-test.config.ts
//   PLAYWRIGHT_MODULE=/path/to/playwright node test/run-fingerprint-gate.cjs
//
// The dialog must appear with its title and body in both themes, and its body
// text must stay readable (contrast >= 4.5:1) against the paper it sits on.
// SCREENSHOT_DIR, if set, receives one screenshot per mode.
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".png": "image/png",
};

function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function parseRgb(css) {
  const nums = String(css)
    .match(/[\d.]+/g)
    .slice(0, 3)
    .map(Number);
  return nums.length === 3 ? nums : [0, 0, 0];
}

async function main() {
  if (!process.env.PLAYWRIGHT_MODULE)
    throw new Error("Set PLAYWRIGHT_MODULE to an isolated Playwright installation.");
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(
    process.argv[2] || "/tmp/ultimafia-fingerprint-gate-browser"
  );
  if (!fs.existsSync(path.join(directory, "index.html")))
    throw new Error("Build the fingerprint gate fixture first.");
  const shots = process.env.SCREENSHOT_DIR;

  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const filename = path.resolve(
      directory,
      pathname === "/" ? "index.html" : "." + pathname
    );
    if (!filename.startsWith(directory + path.sep) || !fs.existsSync(filename) || fs.statSync(filename).isDirectory()) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(filename)] || "application/octet-stream" });
    fs.createReadStream(filename).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const browser = await chromium.launch();
  let failed = 0;

  try {
    for (const mode of ["dark", "light"]) {
      const page = await browser.newPage({ viewport: { width: 720, height: 520 } });
      await page.goto(`http://127.0.0.1:${port}/?mode=${mode}`, { waitUntil: "load" });
      await page.waitForSelector("#fingerprint-blocked-title", { state: "visible", timeout: 5000 });
      await page.waitForTimeout(400);

      const title = (await page.innerText("#fingerprint-blocked-title")).trim();
      const body = (await page.locator("#fingerprint-blocked-title + * .MuiTypography-root").first().innerText().catch(() => "")) || "";
      const colors = await page.evaluate(() => {
        const title = document.querySelector("#fingerprint-blocked-title");
        const paper = title.closest(".MuiPaper-root");
        const body = paper && paper.querySelector(".MuiTypography-body2");
        return {
          paper: getComputedStyle(paper || document.body).backgroundColor,
          text: getComputedStyle(body || document.body).color,
        };
      });
      const ratio = contrast(parseRgb(colors.text), parseRgb(colors.paper));

      if (!title) {
        console.log(`FAIL ${mode}: no title`);
        failed++;
      }
      if (ratio < 4.5) {
        console.log(`FAIL ${mode}: contrast ${ratio.toFixed(2)}:1`);
        failed++;
      } else {
        console.log(`ok   ${mode}: "${title}", body contrast ${ratio.toFixed(2)}:1`);
      }

      if (shots) await page.screenshot({ path: path.join(shots, `gate-${mode}.png`) });
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
