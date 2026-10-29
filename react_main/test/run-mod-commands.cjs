// Regression for the Ban and Unban mod command forms: each has User, its type
// select (only real ban types), its own scope select defaulting to "linked",
// and Ban keeps Length and Reason. Also checks the ban appeal tally wording.
//
//   npx rsbuild build --config rsbuild.mod-commands-test.config.ts
//   PLAYWRIGHT_MODULE=/path/to/playwright node test/run-mod-commands.cjs
//
// Uses an isolated Playwright install (PLAYWRIGHT_MODULE; CHROMIUM_PATH is
// optional), serves the build on loopback and blocks every other request.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const BAN_TYPES = ["forum", "chat", "game", "ranked", "competitive", "site"];
const SCOPES = ["linked", "single"];

async function main() {
  if (!process.env.PLAYWRIGHT_MODULE)
    throw new Error("Set PLAYWRIGHT_MODULE to an isolated Playwright installation.");
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(process.argv[2] || "/tmp/ultimafia-mod-commands-browser");
  if (!fs.existsSync(path.join(directory, "index.html")))
    throw new Error("Build the mod commands fixture first.");
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let filename = path.resolve(directory, "." + pathname);
    if (!filename.startsWith(directory + path.sep) || !fs.existsSync(filename) || fs.statSync(filename).isDirectory())
      filename = path.join(directory, "index.html");
    const type = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css" }[path.extname(filename)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    fs.createReadStream(filename).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const results = [];
  const check = (name, fn) => {
    try {
      fn();
      results.push(["PASS", name]);
    } catch (e) {
      results.push(["FAIL", `${name}: ${e.message}`]);
    }
  };
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    });
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/*", (route) => {
      const u = new URL(route.request().url());
      if (u.protocol === "data:" || u.hostname === "127.0.0.1") return route.continue();
      errors.push("blocked external request " + u.origin);
      return route.abort();
    });
    await page.goto(url);
    await page.waitForFunction(() => window.__modCommandsReady && window.__modCommands, null, { timeout: 10000 });
    const { Ban, Unban } = await page.evaluate(() => window.__modCommands);
    const tally = await page.evaluate(() => window.__tally);

    for (const [name, args, scopeLabel, rest] of [
      ["Ban", Ban, "Ban Scope", ["length", "reason"]],
      ["Unban", Unban, "Unban Scope", []],
    ]) {
      check(`${name}: fields in order`, () =>
        assert.deepEqual(args.map((a) => a.name), ["userId", "banType", "scope", ...rest]));
      check(`${name}: Ban Type lists only ban types`, () => {
        const banType = args.find((a) => a.name === "banType");
        assert.equal(banType.label, "Ban Type");
        assert.deepEqual(banType.options, BAN_TYPES);
        assert.ok(!banType.optionLabels.some((l) => /scope/i.test(String(l))));
      });
      check(`${name}: has its own ${scopeLabel} select defaulting to linked`, () => {
        const scope = args.find((a) => a.name === "scope");
        assert.equal(scope.label, scopeLabel);
        assert.equal(scope.type, "select");
        assert.deepEqual(scope.options, SCOPES);
        assert.equal(scope.default, "linked");
      });
    }
    check("tally wording says how many votes each outcome needs", () =>
      assert.deepEqual(tally, [
        "2 admins: accept 1 of 2 needed, deny 0 of 1 needed",
        "1 admin: accept 0 of 1 needed, deny 1 of 1 needed",
        "0 admins: nobody can vote",
      ]));
    check("no page errors or external requests", () => assert.deepEqual(errors, []));
  } finally {
    if (browser) await browser.close();
    server.close();
  }
  for (const [status, name] of results) console.log(`${status} ${name}`);
  const failed = results.filter(([s]) => s === "FAIL").length;
  console.log(`${results.length - failed} passed, ${failed} failed`);
  if (failed) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
