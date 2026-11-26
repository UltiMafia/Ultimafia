const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
async function main() {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const directory = "/tmp/ultimafia-duration-browser";
  const server = http.createServer((req, res) => {
    const name = path.resolve(directory, "." + new URL(req.url, "http://localhost").pathname);
    if (name !== directory && !name.startsWith(directory + path.sep)) return res.writeHead(403).end();
    const file = fs.existsSync(name) && fs.statSync(name).isFile() ? name : path.join(directory, "index.html");
    res.setHeader("Content-Type", { ".js": "text/javascript", ".css": "text/css", ".html": "text/html" }[path.extname(file)] || "application/octet-stream");
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true });
  let cases = 0;
  try {
    for (const width of [1200, 390]) {
      for (const mode of ["ranked", "competitive"]) {
        for (const initial of [false, true]) {
          const page = await browser.newPage({ viewport: { width, height: 1100 } });
          const errors = [];
          page.on("pageerror", error => errors.push(error.message));
          await page.goto(`http://127.0.0.1:${server.address().port}/?mode=${initial ? mode : ""}`);
          const config = page.getByRole("checkbox", { name: "Configure Duration", exact: true });
          const pregame = page.getByRole("spinbutton", { name: "Pregame Wait (hours)", exact: true });
          const lengths = ["Day Length (minutes)", "Night Length (minutes)", "Extension Length (minutes)"];
          if (!initial) {
            await config.check();
            for (const name of lengths) {
              const input = page.getByRole("spinbutton", { name, exact: true });
              await input.fill("1");
            }
            await pregame.fill("4");
            await page.getByRole("checkbox", { name: mode === "ranked" ? "Ranked" : "Competitive", exact: true }).check();
          }
          assert.equal(await config.count(), 0, `${mode}: no generic duration toggle`);
          for (const name of lengths) assert.equal(await page.getByRole("spinbutton", { name, exact: true }).count(), 0, `${mode}: hides ${name}`);
          await pregame.fill("3");
          await page.getByRole("button", { name: "Submit fixture" }).click();
          await page.waitForFunction(() => window.__hostPayload);
          const payload = await page.evaluate(() => window.__hostPayload);
          assert.equal(Number(payload.pregameWaitLength), 3);
          assert.equal(payload[mode], true);
          assert.equal(Object.hasOwn(payload, "stateLengths"), false, "hidden phase values must not be submitted");
          assert.equal(Object.hasOwn(payload, "extendLength"), false, "hidden extension must not be submitted");
          if (process.env.SCREENSHOT_DIR && !initial) await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `duration-${mode}-${width}.png`), fullPage: true });
          await page.getByRole("checkbox", { name: mode === "ranked" ? "Ranked" : "Competitive", exact: true }).uncheck();
          await config.check();
          for (const name of lengths) await page.getByRole("spinbutton", { name, exact: true }).waitFor();
          if (!initial) {
            for (const name of lengths) assert.equal(await page.getByRole("spinbutton", { name, exact: true }).inputValue(), "1");
          }
          await pregame.fill("2");
          await page.evaluate(() => { delete window.__hostPayload; });
          await page.getByRole("button", { name: "Submit fixture" }).click();
          await page.waitForFunction(() => window.__hostPayload);
          const unrestricted = await page.evaluate(() => window.__hostPayload);
          assert.ok(Object.hasOwn(unrestricted, "stateLengths"));
          assert.ok(Object.hasOwn(unrestricted, "extendLength"));
          assert.equal(Number(unrestricted.stateLengths.Day), initial ? 10 : 1);
          assert.equal(Number(unrestricted.stateLengths.Night), initial ? 2 : 1);
          assert.equal(Number(unrestricted.extendLength), initial ? 3 : 1);
          assert.equal(Number(unrestricted.pregameWaitLength), 2);
          await config.uncheck();
          for (const name of [...lengths, "Pregame Wait (hours)"]) assert.equal(await page.getByRole("spinbutton", { name, exact: true }).count(), 0);
          assert.deepEqual(errors, []);
          console.log(`PASS ${width}px ${mode} ${initial ? "initial" : "mode-switch"}: visibility, payload, pregame, unrestricted controls`);
          cases++;
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
  console.log(`${cases} duration browser cases passed`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
