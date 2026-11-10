// Real production routes, local records, no service access. Capture each phase
// separately so later verification never overwrites the BEFORE evidence.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const path = require("node:path");
const http = require("node:http");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const { measureUi } = require("./ui-audit/measure.cjs");
const masterEquivalents = require("./ui-audit/master-equivalents.json");
const { reviewMasterTasks } = require("./ui-audit/master-tasks.cjs");
const { reviewAdminTasks } = require("./ui-audit/admin-tasks.cjs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "/tmp/opencode/redesign-tools/node_modules/playwright");
const root = path.resolve(__dirname, "../..");
const upstream = process.env.UI_AUDIT_BRANCH === "master";
const sourceRoot = upstream ? (process.env.UI_AUDIT_MASTER || "/tmp/opencode/ultimafia-master") : root;
const directory = process.env.ROUTE_BUNDLE_DIR || "/tmp/opencode/ultimafia-route-review-browser";
const publicDir = path.join(sourceRoot, "react_main/public");
const phase = process.env.DESIGN_PHASE || "before";
const palette = process.env.ROUTE_THEME || "dark";
const viewports = (process.env.ROUTE_WIDTHS || "1440,390").split(",").map(Number).map(width => ({ width, height: width >= 900 ? 1000 : 844 }));
const artifacts = process.env.ROUTE_OUTPUT_DIR || path.join(root, `docs/frontend-redesign/revision-6/routes-${phase}-${palette}`);
const runName = `run-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const output = path.join(artifacts, runName);
const mime = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".ico": "image/x-icon", ".json": "application/json" };
const staticFailures = [];
const fixtureSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="320" viewBox="0 0 960 320"><rect width="960" height="320" fill="#263e49"/><path d="M0 230L180 120 360 240 520 100 720 240 960 120V320H0Z" fill="#527b85"/><circle cx="800" cy="70" r="32" fill="#d7b77c"/></svg>`;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  const pathname = decodeURIComponent(url.pathname);
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); return res.end("No server mutations"); }
  if (pathname.startsWith("/uploads/fixture-")) {
    res.writeHead(200, { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" });
    return res.end(fixtureSvg);
  }
  if (pathname.startsWith("/api/") || pathname.startsWith("/uploads/") || pathname.split("/").some(part => part.startsWith("."))) {
    staticFailures.push({ pathname, reason: "Unexpected HTTP API/upload request" });
    res.writeHead(501); return res.end("Fixture API belongs to the Axios adapter");
  }
  let file;
  for (const base of [directory, publicDir]) {
    const candidate = path.resolve(base, "." + pathname);
    if (candidate.startsWith(base + path.sep) && mime[path.extname(candidate)] && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) { file = candidate; break; }
  }
  if (!file && !path.extname(pathname)) file = path.join(directory, "index.html");
  if (!file) {
    if (pathname !== "/favicon.ico") staticFailures.push({ pathname, reason: "Missing local static asset" });
    res.writeHead(404); return res.end();
  }
  res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(res);
});
const hash = filename => crypto.createHash("sha256").update(fs.readFileSync(filename)).digest("hex");

