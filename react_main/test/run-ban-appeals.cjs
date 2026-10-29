// Browser regression for the admins' Ban Appeals page: the queue (pending
// first, resolved filter), opening a case with its appeal, ban, reports, mod
// log and votes, and voting with a required justification.
//
//   npx rsbuild build --config rsbuild.ban-appeals-test.config.ts
//   PLAYWRIGHT_MODULE=/path/to/playwright node test/run-ban-appeals.cjs
//
// Uses an isolated Playwright install (PLAYWRIGHT_MODULE; CHROMIUM_PATH is
// optional), serves the build on loopback, answers /api/mod/banAppeals with
// fixtures and blocks every other request. SCREENSHOT_DIR saves screenshots.
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const tally = (accept, deny) => ({ admins: 3, accept, deny, acceptAt: 2, denyAt: 2 });
const pendingRow = {
  id: "case1",
  userId: "u1",
  username: "BadPlayer",
  ban: { type: "site", label: "Site ban", issuedAt: now - 2 * DAY, expires: now + 28 * DAY, permanent: false, active: true },
  filedAt: now - DAY,
  status: "pending",
  tally: tally(1, 0),
  myVote: null,
  canVote: true,
};
const resolvedRow = {
  id: "case0",
  userId: "u0",
  username: "OldTimer",
  ban: { type: "site", label: "Site ban", issuedAt: now - 60 * DAY, expires: 0, permanent: true, active: true },
  filedAt: now - 50 * DAY,
  status: "denied",
  tally: tally(0, 2),
  myVote: "deny",
  canVote: false,
};
const baseCase = {
  id: "case1",
  userId: "u1",
  username: "BadPlayer",
  status: "pending",
  text: "I was arguing in lobby chat, but I did not harass anyone. I'm sorry for the language.",
  filedAt: now - DAY,
  ban: {
    id: "ban1",
    ...pendingRow.ban,
    reason: "Harassment (1st Offense): Repeated insults toward another player in lobby chat",
    scope: { value: "linked", label: "All linked accounts" },
    lengthText: "30 days",
    lengthMs: 30 * DAY,
    bannedBy: { id: "m1", name: "ZXHydra" },
    bannedAs: null,
  },
  reports: [
    {
      id: "rep1",
      linkedBy: "ban",
      reportedUserId: "u1",
      reportedUserName: "BadPlayer",
      rule: "Harassment",
      description: "Kept insulting me after I asked them to stop.",
      gameId: "Gx12",
      reporterCount: 2,
      status: "complete",
      createdAt: now - 3 * DAY,
      completedByName: "ZXHydra",
      ruling: { violationName: "Harassment (1st Offense)", banLength: "30 days", notes: "Repeated insults toward another player in lobby chat" },
    },
  ],
  modActions: [
    { id: "a2", name: "Site Ban", args: ["u1", "30 days", "All linked accounts (2 accounts)"], date: now - 2 * DAY, modId: "m1", modName: "ZXHydra", issuedThisBan: true },
    { id: "a1", name: "Chat Ban", args: ["u1", "1 day", "This account only"], date: now - 20 * DAY, modId: "m2", modName: "Pranay", issuedThisBan: false },
  ],
  tally: tally(1, 0),
  votes: [
    { voterId: "m2", voterName: "Pranay", vote: "accept", justification: "First offense and a sincere apology; 30 days is enough.", at: now - 3 * 60 * 60 * 1000 },
  ],
  voters: 3,
  myVote: null,
  canVote: true,
  maxJustificationLength: 1000,
};

