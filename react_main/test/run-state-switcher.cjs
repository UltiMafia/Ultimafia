const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(process.argv[2] || 'build-chat-perf');
const publicDir = path.resolve(__dirname, '../public');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://x').pathname;
  let file;
  for (const dir of [root, publicDir]) {
    const candidate = path.resolve(dir, '.' + pathname);
    if (candidate.startsWith(dir + path.sep) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) { file = candidate; break; }
  }
  if (!file && !path.extname(pathname)) file = path.join(root, 'index.html');
  if (!file) return res.writeHead(404).end();
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}/`;
  const failures = [];
  try {
    for (const engine of ['chromium', 'webkit']) {
      const browser = await pw[engine].launch();
      try {
        for (const theme of ['dark', 'light']) for (const full of [false, true]) {
          const renderer = full ? '&full' : '';
          const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
          const errors = [];
          page.on('pageerror', e => errors.push(e.message));
          await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
          try {
            await page.goto(origin + `?theme=${theme}${renderer}`);
            await page.waitForSelector('.speech-display');
            const group = page.getByRole('group', { name: 'Game phase navigation' });
            await group.waitFor();
            assert.equal(await group.locator('text=Day 2').count(), 1);
            const geo = await page.evaluate(() => {
              const control = document.querySelector('[aria-label="Game phase navigation"]');
              const tabs = document.querySelector('.meeting-tabs');
              const wrapper = document.querySelector('.speech-wrapper');
              const transcript = document.querySelector('.speech-display');
              const r = control.getBoundingClientRect(), t = tabs.getBoundingClientRect();
              return { inTranscript: wrapper.contains(control), top: r.top, transcriptTop: transcript.getBoundingClientRect().top, tabsBottom: t.bottom, position: getComputedStyle(control.parentElement).position, overlayBackground: getComputedStyle(control.parentElement).backgroundColor, overlayPointerEvents: getComputedStyle(control.parentElement).pointerEvents, gutterBlocked: !!document.elementFromPoint(4, r.top + r.height / 2)?.closest('.mobile-phase-float'), width: document.documentElement.scrollWidth, viewport: innerWidth,
                targets: [...control.querySelectorAll('button')].map(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })) };
            });
            assert.equal(geo.inTranscript, true, 'pill must float over transcript, below meeting tabs');
            assert.ok(geo.top >= geo.tabsBottom, 'pill must not cover Village/timer header');
            assert.equal(geo.position, 'absolute', 'pill must float rather than add a toolbar row');
            assert.ok(Math.abs(geo.transcriptTop - geo.tabsBottom) <= 1, 'floating control must not reserve a toolbar band above chat');
            assert.equal(geo.overlayBackground, 'rgba(0, 0, 0, 0)', 'no full-width fill behind the pill');
            assert.equal(geo.overlayPointerEvents, 'none', 'empty space around pill must pass through to chat');
            assert.equal(geo.gutterBlocked, false, 'chat beside pill remains touchable');
            assert.ok(geo.width <= geo.viewport, 'must fit phone width');
            assert.ok(geo.targets.every(r => r.width >= 44 && r.height >= 44), '44px arrow targets');
            await page.getByRole('button', { name: 'Next phase', exact: true }).isDisabled().then(value => assert.ok(value));
            const disabledStyle = await page.getByRole('button', { name: 'Next phase', exact: true }).evaluate(el => {
              const style = getComputedStyle(el);
              return { background: style.backgroundColor, opacity: style.opacity };
            });
            assert.ok(!disabledStyle.background.startsWith('rgba(') || disabledStyle.background.endsWith(', 1)'), 'disabled arrow must retain an opaque fill');
            assert.equal(disabledStyle.opacity, '1', 'disabled arrow must not fade');
            for (const name of ['Night 1', 'Day 1', 'Pregame']) {
              await page.getByRole('button', { name: 'Previous phase', exact: true }).click();
              await group.getByText(name, { exact: true }).waitFor();
            }
            assert.ok(await page.getByRole('button', { name: 'Previous phase', exact: true }).isDisabled());
            await page.getByRole('button', { name: 'Next phase', exact: true }).click();
            await group.getByText('Day 1', { exact: true }).waitFor();
            if (full) await page.locator('.speech-display').evaluate(el => { el.scrollTop = 0; });
            await page.waitForFunction(() => {
              const scroller = document.querySelector('.speech-display');
              return scroller.scrollTop < 1 && !!scroller.querySelector('.message');
            });
            const firstMessage = await page.evaluate(() => {
              const control = document.querySelector('[aria-label="Game phase navigation"]').getBoundingClientRect();
              const scroller = document.querySelector('.speech-display');
              const first = scroller.querySelector('.message').getBoundingClientRect();
              return { top: first.top, controlBottom: control.bottom, gutter: first.top - scroller.getBoundingClientRect().top };
            });
            assert.ok(firstMessage.gutter >= 60, 'reserve scrollable space above the first message');
            assert.ok(firstMessage.top >= firstMessage.controlBottom, 'first message must clear floating controls');
            const chooser = page.getByRole('button', { name: 'Choose phase', exact: true });
            assert.equal(await chooser.count(), 1, 'center pill must open a direct phase chooser');
            await chooser.click();
            const menu = page.getByRole('menu', { name: 'Game phases', exact: true });
            await menu.waitFor();
            const menuGap = await menu.evaluate(el => {
              const dropdown = el.closest('.MuiPaper-root').getBoundingClientRect();
              const pill = document.querySelector('[aria-label="Choose phase"]').getBoundingClientRect();
              return dropdown.top - pill.bottom;
            });
            assert.ok(menuGap >= 7 && menuGap <= 9, `dropdown must have an 8px gap below the pill, got ${menuGap}px`);
            if (process.env.SCREENSHOT_DIR && !full) {
              fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
              await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `state-pill-menu-${engine}-${theme}.png`), animations: 'disabled' });
            }
            assert.deepEqual(await menu.getByRole('menuitem').allTextContents(), ['Pregame', 'Day 1', 'Night 1', 'Day 2']);
            assert.equal(await menu.getByRole('menuitem', { name: 'Day 1', exact: true }).getAttribute('aria-current'), 'step');
            await menu.getByRole('menuitem', { name: 'Night 1', exact: true }).click();
            await group.getByText('Night 1', { exact: true }).waitFor();
            await menu.waitFor({ state: 'hidden' });
            await chooser.click();
            await menu.getByRole('menuitem', { name: 'Day 1', exact: true }).click();
            await group.getByText('Day 1', { exact: true }).waitFor();
            await chooser.focus();
            await page.keyboard.press('Enter');
            await menu.waitFor();
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');
            await group.getByText('Night 1', { exact: true }).waitFor();
            await chooser.press('Enter');
            await menu.waitFor();
            await page.keyboard.press('Escape');
            await menu.waitFor({ state: 'hidden' });
            await chooser.click();
            await menu.getByRole('menuitem', { name: 'Day 1', exact: true }).click();
            assert.equal(await group.evaluate(el => getComputedStyle(el).touchAction), 'manipulation', 'retain the CSS gesture hint');
            // Emulated viewport scale cannot establish iOS double-tap behavior. Test
            // cancellation of the native default action, including disabled targets.
            const nativeTap = await page.getByRole('button', { name: 'Next phase', exact: true }).evaluate(button => {
              const point = { identifier: 1, clientX: 10, clientY: 10 };
              const fire = (type, touches) => {
                const event = new Event(type, { bubbles: true, cancelable: true });
                Object.defineProperties(event, { touches: { value: touches }, changedTouches: { value: [point] } });
                button.dispatchEvent(event);
                return event.defaultPrevented;
              };
              fire('touchstart', [point]);
              return fire('touchend', []);
            });
            assert.equal(nativeTap, true, 'a phase tap must cancel native touchend, not just set CSS');
            await group.getByText('Night 1', { exact: true }).waitFor();
            await page.getByRole('button', { name: 'Previous phase', exact: true }).click();
            await group.getByText('Day 1', { exact: true }).waitFor();
            const gestures = await group.evaluate(async controls => {
              const clicks = [];
              const recordClick = event => clicks.push(event.target.closest('button')?.getAttribute('aria-label'));
              controls.addEventListener('click', recordClick, true);
              const phase = () => controls.querySelector('[aria-live="polite"]').textContent;
              const next = () => controls.querySelector('[aria-label="Next phase"]');
              const point = { identifier: 1, clientX: 10, clientY: 10 };
              const fire = (target, type, touches, changedTouches = [point], cancelable = true) => {
                const event = new Event(type, { bubbles: true, cancelable });
                Object.defineProperties(event, { touches: { value: touches }, changedTouches: { value: changedTouches } });
                target.dispatchEvent(event);
                return event.defaultPrevented;
              };
              const tap = target => { fire(target, 'touchstart', [point]); return fire(target, 'touchend', []); };
              try {
                const rapid = ['Next phase', 'Next phase', 'Next phase', 'Next phase', 'Previous phase', 'Previous phase', 'Previous phase', 'Previous phase'].map(name => {
                  const button = controls.querySelector(`[aria-label="${name}"]`);
                  return { canceled: tap(button.querySelector('i')), phase: phase() };
                });
                const gap = tap(controls);
                const clicksAfterTaps = clicks.length;
                const button = next();
                fire(button, 'touchstart', [point]);
                fire(button, 'touchmove', [{ ...point, clientX: 40 }]);
                const swipe = fire(button, 'touchend', []);
                fire(button, 'touchstart', [point]);
                fire(button, 'touchstart', [point, { ...point, identifier: 2 }]);
                const pinchFirst = fire(button, 'touchend', [point], [{ ...point, identifier: 2 }]);
                const pinchLast = fire(button, 'touchend', []);
                fire(button, 'touchstart', [point]);
                const outsideTarget = document.querySelector('.speech-display');
                fire(outsideTarget, 'touchstart', [point, { ...point, identifier: 2 }]);
                fire(outsideTarget, 'touchend', [point], [{ ...point, identifier: 2 }]);
                const mixedPinch = fire(button, 'touchend', []);
                fire(button, 'touchstart', [point]);
                fire(button, 'touchcancel', []);
                const canceled = fire(button, 'touchend', []);
                fire(button, 'touchstart', [point]);
                const uncancelable = fire(button, 'touchend', [], [point], false);
                fire(button, 'touchstart', [point]);
                await new Promise(resolve => setTimeout(resolve, 550));
                const held = fire(button, 'touchend', []);
                const outside = tap(document.querySelector('.speech-display'));
                return { rapid, gap, clicksAfterTaps, extraClicks: clicks.length - clicksAfterTaps, swipe, pinchFirst, pinchLast, mixedPinch, canceled, uncancelable, held, outside, phase: phase() };
              } finally { controls.removeEventListener('click', recordClick, true); }
            });
            assert.deepEqual(gestures.rapid.map(tap => tap.phase), ['Night 1', 'Day 2', 'Day 2', 'Day 2', 'Night 1', 'Day 1', 'Pregame', 'Pregame'], 'rapid taps activate each enabled phase once');
            assert.ok(gestures.rapid.every(tap => tap.canceled), 'cancel all rapid taps, including disabled arrows');
            assert.equal(gestures.gap, true, 'gaps within the compact control group must not double-tap zoom');
            assert.equal(gestures.clicksAfterTaps, 5, 'disabled arrows and gaps must not synthesize clicks');
            assert.equal(gestures.extraClicks, 0, 'swipe, pinch, canceled/uncancelable touches, holds and outside taps must not synthesize phase clicks');
            for (const gesture of ['swipe', 'pinchFirst', 'pinchLast', 'mixedPinch', 'canceled', 'uncancelable', 'held', 'outside']) assert.equal(gestures[gesture], false, `${gesture} keeps its native default`);
            assert.equal(gestures.phase, 'Pregame');
            await group.evaluate(controls => {
              window.phaseTouchEnds = [];
              controls.addEventListener('touchend', event => window.phaseTouchEnds.push(event.defaultPrevented), true);
            });
            const disabledBox = await page.getByRole('button', { name: 'Previous phase', exact: true }).boundingBox();
            for (let i = 0; i < 4; i++) await page.touchscreen.tap(disabledBox.x + disabledBox.width / 2, disabledBox.y + disabledBox.height / 2);
            assert.deepEqual(await page.evaluate(() => window.phaseTouchEnds), [true, true, true, true], 'browser-dispatched disabled-arrow taps cancel native defaults');
            await chooser.tap();
            await menu.waitFor();
            await menu.getByRole('menuitem', { name: 'Day 1', exact: true }).click();
            await group.evaluate(controls => {
              window.realTapClicks = [];
              window.realTapTouchEnds = [];
              controls.addEventListener('click', event => {
                const button = event.target.closest('button[aria-label]');
                if (button) window.realTapClicks.push(button.getAttribute('aria-label'));
              }, true);
              controls.addEventListener('touchend', event => window.realTapTouchEnds.push(event.defaultPrevented), true);
            });
            for (const [direction, name] of [['Next phase', 'Night 1'], ['Next phase', 'Day 2'], ['Previous phase', 'Night 1'], ['Previous phase', 'Day 1']]) {
              await page.getByRole('button', { name: direction, exact: true }).tap();
              await group.getByText(name, { exact: true }).waitFor();
            }
            assert.deepEqual(await page.evaluate(() => window.realTapClicks), ['Next phase', 'Next phase', 'Previous phase', 'Previous phase'], 'each real touchscreen tap produces exactly one button click');
            assert.deepEqual(await page.evaluate(() => window.realTapTouchEnds), [true, true, true, true], 'each real touchscreen tap cancels native touchend default');
            if (engine === 'chromium') {
              // Touch events retain their START target even when the finger leaves it.
              // Exercise native routing (not synthetic dispatch) across the group edge.
              await group.evaluate(controls => {
                window.outwardTouchEnds = [];
                for (const type of ['touchend', 'touchcancel']) controls.addEventListener(type, event => {
                  window.outwardTouchEnds.push({ type: event.type, target: event.target.closest('button')?.getAttribute('aria-label'), canceled: event.defaultPrevented });
                }, true);
              });
              const box = await page.getByRole('button', { name: 'Next phase', exact: true }).boundingBox();
              const session = await page.context().newCDPSession(page);
              try {
                const y = box.y + box.height / 2;
                await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y }] });
                await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 4, y }] });
                await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
              } finally { await session.detach(); }
              const endings = await page.evaluate(() => window.outwardTouchEnds);
              assert.equal(endings.length, 1, 'ending a touch outside the group still reaches its start target');
              assert.equal(endings[0].target, 'Next phase');
              assert.equal(endings[0].canceled, false, 'leaving the control remains a native gesture');
              assert.deepEqual(await page.evaluate(() => window.realTapClicks), ['Next phase', 'Next phase', 'Previous phase', 'Previous phase'], 'an outward drag must not click the starting button');
              await group.getByText('Day 1', { exact: true }).waitFor();
            }
            assert.equal(await page.evaluate(() => visualViewport.scale), 1, 'emulated viewport smoke check, not physical-iOS zoom verification');
            assert.equal(await page.locator('.MuiBottomNavigation-root [aria-label="Game phase navigation"]').count(), 0);
            const nav = page.locator('.MuiBottomNavigation-root');
            assert.deepEqual(await nav.locator('.MuiBottomNavigationAction-label').allTextContents(), ['Players', 'Info', 'Chat', 'Actions', 'Menu']);
            await nav.getByRole('button').filter({ hasText: 'Players' }).click();
            assert.equal(await group.isVisible(), false);
            await nav.getByRole('button').filter({ hasText: 'Chat' }).click();
            await group.waitFor({ state: 'visible' });
            if (process.env.SCREENSHOT_DIR) {
              fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
              await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `state-pill-${engine}-${theme}${full ? '-full' : ''}.png`), animations: 'disabled' });
            }
            for (const width of [320, 375, 414]) {
              await page.setViewportSize({ width, height: 844 });
              assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px fits`);
            }
            await page.goto(origin + `?theme=${theme}${renderer}&finished&review`);
            await page.getByRole('group', { name: 'Game phase navigation' }).getByText('Postgame', { exact: true }).waitFor();
            assert.ok(await page.getByRole('button', { name: 'Next phase', exact: true }).isDisabled());
            await chooser.click();
            await menu.waitFor();
            assert.deepEqual(await menu.getByRole('menuitem').allTextContents(), ['Pregame', 'Day 1', 'Night 1', 'Day 2', 'Postgame']);
            await page.keyboard.press('Escape');
            await menu.waitFor({ state: 'hidden' });
            await page.getByRole('button', { name: 'Previous phase', exact: true }).click();
            await page.getByRole('group', { name: 'Game phase navigation' }).getByText('Day 2', { exact: true }).waitFor();
            await page.goto(origin + `?theme=${theme}${renderer}&single`);
            await page.waitForSelector('.speech-display');
            assert.equal(await page.getByRole('group', { name: 'Game phase navigation' }).count(), 0);
            await page.setViewportSize({ width: 1280, height: 900 });
            await page.goto(origin + `?theme=${theme}${renderer}`);
            await page.getByTestId('desktop-state-control').waitFor();
            assert.equal(await page.getByRole('group', { name: 'Game phase navigation' }).count(), 0);
            assert.ok(await page.getByRole('button', { name: 'Go to first state', exact: true }).isVisible());
            assert.equal(await page.getByRole('tab', { name: 'Day 2', exact: true }).count(), 1);
            assert.deepEqual(errors, [], 'no browser exceptions');
            console.log(`${engine}/${theme}/${full ? 'full' : 'virtual'}: phase order, endpoints, gutter, panels, widths, desktop: PASS`);
          } catch (e) { failures.push(`${engine}/${theme}: ${e.message}`);console.error(e.stack); }
          finally { await page.close(); }
        }
      } finally { await browser.close(); }
    }
  } finally { server.close(); }
  assert.deepEqual(failures, []);
})().catch(e => { console.error(e.message);process.exitCode = 1; });
