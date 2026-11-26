// npm run test:quote-navigation:browser
// PLAYWRIGHT_MODULE must point to an isolated Playwright installation.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

async function main() {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(process.env.CHAT_REPLY_DIST || "/tmp/ultimafia-chat-reply-browser");
  const publicDir = path.resolve(__dirname, "../public");
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const relative = "." + (pathname === "/" ? "/index.html" : pathname);
    let file = path.resolve(directory, relative);
    if (!file.startsWith(directory + path.sep)) { res.writeHead(403); res.end(); return; }
    if (!fs.existsSync(file)) file = path.resolve(publicDir, relative);
    if ((!file.startsWith(directory + path.sep) && !file.startsWith(publicDir + path.sep)) ||
        !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end(); return;
    }
    res.setHeader("Content-Type", ({ ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".woff2": "font/woff2" })[path.extname(file)] || "application/octet-stream");
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const errors = [];
  let passes = 0;
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
    page.on("pageerror", e => errors.push(e.message));
    const open = async query => {
      await page.goto(`http://127.0.0.1:${server.address().port}/?st=1&${query}`);
      await page.waitForFunction(() => window.__ready);
      await page.evaluate(() => {
        window.__quoteNotices = [];
        const record = text => {
          if (/jumped to (the )?original message|the original message is not (shown|available)/i.test(text || "")) window.__quoteNotices.push(text);
        };
        new MutationObserver(records => records.forEach(change => {
          record(change.target.textContent);
          change.addedNodes.forEach(node => record(node.textContent));
        })).observe(document.body, { subtree: true, childList: true, characterData: true });
        window.__showUnrelatedAlert();
      });
      await page.getByRole("alert").filter({ hasText: "Unrelated connection warning" }).waitFor();
    };
    const silent = async () => {
      assert.deepEqual(await page.evaluate(() => window.__quoteNotices), [], "no transient quote notices");
      assert.equal(await page.getByRole("status").count(), 0, "no redundant quote status region");
      assert.equal(await page.getByRole("alert").filter({ hasText: "Unrelated connection warning" }).count(), 1, "unrelated notification survives navigation");
    };
    const original = '.message[data-message-id="m1aaaaaa"][data-message-state="1"][data-message-meeting="v1"]';
    const quote = () => page.locator('[data-message-id="quote-original"] .quote-jump-header');
    const revealed = () => page.waitForFunction(selector => {
      const row = document.querySelector(selector + ".reply-jump-highlight");
      if (!row) return false;
      const r = row.getBoundingClientRect();
      const c = row.closest(".speech-display").getBoundingClientRect();
      return r.bottom > c.top && r.top < c.bottom;
    }, original, { timeout: 5000 });
    const scrollToEnd = () => page.evaluate(() => {
      const scroller = document.querySelector(".speech-display");
      scroller.scrollTop = scroller.scrollHeight;
    });
    const position = () => page.locator(".speech-display").evaluate(e => e.scrollTop);
    // The transcript settles for a frame or two after mount (one row of scroll
    // adjustment), so a position sampled immediately after the quote renders is
    // still moving. Sample once it is stable, or "did not move" assertions
    // compare against a value the page was about to change anyway.
    const settleTranscript = async () => {
      let previous = null;
      for (let attempt = 0; attempt < 20; attempt++) {
        const state = await page.evaluate(() => {
          const scroller = document.querySelector(".speech-display");
          return { height: scroller.scrollHeight, top: Math.round(scroller.scrollTop) };
        });
        if (previous && previous.height === state.height && previous.top === state.top) return;
        previous = state;
        await page.waitForTimeout(100);
      }
    };
    const settledPosition = async () => {
      let previous = await position();
      for (let attempt = 0; attempt < 20; attempt++) {
        await page.waitForTimeout(100);
        const current = await position();
        if (current === previous) return current;
        previous = current;
      }
      return previous;
    };
    for (const layout of ["default", "defaultLarge", "compactInline", "compactAligned"]) {
      for (const fullDOM of [false, true]) {
        await open(`quoteJump=1&layout=${layout}&fullDOM=${fullDOM ? 1 : 0}`);
        await quote().waitFor();
        // Measure before the first click: a jump requested while the transcript
        // is still sizing rows is not a case a player can produce, and the
        // virtualizer drops it in the compact layouts.
        await settleTranscript();
        assert.equal(await page.locator(original).count(), fullDOM ? 1 : 0, "unmounted original in windowed mode only");
        for (let repeat = 0; repeat < 2; repeat++) {
          await scrollToEnd();
          await quote().click();
          await revealed();
          await silent();
          // Clear the class to ensure a repeated click really restarts it.
          await page.locator(original).evaluate(e => e.classList.remove("reply-jump-highlight"));
        }
        console.log(`PASS ${layout} ${fullDOM ? "full DOM" : "windowed"}: repeated quote jumps reveal the exact original`);
        passes++;
      }
    }
    await open("quoteJump=1&crossState=1");
    await quote().waitFor();
    assert.equal(await page.locator(original).count(), 0);
    await quote().click();
    await revealed();
    await silent();
    assert.equal(await page.locator('.message[data-message-state="2"]').count(), 0);
    console.log("PASS quote switches phase/meeting and reveals an offscreen source"); passes++;

    await open("quoteJump=1&short=1");
    assert.equal(await page.locator(original).count(), 1);
    await quote().click();
    await revealed();
    await silent();
    console.log("PASS quote jumps to an already mounted original"); passes++;

    // A valid id with the wrong phase/meeting must not move to a different row.
    for (const scope of [{ state: "99", meeting: "v1" }, { state: "1", meeting: "missing" }]) {
      await open("quoteJump=1");
      await quote().waitFor();
      const before = await settledPosition();
      await page.evaluate(scope => document.querySelector(".speech-display").dispatchEvent(
        new CustomEvent("transcript-jump", { detail: { messageId: "m1aaaaaa", ...scope } })
      ), scope);
      await page.waitForTimeout(300);
      assert.equal(await position(), before);
      assert.equal(await page.locator(".reply-jump-highlight").count(), 0);
      await silent();
      console.log(`PASS wrong source scope does not jump: ${JSON.stringify(scope)}`); passes++;
    }
    // An unavailable source and a filtered source both leave the view alone.
    for (const filtered of [false, true]) {
      await open(`quoteJump=1&filtered=${filtered ? 1 : 0}`);
      await quote().waitFor();
      if (!filtered) await page.evaluate(() => window.__removeOriginal());
      const before = await settledPosition();
      await quote().click();
      await page.waitForTimeout(1900);
      assert.equal(await position(), before, "silent unavailable target preserves scroll");
      assert.equal(await page.locator(".reply-jump-highlight").count(), 0);
      await silent();
      console.log(`PASS ${filtered ? "filtered" : "unavailable"} original causes no unrelated jump`); passes++;
    }
    // Click the actual reference, not just its event, with the source unmounted.
    for (const fullDOM of [false, true]) {
      await open(`quoteJump=1&replyJump=1&fullDOM=${fullDOM ? 1 : 0}`);
      const reference = page.locator('[data-message-id="reply-original"] .reply-reference');
      await reference.waitFor();
      assert.equal(await page.locator(original).count(), fullDOM ? 1 : 0);
      await reference.click();
      await revealed();
      await silent();
      console.log(`PASS actual reply-reference click ${fullDOM ? "full DOM" : "windowed"}`); passes++;
    }
    // The unrelated alert can still be dismissed and raised after navigation.
    await page.getByRole("alert").getByRole("button").click();
    assert.equal(await page.getByRole("alert").count(), 0);
    await page.evaluate(() => window.__showUnrelatedAlert());
    await page.getByRole("alert").filter({ hasText: "Unrelated connection warning" }).waitFor();
    await silent();
    console.log("PASS unrelated notification display, persistence and dismissal"); passes++;
    if (process.env.SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, "quote-integration.png") });
    }
    assert.deepEqual(errors, [], "no browser errors");
    console.log(`${passes} quote navigation cases passed; no browser errors`);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
