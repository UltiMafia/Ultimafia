// Isolated visual/interaction review. No live accounts, database or sockets.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const directory = process.env.REDESIGN_BUNDLE_DIR || "/tmp/opencode/ultimafia-redesign-browser";
const publicDir = path.resolve(__dirname, "../public");
const phase = process.env.DESIGN_PHASE || "after";
const runChecks = phase !== "before" || process.env.DESIGN_CHECK_BASELINE === "1";
const shots = process.env.SCREENSHOT_DIR || `/tmp/opencode/ultimafia-redesign/${phase}`;
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
  const browser = await chromium.launch({ headless: true });
  const report = [];
  try {
    for (const width of process.env.DESIGN_VARIANTS_ONLY ? [] : [1440, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: width > 900 ? 1000 : 844 }, colorScheme: "dark", reducedMotion: "reduce" });
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      for (const [name, route] of [["lobby", "/play"], ["game", "/game/fixture"], ["learn", "/learn/glossary"], ["community", "/community/users"]]) {
        await page.goto(origin + route);
        await page.waitForFunction(() => window.__redesignReady);
        if (name === "lobby") await page.getByText("Classic", { exact: true }).first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        assert.deepEqual(errors, [], `${name} ${width}: runtime errors`);
        await page.screenshot({ path: path.join(shots, `${name}-${width}.png`), fullPage: false, animations: "disabled" });
        if (width < 900 && name !== "game") {
          await page.locator(".site-wrapper").evaluate(element => { element.scrollTop = element.scrollHeight; });
          await page.screenshot({ path: path.join(shots, `${name}-bottom-${width}.png`), fullPage: false, animations: "disabled" });
          await page.locator(".site-wrapper").evaluate(element => { element.scrollTop = 0; });
        }
        const layout = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
        if (runChecks) assert.ok(layout.document <= width, `${name} overflows at ${width}: ${layout.document}`);
        report.push({ name, width, ...layout });
        if (runChecks && name === "lobby" && width > 900) {
          await page.locator(".site-wrapper").evaluate(element => { element.scrollTop = element.scrollHeight; });
          const footer = page.getByRole("contentinfo");
          assert.ok(await footer.getByRole("link", { name: "Terms of Service" }).isVisible());
          assert.ok(await footer.getByRole("link", { name: "Privacy Policy" }).isVisible());
          assert.equal(await footer.getByRole("link", { name: "Additional music by Jumpy" }).getAttribute("href"), "/user/2oDrE3Ueq");
          await page.screenshot({ path: path.join(shots, "footer-1440.png"), animations: "disabled" });
          report.push({ name: "footer", width });
          await page.locator(".site-wrapper").evaluate(element => { element.scrollTop = 0; });
        }
        if (runChecks && name === "lobby") {
          if (width < 900) {
            const bounds = await page.evaluate(() => {
              const wrapper = document.querySelector(".site-wrapper").getBoundingClientRect();
              const nav = document.querySelector(".mobile-nav").getBoundingClientRect();
              const cards = [...document.querySelectorAll(".lobby-game-card")].map(element => element.getBoundingClientRect());
              return { wrapperWidth: wrapper.width, firstTop: cards[0].top, visibleCards: cards.filter(rect => rect.top >= 0 && rect.bottom <= nav.top).length };
            });
            assert.ok(bounds.wrapperWidth >= width - 1, `phone content must use the viewport: ${JSON.stringify(bounds)}`);
            assert.ok(bounds.firstTop <= 260, `games must appear without excess chrome: ${JSON.stringify(bounds)}`);
            assert.ok(bounds.visibleCards >= 3, `three ordinary games must fit above navigation: ${JSON.stringify(bounds)}`);
            const logo = await page.locator('.site-header img[alt="Site logo"]').boundingBox();
            assert.ok(logo.width >= 120, "phone logo must remain readable");
          }
          assert.ok(await page.locator(".lobby-game-card .role").count() >= 5, "Role artwork preserved");
          await page.getByRole("button", { name: "Open", exact: true }).click();
          assert.equal(await page.locator(".lobby-game-card").count(), 2);
          await page.getByRole("button", { name: "Search games", exact: true }).click();
          await page.getByRole("searchbox", { name: "Search games on this page" }).fill("not-a-setup");
          await page.getByText("No matching games").waitFor();
          await page.getByRole("button", { name: "Clear filters" }).click();
          assert.equal(await page.locator(".lobby-game-card").count(), 4);
          const join = page.locator('[data-game-id="open"]').getByRole("link", { name: "Join", exact: true });
          assert.ok(await join.isVisible());
          assert.equal(await page.locator('[data-game-id="full"]').getByRole("link", { name: "Join", exact: true }).count(), 0);
          assert.ok(await page.locator('[data-game-id="full"]').getByRole("link", { name: "Spectate", exact: true }).isVisible());
          await page.locator('[data-game-id="open"] .setup-name-trigger').click();
          await page.getByText("Ranked Allowed:", { exact: true }).waitFor();
          await page.keyboard.press("Escape");
          await page.getByText("Ranked Allowed:", { exact: true }).waitFor({ state: "hidden" });
          await page.getByRole("heading", { name: "Community wall", exact: true }).waitFor();
          await page.getByRole("tab", { name: "More", exact: true }).click();
          await page.getByRole("heading", { name: "Stamp Exchange" }).waitFor();
          await page.getByRole("tab", { name: "Games", exact: true }).click();
        }
        if (runChecks && name === "game") {
          await page.locator("#speechInput").fill("Let's compare notes.");
          await page.getByRole("button", { name: "Send message", exact: true }).click();
          assert.ok(await page.evaluate(() => window.__sent.some(([type, data]) => type === "speak" && data.content === "Let's compare notes.")));
          await page.waitForFunction(() => document.querySelector("#speechInput").value === "");
          await page.locator("#speechInput").fill("Second message");
          await page.locator("#speechInput").press("Enter");
          assert.ok(await page.evaluate(() => window.__sent.some(([type, data]) => type === "speak" && data.content === "Second message")));
          await page.waitForFunction(() => document.querySelector("#speechInput").value === "");
          const sentBeforeComposition = await page.evaluate(() => window.__sent.filter(([type]) => type === "speak").length);
          await page.locator("#speechInput").fill("入力中");
          await page.locator("#speechInput").evaluate(input => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, isComposing: true })));
          assert.equal(await page.evaluate(() => window.__sent.filter(([type]) => type === "speak").length), sentBeforeComposition, "IME confirmation must not submit chat");
          if (width < 900) {
            await page.locator("#speechInput").fill("Keep this draft");
            await page.getByRole("button", { name: /Actions/ }).click();
            await page.screenshot({ path: path.join(shots, `vote-${width}.png`), fullPage: false, animations: "disabled" });
          }
          await page.locator(".action-dropdown").getByRole("button").click();
          await page.getByRole("menuitem", { name: "Velvet", exact: true }).click();
          await page.getByRole("menu").waitFor({ state: "hidden" });
          assert.ok(await page.evaluate(() => window.__sent.some(([type]) => type === "vote")));
          const ownVote = page.locator(".vote-row").filter({ has: page.getByRole("button", { name: "Vote: NightOwl", exact: true }) });
          await ownVote.getByText("Voted for Velvet", { exact: true }).waitFor();
          await page.getByRole("button", { name: "Vote: Velvet", exact: true }).click();
          await ownVote.getByText("Voted for Velvet", { exact: true }).waitFor({ state: "hidden" });
          assert.ok(await page.evaluate(() => window.__sent.some(([type]) => type === "unvote")));
          if (width < 900) {
            await page.getByRole("button", { name: "Chat", exact: true }).click();
            assert.equal(await page.locator("#speechInput").inputValue(), "Keep this draft");
          }
        }
        if (runChecks && name === "learn") {
          await page.getByRole("searchbox", { name: "Search terms and commands" }).fill("unfindable-term-xyz");
          await page.getByRole("status").filter({ hasText: "0 results" }).waitFor();
        }
      }
      await page.close();
    }
    for (const [name, route, width = 390] of [["light-lobby", "/play?theme=light"], ["light-game", "/game/fixture?theme=light"], ["guest-lobby", "/play?guest=1"], ["empty-lobby", "/play?empty=1"], ["light-guest-desktop", "/play?guest=1&theme=light", 1440]]) {
      const page = await browser.newPage({ viewport: { width, height: width > 900 ? 1000 : 844 }, colorScheme: name.startsWith("light") ? "light" : "dark" });
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      await page.goto(origin + route);
      await page.waitForFunction(() => window.__redesignReady);
      if (name.includes("lobby") && !name.includes("empty")) await page.getByText("Classic", { exact: true }).first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.deepEqual(errors, [], name);
      await page.screenshot({ path: path.join(shots, `${name}-${width}.png`), fullPage: false, animations: "disabled" });
      report.push({ name, width });
      if (runChecks && name === "guest-lobby") assert.equal(await page.getByRole("link", { name: "Join", exact: true }).count(), 0);
      if (runChecks && name === "empty-lobby") await page.getByRole("heading", { name: "No games in this lobby" }).waitFor();
      await page.close();
    }
    if (runChecks) {
      for (const width of [1440, 390, 320]) {
        const notice = await browser.newPage({ viewport: { width, height: width > 900 ? 1000 : 844 } });
        const errors = [];
        notice.on("pageerror", error => errors.push(error.message));
        await notice.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
        await notice.goto(origin + "/play?notice=1");
        await notice.getByRole("button", { name: "Read announcement", exact: true }).waitFor();
        assert.equal(await notice.locator(".ios-beta-ticker").count(), 0, "app promotion must not consume permanent page space");
        const bar = await notice.locator(".announcement-notice").boundingBox();
        assert.ok(bar.height <= 48, "unread announcement preview stays compact");
        await notice.screenshot({ path: path.join(shots, `notice-${width}.png`), animations: "disabled" });
        await notice.getByRole("button", { name: "Read announcement", exact: true }).click();
        const dialog = notice.getByRole("dialog", { name: "Announcements", exact: true });
        await dialog.getByText(/Maintenance notice \(test data\)/).waitFor();
        await notice.screenshot({ path: path.join(shots, `notice-dialog-${width}.png`), animations: "disabled" });
        await dialog.getByRole("button", { name: "Older", exact: true }).click();
        await dialog.getByText("Previous announcement (test data).", { exact: true }).waitFor();
        assert.ok(await dialog.getByRole("button", { name: "Older", exact: true }).isDisabled());
        await dialog.getByRole("button", { name: "Newer", exact: true }).click();
        await dialog.getByText(/Maintenance notice \(test data\)/).waitFor();
        await dialog.getByRole("button", { name: "Close", exact: true }).click();
        await notice.getByRole("button", { name: "Read announcement", exact: true }).waitFor({ state: "hidden" });
        assert.equal(await notice.evaluate(() => localStorage.getItem("lastSeenAnnouncementDate")), "1794000000000");
        await notice.getByRole("button", { name: "User menu", exact: true }).click();
        await notice.getByRole("menuitem", { name: /Announcements/ }).click();
        await dialog.getByText(/Maintenance notice \(test data\)/).waitFor();
        await notice.goBack();
        await dialog.waitFor({ state: "hidden" });
        assert.equal(new URL(notice.url()).pathname, "/play", "Back dismisses announcements instead of leaving the page");
        if (width < 900) {
          await notice.getByRole("button", { name: "Menu", exact: true }).click();
          const app = notice.getByRole("menuitem", { name: "iOS app (beta)", exact: true });
          assert.equal(await app.getAttribute("href"), "https://testflight.apple.com/join/xSx8TBzQ");
          await app.scrollIntoViewIfNeeded();
          await notice.screenshot({ path: path.join(shots, `app-menu-${width}.png`), animations: "disabled" });
        }
        assert.deepEqual(errors, []);
        report.push({ name: "announcements", width });
        await notice.close();
      }
      for (const width of [1440, 390, 320]) {
        const chat = await browser.newPage({ viewport: { width, height: width > 900 ? 1000 : 844 } });
        const errors = [];
        chat.on("pageerror", error => errors.push(error.message));
        await chat.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
        await chat.goto(origin + "/play?chat=1");
        await chat.getByRole("tab", { name: "Chat", exact: true }).click();
        await chat.getByText("Anyone joining the next game?", { exact: true }).waitFor();
        await chat.screenshot({ path: path.join(shots, `chat-${width}.png`), animations: "disabled" });
        report.push({ name: "chat", width });
        if (width < 900) {
          const input = await chat.getByRole("textbox", { name: "Chat message" }).boundingBox();
          const nav = await chat.locator(".mobile-nav").boundingBox();
          assert.ok(input.y + input.height <= nav.y, "site chat composer must be visible above navigation");
        }
        await chat.getByRole("textbox", { name: "Chat message" }).fill("Chat button send");
        await chat.getByRole("button", { name: "Send chat message" }).click();
        await chat.getByText("Chat button send", { exact: true }).waitFor();
        await chat.getByRole("textbox", { name: "Chat message" }).fill("Chat Enter send");
        await chat.getByRole("textbox", { name: "Chat message" }).press("Enter");
        await chat.getByText("Chat Enter send", { exact: true }).waitFor();
        await chat.getByRole("textbox", { name: "Chat message" }).fill("Unsent draft");
        await chat.getByRole("tab", { name: "More", exact: true }).click();
        await chat.getByRole("tab", { name: "Chat", exact: true }).click();
        assert.equal(await chat.getByRole("textbox", { name: "Chat message" }).inputValue(), "Unsent draft");
        assert.deepEqual(errors, []);
        if (width === 320) {
          await chat.getByRole("button", { name: "User menu", exact: true }).click();
          await chat.getByText("12 red hearts · 0 gold hearts", { exact: true }).waitFor();
          await chat.waitForFunction(() => [...document.querySelectorAll(".MuiMenu-paper")].some(element => getComputedStyle(element).opacity === "1"));
          await chat.keyboard.press("End");
          await chat.keyboard.press("Home");
          assert.ok(await chat.getByRole("menuitem", { name: /Profile/ }).evaluate(element => element === document.activeElement), "menu links must support native menu keyboard navigation");
          await chat.screenshot({ path: path.join(shots, "account-menu-320.png"), animations: "disabled" });
        }
        await chat.close();
      }
      const pagedNotice = await browser.newPage({ viewport: { width: 320, height: 844 } });
      await pagedNotice.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      await pagedNotice.goto(origin + "/play?notice=1&noticepages=1");
      await pagedNotice.getByRole("button", { name: "Read announcement", exact: true }).click();
      const historyDialog = pagedNotice.getByRole("dialog", { name: "Announcements", exact: true });
      for (let index = 0; index < 4; index++) await historyDialog.getByRole("button", { name: "Older", exact: true }).click();
      await historyDialog.getByText("Earlier announcement 4 (test data).", { exact: true }).waitFor();
      await pagedNotice.evaluate(() => { window.__deferAnnouncementResponse = true; });
      await historyDialog.getByRole("button", { name: "Older", exact: true }).click();
      await pagedNotice.waitForFunction(() => typeof window.__releaseAnnouncementResponse === "function");
      await historyDialog.getByRole("button", { name: "Close", exact: true }).click();
      await pagedNotice.getByRole("button", { name: "User menu", exact: true }).click();
      await pagedNotice.getByRole("menuitem", { name: /Announcements/ }).click();
      await historyDialog.getByText(/Maintenance notice \(test data\)/).waitFor();
      await pagedNotice.evaluate(() => window.__releaseAnnouncementResponse());
      await historyDialog.getByRole("button", { name: "Older", exact: true }).waitFor();
      await pagedNotice.waitForFunction(() => document.querySelector('[aria-labelledby="announcement-title"] [aria-busy]')?.getAttribute("aria-busy") === "false");
      await historyDialog.getByText(/Maintenance notice \(test data\)/).waitFor();
      for (let index = 0; index < 6; index++) await historyDialog.getByRole("button", { name: "Older", exact: true }).click();
      await historyDialog.getByText("Earlier announcement 6 (test data).", { exact: true }).waitFor();
      assert.ok(await historyDialog.getByRole("button", { name: "Older", exact: true }).isDisabled());
      report.push({ name: "announcement-pagination-and-reopen", width: 320 });
      await pagedNotice.close();
      const page = await browser.newPage({ viewport: { width: 320, height: 844 } });
      await page.goto(origin + "/game/fixture?history=1");
      await page.getByRole("combobox", { name: "View phase" }).selectOption("0");
      assert.equal(await page.getByRole("combobox", { name: "View phase" }).inputValue(), "0");
      await page.screenshot({ path: path.join(shots, "history-320.png"), animations: "disabled" });
      await page.getByRole("button", { name: "Return to current" }).click();
      assert.equal(await page.getByRole("combobox", { name: "View phase" }).inputValue(), "1");
      report.push({ name: "history", width: 320 });
      await page.close();
      const stress = await browser.newPage({ viewport: { width: 320, height: 844 } });
      await stress.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      await stress.goto(origin + "/play?long=1");
      await stress.locator(".lobby-game-card").first().waitFor();
      const row = stress.locator(".lobby-game-card").first();
      const artBefore = await row.locator(".setup-summary-roles .role").count();
      await row.getByRole("button", { name: /\+\d+ roles/ }).click();
      assert.ok(await row.locator(".setup-summary-roles .role").count() > artBefore, "large setups must expose all role art on demand");
      await stress.mouse.move(0, 0);
      await stress.locator(".MuiPopover-root").waitFor({ state: "hidden" });
      assert.ok(await row.locator(".setup-summary-roles .role").evaluateAll(elements => elements.every(element => getComputedStyle(element).backgroundImage !== "none")), "each displayed role must have artwork");
      assert.ok(await stress.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await stress.screenshot({ path: path.join(shots, "large-setup-320.png"), animations: "disabled" });
      await stress.locator(".site-wrapper").evaluate(element => { element.scrollTop = element.scrollHeight; });
      const last = await stress.locator(".lobby-game-card").last().boundingBox();
      const nav = await stress.locator(".mobile-nav").boundingBox();
      assert.ok(last.y + last.height <= nav.y, "last game must clear bottom navigation after scrolling");
      await stress.screenshot({ path: path.join(shots, "large-setup-bottom-320.png"), animations: "disabled" });
      report.push({ name: "large-setup", width: 320 });
      await stress.close();
      for (const width of [1440, 320]) {
        const roles = await browser.newPage({ viewport: { width, height: width > 900 ? 1000 : 844 } });
        await roles.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
        await roles.goto(origin + "/game/fixture?roles=1&dead=1");
        if (width < 900) await roles.getByRole("button", { name: /Players/ }).click();
        assert.equal(await roles.locator(".player-list .role").count(), 4, "known and marked role artwork must remain visible");
        assert.equal(await roles.locator(".player-alive-count").innerText(), "6 alive", "roster counts living players, not occupied seats");
        assert.ok(await roles.getByText("Graveyard", { exact: true }).isVisible());
        await roles.locator('[data-player-name="Detective"]').getByRole("button", { name: "Mark player role" }).focus();
        assert.equal(await roles.locator('[data-player-name="Detective"] .player-role-mark-control').evaluate(element => getComputedStyle(element).opacity), "1", "role marking must be available to keyboard users");
        await roles.screenshot({ path: path.join(shots, `players-${width}.png`), animations: "disabled" });
        report.push({ name: "known-roles", width });
        await roles.close();
      }
    }
    fs.writeFileSync(path.join(shots, process.env.DESIGN_VARIANTS_ONLY ? "variant-results.json" : "results.json"), JSON.stringify(report, null, 2));
    console.log(`${phase}: ${report.length} screens captured; runtime and ${phase === "before" ? "baseline" : "layout/interaction"} checks passed. ${shots}`);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
