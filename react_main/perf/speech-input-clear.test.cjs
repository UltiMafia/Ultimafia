// Sending a message must clear the composer even if the input fires another
// change event after the send - iOS emits one for autocorrect, dictation and
// keyboard commit, and the draft guard counted those as "the user typed
// something else", so the box kept the sent text.
//
// The fixture echoes `speak` back through the real reducer, so the real
// confirm-to-clear path runs, with the transport replaced only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(process.argv[2] || 'build-chat-perf');
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (!path.extname(file)) file = path.join(root, 'index.html');
  fs.readFile(file, (error, content) => {
    res.writeHead(error ? 404 : 200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(error ? 'not found' : content);
  });
});

const TEXT = 'clear me after sending';

async function run(engineName) {
  const engine = engineName === 'webkit' ? pw.webkit : pw.chromium;
  const browser = await engine.launch();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}/`;
  const result = { engine: engineName };
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/*', (r) => (r.request().url().startsWith(origin) ? r.continue() : r.abort()));
    await page.goto(origin + '?count=40&virtual=1&echoDelay=500', { waitUntil: 'load' });
    await page.waitForFunction(() => window.chatPerf && document.querySelector('#speechInput'));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(700);

    const value = () => page.evaluate(() => document.querySelector('#speechInput').value);

    // Control: a plain send clears the box.
    await page.fill('#speechInput', 'plain send');
    await page.press('#speechInput', 'Enter');
    await page.waitForTimeout(1200);
    result.plainSendCleared = (await value()) === '';

    // The reported case: the composer emits another change after the send, and
    // the value ends up back at exactly what was sent.
    await page.fill('#speechInput', TEXT);
    await page.press('#speechInput', 'Enter');
    // Before the server confirms: an iOS-style late change that settles back on
    // exactly the text that was sent.
    await page.type('#speechInput', 'x');
    await page.keyboard.press('Backspace');
    result.valueAfterLateEdit = await value();
    await page.waitForTimeout(1400);
    result.valueAfterConfirm = await value();

    // And text typed *after* sending must survive.
    await page.fill('#speechInput', 'first message');
    await page.press('#speechInput', 'Enter');
    await page.type('#speechInput', ' (still typing)');
    await page.waitForTimeout(800);
    result.keptPostSendTyping = await value();

    result.pageErrors = errors;
  } finally {
    await browser.close();
    server.close();
  }
  return result;
}

(async () => {
  const results = [];
  for (const engine of ['chromium', 'webkit']) results.push(await run(engine));
  console.log(JSON.stringify(results, null, 1));
  for (const r of results) {
    assert.equal(r.pageErrors.length, 0, `${r.engine}: browser exceptions`);
    assert.equal(r.plainSendCleared, true, `${r.engine}: a plain send left the composer populated`);
    assert.equal(r.valueAfterConfirm, '', `${r.engine}: composer kept the sent text after a late input event (value ${JSON.stringify(r.valueAfterConfirm)})`);
    assert.equal(r.keptPostSendTyping, ' (still typing)', `${r.engine}: text typed after sending must not be wiped (got ${JSON.stringify(r.keptPostSendTyping)})`);
  }
  console.log('composer clears on send: PASS');
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
