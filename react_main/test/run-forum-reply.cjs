// Local real-component fixture only. No live backend requests.
const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), http = require("node:http");
const [directory, playwrightPath, executablePath] = process.argv.slice(2);
const { chromium } = require(playwrightPath);
(async () => {
  const server = http.createServer((req, res) => {
    let file = path.resolve(directory, "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname));
    if (!file.startsWith(path.resolve(directory) + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(directory, "index.html");
    res.setHeader("Content-Type", ({ ".js": "application/javascript", ".css": "text/css", ".html": "text/html" })[path.extname(file)] || "application/octet-stream");
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  const results = [];
  const button = (p, name) => p.getByRole("button", { name, exact: true });
  const pageNav = async (p, n) => {
    await p.locator(".page-nav").first().getByRole("button", { name: String(n), exact: true }).click();
  };
  const open = async p => { await button(p, "Reply").click(); await p.locator(".reply-form textarea").fill("retained draft"); };
  const snapshot = p => p.evaluate(() => ({
    requests: window.__forumReply.requests, alerts: window.__forumReply.alerts,
    stored: JSON.parse(sessionStorage.getItem("forum-fixture-replies") || "{}"),
    composer: !!document.querySelector(".reply-form"), draft: document.querySelector(".reply-form textarea")?.value || "",
  }));
  const image = p => p.locator(".reply-form textarea").evaluate(async el => {
    const canvas = document.createElement("canvas"); canvas.width = 4; canvas.height = 4;
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    const data = new DataTransfer(); data.items.add(new File([blob], "fixture.png", { type: "image/png" }));
    el.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data }));
  });
  const test = async (name, fn) => {
    const context = await browser.newContext();
    const p = await context.newPage(); p.setDefaultTimeout(8000);
    await p.route("**/*", route => route.request().url().startsWith("http://127.0.0.1:") ? route.continue() : route.abort());
    try { await p.goto("http://127.0.0.1:" + server.address().port); await button(p, "Reply").waitFor(); await fn(p); results.push({ name, pass: true }); }
    catch (error) { results.push({ name, pass: false, error: error.message }); }
    finally { await context.close(); }
  };
  try {
    browser = await chromium.launch({ headless: true, executablePath });
    for (const fail of [false, true]) for (const nav of [false, true]) {
      await test("delayed " + (fail ? "failure" : "success") + (nav ? " with pagination" : " control"), async p => {
        await open(p); await button(p, "Toggle 2-second delay").click();
        if (fail) await button(p, "Fail next Post").click();
        await button(p, "Post").click();
        if (nav) await pageNav(p, 2);
        await p.waitForTimeout(2300);
        const s = await snapshot(p); assert.equal(s.requests.length, 1);
        if (fail) { assert.equal(s.alerts.length, 1); assert.equal(s.draft, "retained draft"); assert.equal(await button(p, "Post").isEnabled(), true); }
        else { assert.equal(s.stored.threadA.length, 1); assert.equal(s.composer, false); await button(p, "Reply").click(); assert.equal((await snapshot(p)).draft, ""); assert.equal(await button(p, "Remove image").count(), 0); await button(p, "Cancel").click(); }
      });
    }
    for (const fail of [false, true]) await test("rapid pagination during " + (fail ? "failed" : "successful") + " post", async p => {
      await open(p); await button(p, "Toggle 2-second delay").click();
      if (fail) await button(p, "Fail next Post").click();
      await button(p, "Post").click(); for (const n of [2, 1, 2]) await pageNav(p, n);
      assert.equal(await p.locator(".reply-form").getAttribute("aria-busy"), "true");
      await p.waitForTimeout(2300); const s = await snapshot(p); assert.equal(s.requests.length, 1);
      if (fail) { assert.equal(s.alerts.length, 1); assert.equal(s.draft, "retained draft"); assert.equal(await button(p, "Post").isEnabled(), true); }
      else { assert.equal(s.stored.threadA.length, 1); assert.equal(s.composer, false); await button(p, "Reply").click(); assert.equal((await snapshot(p)).draft, ""); assert.equal(await button(p, "Remove image").count(), 0); }
    });
    await test("image survives failed post and pagination; intentional retry once", async p => {
      await open(p); await image(p); await button(p, "Remove image").waitFor();
      await button(p, "Toggle 2-second delay").click(); await button(p, "Fail next Post").click(); await button(p, "Post").click(); await pageNav(p, 2);
      await p.waitForTimeout(2300); await button(p, "Remove image").waitFor();
      assert.equal((await snapshot(p)).draft, "retained draft");
      await button(p, "Toggle 2-second delay").click(); await button(p, "Post").click(); await p.waitForTimeout(150);
      const s = await snapshot(p); assert.equal(s.requests.length, 2); assert.equal(s.requests[0].imageBytes > 0, true); assert.equal(s.requests[1].imageBytes, s.requests[0].imageBytes); assert.equal(s.stored.threadA.length, 1); assert.equal(s.composer, false);
      await button(p, "Reply").click(); assert.equal((await snapshot(p)).draft, ""); assert.equal(await button(p, "Remove image").count(), 0);
    });
    for (const action of ["Switch thread", "Toggle mount"]) for (const fail of [false, true]) {
      await test(action + " while " + (fail ? "failed" : "successful") + " post pending", async p => {
        await open(p); await button(p, "Toggle 2-second delay").click(); if (fail) await button(p, "Fail next Post").click(); await button(p, "Post").click();
        await button(p, action).click();
        if (action === "Toggle mount") { await button(p, action).click(); await open(p); }
        await p.waitForTimeout(2300);
        const s = await snapshot(p); assert.equal(s.requests.length, 1); assert.equal(s.alerts.length, 0);
        if (action === "Toggle mount") assert.equal(s.draft, "retained draft");
        else { assert.equal(s.composer, false); await open(p); assert.equal((await snapshot(p)).draft, "retained draft"); }
      });
    }
    await test("A to B to A invalidates old submission", async p => {
      await open(p); await button(p, "Toggle 2-second delay").click(); await button(p, "Fail next Post").click(); await button(p, "Post").click();
      await button(p, "Switch thread").click(); await button(p, "Switch thread").click(); await p.waitForTimeout(2300);
      const s = await snapshot(p); assert.equal(s.alerts.length, 0); assert.equal(s.composer, false); await open(p);
    });
    await test("rapid navigation preserves nonposting image and text; cancel clears", async p => {
      await open(p); await image(p); for (const n of [2, 1, 2]) await pageNav(p, n);
      assert.equal((await snapshot(p)).draft, "retained draft"); await button(p, "Remove image").waitFor();
      await button(p, "Remove image").click(); assert.equal((await snapshot(p)).draft, "retained draft");
      await button(p, "Cancel").click(); await button(p, "Reply").click(); assert.equal((await snapshot(p)).draft, "");
    });
    await test("late page GET cannot overwrite successful post navigation", async p => {
      await open(p); await button(p, "Toggle 2-second delay").click(); await button(p, "Post").click();
      await p.evaluate(() => { window.__forumReply.getDelays = [3000, 0]; }); await pageNav(p, 2);
      await p.waitForTimeout(3300); const s = await snapshot(p); assert.equal(s.composer, false); assert.equal(s.stored.threadA.length, 1);
      assert.equal(await p.locator("#reply-threadA-page1-first").count(), 1); assert.equal(await p.locator("#reply-threadA-page2-first").count(), 0);
    });
    await test("old finally cannot unlock new submission after remount", async p => {
      await open(p); await button(p, "Toggle 2-second delay").click(); await button(p, "Post").click();
      await p.waitForTimeout(1000); await button(p, "Toggle mount").click(); await button(p, "Toggle mount").click();
      await open(p); await button(p, "Post").click(); await p.waitForTimeout(1200);
      assert.equal(await p.locator(".reply-form").getAttribute("aria-busy"), "true");
      assert.equal(await button(p, "Posting...").isEnabled(), false);
      await p.waitForTimeout(1000); const s = await snapshot(p); assert.equal(s.requests.length, 2); assert.equal(s.stored.threadA.length, 2); assert.equal(s.composer, false);
    });
    await test("duplicate click dispatch sends only one request", async p => {
      await open(p); await button(p, "Toggle 2-second delay").click();
      await button(p, "Post").evaluate(el => { el.click(); el.click(); });
      await p.waitForTimeout(2300); const s = await snapshot(p); assert.equal(s.requests.length, 1); assert.equal(s.stored.threadA.length, 1);
    });
    console.log(JSON.stringify({ fixture: directory, results }, null, 2)); process.exitCode = results.every(r => r.pass) ? 0 : 1;
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 2; });
