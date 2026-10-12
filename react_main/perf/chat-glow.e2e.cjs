const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
if (process.platform === "win32")
  throw new Error("Run in Linux/macOS, not fresh-profile Windows Chrome.");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

// Preserve the original independent text shadows as a small visual reference.
// Only eight characters animate here, never the old long-day implementation.
const reference = `@keyframes reference-glow {
  0%, 100% { text-shadow: 0 0 2px currentColor, 0 0 8px currentColor; filter: brightness(1); }
  50% { text-shadow: 0 0 4px currentColor, 0 0 16px currentColor, 0 0 28px currentColor; filter: brightness(1.35); }
}`;
const { nameGlowStyle } = require("../src/utils/nameGlowStyle.js");
const css = fs.readFileSync(
  path.resolve(__dirname, "../src/css/user.css"),
  "utf8"
);
const start = css.indexOf("@keyframes name-color-glow");
assert(start >= 0);
let end = css.indexOf("{", start),
  depth = 1;
for (end++; depth && end < css.length; end++) {
  if (css[end] === "{") depth++;
  if (css[end] === "}") depth--;
}
const production = css.slice(start, end);
assert(
  !production.includes("text-shadow:"),
  "do not restore animated glyph-overflow/layout changes"
);

(async () => {
  let browser;
  try {
    browser = await chromium.launch({
      ...(process.env.CHAT_TEST_CHROMIUM_PATH
        ? { executablePath: process.env.CHAT_TEST_CHROMIUM_PATH }
        : { channel: "chromium" }),
      headless: process.env.CHAT_TEST_HEADED !== "1",
      args:
        process.env.CHAT_TEST_GL === "1"
          ? ["--use-gl=angle", "--use-angle=gl"]
          : [],
    });
    const context = await browser.newContext({
      viewport: { width: 360, height: 160 },
      deviceScaleFactor: 1,
    });
    const fixtureUrl = process.env.CHAT_TEST_FIXTURE_URL;
    const fixtureOrigin = fixtureUrl ? new URL(fixtureUrl).origin : null;
    if (fixtureUrl)
      assert(["localhost", "127.0.0.1"].includes(new URL(fixtureUrl).hostname));
    await context.route("**/*", (route) =>
      fixtureOrigin && new URL(route.request().url()).origin === fixtureOrigin
        ? route.continue()
        : route.abort()
    );
    const page = await context.newPage();
    await page.setContent(`<style>
      html,body{margin:0;background:#151515}
      #tile{width:360px;height:160px;display:flex;align-items:center;justify-content:center}
      #name{display:inline-block;font:700 20px Arial;color:#eee;animation-duration:2000ms;animation-timing-function:linear;animation-iteration-count:infinite}
      ${reference}${production}
      </style><div id="tile"><span id="name">Player12</span></div>`);
    if (process.env.CHAT_TEST_REQUIRE_GPU === "1") {
      const cdp = await browser.newBrowserCDPSession();
      const gpu = (await cdp.send("SystemInfo.getInfo")).gpu;
      assert.equal(gpu.featureStatus.gpu_compositing, "enabled");
      console.log("GPU", gpu.auxAttributes.glRenderer);
    }
    async function pixels(kind, phase, color) {
      await page.evaluate(
        ({ kind, phase, color, glowStyle }) => {
          const name = document.querySelector("#name");
          name.style.color = color;
          for (const [key, value] of Object.entries(glowStyle)) {
            name.style.setProperty(key, value);
          }
          name.style.animationName = "none";
          name.style.filter = "none";
          name.style.textShadow = "none";
          if (kind === "plain")
            name.style.filter = `brightness(${1 + 0.35 * phase})`;
          else {
            name.style.removeProperty("filter");
            name.style.removeProperty("text-shadow");
            name.style.animationName =
              kind === "reference" ? "reference-glow" : "name-color-glow";
            const animation = name.getAnimations()[0];
            animation.pause();
            animation.currentTime = phase * 1000;
          }
        },
        { kind, phase, color, glowStyle: nameGlowStyle(color) }
      );
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve))
          )
      );
      const png = await page.screenshot();
      return page.evaluate(async (data) => {
        const image = new Image();
        image.src = "data:image/png;base64," + data;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = 360;
        canvas.height = 160;
        const drawing = canvas.getContext("2d");
        drawing.drawImage(image, 0, 0);
        return [...drawing.getImageData(0, 0, 360, 160).data];
      }, png.toString("base64"));
    }
    const results = [];
    for (const color of ["#eeeeee", "#60a5fa", "rgba(96, 165, 250, 0.5)"]) {
      for (const phase of [0, 0.25, 0.5, 0.75, 1]) {
        const plain = await pixels("plain", phase, color);
        const baseline = await pixels("reference", phase, color);
        const patched = await pixels("production", phase, color);
        let referenceEnergy = 0,
          patchedEnergy = 0,
          squaredError = 0,
          samples = 0;
        for (let pixel = 0; pixel < plain.length; pixel += 4) {
          // Exclude glyph interiors, so unchanged text cannot mask a brighter halo.
          if (Math.max(plain[pixel], plain[pixel + 1], plain[pixel + 2]) > 23)
            continue;
          for (let channel = 0; channel < 3; channel++) {
            referenceEnergy += Math.max(0, baseline[pixel + channel] - 21);
            patchedEnergy += Math.max(0, patched[pixel + channel] - 21);
            squaredError +=
              (baseline[pixel + channel] - patched[pixel + channel]) ** 2;
            samples++;
          }
        }
        const ratio = patchedEnergy / referenceEnergy;
        const rmse = Math.sqrt(squaredError / samples);
        results.push({ color, phase, ratio, rmse });
        assert(
          Math.abs(ratio - 1) < 0.15,
          `glow halo intensity differs by more than 15%: ${JSON.stringify(results.at(-1))}`
        );
        assert(
          rmse < 2.5,
          `glow halo pixel error is excessive: ${JSON.stringify(results.at(-1))}`
        );
      }
    }
    console.log("GLOW_VISUAL_PARITY_PASS", JSON.stringify(results));
    if (fixtureUrl) {
      await page.setViewportSize({ width: 1280, height: 945 });
      await page.bringToFront();
      await page.goto(fixtureUrl);
      await page.waitForFunction(
        () => document.querySelectorAll(".speech-display > .message").length > 0
      );
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const colors = await page.evaluate(() =>
        [
          ...document.querySelectorAll(
            ".speech-display .name-anim-glow .user-name-text"
          ),
        ]
          .filter((name) => getComputedStyle(name).animationName !== "none")
          .map((name) => {
            const style = getComputedStyle(name);
            return {
              color: style.color
                .match(/[0-9.]+/g)
                .slice(0, 3)
                .map(Number),
              shadow: style.filter
                .match(/rgba?\(([^)]+)\)/)?.[1]
                .match(/[0-9.]+/g)
                .slice(0, 3)
                .map(Number),
            };
          })
      );
      assert(colors.length > 0, "fixture needs a visible glow name");
      for (const { color, shadow } of colors) {
        assert.deepEqual(
          shadow,
          color,
          "glow must follow inherited name color, not the default palette color"
        );
      }
      console.log("GLOW_INHERITED_COMPONENT_COLOR_PASS");
    }
  } finally {
    if (browser) await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
