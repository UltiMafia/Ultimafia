// Real game composer/reducer; only the socket is replaced by perf/chat.jsx.
// Dispatch mobile editing events explicitly: Playwright's keyboard simulates a
// hardware keyboard, not an iOS software keyboard.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(process.argv[2] || 'build-chat-perf');
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + new URL(req.url, 'http://x').pathname);
  if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (!path.extname(file)) file = path.join(root, 'index.html');
  fs.readFile(file, (error, data) => {
    res.writeHead(error ? 404 : 200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(error ? 'not found' : data);
  });
});
const cases = {
  async mobileReturn(page) {
    for (const inputType of ['insertLineBreak', 'insertParagraph']) {
      await page.fill('#speechInput', inputType);
      const prevented = await page.$eval('#speechInput', (el, type) => {
        // No Enter keydown: some software keyboards only emit editing events.
        const event = new InputEvent('beforeinput', { inputType: type, bubbles: true, cancelable: true });
        return !el.dispatchEvent(event);
      }, inputType);
      assert.equal(prevented, true, `${inputType} must prevent a newline`);
      await page.waitForFunction(text => window.chatPerf.sent.some(s => s.event === 'speak' && s.data.content === text), inputType);
      await page.waitForFunction(() => document.querySelector('#speechInput').value === '');
    }
  },
  async inputFallback(page) {
    await page.fill('#speechInput', 'fallback return');
    await page.$eval('#speechInput', el => {
      // Simulate an already-performed/non-cancelable mobile insertion.
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, 'fallback return\n');
      el.dispatchEvent(new InputEvent('input', { inputType: 'insertLineBreak', bubbles: true }));
    });
    assert.equal(await page.inputValue('#speechInput'), 'fallback return');
    assert.deepEqual(await speaks(page), ['fallback return']);
  },
  async shiftEnter(page) {
    await page.fill('#speechInput', 'shift return');
    await page.press('#speechInput', 'Shift+Enter');
    assert.deepEqual(await speaks(page), ['shift return']);
    assert.equal((await page.inputValue('#speechInput')).includes('\n'), false);
  },
  async doubleEnter(page) {
    await page.fill('#speechInput', 'send only once');
    await page.press('#speechInput', 'Enter');
    await page.press('#speechInput', 'Enter');
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    assert.deepEqual(await speaks(page), ['send only once'], 'Enter/Enter/click before echo must send once');
    await page.waitForFunction(() => document.querySelector('#speechInput').value === '');
    // Intentional repetition after confirmation is allowed.
    await page.fill('#speechInput', 'send only once');
    await page.press('#speechInput', 'Enter');
    assert.deepEqual(await speaks(page), ['send only once', 'send only once']);
  },
  async keyAndBeforeInput(page) {
    await page.fill('#speechInput', 'both events');
    await page.press('#speechInput', 'Enter');
    await page.$eval('#speechInput', el => el.dispatchEvent(new InputEvent('beforeinput', {
      inputType: 'insertParagraph', bubbles: true, cancelable: true,
    })));
    assert.deepEqual(await speaks(page), ['both events']);
  },
  async unidentifiedMobileKey(page) {
    await page.fill('#speechInput', 'mobile commit');
    await page.$eval('#speechInput', el => {
      el.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Unidentified', keyCode: 229, bubbles: true, cancelable: true,
      }));
      el.dispatchEvent(new InputEvent('beforeinput', {
        inputType: 'insertLineBreak', bubbles: true, cancelable: true,
      }));
    });
    assert.deepEqual(await speaks(page), ['mobile commit']);
  },
  async nonCancelableReturn(page) {
    await page.fill('#speechInput', 'noncancelable');
    await page.$eval('#speechInput', el => {
      el.dispatchEvent(new InputEvent('beforeinput', {
        inputType: 'insertLineBreak', bubbles: true, cancelable: false,
      }));
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, 'noncancelable\n');
      el.dispatchEvent(new InputEvent('input', { inputType: 'insertLineBreak', bubbles: true }));
    });
    assert.deepEqual(await speaks(page), ['noncancelable']);
    assert.equal(await page.inputValue('#speechInput'), 'noncancelable');
  },
  async emptyReturn(page) {
    await page.fill('#speechInput', '');
    await page.press('#speechInput', 'Shift+Enter');
    const prevented = await page.$eval('#speechInput', el => !el.dispatchEvent(new InputEvent('beforeinput', {
      inputType: 'insertParagraph', bubbles: true, cancelable: true,
    })));
    assert.equal(prevented, true);
    assert.equal(await page.inputValue('#speechInput'), '');
    assert.deepEqual(await speaks(page), []);
  },
  async noEchoRetry(page) {
    await page.fill('#speechInput', 'retry lost send');
    await page.press('#speechInput', 'Enter');
    await page.press('#speechInput', 'Enter');
    assert.deepEqual(await speaks(page), ['retry lost send']);
    assert.equal(await page.inputValue('#speechInput'), 'retry lost send');
    await page.evaluate(() => {
      const now = Date.now.bind(Date);
      Date.now = () => now() + 6000;
    });
    await page.press('#speechInput', 'Enter');
    assert.deepEqual(await speaks(page), ['retry lost send', 'retry lost send']);
  },
  async paste(page) {
    await page.fill('#speechInput', 'one\ntwo\r\nthree');
    assert.equal(await page.inputValue('#speechInput'), 'one two three');
    assert.deepEqual(await speaks(page), [], 'multiline paste must not submit');
    await page.press('#speechInput', 'Enter');
    assert.deepEqual(await speaks(page), ['one two three']);
  },
  async compositionGap(page) {
    await page.fill('#speechInput', 'composing gap');
    await page.$eval('#speechInput', el => {
      el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, 'composing gap\n');
      // Deliberately omit isComposing (or report false): composition lifetime is authoritative.
      el.dispatchEvent(new InputEvent('input', { inputType: 'insertLineBreak', bubbles: true }));
    });
    assert.deepEqual(await speaks(page), [], 'input newline during composition must not submit');
    await page.$eval('#speechInput', el => el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })));
    await page.press('#speechInput', 'Enter');
    assert.deepEqual(await speaks(page), ['composing gap'], 'Return after composition must send once');
  },
  async composition(page) {
    await page.fill('#speechInput', 'composing');
    await page.$eval('#speechInput', el => el.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', code: 'Enter', isComposing: true, bubbles: true, cancelable: true,
    })));
    assert.deepEqual(await speaks(page), [], 'IME confirmation must not prematurely send');
    await page.$eval('#speechInput', el => el.dispatchEvent(new InputEvent('beforeinput', {
      inputType: 'insertParagraph', isComposing: true, bubbles: true, cancelable: true,
    })));
    assert.deepEqual(await speaks(page), [], 'composing editing event must not prematurely send');
    await page.press('#speechInput', 'Enter');
    assert.deepEqual(await speaks(page), ['composing']);
  },
};
const speaks = page => page.evaluate(() => window.chatPerf.sent.filter(s => s.event === 'speak').map(s => s.data.content));
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}/`;
  const failures = [];
  try {
    for (const engine of ['chromium', 'webkit']) {
      const browser = await pw[engine].launch();
      try {
        for (const [name, run] of Object.entries(cases)) {
          if (process.env.CASE && process.env.CASE !== name) continue;
          const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
          const errors = [];
          page.on('pageerror', e => errors.push(e.message));
          await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
          try {
            await page.goto(origin + `?count=10&virtual=1&echoDelay=${name === 'noEchoRetry' ? 60000 : 1200}`);
            await page.waitForFunction(() => window.chatPerf?.sent && document.querySelector('#speechInput'));
            await run(page);
            assert.deepEqual(errors, []);
            console.log(`${engine} ${name}: PASS`);
          } catch (error) {
            failures.push(`${engine} ${name}: ${error.message}`);
            console.error(failures.at(-1));
          } finally { await page.close(); }
        }
      } finally { await browser.close(); }
    }
  } finally { server.close(); }
  assert.deepEqual(failures, []);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
