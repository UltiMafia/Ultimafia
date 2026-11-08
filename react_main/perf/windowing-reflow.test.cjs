// Reflow must not move the reader: hiding the transcript (a retained game
// behind the current route) and changing the Appearance font size both reflow
// every row. The anchor is asserted as a message key AND a signed screen
// offset, not as a first-visible count — a row landing one place off still
// reads as "the same message" to a count-only check.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {webkit, chromium, devices} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(process.argv[2] || 'build-chat-perf');
const mime = {'.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp'};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = path.resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (!path.extname(file)) file = path.join(root, 'index.html');
  fs.readFile(file, (e, b) => {
    res.writeHead(e ? 404 : 200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
    res.end(e ? 'not found' : b);
  });
});
const anchor = () => {
  const display = document.querySelector('.speech-display');
  const top = display.getBoundingClientRect().top;
  const row = [...display.querySelectorAll('.message')].find(r => r.getBoundingClientRect().bottom > top);
  if (!row) return null;
  return {id: row.dataset.messageId, offset: row.getBoundingClientRect().top - top, scroll: display.scrollTop};
};

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await (process.env.ENGINE === 'chromium' ? chromium : webkit).launch();
  const results = [];
  try {
    for (const virtual of [1, 0]) {
      const context = await browser.newContext({...devices['iPhone 13']});
      try {
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(base + `?count=1000&nameplates=700&cosmetic=mixed&virtual=${virtual}`);
        await page.waitForFunction(() => window.chatPerf && document.querySelector('.speech-display .message'));
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(900);

        const pause = () => page.evaluate(() => {
          const display = document.querySelector('.speech-display');
          display.scrollTop = (display.scrollHeight - display.clientHeight) * 0.5;
        });

        // 1. Hide the transcript, receive a message, come back.
        await pause();
        await page.waitForTimeout(600);
        const hiddenBefore = await page.evaluate(anchor);
        await page.evaluate(() => {
          document.querySelector('.game').style.display = 'none';
          window.chatPerf.append();
        });
        await page.waitForTimeout(400);
        await page.evaluate(() => { document.querySelector('.game').style.display = ''; });
        await page.waitForTimeout(700);
        const hiddenAfter = await page.evaluate(anchor);

        // 2. Change the Appearance font size mid-read, then a message arrives.
        await pause();
        await page.waitForTimeout(600);
        const fontBefore = await page.evaluate(anchor);
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '24px';
          window.chatPerf.append();
        });
        await page.waitForTimeout(900);
        const fontAfter = await page.evaluate(anchor);

        const result = {engine: process.env.ENGINE || 'webkit', virtual, hidden: {before: hiddenBefore, after: hiddenAfter}, font: {before: fontBefore, after: fontAfter}, errors};
        results.push(result);
        console.log(JSON.stringify(result));

        assert.equal(errors.length, 0, 'browser errors: ' + errors.join('; '));
        assert.ok(hiddenBefore && hiddenAfter, 'anchor row missing after hide/show');
        assert.equal(hiddenAfter.id, hiddenBefore.id, 'hide/append/show moved the reader to another row');
        assert.ok(Math.abs(hiddenAfter.offset - hiddenBefore.offset) <= 2, `hide/append/show moved the anchor offset ${hiddenBefore.offset} → ${hiddenAfter.offset}`);
        assert.ok(fontBefore && fontAfter, 'anchor row missing after font change');
        // The unwindowed control is the reference, not a target: with the whole
        // transcript in the DOM the browser keeps scrollTop while everything
        // above the reader changes height, so it is expected to drift. The
        // windowed implementation is the one held to the exact anchor.
        if (virtual) {
          assert.equal(fontAfter.id, fontBefore.id, 'font-size change moved the reader to another row');
          assert.ok(Math.abs(fontAfter.offset - fontBefore.offset) <= 2, `font-size change moved the anchor offset ${fontBefore.offset} → ${fontAfter.offset}`);
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  fs.writeFileSync(path.join(__dirname, 'windowing-results', `reflow-${process.env.ENGINE || 'webkit'}.json`), JSON.stringify(results, null, 2));
  console.log(`${process.env.ENGINE || 'webkit'}: reflow checks passed`);
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