async function main() {
  if (upstream) {
    const revision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: sourceRoot, encoding: "utf8" }).trim();
    const required = execFileSync("git", ["rev-parse", "origin/master"], { cwd: root, encoding: "utf8" }).trim();
    if (revision !== required) throw new Error("Master source is not the fetched origin/master; refusing a mislabeled baseline");
    execFileSync("git", ["diff", "--quiet", "HEAD", "--", "react_main/src"], { cwd: sourceRoot });
  }
  fs.mkdirSync(output, { recursive: true });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });
  const compiledAssets = fs.readdirSync(path.join(directory, "static/js"), { recursive: true }).filter(file => file.endsWith(".js")).map(file => ({ file: `static/js/${file}`, sha256: hash(path.join(directory, "static/js", file)) }));
  const report = { phase, runName, origin, viewports, compiledAssets,
    palette, branch: upstream ? "master" : "redesign", data: "controlled-production-component-fixture",
    sourceRevision: execFileSync("git", ["rev-parse", "HEAD"], { cwd: sourceRoot, encoding: "utf8" }).trim(),
    trackedSourceDirty: Boolean(execFileSync("git", ["diff", "HEAD", "--", "react_main/src", "react_main/test", "react_main/scripts"], { cwd: sourceRoot, encoding: "utf8" }).trim()),
    visualAcceptance: false, note: "Captured baseline, not visual acceptance. Phone bottom images are separate viewports, never stitched documents.",
    buildIndexSha256: hash(path.join(directory, "index.html")), cases: [], staticFailures, fatal: null };
  try {
    async function newPage(viewport) {
      const context = await browser.newContext({ viewport, colorScheme: palette, reducedMotion: "reduce", serviceWorkers: "block", locale: "en-US", timezoneId: "UTC" });
      const page = await context.newPage();
      const observed = { runtimeErrors: [], consoleErrors: [], consoleWarnings: [], blockedTraffic: [], failedRequests: [], historyTransitions: [] };
      page.on("pageerror", error => observed.runtimeErrors.push(error.stack || error.message));
      page.on("console", message => {
        if (message.text().startsWith('UI_AUDIT_HISTORY ')) observed.historyTransitions.push(JSON.parse(message.text().slice(17)));
        if (message.type() === "error") observed.consoleErrors.push(message.text());
        if (message.type() === "warning") observed.consoleWarnings.push(message.text());
      });
      page.on("requestfailed", request => observed.failedRequests.push({ url: request.url(), failure: request.failure()?.errorText }));
      page.on("dialog", dialog => dialog.dismiss());
      await context.route("**/*", route => {
        const requestUrl = new URL(route.request().url());
        if (requestUrl.origin === origin) {
          if (!["GET", "HEAD", "OPTIONS"].includes(route.request().method())) {
            observed.blockedTraffic.push({ url: requestUrl.toString(), method: route.request().method(), body: route.request().postData(), reason: "Browser mutation recorded and refused locally" });
            return route.fulfill({ status: 405, contentType: "application/json", body: JSON.stringify({ error: "Route fixture is read-only" }) });
          }
          return route.continue();
        }
        if (["data:", "blob:"].includes(requestUrl.protocol)) return route.continue();
        observed.blockedTraffic.push({ url: requestUrl.toString(), method: route.request().method(), type: route.request().resourceType() });
        return route.abort("blockedbyclient");
      });
      await context.addInitScript(({ traceHistory }) => {
        if (traceHistory) {
          for (const method of ['pushState', 'replaceState', 'back', 'go']) {
            const original = window.history[method];
            window.history[method] = function (...args) {
              console.debug('UI_AUDIT_HISTORY ' + JSON.stringify({ method, state: this.state, nextState: ['pushState', 'replaceState'].includes(method) ? args[0] : undefined }));
              return original.apply(this, args);
            };
          }
          window.addEventListener('popstate', () => console.debug('UI_AUDIT_HISTORY ' + JSON.stringify({ method: 'popstate', state: window.history.state })));
        }
        window.__routeReviewLocalWrites = [];
        const NativeDate = Date;
        const fixedNow = Date.UTC(2026, 10, 8, 16, 10);
        window.Date = class extends NativeDate {
          constructor(...args) { super(...(args.length ? args : [fixedNow])); }
          static now() { return fixedNow; }
        };
        for (const name of ["setItem", "removeItem", "clear"]) {
          const original = Storage.prototype[name];
          Storage.prototype[name] = function (...args) {
            window.__routeReviewLocalWrites.push({ type: `storage-${name}`, args });
            return original.apply(this, args);
          };
        }
        // Fresh isolated browser storage, not an actual account or saved session.
        localStorage.setItem("cookieConsent", "rejected");
        localStorage.setItem("cookiePreferences", JSON.stringify({ essential: true, analytics: false, functional: false }));
        navigator.sendBeacon = (url, data) => { window.__routeReviewLocalWrites.push({ type: "beacon", url: String(url), data: String(data || "") }); return false; };
        const nativeFetch = window.fetch;
        window.fetch = (...args) => {
          const url = new URL(typeof args[0] === "string" ? args[0] : args[0].url, location.origin);
          if (url.origin !== location.origin) {
            window.__routeReviewLocalWrites.push({ type: "blocked-fetch", url: String(url) });
            return Promise.reject(new Error("Non-loopback fetch blocked by route-review fixture"));
          }
          return nativeFetch(...args);
        };
        // Never allow a browser form to navigate to an auth/provider endpoint.
        document.addEventListener("submit", event => { event.preventDefault(); window.__routeReviewLocalWrites.push({ type: "form-submit-blocked" }); }, true);
      }, { traceHistory: process.env.ROUTE_HISTORY_TRACE === '1' });
      return { page, context, observed };
    }
    const bootstrap = await newPage({ width: 1440, height: 1000 });
    await bootstrap.page.goto(origin + `/policy/rules?theme=${palette}`, { waitUntil: "load" });
    await bootstrap.page.waitForFunction(() => window.__routeReview?.ready, { timeout: 15000 });
    let cases = await bootstrap.page.evaluate(() => window.__routeReview.cases);
    await bootstrap.context.close();
    if (process.env.ROUTE_CASES) {
      const selected = process.env.ROUTE_CASES.split(",");
      cases = cases.filter(item => selected.includes(item.name));
      if (!cases.length) throw new Error("ROUTE_CASES selected no configured cases");
    }
    for (const viewport of report.viewports) {
      for (const item of cases) {
        const { page, context, observed } = await newPage(viewport);
         const entry = { ...item, viewport, ...observed, screenshots: [], measurements: [], status: "pending", visualAcceptance: false };
         const masterEquivalent = upstream ? masterEquivalents[item.name] : null;
         if (upstream) entry.masterEquivalent = masterEquivalent || { equivalence: "same-route", route: item.route };
        const requestStart = staticFailures.length;
        try {
          const url = new URL(masterEquivalent?.route || item.route, origin);
          if (upstream && item.name === "authentication") url.pathname = "/welcome";
          url.searchParams.set("fixtureMode", item.mode || "member");
          url.searchParams.set("theme", palette);
          entry.captureRoute = url.pathname + url.search;
          await page.goto(String(url), { waitUntil: "load" });
          await page.waitForFunction(() => window.__routeReview?.ready, { timeout: 15000 });
          // The marker must come from production route content, not Header/sidebar.
          const content = page.locator(upstream ? ".inner-container" : "#main-content");
          if (masterEquivalent?.selector) await (masterEquivalent.selector === ".inner-container" ? content : content.locator(masterEquivalent.selector)).first().waitFor({ state: "attached", timeout: 10000 });
          else if (upstream && item.name === "players") await content.locator('.newest-users').first().waitFor({ state: "attached", timeout: 10000 });
          else if (item.selector) await content.locator(item.selector).first().waitFor({ state: "attached", timeout: 10000 });
          else await content.getByText(item.text, { exact: false }).first().waitFor({ state: "attached", timeout: 10000 });
          await page.waitForFunction(() => window.__routeReview.pending === 0 && performance.now() - window.__routeReview.lastRequestAt > 400, null, { timeout: 10000, polling: 50 });
          await page.evaluate(() => document.fonts.ready);
          await page.evaluate(async () => {
            await Promise.all([...document.images].filter(image => image.currentSrc).map(image => image.decode().catch(() => {})));
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          });
          await page.locator(upstream ? ".app-shell" : ".site-header").waitFor({ state: "visible", timeout: 3000 });
          if (upstream) await content.evaluate(element => { element.id = "main-content"; });
          const shell = await geometry(page);
          if (shell.contentWidth < viewport.width / 2 || shell.clientHeight < 200) throw new Error(`Hidden or undersized production shell: ${JSON.stringify(shell)}`);
          if (await page.locator("[data-route-review-failure]").count()) throw new Error("Production route error boundary displayed");
          const fixture = await page.evaluate(() => window.__routeReview);
           if (masterEquivalent?.requireReadFailure) assert.equal(fixture.simulatedReadFailures, 1, "The paired master state must consume the same explicit read failure");
           if (fixture.errors.length || fixture.unresolved.length || observed.runtimeErrors.length) throw new Error("Runtime error or unresolved fixture contract (see JSON)");
           if (phase === "after" && !upstream) entry.layoutChecks = await checkLayout(page, item);
          const filename = `${item.name}-${viewport.width}-top.png`;
          await page.screenshot({ path: path.join(output, filename), fullPage: false, animations: "disabled" });
           entry.screenshots.push(filename);
           entry.measurements.push({ state: "default", position: "top", screenshot: filename, ...await page.evaluate(measureUi) });
          entry.topGeometry = await geometry(page);
          // Also capture desktop bottoms for long routes; every capture is a viewport.
           await page.locator(".site-wrapper").evaluate(element => { element.scrollTop = element.scrollHeight; });
           if (upstream) await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          const bottom = `${item.name}-${viewport.width}-bottom.png`;
          await page.screenshot({ path: path.join(output, bottom), fullPage: false, animations: "disabled" });
           entry.screenshots.push(bottom);
           entry.measurements.push({ state: "default", position: "bottom", screenshot: bottom, ...await page.evaluate(measureUi) });
           entry.bottomGeometry = await geometry(page);
            if (phase === "after" && !upstream && ["forum-categories", "forum-board"].includes(item.name)) {
             const disclosure = content.locator(".forum-recent-replies").first();
             await disclosure.locator("summary").click();
             assert.ok(await disclosure.getAttribute("open") !== null, "Activity disclosure opens without navigation");
             assert.ok(await disclosure.locator(".column-item").first().isVisible(), "Older activity remains readable");
             await disclosure.scrollIntoViewIfNeeded();
             const expanded = `${item.name}-${viewport.width}-expanded.png`;
             await page.screenshot({ path: path.join(output, expanded), fullPage: false, animations: "disabled" });
             entry.screenshots.push(expanded);
             await disclosure.locator("summary").click();
           }
           if (!upstream && process.env.ROUTE_CONTROLS === "1" && item.name === "host") {
            await page.locator(".site-wrapper").evaluate(element => { element.scrollTop = 0; });
            await content.getByRole("button", { name: "Host", exact: true }).first().click();
            const dialog = page.getByRole("dialog");
            await dialog.getByRole("button", { name: "Host", exact: true }).waitFor();
            for (const name of ["Advanced Hosting", "Configure Duration"]) {
              const option = dialog.getByRole("checkbox", { name, exact: true });
              if (await option.count() && !(await option.isDisabled())) await option.check();
            }
            await page.screenshot({ path: path.join(output, `host-dialog-${viewport.width}-top.png`), animations: "disabled" });
             entry.screenshots.push(`host-dialog-${viewport.width}-top.png`);
             entry.measurements.push({ state: "host-dialog", position: "top", screenshot: `host-dialog-${viewport.width}-top.png`, ...await page.evaluate(measureUi) });
            await dialog.locator(".MuiDialogContent-root").evaluate(element => { element.scrollTop = element.scrollHeight; });
            await dialog.evaluate(element => { const parent = element.closest(".MuiDialog-container"); parent.scrollTop = parent.scrollHeight; });
            await page.screenshot({ path: path.join(output, `host-dialog-${viewport.width}-bottom.png`), animations: "disabled" });
             entry.screenshots.push(`host-dialog-${viewport.width}-bottom.png`);
             entry.measurements.push({ state: "host-dialog", position: "bottom", screenshot: `host-dialog-${viewport.width}-bottom.png`, ...await page.evaluate(measureUi) });
             await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
           }
            if (process.env.ROUTE_AVATAR_REVIEW === "1" && item.name === "profile-self") {
              await page.locator('.site-wrapper').evaluate(element => { element.scrollTop = 0; });
              await page.locator('.profile-avatar .avatar').hover();
              await page.locator('.profile-avatar .avatar-edit-action').first().click();
              await page.getByRole('dialog').locator('input[type="file"]').setInputFiles(path.resolve(__dirname, '../src/images/logos/logo-default.png'));
              await page.getByRole('img', { name: 'Preview', exact: true }).waitFor();
              const file = `avatar-crop-${viewport.width}.png`;
              await page.screenshot({ path: path.join(output, file), animations: 'disabled' });
              entry.screenshots.push(file);
              if (phase === 'after') {
                const bounds = await page.getByRole('dialog').evaluate(element => ({ width: element.clientWidth, scrollWidth: element.scrollWidth, preview: element.querySelector('[data-avatar-crop]')?.getBoundingClientRect().width }));
                assert.ok(bounds.preview > 0 && bounds.preview < bounds.width && bounds.scrollWidth <= bounds.width + 1, 'Avatar crop fits the actual phone dialog');
              }
              await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
              assert.equal(await page.evaluate(() => window.__routeReview.writes.filter(write => write.type === 'axios' && write.url !== '/api/notifs/read').length), 0);
            }
             if (!upstream && process.env.ROUTE_TASK_REVIEW === "1") entry.taskChecks = await reviewTasks(page, item, viewport, entry);
             if (upstream && process.env.MASTER_TASK_REVIEW === "1") {
               entry.adminEvidence = [];
               const captureMaster = async (state, position = "task", metadata = {}) => {
                 // A task may reload the untouched application for a pending or
                 // failed read. Restore only the measurement marker, not its UI.
                 await page.locator('.inner-container').evaluate(element => { element.id = 'main-content'; });
               const filename = `${item.name}-${viewport.width}-${state}-${position}.png`;
               await page.screenshot({ path: path.join(output, filename), fullPage: false, animations: "disabled" });
               entry.screenshots.push(filename);
               entry.measurements.push({ state, position, screenshot: filename, ...await page.evaluate(measureUi), ...metadata,
                 masterEquivalent: masterEquivalents[`${item.name}.${state}`] || entry.masterEquivalent });
               };
               entry.taskChecks = [...await reviewMasterTasks(page, item, captureMaster), ...await reviewAdminTasks(page, item, captureMaster, { master: true, evidence: entry.adminEvidence })];
             }
          entry.status = "captured-baseline-not-accepted";
        } catch (error) {
          entry.status = "failed-not-accepted";
          entry.failure = error.stack || error.message;
          const diagnostic = `FAILED-${item.name}-${viewport.width}.png`;
          try { await page.screenshot({ path: path.join(output, diagnostic), fullPage: false, animations: "disabled" }); entry.diagnosticScreenshot = diagnostic; } catch (_) { /* error retained above */ }
        } finally {
          entry.fixture = await page.evaluate(() => ({ ...window.__routeReview, cases: undefined, localWrites: window.__routeReviewLocalWrites, pathname: location.pathname, text: document.querySelector("#main-content")?.innerText?.slice(0, 12000), brokenImages: [...document.images].filter(image => image.currentSrc && image.complete && image.naturalWidth === 0).map(image => image.currentSrc) })).catch(() => null);
          entry.staticFailures = staticFailures.slice(requestStart);
          if (entry.fixture?.errors?.length || entry.fixture?.unresolved?.length || entry.runtimeErrors.length) entry.status = "failed-not-accepted";
          if (entry.status === "failed-not-accepted" && entry.screenshots.length) {
            entry.invalidatedScreenshots = entry.screenshots;
            entry.screenshots = [];
          }
          fs.writeFileSync(path.join(output, `${item.name}-${viewport.width}.json`), JSON.stringify(entry, null, 2));
          report.cases.push(entry);
          console.log(`${entry.status}: ${item.name} ${viewport.width} (${entry.screenshots.length} baseline images)`);
          await context.close();
        }
      }
    }
  } catch (error) { report.fatal = error.stack || String(error); }
  finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
    report.counts = { cases: report.cases.length, captured: report.cases.filter(item => item.status === "captured-baseline-not-accepted").length, failed: report.cases.filter(item => item.status === "failed-not-accepted").length };
    fs.writeFileSync(path.join(output, "report.json"), JSON.stringify(report, null, 2));
    const rows = report.cases.map(item => `| ${item.name} | ${item.viewport.width}×${item.viewport.height} | ${item.status} | ${item.screenshots.map(file => `[${file}](${file})`).join(" ") || (item.diagnosticScreenshot ? `[diagnostic only](${item.diagnosticScreenshot})` : "none")} |`).join("\n");
    fs.writeFileSync(path.join(output, "REPORT.md"), `# Route ${phase.toUpperCase()} captures\n\nProduction route components and SiteLayout/Header/Footer; synthetic data only. No services, accounts, auth submissions, or deliberate mutations. Screenshots are capture evidence, not visual acceptance. Failed renders are not accepted captures. All phone images are separate 390×844 viewports.\n\n${JSON.stringify(report.counts)}\n\n| Case | Viewport | Status | Images |\n| --- | --- | --- | --- |\n${rows}\n\nSee each case JSON for exact requests, locally recorded writes, unresolved contracts, console/runtime errors, blocked traffic, and geometry.\n\n${report.fatal || ""}\n`);
    fs.writeFileSync(path.join(artifacts, "latest-run.json"), JSON.stringify({ runName, report: `${runName}/report.json`, counts: report.counts, visualAcceptance: false }, null, 2));
    console.log(`Report: ${path.join(output, "report.json")}`);
    if (report.fatal || report.counts.failed) process.exitCode = 1;
  }
}
async function checkLayout(page, item) {
  const checks = [];
  const headers = await page.locator('[data-ui-page-header] h1').evaluateAll(elements => elements.map(element => {
    const style = getComputedStyle(element);
    const header = element.closest('[data-ui-page-header]');
    const bounds = header.getBoundingClientRect();
    const actions = header.querySelector('.ui-page-actions')?.getBoundingClientRect();
    const copy = header.querySelector('.ui-page-heading-copy').getBoundingClientRect();
    return { title: element.textContent, size: parseFloat(style.fontSize), weight: style.fontWeight, lineHeight: parseFloat(style.lineHeight), margin: style.margin,
      actionsOverflow: actions ? actions.left < bounds.left - 1 || actions.right > bounds.right + 1 || actions.left < -1 || actions.right > innerWidth + 1 : false,
      actionsOverlapCopy: actions ? Math.min(actions.right, copy.right) - Math.max(actions.left, copy.left) > 1 && Math.min(actions.bottom, copy.bottom) - Math.max(actions.top, copy.top) > 1 : false,
    };
  }));
  for (const header of headers) {
    assert.equal(header.size, 24, `${item.name}: ${header.title} uses the page-title scale`);
    assert.equal(header.weight, '700', `${item.name}: page-title weight`);
    assert.ok(Math.abs(header.lineHeight - 31.2) < 0.1, `${item.name}: page-title line height`);
    assert.equal(header.margin, '0px', `${item.name}: no page-specific title margins`);
    assert.equal(header.actionsOverflow, false, `${item.name}: page actions remain inside the header and viewport`);
    assert.equal(header.actionsOverlapCopy, false, `${item.name}: page actions do not overlap title or description`);
  }
  if (headers.length) checks.push('shared-page-header-font-weight-line-height-and-margins');
  if (['developer', 'developer-owner', 'developer-denied', 'invoices'].includes(item.name)) assert.equal(headers.length, 1, `${item.name}: exactly one shared page heading`);
  const shells = await page.locator('.ui-page').evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect(), maximum = parseFloat(getComputedStyle(element).maxWidth);
    const content = element.querySelector(':scope > .ui-page-content');
    return { width: box.width, left: box.left, right: box.right, maximum: Number.isFinite(maximum) ? maximum : null,
      viewport: innerWidth, gap: content ? parseFloat(getComputedStyle(content).gap) : null };
  }));
  for (const shell of shells) {
    assert.ok(shell.width > 0 && (shell.maximum === null || shell.width <= shell.maximum + 1), `${item.name}: named shell width`);
    assert.ok(shell.left >= -1 && shell.right <= shell.viewport + 1, `${item.name}: shell remains inside viewport`);
    assert.equal(shell.gap, 24, `${item.name}: inherited section rhythm`);
  }
  if (shells.length) checks.push('named-page-shell-width-content-edge-and-section-rhythm');
  if (item.name === "new-page-contract") {
    const contract = await page.locator('.ui-page').evaluate(element => {
      const heading = element.querySelector('.ui-page-heading h1'), style = getComputedStyle(heading);
      const content = element.querySelector('.ui-page-content');
      return { count: element.querySelectorAll('h1').length, fontSize: parseFloat(style.fontSize), fontWeight: style.fontWeight,
        margin: style.margin, width: element.getBoundingClientRect().width, maxWidth: parseFloat(getComputedStyle(element).maxWidth),
        gap: parseFloat(getComputedStyle(content).gap), fields: [...element.querySelectorAll('input')].map(input => input.getBoundingClientRect().width) };
    });
    assert.equal(contract.count, 1);
    assert.equal(contract.fontSize, 24);
    assert.equal(contract.fontWeight, '700');
    assert.equal(contract.margin, '0px');
    assert.equal(contract.gap, 24);
    assert.ok(contract.width <= contract.maxWidth + 1);
    assert.ok(contract.fields.every(width => width > 100 && width <= contract.width));
    assert.equal(await page.getByRole('textbox', { name: 'Name', exact: true }).inputValue(), 'Example item');
    assert.equal(await page.getByRole('combobox', { name: /^Record status(?: |$)/ }).innerText(), 'Active');
    const actionWidth = await page.getByRole('button', { name: 'Save details', exact: true }).evaluate(element => element.getBoundingClientRect().width);
    assert.ok(actionWidth < contract.fields[0], 'Ordinary actions do not stretch into reading-width bands');
    checks.push('new-page-inherits-header-shell-spacing-and-field-geometry-without-css');
    const table = page.getByRole('table', { name: 'Example records', exact: true });
    assert.equal(await table.getByRole('row').count(), 2);
    const fits = await table.locator('.ui-table-value').evaluateAll(elements => elements.every(element => {
      const box = element.getBoundingClientRect();
      return box.left >= 0 && box.right <= innerWidth && element.scrollWidth <= element.clientWidth + 1;
    }));
    assert.ok(fits, 'Long names, identifiers and actions fit the shared responsive table without page CSS');
    checks.push('new-page-inherits-responsive-semantic-table-without-css');
  }
  if (item.name === "learn-games") {
    assert.ok(await page.locator(".role-cell").count() > 3);
    assert.ok((await page.locator(".role-cell-description").first().innerText()).length > 10);
    checks.push("role-directory-rows-include-descriptions");
  }
  if (item.name === "role-detail") {
    assert.equal(await page.locator(".role-hero").count(), 1);
    assert.ok(await page.getByRole("button", { name: /Favorit/, exact: false }).isVisible());
    assert.ok(await page.locator(".role-examples > li").count() > 0);
    checks.push("role-header-actions-and-numbered-examples");
  }
  if (item.name === "host" && page.viewportSize().width >= 900) {
    const heights = await page.locator('.host-setup-row').evaluateAll(rows => rows.map(row => row.getBoundingClientRect().height));
    assert.ok(heights.every(height => height < 160), `Ordinary setup rows stay compact rather than spreading into blank bands: ${heights}`);
    checks.push("compact-host-rows-with-visible-management-actions");
  }
  if (item.name.startsWith("forum-") || ["learn-games", "role-detail", "setup-detail"].includes(item.name)) {
    assert.equal(await page.locator(".community-page.MuiCard-root, .reference-page.MuiCard-root").count(), 0);
    checks.push("unframed-route-container");
  }
  if (item.name === "forum-categories") {
    assert.equal(await page.locator(".forums .forum-column").count(), 0);
    assert.equal(await page.locator(".forum-latest .column-item").count(), 6, "All original newest-thread/reply records remain available");
    assert.equal(await page.locator(".forum-latest > .column-item").first().getAttribute("data-reply-id"), "fixture-reply-2", "Actual newest reply is visible without expanding activity");
    checks.push("continuous-board-list-and-complete-activity");
  }
  if (item.name === "forum-board") {
    assert.equal(await page.locator(".forum-thread-row").count(), 5);
    assert.equal(await page.locator(".forum-thread-activity .column-item").count(), 10);
    assert.equal(await page.locator(".forum-thread-activity > .column-item").first().getAttribute("data-reply-id"), "fixture-reply-1");
    checks.push("pinned-and-ordinary-thread-rows-retained");
  }
  if (item.name === "forum-thread") {
    assert.equal(await page.locator(".thread-wrapper .post").count(), 4);
    assert.equal(await page.locator(".thread-wrapper .post.span-panel").count(), 0);
    checks.push("continuous-posts-and-all-replies-retained");
  }
  if (item.name === "activity-metrics") {
    assert.equal(await page.locator(".activity-metric").count(), 8);
    assert.equal(await page.locator(".activity-chart").count(), 3);
    assert.equal(await page.locator(".activity-metric").first().locator("dd").innerText(), "68");
    await page.getByRole("button", { name: "7D", exact: true }).click();
    await page.waitForFunction(() => window.__routeReview.requests.some(request => request.url.includes("/site-activity/summary?window=7d")));
    await page.getByRole("button", { name: "24H", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".activity-metric dd")?.textContent === "68");
    checks.push("eight-unframed-counts-and-three-original-charts");
    checks.push("time-window-refetch-and-return");
  }
  if (item.name === "activity-feed") {
    assert.equal(await page.locator(".activity-row").count(), 6);
    assert.ok(await page.locator(".activity-target").first().evaluate(element => {
      const box = element.getBoundingClientRect();
      return box.width >= 100 && element.scrollWidth <= element.clientWidth + 1;
    }), "Feed target and preview must have real space, not a clipped zero-width column");
    const comments = page.getByRole("button", { name: "Comments", exact: true });
    await comments.click();
    assert.equal(await page.locator(".activity-row").count(), 3);
    await comments.click();
    assert.equal(await page.locator(".activity-row").count(), 6);
    const requests = await page.evaluate(() => window.__routeReview.requests.length);
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await page.waitForFunction(count => window.__routeReview.requests.length > count && window.__routeReview.pending === 0, requests);
    checks.push("six-readable-feed-records-with-original-links");
    checks.push("feed-filter-restore-and-refresh");
  }
  if (item.name.startsWith("settings-")) {
    assert.equal(await page.locator(".settings-page .form > .MuiPaper-root").count(), 0);
    // Account credentials use their dedicated form, not the generic field-group
    // renderer. Both must stay unframed and keep their actual inputs.
    if (["settings-site", "settings-profile", "settings-game"].includes(item.name)) assert.ok(await page.locator(".settings-page .form-group").count() > 0);
    else assert.equal(await page.locator(".settings-page.MuiPaper-root").count(), 0);
    if (item.name !== "settings-family") assert.ok(await page.locator(".settings-page input, .settings-page select").count() > 0);
    const navigation = page.getByRole("navigation", { name: "Settings sections" });
    assert.equal(await navigation.getByRole("link").count(), 7);
    assert.equal(await navigation.locator('[aria-current="page"]').count(), 1);
    checks.push("form-groups-without-card-wrappers");
  }
  return checks.concat(await checkRemainingLayout(page, item));
}
async function reviewDiscoveryTasks(page, item, captureTask) {
  const checks = [];
  if (["tutorial-failure", "contributors-failure", "family-failure"].includes(item.name)) {
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    if (item.name === "tutorial-failure") await page.getByRole("button", { name: "Play as Cop", exact: true }).waitFor();
    if (item.name === "contributors-failure") await page.locator('.acknowledgement-row').first().waitFor();
    if (item.name === "family-failure") await page.getByRole("heading", { name: "The Harbor and a longer family name", exact: true }).waitFor();
    assert.equal(await page.getByRole("alert").count(), 0);
    await captureTask("recovered");
    checks.push("failed-read-is-explicit-and-retry-recovers-without-writing");
  }
  if (["contributors", "donors"].includes(item.name)) {
    await page.getByRole("button", { name: "Edit bio", exact: true }).click();
    const editor = page.locator('.acknowledgement-editor textarea').first();
    await editor.fill("Local unsubmitted bio draft");
    await captureTask("bio-editor");
    await page.locator('.acknowledgement-editor').getByRole("button", { name: "Cancel", exact: true }).click();
    assert.equal(await page.evaluate(() => window.__routeReview.writes.filter(write => /Bio$/.test(write.url || "")).length), 0);
    checks.push("directory-bio-editor-accessible-and-cancel-sends-no-write");
  }
  if (item.name === "donors-management") {
    const trace = async step => {
      if (process.env.ROUTE_HISTORY_TRACE === '1') await page.evaluate(step => console.debug('UI_AUDIT_HISTORY ' + JSON.stringify({ method: 'task', step, state: history.state, dialogs: [...document.querySelectorAll('[role="dialog"]')].map(element => element.textContent.slice(0, 120)) })), step);
    };
    for (let attempt = 0; attempt < 3; attempt++) {
    await trace(`${attempt}-before-assign`);
    await page.getByRole("button", { name: "Assign donor status", exact: true }).click();
    await trace(`${attempt}-after-assign`);
    let dialog = page.getByRole("dialog", { name: "Assign donor status", exact: true });
    assert.ok(await dialog.getByRole("button", { name: "Assign status", exact: true }).isDisabled());
    if (attempt === 0) await captureTask("assign-dialog");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await trace(`${attempt}-after-assign-cancel`);
    // Intentionally open the next overlay without waiting for history.back().
    await page.locator('.acknowledgement-row').first().getByRole("button", { name: "Remove status", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "Remove donor status?", exact: true });
    await dialog.waitFor();
    await trace(`${attempt}-after-remove`);
    if (attempt === 0) await captureTask("remove-confirmation");
    if (attempt === 1) {
      assert.ok(await page.evaluate(() => window.history.state?.__overlay), 'An interactive dialog must own a Back marker before browser Back');
      await page.evaluate(() => window.history.back());
    }
    else await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    await page.waitForFunction(() => !window.history.state?.__overlay);
    assert.equal(new URL(page.url()).pathname, '/fame/donors', 'Overlay Back never navigates away from its retained route');
    }
    assert.equal(await page.evaluate(() => window.__routeReview.writes.filter(write => write.url?.startsWith('/api/mod/')).length), 0);
    checks.push("donor-assignment-and-removal-cancel-without-changing-groups");
    checks.push("rapid-dialog-reopen-and-browser-back-have-no-stale-history-markers");
  }
  if (item.name === "family-leader") {
    await page.getByRole("button", { name: "Manage Juniper", exact: true }).click();
    await page.getByRole("menuitem", { name: "Demote to Member", exact: true }).click();
    let dialog = page.getByRole("dialog", { name: "Change member role?", exact: true });
    await captureTask("role-confirmation");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.getByRole("button", { name: "Manage Moth", exact: true }).click();
    await page.getByRole("menuitem", { name: "Remove Member", exact: true }).click();
     dialog = page.getByRole("dialog", { name: "Remove member?", exact: true });
     await captureTask("remove-confirmation");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.getByRole("button", { name: "Edit family bio", exact: true }).click();
     await page.locator('.family-profile-panel textarea').first().fill("Local family draft, never submitted");
     await captureTask("bio-editor");
    await page.locator('.family-profile-panel .buttons').getByRole("button", { name: "Cancel", exact: true }).click();
    assert.equal(await page.evaluate(() => window.__routeReview.writes.filter(write => write.url?.startsWith('/api/family/')).length), 0);
    checks.push("family-role-removal-and-bio-cancellation-sends-no-write");
  }
  if (item.name === "moderation-log") {
    assert.equal(await page.getByRole("navigation", { name: "Moderation sections" }).getByRole("link").count(), 10);
    assert.equal(await page.getByText("Execute action", { exact: true }).count(), 0);
    assert.ok(await page.locator(".moderation-action-row").count() > 0);
    checks.push("moderation-log-is-a-focused-recent-actions-page");
  }
  if (item.name === "moderation-groups") {
    await page.getByRole("button", { name: "Remove NightOwl from Owner", exact: true }).click();
    await page.getByRole("dialog", { name: "Remove group member?", exact: true }).getByRole("button", { name: "Cancel", exact: true }).click();
    assert.equal(await page.evaluate(() => window.__routeReview.writes.filter(write => write.url?.startsWith('/api/mod/')).length), 0);
    checks.push("staff-groups-have-their-own-page-and-removal-cancels-without-write");
  }
  if (item.name === "moderation-tools") {
    assert.ok(await page.getByPlaceholder(/Command Name/).isVisible());
    await page.getByRole("button", { name: "Ban Appeal Tally", exact: true }).click();
    await page.getByRole("dialog", { name: "Ban Appeal Tally", exact: true }).getByRole("button", { name: "Cancel", exact: true }).click();
    checks.push("run-action-has-its-own-command-page-and-dialog-cancel");
  }
  if (item.name === "moderation-reports") {
    await page.getByRole("button", { name: "Open report", exact: true }).first().click();
    await page.getByRole("button", { name: /Back/, exact: false }).first().waitFor();
    await page.getByRole("button", { name: /Back/, exact: false }).first().click();
    await page.getByText("Report R-1042", { exact: false }).waitFor();
    checks.push("report-row-opens-detail-and-returns-to-queue");
  }
  if (item.name === "moderation-github") {
    await page.getByRole("button", { name: "Approve link", exact: true }).first().click();
    await page.getByRole("dialog", { name: "Approve GitHub link?", exact: true }).getByRole("button", { name: "Cancel", exact: true }).click();
    await page.getByRole("button", { name: "Reject link", exact: true }).first().click();
    await page.getByRole("dialog", { name: "Reject GitHub link?", exact: true }).getByRole("button", { name: "Cancel", exact: true }).click();
    assert.equal(await page.evaluate(() => window.__routeReview.writes.filter(write => write.url === '/api/mod/githubLinks').length), 0);
    checks.push("github-review-actions-require-confirmation-and-cancel-without-writing");
  }
  if (item.name === "moderation-competitive") {
    const before = await page.locator('.competitive-setup').count();
    await page.getByRole("button", { name: "Add setup to round 2", exact: true }).click();
    await page.getByRole("dialog", { name: /Add setup to round 2/, exact: false }).getByRole("button", { name: "Cancel", exact: true }).click();
    assert.equal(await page.locator('.competitive-setup').count(), before);
    assert.equal(await page.evaluate(() => window.__routeReview.writes.filter(write => write.url?.startsWith('/api/competitive/')).length), 0);
    checks.push("competitive-round-setup-list-add-cancel-and-no-unsaved-write");
  }
  if (item.name === "moderation-ban-appeals") {
    await page.getByTestId("ban-appeal-row").first().click();
    await page.getByTestId("ban-appeal-case").waitFor();
    await page.getByRole("link", { name: "Back to Ban Appeals", exact: true }).click();
    await page.getByTestId("ban-appeal-row").first().waitFor();
    checks.push("ban-appeal-queue-opens-case-and-returns");
  }
  if (item.name === "feedback") {
    const title = page.getByRole("textbox", { name: /^Title/ });
    const description = page.getByRole("textbox", { name: /^Describe your feedback/ });
    const submit = page.getByRole("button", { name: "Submit feedback", exact: true });
    assert.ok(await submit.isDisabled());
    await title.fill("A local layout report");
    await description.fill("Steps: open Game info on a phone. Expected: readable setup details and guides.");
    await page.getByRole("combobox", { name: "Category", exact: true }).selectOption("mafia");
    await page.evaluate(() => { Object.assign(window.__routeReview, { allowFeedbackWrites: true, deferFeedback: true, failFeedback: true }); });
    await submit.click();
    await page.waitForFunction(() => typeof window.__routeReview.releaseFeedback === "function");
    assert.ok(await title.isDisabled());
    assert.ok(await submit.isDisabled());
    await page.evaluate(() => window.__routeReview.releaseFeedback());
    await page.getByRole("alert").getByText("Simulated feedback failure. Draft retained.", { exact: true }).waitFor();
    assert.equal(await title.inputValue(), "A local layout report");
    assert.ok((await description.inputValue()).startsWith("Steps:"));
    await captureTask("submission-error");
    await submit.click();
    await page.getByRole("status").getByText("Feedback recorded in the test fixture only.", { exact: true }).waitFor();
    assert.equal(await title.inputValue(), "");
    const writes = await page.evaluate(() => window.__routeReview.writes.filter(write => write.url === "/api/feedback/submit"));
    assert.equal(writes.length, 2);
    assert.equal(JSON.parse(writes[1].data).category, "mafia");
    checks.push("feedback-required-fields-pending-error-draft-retention-and-local-only-success-payload");
  }
  if (item.name === "feedback-guest") {
    assert.ok(await page.getByRole("link", { name: "Sign in", exact: true }).isVisible());
    assert.ok(await page.getByRole("textbox", { name: /^Title/ }).isDisabled());
    assert.equal(await page.getByRole("button", { name: "Submit feedback", exact: true }).count(), 0);
    checks.push("feedback-guest-sign-in-explained-without-submission");
  }
  if (item.name === "players") {
    const search = page.getByRole("textbox", { name: "Search players", exact: true });
    await search.fill("Juniper");
    await page.waitForFunction(() => document.querySelectorAll('[aria-label="Matching players"] li').length === 1);
    await search.fill("no-such-player");
    await page.getByText("No players found. Try another name.", { exact: true }).waitFor();
    await page.evaluate(() => { window.__routeReview.deferRead = "/api/user/searchName"; });
    await search.fill("Jun");
    await page.waitForFunction(() => typeof window.__routeReview.releaseRead === "function");
    await search.fill("Moth");
    await page.locator('[aria-label="Matching players"]').getByText("Moth", { exact: true }).waitFor();
    await page.evaluate(() => window.__routeReview.releaseRead());
    assert.equal(await page.locator('[aria-label="Matching players"] li').count(), 1);
    await page.evaluate(() => { window.__routeReview.failNextRead = "/api/user/online"; });
    await page.getByRole("button", { name: "Show online players" }).click();
    await page.getByRole("alert").getByText("Could not load players.", { exact: false }).waitFor();
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('ul[aria-label="Online players"] li').length === 6);
    checks.push("player-search-empty-state-stale-response-rejection-error-and-retry");
  }
  if (item.name === "families") {
    const search = page.getByRole("searchbox", { name: "Search families", exact: true });
    await page.getByRole("checkbox", { name: "Open only", exact: true }).check();
    await page.waitForFunction(() => document.querySelectorAll('.family-directory-row').length === 2);
    await search.fill("no-such-family");
    await page.getByText("No families found.", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Clear filters", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.family-directory-row').length === 3);
    await page.evaluate(() => { window.__routeReview.failNextRead = "/api/family/discover"; });
    await search.fill("The Harbor");
    await page.getByRole("alert").waitFor();
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.family-directory-row').length === 1);
    await page.getByRole("combobox", { name: "Sort by", exact: true }).selectOption("newest");
    await page.waitForFunction(() => window.__routeReview.requests.some(request => request.url.includes("sort=newest")));
    checks.push("family-search-open-only-empty-clear-error-retry-and-sort");
  }
  if (item.name === "host") {
    const search = page.getByRole("searchbox", { name: "Search setups or roles", exact: true });
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await page.getByRole("spinbutton", { name: "Min slots", exact: true }).fill("8");
    await page.waitForFunction(() => window.__routeReview.requests.some(request => request.url.includes("minSlots=8")));
    await page.getByRole("button", { name: "Reset filters", exact: true }).click();
    await search.fill("no-such-setup");
    await page.getByRole("heading", { name: "No matching setups" }).waitFor();
    await page.getByRole("button", { name: "Reset filters", exact: true }).first().click();
    await page.getByRole("button", { name: "Yours", exact: true }).click();
    const row = page.locator('.host-setup-row').filter({ hasText: "Follow the visits" });
    await row.getByRole("button", { name: "Delete setup", exact: true }).click();
    const confirm = page.getByRole("dialog", { name: "Delete setup?", exact: true });
    await confirm.getByRole("button", { name: "Cancel", exact: true }).click();
    assert.equal(await page.evaluate(() => window.__routeReview.writes.filter(write => write.url === "/api/setup/delete").length), 0);
    await page.getByRole("button", { name: "Popular", exact: true }).click();
    await page.evaluate(() => { window.__routeReview.deferRead = "/api/setup/search"; });
    await search.fill("Classic");
    await page.waitForFunction(() => typeof window.__routeReview.releaseRead === "function");
    await search.fill("Follow");
    await page.waitForFunction(() => document.querySelectorAll('.host-setup-row').length === 1 && document.querySelector('.host-setup-row')?.textContent.includes('Follow the visits'));
    await page.evaluate(() => window.__routeReview.releaseRead());
    await page.evaluate(() => { window.__routeReview.failNextRead = "/api/setup/search"; });
    await search.fill("");
    await page.getByRole("alert").waitFor();
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.host-setup-row').length === 5);
    checks.push("host-player-range-empty-reset-owner-delete-cancel-stale-results-and-retry");
  }
  if (item.name === "create-setup") {
    const name = page.getByRole("textbox", { name: "Setup Name", exact: true });
    await name.fill("Local creator review");
    await page.getByRole("combobox", { name: "Game type", exact: true }).selectOption("Jotto");
    await page.getByRole("dialog", { name: "Change game type?", exact: true }).getByRole("button", { name: "Cancel", exact: true }).click();
    assert.equal(await name.inputValue(), "Local creator review");
    assert.equal(await page.getByRole("combobox", { name: "Game type", exact: true }).inputValue(), "Mafia");
    await page.getByRole("button", { name: "Add Villager", exact: true }).click();
    await page.getByRole("button", { name: "Remove one Villager", exact: true }).getByText("Villager × 4", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Copy role set 1", exact: true }).click();
    assert.equal(await page.locator('.setup-role-set').count(), 2);
    await page.getByRole("button", { name: "Remove role set 2", exact: true }).click();
    await page.getByRole("button", { name: "Apply Speed Rounds preset", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Cancel", exact: true }).click();
    await page.getByRole("button", { name: "Next: Role modifiers", exact: true }).click();
    await page.getByRole("button", { name: "Edit modifiers for Cop", exact: true }).click();
    await page.getByRole("button", { name: "Add Armed", exact: true }).click();
    await page.getByRole("button", { name: "Next: Game settings", exact: true }).click();
    assert.equal(await name.inputValue(), "Local creator review");
    await page.getByRole("checkbox", { name: "Closed Roles", exact: true }).check();
    await page.getByRole("checkbox", { name: "Role Groups", exact: true }).check();
    await captureTask("settings");
    await page.getByRole("checkbox", { name: "Role Groups", exact: true }).uncheck();
    await page.getByRole("checkbox", { name: "Closed Roles", exact: true }).uncheck();
    await page.evaluate(() => { window.__routeReview.allowSetupWrites = true; });
    await page.getByRole("button", { name: "Create setup", exact: true }).click();
    await page.waitForFunction(() => location.pathname.includes('/play/host'));
    const payload = await page.evaluate(() => JSON.parse(window.__routeReview.writes.find(write => write.url === "/api/setup/create").data));
    assert.equal(payload.name, "Local creator review");
    assert.equal(payload.copiedFrom, "fixture-setup-0");
    assert.ok(Object.keys(payload.roles[0]).some(role => role.includes("Cop") && role.includes("Armed")));
    checks.push("creator-name-add-copy-remove-role-set-modifier-closed-role-groups-preset-cancel-and-local-save-payload");
  }
  if (["character-decks", "word-decks"].includes(item.name)) {
    await page.getByRole("button", { name: "Yours", exact: true }).click();
    await page.getByRole("button", { name: "Delete", exact: true }).first().click();
    await page.getByRole("dialog", { name: "Delete deck?", exact: true }).getByRole("button", { name: "Cancel", exact: true }).click();
    const search = page.getByRole("searchbox", { name: "Search decks", exact: true });
    await search.fill("no-such-deck");
    await page.getByText("No decks found. Try another name or collection.", { exact: true }).waitFor();
    await search.fill("");
    await page.waitForFunction(() => document.querySelectorAll('.deck-library-row').length === 3);
    if (item.name === "word-decks") assert.ok((await page.getByRole("link", { name: "Host with deck", exact: true }).first().getAttribute('href')).includes('game=Draw+It'));
    checks.push("deck-collections-delete-cancel-search-empty-and-restore");
  }
  if (item.name === "character-deck-editor") {
    const name = page.locator('#deck-name-input');
    await name.fill("Local character draft");
    await page.getByRole("button", { name: "Add card", exact: true }).click();
    assert.equal(await page.locator('.deck-grid-row').count(), 7);
    await page.getByRole("button", { name: "Delete card 7", exact: true }).click();
    assert.equal(await name.inputValue(), "Local character draft");
    checks.push("character-editor-name-draft-add-and-remove-card-without-saving");
  }
  if (item.name === "word-deck-editor") {
    await page.locator('#deck-name-input').fill("Local word draft");
    const words = page.locator('textarea');
    await words.fill("invalid word with spaces");
    assert.ok(await page.getByRole("button", { name: /Save|Create/ }).last().isDisabled());
    checks.push("word-editor-invalid-input-keeps-save-disabled");
  }
  if (item.name === "stocks") {
    await page.locator(".site-wrapper").evaluate(element => { element.scrollTop = 0; });
    const descending = page.getByRole("button", { name: "Sort descending", exact: true });
    if (await descending.count()) {
      assert.equal(await descending.locator('svg[data-icon-set="hackernoon-solid"]').count(), 1);
      await descending.click();
      await page.getByRole("button", { name: "Sort ascending", exact: true }).waitFor();
    } else await page.getByRole("button", { name: /^Sort by / }).first().click();
    await page.getByRole("button", { name: "Buy", exact: true }).first().click();
    const dialog = page.getByRole("dialog", { name: "Trade shares", exact: true });
    const shares = dialog.getByRole("spinbutton", { name: "Number of shares", exact: true });
    await shares.fill("100000000000");
    assert.equal(await shares.inputValue(), "1000");
    await dialog.getByRole("button", { name: "Sell shares", exact: true }).click();
    assert.equal(await shares.inputValue(), "1");
    await captureTask("trade-dialog");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    assert.equal(await page.evaluate(() => window.__routeReview.writes.filter(write => write.type === "axios" && write.url.startsWith("/api/stocks/")).length), 0);
    await page.getByRole("button", { name: "Buy", exact: true }).first().click();
    await page.evaluate(() => { window.__routeReview.allowTradeFailure = true; });
    await dialog.getByRole("button", { name: "Buy", exact: true }).click();
    await page.waitForFunction(() => typeof window.__routeReview.releaseTradeFailure === "function");
    assert.ok(await dialog.getByRole("button", { name: "Cancel", exact: true }).isDisabled());
    assert.ok(await shares.isDisabled());
    assert.ok(await dialog.getByRole("button", { name: "Sell shares", exact: true }).isDisabled());
    await page.keyboard.press("Escape");
    assert.ok(await dialog.isVisible());
    assert.equal(await page.evaluate(() => window.__routeReview.writes.filter(write => write.url === "/api/stocks/buy").length), 1);
    await page.evaluate(() => window.__routeReview.releaseTradeFailure());
    await dialog.getByRole("alert").getByText("Simulated trade failure. No trade was made.", { exact: true }).waitFor();
    await page.waitForFunction(() => window.__routeReview.pending === 0);
    assert.ok(await dialog.getByRole("button", { name: "Buy", exact: true }).isEnabled());
    await captureTask("trade-error");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    checks.push("stock-sort-visible-and-keyboard-operable-bounded-trade-input-sell-switch-and-cancel");
    checks.push("in-memory-only-trade-failure-pending-controls-escape-guard-and-recovery");
  }
  if (item.name === "rankings") {
    const clipped = await page.locator('.standings-identity .user-name').evaluateAll(elements => elements.filter(element => {
      const text = element.getBoundingClientRect();
      const row = element.closest('.standings-row').getBoundingClientRect();
      return text.left < row.left || text.right > row.right + 1 || element.scrollWidth > element.clientWidth + 1;
    }).length);
    assert.equal(clipped, 0, "Leaderboard identities remain readable within their rows");
    await page.getByRole("button", { name: "skill rating about", exact: true }).click();
    await captureTask("rating-details");
    await page.getByRole("dialog", { name: "About the Skill Rating System", exact: true }).getByRole("button", { name: "Close", exact: true }).click();
    checks.push("leaderboard-full-names-readable-and-rating-dialog-cancellable");
  }
  if (item.name === "admin-intake") {
    await page.locator('.site-wrapper').evaluate(element => { element.scrollTop = 0; });
    for (const [action, title] of [["Approve user", "Approve user?"], ["Ban user", "Permanently ban user?"]]) {
      await page.getByRole("button", { name: action, exact: true }).first().click();
      await captureTask(action === "Ban user" ? "ban-confirmation" : "approve-confirmation");
      await page.getByRole("dialog", { name: title, exact: true }).getByRole("button", { name: "Cancel", exact: true }).click();
    }
    assert.equal(await page.evaluate(() => window.__routeReview.writes.filter(write => write.url?.startsWith('/api/mod/')).length), 0);
    const clipped = await page.locator('.flagged-intake-row button').evaluateAll(elements => elements.filter(element => {
      const button = element.getBoundingClientRect(), row = element.closest('.flagged-intake-row').getBoundingClientRect();
      return button.left < row.left || button.right > row.right + 1;
    }).length);
    assert.equal(clipped, 0, "Moderation actions stay inside each row");
    await page.evaluate(() => { window.__routeReview.failNextRead = "/api/user/flagged"; });
    await page.getByRole("button", { name: "Next page", exact: true }).first().click();
    const alert = page.getByRole("alert").filter({ hasText: "Could not load flagged users." });
    await alert.waitFor();
    assert.equal(await page.getByText("No flagged users to review.", { exact: true }).count(), 0);
    await alert.getByRole("button", { name: "Retry", exact: true }).click();
    await page.waitForFunction(() => window.__routeReview.pending === 0);
    await alert.waitFor({ state: "hidden" });
    checks.push("moderation-actions-readable-and-both-confirmations-cancel-without-writing");
    checks.push("moderation-read-failure-is-not-empty-and-retry-recovers");
  }
  return checks;
}
async function checkRemainingLayout(page, item) {
  const checks = [];
  if (item.name === "notifications") {
    assert.equal(await page.locator(".notification-row").count(), 4);
    assert.equal(await page.locator(".notification-row.MuiPaper-root").count(), 0);
    assert.equal(await page.getByRole("button", { name: "Mark as read", exact: true }).count(), 2);
    checks.push("notification-list-and-unread-actions-retained");
  }
  if (item.name === "shop") {
    assert.ok(await page.locator(".ui-product-card").count() >= 20);
    assert.ok(await page.getByRole("button", { name: /^Buy / }).count() >= 20);
    assert.ok(await page.getByRole("button", { name: "Buy Word Deck Slot", exact: false }).isEnabled());
    checks.push("full-product-grid-with-explicit-price-ownership-and-buy");
  }
  if (item.name === "stocks") {
    const summary = page.locator('.ui-stat-row--compact');
    assert.equal(await summary.locator('.ui-stat').count(), 3);
    const bounds = await summary.evaluate(element => {
      const box = element.getBoundingClientRect();
      return { height: box.height, overflow: element.scrollWidth > element.clientWidth + 1, valuesOverflow: [...element.querySelectorAll('.ui-stat')].some(stat => stat.scrollWidth > stat.clientWidth + 1), currencyMisaligned: [...element.querySelectorAll('.ui-stat strong')].some(value => {
        const text = document.createRange(); text.selectNodeContents(value.firstChild);
        const textBox = text.getBoundingClientRect(), iconBox = value.querySelector('.coin-icon').getBoundingClientRect();
        return Math.abs((textBox.top + textBox.bottom) / 2 - (iconBox.top + iconBox.bottom) / 2) > 6;
      }) };
    });
    assert.ok(bounds.height < 100, 'A compact balance summary does not strand a third value on a tall phone panel');
    assert.equal(bounds.overflow || bounds.valuesOverflow, false, 'Every balance value and currency icon fits its stat');
    assert.equal(bounds.currencyMisaligned, false, 'Currency icons remain on the same line as their amounts');
    checks.push('compact-shared-balance-summary-keeps-all-three-values-and-currency-icons-readable');
  }
  if (item.name === "profile-custom") {
    const colors = await page.locator(".profile .box-panel").first().evaluate(element => ({ inline: element.style.backgroundColor, computed: getComputedStyle(element).backgroundColor }));
    assert.equal(colors.inline, "rgb(32, 62, 71)"); assert.equal(colors.computed, colors.inline);
    checks.push("authored-profile-background-preserved");
    const contrast = await page.locator('.profile .ui-page-heading h1, .profile .bio p, .profile .trophy-value, .profile .ratings .profile-results-heading strong').evaluateAll(elements => elements.map(element => {
      const rgb = value => (value.match(/[\d.]+/g) || []).map(Number);
      const luminance = values => values.slice(0, 3).map(value => { value /= 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
      let background;
      for (let node = element; node; node = node.parentElement) {
        const color = rgb(getComputedStyle(node).backgroundColor);
        if (color.length === 3 || color[3] === 1) { background = color; break; }
      }
      const foreground = rgb(getComputedStyle(element).color);
      const values = [luminance(foreground), luminance(background || [255, 255, 255])].sort((a, b) => b - a);
      return { text: element.textContent, ratio: (values[0] + 0.05) / (values[1] + 0.05) };
    }));
    assert.ok(contrast.length >= 5, 'Contrast checks include identity, bio, reputation and statistics');
    assert.deepEqual(contrast.filter(value => value.ratio < 4.5), [], 'Authored backgrounds cannot replace the neutral text surface');
    assert.equal(await page.locator('.profile .ratings svg').count(), 0, 'Statistics use exact readable counts, not a decorative chart');
    checks.push("custom-profile-identity-bio-reputation-and-statistics-have-readable-neutral-surfaces");
  }
  if (item.name.startsWith("profile-")) {
    const invalidAvatars = await page.locator('.avi-name .avatar .avatar-default').evaluateAll(elements => elements.filter(element => {
      const icon = element.getBoundingClientRect(), avatar = element.closest('.avatar').getBoundingClientRect();
      return icon.left < avatar.left || icon.top < avatar.top || icon.right > avatar.right + 1 || icon.bottom > avatar.bottom + 1;
    }).length);
    assert.equal(invalidAvatars, 0, "Default avatar artwork fits its bordered avatar at every size");
    const clip = await page.locator('.avi-name .avatar .avatar-image').evaluate(element => ({ overflow: getComputedStyle(element).overflow, radius: getComputedStyle(element).borderRadius }));
    assert.equal(clip.overflow, "hidden");
    assert.equal(clip.radius, "50%");
    checks.push("default-avatar-is-contained-and-circular");
  }
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "No horizontal document overflow");
  return checks;
}
async function reviewTasks(page, item, viewport, entry) {
  const checks = [];
  async function captureTask(name) {
    const filename = `${item.name}-${viewport.width}-${name}.png`;
    await page.screenshot({ path: path.join(output, filename), animations: "disabled" });
   entry.screenshots.push(filename);
   entry.measurements.push({ state: name, position: "task", screenshot: filename, ...await page.evaluate(measureUi) });
  }
  checks.push(...await reviewDiscoveryTasks(page, item, captureTask));
  entry.adminEvidence = [];
  checks.push(...await reviewAdminTasks(page, item, captureTask, { evidence: entry.adminEvidence }));
  if (item.name.startsWith("settings-")) {
    const navigation = page.getByRole("navigation", { name: "Settings sections" });
    await page.locator(".site-wrapper").evaluate(element => { element.scrollTop = 0; });
    if (item.name === "settings-site") {
      assert.ok((await page.getByRole("textbox", { name: "Referral URL", exact: true }).inputValue()).startsWith(new URL(page.url()).origin + "/auth/login?ref="));
      await page.evaluate(() => { window.__routeReview.allowSettingsWrites = true; });
      const checkbox = page.getByRole("checkbox", { name: "DMs from Friends Only", exact: true });
      const before = await checkbox.isChecked();
      await checkbox.setChecked(!before);
      await page.waitForFunction(value => window.__routeReview.writes.some(write => write.url === "/api/user/settings/update" && JSON.parse(write.data).prop === "onlyFriendDMs" && JSON.parse(write.data).value === value), !before);
      assert.equal(await checkbox.isChecked(), !before);
      checks.push("checkbox-saves-correct-prop-and-value-in-local-adapter-only");
    }
    if (item.name === "settings-profile") {
      const name = page.getByRole("textbox", { name: "Name", exact: true });
      await name.fill("Unsubmitted settings draft");
      await navigation.getByRole("link", { name: "Game", exact: true }).click();
      await navigation.getByRole("link", { name: "Profile", exact: true }).click();
      assert.equal(await name.inputValue(), "Unsubmitted settings draft");
      assert.equal(await page.evaluate(() => window.__routeReview.writes.filter(write => write.type === "axios" && write.url !== "/api/notifs/read").length), 0);
      checks.push("explicit-save-draft-retained-between-sections-without-submitting");
    }
    if (item.name === "settings-account") {
      await page.getByRole("button", { name: "Delete account", exact: true }).click();
      assert.equal(await page.evaluate(() => window.__routeReview.writes.filter(write => write.url === "/api/user/delete").length), 0);
      checks.push("account-deletion-cancel-does-not-submit");
    }
    for (const name of ["Site", "Profile", "Game", "Account", "GitHub", "Cookies", "Family"]) {
      await navigation.getByRole("link", { name, exact: true }).click();
      assert.equal(await navigation.locator('[aria-current="page"]').textContent(), name);
      await page.locator(".settings-section-heading").getByRole("heading", { name, exact: true }).waitFor();
    }
    checks.push("all-seven-settings-destinations-remain-accessible");
  }
  if (item.name.startsWith("profile-")) {
    await page.locator(".site-wrapper").evaluate(element => { element.scrollTop = 0; });
    if (item.name === "profile-self") {
      assert.equal(await page.locator(".profile .karma-vote-wrap button").count(), 2);
      checks.push("self-profile-karma-controls-are-available");
    }
    if (item.name === "profile-rich") {
      assert.equal(await page.locator(".profile .karma-vote-wrap button").count(), 2);
      const karma = page.getByRole('group', { name: 'Profile karma', exact: true });
      assert.equal(await karma.getByRole('button', { name: 'Upvote profile', exact: true }).count(), 1);
      assert.equal(await karma.getByRole('button', { name: 'Downvote profile', exact: true }).count(), 1);
      const bounds = await karma.evaluate(element => {
        const score = element.querySelector('.trophy-meta').getBoundingClientRect();
        const controls = element.querySelector('.karma-vote-wrap').getBoundingClientRect();
        return { horizontalGap: Math.max(0, controls.left - score.right), verticalGap: Math.max(0, controls.top - score.bottom), overlap: Math.min(score.right, controls.right) - Math.max(score.left, controls.left) > 1 && Math.min(score.bottom, controls.bottom) - Math.max(score.top, controls.top) > 1 };
      });
      assert.ok(bounds.horizontalGap <= 12 && bounds.verticalGap <= 12, 'Karma controls stay beside their own score, including when wrapped');
      assert.equal(bounds.overlap, false, 'Karma controls cannot overlap their score');
      checks.push("karma-controls-are-adjacent-to-the-profile-score");
    }
    assert.equal(await page.locator(".profile").count(), 1);
    assert.equal(await page.locator(".profile .avi-name").count(), 1);
    const sections = [
      ...(item.name === "profile-minimal" ? [] : [["Statistics", ".profile .ratings", "Mafia Ratings"]]),
      ["Games", ".profile .recent-games", "Recent Games"],
      ["Comments", ".profile .comments-page", null],
      ["Collection", ".profile .trophies-content", "KUDOS"],
    ];
    for (const [, target, expected] of sections) {
      assert.ok(await page.locator(target).count() > 0, target);
      if (expected) await page.locator(target).getByText(expected, { exact: false }).first().waitFor({ state: "visible" });
    }
    await page.getByText("Setups Created", { exact: true }).first().waitFor({ state: "visible" });
    await page.getByText("Friends", { exact: true }).first().waitFor({ state: "visible" });
    for (const [label, target] of sections) {
      await page.locator(target).scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      if (["Games", "Collection", "Statistics"].includes(label) && ["profile-rich", "profile-custom"].includes(item.name)) {
        await captureTask(label.toLowerCase());
      }
    }
    await page.locator(".profile .comments-page").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Post Comment", exact: true }).first().click();
    const editor = page.locator(".profile textarea").first();
    await editor.fill("Retained local review draft");
    await page.locator(".profile .recent-games").scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    assert.equal(await editor.inputValue(), "Retained local review draft");
    checks.push("profile-sections-visible-and-retained-comment-draft");
  }
  if (item.name === "setup-detail") {
    assert.equal(await page.locator(".setup-role-entry").count(), 4);
    for (const name of ["Villager × 3", "Cop", "Doctor", "Mafioso × 2"]) await page.locator(".setup-roster").getByText(name, { exact: true }).waitFor();
    assert.ok(await page.getByRole("button", { name: "Host game", exact: true }).isVisible());
    for (const name of ["Statistics", "Night actions", "Version history"]) {
      await page.getByRole("tab", { name, exact: true }).click();
      await page.waitForFunction(() => window.__routeReview.pending === 0);
      await captureTask(name.split(" ")[0].toLowerCase());
    }
    await page.getByRole("tab", { name: "Overview", exact: true }).click();
    checks.push("named-role-roster-host-and-all-secondary-views");
  }
  if (item.name === "forum-thread") {
    await page.getByRole("button", { name: "Reply", exact: true }).first().click();
    const composer = page.getByRole("group", { name: "Forum reply composer" });
    await composer.locator("textarea").fill("Local reply draft, not submitted");
    await captureTask("reply");
    await composer.getByRole("button", { name: "Cancel", exact: true }).click();
    checks.push("discoverable-reply-editor-and-cancel");
  }
  return checks;
}
async function geometry(page) {
  return page.evaluate(() => {
    const scroller = document.querySelector(".site-wrapper");
    const nav = document.querySelector(".mobile-nav")?.getBoundingClientRect();
    return { viewportWidth: innerWidth, viewportHeight: innerHeight, documentWidth: document.documentElement.scrollWidth,
      scrollTop: scroller.scrollTop, scrollHeight: scroller.scrollHeight, clientHeight: scroller.clientHeight,
      atBottom: Math.abs(scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop) <= 2,
      navigationTop: nav?.top, contentWidth: document.querySelector("#main-content")?.getBoundingClientRect().width };
  });
}
main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
