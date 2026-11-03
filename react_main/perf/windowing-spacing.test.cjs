// Cross-mode geometry: virtualization must not change message heights or gaps.
// Real TextMeetingLayout + styles, all layouts, desktop/phone, light/dark CSS.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {webkit,chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.argv[2]||'build-chat-perf');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{let f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(f!==root&&!f.startsWith(root+path.sep))return res.writeHead(403).end();if(!path.extname(f))f=path.join(root,'index.html');fs.readFile(f,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(e?'not found':b)})});
const layouts=(process.env.LAYOUTS||'default,defaultLarge,compactInline,compactAligned').split(',');
const widths=(process.env.WIDTHS||'1440,390').split(',').map(Number);
const themes=(process.env.THEMES||'dark,light').split(',');
const geometry=()=>{
 const s=document.querySelector('.speech-display');
 const viewport=s.getBoundingClientRect();
 const rows=[...s.querySelectorAll('.message[data-message-id]')].map(row=>{
  const r=row.getBoundingClientRect(),cs=getComputedStyle(row);
  return{id:row.dataset.messageId,height:r.height,width:r.width,top:r.top,bottom:r.bottom,visible:r.bottom>viewport.top&&r.top<viewport.bottom,paddingBottom:parseFloat(cs.paddingBottom),marginTop:parseFloat(cs.marginTop),paddingTop:parseFloat(cs.paddingTop)};
 });
 return{rows,viewportWidth:s.clientWidth};
};
async function settledGeometry(page){
 assert.equal(await page.evaluate(()=>document.visibilityState),'visible','geometry requires a visible document');
 await page.evaluate(()=>document.fonts.ready);
 // A seek mounts new rows whose asynchronous ResizeObserver measurements can
 // arrive after a fixed sleep on software WebKit. Require actual visible wrapper
 // adjacency plus three stable layout frames; persistent overlap must time out.
 await page.evaluate(()=>{delete window.__spacingReady});
 await page.waitForFunction(()=>{
  if(document.visibilityState!=='visible'||document.fonts.status!=='loaded')return false;
  const s=document.querySelector('.speech-display'),view=s.getBoundingClientRect();
  const wrappers=[...s.querySelectorAll('[data-index]')].map(r=>r.getBoundingClientRect());
  for(let i=1;i<wrappers.length;i++){
   const a=wrappers[i-1],b=wrappers[i];
   if((a.bottom>view.top&&a.top<view.bottom||b.bottom>view.top&&b.top<view.bottom)&&Math.abs(b.top-a.bottom)>1){window.__spacingReady=null;return false}
  }
  const signature=JSON.stringify([...s.querySelectorAll('.message[data-message-id]')].map(r=>{const b=r.getBoundingClientRect();return[r.dataset.messageId,b.top,b.height,b.width]}));
  const previous=window.__spacingReady;
  const frames=previous?.signature===signature?previous.frames+1:1;
  window.__spacingReady={signature,frames};return frames>=3;
 },null,{timeout:10000});
}
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=process.env.HOSTED_URL||`http://127.0.0.1:${server.address().port}/`;
 const browser=await(process.env.ENGINE==='chromium'?chromium:webkit).launch();
 const results=[],failures=[];let checks=0;
 try{
  for(const width of widths)for(const layout of layouts)for(const theme of themes){
   let baseline;
   for(const virtual of [false,true]){
    const context=await browser.newContext({viewport:{width,height:900},isMobile:width<900,hasTouch:width<900});
    try{
     const page=await context.newPage();page.on('pageerror',e=>failures.push({width,layout,theme,error:e.message}));
     await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
     await page.goto(base+`?count=100&nameplates=78&cosmetic=mixed&virtual=${virtual?1:0}`);
     await page.waitForFunction(()=>window.chatPerf&&document.querySelector('.speech-display .message'));
     await page.mouse.move(4,4); // enable desktop user-scroll path, not initial auto-pin
     await page.locator('.perf-controls select').selectOption(layout);
     await page.evaluate(theme=>{const m=document.querySelector('main');m.classList.remove('dark-mode','light-mode');m.classList.add(theme+'-mode')},theme);
     await page.evaluate(()=>window.chatPerf.replyTo('perf-0'));
     if(process.env.EMPTY_TAIL==='1')await page.evaluate(()=>window.chatPerf.append({
      id:'unresolved-tail-quote',meetingId:'village',senderId:'test-0',time:Date.now()+2,
      isQuote:true,fromState:-999,fromMeetingId:'village',messageId:'missing',
     }));
     await settledGeometry(page);
     if(!virtual){baseline=await page.evaluate(geometry);assert(baseline.rows.length>=100,'full-DOM control must contain the history');continue}
     const byId=new Map(baseline.rows.map(r=>[r.id,r]));
     const version=await page.locator('.speech-display').getAttribute('data-transcript-window');
     if(process.env.EXPECT_VERSION)assert.equal(version,process.env.EXPECT_VERSION,'must read back the intended deployed build');
     const config={width,layout,theme,version,comparisons:0,maxHeightDelta:0,maxVisibleGapDelta:0,maxOffscreenGapDelta:0};
     for(const position of ['bottom','middle','top']){
      const failuresBefore=failures.length;
      await page.evaluate(pos=>{const s=document.querySelector('.speech-display');s.scrollTop=pos==='top'?0:pos==='middle'?s.scrollHeight/2:s.scrollHeight},position);
      await settledGeometry(page);
      const actual=await page.evaluate(geometry);
      assert(actual.rows.length>1&&actual.rows.length<100,'comparison must use a populated virtual window');
      assert(actual.rows.some(r=>r.visible),'the virtual viewport must not be blank');
      for(const row of actual.rows){
       const original=byId.get(row.id);assert(original,'each virtual row must have the same baseline message');
       for(const field of ['height','width','paddingBottom','marginTop','paddingTop']){
        const delta=Math.abs(row[field]-original[field]);checks++;config.comparisons++;
        if(field==='height')config.maxHeightDelta=Math.max(config.maxHeightDelta,delta);
        if(delta>1)failures.push({width,layout,theme,position,id:row.id,field,baseline:original[field],virtual:row[field],delta});
       }
      }
      for(let i=1;i<actual.rows.length;i++){
       const a=actual.rows[i-1],b=actual.rows[i],oa=byId.get(a.id),ob=byId.get(b.id);
       const gap=b.top-a.bottom,originalGap=ob.top-oa.bottom,delta=Math.abs(gap-originalGap);
       // Offscreen overscan can still use size estimates. Assert actual reading
       // geometry, not positions of unmeasured rows outside the viewport.
       if(!a.visible&&!b.visible){config.maxOffscreenGapDelta=Math.max(config.maxOffscreenGapDelta,delta);continue}
       checks++;config.comparisons++;
       config.maxVisibleGapDelta=Math.max(config.maxVisibleGapDelta,delta);
       if(delta>1)failures.push({width,layout,theme,position,between:[a.id,b.id],visible:[a.visible,b.visible],field:'gap',baseline:originalGap,virtual:gap,delta});
      }
      if(failures.length>failuresBefore&&process.env.SPACING_DIAGNOSTICS==='1'){
       for(const delay of [0,200,800]){
        if(delay)await page.waitForTimeout(delay);
        const later=await page.evaluate(geometry);
        const state=await page.evaluate(()=>{
         const s=document.querySelector('.speech-display'),view=s.getBoundingClientRect();let v;
         for(let f=s[Object.keys(s).find(k=>k.startsWith('__reactFiber'))];f;f=f.return){for(let h=f.memoizedState;h&&typeof h==='object';h=h.next){if(h.memoizedState?.getVirtualItems){v=h.memoizedState;break}}if(v)break}
         return{visibility:document.visibilityState,fonts:document.fonts.status,scrolling:v.isScrolling,native:s.scrollTop,logical:v.scrollOffset,rows:[...s.querySelectorAll('[data-index]')].filter(r=>{const b=r.getBoundingClientRect();return b.bottom>view.top&&b.top<view.bottom}).map(r=>({index:+r.dataset.index,dom:r.offsetHeight,cached:v.itemSizeCache.get(v.options.getItemKey(+r.dataset.index))}))};
        });
        console.log('spacing failure diagnostic',JSON.stringify({width,layout,theme,position,delay,state,heightMismatches:later.rows.filter(r=>Math.abs(r.height-byId.get(r.id).height)>1).map(r=>({id:r.id,height:r.height,baseline:byId.get(r.id).height})),visibleGaps:later.rows.slice(1).flatMap((b,i)=>{const a=later.rows[i];return(a.visible||b.visible)&&Math.abs(b.top-a.bottom-(byId.get(b.id).top-byId.get(a.id).bottom))>1?[{a:a.id,b:b.id,gap:b.top-a.bottom}]:[]})}));
       }
      }
      if(process.env.SPACING_SHOTS&&layout==='default'&&position==='bottom'){
       fs.mkdirSync(process.env.SPACING_SHOTS,{recursive:true});
       await page.screenshot({path:path.join(process.env.SPACING_SHOTS,`${process.env.ENGINE||'webkit'}-${width}-${theme}-virtual.png`)});
      }
     }
     results.push(config);
    }finally{await context.close()}
   }
  }
  const result={engine:await browser.version(),checks,configurations:results.length,results,failureCount:failures.length,failures};
  if(process.env.SPACING_OUTPUT)fs.writeFileSync(process.env.SPACING_OUTPUT,JSON.stringify(result,null,2));
  console.log(JSON.stringify({...result,failures:failures.slice(0,12)},null,2));
  assert.equal(failures.length,0,`${failures.length} virtual/full transcript geometry mismatches`);
 }finally{await browser.close();server.close()}
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1});
