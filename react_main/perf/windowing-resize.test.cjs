// Paused width reflows must not strand stable mounted rows at estimated offsets.
// Run against a fresh chat-perf build; ENGINE=chromium (default) or webkit.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(process.argv[2] || 'build-chat-perf');
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (!path.extname(file)) file = path.join(root, 'index.html');
  fs.readFile(file, (error, body) => {
    res.writeHead(error ? 404 : 200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(error ? 'not found' : body);
  });
});

// Read all adjacent boxes in ONE frame. Height-only checks miss absolute-offset gaps.
const geometry = () => {
  const display = document.querySelector('.speech-display');
  const top = display.getBoundingClientRect().top;
  const virtual = display.hasAttribute('data-transcript-window');
  const rows = [...display.querySelectorAll(virtual ? '[data-index]' : '.message')];
  const boxes = rows.map(row => {
    const box = row.getBoundingClientRect();
    return { index: Number(row.dataset.index), id: (row.matches('.message') ? row : row.querySelector('.message'))?.dataset.messageId,
      top: box.top - top, bottom: box.bottom - top, height: box.height };
  });
  const gaps = boxes.slice(1).map((box, i) => box.top - boxes[i].bottom);
  const visible = boxes.find(box => box.bottom > 0 && box.id);
  return { width: display.clientWidth, mounted: boxes.length, gaps, anchor: visible && { id: visible.id, offset: visible.top },
    ids: boxes.map(box => box.id).filter(Boolean), indices: boxes.map(box => box.index),
    heights: Object.fromEntries(boxes.filter(box => box.id).map(box => [box.id, box.height])),
    bottomGap: display.scrollHeight - display.clientHeight - display.scrollTop };
};

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const engine = process.env.ENGINE || 'chromium';
  const browser = await ({ chromium, webkit }[engine]).launch();
  const results = [];
  try {
    for (const virtual of [1, 0]) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        await page.goto(`http://127.0.0.1:${server.address().port}/?count=1000&nameplates=700&cosmetic=none&virtual=${virtual}`);
        await page.waitForFunction(() => window.chatPerf && document.querySelector('.speech-display .message'));
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(800);
        const baseline = await page.evaluate(geometry);
        let following = true;
        const check = async label => {
          const value = await page.evaluate(geometry);
          assert.ok(value.mounted > 5, `${label}: probe must see rows`);
          assert.equal(new Set(value.ids).size, value.ids.length, `${label}: duplicate message identity`);
          if (virtual) {
            assert.ok(value.mounted < 100, `${label}: virtualization retained`);
            if (following) assert.ok(value.bottomGap <= 2, `${label}: lost bottom following: ${value.bottomGap}`);
            assert.ok(value.indices.every((index, i, all) => !i || index === all[i - 1] + 1), `${label}: ordered consecutive rows`);
            assert.ok(value.gaps.every(gap => Math.abs(gap) <= 1), `${label}: stale gap/overlap ${JSON.stringify(value)}`);
          } else {
            assert.ok(value.gaps.every((gap, i) => i >= baseline.gaps.length
              ? gap >= -1 && gap <= Math.max(...baseline.gaps) + 1
              : Math.abs(gap - baseline.gaps[i]) <= 1), `${label}: control spacing changed`);
          }
          assert.deepEqual(errors, [], `${label}: browser errors`);
          return value;
        };
        await check('baseline');
        if (virtual) {
          // Positive control: demonstrate that the probe detects a real 20px offset.
          await page.locator('[data-index]').nth(3).evaluate(row => { row.style.transform = 'translateY(20px)'; });
          const shifted = await page.evaluate(geometry);
          assert.ok(shifted.gaps.some(gap => Math.abs(gap - 20) < 1), 'positive control detects 20px gap');
          await page.locator('[data-index]').nth(3).evaluate(row => { row.style.transform = ''; });
        }
        let steps = 0;
        let wrapped = false;
        // Pause at intermediate widths, not just the final narrow state (which can remount).
        for (const [from, to, step] of [[1280, 960, -8], [960, 1280, 16], [1280, 960, -16], [960, 1280, 16]]) {
          for (let width = from; step < 0 ? width >= to : width <= to; width += step) {
            await page.setViewportSize({ width, height: 900 });
            await page.waitForTimeout(180);
            const resized = await check(`width ${width}, step ${steps++}`);
            wrapped ||= Object.entries(resized.heights).some(([id, height]) => baseline.heights[id] != null && Math.abs(baseline.heights[id] - height) > 2);
          }
        }
        assert.ok(wrapped, 'width sweep must actually change text wrapping/row heights');
        await page.waitForTimeout(1000);
        await check('idle after resize');
        await page.evaluate(() => window.chatPerf.append());
        await page.waitForTimeout(500);
        await check('append after resize');
        // Font completion clears the same cache even if no box resizes again.
        for (let i = 0; i < 3; i++) {
          await page.evaluate(() => document.fonts.dispatchEvent(new Event('loadingdone')));
          await page.waitForTimeout(400);
          await check(`font completion ${i}`);
        }
        await page.evaluate(() => {
          for (let i = 0; i < 10; i++) document.fonts.dispatchEvent(new Event('loadingdone'));
        });
        await page.waitForTimeout(400);
        const final = await check('coalesced font burst');
        if (virtual) {
          following = false;
          // Native input cancels any unfinished end command before parking in history.
          await page.locator('.speech-display').hover();
          await page.mouse.wheel(0, -200);
          await page.waitForTimeout(250);
          await page.evaluate(() => { const s = document.querySelector('.speech-display'); s.scrollTop = s.scrollHeight / 2; });
          await page.waitForTimeout(600);
          const before = (await check('middle before resize')).anchor;
          assert.ok(Number(before.id.slice(5)) > 200 && Number(before.id.slice(5)) < 800, 'probe must reach middle history');
          for (const width of [1200, 1104, 1008, 960, 1040, 1168, 1280, 1120, 960, 1280]) {
            await page.setViewportSize({ width, height: 900 });
            await page.waitForTimeout(400);
            const after = (await check(`middle width ${width}`)).anchor;
            assert.equal(after.id, before.id, 'resize preserves anchor identity');
            assert.ok(Math.abs(after.offset - before.offset) <= 2, `resize preserves signed anchor offset: ${JSON.stringify({ before, after })}`);
          }
          await page.evaluate(() => { window.chatPerf.append(); document.fonts.dispatchEvent(new Event('loadingdone')); });
          await page.waitForTimeout(600);
          const after = (await check('middle append and font completion')).anchor;
          assert.equal(after.id, before.id, 'append/font preserves anchor identity');
          assert.ok(Math.abs(after.offset - before.offset) <= 2, 'append/font preserves anchor offset');
          await page.evaluate(() => {
            document.querySelector('.game').style.display = 'none';
            document.fonts.dispatchEvent(new Event('loadingdone'));
          });
          await page.waitForTimeout(250);
          await page.evaluate(() => { document.querySelector('.game').style.display = ''; });
          await page.waitForTimeout(600);
          const shown = (await check('font completion while hidden')).anchor;
          assert.equal(shown.id, before.id, 'hidden font invalidation preserves anchor identity');
          assert.ok(Math.abs(shown.offset - before.offset) <= 2, 'hidden font invalidation preserves anchor offset');
        }
        results.push({ engine, virtual, steps, final: { width: final.width, mounted: final.mounted,
          maxGap: Math.max(...final.gaps), minGap: Math.min(...final.gaps), bottomGap: final.bottomGap } });
      } finally { await page.close(); }
    }
    // Real stateViewing changes run Game's production phase-key/remount path.
    const phasePage = await browser.newPage({ viewport: { width: 1104, height: 900 } });
    const phaseErrors = [];
    phasePage.on('pageerror', error => phaseErrors.push(error.message));
    try {
      await phasePage.goto(`http://127.0.0.1:${server.address().port}/?count=1000&nameplates=700&virtual=1&phases=1`);
      await phasePage.waitForFunction(() => window.chatPerf && document.querySelector('[data-transcript-window] .message'));
      await phasePage.evaluate(() => document.fonts.ready);
      await phasePage.waitForTimeout(800);
      for (const phase of [0, 1, 0, 1]) {
        // Queue old-instance work immediately before the remount.
        await phasePage.evaluate(phase => {
          document.fonts.dispatchEvent(new Event('loadingdone'));
          window.chatPerf.viewPhase(phase);
        }, phase);
        await phasePage.waitForTimeout(650);
        const state = await phasePage.evaluate(geometry);
        assert.ok(state.mounted > 5 && state.mounted < 100, 'phase remains windowed');
        assert.ok(state.gaps.every(gap => Math.abs(gap) <= 1), 'phase spacing');
        if (phase === 0) {
          assert.equal(state.anchor.id, 'perf-0', 'older phase starts at first message');
          assert.ok(Math.abs(state.anchor.offset) <= 2, 'older phase starts at top');
        } else {
          assert.ok(state.bottomGap <= 2, 'return to live follows bottom');
          assert.ok(state.ids.includes('perf-1999'), 'live phase shows its newest message');
        }
      }
      await phasePage.evaluate(() => window.chatPerf.append());
      await phasePage.waitForTimeout(500);
      const appended = await phasePage.evaluate(geometry);
      assert.ok(appended.ids.includes('perf-2000'), 'new arrival appears in live phase');
      assert.ok(appended.bottomGap <= 2 && appended.gaps.every(gap => Math.abs(gap) <= 1), 'new phase append stays aligned');
      assert.deepEqual(phaseErrors, [], 'phase browser errors');
      results.push({ engine, phaseRoundTrips: 2, appended: 'perf-2000' });
    } finally { await phasePage.close(); }
    console.log(JSON.stringify(results));
    console.log(`${engine}: paused resize and font invalidation checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
