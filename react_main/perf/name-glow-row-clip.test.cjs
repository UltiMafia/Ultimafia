// A glowing name in the players list must not be clipped by its row.
//
// The row used to clip (`overflow: hidden`, later `overflow: clip`), which cuts a
// text-shadow at the row's edge. `overflow-clip-margin` does not exist in Safari,
// so a margin is not a fix: the row must not clip at all, and truncation has to
// happen on the name itself for names that are not glowing.
//
// Measures the same thing a person sees: is there a hard luminance step just
// outside the row/side of the name's box (clipped) or a smooth ramp (halo)?
const assert = require('node:assert/strict');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const BASE = process.env.GLOW_PAGE || 'http://100.110.196.127:3001/game/virtualization-5000';

async function run(engineName) {
  const engine = engineName === 'webkit' ? pw.webkit : pw.chromium;
  const browser = await engine.launch();
  const context = await browser.newContext({ viewport: { width: 420, height: 320 }, colorScheme: 'dark', deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(9000);
    await page.getByRole('button', { name: 'Accept All' }).click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(500);

    const setup = await page.evaluate(async () => {
      await document.fonts.ready;
      document.querySelectorAll('#rowClip').forEach((n) => n.remove());
      const host = document.createElement('div');
      host.id = 'rowClip';
      host.className = 'game';
      host.style.cssText = 'position:fixed;left:16px;top:60px;z-index:99999;background:#1b1b1e;padding:10px;width:230px';
      host.innerHTML = `
        <div class="player-list">
          <div class="player">
            <div class="user-name" id="plainName"><span class="user-name-text">a-really-very-long-player-name-that-must-truncate</span></div>
          </div>
          <div class="player">
            <div class="user-name name-anim-glow" id="glowName"><span class="user-name-text">ASPECT8445</span></div>
          </div>
        </div>`;
      document.body.appendChild(host);
      const glow = host.querySelector('#glowName');
      glow.style.fontFamily = 'Spooky, cursive';
      glow.style.fontSize = '22px';
      glow.style.color = '#e6e6ff';
      glow.style.setProperty('--name-glow-rgb', '230 230 255');
      glow.style.setProperty('--name-glow-dim-alpha', '0.41');
      glow.style.setProperty('--name-glow-peak-alpha', '0.34');
      const animation = glow.getAnimations()[0];
      if (animation) {
        animation.pause();
        animation.currentTime = 800;
      }

      // Any ancestor that clips would cut the halo.
      const clipping = [];
      for (let node = glow; node && node !== document.body; node = node.parentElement) {
        const cs = getComputedStyle(node);
        if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible' || cs.contain !== 'none') {
          clipping.push({ cls: String(node.className).slice(0, 30), overflow: cs.overflowX + '/' + cs.overflowY, contain: cs.contain });
        }
      }

      const row = glow.closest('.player');
      const plainText = host.querySelector('#plainName');
      const box = glow.getBoundingClientRect();
      const rowBox = row.getBoundingClientRect();
      return {
        clipping,
        rowOverflow: getComputedStyle(row).overflowX + '/' + getComputedStyle(row).overflowY,
        longNameTruncates: plainText.scrollWidth > plainText.clientWidth,
        box: { x: box.x, y: box.y, width: box.width, height: box.height },
        rowBox: { x: rowBox.x, y: rowBox.y, width: rowBox.width, height: rowBox.height },
        filter: getComputedStyle(glow).filter,
      };
    });

    // Luminance across the name's own bottom edge: a clipped halo steps hard at
    // the border box, a diffuse one ramps over several pixels.
    const clip = {
      x: Math.max(0, Math.round(setup.box.x) - 24),
      y: Math.max(0, Math.round(setup.box.y) - 24),
      width: Math.round(setup.box.width) + 48,
      height: Math.round(setup.box.height) + 48,
    };
    const shot = await page.screenshot({ clip });

    return { engine: engineName, ...setup, shot: shot.toString('base64'), clip };
  } finally {
    await browser.close().catch(() => {});
  }
}

// The decisive facts are structural: nothing above the name may clip, and the
// row's own overflow must be visible. A clip anywhere in that chain cuts the
// halo at its edge - `overflow-clip-margin` cannot rescue it, because Safari
// does not support the property. The screenshot is kept as an artifact for the
// eye; the assertions are on the computed styles, which are engine independent.
(async () => {
  const results = [];
  for (const engine of ['webkit', 'chromium']) {
    const r = await run(engine);
    const file = `/tmp/evidence/name-glow-row-clip-${engine}.png`;
    require('fs').writeFileSync(file, Buffer.from(r.shot, 'base64'));
    results.push({ ...r, shot: undefined, screenshot: file });
  }
  console.log(JSON.stringify(results, null, 1));

  for (const r of results) {
    assert.equal(r.clipping.length, 0, `${r.engine}: a clipping ancestor cuts the halo: ${JSON.stringify(r.clipping)}`);
    assert.equal(r.rowOverflow, 'visible/visible', `${r.engine}: player row clips (${r.rowOverflow}); overflow-clip-margin is not a fix, Safari lacks it`);
    assert.equal(r.longNameTruncates, true, `${r.engine}: long non-glowing names must still truncate`);
    assert.equal(r.filter, 'none', `${r.engine}: the glow must not run through a filter`);
  }
  console.log('players-list glow: PASS');
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
