// Synthetic iOS fling: held growth must not strand the reader at native zero.
// Controlled page-clock time keeps software-rendering delays from falsely ending
// momentum between frames. Native DOM layout + the real virtualizer still run.
// This is NOT a physical UIKit/compositor/inertial-physics test.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {webkit,chromium,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.argv[2]||'build-chat-perf');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{let f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(f!==root&&!f.startsWith(root+path.sep))return res.writeHead(403).end();if(!path.extname(f))f=path.join(root,'index.html');fs.readFile(f,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(e?'not found':b)})});
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=process.env.HOSTED_URL||`http://127.0.0.1:${server.address().port}/`;
 const browser=await(process.env.ENGINE==='chromium'?chromium:webkit).launch();const results=[];
 try{
  for(const warm of [false,true]){
   const context=await browser.newContext({...devices['iPhone 13']});
   try{
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    if(process.env.IOS_LEGACY_WRITES==='1')await page.addInitScript(()=>{
      // Branch control only: emulate the library's legacy-iOS feature probe,
      // not UIKit physics. Leave all other CSS capability checks untouched.
      const supports=CSS.supports.bind(CSS);
      CSS.supports=(...args)=>args.length===1&&args[0]==='overflow-anchor: auto'?false:supports(...args);
    });
    await page.clock.install();
    await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
    await page.goto(base+'?count=2214&nameplates=1717&cosmetic=mixed&virtual=1');
    await page.waitForFunction(()=>window.chatPerf&&document.querySelector('.speech-display .message'));
    await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1000);
    await page.getByRole('button',{name:'Load 100',exact:true}).click();await page.waitForTimeout(800);
    const prepared=await page.evaluate(async warm=>{
     const s=document.querySelector('.speech-display');let v;
     for(let f=s[Object.keys(s).find(k=>k.startsWith('__reactFiber'))];f;f=f.return){for(let h=f.memoizedState;h&&typeof h==='object';h=h.next){if(h.memoizedState?.getVirtualItems){v=h.memoizedState;break}}if(v)break}
     if(!v)throw Error('virtualizer not found');
     if(warm){for(let i=0;i<100;i+=12){v.scrollToIndex(i,{align:'start'});await new Promise(r=>setTimeout(r,180))}}
     else{for(let i=0;i<80;i++)v.resizeItem(i,40)} // controlled underestimated-history arm
     v.scrollToEnd();await new Promise(r=>setTimeout(r,500));
     const calls=[];const scrollToIndex=v.scrollToIndex;
     v.scrollToIndex=(...args)=>{calls.push({index:args[0],options:args[1]});return scrollToIndex(...args)};
     window.__flingProbe={s,v,calls};
     return{cached:Array.from({length:100},(_,i)=>v.itemSizeCache.has(v.options.getItemKey(i))).filter(Boolean).length,version:s.dataset.transcriptWindow,momentumWritesSurvive:CSS.supports('overflow-anchor: auto'),animatedNames:[...s.querySelectorAll('.user-name-text')].filter(n=>getComputedStyle(n).animationName!=='none').length};
    },warm);
    await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));
    const tick=async()=>{await page.waitForTimeout(25);await page.clock.runFor(16)};
    const snapshot=()=>page.evaluate(()=>{const{s,v}=window.__flingProbe;const first=s.querySelector('[data-index="0"]');return{native:s.scrollTop,logical:v.scrollOffset,firstGap:first?first.getBoundingClientRect().top-s.getBoundingClientRect().top:null}});
    await page.evaluate(()=>{const{s}=window.__flingProbe;s.dispatchEvent(new Event('touchstart',{bubbles:true}));s.scrollTop-=32});await tick();
    await page.evaluate(()=>window.__flingProbe.s.dispatchEvent(new Event('touchend',{bubbles:true})));
    const samples=[];let velocity=420,edge=null;
    for(let i=0;i<80;i++){
     await page.evaluate(delta=>{const{s}=window.__flingProbe;s.scrollTop=Math.max(0,s.scrollTop-delta)},velocity);
     await tick();const state={step:i,...await snapshot()};samples.push(state);
     if(state.native<=1){edge=state;break}
     velocity=Math.max(130,velocity*.96);
    }
    const releaseOnly=process.env.FLING_REVERSE_RELEASE==='1';
    const touchReverse=process.env.FLING_REVERSE_TOUCH==='1';
    const reverse=touchReverse||releaseOnly||process.env.FLING_REVERSE==='1';
    const interrupted=reverse||!warm&&process.env.FLING_INTERRUPT==='1';
    if(interrupted){
     await page.evaluate(coords=>{
      const e=new Event('touchstart',{bubbles:true});
      if(coords)Object.defineProperty(e,'touches',{value:[{clientY:500}]});
      window.__flingProbe.s.dispatchEvent(e);
     },touchReverse);
     if(reverse){
      // UIKit bounce can deliver another top scroll after touchstart canceled
      // the old completion. Exercise that re-arm before dragging back down.
      await page.evaluate(()=>window.__flingProbe.s.dispatchEvent(new Event('scroll')));
      await tick();
     }
     if(releaseOnly)await page.evaluate(()=>{
      const{s}=window.__flingProbe;
      const block=e=>{if(e.target===s)e.stopImmediatePropagation()};
      document.addEventListener('scroll',block,true);window.__flingProbe.unblock=()=>document.removeEventListener('scroll',block,true);
     });
     if(touchReverse){
      // While rubber-banding, the finger can reverse direction before native
      // scrollTop becomes positive. Scrolling below the edge reports only after
      // release in this controlled event-order arm; coordinates carry intent.
      await page.evaluate(()=>{const e=new Event('touchmove',{bubbles:true});Object.defineProperty(e,'touches',{value:[{clientY:460}]});window.__flingProbe.s.dispatchEvent(e)});
      await tick();
     }else{
      await page.evaluate(()=>{window.__flingProbe.s.scrollTop+=240});
      await tick();
     }
     await page.evaluate(()=>window.__flingProbe.s.dispatchEvent(new Event('touchend',{bubbles:true})));
     if(touchReverse){await page.evaluate(()=>{window.__flingProbe.s.scrollTop+=240});await tick()}
     if(releaseOnly)await page.evaluate(()=>{const{s,unblock}=window.__flingProbe;unblock();s.dispatchEvent(new Event('scroll'))});
    }
    let landed=false;
    for(let i=0;i<100;i++){
     await tick();const state=await snapshot();
     if(state.firstGap!==null&&Math.abs(state.firstGap)<2&&state.native<2){landed=true;break}
    }
    const calls=await page.evaluate(()=>window.__flingProbe.calls);
    const result={warm,...prepared,edge,interrupted,releaseOnly,touchReverse,landed,final:await snapshot(),calls,samples,errors};results.push(result);console.log(JSON.stringify(result));
   }finally{await context.close()}
  }
  if(process.env.FLING_OUTPUT)fs.writeFileSync(process.env.FLING_OUTPUT,JSON.stringify({engine:await browser.version(),results},null,2));
  assert(results.every(r=>r.edge),'fling must reach native top in both controls');
  assert(results[0].edge.logical>1,'cold arm must exercise a held positive correction');
  if(results[0].interrupted){
   assert(!results[0].landed&&results[0].final.native>1,'a new gesture must override automatic top completion');
   assert.equal(results[0].calls.length,0,'new input cancels pending completion before a command starts');
  }else{
   assert(results[0].landed,'cold fling stopped at a fake top: oldest message requires another gesture');
   assert.equal(results[0].calls.filter(c=>c.index===0).length,1,'fake edge should reconcile only once');
  }
  if(results[1].interrupted){
   assert(!results[1].landed&&results[1].final.native>1,'downward reversal from a real top must retain the new reading position');
  }else assert(results[1].landed,'warm-cache fling must still land at true top');
  assert.equal(results[1].calls.length,0,'a real top must not start extra navigation');
  assert(results.every(r=>r.errors.length===0),'no browser exceptions');
 }finally{await browser.close();server.close()}
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1});
