// One immutable fixture bundle, then sequential palette runs. Never rebuild the
// served directory while a runner is reading it.
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
const capture = env => {
  const result = spawnSync(process.execPath, [path.join(__dirname, 'run-route-review.cjs')], { cwd, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  captureFailed ||= result.status !== 0;
};
if (!process.argv.includes('--report-only')) {
  const bundleRoot = path.resolve(process.env.UI_AUDIT_BUNDLE_ROOT || '/tmp/opencode');
  fs.mkdirSync(bundleRoot, { recursive: true, mode: 0o700 });
  const bundles = fs.mkdtempSync(path.join(bundleRoot, 'ui-audit-bundle-'));
  if (!process.argv.includes('--master-only')) {
    const directory = path.join(bundles, 'redesign');
    run(path.join(cwd, 'node_modules/.bin/rsbuild'), ['build', '--no-env', '--config', 'rsbuild.route-review-test.config.ts'], { ...process.env, ROUTE_BUNDLE_DIR: directory });
    for (const palette of ['dark', 'light']) capture({ ...process.env,
    UI_AUDIT_BRANCH: 'redesign', ROUTE_BUNDLE_DIR: directory,
    DESIGN_PHASE: phase, ROUTE_THEME: palette, ROUTE_WIDTHS: process.env.ROUTE_WIDTHS || '1440,390,320',
    ROUTE_CONTROLS: '1', ROUTE_TASK_REVIEW: process.env.ROUTE_TASK_REVIEW || '1',
    ROUTE_OUTPUT_DIR: path.join(output, 'captures', `redesign-${phase}-${palette}`),
    });
  }
  if (!process.argv.includes('--redesign-only')) {
    const directory = path.join(bundles, 'master');
    run(path.join(cwd, 'node_modules/.bin/rsbuild'), ['build', '--no-env', '--config', 'rsbuild.master-audit-test.config.ts'], { ...process.env, MASTER_AUDIT_BUNDLE_DIR: directory });
    for (const palette of ['dark', 'light']) capture({ ...process.env,
      UI_AUDIT_BRANCH: 'master', ROUTE_BUNDLE_DIR: directory,
      DESIGN_PHASE: phase, ROUTE_THEME: palette, ROUTE_WIDTHS: process.env.ROUTE_WIDTHS || '1440,390,320',
      ROUTE_CONTROLS: '0', ROUTE_TASK_REVIEW: '0', MASTER_TASK_REVIEW: '1',
      ROUTE_OUTPUT_DIR: path.join(output, 'captures', `master-${phase}-${palette}`),
    });
  }
}
const runs = [];
for (const branch of ['redesign', 'master']) for (const palette of ['dark', 'light']) {
  let directory = path.join(output, 'captures', `${branch}-${phase}-${palette}`);
  // Master is immutable and can be reused across before/after comparisons.
  // This never substitutes a previous redesign revision for a master capture.
  if (branch === 'master' && !fs.existsSync(path.join(directory, 'latest-run.json'))) directory = path.join(output, 'captures', `master-before-${palette}`);
  if (!fs.existsSync(path.join(directory, 'latest-run.json'))) continue;
  const latest = JSON.parse(fs.readFileSync(path.join(directory, 'latest-run.json')));
  const filename = path.join(directory, latest.report);
  runs.push({ branch, directory: path.dirname(filename), report: JSON.parse(fs.readFileSync(filename)) });
}
const inventory = inventoryFromSource(fs.readFileSync(path.join(__dirname, 'routeReviewData.jsx'), 'utf8'));
const summary = writeReport(output, inventory, runs);
console.log(JSON.stringify(summary, null, 2));
if (captureFailed || summary.gaps || summary.openFindings) process.exitCode = 1;
