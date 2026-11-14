// Regression: a message appended while the reader follows the transcript must
// arrive at its final size and position in its first painted frame. The
// virtualizer lays unseen rows out at an estimated height and corrects them when
// they are measured; if that correction lands after paint, the new row visibly
// settles upwards (and rows above it move a second time), which reads as jitter
// while autoscrolling. Real components, native layout, no mocked virtualizer.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { webkit, chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(process.argv[2] || 'build-chat-perf');
const mime = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = path.resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (!path.extname(file)) file = path.join(root, 'index.html');
  fs.readFile(file, (error, content) => {
    res.writeHead(error ? 404 : 200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(error ? 'not found' : content);
  });
});

// A message long enough to wrap on a phone-width transcript, like a real one.
const LONG = 'this line definitely wraps onto a second line on a phone transcript';

async function settle(engineName) {
  const browser = await (engineName === 'chromium' ? chromium : webkit).launch();
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const origin = `http://127.0.0.1:${server.address().port}/`;
  const results = { engine: engineName };
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', r => (r.request().url().startsWith(origin) ? r.continue() : r.abort()));
    await page.goto(origin + '?count=300&virtual=1', { waitUntil: 'load' });
    await page.waitForFunction(() => window.chatPerf && document.querySelector('.speech-display .message'));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(800);
    await page.waitForFunction(() => { const s = document.querySelector('.speech-display'); return s.scrollHeight - s.clientHeight - s.scrollTop < 11; });

    // First paint of the new row, then whether it ever moves afterwards.
    await page.evaluate(() => {
      const sc = document.querySelector('.speech-display');
      const top = el => Math.round(el.getBoundingClientRect().top * 10) / 10;
      const height = el => Math.round(el.getBoundingClientRect().height * 10) / 10;
      window.__frames = [];
      window.__heights = new Map();
      window.__diffs = [];
      const sample = () => {
        const rows = [...sc.querySelectorAll('.message')];
        const last = rows[rows.length - 1];
        const prev = rows[rows.length - 2];
        for (const node of sc.querySelectorAll("[data-index]")) {
          const h = Math.round(node.getBoundingClientRect().height * 10) / 10;
          const prev = window.__heights.get(node.dataset.index);
          if (prev != null && prev !== h) window.__diffs.push({ index: node.dataset.index, from: prev, to: h });
          window.__heights.set(node.dataset.index, h);
        }
        window.__frames.push({
          t: Math.round(performance.now()),
          st: Math.round(sc.scrollTop),
          lastId: last ? last.dataset.messageId : null,
          lastTop: last ? top(last) : null,
          lastH: last ? height(last) : null,
          prevTop: prev ? top(prev) : null,
          prevH: prev ? height(prev) : null,
          prevId: prev ? prev.dataset.messageId : null,
          sh: Math.round(sc.scrollHeight),
          lastWrapH: last && last.closest('[data-index]') ? Math.round(last.closest('[data-index]').getBoundingClientRect().height * 10) / 10 : null,
          lastWrapTop: last && last.closest('[data-index]') ? Math.round(last.closest('[data-index]').getBoundingClientRect().top * 10) / 10 : null,
        });
      };
      sample();
      let n = 0;
      const loop = () => { sample(); if (n++ < 90) requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
      window.__lastIdBefore = window.__frames[0].lastId;
    });
    await page.fill('#speechInput', LONG);
    await page.press('#speechInput', 'Enter');
    await page.waitForTimeout(1500);
    const measured = await page.evaluate(() => ({ frames: window.__frames, lastIdBefore: window.__lastIdBefore, diffs: window.__diffs }));

    const frames = measured.frames;
    const firstNew = frames.findIndex(f => f.lastId !== measured.lastIdBefore);
    assert(firstNew > 0, 'the appended row never appeared');

    // From the row's first painted frame onwards, its size and its distance from
    // the row above it must not change: that change is the visible settle.
    const after = frames.slice(firstNew).filter(f => f.lastId === frames[firstNew].lastId);
    const firstH = after[0].lastH;
    const firstGap = Math.round((after[0].lastTop - after[0].prevTop) * 10) / 10;
    const heights = [...new Set(after.map(f => f.lastH))];
    const gaps = [...new Set(after.map(f => Math.round((f.lastTop - f.prevTop) * 10) / 10))];

    results.firstPaintHeight = firstH;
    results.heightsSeen = heights;
    results.gapFirstPaint = firstGap;
    results.gapsSeen = gaps;
    results.rowHeightSettle = Math.round((firstH - heights[heights.length - 1]) * 10) / 10;
    results.rowGapSettle = Math.round((firstGap - gaps[gaps.length - 1]) * 10) / 10;
    // How many separate frames the row's own box changed in.
    results.heightChangeFrames = after.filter((f, i) => i > 0 && f.lastH !== after[i - 1].lastH).length;
    results.wrapperHeightDiffs = measured.diffs.slice(0, 10);
    results.wrapperHeightDiffCount = measured.diffs.length;
    results.prevHeightsSeen = [...new Set(after.map(f => f.prevH))];
    results.firstPaint = after[0] ? { scrollTop: after[0].st, lastTop: after[0].lastTop, lastHeight: after[0].lastH, previousTop: after[0].prevTop } : null;
    results.pageErrors = errors;
    await page.close();
    return results;
  } finally {
    await browser.close();
    server.close();
  }
}

(async () => {
  const out = [];
  for (const engine of ['chromium', 'webkit']) out.push(await settle(engine));
  console.log(JSON.stringify(out, null, 1));
  for (const r of out) {
    assert.equal(r.pageErrors.length, 0, `${r.engine}: browser exceptions`);
    assert(Math.abs(r.rowHeightSettle) <= 1, `${r.engine}: appended row changed height by ${r.rowHeightSettle}px after its first paint (must be ≤1px): heights ${JSON.stringify(r.heightsSeen)}`);
    assert(Math.abs(r.rowGapSettle) <= 1, `${r.engine}: appended row moved ${r.rowGapSettle}px relative to the row above it after first paint (must be ≤1px): gaps ${JSON.stringify(r.gapsSeen)}`);
  }
  console.log('transcript append settle: PASS');
})().catch(e => { console.error(e.message); process.exit(1); });
