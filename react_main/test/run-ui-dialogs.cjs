// Opens dialog-like surfaces by clicking production controls, measures each one,
// and compares the results. This covers the states the page-level comparison
// cannot see: dialogs, menus, popovers, drawers and sheets.
const fs = require("node:fs");
const path = require("node:path");
const { chromium, buildBundle, startServer, openPage, waitForRoute } = require("./ui-audit/browser-harness.cjs");
const { dialogSignature } = require("./ui-audit/dialog-signature.cjs");
const { compareDialogs } = require("./ui-audit/compare-dialogs.cjs");
const { caseOverrides, generatedCases } = require("./ui-audit/families.cjs");

const cwd = path.resolve(__dirname, "..");
const repo = path.resolve(cwd, "..");
const source = path.join(cwd, "src");
const bundle = path.resolve(process.env.DIALOG_BUNDLE_DIR || "/tmp/opencode/ultimafia-family-browser");
const publicDir = path.join(cwd, "public");
const output = path.resolve(process.env.DIALOG_OUTPUT || path.join(repo, "docs/frontend-redesign/dialogs"));
const widths = (process.env.DIALOG_WIDTHS || "1440").split(",").map(Number).filter(Boolean);
const theme = process.env.DIALOG_THEME || "dark";
const only = process.env.DIALOG_CASES ? new Set(process.env.DIALOG_CASES.split(",")) : null;
const perPage = Number(process.env.DIALOG_LIMIT || 6);
const maxTriggers = Number(process.env.DIALOG_TRIGGERS || 30);

const OPEN_SELECTOR = "[role='dialog'], .MuiDialog-paper, .MuiPopover-paper, .MuiMenu-paper, .MuiDrawer-paper, .ui-sheet";
const OPEN_VISIBLE = "[role='dialog']:visible, .MuiDialog-paper:visible, .MuiPopover-paper:visible, .MuiMenu-paper:visible, .MuiDrawer-paper:visible, .ui-sheet:visible";
const SKIP_LABEL = /save|submit|post reply|post comment|send|publish|buy|purchase|log out|logout|sign out|delete account|leave game|leave family/i;
const PRIORITY = /settings|edit|report|share|filter|options|more|add|create|invite|manage|select|choose|change|details|info|rules|help|appeal|ban|delete|remove|confirm|apply|customize|colou?r|avatar|banner|role|host|transfer|leave|kick|promote|kudos|vote|block|mute|search|sort|open|view|pick|upload/i;

function inventory() {
  const byComponent = {};
  const files = new Set();
  let usages = 0;
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.name.endsWith(".jsx")) continue;
      const text = fs.readFileSync(full, "utf8");
      for (const match of text.matchAll(/<(UiDialog|Dialog|Popover|Menu|Modal|Drawer|Sheet)\b/g)) {
        usages++;
        byComponent[match[1]] = (byComponent[match[1]] || 0) + 1;
        files.add(path.relative(source, full));
      }
    }
  };
  walk(source);
  return { files: files.size, usages, byComponent };
}

function score(label, hasPopup) {
  let value = 0;
  if (hasPopup) value += 4;
  if (PRIORITY.test(label)) value += 2;
  if (!label) value += 1;
  return value;
}

