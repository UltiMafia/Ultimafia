// Viewport/state atlas for real production controls. All transports are controlled
// by redesign.browser.jsx. No account, game or production request is used.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const phase = process.env.DESIGN_PHASE || "after";
const shots = process.env.SCREENSHOT_DIR || `/tmp/opencode/ultimafia-controls/${phase}`;
const directory = process.env.REDESIGN_BUNDLE_DIR || "/tmp/opencode/ultimafia-redesign-browser";
const publicDir = path.resolve(__dirname, "../public");
const mime = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  let file;
  for (const base of [directory, publicDir]) {
    const candidate = path.resolve(base, "." + pathname);
    if (candidate.startsWith(base + path.sep) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) { file = candidate; break; }
  }
  if (!file && !path.extname(pathname)) file = path.join(directory, "index.html");
  if (!file) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(res);
});

async function main() {
  fs.mkdirSync(shots, { recursive: true });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const records = [];
  const errors = [];
  async function open(width, height, query = "") {
    const page = await browser.newPage({ viewport: { width, height }, colorScheme: "dark", reducedMotion: "reduce" });
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.goto(origin + "/game/fixture" + query);
    await page.locator(".game").waitFor();
    if (!query.includes("review")) await page.locator("#speechInput").waitFor();
    await page.evaluate(() => document.fonts.ready);
    return page;
  }
  async function capture(page, name) {
    await page.mouse.move(0, 0);
    await page.screenshot({ path: path.join(shots, name + ".png"), animations: "disabled" });
    records.push({ name, viewport: page.viewportSize() });
  }
  try {
    for (const [width, height] of [[1440, 1000], [1024, 768], [390, 844], [320, 844], [640, 420]]) {
      const page = await open(width, height);
      await capture(page, `composer-empty-${width}x${height}`);
      await page.locator("#speechInput").fill("A message ready to send.");
      await capture(page, `composer-ready-${width}x${height}`);
      await page.locator("#speechInput").fill("A longer draft that should remain comfortable to edit, without the controls becoming smaller or acquiring their own mismatched backgrounds.");
      await capture(page, `composer-long-${width}x${height}`);
      if (width > 900) {
        await page.getByRole("button", { name: /Leave/, exact: false }).first().click();
      } else {
        await page.getByRole("button", { name: /Menu/ }).click();
        await page.getByRole("button", { name: /Leave/, exact: false }).first().click();
      }
      await page.getByRole("dialog").waitFor();
      await capture(page, `leave-${width}x${height}`);
      await page.close();
    }
    for (const [name, query] of [["reply", "?reply=1"], ["whisper", "?whisper=1"], ["cooldown", "?cooldown=1"], ["offline", "?offline=1"]]) {
      const page = await open(390, 844, query);
      await page.locator("#speechInput").fill("Keep this draft.");
      if (name === "cooldown") await page.evaluate(() => window.__emitGameEvent("speakCooldown", { meetingId: "village", cooldownMs: 60000, sentAt: Date.now() }));
      if (name === "offline") {
        await page.clock.install();
        await page.evaluate(() => window.__emitGameEvent("p"));
        await page.clock.runFor(16000);
      }
      if (name === "whisper") {
        await page.locator(".speech-dropdown").first().getByRole("button").click();
        await page.getByRole("menuitem", { name: /Whisper.*Juniper/ }).click();
        await page.getByRole("menu").waitFor({ state: "hidden" });
      }
      await capture(page, `composer-${name}-390`);
      await page.close();
    }
    let interactionChecks = 0;
    if (phase !== "before") {
      const page = await open(390, 844, "?delayecho=1&whisper=1&history=1");
      const editor = page.locator("#speechInput");
      const send = page.getByRole("button", { name: "Send message", exact: true });
      const speechCount = () => page.evaluate(() => window.__sent.filter(([type]) => type === "speak").length);
      assert.ok(await send.isDisabled()); interactionChecks++;
      await editor.fill("Submitted first draft"); await editor.press("Enter");
      await editor.fill("A newer draft");
      await page.evaluate(() => window.__ackGameSpeak());
      await page.getByText("Submitted first draft", { exact: true }).waitFor();
      assert.equal(await editor.inputValue(), "A newer draft", "late echo must retain newer edits"); interactionChecks++;
      await editor.fill("Same text after editing"); await editor.press("Enter");
      await editor.fill("Different text"); await editor.fill("Same text after editing");
      await page.evaluate(() => window.__ackGameSpeak());
      await page.locator(".speech-display").getByText("Same text after editing", { exact: true }).waitFor();
      assert.equal(await editor.inputValue(), "Same text after editing", "draft revision matters even if text matches again"); interactionChecks++;
      await editor.fill("Accepted draft"); await editor.press("Enter");
      await page.evaluate(() => window.__ackGameSpeak());
      await page.waitForFunction(() => document.querySelector("#speechInput").value === ""); interactionChecks++;
      const count = await speechCount();
      await editor.fill("First line"); await editor.press("Shift+Enter"); await editor.press("a");
      assert.equal(await editor.inputValue(), "First line\na");
      assert.equal(await speechCount(), count); interactionChecks++;
      await editor.evaluate(input => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, isComposing: true })));
      assert.equal(await speechCount(), count); interactionChecks++;
      await editor.fill(Array.from({ length: 8 }, (_, index) => `Draft line ${index + 1}`).join("\n"));
      assert.ok((await editor.boundingBox()).height <= 118, "editor grows to at most four lines, then scrolls"); interactionChecks++;
      await capture(page, "composer-multiline-390");
      await page.evaluate(() => window.__emitGameEvent("speakCooldown", { meetingId: "village", cooldownMs: 60000, sentAt: Date.now() }));
      await editor.fill("Editable during cooldown");
      assert.equal(await editor.inputValue(), "Editable during cooldown"); assert.ok(await send.isDisabled());
      await editor.press("Enter"); assert.equal(await speechCount(), count); interactionChecks++;
      await page.getByRole("combobox", { name: "View phase" }).selectOption("0");
      await page.getByText("Viewing history. Messages are read-only.").waitFor();
      await capture(page, "composer-history-390");
      await page.getByRole("button", { name: "Return to live", exact: true }).click();
      assert.equal(await editor.inputValue(), "Editable during cooldown"); interactionChecks++;
      await page.evaluate(() => window.__emitGameEvent("disconnected"));
      await editor.fill("Offline draft"); assert.ok(await send.isDisabled());
      await editor.press("Enter"); assert.equal(await speechCount(), count); interactionChecks++;
      await page.evaluate(() => window.__emitGameEvent("p"));
      await page.locator(".speech-dropdown").first().getByRole("button").click();
      await page.getByRole("menuitemcheckbox", { name: "Leak Whispers" }).click();
      assert.equal(await page.getByRole("menuitemcheckbox", { name: "Leak Whispers" }).getAttribute("aria-checked"), "true");
      await page.getByRole("menuitem", { name: /Whisper.*Juniper/ }).click();
       await editor.fill("Private draft"); await send.click();
       assert.ok(await page.evaluate(() => window.__sent.some(([type, data]) => type === "speak" && data.content === "Private draft" && data.abilityName === "Whisper" && data.abilityTarget === "p1" && data.forceLeak === true))); interactionChecks++;
       await page.getByRole("button", { name: "Speech mode and recipient" }).click();
       await page.getByRole("menuitem", { name: /Cry.*out/ }).click();
       await editor.fill("A public cry"); await send.click();
       assert.ok(await page.evaluate(() => window.__sent.some(([type, data]) => type === "speak" && data.content === "A public cry" && data.abilityName === "Cry" && data.abilityTarget === "out"))); interactionChecks++;
      await page.close();

      const actions = await open(1440, 1000, "?history=1");
      const trigger = actions.locator(".action-dropdown").getByRole("button");
      for (const restriction of [{ canVote: false }, { amMember: false }, { instant: true, playerHasVoted: true }, { noUnvote: true, playerHasVoted: true }]) {
        await actions.evaluate(value => window.__setGameMeeting(value), restriction);
        await actions.waitForFunction(() => document.querySelector(".action-dropdown button").disabled);
        assert.ok(await trigger.isDisabled()); interactionChecks++;
      }
      await actions.evaluate(() => window.__setGameMeeting({}));
       await actions.getByRole("tab", { name: "Night 1", exact: true }).click();
      assert.ok(await trigger.isDisabled()); interactionChecks++;
      await actions.getByRole("button", { name: "Return to live", exact: true }).click();
      await actions.evaluate(() => window.__setGameMeeting({ inputType: "text", actionName: "Written response", textOptions: { minLength: 2, maxLength: 200 } }));
      const text = actions.getByRole("textbox", { name: "Written response" });
      await text.fill("Valid response"); await actions.getByRole("button", { name: "Submit", exact: true }).click();
      assert.ok(await actions.evaluate(() => window.__sent.some(([type, data]) => type === "vote" && data.selection === "Valid response"))); interactionChecks++;
      for (const restriction of [{ canVote: false }, { amMember: false }, { noUnvote: true, playerHasVoted: true }]) {
        const previous = await actions.evaluate(() => window.__sent.filter(([type]) => type === "vote").length);
        await actions.evaluate(value => window.__setGameMeeting({ inputType: "text", actionName: "Written response", ...value }), restriction);
        await text.waitFor({ state: "hidden" });
        assert.equal(await actions.evaluate(() => window.__sent.filter(([type]) => type === "vote").length), previous); interactionChecks++;
      }
      await actions.close();

      const review = await open(390, 844, "?review=1");
      await review.getByText("Game review is read-only.").waitFor();
      await review.getByRole("button", { name: /Actions/ }).click();
      assert.ok(await review.locator(".action-dropdown").getByRole("button").isDisabled()); interactionChecks++;
      await review.close();

      const leave = await open(1440, 1000);
      await leave.clock.install();
      await leave.getByRole("button", { name: "Leave game", exact: true }).click();
      assert.ok(await leave.getByRole("dialog").getByRole("button", { name: /Leave game/ }).isDisabled()); interactionChecks++;
      await leave.getByRole("button", { name: "Stay", exact: true }).click();
      assert.ok(!(await leave.evaluate(() => window.__leftFixtureGame))); interactionChecks++;
      await leave.getByRole("dialog").waitFor({ state: "hidden" });
      await leave.getByRole("button", { name: "Leave game", exact: true }).click();
      await leave.getByRole("dialog").getByRole("button", { name: "Leave game (2)", exact: true }).waitFor();
      await leave.clock.runFor(2100);
      await leave.getByRole("dialog").getByRole("button", { name: "Leave game", exact: true }).click();
      assert.ok(await leave.evaluate(() => window.__leftFixtureGame)); interactionChecks++;
      await leave.close();
      for (const [name, query, large] of [["light", "?theme=light", false], ["large-text", "", true], ["full-game", "?full=1", false]]) {
        const page = await open(390, 844, query);
        if (large) await page.addStyleTag({ content: "html { font-size: 125% !important; }" });
        await capture(page, `${name}-390`);
        await page.close();
      }
      for (const [width, height] of [[1440, 1000], [390, 844], [320, 844], [640, 420]]) {
        const page = await browser.newPage({ viewport: { width, height }, colorScheme: "dark", reducedMotion: "reduce" });
        page.on("pageerror", error => errors.push(error.message));
        await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
        await page.goto(origin + "/play?dm=1" + (width <= 900 ? "&dmpos=1" : ""));
        const editor = page.getByTestId("dm-input");
        await editor.waitFor();
        const bounds = await page.getByTestId("dm-window").boundingBox();
        assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= width && bounds.y + bounds.height <= height, "phone ignores retained desktop position"); interactionChecks++;
        if (width <= 900) {
          assert.equal(await page.getByRole("dialog", { name: "Direct messages" }).count(), 1); interactionChecks++;
        }
        await editor.fill("DM draft");
        await editor.evaluate(input => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, isComposing: true })));
        assert.ok(!(await page.evaluate(() => window.__chatSent.some(([type]) => type === "sendMessage")))); interactionChecks++;
        await editor.press("Shift+Enter");
        assert.equal(await editor.inputValue(), "DM draft\n"); interactionChecks++;
        await editor.fill("Direct message from button"); await page.getByTestId("dm-send").click();
        await page.getByTestId("dm-messages").getByText("Direct message from button", { exact: true }).waitFor(); interactionChecks++;
        await editor.fill("Direct message from Enter"); await editor.press("Enter");
        await page.getByTestId("dm-messages").getByText("Direct message from Enter", { exact: true }).waitFor(); interactionChecks++;
        await editor.fill("Retained DM draft");
        await capture(page, `dm-conversation-${width}x${height}`);
        if (width <= 900 && height > 500) {
          await page.evaluate(() => document.documentElement.style.setProperty("--app-bottom", "300px"));
          const input = await editor.boundingBox();
          assert.ok(input.y + input.height < height - 300, "composer fits above a simulated visual keyboard inset"); interactionChecks++;
          await capture(page, `dm-keyboard-inset-simulated-${width}`);
          await page.evaluate(() => document.documentElement.style.removeProperty("--app-bottom"));
        }
        await page.getByTestId("dm-back").click();
        await page.getByTestId("dm-row").first().waitFor();
        await capture(page, `dm-list-${width}x${height}`);
        await page.getByTestId("dm-row").first().click();
        assert.equal(await editor.inputValue(), "Retained DM draft"); interactionChecks++;
        if (width <= 900) {
          await page.goBack();
          await page.getByTestId("dm-window").waitFor({ state: "hidden" });
          assert.equal(new URL(page.url()).pathname, "/play"); interactionChecks++;
        }
        await page.close();
      }
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(shots, "controls.json"), JSON.stringify({ phase, records, interactionChecks, errors }, null, 2));
    console.log(`${phase}: captured ${records.length} control states; ${interactionChecks} interaction checks passed. ${shots}`);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
