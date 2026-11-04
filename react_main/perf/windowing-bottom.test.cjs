// Reaching the native bottom is not a resize and must not issue navigation.
// Real renderer/library with iPhone UA; not a UIKit bounce-physics test.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {webkit,chromium,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.argv[2]||'build-chat-perf');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.woff2':'font/woff2','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{let f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(f!==root&&!f.startsWith(root+path.sep))return res.writeHead(403).end();if(!path.extname(f))f=path.join(root,'index.html');fs.readFile(f,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream'});res.end(e?'not found':b)})});
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=process.env.HOSTED_URL||`http://127.0.0.1:${server.address().port}/`;
 const browser=await(process.env.ENGINE==='chromium'?chromium:webkit).launch();
 try{
  const context=await browser.newContext({...devices['iPhone 13']});const page=await context.newPage();
  let stage='load';const errors=[];page.on('pageerror',e=>errors.push({stage,message:e.message}));
  await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  await page.goto(base+'?count=100&nameplates=78&cosmetic=mixed&virtual=1');
  await page.waitForFunction(()=>window.chatPerf&&document.querySelector('.speech-display .message'));
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(600);
  stage='warmup';await page.evaluate(async()=>{
   const s=document.querySelector('.speech-display');let v;
   for(let f=s[Object.keys(s).find(k=>k.startsWith('__reactFiber'))];f;f=f.return){for(let h=f.memoizedState;h&&typeof h==='object';h=h.next){if(h.memoizedState?.getVirtualItems){v=h.memoizedState;break}}if(v)break}
   if(!v)throw Error('virtualizer not found');
   for(let i=0;i<100;i+=10){v.scrollToIndex(i,{align:'start'});await new Promise(r=>setTimeout(r,150))}
   v.scrollToIndex(45,{align:'start'});await new Promise(r=>setTimeout(r,600));
   const calls=[],styles=[],scrollToEnd=v.scrollToEnd;
   v.scrollToEnd=(...args)=>{calls.push(args);return scrollToEnd(...args)};
   const observer=new MutationObserver(()=>styles.push(s.style.overflowY));observer.observe(s,{attributes:true,attributeFilter:['style']});
   window.__bottomProbe={s,v,calls,styles,observer};
   s.dispatchEvent(new Event('touchstart',{bubbles:true}));s.scrollTop+=32;
  });
  await page.waitForTimeout(80);stage='arrival';
  await page.evaluate(()=>{const{s}=window.__bottomProbe;s.dispatchEvent(new Event('touchend',{bubbles:true}));s.scrollTop=s.scrollHeight});
  await page.waitForTimeout(600);
  const arrival=await page.evaluate(()=>{const{s,calls,styles}=window.__bottomProbe;return{version:s.dataset.transcriptWindow,calls:calls.length,styles,gap:s.scrollHeight-s.clientHeight-s.scrollTop}});
  console.log('bottom arrival',JSON.stringify(arrival));
  assert(arrival.gap<11,'must actually reach the bottom');
  assert.equal(arrival.calls,0,'entering follow mode must not navigate when viewport size is unchanged');
  assert(!arrival.styles.includes('hidden'),'entering follow mode must not invoke a momentum-stopping overflow change');
  stage='following resize';await page.setViewportSize({width:390,height:684});await page.waitForTimeout(500);
  const resized=await page.evaluate(()=>{const{s,calls}=window.__bottomProbe;return{calls:calls.length,gap:s.scrollHeight-s.clientHeight-s.scrollTop}});
  assert(resized.calls>0&&resized.gap<11,'a real viewport resize still re-pins a following reader');
  stage='pause';await page.evaluate(()=>{const{s}=window.__bottomProbe;s.scrollTop=s.scrollHeight/2});await page.waitForTimeout(500);
  await page.evaluate(()=>{window.__bottomProbe.calls.length=0});
  stage='paused resize';await page.setViewportSize({width:390,height:564});await page.waitForTimeout(500);
  const paused=await page.evaluate(()=>{const{s,calls}=window.__bottomProbe;return{calls:calls.length,gap:s.scrollHeight-s.clientHeight-s.scrollTop}});
  assert.equal(paused.calls,0,'resize must not navigate a reader in history');assert(paused.gap>20);
  // This exact paused-resize RO delivery warning also reproduces on the v6
  // baseline (before these changes). Report it explicitly, not as a new error.
  const isBaselineWarning=e=>e.stage==='paused resize'&&e.message==='ResizeObserver loop completed with undelivered notifications.';
  const warnings=errors.filter(isBaselineWarning),unexpected=errors.filter(e=>!isBaselineWarning(e));
  assert.deepEqual(unexpected,[]);
  const result={engine:await browser.version(),arrival,resized,paused,errors:unexpected,warnings};
  if(process.env.BOTTOM_OUTPUT)fs.writeFileSync(process.env.BOTTOM_OUTPUT,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close();server.close()}
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1});
