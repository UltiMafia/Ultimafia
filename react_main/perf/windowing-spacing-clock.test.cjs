// Regression: control and virtual pages must render identical fixture timestamps,
// even when opened on opposite sides of a proportional-digit wrapping boundary.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const playwright = require.resolve(process.env.PLAYWRIGHT_MODULE || 'playwright');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spacing-clock-'));
try {
  const shim = path.join(dir, 'playwright.cjs');
  fs.writeFileSync(shim, `
const pw = require(${JSON.stringify(playwright)});
for (const engine of ['webkit', 'chromium']) {
  const launch = pw[engine].launch.bind(pw[engine]);
  pw[engine].launch = async (...args) => {
    const browser = await launch(...args);
    const newContext = browser.newContext.bind(browser);
    let contexts = 0;
    browser.newContext = async (...args) => {
      const context = await newContext(...args);
      const time = Date.parse('2026-11-14T23:28:07Z') + (contexts++ % 2) * 4000;
      const newPage = context.newPage.bind(context);
      context.newPage = async (...args) => {
        const page = await newPage(...args);
        await page.clock.setFixedTime(time);
        return page;
      };
      return context;
    };
    return browser;
  };
}
module.exports = pw;
`);
  const result = spawnSync(process.execPath, [path.join(__dirname, 'windowing-spacing.test.cjs'),
    path.resolve(process.argv[2] || 'build-chat-perf')], {
    encoding: 'utf8', timeout: 120000,
    env: { ...process.env, PLAYWRIGHT_MODULE: shim, WIDTHS: '1440',
      LAYOUTS: 'compactInline', THEMES: 'light' },
  });
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  assert.ifError(result.error);
  assert.equal(result.status, 0, 'spacing parity must survive different page wall clocks');
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
