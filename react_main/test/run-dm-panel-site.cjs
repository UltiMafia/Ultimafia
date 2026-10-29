// Browser regression for the admins' "Ban Appeals" conversation in the
// floating DM window: it is listed and titled "Ban Appeals" (not by the other
// admin's name) with the site icon, next to the 1:1 the same admins share,
// and its messages show the "Ban Appeals" sender name with the site icon.
//
//   npx rsbuild build --config rsbuild.dm-panel-site-test.config.ts
//   PLAYWRIGHT_MODULE=/path/to/playwright node test/run-dm-panel-site.cjs
//
// Uses an isolated Playwright install (PLAYWRIGHT_MODULE; CHROMIUM_PATH is
// optional), serves the build and public/ on loopback and blocks every other
// request. SCREENSHOT_DIR saves screenshots.
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

async function main() {
  if (!process.env.PLAYWRIGHT_MODULE)
    throw new Error("Set PLAYWRIGHT_MODULE to an isolated Playwright installation.");
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(process.argv[2] || "/tmp/ultimafia-dm-panel-site-browser");
  const publicDir = path.resolve(__dirname, "../public");
  if (!fs.existsSync(path.join(directory, "index.html")))
    throw new Error("Build the DM panel fixture first.");
  const shots = process.env.SCREENSHOT_DIR;
  const mime = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".png": "image/png", ".woff2": "font/woff2" };
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let filename = path.resolve(directory, "." + pathname);
    if (!fs.existsSync(filename) || fs.statSync(filename).isDirectory()) {
      const fromPublic = path.resolve(publicDir, "." + pathname);
      if (fromPublic.startsWith(publicDir + path.sep) && fs.existsSync(fromPublic) && !fs.statSync(fromPublic).isDirectory())
        filename = fromPublic;
      else if (path.extname(pathname)) {
        res.writeHead(404);
        return res.end();
      } else filename = path.join(directory, "index.html");
    } else if (!filename.startsWith(directory + path.sep)) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { "Content-Type": mime[path.extname(filename)] || "application/octet-stream" });
    fs.createReadStream(filename).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let passed = 0;
  let failed = 0;
  const check = (ok, name, detail) => {
    if (ok) passed++;
    else failed++;
    console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail === undefined ? "" : " " + JSON.stringify(detail)}`);
  };
  const errors = [];
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 440, height: 620 } });
    page.on("pageerror", (e) => errors.push("page error: " + e.message));
    await page.route("**/*", (route) => {
      if (route.request().url().startsWith(origin) || route.request().url().startsWith("data:")) return route.continue();
      errors.push("blocked external request " + route.request().url());
      return route.abort();
    });

    await page.goto(`${origin}/?view=list`);
    await page.waitForFunction(() => window.__ready, null, { timeout: 15000 });
    const rows = page.getByTestId("dm-row");
    await rows.first().waitFor({ timeout: 8000 });
    const texts = await rows.allInnerTexts();
    check(texts.length === 2, "lists the Ban Appeals conversation and the 1:1 separately", texts);
    check(texts[0].startsWith("Ban Appeals"), "the appeals conversation is titled Ban Appeals", texts[0]);
    check(texts[1].startsWith("Pranay"), "the 1:1 keeps the other admin's name", texts[1]);
    const listIcon = await rows.first().locator("img").first().getAttribute("src").catch(() => null);
    check(listIcon && listIcon.endsWith("/images/icon-192.png"), "the appeals conversation shows the site icon", listIcon);
    if (shots) await page.screenshot({ path: path.join(shots, "LOCAL-dm-window-list.png") });

    await rows.first().click();
    await page.getByTestId("dm-messages").waitFor({ timeout: 8000 });
    const title = await page.getByTestId("dm-conversation-title").innerText();
    check(title === "Ban Appeals", "the open conversation is titled Ban Appeals", title);
    const body = await page.getByTestId("dm-messages").innerText();
    check(body.includes("Ban Appeals") && body.includes("BAN-APPEAL: X"), "messages show the Ban Appeals sender name", body);
    const senderIcon = await page.getByTestId("dm-messages").locator("img").first().getAttribute("src").catch(() => null);
    check(senderIcon && senderIcon.endsWith("/images/icon-192.png"), "the sender shows the site icon, not a blank avatar", senderIcon);
    const loaded = await page.evaluate(() => [...document.querySelectorAll("img")].every((img) => img.complete && img.naturalWidth > 0));
    check(loaded, "the site icon loads");
    if (shots) await page.screenshot({ path: path.join(shots, "LOCAL-dm-window-ban-appeals.png") });
    check(errors.length === 0, "no page errors or external requests", errors);
  } finally {
    await browser.close();
    server.close();
  }
  console.log(`${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
