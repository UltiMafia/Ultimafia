// Obituary (newspaper) rows must measure and space identically with and
// without virtualization. Obituaries are the tallest, least frequent rows in
// the transcript, so they are the worst case for the unseen-row estimate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(process.argv[2] || 'build-chat-perf');
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  let f = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (f !== root && !f.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (!path.extname(f)) f = path.join(root, 'index.html');
  fs.readFile(f, (e, b) => {
    res.writeHead(e ? 404 : 200, { 'Content-Type': mime[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(e ? 'not found' : b);
  });
});

const TITLES = ['OBITUARIES', 'EVENING NEWS', 'THE MILLER TIMES'];

async function collect(page, windowed) {
  return page.evaluate(({ titles, windowed }) => {
    const s = document.querySelector('.speech-display');
    // Virtualized rows are wrapped; in full DOM the newspaper is a direct
    // child of the transcript because it renders before the message wrapper.
    const rows = windowed ? [...s.querySelectorAll('.transcript-window-row')] : [...s.children];
    // Compare content edges, not wrapper edges: the wrapper contains the
    // child margins (flow-root), so its box is 8px larger on each side.
    const content = (el) => {
      if (el.matches('.newspaper')) return el;
      const paper = el.querySelector('.newspaper');
      if (paper) return paper;
      return el.matches('.message') ? el : el.querySelector('.message') || el;
    };
    return rows.map((el) => {
      const target = content(el);
      const paper = target.matches('.newspaper') ? target : null;
      const b = target.getBoundingClientRect();
      const txt = paper ? (paper.innerText || '').toUpperCase() : '';
      return {
        title: paper ? titles.find((t) => txt.startsWith(t)) || 'PAPER' : null,
        top: b.top,
        bottom: b.bottom,
        height: b.height,
      };
    });
  }, { titles: TITLES, windowed });
}

function papers(rows) {
  const out = {};
  rows.forEach((row, i) => {
    if (!row.title) return;
    const next = rows[i + 1];
    out[row.title] = {
      height: Math.round(row.height * 100) / 100,
      gapBelow: next ? Math.round((next.top - row.bottom) * 100) / 100 : null,
    };
  });
  return out;
}

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/?count=120&nameplates=120&cosmetic=static&obits=1`;
  const browser = await webkit.launch();
  const result = {};

  for (const mode of ['full', 'windowed']) {
    const windowed = mode === 'windowed';
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${url}&virtual=${windowed ? 1 : 0}`);
    await page.waitForFunction(() => document.querySelector('.speech-display'));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);

    const found = {};
    if (!windowed) {
      Object.assign(found, papers(await collect(page, false)));
    } else {
      // Leave follow mode with a real wheel gesture first; otherwise the view
      // re-pins to the bottom after every programmatic scroll.
      await page.mouse.move(195, 420);
      await page.mouse.wheel(0, -600);
      await page.waitForTimeout(250);
      const total = await page.evaluate(() => document.querySelector('.speech-display').scrollHeight);
      const seek = async (top) => {
        await page.evaluate((t) => {
          const s = document.querySelector('.speech-display');
          s.scrollTop = t;
          s.dispatchEvent(new Event('scroll', { bubbles: true }));
        }, top);
        await page.waitForTimeout(110);
        Object.assign(found, papers(await collect(page, true)));
      };
      for (let top = 200; top <= total; top += 260) await seek(top);
      // Rows measured late can change the offsets; sweep back up as well.
      for (let top = total; top >= 0; top -= 260) await seek(top);
      // The last row only mounts once the bottom settles, which is slower than
      // the per-step wait.
      await page.evaluate(() => {
        const s = document.querySelector('.speech-display');
        s.scrollTop = s.scrollHeight * 2;
        s.dispatchEvent(new Event('scroll', { bubbles: true }));
      });
      await page.waitForTimeout(700);
      Object.assign(found, papers(await collect(page, true)));
    }

    assert.equal(Object.keys(found).length, 3, `${mode}: expected 3 obituaries, found ${Object.keys(found).join(',') || 'none'}`);
    result[mode] = found;
    await page.close();
  }

  await browser.close();
  server.close();

  let failures = 0;
  for (const title of TITLES) {
    const a = result.full[title];
    const b = result.windowed[title];
    const hd = Math.abs(a.height - b.height);
    const gd = a.gapBelow == null || b.gapBelow == null ? 0 : Math.abs(a.gapBelow - b.gapBelow);
    const ok = hd <= 2 && gd <= 2;
    if (!ok) failures++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${title}: height ${a.height} vs ${b.height} (${hd.toFixed(2)}), gap below ${a.gapBelow} vs ${b.gapBelow} (${gd.toFixed(2)})`);
  }
  console.log(JSON.stringify(result));
  assert.equal(failures, 0, `${failures} obituary row(s) differ between full and windowed`);
})();
