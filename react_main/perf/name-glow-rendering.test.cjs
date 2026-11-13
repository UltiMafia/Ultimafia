// Real production CSS + reporter's font, including WebKit's filter paint path.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { webkit, chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { nameGlowStyle } = require("../src/utils/nameGlowStyle.js");
const root = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(root, "src/css/user.css"), "utf8");
const font = fs.readFileSync(path.join(root, "src/fonts/spooky.ttf")).toString("base64");

(async () => {
  const results = [];
  for (const [engineName, engine] of [["webkit", webkit], ["chromium", chromium]]) {
    const browser = await engine.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 180 }, deviceScaleFactor: 1 });
      for (const theme of ["dark", "light"]) {
        for (const name of ["ASPECT8445", "Galaga"]) {
          for (const animationName of ["glow", "pulse"]) {
          await page.setContent(`<style>
            @font-face { font-family: Spooky; src: url(data:font/ttf;base64,${font}); }
            body { margin: 0; background: ${theme === "dark" ? "#242223" : "#f4f1f3"}; }
            #tile { padding: 55px 40px; font-size: 40px; font-weight: 700; }
            ${css}
          </style><div id="tile"><span class="user-name name-font-spooky name-anim-${animationName}" style="color:#e6e6ff"><span class="user-name-text">${name}</span></span></div>`);
          await page.evaluate((style) => {
            const name = document.querySelector(".user-name-text");
            for (const [key, value] of Object.entries(style)) name.style.setProperty(key, value);
          }, nameGlowStyle("#e6e6ff"));
          await page.evaluate(() => document.fonts.ready);
          await page.evaluate((time) => document.getAnimations().forEach(animation => {
            animation.pause();
            animation.currentTime = time;
          }), animationName === "glow" ? 800 : 550);
          const rect = await page.locator(".user-name-text").boundingBox();
          const png = await page.screenshot();
          const paint = await page.evaluate(async ({ image, rect }) => {
            const img = new Image();
            img.src = "data:image/png;base64," + image;
            await img.decode();
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const means = [-2, -1, 0, 1].map(dy => {
              const data = ctx.getImageData(Math.ceil(rect.x) + 5, Math.floor(rect.y) + dy, Math.floor(rect.width) - 10, 1).data;
              let total = 0;
              for (let i = 0; i < data.length; i += 4) total += (data[i] + data[i + 1] + data[i + 2]) / 3;
              return total / (data.length / 4);
            });
            const style = getComputedStyle(document.querySelector(".user-name-text"));
            return { means, edgeJump: Math.abs(means[2] - means[1]), filter: style.filter, shadow: style.textShadow };
          }, { image: png.toString("base64"), rect });
          const result = { engine: engineName, theme, name, animation: animationName, ...paint };
          results.push(result);
          assert(paint.edgeJump < 8, `halo must not start at a rectangular element boundary: ${JSON.stringify(result)}`);
          if (animationName === "glow") {
            assert.equal(paint.filter, "none", "glow must not clip its text-shadow through a filter layer");
            assert.notEqual(paint.shadow, "none", "retain the animated glyph halo");
          } else {
            // Pulse generates its halo as a filter output, not a pre-existing
            // text-shadow being clipped as filter input. It has no hard edge in
            // either engine and retains its opacity/scale/drop-shadow effect.
            assert.match(paint.filter, /drop-shadow\(/);
          }
          if (process.env.GLOW_SCREENSHOT_DIR) {
            fs.mkdirSync(process.env.GLOW_SCREENSHOT_DIR, { recursive: true });
            fs.writeFileSync(path.join(process.env.GLOW_SCREENSHOT_DIR, `${engineName}-${theme}-${name}-${animationName}.png`), png);
          }
          }
        }
      }
    } finally { await browser.close(); }
  }
  console.log("GLOW_RECTANGLE_REGRESSION_PASS", JSON.stringify(results));
})().catch(error => { console.error(error); process.exitCode = 1; });
