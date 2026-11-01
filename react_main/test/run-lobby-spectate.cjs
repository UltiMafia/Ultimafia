// Browser regression for the lobby row: Spectate and Join are client-side
// navigations and carry freshGameSession state. A document reload would drop
// the marker set before the click.
//
//   npx rsbuild build --config rsbuild.lobby-spectate-test.config.ts
//   PLAYWRIGHT_MODULE=/path/to/playwright node test/run-lobby-spectate.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

async function main() {
  assert.ok(process.env.PLAYWRIGHT_MODULE, "Set PLAYWRIGHT_MODULE");
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(
    process.argv[2] || "/tmp/ultimafia-lobby-spectate-browser",
  );
  if (!fs.existsSync(path.join(directory, "index.html")))
    throw new Error("Build the lobby spectate fixture first.");

  const mime = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
  };
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (pathname === "/favicon.ico") {
      res.writeHead(204);
      return res.end();
    }
    let filename = path.resolve(directory, "." + pathname);
    if (
      !filename.startsWith(directory + path.sep) ||
      !fs.existsSync(filename) ||
      fs.statSync(filename).isDirectory()
    ) {
      if (path.extname(pathname)) {
        res.writeHead(404);
        return res.end();
      }
      filename = path.join(directory, "index.html");
    }
    res.writeHead(200, {
      "Content-Type": mime[path.extname(filename)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(filename).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;

  const passed = [];
  const failed = [];
  const check = (ok, name, detail) => {
    (ok ? passed : failed).push(
      `${name}${detail !== undefined ? " " + JSON.stringify(detail) : ""}`,
    );
  };

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.CHROMIUM_PATH
        ? { executablePath: process.env.CHROMIUM_PATH }
        : {}),
    });
    const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    const marker = () =>
      page.evaluate(() => {
        if (!window.__pageMarker) window.__pageMarker = Math.random().toString(36);
        return window.__pageMarker;
      });
    const gamePageText = () =>
      page.locator('[data-testid="game-page"]').textContent();

    await page.goto(origin + "/play");
    await page.waitForFunction(() => window.__lobbySpectateReady);
    await page.getByRole("link", { name: "Spectate" }).waitFor();
    check(true, "lobby row shows the Spectate button");

    let before = await marker();
    await page.getByRole("link", { name: "Spectate" }).click();
    await page.waitForURL("**/game/g1?spectate=true");
    let text = await gamePageText();
    check(
      (await page.evaluate(() => window.__pageMarker)) === before,
      "Spectate does not reload the document",
    );
    check(
      text === "/game/g1?spectate=true|fresh=true",
      "Spectate navigates client-side with fresh-session state",
      text,
    );

    await page.goBack();
    await page.waitForURL("**/play");
    await page.getByRole("link", { name: "Join" }).waitFor();
    before = await marker();
    await page.getByRole("link", { name: "Join" }).click();
    await page.waitForURL("**/game/g1?join=true");
    text = await gamePageText();
    check(
      (await page.evaluate(() => window.__pageMarker)) === before,
      "Join does not reload the document",
    );
    check(
      text === "/game/g1?join=true|fresh=true",
      "Join navigates client-side with fresh-session state",
      text,
    );

    check(errors.length === 0, "no page errors", errors);
    await page.close();
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  for (const p of passed) console.log("ok   " + p);
  for (const f of failed) console.log("FAIL " + f);
  console.log(`${passed.length} passed, ${failed.length} failed`);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