async function main() {
  if (!process.env.PLAYWRIGHT_MODULE)
    throw new Error("Set PLAYWRIGHT_MODULE to an isolated Playwright installation.");
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(process.argv[2] || "/tmp/ultimafia-ban-appeals-browser");
  if (!fs.existsSync(path.join(directory, "index.html")))
    throw new Error("Build the Ban Appeals fixture first.");
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
  const origin = `http://127.0.0.1:${server.address().port}`;
  const passes = [];
  const failures = [];
  const check = (ok, name, detail) => (ok ? passes : failures).push(`${name}${detail !== undefined ? " " + JSON.stringify(detail) : ""}`);
  const shots = process.env.SCREENSHOT_DIR;
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    });
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const errors = [];
    let posted = null;
    let current = { ...baseCase };
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/*", async (route) => {
      const request = route.request();
      const u = new URL(request.url());
      if (u.pathname === "/api/mod/banAppeals") {
        const filter = u.searchParams.get("filter") || "pending";
        const rows = filter === "pending" ? [pendingRow] : filter === "resolved" ? [resolvedRow] : [pendingRow, resolvedRow];
        return route.fulfill({ contentType: "application/json", body: JSON.stringify(rows) });
      }
      if (u.pathname === "/api/mod/banAppeals/case1")
        return route.fulfill({ contentType: "application/json", body: JSON.stringify(current) });
      if (u.pathname === "/api/mod/banAppeals/case1/vote" && request.method() === "POST") {
        posted = JSON.parse(request.postData() || "{}");
        const mine = { voterId: "me", voterName: "Vinman", vote: posted.vote, justification: posted.justification, at: Date.now() };
        current = {
          ...current,
          votes: [...current.votes.filter((v) => v.voterId !== "me"), mine],
          myVote: { vote: posted.vote, justification: posted.justification, at: mine.at },
          tally: posted.vote === "accept" ? tally(2, 0) : tally(1, 1),
        };
        return route.fulfill({ contentType: "application/json", body: JSON.stringify(current) });
      }
      if (u.protocol === "data:" || u.hostname === "127.0.0.1") return route.continue();
      errors.push("blocked external request " + u.origin);
      return route.abort();
    });

    await page.goto(`${origin}/policy/moderation/ban-appeals`);
    await page.getByTestId("ban-appeal-row").first().waitFor({ timeout: 8000 });
    let rows = await page.getByTestId("ban-appeal-row").allInnerTexts();
    check(rows.length === 1 && rows[0].includes("BadPlayer") && rows[0].includes("Site ban"), "pending list shows the pending appeal", rows);
    check(rows[0].includes("Accept 1 of 2 needed, deny 0 of 2 needed") && rows[0].includes("PENDING"), "row shows the tally and status");
    if (shots) await page.screenshot({ path: path.join(shots, "LOCAL-ban-appeals-list.png"), fullPage: true });
    await page.getByRole("button", { name: "All" }).click();
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="ban-appeal-row"]').length === 2);
    rows = await page.getByTestId("ban-appeal-row").allInnerTexts();
    check(rows[0].includes("PENDING") && rows[1].includes("DENIED"), "All lists pending first, then resolved", rows);
    await page.getByRole("button", { name: "Resolved" }).click();
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="ban-appeal-row"]').length === 1 && document.body.innerText.includes("OldTimer"));
    check(true, "Resolved filter shows only resolved appeals");
    await page.getByRole("button", { name: "Pending" }).click();
    await page.waitForFunction(() => document.body.innerText.includes("BadPlayer"));

    await page.getByTestId("ban-appeal-row").first().click();
    await page.getByTestId("ban-appeal-case").waitFor({ timeout: 8000 });
    check(page.url().endsWith("/policy/moderation/ban-appeals/case1"), "clicking a row opens its case", page.url());
    const text = await page.locator("body").innerText();
    for (const [name, needle] of [
      ["appeal text", "I did not harass anyone"],
      ["ban type", "Site ban"],
      ["scope", "All linked accounts"],
      ["banned by", "ZXHydra"],
      ["reason", "Repeated insults toward another player"],
      ["length", "30 days"],
      ["original report", "Report rep1"],
      ["report link source", "Linked to this ban by its report ruling"],
      ["report description", "Kept insulting me"],
      ["mod log entry for the ban", "issued this ban"],
      ["existing justification", "First offense and a sincere apology"],
      ["voter name", "Pranay"],
    ])
      check(text.includes(needle), `case shows the ${name}`);
    const reportHref = await page.getByRole("link", { name: "Report rep1" }).getAttribute("href");
    check(reportHref === "/policy/moderation/reports/rep1", "report links to the report page", reportHref);

    const submit = page.getByRole("button", { name: "Submit vote" });
    await page.getByLabel("Deny").check();
    check(await submit.isDisabled(), "vote needs a justification");
    await page.getByLabel("Justification (required)").fill("The logs show repeated insults after a warning.");
    check(await submit.isEnabled(), "vote can be sent once a justification is given");
    if (shots) await page.screenshot({ path: path.join(shots, "LOCAL-ban-appeal-case.png"), fullPage: true });
    await submit.click();
    await page.getByText("Vote recorded.").waitFor({ timeout: 5000 });
    check(posted && posted.vote === "deny" && posted.justification === "The logs show repeated insults after a warning.", "posts the vote and justification", posted);
    const after = await page.getByTestId("case-votes").innerText();
    check(after.includes("Vinman") && after.includes("The logs show repeated insults"), "your vote and justification are listed");
    check(await page.getByRole("button", { name: "Change vote" }).isDisabled(), "Change vote is off until the vote or text changes");
    await page.getByLabel("Accept").check();
    check(await page.getByRole("button", { name: "Change vote" }).isEnabled(), "a vote can be changed while pending");
    if (shots) await page.screenshot({ path: path.join(shots, "LOCAL-ban-appeal-after-vote.png"), fullPage: true });
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
