// Browser regression: after a user is picked in UserSearchSelect, moving focus
// to another field must keep the picked name in the input and must not clear
// the picked id. It used to: with no `value` prop (the mod commands form),
// MUI reset the input to the empty value on blur and that reset cleared the
// selection.
//
//   npx rsbuild build --config rsbuild.user-search-test.config.ts
//   PLAYWRIGHT_MODULE=/path/to/playwright node test/run-user-search.cjs
//
// Uses an isolated Playwright install (PLAYWRIGHT_MODULE; CHROMIUM_PATH is
// optional), serves the build on loopback, answers /api/user/searchName with a
// fixture and blocks every other request.
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const USER = { id: "fradinId1", name: "FradinSikes28" };

async function main() {
  if (!process.env.PLAYWRIGHT_MODULE)
    throw new Error("Set PLAYWRIGHT_MODULE to an isolated Playwright installation.");
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(process.argv[2] || "/tmp/ultimafia-user-search-browser");
  if (!fs.existsSync(path.join(directory, "index.html")))
    throw new Error("Build the user search fixture first.");
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
  const failures = [];
  const passes = [];
  const check = (ok, name, detail) => (ok ? passes : failures).push(`${name}${detail ? " " + JSON.stringify(detail) : ""}`);
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
      if (u.pathname === "/api/user/searchName")
        return route.fulfill({ contentType: "application/json", body: JSON.stringify([USER]) });
      if (u.protocol === "data:" || u.hostname === "127.0.0.1") return route.continue();
      errors.push("blocked external request " + u.origin);
      return route.abort();
    });
    await page.goto(url);
    await page.waitForFunction(() => window.__userSearchReady);

    for (const kind of ["uncontrolled", "controlled"]) {
      const input = page.locator(`[data-testid="${kind}"] input`).first();
      await input.click();
      await input.pressSequentially("Frad", { delay: 30 });
      const option = page.getByRole("option", { name: USER.name });
      await option.waitFor({ timeout: 5000 });
      await option.click();
      check((await input.inputValue()) === USER.name, `${kind}: shows the picked name while focused`, await input.inputValue());
      check((await page.evaluate((k) => window.__picked[k], kind)) === USER.id, `${kind}: reports the picked id`);
      await page.locator(`[data-testid="other-${kind}"]`).click();
      await page.waitForTimeout(200);
      check((await input.inputValue()) === USER.name, `${kind}: keeps the name after focus moves to another field`, await input.inputValue());
      check((await page.evaluate((k) => window.__picked[k], kind)) === USER.id, `${kind}: keeps the picked id after focus moves`, await page.evaluate((k) => window.__picked[k], kind));
      // Typing over it still clears the selection.
      await input.click();
      await input.press("End");
      await input.press("Backspace");
      check((await page.evaluate((k) => window.__picked[k], kind)) === null, `${kind}: editing the name clears the picked id`);
    }
    check(errors.length === 0, "no page errors or external requests", errors);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
  for (const p of passes) console.log("PASS " + p);
  for (const f of failures) console.log("FAIL " + f);
  console.log(`${passes.length} passed, ${failures.length} failed`);
  if (failures.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
