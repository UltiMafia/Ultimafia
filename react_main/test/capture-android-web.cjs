// Actual Android Chrome/Gboard captures of loopback fixtures, never accounts.
// Prerequisites: isolated emulator, airplane mode, Wi-Fi off; adb reverse of the
// local fixture port; Chrome first-run dismissed without adding an account;
// adb forward tcp:9223 localabstract:chrome_devtools_remote.
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const serial = process.env.ADB_SERIAL || "emulator-5560";
const origin = process.env.LOCAL_PREVIEW_ORIGIN || "http://127.0.0.1:3016";
const cdp = process.env.CHROME_CDP_ENDPOINT || "http://127.0.0.1:9223";
const output = path.resolve(__dirname, "../../docs/frontend-redesign/revision-3/references/android-web");
const adb = (...args) => cp.execFileSync("adb", ["-s", serial, ...args], { timeout: 30000 });

async function main() {
  assert.ok(serial.startsWith("emulator-"), "Never operate a physical device with this fixture script");
  for (const url of [origin, cdp]) assert.equal(new URL(url).hostname, "127.0.0.1", "Only loopback destinations are permitted");
  assert.equal(adb("shell", "settings", "get", "global", "airplane_mode_on").toString().trim(), "1");
  assert.equal(adb("shell", "settings", "get", "global", "wifi_on").toString().trim(), "0");
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.connectOverCDP(cdp);
  const page = browser.contexts()[0].pages().find(page => page.url().startsWith(origin + "/"));
  assert.ok(page, "Open the isolated fixture in Android Chrome first");
  const records = [];
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  try {
    async function keyboardCapture(name, editor) {
      await page.waitForFunction(() => document.documentElement.dataset.keyboard === "open");
      // VisualViewport and the OS IME must both report an actual open keyboard.
      const ime = adb("shell", "dumpsys", "input_method").toString();
      const nativeKeyboardOpen = /(?:mInputShown|mIsInputViewShown)=true/.test(ime);
      assert.ok(nativeKeyboardOpen, "The native Android keyboard must be visible");
      const metrics = await page.evaluate(selector => {
        const input = document.querySelector(selector);
        const rect = input.getBoundingClientRect();
        return { innerWidth, innerHeight, visualHeight: visualViewport.height, offsetTop: visualViewport.offsetTop, devicePixelRatio, editor: rect.toJSON(), activeEditor: document.activeElement === input, value: input.value, keyboard: document.documentElement.dataset.keyboard };
      }, editor);
      assert.ok(metrics.activeEditor);
      assert.ok(metrics.editor.bottom <= metrics.offsetTop + metrics.visualHeight, "Editor fits above the actual keyboard");
      fs.writeFileSync(path.join(output, name + ".png"), adb("exec-out", "screencap", "-p"));
      records.push({ name, nativeKeyboardOpen, metrics });
    }
    await page.goto(origin + "/game/fixture?whisper=1");
    await page.locator("#speechInput").click();
    adb("shell", "input", "text", "Testing%sthe%smobile%seditor");
    await keyboardCapture("game-keyboard", "#speechInput");
    await page.getByText("Village · Day 1 · Live", { exact: true }).waitFor();
    adb("shell", "input", "keyevent", "66");
    await page.waitForFunction(() => document.querySelector("#speechInput").value === "");
    assert.ok(await page.evaluate(() => window.__sent.some(([type, data]) => type === "speak" && data.content === "Testing the mobile editor")));
    await keyboardCapture("game-after-native-enter", "#speechInput");
    await page.goto(origin + "/play?dm=1&dmpos=1");
    await page.getByTestId("dm-input").click();
    adb("shell", "input", "text", "A%sdirect%smessage%sdraft");
    await keyboardCapture("dm-keyboard", '[data-testid="dm-input"]');
    adb("shell", "input", "keyevent", "66");
    await page.waitForFunction(() => document.querySelector('[data-testid="dm-input"]').value === "");
    assert.ok(await page.evaluate(() => window.__chatSent.some(([type, content]) => type === "sendMessage" && content === "A direct message draft")));
    await keyboardCapture("dm-after-native-enter", '[data-testid="dm-input"]');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, "capture-metadata.json"), JSON.stringify({ serial, browser: browser.version(), origin, isolation: "Fresh offline emulator; airplane mode; Wi-Fi off; proxy rejects external traffic; Chrome without an account; adb reverse to local synthetic fixture only.", evidence: "Native screencap with actual Android keyboard, not viewport simulation. Native Enter sends to controlled transports and keeps focus/keyboard open. Not physical-device or iOS verification.", records, errors }, null, 2));
    console.log(`Captured and verified ${records.length} actual Android web keyboard states: ${output}`);
  } finally {
    await page.unroute("**/*");
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
