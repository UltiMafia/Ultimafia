// Real TextMeetingLayout regression probe. Never production or a physical iPhone test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { webkit, chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(process.argv[2] || 'build-chat-perf');
const mime = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server = http.createServer((req,res)=>{
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file = path.resolve(root,'.'+pathname);
  if (file !== root && !file.startsWith(root+path.sep)) return res.writeHead(403).end();
  if (!path.extname(file)) file = path.join(root,'index.html');
  fs.readFile(file,(error,content)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'not found':content)});
});
const bottomGap = () => {const s=document.querySelector('.speech-display');return s.scrollHeight-s.clientHeight-s.scrollTop};
async function main(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${server.address().port}/`;
  const browser=await (process.env.ENGINE==='chromium'?chromium:webkit).launch();
  let count=0;
  const checks=[];
  try {
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
    await page.goto(url+'?count=2214&nameplates=1717&cosmetic=mixed&virtual=1',{waitUntil:'load'});
    await page.waitForFunction(()=>window.chatPerf&&document.querySelector('.speech-display .message'));
    await page.waitForTimeout(600);
    await page.waitForFunction(() => { const s=document.querySelector('.speech-display');return s && s.scrollHeight-s.clientHeight-s.scrollTop<11; }, null, {timeout:10000}).catch(async e => { console.log('failed geometry',await page.evaluate(() => {const s=document.querySelector('.speech-display');return {top:s.scrollTop,h:s.scrollHeight,view:s.clientHeight,list:s.querySelector('[data-testid=virtuoso-item-list]')?.getAttribute('style'),last:[...s.querySelectorAll('.message')].at(-1)?.dataset.messageId}}));throw e; });
    const rows=await page.locator('.speech-display .message').count();
    assert(rows>0&&rows<100,`virtual transcript must bound mounted rows: got ${rows}`);checks.push({name:'mounted rows bounded',rows});count++;
    const initial = await page.evaluate(() => {const s=document.querySelector('.speech-display');return {top:s.scrollTop,height:s.scrollHeight,viewport:s.clientHeight,first:s.querySelector('.message')?.dataset.messageId,last:[...s.querySelectorAll('.message')].at(-1)?.dataset.messageId}});console.log('initial geometry', initial);assert(await page.evaluate(bottomGap)<11,'initial bottom');checks.push({name:'initial bottom'});count++;
    await page.evaluate(()=>window.chatPerf.append());
    await page.waitForFunction(()=>document.querySelector('[data-message-id="perf-2214"]'));
    await page.waitForTimeout(500);
    assert(await page.evaluate(bottomGap)<11,'appending while following stays at bottom');checks.push({name:'append follow'});count++;
    await page.evaluate(()=>{const s=document.querySelector('.speech-display');s.scrollTop=s.scrollHeight/2});
    await page.waitForTimeout(500);
    const anchor=await page.evaluate(()=>{const s=document.querySelector('.speech-display'),top=s.getBoundingClientRect().top;const row=[...s.querySelectorAll('.message')].find(r=>r.getBoundingClientRect().bottom>top);return{id:row.dataset.messageId,offset:row.getBoundingClientRect().top-top}});
    await page.evaluate(()=>window.chatPerf.append());
    await page.waitForTimeout(500);
    const afterAnchor=await page.evaluate(id=>{const s=document.querySelector('.speech-display');const row=s.querySelector(`[data-message-id="${id}"]`);return row?row.getBoundingClientRect().top-s.getBoundingClientRect().top:null},anchor.id);
    assert(afterAnchor!==null&&Math.abs(afterAnchor-anchor.offset)<2,'append while reading preserves anchor');checks.push({name:'append anchor',delta:afterAnchor-anchor.offset});count++;
    assert.equal(await page.locator('.new-messages-pill').innerText(),'1 new message');checks.push({name:'unread count'});count++;
    await page.locator('.new-messages-pill').click();
    await page.waitForTimeout(600);
    assert(await page.evaluate(bottomGap)<11,'jump latest');checks.push({name:'jump latest'});count++;
    await page.setViewportSize({width:390,height:600});
    await page.waitForTimeout(600);
    assert(await page.evaluate(bottomGap)<11,'resize while following');checks.push({name:'viewport shrink repin'});count++;
    await page.setViewportSize({width:390,height:844});
    await page.waitForTimeout(500);
    await page.evaluate(()=>window.chatPerf.replyTo('perf-0'));
    await page.waitForFunction(()=>document.querySelector('[data-message-id="perf-reply"] .reply-reference'));
    assert.equal(await page.locator('[data-message-id="perf-quote"]').count(),0,'quote merged into reply');checks.push({name:'paired reply window unit'});count++;
    await page.locator('[data-message-id="perf-reply"] .reply-reference').click();
    await page.waitForFunction(()=>{const s=document.querySelector('.speech-display'),r=s.querySelector('[data-message-id="perf-0"]');return r&&r.getBoundingClientRect().top>=s.getBoundingClientRect().top&&r.getBoundingClientRect().bottom<=s.getBoundingClientRect().bottom},null,{timeout:2000});checks.push({name:'offscreen reply jump'});count++;
    assert.deepEqual(errors,[],'no browser exceptions');checks.push({name:'no browser exceptions'});count++;
    const result={engine:await browser.version(),count,checks};
    if(process.env.CHECK_OUTPUT) fs.writeFileSync(process.env.CHECK_OUTPUT,JSON.stringify(result,null,2));
    console.log(JSON.stringify(result,null,2));
    await context.close();
  } finally {await browser.close();server.close();}
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1});
