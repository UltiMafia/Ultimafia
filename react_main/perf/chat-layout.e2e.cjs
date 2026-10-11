/* Run against the production-built perf:chat fixture; see docs/testing-mobile-chat.md. */
const assert = require("node:assert/strict");
// This runner creates a fresh browser profile. Do not repeat local Windows
// launches: this investigation encountered an account lockout during them.
// Use a Linux/macOS host or CI instead; fail before importing/launching a browser.
if (process.platform === "win32") {
  throw new Error("Run this fresh-profile browser test on Linux/macOS or CI, not Windows.");
}
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const url = process.env.CHAT_TEST_URL || "http://127.0.0.1:3002";
const sentence = "the quick brown fox jumps over the lazy dog";

async function load(page, count) {
  await page.getByRole("button", { name: `Load ${count.toLocaleString("en-US")}`, exact: true }).click();
  await page.waitForFunction((expected) =>
    document.querySelectorAll(".speech-display .message").length === expected, count);
  await page.waitForTimeout(300);
}

async function scrollInfo(page) {
  return page.locator(".speech-display").evaluate((el) => ({
    top: el.scrollTop, height: el.clientHeight, end: el.scrollHeight,
  }));
}

async function atBottom(page) {
  await page.waitForFunction(() => {
    const el = document.querySelector(".speech-display");
    return el.scrollHeight - el.clientHeight - el.scrollTop <= 10;
  });
}

async function measureTyping(page, session, count) {
  await load(page, count);
  await page.locator("#speechInput").focus();
  // Exclude loading, focus styles, and scroll-to-bottom from the typing interval.
  await page.waitForTimeout(200);
  const before = (await session.send("Performance.getMetrics")).metrics;
  await page.locator("#speechInput").pressSequentially(sentence);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const after = (await session.send("Performance.getMetrics")).metrics;
  const metrics = Object.fromEntries(after.filter((m) =>
    ["LayoutDuration", "RecalcStyleDuration", "ScriptDuration", "TaskDuration"].includes(m.name))
    .map((m) => [m.name, m.value - before.find((b) => b.name === m.name).value]));
  assert.equal(await page.locator("#speechInput").inputValue(), sentence);
  await page.locator("#speechInput").fill("");
  console.log(JSON.stringify({ count, ...metrics }));
  return metrics;
}

async function checkChat(page, layout) {
  // Start each behavior case with a fresh follow-scroll state.
  await page.reload();
  await page.waitForSelector("#speechInput");
  await page.locator("select").selectOption(layout);
  await load(page, 5000);
  await atBottom(page);
  const initial = await scrollInfo(page);
  assert(initial.height > 100, "the transcript must have usable height");
  const inputBox = await page.locator("#speechInput").boundingBox();
  assert(inputBox && inputBox.y >= 0 && inputBox.y + inputBox.height <= page.viewportSize().height,
    "the input must remain visible");
  await page.locator("#speechInput").fill(`sent in ${layout}`);
  await page.locator("#speechInput").press("Enter");
  await page.waitForFunction(() => document.querySelector("#speechInput").value === "");
  await page.waitForFunction(() => document.querySelectorAll(".speech-display .message").length === 5001);
  assert((await page.locator(".speech-display .message").last().textContent()).includes(`sent in ${layout}`));
  await atBottom(page);
  await page.getByRole("button", { name: "Add one", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".speech-display .message").length === 5002);
  await atBottom(page);

  // Moving the mouse enables the real desktop follow-scroll logic.
  await page.mouse.move(100, 300);
  await page.locator(".speech-display").evaluate((el) => { el.scrollTop = el.scrollHeight / 2; });
  await page.waitForTimeout(150);
  const reading = await scrollInfo(page);
  await page.getByRole("button", { name: "Add one", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".speech-display .message").length === 5003);
  await page.waitForTimeout(150);
  assert(Math.abs((await scrollInfo(page)).top - reading.top) <= 2, "incoming messages must not yank a reader to the bottom");

  // Old messages remain present and accessible; no truncation/virtualization.
  const first = page.locator(".speech-display .message").first();
  await first.scrollIntoViewIfNeeded();
  const original = await first.locator(".content").textContent();
  await first.dblclick();
  await page.waitForFunction(() => document.querySelectorAll(".speech-display .message").length === 5004);
  const quote = page.locator(".speech-display .quote-content").last();
  assert.equal(await quote.textContent(), original);
  await first.hover();
  await first.locator(".pin-button-wrapper i").click();
  assert((await page.locator(".perf-controls").textContent()).includes("1 pinned"));
  await first.hover();
  await first.locator(".pin-button-wrapper i").click();
  assert((await page.locator(".perf-controls").textContent()).includes("0 pinned"));

  await page.getByRole("button", { name: "Load 0", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".speech-display .message").length === 0);
  assert((await scrollInfo(page)).height > 100, "empty chat must not collapse");
  console.log(`PASS chat behavior: ${layout}`);
}

(async () => {
  // Leave GPU acceleration enabled. An explicit channel may be supplied when
  // comparing against an installed browser on the non-Windows test host.
  const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL || "chromium", headless: true,
  });
  try {
    const gpu = (await (await browser.newBrowserCDPSession()).send("SystemInfo.getInfo")).gpu;
    console.log(`GPU: ${gpu.auxAttributes.glRenderer}; compositing=${gpu.featureStatus.gpu_compositing}`);
    const page = await browser.newPage({ viewport: { width: 873, height: 945 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    await page.waitForSelector("#speechInput");
    const session = await page.context().newCDPSession(page);
    await session.send("Performance.enable");
    const small = await measureTyping(page, session, 100);
    const large = await measureTyping(page, session, 5000);
    // Relative budget plus 30 ms slack tolerates host noise, but catches the
    // old full-transcript layout traversal (~0.8–1.1 s for this sentence).
    assert(large.LayoutDuration <= small.LayoutDuration * 5 + 0.03,
      `typing layout scales with history: 100=${small.LayoutDuration}s, 5000=${large.LayoutDuration}s`);
    await measureTyping(page, session, 10000);
    await page.setViewportSize({ width: 1280, height: 945 });
    for (const layout of ["default", "defaultLarge", "compactInline", "compactAligned"]) {
      await checkChat(page, layout);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.waitForSelector("#speechInput");
    await load(page, 5000);
    await atBottom(page);
    assert((await scrollInfo(page)).height > 100);
    await page.locator("#speechInput").fill("phone-sized viewport");
    await page.locator("#speechInput").press("Enter");
    await page.waitForFunction(() => document.querySelector("#speechInput").value === "");
    await atBottom(page);
    assert.deepEqual(errors, [], "no unhandled page exceptions");
    console.log("PASS phone-sized viewport and page-error checks");
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
