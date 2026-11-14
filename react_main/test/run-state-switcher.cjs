const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(process.argv[2] || 'build-chat-perf');
const publicDir = path.resolve(__dirname, '../public');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://x').pathname;
  let file;
  for (const dir of [root, publicDir]) {
    const candidate = path.resolve(dir, '.' + pathname);
    if (candidate.startsWith(dir + path.sep) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) { file = candidate; break; }
  }
  if (!file && !path.extname(pathname)) file = path.join(root, 'index.html');
  if (!file) return res.writeHead(404).end();
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}/`;
  const failures = [];
  try {
    for (const engine of ['chromium', 'webkit']) {
      const browser = await pw[engine].launch();
      try {
        for (const theme of ['dark', 'light']) {
          const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
          const errors = [];
          page.on('pageerror', e => errors.push(e.message));
          await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
          try {
            await page.goto(origin + `?theme=${theme}`);
            await page.waitForSelector('.speech-display');
            const group = page.getByRole('group', { name: 'Game phase navigation' });
            await group.waitFor();
            assert.equal(await group.locator('text=Day 2').count(), 1);
            const geo = await page.evaluate(() => {
              const control = document.querySelector('[aria-label="Game phase navigation"]');
              const tabs = document.querySelector('.meeting-tabs');
              const wrapper = document.querySelector('.speech-wrapper');
              const transcript = document.querySelector('.speech-display');
              const r = control.getBoundingClientRect(), t = tabs.getBoundingClientRect();
              return { inTranscript: wrapper.contains(control), top: r.top, transcriptTop: transcript.getBoundingClientRect().top, tabsBottom: t.bottom, position: getComputedStyle(control.parentElement).position, overlayBackground: getComputedStyle(control.parentElement).backgroundColor, overlayPointerEvents: getComputedStyle(control.parentElement).pointerEvents, gutterBlocked: !!document.elementFromPoint(4, r.top + r.height / 2)?.closest('.mobile-phase-float'), width: document.documentElement.scrollWidth, viewport: innerWidth,
                targets: [...control.querySelectorAll('button')].map(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })) };
            });
            assert.equal(geo.inTranscript, true, 'pill must float over transcript, below meeting tabs');
            assert.ok(geo.top >= geo.tabsBottom, 'pill must not cover Village/timer header');
            assert.equal(geo.position, 'absolute', 'pill must float rather than add a toolbar row');
            assert.ok(Math.abs(geo.transcriptTop - geo.tabsBottom) <= 1, 'floating control must not reserve a toolbar band above chat');
            assert.equal(geo.overlayBackground, 'rgba(0, 0, 0, 0)', 'no full-width fill behind the pill');
            assert.equal(geo.overlayPointerEvents, 'none', 'empty space around pill must pass through to chat');
            assert.equal(geo.gutterBlocked, false, 'chat beside pill remains touchable');
            assert.ok(geo.width <= geo.viewport, 'must fit phone width');
            assert.ok(geo.targets.every(r => r.width >= 44 && r.height >= 44), '44px arrow targets');
            await page.getByRole('button', { name: 'Next phase', exact: true }).isDisabled().then(value => assert.ok(value));
            for (const name of ['Night 1', 'Day 1', 'Pregame']) {
              await page.getByRole('button', { name: 'Previous phase', exact: true }).click();
              await group.getByText(name, { exact: true }).waitFor();
            }
            assert.ok(await page.getByRole('button', { name: 'Previous phase', exact: true }).isDisabled());
            await page.getByRole('button', { name: 'Next phase', exact: true }).click();
            await group.getByText('Day 1', { exact: true }).waitFor();
            assert.equal(await page.locator('.MuiBottomNavigation-root [aria-label="Game phase navigation"]').count(), 0);
            const nav = page.locator('.MuiBottomNavigation-root');
            assert.deepEqual(await nav.locator('.MuiBottomNavigationAction-label').allTextContents(), ['Players', 'Info', 'Chat', 'Actions', 'Menu']);
            await nav.getByRole('button').filter({ hasText: 'Players' }).click();
            assert.equal(await group.isVisible(), false);
            await nav.getByRole('button').filter({ hasText: 'Chat' }).click();
            await group.waitFor({ state: 'visible' });
            if (process.env.SCREENSHOT_DIR) {
              fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
              await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `state-pill-${engine}-${theme}.png`) });
            }
            for (const width of [320, 375, 414]) {
              await page.setViewportSize({ width, height: 844 });
              assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px fits`);
            }
            await page.goto(origin + `?theme=${theme}&finished&review`);
            await page.getByRole('group', { name: 'Game phase navigation' }).getByText('Postgame', { exact: true }).waitFor();
            assert.ok(await page.getByRole('button', { name: 'Next phase', exact: true }).isDisabled());
            await page.getByRole('button', { name: 'Previous phase', exact: true }).click();
            await page.getByRole('group', { name: 'Game phase navigation' }).getByText('Day 2', { exact: true }).waitFor();
            await page.goto(origin + `?theme=${theme}&single`);
            await page.waitForSelector('.speech-display');
            assert.equal(await page.getByRole('group', { name: 'Game phase navigation' }).count(), 0);
            await page.setViewportSize({ width: 1280, height: 900 });
            await page.goto(origin + `?theme=${theme}`);
            await page.getByTestId('desktop-state-control').waitFor();
            assert.equal(await page.getByRole('group', { name: 'Game phase navigation' }).count(), 0);
            assert.ok(await page.getByRole('button', { name: 'Go to first state', exact: true }).isVisible());
            assert.equal(await page.getByRole('tab', { name: 'Day 2', exact: true }).count(), 1);
            assert.deepEqual(errors, [], 'no browser exceptions');
            console.log(`${engine}/${theme}: phase order, endpoints, panels, widths, desktop: PASS`);
          } catch (e) { failures.push(`${engine}/${theme}: ${e.message}`);console.error(e.stack); }
          finally { await page.close(); }
        }
      } finally { await browser.close(); }
    }
  } finally { server.close(); }
  assert.deepEqual(failures, []);
})().catch(e => { console.error(e.message);process.exitCode = 1; });
