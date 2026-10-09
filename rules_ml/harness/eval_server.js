'use strict';
/**
 * Hand-check reviewer for the held-out eval set.  node eval_server.js -> :8900
 * Shows the model's call pre-filled: press ENTER to accept it, F/J to override.
 * Saves after every keystroke, so you can stop and resume any time.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIR = '//wsl.localhost/Ubuntu/home/tt/Documents/Ultimafia/rules_ml';
const SET = DIR + '/eval_set.jsonl';
const DONE = DIR + '/eval_done.json';
const SKIP = DIR + '/eval_skipped.json';   // separate file: keeps eval_done.json's format
                                           // unchanged, so no metrics script needs editing
const PORT = Number(process.env.PORT || 8900);

function loadSet() {
  return fs.readFileSync(SET, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
}
function loadDone() {
  try { return JSON.parse(fs.readFileSync(DONE, 'utf8')); } catch (e) { return []; }
}
function saveDone(d) {
  fs.writeFileSync(DONE, JSON.stringify(d, null, 0));   // rewritten every keystroke
}
function loadSkip() {
  try { return JSON.parse(fs.readFileSync(SKIP, 'utf8')); } catch (e) { return []; }
}
function saveSkip(d) {
  fs.writeFileSync(SKIP, JSON.stringify(d, null, 0));
}

const PAGE = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>rule classifier - hand check</title>
<style>
:root{--bg:#12141a;--card:#1b1e26;--line:#2c313d;--fg:#e8eaf0;--mut:#9aa3b5;--acc:#6ea8fe;--bad:#ff6b6b;--ok:#4ade80}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{max-width:760px;margin:0 auto;padding:26px 20px 60px}
h1{font-size:17px;margin:0 0 4px}.sub{color:var(--mut);font-size:13px;margin-bottom:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:18px;margin-bottom:14px}
.msg{font-size:21px;font-weight:600;margin:8px 0 10px;word-break:break-word}
.ctx{color:var(--mut);font-size:13px;font-family:ui-monospace,Menlo,Consolas,monospace}
.badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700}
.b-flag{background:#3a1c1c;color:var(--bad)} .b-ok{background:#14301f;color:var(--ok)}
.k{display:inline-block;border:1px solid var(--line);border-radius:5px;padding:1px 7px;font-family:ui-monospace,monospace;font-size:12px}
.bar{height:6px;background:#0e1015;border-radius:4px;overflow:hidden;margin-top:14px;border:1px solid var(--line)}
.bar i{display:block;height:100%;background:var(--acc);width:0}
button{background:var(--acc);color:#08101f;border:0;border-radius:7px;padding:9px 16px;font:600 14px inherit;cursor:pointer;margin-right:8px}
button.gh{background:transparent;color:var(--fg);border:1px solid var(--line)}
.meta{color:var(--mut);font-size:12px;margin-top:10px}
.ok{color:var(--ok)}.bad{color:var(--bad)}
</style></head><body><div class="wrap">
<h1>Hand check - does this message break a rule?</h1>
<div class="sub">The model's call is shown. <span class="k">Enter</span> accept it &middot; <span class="k">F</span> flag &middot; <span class="k">J</span> ok &middot; <span class="k">U</span> undo &middot; <span class="k">S</span> skip. Progress saves automatically.</div>
<div class="card">
  <div id="ctx" class="ctx"></div>
  <div id="msg" class="msg">loading...</div>
  <div>model says <span id="mc" class="badge"></span> <span class="meta" id="mp"></span></div>
  <div style="margin-top:14px">
    <button id="bflag">Flag (F)</button>
    <button id="bok" class="gh">Ok (J)</button>
    <button id="bskip" class="gh">Skip (S)</button>
  </div>
  <div class="bar"><i id="bar"></i></div>
  <div class="meta" id="prog"></div>
</div>
<div class="card">
  <div class="meta">Your decisions so far</div>
  <div id="stats" class="meta"></div>
</div>
</div>
<script>
var SET=[], DONE=[], SKIP=[], i=0;
var $=function(id){return document.getElementById(id);};
function modelCall(r){ return r.model_p>=0.5 ? 'flag' : 'ok'; }
function seenIdx(){ return DONE.map(function(d){return d.i;}).concat(SKIP.map(function(d){return d.i;})); }
function firstUndone(){ var d=seenIdx(); for(var k=0;k<SET.length;k++){ if(d.indexOf(k)<0) return k; } return SET.length; }
function render(){
  if(i>=SET.length){ $('msg').textContent='All done - '+DONE.length+' judged.'; $('ctx').textContent=''; $('prog').textContent=''; return; }
  var r=SET[i];
  $('ctx').textContent=(r.context&&r.context.length)?r.context.join('  |  '):'(no earlier context)';
  $('msg').textContent=r.message;
  var mc=modelCall(r);
  $('mc').textContent=mc.toUpperCase();
  $('mc').className='badge '+(mc==='flag'?'b-flag':'b-ok');
  $('mp').textContent='p = '+r.model_p.toFixed(3);
  $('bar').style.width=(100*(DONE.length+SKIP.length)/SET.length)+'%';
  $('prog').textContent=DONE.length+' judged, '+SKIP.length+' skipped / '+SET.length+' total';
  var agree=DONE.filter(function(d){return d.human===d.model;}).length;
  $('stats').textContent=DONE.length?('you agreed with the model on '+agree+' of '+DONE.length+' ('+Math.round(100*agree/Math.max(DONE.length,1))+'%)'
    +(SKIP.length?('  ·  '+SKIP.length+' skipped as too ambiguous to call'):'')):'none yet';
}
function record(human){
  if(i>=SET.length) return;
  var r=SET[i], mc=modelCall(r);
  DONE=DONE.filter(function(d){return d.i!==i;});
  DONE.push({i:i, game_id:r.game_id, message:r.message, model_p:r.model_p, model:mc, human:human, clef:r.clef});
  fetch('/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(DONE)});
  i++; render();
}
function undo(){
  var dLast = DONE.length ? DONE[DONE.length-1].i : -1;
  var sLast = SKIP.length ? SKIP[SKIP.length-1].i : -1;
  if (dLast < 0 && sLast < 0) return;
  if (dLast >= sLast) {
    i = DONE.pop().i;
    fetch('/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(DONE)});
  } else {
    i = SKIP.pop().i;
    fetch('/skip',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(SKIP)});
  }
  render();
}
function skip(){
  if(i>=SET.length) return;
  var r=SET[i], mc=modelCall(r);
  SKIP=SKIP.filter(function(d){return d.i!==i;});
  SKIP.push({i:i, game_id:r.game_id, message:r.message, model_p:r.model_p, model:mc, human:'skip', clef:r.clef});
  fetch('/skip',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(SKIP)});
  i++; render();
}
document.addEventListener('keydown',function(e){
  var k=e.key.toLowerCase();
  if(k==='enter'){ record(modelCall(SET[i])); }
  else if(k==='f'){ record('flag'); }
  else if(k==='j'){ record('ok'); }
  else if(k==='u'){ undo(); }
  else if(k==='s'){ skip(); }
  else return;
  e.preventDefault();
});
$('bflag').onclick=function(){record('flag');};
$('bok').onclick=function(){record('ok');};
$('bskip').onclick=skip;
fetch('/set').then(function(r){return r.json();}).then(function(j){
  SET=j.set; DONE=j.done; SKIP=j.skipped||[]; i=firstUndone(); render();
});
</script></body></html>`;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(PAGE);
  }
  if (req.method === 'GET' && req.url === '/set') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ set: loadSet(), done: loadDone(), skipped: loadSkip() }));
  }
  if (req.method === 'POST' && (req.url === '/save' || req.url === '/skip')) {
    let b = '';
    req.on('data', (c) => { b += c; if (b.length > 5e6) req.destroy(); });
    req.on('end', () => {
      try {
        const arr = JSON.parse(b || '[]');
        if (req.url === '/skip') saveSkip(arr); else saveDone(arr);
        res.writeHead(200); res.end('{"ok":true}');
      } catch (e) { res.writeHead(400); res.end(JSON.stringify({ error: String(e.message) })); }
    });
    return;
  }
  res.writeHead(404); res.end('nope');
});
server.listen(PORT, '0.0.0.0', () => console.error('hand-check reviewer on http://localhost:' + PORT));
