// Shared browser harness for the structural passes. Builds the production
// route bundle, serves it with local assets only, and opens pages with the
// route-review fixtures active.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawnSync } = require("node:child_process");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "/tmp/opencode/redesign-tools/node_modules/playwright");

const mime = {
  ".html": "text/html", ".js": "application/javascript", ".css": "text/css",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".woff": "font/woff", ".woff2": "font/woff2",
  ".ttf": "font/ttf", ".ico": "image/x-icon", ".json": "application/json", ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg", ".wav": "audio/wav", ".webm": "video/webm", ".mp4": "video/mp4",
};
const fixtureSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="320"><rect width="960" height="320" fill="#263e49"/><path d="M0 230L180 120 360 240 520 100 720 240 960 120V320H0Z" fill="#527b85"/><circle cx="800" cy="70" r="32" fill="#d7b77c"/></svg>';

function buildBundle({ cwd, bundle, skip = false }) {
  if (skip) return;
  console.log("building route-review bundle…");
  const result = spawnSync(
    path.join(cwd, "node_modules/.bin/rsbuild"),
    ["build", "--no-env", "--config", "rsbuild.route-review-test.config.ts"],
    { cwd, env: { ...process.env, ROUTE_BUNDLE_DIR: bundle }, stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`rsbuild exited ${result.status}`);
}

function startServer({ bundle, publicDir }) {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    const pathname = decodeURIComponent(url.pathname);
    if (request.method !== "GET" && request.method !== "HEAD") { response.writeHead(405); return response.end(); }
    if (pathname.startsWith("/uploads/fixture-")) {
      response.writeHead(200, { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" });
      return response.end(fixtureSvg);
    }
    if (pathname.startsWith("/api/") || pathname.startsWith("/uploads/")) { response.writeHead(501); return response.end(); }
    let file;
    for (const base of [bundle, publicDir]) {
      const candidate = path.resolve(base, "." + pathname);
      if (candidate.startsWith(base + path.sep) && mime[path.extname(candidate)] && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) { file = candidate; break; }
    }
    if (!file && !path.extname(pathname)) file = path.join(bundle, "index.html");
    if (!file) { response.writeHead(404); return response.end(); }
    response.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(response);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

async function openPage({ browser, origin, viewport, theme }) {
  const context = await browser.newContext({
    viewport, colorScheme: theme, reducedMotion: "reduce", serviceWorkers: "block",
    locale: "en-US", timezoneId: "UTC",
  });
  const page = await context.newPage();
  const observed = { runtimeErrors: [], consoleErrors: [], blocked: [] };
  page.on("pageerror", (error) => observed.runtimeErrors.push(error.stack || error.message));
  page.on("console", (message) => { if (message.type() === "error") observed.consoleErrors.push(message.text()); });
  page.on("dialog", (dialog) => dialog.dismiss());
  await context.route("**/*", (route) => {
    const target = new URL(route.request().url());
    if (target.origin === origin || ["data:", "blob:"].includes(target.protocol)) return route.continue();
    observed.blocked.push(target.toString());
    return route.abort("blockedbyclient");
  });
  await context.addInitScript(() => {
    const NativeDate = Date;
    const fixed = Date.UTC(2026, 10, 8, 16, 10);
    window.Date = class extends NativeDate {
      constructor(...args) { super(...(args.length ? args : [fixed])); }
      static now() { return fixed; }
    };
    localStorage.setItem("cookieConsent", "rejected");
    localStorage.setItem("cookiePreferences", JSON.stringify({ essential: true, analytics: false, functional: false }));
    document.addEventListener("submit", (event) => event.preventDefault(), true);
  });
  return { page, context, observed };
}

async function waitForRoute(page, origin, { route, mode = "member", theme, selector, text, anyContent }) {
  const url = new URL(route, origin);
  url.searchParams.set("fixtureMode", mode);
  url.searchParams.set("theme", theme);
  await page.goto(String(url), { waitUntil: "load" });
  await page.waitForFunction(() => window.__routeReview?.ready, { timeout: 20000 });
  const content = page.locator("#main-content");
  if (selector) await content.locator(selector).first().waitFor({ state: "attached", timeout: 15000 });
  else if (anyContent) await page.locator("#main-content > *").first().waitFor({ state: "attached", timeout: 15000 });
  else if (text) await content.getByText(text, { exact: false }).first().waitFor({ state: "attached", timeout: 15000 });
  else await content.locator(".ui-page, .inner-content, h1").first().waitFor({ state: "attached", timeout: 15000 });
  await page.waitForFunction(() => window.__routeReview.pending === 0 && performance.now() - window.__routeReview.lastRequestAt > 400, null, { timeout: 15000, polling: 50 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    await Promise.all([...document.images].filter((image) => image.currentSrc).map((image) => image.decode().catch(() => {})));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  return url.pathname + url.search;
}

module.exports = { buildBundle, startServer, openPage, waitForRoute, chromium };
