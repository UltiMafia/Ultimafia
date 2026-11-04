// Cold upward fling: unseen rows must not be sized so low that the deferred
// iOS correction hides history the element cannot scroll to. Linux WebKit with
// an iPhone UA exercises the library's deferral bookkeeping, not UIKit physics.
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

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await (process.env.ENGINE === 'chromium' ? chromium : webkit).launch();
  const results = [];
  try {
    for (const count of [100, 400]) {
      const context = await browser.newContext({...devices['iPhone 13']});
      try {
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(base + `?count=${count}&nameplates=${Math.round(count * 0.78)}&cosmetic=mixed&virtual=1`);
        await page.waitForFunction(() => window.chatPerf && document.querySelector('.speech-display .message'));
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(900);
        const prepared = await page.evaluate(() => {
          const s = document.querySelector('.speech-display');
          let v;
          for (let f = s[Object.keys(s).find(k => k.startsWith('__reactFiber'))]; f; f = f.return) {
            for (let h = f.memoizedState; h && typeof h === 'object'; h = h.next) {
              if (h.memoizedState?.getVirtualItems) { v = h.memoizedState; break; }
            }
            if (v) break;
          }
          if (!v) throw Error('virtualizer not found');
          window.__probe = {v};
          return {measured: v.itemSizeCache.size, distanceFromEnd: Math.round(v.getDistanceFromEnd())};
        });
        await page.evaluate(() => {
          const s = document.querySelector('.speech-display');
          const e = new Event('touchstart', {bubbles: true});
          Object.defineProperty(e, 'touches', {value: [{clientY: 500}]});
          s.dispatchEvent(e);
        });
        let velocity = 700, edge = null;
        for (let i = 0; i < 500; i++) {
          await page.evaluate(d => {
            const s = document.querySelector('.speech-display');
            if (s.scrollTop <= 0) return;
            s.scrollTop = Math.max(0, s.scrollTop - d);
          }, velocity);
          await page.waitForTimeout(18);
          const state = await page.evaluate(() => ({
            native: document.querySelector('.speech-display').scrollTop,
            logical: window.__probe.v.scrollOffset,
          }));
          if (state.native <= 0) { edge = state; break; }
          velocity = Math.max(200, velocity * 0.97);
        }
        await page.evaluate(() => document.querySelector('.speech-display').dispatchEvent(new Event('touchend', {bubbles: true})));
        await page.waitForTimeout(700);
        const after = await page.evaluate(() => {
          const s = document.querySelector('.speech-display');
          const first = s.querySelector('[data-index="0"]');
          return {
            native: Math.round(s.scrollTop),
            logical: Math.round(window.__probe.v.scrollOffset),
            row0Gap: first ? Math.round(first.getBoundingClientRect().top - s.getBoundingClientRect().top) : null,
          };
        });
        results.push({count, ...prepared, edgeLogical: edge ? Math.round(edge.logical) : null, after, errors});
        console.log(JSON.stringify(results[results.length - 1]));
      } finally { await context.close(); }
    }
  } finally { await browser.close(); server.close(); }
  if (process.env.ESTIMATE_OUTPUT) fs.writeFileSync(process.env.ESTIMATE_OUTPUT, JSON.stringify({engine: await browser.version(), results}, null, 2));
  for (const r of results) {
    assert.ok(r.edgeLogical !== null, `count ${r.count}: fling must reach the native top`);
    // The constant 60px estimate left 600-1,300px of history unreachable here.
    assert.ok(r.edgeLogical <= 150, `count ${r.count}: held history at native top must stay small, got ${r.edgeLogical}px`);
    assert.equal(r.after.native, 0, `count ${r.count}: release must settle at the top`);
    assert.ok(Math.abs(r.after.row0Gap ?? 99) <= 2, `count ${r.count}: oldest row must be aligned at the top`);
    assert.ok(r.errors.length === 0, `count ${r.count}: no browser exceptions`);
  }
  console.log('PASS: cold estimates keep held history within a fraction of a screen');
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
