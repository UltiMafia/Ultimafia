const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/tmp/opencode/redesign-tools/node_modules/playwright');
const { measureUi } = require('./ui-audit/measure.cjs');
const root = path.resolve(__dirname, '../..');
const artifacts = process.env.LIVE_AUDIT_OUTPUT || path.join(root, 'docs/frontend-redesign/audit/live-public');
const output = path.join(artifacts, `run-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const upstream = process.env.UI_AUDIT_MASTER || '/tmp/opencode/ultimafia-master';
const revision = directory => execFileSync('git', ['rev-parse', 'HEAD'], { cwd: directory, encoding: 'utf8' }).trim();
assert.equal(revision(upstream), execFileSync('git', ['rev-parse', 'origin/master'], { cwd: root, encoding: 'utf8' }).trim(), 'Live master must be actual fetched upstream');
execFileSync('git', ['diff', '--quiet', 'HEAD', '--', 'react_main/src'], { cwd: upstream });
// Identical public GET responses for both clients, read from the existing local
// backend once per URL. Never persist response bodies, cookies or auth headers.
const responses = new Map();
const source = [];
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const cases = [
  { id: 'lobby', route: '/play', selector: '.lobby-browser', masterSelector: '.inner-content.play' },
  { id: 'players', route: '/community/users', selector: '.newest-users, .player-directory-layout' },
  { id: 'forums', route: '/community/forums', selector: '.forums' },
  { id: 'learn-games', route: '/learn/games', selector: '.reference-page', masterSelector: '.learn' },
];
function readLocal(url) {
  if (!responses.has(url)) responses.set(url, new Promise((resolve, reject) => {
    // No incoming Cookie, Authorization, x-csrf or other identity is forwarded.
    http.get({ hostname: 'localhost', port: 3000, path: url, headers: { Accept: 'application/json' } }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const bytes = Buffer.concat(chunks);
        source.push({ path: new URL(url, 'http://localhost').pathname, status: response.statusCode, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
        resolve({ bytes, status: response.statusCode, contentType: response.headers['content-type'] || 'application/octet-stream' });
      });
    }).on('error', reject);
  }));
  return responses.get(url);
}
async function main() {
  fs.mkdirSync(output, { recursive: true });
  const report = { data: 'same-existing-local-database-public-guest', visualAcceptance: false, source, cases: [], branches: { master: revision(upstream), redesign: revision(root) },
    trackedSourceDirty: Object.fromEntries([['master', upstream], ['redesign', root]].map(([branch, directory]) => [branch, Boolean(execFileSync('git', ['diff', 'HEAD', '--', 'react_main/src'], { cwd: directory, encoding: 'utf8' }).trim())])),
    compiledAssets: {} };
  const browser = await chromium.launch({ headless: true });
  try {
    for (const branch of ['master', 'redesign']) {
      const bundle = `/tmp/opencode/ultimafia-live-audit-${branch}`;
      report.compiledAssets[branch] = fs.readdirSync(path.join(bundle, 'static/js'), { recursive: true }).filter(file => file.endsWith('.js')).map(file => ({ file, sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(bundle, 'static/js', file))).digest('hex') }));
      const publicDir = path.join(branch === 'master' ? upstream : root, 'react_main/public');
      const server = http.createServer(async (request, response) => {
        const url = new URL(request.url, 'http://localhost');
        if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); return response.end('All writes refused'); }
        if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
          try { const value = await readLocal(request.url); response.writeHead(value.status, { 'Content-Type': value.contentType }); return response.end(value.bytes); }
          catch { response.writeHead(502); return response.end('Local read failed'); }
        }
        let filename;
        for (const directory of [bundle, publicDir]) {
          const candidate = path.resolve(directory, '.' + decodeURIComponent(url.pathname));
          if (candidate.startsWith(directory + path.sep) && !url.pathname.split('/').some(part => part.startsWith('.')) && mime[path.extname(candidate)] && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) { filename = candidate; break; }
        }
        if (!filename && !path.extname(url.pathname)) filename = path.join(bundle, 'index.html');
        if (!filename) { response.writeHead(404); return response.end(); }
        response.writeHead(200, { 'Content-Type': mime[path.extname(filename)] }); fs.createReadStream(filename).pipe(response);
      });
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      const origin = `http://localhost:${server.address().port}`;
      try {
        for (const palette of ['dark', 'light']) for (const width of [1440, 390, 320]) for (const item of cases) {
          const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 1000 : 844 }, colorScheme: palette, reducedMotion: 'reduce', serviceWorkers: 'block' });
          const page = await context.newPage();
          const entry = { branch, palette, width, ...item, errors: [], screenshots: [], status: 'pending' };
          page.on('pageerror', error => entry.errors.push(error.message));
          await context.route('**/*', route => {
            const url = new URL(route.request().url());
            if (url.origin === origin && ['GET', 'HEAD'].includes(route.request().method())) return route.continue();
            if (['data:', 'blob:'].includes(url.protocol)) return route.continue();
            return route.abort('blockedbyclient');
          });
          await context.addInitScript(() => {
            localStorage.setItem('cookieConsent', 'rejected');
            localStorage.setItem('cookiePreferences', JSON.stringify({ essential: true, analytics: false, functional: false }));
          });
          try {
            await page.goto(`${origin}${item.route}?theme=${palette}`, { waitUntil: 'load' });
            await page.locator(branch === 'master' ? (item.masterSelector || item.selector) : item.selector).first().waitFor({ state: 'visible', timeout: 20000 });
            await page.waitForFunction(() => window.__liveUiAudit?.ready && window.__liveUiAudit.pending === 0 && performance.now() - window.__liveUiAudit.lastRequestAt > 500, null, { timeout: 20000 });
            await page.evaluate(() => document.fonts.ready);
            await page.evaluate(() => { const content = document.querySelector('#main-content') || document.querySelector('.inner-container'); if (content) content.id = 'main-content'; });
            for (const position of ['top', 'bottom']) {
              if (position === 'bottom') await page.evaluate(() => { const scroller = document.querySelector('.site-wrapper'); if (scroller) scroller.scrollTop = scroller.scrollHeight; window.scrollTo(0, document.documentElement.scrollHeight); });
              const file = `${branch}-${item.id}-${width}-${palette}-${position}.png`;
              await page.screenshot({ path: path.join(output, file), animations: 'disabled' });
              entry.screenshots.push({ file, position, geometry: await page.evaluate(measureUi) });
            }
            assert.deepEqual(entry.errors, []);
            entry.status = 'captured-not-accepted';
          } catch (error) {
            entry.status = 'failed'; entry.failure = error.message;
            entry.diagnostic = `FAILED-${branch}-${item.id}-${width}-${palette}.png`;
            await page.screenshot({ path: path.join(output, entry.diagnostic), animations: 'disabled' }).catch(() => {});
          }
          report.cases.push(entry);
          console.log(`${entry.status}: ${branch} ${item.id} ${width} ${palette}`);
          await context.close();
        }
      } finally { await new Promise(resolve => server.close(resolve)); }
    }
  } finally {
    await browser.close();
    report.summary = { cases: report.cases.length, failed: report.cases.filter(item => item.status === 'failed').length };
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    fs.writeFileSync(path.join(artifacts, 'latest-run.json'), JSON.stringify({ run: path.basename(output), summary: report.summary }, null, 2) + '\n');
    console.log(JSON.stringify(report.summary));
    if (report.summary.failed) process.exitCode = 1;
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
