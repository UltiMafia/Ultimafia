const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const playwright = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const bundle = "/tmp/ultimafia-miniprofile-winrates";
const site = path.resolve(__dirname, "..");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  let file = path.join(bundle, pathname === "/" ? "index.html" : pathname);
  if (["/css/main.css", "/css/user.css"].includes(pathname)) file = path.join(site, "src", pathname);
  if (/^\/(css\/fontawesome\.min\.css|webfonts\/[\w.-]+\.woff2)$/.test(pathname)) file = path.join(site, "public", pathname);
  const stream = fs.createReadStream(file);
  stream.on("open", () => res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream"));
  stream.on("error", () => res.writeHead(404).end());
  stream.pipe(res);
});

async function run() {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const browser = await playwright.chromium.launch();
  const errors = [];
  async function open(query = "", width = 1000) {
    const page = await browser.newPage({ viewport: { width, height: 840 }, deviceScaleFactor: 2 });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${url}/?${query}`);
    await page.locator(".miniprofile").waitFor();
    return page;
  }
  const control = (page) => page.getByRole("button", { name: "Town / Mafia win rates", exact: true });
  try {
    const desktop = await open();
    const trigger = control(desktop);
    assert.equal(await trigger.count(), 1, "Use one stable disclosure label, not a show/hide action button");
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    assert.equal(await desktop.getByText("36.7%", { exact: true }).count(), 0);
    const card = await desktop.locator(".miniprofile").boundingBox();
    const toggle = await trigger.boundingBox();
    assert.ok(toggle.x >= card.x + 8 && toggle.x + toggle.width <= card.x + card.width - 8, "Inset the disclosure on both sides");
    await trigger.focus();
    await desktop.keyboard.press("Enter");
    assert.equal(await trigger.getAttribute("aria-expanded"), "true");
    const expandedCard = await desktop.locator(".miniprofile").boundingBox();
    assert.ok(Math.abs(expandedCard.width - card.width) <= 1, "Opening the disclosure should not resize the popout horizontally");
    for (const text of ["36.7%", "48.6%", "101 wins / 275 games", "69 wins / 142 games"]) {
      assert.ok(await desktop.getByText(text, { exact: true }).isVisible(), text);
    }
    await desktop.getByRole("button", { name: /Toggle Town and Mafia win rates/ }).click();
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    await trigger.click();
    if (process.env.SCREENSHOT_DIR) {
      const dir = process.env.SCREENSHOT_DIR;
      fs.mkdirSync(dir, { recursive: true });
      await desktop.locator(".miniprofile").screenshot({ path: path.join(dir, "miniprofile-win-rates.png") });
    }
    await desktop.evaluate(() => window.switchProfile());
    await desktop.getByText("AnotherPlayer").waitFor();
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    await desktop.close();
    console.log("PASS: inset, keyboard and pie toggle, unchanged stats, identity reset");

    const narrow = await open("theme=dark&stats=missing", 320);
    await control(narrow).click();
    assert.ok(await narrow.getByText("No recorded games", { exact: true }).isVisible());
    assert.ok(await narrow.locator(".miniprofile").evaluate((el) => el.scrollWidth <= el.clientWidth));
    await narrow.close();
    console.log("PASS: narrow dark-theme layout and missing alignment");

    for (const stats of ["private", "empty"]) {
      const page = await open(`stats=${stats}`);
      assert.equal(await page.getByRole("button", { name: /Town.*Mafia win rates/ }).count(), 0);
      await page.close();
    }
    assert.deepEqual(errors, []);
    console.log("PASS: no disclosure for private or empty stats, no browser errors");
  } finally {
    await browser.close();
  }
}

run().catch((err) => { console.error(err); process.exitCode = 1; }).finally(() => server.close());
