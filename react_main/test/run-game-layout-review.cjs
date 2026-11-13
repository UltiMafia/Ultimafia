// Actual MafiaGame composition, including its pregame/header/Info/Menu paths.
// Only the local controlled fixture is served; no live game or account is used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/tmp/opencode/redesign-tools/node_modules/playwright');
const phase = process.env.DESIGN_PHASE || 'after';
const output = process.env.GAME_LAYOUT_OUTPUT_DIR;
if (!output) throw new Error('GAME_LAYOUT_OUTPUT_DIR must name a fresh evidence directory');
const roots = [process.env.REDESIGN_BUNDLE_DIR || '/tmp/opencode/ultimafia-redesign-browser', path.resolve(__dirname, '../public')];
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((request, response) => {
  if (request.method !== 'GET') { response.writeHead(405); return response.end(); }
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  let file = roots.map(root => path.resolve(root, '.' + pathname)).find(file => roots.some(root => file.startsWith(root + path.sep)) && fs.existsSync(file) && fs.statSync(file).isFile());
  if (!file && !path.extname(pathname)) file = path.join(roots[0], 'index.html');
  if (!file) { response.writeHead(404); return response.end(); }
  response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(response);
});
async function main() {
  fs.mkdirSync(output, { recursive: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const records = [];
  try {
    const viewports = [[1440,1000], [1180,820], [1024,768], [390,844], [320,640], [740,390]].filter(([width]) => !process.env.GAME_LAYOUT_WIDTHS || process.env.GAME_LAYOUT_WIDTHS.split(',').map(Number).includes(width));
    for (const theme of ['dark', 'light']) for (const [width, height] of viewports) for (const state of ['pregame','live','review']) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', colorScheme: theme });
      const page = await context.newPage();
      const record = { theme, width, height, state, errors: [], screenshots: [], checks: [] };
      const capture = async suffix => { const file = `${theme}-${state}-${width}x${height}-${suffix}.png`; await page.screenshot({ path: path.join(output, file), animations: 'disabled', timeout: 15000 }); record.screenshots.push(file); };
      page.on('pageerror', error => record.errors.push(error.stack || error.message));
      await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      try {
        const query = new URLSearchParams({ full: '1', dev: '1', longnames: '1', theme });
        if (state === 'pregame') query.set('pregame', '1');
        if (state === 'review') { query.set('review','1'); query.set('completed','1'); query.set('history','1'); }
        await page.goto(origin + '/game/fixture?' + query);
        await Promise.race([page.locator('.game').waitFor(), page.waitForEvent('pageerror', { timeout: 30000 }).then(error => { throw error; })]);
        await page.evaluate(() => document.fonts.ready);
        await capture('chat');
        if (width > 900) {
          if (phase === 'after') {
            const logo = await page.locator('.game-topbar img[alt="Site logo"]').boundingBox();
            const setup = await page.locator('.game-topbar .setup').boundingBox();
            const actions = await page.locator('.game-topbar-actions').boundingBox();
            const state = await page.locator('.game-topbar-state').boundingBox();
            assert.ok(logo && setup && actions && setup.x >= logo.x + logo.width && setup.x + setup.width <= actions.x + 1, 'Header logo/setup/actions do not overlap');
            assert.ok(state && Math.abs((state.x + state.width / 2) - (width / 2)) < 8, 'Day/state switcher stays centered on desktop');
            assert.equal(await page.getByRole('link', { name: 'Browse site', exact: true }).count(), 0);
            record.checks.push('desktop-header-centers-state-and-has-no-out-of-game-link');
          }
        } else {
          await page.getByRole('button', { name: 'Menu', exact: true }).click();
          await capture('menu-top');
          if (phase === 'after') {
            const leave = await page.getByRole('button', { name: 'Leave game', exact: true }).boundingBox();
            const nav = await page.locator('.game-mobile-nav').boundingBox();
            assert.ok(leave && nav && leave.y >= 0 && leave.y + leave.height < nav.y, 'Leave is immediately reachable without scrolling settings');
            assert.equal(await page.getByRole('link', { name: 'Browse site', exact: true }).count(), 0);
            record.checks.push('leave-and-browse-are-separated-above-settings');
          }
          await page.locator('.game-mobile-nav button[aria-label="Info"]').click();
          await capture('info-top');
          if (phase === 'after') {
            const info = page.getByTestId('game-info-tab');
            const content = await info.boundingBox(), tools = await page.locator('.game-mobile-tools').boundingBox(), nav = await page.locator('.game-mobile-nav').boundingBox();
            assert.ok(content && tools && nav && content.y >= tools.y + tools.height - 1 && content.y + content.height <= nav.y + 1, 'One Info viewport stays between toolbar and bottom navigation');
            assert.equal(await info.locator('.game-setup-info').count(), 1);
            assert.equal(await page.locator('.game > .game-setup-info').count(), 0, 'No separate setup scroller above the toolbar');
            assert.equal(await page.getByRole('img', { name: 'Site logo' }).count(), 0, 'Info does not mount a second oversized site header');
            await info.evaluate(element => { element.scrollTop = element.scrollHeight; });
            await capture('info-bottom');
            const last = info.locator('.setup-info').last();
            await last.scrollIntoViewIfNeeded();
            const rect = await last.boundingBox();
            assert.ok(rect && rect.y < nav.y, 'Setup facts remain reachable');
            record.checks.push('single-scrolling-info-region-no-logo-overlap-and-reachable-details');
          }
        }
        assert.equal(record.errors.length, 0);
        record.status = 'checked';
      } catch (error) { record.status = 'failed'; record.failure = error.stack; await capture('FAILED').catch(() => {}); }
      finally { records.push(record); fs.writeFileSync(path.join(output, 'partial-report.json'), JSON.stringify(records, null, 2)); await context.close(); }
    }
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ phase, records, failed: records.filter(record => record.status === 'failed') }, null, 2) + '\n');
  console.log(JSON.stringify({ cases: records.length, failed: records.filter(record => record.status === 'failed').map(record => ({ theme: record.theme, state: record.state, width: record.width, failure: record.failure })) }));
  if (records.some(record => record.status === 'failed')) process.exitCode = 1;
}
main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
