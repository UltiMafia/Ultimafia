// One immutable fixture bundle, then sequential palette runs. Never rebuild the
// served directory while a runner is reading it.
//
// Only the redesign is captured. Upstream master is deliberately not built or
// compared: this branch replaces master's design, so matching it is not a goal.
// The audit grades absolute usability/layout contracts and cross-route
// consistency within the redesign itself. See ui-audit/report.cjs.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { inventoryFromSource, writeReport } = require('./ui-audit/report.cjs');
const cwd = path.resolve(__dirname, '..');
const output = path.resolve(process.env.UI_AUDIT_OUTPUT || path.join(cwd, '../docs/frontend-redesign/audit'));
const phase = process.env.DESIGN_PHASE || 'before';
const run = (command, args, env = process.env) => {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' });
  if (result.error || result.status !== 0) throw result.error || new Error(`${command} exited ${result.status}`);
};
let captureFailed = false;
const finalMatrix = process.env.UI_AUDIT_FINAL === '1';
const captureLimit = Number(process.env.UI_AUDIT_CAPTURE_LIMIT || 120);
if (!Number.isInteger(captureLimit) || captureLimit < 1) throw new Error('UI_AUDIT_CAPTURE_LIMIT must be a positive integer');
let screenshotsProduced = 0;
const capture = env => {
  const remaining = captureLimit - screenshotsProduced;
  if (!finalMatrix && remaining <= 0) throw new Error(`Slice evidence cap reached (${captureLimit})`);
  const result = spawnSync(process.execPath, [path.join(__dirname, 'run-route-review.cjs')], { cwd, env: { ...env, ROUTE_CAPTURE_LIMIT: String(finalMatrix ? 100000 : remaining) }, stdio: 'inherit' });
  if (result.error) throw result.error;
  captureFailed ||= result.status !== 0;
  const pointer = path.join(env.ROUTE_OUTPUT_DIR, 'latest-run.json');
  if (fs.existsSync(pointer)) {
    const latest = JSON.parse(fs.readFileSync(pointer));
    const report = JSON.parse(fs.readFileSync(path.join(env.ROUTE_OUTPUT_DIR, latest.report)));
    screenshotsProduced += report.captureBudget?.produced || 0;
  }
};
if (!process.argv.includes('--report-only')) {
  if (!process.env.ROUTE_CASES && !finalMatrix) throw new Error('Interim audits require ROUTE_CASES. Reserve UI_AUDIT_FINAL=1 for the single final full matrix.');
  const bundleRoot = path.resolve(process.env.UI_AUDIT_BUNDLE_ROOT || '/tmp/opencode');
  fs.mkdirSync(bundleRoot, { recursive: true, mode: 0o700 });
  const bundles = fs.mkdtempSync(path.join(bundleRoot, 'ui-audit-bundle-'));
  const directory = path.join(bundles, 'redesign');
  run(path.join(cwd, 'node_modules/.bin/rsbuild'), ['build', '--no-env', '--config', 'rsbuild.route-review-test.config.ts'], { ...process.env, ROUTE_BUNDLE_DIR: directory });
  for (const palette of ['dark', 'light']) capture({ ...process.env,
    ROUTE_BUNDLE_DIR: directory,
    DESIGN_PHASE: phase, ROUTE_THEME: palette, ROUTE_WIDTHS: process.env.ROUTE_WIDTHS || '1440,390,320',
    ROUTE_CONTROLS: '1', ROUTE_TASK_REVIEW: process.env.ROUTE_TASK_REVIEW || '1',
    ROUTE_OUTPUT_DIR: path.join(output, 'captures', `redesign-${phase}-${palette}`),
  });
}
const runs = [];
for (const palette of ['dark', 'light']) {
  const directory = path.join(output, 'captures', `redesign-${phase}-${palette}`);
  if (!fs.existsSync(path.join(directory, 'latest-run.json'))) continue;
  const latest = JSON.parse(fs.readFileSync(path.join(directory, 'latest-run.json')));
  const filename = path.join(directory, latest.report);
  runs.push({ directory: path.dirname(filename), report: JSON.parse(fs.readFileSync(filename)) });
}
const inventory = inventoryFromSource(fs.readFileSync(path.join(__dirname, 'routeReviewData.jsx'), 'utf8'));
const summary = writeReport(output, inventory, runs);
console.log(JSON.stringify(summary, null, 2));
if (captureFailed || summary.missing || summary.openFindings) process.exitCode = 1;
