// Production fixture runner. Isolated browser tooling, no shared dependency
// changes, no live API/database and no external browser traffic.
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

async function main() {
  if (process.platform === "win32") throw new Error("Use Linux/macOS; do not launch a fresh-profile Windows browser for this runner.");
  if (!process.env.PLAYWRIGHT_MODULE) throw new Error("Set PLAYWRIGHT_MODULE to an isolated Playwright installation.");
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(process.argv[2] || "/tmp/opencode/ultimafia-lifecycle-browser");
  if (!fs.existsSync(path.join(directory, "index.html"))) throw new Error("Build the lifecycle fixture first.");
  const mime = { ".html":"text/html", ".js":"application/javascript", ".css":"text/css", ".png":"image/png", ".webp":"image/webp", ".woff2":"font/woff2", ".ttf":"font/ttf" };
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (pathname === "/favicon.ico") { res.writeHead(204); res.end(); return; }
    let filename = path.resolve(directory, "." + pathname);
    if (!filename.startsWith(directory + path.sep)) filename = path.join(directory, "index.html");
    if (!fs.existsSync(filename) || fs.statSync(filename).isDirectory()) filename = path.join(directory, "index.html");
    res.writeHead(200, { "Content-Type":mime[path.extname(filename)] || "application/octet-stream", "Cache-Control":"no-store" });
    fs.createReadStream(filename).pipe(res);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}),
    });
    const page = await browser.newPage({viewport:{width:390,height:844}});
    const errors = [];
    const blocked = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.route("**/*", route => {
      const url = new URL(route.request().url());
      if (url.protocol === "data:" || url.hostname === "127.0.0.1") return route.continue();
      blocked.push(url.origin);
      return route.abort();
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForFunction(() => window.__lifecycleResults, null, {timeout:45000});
    const result = await page.evaluate(() => window.__lifecycleResults);
    console.log(JSON.stringify({ browser:browser.version(), viewport:"390x844", ...result, errors, blocked }, null, 2));
    if (result.failures.length || errors.length || blocked.length) process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
