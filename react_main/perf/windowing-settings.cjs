// Real reducer and TextMeetingLayout integration; isolated from production routes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(process.argv[2] || 'build-chat-perf');
const mime = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.woff2':'font/woff2','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png'};
const server = http.createServer((req,res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (!path.extname(file)) file = path.join(root,'index.html');
  fs.readFile(file,(error,data) => {res.writeHead(error ? 404 : 200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream'});res.end(error ? 'not found' : data)});
});
const checks = [];
async function main() {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const browser = await (process.env.ENGINE === 'webkit' ? webkit : chromium).launch();
  try {
    const phone = process.env.VIEWPORT === 'phone';
    const context = await browser.newContext({viewport:phone ? {width:390,height:844} : {width:1400,height:900},
      ...(phone ? {isMobile:true,hasTouch:true} : {})});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror',error => errors.push(error.message));
    await page.route('**/*',route => route.request().url().startsWith(url) ? route.continue() : route.abort());
    const open = async (query = '') => {
      await page.goto(url + '?count=1000&settingsIntegration=1&panels=flat&theme=' + (process.env.THEME || 'dark') + query);
      await page.waitForFunction(() => window.chatPerf && document.querySelector('.speech-display .message'));
    };
    await open();
    assert.equal(await page.evaluate(() => window.chatPerf.settings.virtualizeTranscript),true,'real reducer defaults virtualizeTranscript to true');
    checks.push('reducer default true');
    const mounted = () => page.locator('.speech-display .message').count();
    const bounded = async () => {
      await page.waitForTimeout(350);
      const rows = await mounted();
      assert(rows > 0 && rows < 100, `real default integration bounds rows: ${rows}`);
    };
    await bounded();
    checks.push('real TextMeetingLayout defaults to bounded DOM without override');
    const full = async () => {
      await page.waitForFunction(() => document.querySelectorAll('.speech-display .message').length === 1000);
    };
    await page.evaluate(() => window.chatPerf.updateSettings({type:'setProp',propName:'virtualizeTranscript',propval:false}));
    await full();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('gameSettings')).virtualizeTranscript),false);
    checks.push('setProp false persists and switches to full DOM');
    await open();
    assert.equal(await page.evaluate(() => window.chatPerf.settings.virtualizeTranscript),false);
    await full();
    checks.push('saved false survives reload');
    await open('&virtual=1');
    await bounded();
    checks.push('explicit true overrides saved false');
    await page.evaluate(() => window.chatPerf.updateSettings({type:'set',settings:{virtualizeTranscript:true}}));
    await open('&virtual=0');
    await full();
    checks.push('explicit false overrides saved true');
    await open('&partialSettings=1');
    await full();
    checks.push('partial legacy settings without setting retain full DOM');
    await page.evaluate(() => localStorage.setItem('gameSettings', JSON.stringify({timestamps:false})));
    await open();
    assert.equal(await page.evaluate(() => window.chatPerf.settings.timestamps),false);
    assert.equal(await page.evaluate(() => window.chatPerf.settings.virtualizeTranscript),true);
    await bounded();
    checks.push('legacy saved settings acquire default true');
    const menu = page.getByTestId('settings-integration');
    const expandSettings = async () => {
      await menu.getByRole('button', {name:/Settings/}).click();
      await page.waitForTimeout(400);
    };
    await expandSettings();
    const toggle = menu.getByRole('checkbox',{name:'Virtualize transcript'});
    assert.equal(await toggle.count(),1,'SettingsForm exposes boolean Virtualize transcript control');
    assert.equal(await toggle.isChecked(),true);
    const guidance = menu.getByText(/Virtualization keeps long chats responsive/);
    await guidance.scrollIntoViewIfNeeded();
    await page.waitForTimeout(350); // Allow the real accordion's expansion to finish.
    assert.match(await guidance.textContent(),/browser Find/i);
    assert.match(await guidance.textContent(),/select.*full history/i);
    const contrast = await guidance.evaluate(element => {
      const parse = color => color.match(/[\d.]+/g).map(Number);
      const fg = parse(getComputedStyle(element).color);
      let ancestor = element, bg;
      while (ancestor) {
        const color = parse(getComputedStyle(ancestor).backgroundColor);
        if (color.length === 3 || color[3] === 1) { bg = color; break; }
        ancestor = ancestor.parentElement;
      }
      if (!bg) throw new Error('No opaque background for contrast assertion');
      const alpha = fg[3] ?? 1;
      const blend = fg.slice(0,3).map((channel,i) => alpha * channel + (1-alpha) * bg[i]);
      const luminance = rgb => rgb.slice(0,3).map(v => v/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4).reduce((sum,v,i) => sum + v * [.2126,.7152,.0722][i],0);
      const a = luminance(blend), b = luminance(bg);
      return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    });
    assert(contrast >= 4.5, `guidance contrast is readable: ${contrast}`);
    if (process.env.SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});
      await menu.screenshot({path:path.join(process.env.SCREENSHOT_DIR,`settings-${process.env.ENGINE || 'chromium'}-${phone ? 'phone' : 'desktop'}-${process.env.THEME || 'dark'}.png`)});
    }
    checks.push(`boolean control and Find/selection guidance; contrast ${contrast.toFixed(2)}:1`);
    await toggle.uncheck();
    // Editing is staged until Save; Cancel must leave persisted state untouched.
    await bounded();
    await menu.getByRole('button',{name:'Cancel',exact:true}).click();
    await expandSettings();
    assert.equal(await toggle.isChecked(),true);
    checks.push('Cancel discards unsaved virtualization change');
    await toggle.uncheck();
    await menu.getByRole('button',{name:'Save',exact:true}).click();
    await full();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('gameSettings')).virtualizeTranscript),false);
    assert.equal(await page.locator('[data-message-id="perf-0"]').count(),1,'full history is mounted for Find and selection');
    checks.push('real SettingsForm Save disables virtualization and persists false');
    await open();
    await full();
    await expandSettings();
    assert.equal(await toggle.isChecked(),false);
    await toggle.check();
    await menu.getByRole('button',{name:'Save',exact:true}).click();
    await bounded();
    await open();
    await bounded();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('gameSettings')).virtualizeTranscript),true);
    checks.push('real SettingsForm re-enable persists across reload');
    assert.deepEqual(errors,[], 'no browser exceptions');
    console.log(JSON.stringify({engine:await browser.version(),count:checks.length,checks},null,2));
    await context.close();
  } finally { await browser.close(); server.close(); }
}
main().catch(error => {console.error(error);server.close();process.exitCode=1});
