// Browser regression for the site-ban page: it shows the ban type in plain
// words, lists every active ban with its type and expiry when there are
// several, and never shows the ban's scope.
//
//   npx rsbuild build --config rsbuild.banned-test.config.ts
//   PLAYWRIGHT_MODULE=/path/to/playwright node test/run-banned.cjs
//
// Uses an isolated Playwright install (PLAYWRIGHT_MODULE; CHROMIUM_PATH is
// optional), serves the build on loopback, answers /api/auth/ban with a
// fixture and blocks every other request. SCREENSHOT_DIR saves a screenshot
// of each case.
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const siteBan = {
  type: "site",
  label: "Site ban",
  issuedAt: now - DAY,
  expires: now + 29 * DAY,
  permanent: false,
};
const base = {
  banned: true,
  username: "BadPlayer",
  reason: "Repeated harassment in lobby chat",
  issuedAt: siteBan.issuedAt,
  expires: siteBan.expires,
  permanent: false,
  banType: "site",
  banTypeLabel: "Site ban",
  appealLimit: 1,
  votesRequired: 2,
  appeal: { status: "not_submitted" },
  csrf: "fixture",
};

const cases = [
  {
    name: "one ban",
    data: { ...base, bans: [siteBan] },
    expectList: false,
  },
  {
    name: "several bans",
    data: {
      ...base,
      bans: [
        siteBan,
        { type: "chat", label: "Chat ban", issuedAt: now, expires: now + DAY, permanent: false },
        { type: "playRanked", label: "Ranked ban", issuedAt: now, expires: 0, permanent: true },
      ],
    },
    expectList: true,
  },
  {
    // A server from before the ban type was added.
    name: "older server without ban type",
    data: (({ banType, banTypeLabel, ...rest }) => rest)(base),
    expectList: false,
  },
];

async function main() {
  if (!process.env.PLAYWRIGHT_MODULE)
    throw new Error("Set PLAYWRIGHT_MODULE to an isolated Playwright installation.");
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(process.argv[2] || "/tmp/ultimafia-banned-browser");
  if (!fs.existsSync(path.join(directory, "index.html")))
    throw new Error("Build the ban page fixture first.");
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let filename = path.resolve(directory, "." + pathname);
    if (!filename.startsWith(directory + path.sep) || !fs.existsSync(filename) || fs.statSync(filename).isDirectory())
      filename = path.join(directory, "index.html");
    const type = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".png": "image/png" }[path.extname(filename)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    fs.createReadStream(filename).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const failures = [];
  const passes = [];
  const check = (ok, name, detail) => (ok ? passes : failures).push(`${name}${detail !== undefined ? " " + JSON.stringify(detail) : ""}`);
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    });
    for (const testCase of cases) {
      const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.route("**/*", (route) => {
        const u = new URL(route.request().url());
        if (u.pathname === "/api/auth/ban")
          return route.fulfill({ contentType: "application/json", body: JSON.stringify(testCase.data) });
        if (u.protocol === "data:" || u.hostname === "127.0.0.1") return route.continue();
        errors.push("blocked external request " + u.origin);
        return route.abort();
      });
      await page.goto(url);
      await page.waitForFunction(() => window.__bannedReady);
      const type = page.getByTestId("ban-type");
      await type.waitFor({ timeout: 5000 });
      const typeText = (await type.innerText()).trim();
      check(typeText === "Ban type: Site ban", `${testCase.name}: shows the ban type`, typeText);
      const list = page.getByTestId("active-bans");
      const listShown = (await list.count()) > 0;
      check(listShown === testCase.expectList, `${testCase.name}: ${testCase.expectList ? "lists" : "does not list"} the active bans`);
      if (listShown) {
        const lines = (await list.innerText()).split("\n").map((l) => l.trim()).filter(Boolean);
        check(lines[0].toLowerCase() === "active bans on this account", `${testCase.name}: list heading`, lines[0]);
        check(/^Site ban: expires .+/.test(lines[1]), `${testCase.name}: site ban line`, lines[1]);
        check(/^Chat ban: expires .+/.test(lines[2]), `${testCase.name}: chat ban line`, lines[2]);
        check(lines[3] === "Ranked ban: permanent", `${testCase.name}: permanent ban line`, lines[3]);
      }
      const body = await page.locator("body").innerText();
      check(!/scope|linked accounts|this account only/i.test(body), `${testCase.name}: never mentions the ban scope`);
      check(body.includes("Reason: Repeated harassment in lobby chat"), `${testCase.name}: still shows the reason`);
      check(errors.length === 0, `${testCase.name}: no page errors or external requests`, errors);
      if (process.env.SCREENSHOT_DIR)
        await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `banned-${testCase.name.replace(/\W+/g, "-")}.png`), fullPage: true });
      await page.close();
    }
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