async function probeRoute(browser, origin, viewport, item) {
  const { page, context } = await openPage({ browser, origin, viewport, theme });
  const recorded = [];
  let triggersTried = 0;
  try {
    await waitForRoute(page, origin, {
      route: item.route, mode: item.mode || "member", theme,
      selector: item.selector, text: item.text, anyContent: item.anyContent,
    });
    if (await page.locator("[data-route-review-failure]").count()) return { recorded, triggersTried, failed: "error boundary" };

    const handles = await page.locator(
      "#main-content button, #main-content [role='button'], #main-content [aria-haspopup]",
    ).elementHandles();
    const candidates = [];
    for (const handle of handles) {
      try {
        if (!(await handle.isVisible())) continue;
        const label = (await handle.evaluate((element) => (
          element.getAttribute("aria-label") || element.innerText || ""
        ).replace(/\s+/g, " ").trim())).slice(0, 60);
        const hasPopup = await handle.evaluate((element) => element.getAttribute("aria-haspopup"));
        if (SKIP_LABEL.test(label)) continue;
        candidates.push({ handle, label, score: score(label, hasPopup) });
      } catch {
        // Detached while enumerating; not a usable trigger.
      }
    }
    candidates.sort((left, right) => right.score - left.score);

    let missed = 0;
    for (const candidate of candidates.slice(0, maxTriggers)) {
      if (recorded.length >= perPage) break;
      if (missed >= 10) break;
      triggersTried++;
      const before = page.url();
      try {
        await candidate.handle.click({ timeout: 2000 });
      } catch {
        missed++;
        continue;
      }
      await page.waitForSelector(OPEN_SELECTOR, { state: "visible", timeout: 1200 }).catch(() => {});
      if (page.url() !== before) {
        recorded.push({ name: item.name, route: item.route, trigger: candidate.label, ok: false, error: "trigger navigated" });
        break;
      }
      const signature = await page.evaluate(dialogSignature).catch(() => null);
      if (!signature) { missed++; continue; }
      recorded.push({ name: item.name, route: item.route, trigger: candidate.label, ok: true, signature });
      missed = 0;

      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(250);
      let stillOpen = await page.locator(OPEN_VISIBLE).count().catch(() => 0);
      if (stillOpen) {
        const close = page.locator(`${OPEN_SELECTOR} button[aria-label='Close'], ${OPEN_SELECTOR} button[aria-label='close']`).first();
        if (await close.count()) await close.click({ timeout: 1000 }).catch(() => {});
        await page.waitForTimeout(250);
        stillOpen = await page.locator(OPEN_VISIBLE).count().catch(() => 0);
      }
      if (stillOpen) {
        // A modal that will not close would block every later trigger.
        break;
      }
    }
  } catch (error) {
    return { recorded, triggersTried, failed: error.message };
  } finally {
    await context.close();
  }
  return { recorded, triggersTried };
}

function writeReport(result) {
  const lines = [];
  lines.push("# Dialog and overlay pass", "");
  lines.push(`Generated ${new Date().toISOString()}. Widths: ${result.summary.widths.join(", ")}. Theme: ${result.summary.theme}.`);
  lines.push("", "Production route components with synthetic fixtures. This is structural evidence, not visual acceptance.");
  lines.push("", "## Coverage", "");
  lines.push(`- Source inventory: **${result.summary.inventory.usages}** dialog/menu/popover usages across **${result.summary.inventory.files}** files.`);
  lines.push(`- Routes probed: **${result.summary.routes}**`);
  lines.push(`- Triggers tried: **${result.summary.triggersTried}**`);
  lines.push(`- Overlays opened and measured: **${result.summary.overlaysOpened}**`);
  lines.push(`- By kind: ${Object.entries(result.summary.byKind).map(([kind, count]) => `${kind} ${count}`).join(", ") || "none"}`);
  lines.push("");
  lines.push("The source inventory is the denominator. The trigger scan is generic, so overlays that only open from a row action, a long press or a specific state may be missing. Those are reported as not reached, not as clean.");
  lines.push("", "## Findings", "");
  lines.push(`**${result.summary.findings}** findings (${result.summary.high} high, ${result.summary.medium} medium).`);
  lines.push("");
  if (result.findings.length) {
    lines.push("| Severity | Width | Route | Trigger | Property | Observed | Common | Detail |");
    lines.push("|---|---|---|---|---|---|---|---|");
    for (const finding of result.findings.slice(0, 60)) {
      const clean = (value) => String(value ?? "").replace(/\|/g, "\\|");
      lines.push(`| ${finding.severity} | ${finding.width ?? ""} | \`${finding.route}\` | ${clean(finding.trigger)} | \`${finding.property}\` | ${clean(finding.observed)} | ${clean(finding.familyValue)} | ${clean(finding.detail)} |`);
    }
    if (result.findings.length > 60) lines.push(`| … | | | | | | | ${result.findings.length - 60} more in dialogs.json |`);
  }
  lines.push("", "## Value census", "");
  for (const [label, key] of [["Corner radius", "radius"], ["Title size", "titleFontSize"], ["Body size", "bodyFontSize"], ["Dialog max-width", "maxWidth"], ["Action heights", "actionHeights"]]) {
    lines.push(`**${label}** — ${result.census[key].length} distinct`);
    lines.push("");
    lines.push("| Value | Overlays | Kinds | Examples |");
    lines.push("|---|---|---|---|");
    for (const value of result.census[key].slice(0, 10)) lines.push(`| ${value.value} | ${value.count} | ${value.kinds.join(", ")} | ${value.examples.join("; ").replace(/\|/g, "\\|")} |`);
    lines.push("");
  }
  const emptyRoutes = (result.routes || []).filter((route) => route.overlays === 0 && !route.failed);
  lines.push("## Where no overlay was reached", "");
  lines.push(`${emptyRoutes.length} of ${(result.routes || []).length} route/width probes opened no measured overlay. This can mean the page has none, or that the trigger is a row action, long press or other state the generic scan cannot reach. These are unverified, not clean.`);
  lines.push("");
  for (const route of emptyRoutes.slice(0, 40)) lines.push(`- \`${route.route}\` (${route.width}px) — ${route.triggersTried} triggers tried`);
  lines.push("");
  lines.push("## Overlays opened", "");
  lines.push("| Route | Trigger | Kind | Title | Width × height | Radius | Fields | Actions |");
  lines.push("|---|---|---|---|---|---|---|---|");
  for (const entry of result.dialogs.filter((value) => value.ok)) {
    const signature = entry.signature;
    lines.push(`| \`${entry.route}\` | ${String(entry.trigger).replace(/\|/g, "\\|")} | ${signature.kind} | ${String(signature.title || "").replace(/\|/g, "\\|")} | ${signature.box.width} × ${signature.box.height} | ${signature.radius} | ${signature.fieldCount} | ${signature.hasActions ? "yes" : "no"} |`);
  }
  lines.push("");
  const skipped = result.dialogs.filter((value) => !value.ok && value.error);
  if (skipped.length) {
    lines.push("## Triggers that did not produce a measured overlay", "");
    for (const entry of skipped) lines.push(`- \`${entry.route}\` — ${entry.trigger}: ${entry.error}`);
    lines.push("");
  }
  return lines.join("\n");
}

