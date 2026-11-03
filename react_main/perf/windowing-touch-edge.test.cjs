// iOS-path regression: a held shrink must not expose space above message zero.
// iPhone UA + synthetic touch lifetime exercise the real library deferral in
// desktop WebKit. This is not physical UIKit momentum/compositor validation.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {webkit,chromium,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.argv[2]||'build-chat-perf');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(file!==root&&!file.startsWith(root+path.sep))return res.writeHead(403).end();if(!path.extname(file))file=path.join(root,'index.html');fs.readFile(file,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(e?'not found':b)})});
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=process.env.HOSTED_URL||`http://127.0.0.1:${server.address().port}/`;
 const browser=await(process.env.ENGINE==='chromium'?chromium:webkit).launch();
 try{
  const context=await browser.newContext({...devices['iPhone 13']});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  await page.goto(url+'?count=2214&nameplates=1717&cosmetic=mixed&virtual=1');
  await page.waitForFunction(()=>window.chatPerf&&document.querySelector('.speech-display .message'));
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1000);
  const version=await page.locator('.speech-display').getAttribute('data-transcript-window');
  await page.getByRole('button',{name:'Load 100',exact:true}).click();await page.waitForTimeout(800);
  const result=await page.evaluate(async(releaseEarly)=>{
    const s=document.querySelector('.speech-display');
    // Test-only inspection obtains the real instance without exposing private
    // library state in production. Public resizeItem seeds overestimated history
    // so the shrink/held-correction branch is deterministic across desktop fonts.
    let v;
    for(let f=s[Object.keys(s).find(k=>k.startsWith('__reactFiber'))];f;f=f.return){
      for(let h=f.memoizedState;h&&typeof h==='object';h=h.next){if(h.memoizedState?.getVirtualItems){v=h.memoizedState;break}}
      if(v)break;
    }
    if(!v)throw Error('virtualizer instance not found');
    for(let i=0;i<80;i++)v.resizeItem(i,160);
    v.scrollToEnd();await new Promise(r=>setTimeout(r,500));
    const frame=()=>new Promise(r=>requestAnimationFrame(r));
    const samples=[];let maxGap=0,maxMounted=0;
    s.dispatchEvent(new Event('touchstart',{bubbles:true}));
    for(let i=0;i<450;i++){
      s.scrollTop=Math.max(0,s.scrollTop-32);await frame();await frame();
      const first=s.querySelector('[data-index="0"]');
      const gap=first?first.getBoundingClientRect().top-s.getBoundingClientRect().top:null;
      maxMounted=Math.max(maxMounted,s.querySelectorAll('.message').length);
      if(gap!==null)maxGap=Math.max(maxGap,gap);
      if(i%40===0||gap>1||s.scrollTop===0)samples.push({step:i,top:s.scrollTop,gap,logical:v.scrollOffset});
      if(gap>128||s.scrollTop===0||(releaseEarly&&v.scrollOffset < -160))break;
    }
    const group=s.querySelector('[data-index="0"]')?.parentElement;
    const during={maxGap,maxMounted,firstMounted:!!s.querySelector('[data-index="0"]'),top:s.scrollTop,group:group?{position:getComputedStyle(group).position,bottom:getComputedStyle(group).bottom,marginTop:getComputedStyle(group).marginTop,height:group.getBoundingClientRect().height,top:group.getBoundingClientRect().top-s.getBoundingClientRect().top}:null};
    s.dispatchEvent(new Event('touchend',{bubbles:true}));await new Promise(r=>setTimeout(r,400));
    const first=s.querySelector('[data-index="0"]');
    const after={top:s.scrollTop,firstGap:first?first.getBoundingClientRect().top-s.getBoundingClientRect().top:null};
    return{during,after,samples};
  },process.env.EDGE_RELEASE_EARLY==='1');
  console.log(JSON.stringify({engine:await browser.version(),version,...result}));
  assert(result.during.firstMounted,'must actually reach the first message while touch is active');
  assert(result.during.maxGap<2,`active-touch scrolling exposed ${result.during.maxGap}px above the first message`);
  assert(result.during.maxMounted<100,'must remain windowed');
  assert(result.after.firstGap!==null&&Math.abs(result.after.firstGap)<2,'first row must stay at the top after gesture release');
  assert.deepEqual(errors,[]);
  if(process.env.EDGE_OUTPUT)fs.writeFileSync(process.env.EDGE_OUTPUT,JSON.stringify({engine:await browser.version(),version,...result},null,2));
 }finally{await browser.close();server.close()}
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1});
