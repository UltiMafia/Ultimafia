// Controlled production-component artwork trial. No services or account actions.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const crypto = require("node:crypto");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const directory = "/tmp/opencode/ultimafia-redesign-browser";
const publicDir = path.resolve(__dirname, "../public");
const output = process.env.PIXEL_ICON_OUTPUT_DIR || path.resolve(__dirname, "../../docs/frontend-redesign/pixel-icons/after");
const types = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  let file;
  for (const base of [directory, publicDir]) {
    const candidate = path.resolve(base, "." + pathname);
    if (candidate.startsWith(base + path.sep) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) { file = candidate; break; }
  }
  if (!file && !path.extname(pathname)) file = path.join(directory, "index.html");
  if (!file) { response.writeHead(404); return response.end(); }
  response.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(response);
});

async function main() {
  fs.mkdirSync(output, { recursive: true });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const errors = [];
  const records = [];
  const capture = async (page, name) => {
    await page.mouse.move(0, 0);
    await page.screenshot({ path: path.join(output, name + ".png"), animations: "disabled" });
    records.push({ name, viewport: page.viewportSize() });
  };
  try {
    for (const palette of ["dark", "light"]) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, colorScheme: palette, reducedMotion: "reduce" });
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
      await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      await page.goto(origin + `/?icons=1&theme=${palette}`);
      await page.locator("[data-pixel-icon-example]").last().waitFor();
      const glyphs = await page.locator("[data-pixel-icon-example]").count();
      assert.ok(glyphs >= 60);
      assert.equal(await page.locator("[data-pixel-icon-example] svg.ui-icon").count(), glyphs * 3);
      assert.ok(await page.getByRole("button", { name: "Disabled Send", exact: true }).isDisabled());
      assert.equal((await page.getByRole("button", { name: "Enabled Send", exact: true }).locator("svg").boundingBox()).width, 24, "Primary icon uses the library's native size");
      const selected = await page.getByRole("button", { name: "Selected favorite", exact: true }).evaluate(element => ({ pressed: element.getAttribute("aria-pressed"), border: getComputedStyle(element).borderColor, color: getComputedStyle(element).color }));
      const unselected = await page.getByRole("button", { name: "Unselected favorite", exact: true }).evaluate(element => ({ pressed: element.getAttribute("aria-pressed"), border: getComputedStyle(element).borderColor, color: getComputedStyle(element).color }));
      assert.equal(selected.pressed, "true"); assert.equal(unselected.pressed, "false");
      assert.notEqual(selected.border, unselected.border, "Free-set selection retains a visible border, not just color");
      const metadata = await page.locator("svg.ui-icon").evaluateAll(icons => icons.map(icon => ({
        name: icon.dataset.icon, shapeRendering: getComputedStyle(icon).shapeRendering,
        graphicCount: icon.querySelectorAll("path, polygon, rect, circle").length, viewBox: icon.getAttribute("viewBox"), source: icon.dataset.iconSource,
      })));
      assert.ok(metadata.every(icon => icon.shapeRendering === "crispedges" && icon.graphicCount > 0 && icon.viewBox === "0 0 24 24" && icon.source));
      await capture(page, `icon-sheet-${palette}`);
      await page.setViewportSize({ width: 390, height: 844 });
      await capture(page, `icon-sheet-${palette}-phone-top`);
      await page.locator(".pixel-icon-review").evaluate(element => { element.scrollTop = element.scrollHeight; });
      await capture(page, `icon-sheet-${palette}-phone-bottom`);
      await page.close();
    }
    for (const width of [1440, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: width > 900 ? 1000 : 844 }, reducedMotion: "reduce" });
      page.on("pageerror", error => errors.push(error.message));
      await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      await page.goto(origin + "/play");
      await page.getByText("Classic", { exact: true }).first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      const logo = await page.locator('.site-header img[alt="Site logo"]').evaluate(image => ({ src: image.currentSrc, complete: image.complete, width: image.naturalWidth }));
      assert.ok(logo.complete && logo.width > 0, "The original raster wordmark must be rendered, not replaced with SVG/text");
      const logoUrl = new URL(logo.src);
      const logoAsset = path.resolve(directory, "." + decodeURIComponent(logoUrl.pathname));
      assert.ok(logoAsset.startsWith(directory + path.sep));
      const hash = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
      const originalLogos = fs.readdirSync(path.resolve(__dirname, "../src/images/logos")).filter(file => /^logo-.*\.png$/.test(file));
      assert.ok(originalLogos.some(file => hash(path.resolve(__dirname, "../src/images/logos", file)) === hash(logoAsset)), "Rendered wordmark bytes must match an original seasonal/default asset");
      await capture(page, `lobby-${width}`);
      assert.equal(await page.locator(".site-header i[class*='fa-'], .site-navigation i[class*='fa-'], .lobby-game-card i[class*='fa-']").count(), 0);
      assert.ok(await page.locator(".lobby-game-card .role").count() > 0);
      await page.goto(origin + "/game/fixture?roles=1&dead=1&full=1");
      await page.locator("#speechInput").waitFor();
      if (width <= 900) await page.getByRole("button", { name: "Players", exact: true }).click();
      await capture(page, `roles-and-utilities-${width}`);
      if (width <= 900) await page.getByRole("button", { name: "Chat", exact: true }).click();
      await page.locator("#speechInput").fill("A message ready to send.");
      await capture(page, `game-ready-${width}`);
      assert.equal(await page.locator(".game i[class*='fa-']").count(), 0,
        JSON.stringify(await page.locator(".game i[class*='fa-']").evaluateAll(elements => elements.map(element => element.outerHTML))));
      const send = await page.getByRole("button", { name: "Send message", exact: true }).boundingBox();
      assert.ok(send.width >= 44 && send.height >= 44);
      await page.getByRole("button", { name: "Send message", exact: true }).click();
      await page.waitForFunction(() => document.querySelector("#speechInput").value === "");
      assert.ok(await page.getByRole("button", { name: "Send message", exact: true }).isDisabled());
      await capture(page, `game-empty-${width}`);
      await page.close();
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, "pixel-review.json"), JSON.stringify({ records, errors, originalWordmarkAssetVerified: true, evidence: "Production icons and layouts with controlled data. Separate viewport captures; no live account, device or server actions. Visual acceptance requires inspection." }, null, 2));
    console.log(`${records.length} pixel-icon views captured; native-grid, disabled state, 44px Send target, preserved roles and synthetic sends checked. ${output}`);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
