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
        let phase = 'initial';
        if (process.env.RESIZE_DIAGNOSTICS === '1') await page.addInitScript(() => {
          const NativeObserver = ResizeObserver;
          window.__resizeDeliveries = [];
          window.ResizeObserver = class extends NativeObserver {
            constructor(callback) {
              super((entries, observer) => {
                const geometry = () => entries.map(entry => {
                  const box = entry.target.getBoundingClientRect();
                  return { target: entry.target.className, width: box.width, height: box.height };
                });
                const delivery = { time: performance.now(), before: geometry() };
                window.__resizeDeliveries.push(delivery);
                window.__resizeDeliveries = window.__resizeDeliveries.slice(-20);
                callback(entries, observer);
                delivery.after = geometry();
              });
            }
          };
        });
        page.on('pageerror', e => {
          errors.push(e.message);
          if (process.env.RESIZE_DIAGNOSTICS === '1') {
            console.error('pageerror phase:', phase, e.message);
            page.evaluate(() => window.__resizeDeliveries).then(value => console.error('resize deliveries:', JSON.stringify(value))).catch(() => {});
          }
        });
        await page.goto(base + `?count=1000&nameplates=700&cosmetic=mixed&virtual=${virtual}`);
        await page.waitForFunction(() => window.chatPerf && document.querySelector('.speech-display .message'));
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(900);
        const composer = await page.locator('.composer-editor').evaluateAll(elements => elements.map(element => {
          const style = getComputedStyle(element);
          return { helper: element.getAttribute('aria-hidden') === 'true', minimum: parseFloat(style.minHeight), height: element.getBoundingClientRect().height,
            oneRow: parseFloat(style.lineHeight) + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) };
        }));
        assert.equal(composer.filter(value => !value.helper).length, 1, 'one actual editor');
        assert.ok(composer.filter(value => !value.helper).every(value => value.height >= value.oneRow - 1), 'actual editor retains one text row');
        assert.ok(composer.filter(value => value.helper).every(value => value.minimum === 0), 'autosize helper must not inherit the visible editor minimum');

        const pause = () => page.evaluate(() => {
          const display = document.querySelector('.speech-display');
          display.scrollTop = (display.scrollHeight - display.clientHeight) * 0.5;
        });

        // 1. Hide the transcript, receive a message, come back.
        phase = 'hide-and-show';
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
        phase = 'font-size-change';
        await pause();
        await page.waitForTimeout(600);
        const fontBefore = await page.evaluate(anchor);
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '24px';
          window.chatPerf.append();
        });
        await page.waitForTimeout(900);
        const fontAfter = await page.evaluate(anchor);

        const result = {engine: process.env.ENGINE || 'webkit', virtual, composer, hidden: {before: hiddenBefore, after: hiddenAfter}, font: {before: fontBefore, after: fontAfter}, errors};
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
  const output = process.env.REFLOW_OUTPUT_DIR || path.join(__dirname, 'windowing-results');
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, `reflow-${process.env.ENGINE || 'webkit'}.json`), JSON.stringify(results, null, 2));
  console.log(`${process.env.ENGINE || 'webkit'}: reflow checks passed`);
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
