// Real MessageRow + SpeechInput, stubbed transport. Chromium uses native CDP
// touch input; WebKit dispatches DOM touch events (not a physical iOS keyboard).
// PLAYWRIGHT_MODULE=/path/to/playwright npm run test:mobile-reply:browser
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const playwright = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const directory = path.resolve(process.argv[2] || process.env.CHAT_REPLY_DIST || "/tmp/ultimafia-chat-reply-browser");
const publicDir = path.resolve(__dirname, "../public");
const mime = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const root = /^\/(css|webfonts|images)\//.test(pathname) ? publicDir : directory;
  let file = path.resolve(root, "." + pathname);
  if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    if (path.extname(pathname)) return res.writeHead(404).end();
    file = path.join(directory, "index.html");
  }
  res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; }
const row = (id = "m2aaaaaa") => `.message[data-message-id="${id}"]`;
async function run(engine, url) {
  const browser = await playwright[engine].launch();
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("Failed to load resource")) errors.push(m.text()); });
    await page.route("**/*", (r) => r.request().url().startsWith(url) ? r.continue() : r.abort());
    const cdp = engine === "chromium" ? await context.newCDPSession(page) : null;
    let targetSelector;
    async function touch(type, x, y, multi = false) {
      if (cdp) {
        const points = type === "touchEnd" || type === "touchCancel" ? [] : [{ x, y, id: 1 }, ...(multi ? [{ x: x + 20, y: y + 10, id: 2 }] : [])];
        await cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points });
      } else {
        await page.locator(targetSelector).first().evaluate((el, { type, x, y, multi }) => {
          const name = { touchStart: "touchstart", touchMove: "touchmove", touchEnd: "touchend", touchCancel: "touchcancel" }[type];
          const point = { identifier: 1, clientX: x, clientY: y, target: el };
          const end = type === "touchEnd" || type === "touchCancel";
          const e = new Event(name, { bubbles: true, cancelable: true });
          Object.defineProperties(e, { touches: { value: end ? [] : [point, ...(multi ? [{ ...point, identifier: 2, clientX: x + 20 }] : [])] }, changedTouches: { value: [point] } });
          el.dispatchEvent(e);
        }, { type, x, y, multi });
      }
    }
    async function open(query = "") {
      await page.goto(url + "?mobile=1&st=1&" + query);
      await page.waitForFunction(() => window.__ready).catch((e) => { throw new Error(`${e.message}; browser errors: ${errors.join("; ")}`); });
      await page.evaluate(() => document.fonts.ready);
      await page.locator(row()).scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
    }
    async function start(selector = row() + " .content") {
      targetSelector = selector;
      const el = page.locator(selector).first();
      await el.scrollIntoViewIfNeeded();
      const b = await el.boundingBox();
      const p = { x: Math.min(320, b.x + b.width - 8), y: b.y + Math.min(12, b.height / 2) };
      await touch("touchStart", p.x, p.y);
      return p;
    }
    async function move(p, dx, dy = 0) {
      for (let i = 1; i <= 6; i++) {
        await touch("touchMove", p.x + dx * i / 6, p.y + dy * i / 6);
        await page.waitForTimeout(20);
      }
    }
    async function end(p, dx, dy = 0, cancel = false) {
      await touch(cancel ? "touchCancel" : "touchEnd", p.x + dx, p.y + dy);
      await page.waitForTimeout(80);
    }
    const calls = () => page.evaluate(() => window.__replies.slice());
    async function shot(name) {
      if (!process.env.SCREENSHOT_DIR) return;
      fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `${engine}-${name}.png`) });
    }
    for (const layout of ["default", "defaultLarge", "compactInline", "compactAligned"]) {
      await open(`layout=${layout}`);
      const p = await start();
      await move(p, -90);
      check((await calls()).length === 0, `${engine}/${layout}: no reply before release`);
      check(await page.locator(row()).evaluate((el) => el.classList.contains("reply-swipe-ready") && getComputedStyle(el).transform.includes("-88")), `${engine}/${layout}: row follows the swipe and arms the reply cue`);
      if (layout === "default") {
        check(await page.locator(row()).evaluate((el) => getComputedStyle(el, "::after").content.includes("\uf3e5") && getComputedStyle(el, "::after").opacity === "1"), `${engine}: visible reply glyph at the threshold`);
        await shot("swipe-held");
      }
      await end(p, -90);
      check((await calls()).join() === "m2aaaaaa", `${engine}/${layout}: left swipe replies once on release`);
      check(await page.locator(".reply-preview").innerText().then((t) => t.includes("Replying to Bob")), `${engine}/${layout}: real composer shows target`);
      check(await page.locator("#speechInput").evaluate((el) => el === document.activeElement), `${engine}/${layout}: composer focused`);
      check(await page.evaluate(() => window.__pins.length === 0), `${engine}/${layout}: swipe does not pin`);
      if (layout === "default") await shot("reply-composer");
      await page.locator('[aria-label="Cancel reply"]').click();
      check(await page.locator(".reply-preview").count() === 0, `${engine}/${layout}: reply can be cancelled`);
      const again = await start();
      await move(again, -90); await end(again, -90);
      await page.locator("#speechInput").fill("I agree with Bob.");
      await page.locator("#speechInput").press("Enter");
      const sent = await page.evaluate(() => window.__sent.filter((s) => s.type === "reply"));
      check(sent.length === 1 && sent[0].payload.quote.messageId === "m2aaaaaa" && sent[0].payload.message.content === "I agree with Bob.", `${engine}/${layout}: real composer sends reply payload`);
      check(await page.locator(".reply-preview").count() === 0, `${engine}/${layout}: sending clears target`);
    }
    for (const [name, dx, dy, cancel] of [["short", -25, 0, false], ["right", 65, 0, false], ["vertical", -12, -90, false], ["cancelled", -90, 0, true]]) {
      await open(); const p = await start(); await move(p, dx, dy);
      if (name === "short") check(await page.locator(row()).evaluate((el) => getComputedStyle(el, "::after").backgroundColor !== "rgba(0, 0, 0, 0)"), `${engine}: unarmed reply cue has a theme background`);
      await end(p, dx, dy, cancel);
      await page.waitForTimeout(650);
      check((await calls()).length === 0, `${engine}: ${name} gesture does not reply`);
      check(await page.evaluate(() => window.__pins.length === 0), `${engine}: ${name} movement does not pin`);
    }
    await open();
    { const p = await start(); await end(p, 0); await page.waitForTimeout(300); check((await calls()).length === 0, `${engine}: ordinary tap does not reply`); }
    await open();
    { const p = await start(); await page.waitForTimeout(700); await end(p, 0); check(await page.evaluate(() => window.__pins.join() === "m2aaaaaa"), `${engine}: stationary long press still pins`); check((await calls()).length === 0, `${engine}: long press does not reply`); }
    for (const [query, selector, label] of [["noreply=1", row() + " .content", "no speech permission"], ["sys=1", row("s1aaaaaa") + " .content", "server line"], ["link=1", row() + " a", "link"], ["", row() + " .user-name", "sender name"], ["", ".message.reply-merged .reply-reference", "reply reference"]]) {
      await open(query); const p = await start(selector); await move(p, -90); await end(p, -90);
      check((await calls()).length === 0, `${engine}: ${label} does not start swipe reply`);
    }
    await open();
    {
      await page.locator(row() + " .content").evaluate((el) => {
        const selection = window.getSelection();
        const range = document.createRange(); range.selectNodeContents(el);
        selection.removeAllRanges(); selection.addRange(range);
      });
      const selected = await page.evaluate(() => String(window.getSelection()));
      const p = await start(); await move(p, -90); await end(p, -90);
      check((await calls()).length === 0 && await page.evaluate(() => String(window.getSelection())) === selected, `${engine}: selected text stays selected and does not reply`);
    }
    if (cdp) {
      await open();
      const transcript = page.locator(".speech-display");
      await transcript.evaluate((el) => { el.scrollTop = 0; });
      await page.waitForTimeout(100);
      const before = await transcript.evaluate((el) => el.scrollTop);
      const p = await start(); await move(p, -5, -90); await end(p, -5, -90);
      check(await transcript.evaluate((el) => el.scrollTop) > before, `${engine}: native vertical touch scroll still moves the transcript`);
      check((await calls()).length === 0, `${engine}: native scrolling does not reply`);
    }
    await open();
    { const p = await start(); await touch("touchStart", p.x, p.y, true); await move(p, -90); await end(p, -90); check((await calls()).length === 0, `${engine}: multitouch does not reply`); }
    check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${engine}: no horizontal page overflow`);
    check(errors.length === 0, `${engine}: no browser errors: ${errors.join("; ")}`);
    console.log(`${engine}: mobile swipe, composer, payload and rejection checks passed`);
  } finally { await browser.close(); }
}
(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}/`;
    for (const engine of (process.env.BROWSERS || "chromium,webkit").split(",")) await run(engine, url);
    console.log(`${checks} mobile browser checks passed`);
  } finally { server.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
