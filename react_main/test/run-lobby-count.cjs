// Build rsbuild.lobby-count-test.config.ts first. Uses an isolated Playwright
// installation via PLAYWRIGHT_MODULE. BROWSERS defaults to chromium,firefox;
// CHROMIUM_PATH optionally selects a system Chrome. No backend is needed.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

async function main() {
  assert.ok(process.env.PLAYWRIGHT_MODULE, "Set PLAYWRIGHT_MODULE");
  const playwright = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(
    process.argv[2] || "/tmp/opencode/ultimafia-lobby-count-browser",
  );
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    const filename = path.resolve(directory, "." + pathname);
    if (filename !== directory && !filename.startsWith(directory + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    const file = fs.existsSync(filename) && fs.statSync(filename).isFile()
      ? filename : path.join(directory, "index.html");
    const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
    res.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream");
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;
  let checks = 0;
  try {
    for (const engine of (process.env.BROWSERS || "chromium,firefox").split(",")) {
      const browser = await playwright[engine].launch({
        headless: true,
        ...(engine === "chromium" && process.env.CHROMIUM_PATH
          ? { executablePath: process.env.CHROMIUM_PATH } : {}),
      });
      try {
        for (const width of [1000, 390]) {
          const page = await browser.newPage({ viewport: { width, height: 800 } });
          const errors = [];
          page.on("pageerror", error => {
            errors.push(error.message);
            console.error(error);
          });
          page.on("console", message => {
            if (message.type() === "error") errors.push(message.text());
          });
          if (process.env.DEBUG) {
            page.on("console", message => console.log(message.type(), message.text()));
            page.on("request", request => console.log("request", request.url()));
          }
          await page.route("**/*", route => {
            const requestUrl = new URL(route.request().url());
            return requestUrl.origin === new URL(url).origin
              ? route.continue() : route.abort();
          });
          await page.route("**/api/game/*/info", route => {
            const id = new URL(route.request().url()).pathname.split("/")[3];
            const finished = id.startsWith("finished");
            // The saved-game endpoint deliberately omits status. Open games
            // return a smaller live count to check that feature still works.
            return route.fulfill({ json: {
              ...(finished ? {} : { status: "Open" }),
              type: "fixture",
              settings: {},
              endTime: finished ? Date.now() - 420000 : 0,
              players: finished ? Array(7).fill({ id: "user", name: "Test" }) : [],
            } });
          });
          await page.goto(url);
          await page.waitForFunction(() => window.__lobbyCountReady);
          const value = id => page.locator(`[data-case="${id}"] progress`)
            .evaluate(el => el.value);
          const style = await page.locator("progress").first().evaluate(el => {
            const css = getComputedStyle(el);
            return { appearance: css.appearance, background: css.backgroundColor,
              radius: css.borderRadius, overflow: css.overflow };
          });
          assert.deepEqual(style, {
            appearance: "none", background: "rgba(211, 211, 211, 0.15)",
            radius: "4px", overflow: "hidden",
          });
          checks++;
          for (const [id, expected] of [
            ["finished", 0], ["finished-with-players", 0],
            ["empty", 0], ["partial", 3], ["full", 7],
          ]) {
            assert.equal(await value(id), expected, `${engine}/${width}: ${id}`);
            checks++;
          }
          if (process.env.SCREENSHOT_DIR) {
            await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR,
              `lobby-count-${engine}-${width}.png`) });
          }
          for (const id of ["finished", "finished-with-players", "partial"]) {
            const box = page.locator(`[data-case="${id}"] .player-count`);
            const textBefore = await box.innerText();
            await box.click();
            await page.getByText(`Game ${id}`, { exact: true }).waitFor();
            assert.equal(await value(id), 0, `${engine}/${width}: ${id} after opening details`);
            const textAfter = await box.innerText();
            assert.equal(textAfter.replace(/\s+/g, " "),
              id === "partial" ? "0/7 2" : textBefore.replace(/\s+/g, " "));
            checks += 2;
            await page.keyboard.press("Escape");
            await page.getByText(`Game ${id}`, { exact: true }).waitFor({ state: "hidden" });
            assert.equal(await value(id), 0, `${engine}/${width}: ${id} after closing details`);
            checks++;
          }
          assert.deepEqual(errors, [], `${engine}/${width}: no page errors`);
          checks++;
          console.log(`ok ${engine} ${width}px: styling, fills, finished clicks, live count, details`);
          await page.close();
        }
      } finally {
        await browser.close();
      }
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
  console.log(`${checks} checks passed`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