async function main() {
  buildBundle({ cwd, bundle, skip: process.env.DIALOG_SKIP_BUILD === "1" });
  fs.mkdirSync(output, { recursive: true });
  const server = await startServer({ bundle, publicDir });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });
  try {
    const bootstrap = await openPage({ browser, origin, viewport: { width: 1440, height: 1000 }, theme });
    await waitForRoute(bootstrap.page, origin, { route: "/policy/rules", mode: "member", theme, selector: ".ui-page" });
    const configured = await bootstrap.page.evaluate(() => window.__routeReview.cases);
    await bootstrap.context.close();

    const byName = new Map(configured.map((item) => [item.name, item]));
    for (const generated of generatedCases) if (!byName.has(generated.name)) byName.set(generated.name, generated);
    for (const [name, override] of Object.entries(caseOverrides)) {
      const base = byName.get(name);
      if (base) byName.set(name, { ...base, ...override });
    }
    let cases = [...byName.values()].filter((item) => !/failure|denied|pending/.test(item.name));
    if (only) cases = cases.filter((item) => only.has(item.name));

    const result = { generatedAt: new Date().toISOString(), dialogs: [], summary: { widths, theme, routes: cases.length, triggersTried: 0, overlaysOpened: 0, byKind: {}, findings: 0, high: 0, medium: 0, inventory: inventory(), visualAcceptance: false } };
    const resultsPath = path.join(output, "results.json");
    let index = 0;
    for (const width of widths) for (const item of cases) {
      const probe = await probeRoute(browser, origin, { width, height: width >= 900 ? 1000 : 844 }, item);
      result.summary.triggersTried += probe.triggersTried;
      (result.routes ||= []).push({ name: item.name, route: item.route, width, triggersTried: probe.triggersTried, overlays: probe.recorded.filter((entry) => entry.ok).length, failed: probe.failed || null });
      for (const entry of probe.recorded) result.dialogs.push({ ...entry, width });
      if (probe.failed) result.dialogs.push({ name: item.name, route: item.route, width, ok: false, error: probe.failed });
      index++;
      console.log(`[${index}/${cases.length * widths.length}] ${item.name} ${width} triggers ${probe.triggersTried} overlays ${probe.recorded.filter((entry) => entry.ok).length}${probe.failed ? ` FAILED ${probe.failed}` : ""}`);
      fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
    }

    const comparison = compareDialogs({ dialogs: result.dialogs, inventory: result.summary.inventory });
    result.summary.overlaysOpened = comparison.summary.overlaysOpened;
    result.summary.byKind = comparison.summary.byKind;
    result.summary.findings = comparison.summary.findings;
    result.summary.high = comparison.summary.high;
    result.summary.medium = comparison.summary.medium;
    fs.writeFileSync(path.join(output, "dialogs.json"), JSON.stringify(comparison, null, 2));
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(result, null, 2));
    fs.writeFileSync(path.join(output, "report.md"), writeReport({ ...comparison, ...result }));
    console.log(JSON.stringify(result.summary, null, 2));
    console.log(`report: ${path.join(output, "report.md")}`);
    if (process.env.DIALOG_FAIL_ON_FINDINGS === "1" && result.summary.findings) process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
