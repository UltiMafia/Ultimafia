// Controlled production-component coverage; never connects to live accounts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const directory = '/tmp/opencode/ultimafia-redesign-browser';
const output = process.env.HOMEPAGE_OUTPUT_DIR;
const before = process.env.DESIGN_PHASE === 'before';
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file;
  for (const base of [directory, path.resolve(__dirname, '../public')]) {
    const candidate = path.resolve(base, '.' + pathname);
    if (candidate.startsWith(base + path.sep) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) { file = candidate; break; }
  }
  if (!file && !path.extname(pathname)) file = path.join(directory, 'index.html');
  if (!file) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
(async () => {
  fs.mkdirSync(output, { recursive: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const report = [];
  try {
    for (const width of [1848, 1440, 1024, 390, 320]) for (const theme of ['dark', 'light']) {
      const page = await browser.newPage({ viewport: { width, height: width > 900 ? 1000 : 844 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      await page.goto(`${origin}/play?theme=${theme}&homefeatures=1&trades=1`);
      await page.locator('[data-game-id="open"]').waitFor();
      await page.evaluate(() => document.fonts.ready);
      const name = `${theme}-${width}`;
      await page.screenshot({ path: path.join(output, `${name}-top.png`) });
      if (!before) {
        assert.deepEqual(errors, []);
        const rows = await page.locator('.lobby-game-card').evaluateAll(elements => elements.map(element => ({
          id: element.dataset.gameId, background: getComputedStyle(element).backgroundColor,
          border: getComputedStyle(element).borderLeftColor, borderWidth: getComputedStyle(element).borderLeftWidth,
        })));
        const normal = rows.find(row => row.id === 'open'), ranked = rows.find(row => row.id === 'full'), competitive = rows.find(row => row.id === 'live');
        assert.notEqual(normal.background, ranked.background);
        assert.notEqual(ranked.background, competitive.background);
        assert.notEqual(ranked.border, competitive.border);
        assert.equal(ranked.borderWidth, '4px');
        await page.getByRole('heading', { name: 'Daily Challenges', exact: true }).waitFor();
        await page.getByText('Complete a game of Mafia.', { exact: true }).waitFor();
        await page.getByRole('heading', { name: 'Competitive Rounds', exact: true }).waitFor();
        await page.getByRole('heading', { name: 'Featured setup', exact: true }).first().waitFor();
        await page.getByRole('heading', { name: 'Community wall', exact: true }).waitFor();
        const panels = await page.locator('.lobby-home-features .lobby-feature-section').evaluateAll(elements => elements.map(element => ({
          title: element.querySelector('h2')?.textContent, background: getComputedStyle(element).backgroundColor,
          border: getComputedStyle(element).borderWidth, padding: getComputedStyle(element).padding,
        })));
        const stamp = panels.find(panel => panel.title === 'Stamp Exchange');
        assert.ok(stamp);
        assert.ok(panels.every(panel => panel.background === stamp.background && panel.border === stamp.border && panel.padding === stamp.padding), 'All sidebar sections use the same frame, including Stamp Exchange and featured setup');
        await page.getByRole('button', { name: 'Offer a duplicate stamp', exact: true }).click();
        const dialog = page.getByRole('dialog', { name: 'Respond to stamp offer', exact: true });
        await dialog.getByRole('button', { name: 'Offer Villager', exact: true }).click();
        assert.equal(await dialog.getByRole('button', { name: 'Offer Villager', exact: true }).getAttribute('aria-pressed'), 'true');
        await page.screenshot({ path: path.join(output, `${name}-stamp-offer.png`), animations: 'disabled' });
        await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
        await dialog.waitFor({ state: 'hidden' });
        if (width >= 1280) {
          const [list, features] = await Promise.all([page.locator('.lobby-game-list').boundingBox(), page.locator('.lobby-home-features').boundingBox()]);
          assert.ok(features.x >= list.x + list.width, 'Desktop uses spare width for homepage features');
          assert.ok(features.y < 350, 'Daily features are available without switching tabs');
        }
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.getByRole('tab', { name: 'More', exact: true }).click();
        assert.equal(await page.getByRole('heading', { name: 'Daily Challenges', exact: true }).count(), 1);
        await page.getByRole('tab', { name: 'Games', exact: true }).click();
        await page.getByRole('heading', { name: 'Daily Challenges', exact: true }).waitFor();
      }
      await page.locator('.site-wrapper').evaluate(element => { element.scrollTop = element.scrollHeight; });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.screenshot({ path: path.join(output, `${name}-bottom.png`), animations: 'disabled' });
      report.push({ name, before, errors });
      await page.close();
    }
  } finally {
    await browser.close(); server.close();
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  }
  console.log(`${report.length} homepage cases ${before ? 'captured before changes' : 'passed'}`);
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
