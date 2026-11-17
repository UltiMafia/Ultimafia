// Regression: resizing content above the reader must not move the visible row.
// Uses real components + native layout/ResizeObserver, not a mocked virtualizer.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {webkit,chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.argv[2]||'build-chat-perf');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(file!==root&&!file.startsWith(root+path.sep))return res.writeHead(403).end();if(!path.extname(file))file=path.join(root,'index.html');fs.readFile(file,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(e?'not found':b)})});
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}/`;
 const browser=await(process.env.ENGINE==='chromium'?chromium:webkit).launch();
 const results=[];
 try{
  const width=Number(process.env.ANCHOR_WIDTH||390);
  const palette=process.env.ANCHOR_THEME||'dark';
  const page=await browser.newPage({viewport:{width,height:width>=900?1000:844},deviceScaleFactor:3,isMobile:width<900,hasTouch:width<900});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
   if(process.env.ANCHOR_NOW)await page.addInitScript(now=>{const NativeDate=Date;window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}}},Number(process.env.ANCHOR_NOW));
   await page.goto(origin+`?count=2214&nameplates=1717&cosmetic=mixed&virtual=1&theme=${palette}`);
  await page.waitForFunction(()=>window.chatPerf&&document.querySelector('.speech-display .message'));
   await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1200);
   await page.waitForFunction(()=>{const s=document.querySelector('.speech-display');return s.scrollHeight-s.clientHeight-s.scrollTop<11});
   // Desktop's end command needs a native input before seeking the midpoint.
   // Mobile WebKit has no wheel support; keep its original cold-seek probe.
   if(width>=900){await page.locator('.speech-display').hover();await page.mouse.wheel(0,-200);await page.waitForTimeout(200);}
   await page.evaluate(()=>{const s=document.querySelector('.speech-display');s.scrollTop=s.scrollHeight/2});
   await page.waitForTimeout(600);
   const before=await page.evaluate(()=>{const s=document.querySelector('.speech-display'),top=s.getBoundingClientRect().top;const row=[...s.querySelectorAll('.message')].find(r=>r.getBoundingClientRect().bottom>top);return{id:row.dataset.messageId,offset:row.getBoundingClientRect().top-top,scrollTop:s.scrollTop}});
   assert(Number(before.id.slice(5))>200&&Number(before.id.slice(5))<1800,'probe must actually reach cold middle history, not stay pinned at the end');
  const changed=await page.evaluate(id=>{const r=document.querySelector(`[data-message-id="${id}"]`);const w=r.closest('[data-index]'),t=w?.previousElementSibling?.querySelector('.message');if(!t)return null;t.style.paddingBottom='203px';return{id:t.dataset.messageId}},before.id);
  assert(changed,'must actually resize an overscanned row above the visible anchor');
  await page.waitForTimeout(600);
  const after=await page.evaluate(id=>{const s=document.querySelector('.speech-display'),r=s.querySelector(`[data-message-id="${id}"]`);return r?{offset:r.getBoundingClientRect().top-s.getBoundingClientRect().top,scrollTop:s.scrollTop}:null},before.id);
  const result={name:'stationary anchor survives growth above it',before,changed,after,delta:after?after.offset-before.offset:null};results.push(result);console.log(JSON.stringify(result));
  assert(after&&Math.abs(result.delta)<2,`visible anchor moved ${result.delta}px after row growth (must stay within 2px)`);
  // Shrinking the same row must undo the offset correction, not move content.
  await page.evaluate(id=>{document.querySelector(`[data-message-id="${id}"]`).style.paddingBottom=''},changed.id);
  await page.waitForTimeout(300);
  const shrunk=await page.evaluate(id=>{const s=document.querySelector('.speech-display'),r=s.querySelector(`[data-message-id="${id}"]`);return r?r.getBoundingClientRect().top-s.getBoundingClientRect().top:null},before.id);
  assert(shrunk!==null&&Math.abs(shrunk-before.offset)<2,'anchor moved on shrink above viewport');
  results.push({name:'anchor survives shrink above it',delta:shrunk-before.offset});

  // Batch several above-anchor measurements in the same ResizeObserver delivery.
  const batch=await page.evaluate(id=>{const s=document.querySelector('.speech-display'),r=s.querySelector(`[data-message-id="${id}"]`),w=r.closest('[data-index]');const candidates=[...w.parentElement.children].filter(x=>Number(x.dataset.index)<Number(w.dataset.index)).slice(-3);for(const el of candidates)el.querySelector('.message').style.paddingBottom='73px';return candidates.length},before.id);
  assert(batch>=2,'must resize multiple overscanned rows');await page.waitForTimeout(300);
  const batchedOffset=await page.evaluate(id=>{const s=document.querySelector('.speech-display'),r=s.querySelector(`[data-message-id="${id}"]`);return r?r.getBoundingClientRect().top-s.getBoundingClientRect().top:null},before.id);
  assert(batchedOffset!==null&&Math.abs(batchedOffset-before.offset)<2,'anchor moved during batched height corrections');
  results.push({name:'batched growth above anchor',rows:batch,delta:batchedOffset-before.offset});

  // Cold scroll into unmeasured rows. Compare a keyed row's screen position
  // against the requested motion, independently of scrollTop corrections.
  for(const direction of [-1,1]){
    const sweep=await page.evaluate(async direction=>{
      const s=document.querySelector('.speech-display');const errors=[];let maxMounted=0;
      const frame=()=>new Promise(r=>requestAnimationFrame(r));
      for(let i=0;i<48;i++){
        const top=s.getBoundingClientRect().top;
        const row=[...s.querySelectorAll('.message')].find(r=>r.getBoundingClientRect().bottom>top);
        if(!row){errors.push({step:i,missing:true});break;}
        const id=row.dataset.messageId,offset=row.getBoundingClientRect().top-top;
        const beforeItem=row.closest('[data-index]');
        const beforeGeometry={index:beforeItem?.dataset.index,start:beforeItem?.style.top,height:row.getBoundingClientRect().height,windowHeight:beforeItem?.parentElement.style.height};
        const from=s.scrollTop;s.scrollTop+=direction*32;const motion=s.scrollTop-from;
        await frame();await frame();
        const after=s.querySelector(`[data-message-id="${id}"]`);
        const actual=after?after.getBoundingClientRect().top-s.getBoundingClientRect().top:null;
        const error=actual===null?null:actual-(offset-motion);
        errors.push({step:i,error,...(error===null||Math.abs(error)>=2?{id,from,motion,to:s.scrollTop,offset,actual,beforeGeometry,afterGeometry:after?{start:after.closest('[data-index]')?.style.top,height:after.getBoundingClientRect().height,windowHeight:after.closest('[data-index]')?.parentElement.style.height}:null}:{})});maxMounted=Math.max(maxMounted,s.querySelectorAll('.message').length);
      }
      return{direction,maxMounted,maxError:Math.max(...errors.map(x=>x.error===null||x.missing?Infinity:Math.abs(x.error))),failures:errors.filter(x=>x.error===null||x.missing||Math.abs(x.error)>=2)};
    },direction);
    console.log('cold scroll',JSON.stringify(sweep));
    if(direction===-1&&process.env.ANCHOR_SCREENSHOT)await page.screenshot({path:process.env.ANCHOR_SCREENSHOT,animations:'disabled'});
    assert.equal(sweep.failures.length,0,`visible content jumped during ${direction<0?'upward':'downward'} cold scroll: ${JSON.stringify(sweep.failures.slice(0,3))}`);
    assert(sweep.maxMounted<100,'scroll remains windowed');results.push({name:`cold scroll ${direction<0?'up':'down'}`,...sweep});
  }
  assert.deepEqual(errors,[]);
   console.log(JSON.stringify({engine:await browser.version(),viewport:page.viewportSize(),palette,results}));
   if(process.env.ANCHOR_OUTPUT)fs.writeFileSync(process.env.ANCHOR_OUTPUT,JSON.stringify({engine:await browser.version(),viewport:page.viewportSize(),palette,results},null,2));
 }finally{await browser.close();server.close()}
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1});
