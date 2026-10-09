'use strict';
/**
 * Game viewer: one full game's chat, with the classifier's flags marked, and a
 * threshold slider so you can tune sensitivity live.
 *
 *   node gameview.js  ->  http://localhost:8901
 *
 * Scores come from score_game.py (already computed), so the slider just
 * re-thresholds client-side - instant, no model calls per drag.
 */
const http = require('http');
const fs = require('fs');

const JSON_PATH = process.env.GAME_VIEW ||
  '//wsl.localhost/Ubuntu/home/tt/Documents/Ultimafia/rules_ml/game_view.json';
const PORT = Number(process.env.PORT || 8901);

const PAGE = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>game viewer - classifier flags</title>
<style>
:root{--bg:#12141a;--card:#1b1e26;--line:#2c313d;--fg:#e8eaf0;--mut:#9aa3b5;--acc:#6ea8fe;--bad:#ff6b6b;--ok:#4ade80;--warn:#fbbf24}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
.top{position:sticky;top:0;z-index:5;background:var(--card);border-bottom:1px solid var(--line);padding:14px 20px}
.wrap{max-width:1000px;margin:0 auto;padding:0 20px 60px}
h1{font-size:16px;margin:0 0 2px}.sub{color:var(--mut);font-size:12px}
.ctl{display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin-top:12px}
.ctl label{font-size:12px;color:var(--mut)}
input[type=range]{width:260px;vertical-align:middle}
.big{font-variant-numeric:tabular-nums;font-weight:700}
.msg{display:flex;gap:12px;padding:7px 12px;border-left:3px solid transparent;border-radius:4px}
.msg.flag{border-left-color:var(--bad);background:#2a1a1d}
.msg.near{border-left-color:var(--warn);background:#26211a}
.p{color:var(--mut);font-size:12px;font-variant-numeric:tabular-nums;min-width:52px;text-align:right;flex:none}
.snd{font-weight:600;min-width:110px;flex:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ph{color:var(--mut);font-size:11px;min-width:96px;flex:none;overflow:hidden;white-space:nowrap}
.txt{flex:1;word-break:break-word}
.cat{font-size:11px;color:var(--bad);flex:none}
.hide{display:none}
.hist{display:flex;height:34px;align-items:flex-end;gap:1px;margin-top:10px}
.hist i{flex:1;background:#2c313d;min-height:2px}
.hist i.hot{background:var(--bad)}
</style></head><body>
<div class="top"><div class="wrap" style="padding-bottom:0">
  <h1 id="title">loading…</h1>
  <div class="sub" id="meta"></div>
  <div class="ctl">
    <label>flag at p &ge; <span class="big" id="thv">0.50</span></label>
    <input type="range" id="th" min="0.05" max="0.95" step="0.05" value="0.50">
    <label><input type="checkbox" id="onlyflag"> show only flagged</label>
    <span class="sub">flagged <span class="big" id="nflag">0</span> of <span id="ntot">0</span>
      (<span id="pct">0</span>%)</span>
  </div>
  <div class="hist" id="hist"></div>
  <div class="sub" style="margin-top:4px">score distribution (red = would flag at this threshold)</div>
</div></div>
<div class="wrap" style="margin-top:14px"><div id="list"></div></div>
<script>
var DATA=null, TH=0.50;
var $=function(i){return document.getElementById(i);};
function render(){
  var list=$('list'), nf=0, html=[];
  DATA.messages.forEach(function(m){
    var f=m.p>=TH, near=!f&&m.p>=TH-0.10;
    if(f) nf++;
    if($('onlyflag').checked && !f) return;
    html.push('<div class="msg '+(f?'flag':(near?'near':''))+'">'
      +'<span class="p">'+m.p.toFixed(2)+'</span>'
      +'<span class="ph">'+esc(m.phase)+'</span>'
      +'<span class="snd">'+esc(m.sender)+'</span>'
      +'<span class="txt">'+esc(m.text)+'</span>'
      +(f?'<span class="cat">'+esc(m.category)+'</span>':'')
      +'</div>');
  });
  list.innerHTML=html.join('')||'<div class="sub">nothing at this threshold</div>';
  $('nflag').textContent=nf; $('pct').textContent=(100*nf/DATA.messages.length).toFixed(1);
  var bars=$('hist').children, counts=[], i, j;
  for(i=0;i<bars.length;i++) counts.push(0);
  for(j=0;j<DATA.messages.length;j++){
    var b=Math.min(19, Math.floor(DATA.messages[j].p*20));
    counts[b]++;
  }
  var mx=1;
  for(i=0;i<counts.length;i++) if(counts[i]>mx) mx=counts[i];
  for(i=0;i<bars.length;i++){
    bars[i].style.height=Math.max(2, Math.round(34*counts[i]/mx))+'px';
    bars[i].className=((i/20)>=TH-0.0001)?'hot':'';
  }
}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
fetch('/data').then(function(r){return r.json();}).then(function(j){
  if(j.error){ $('title').textContent='error: '+j.error; return; }
  DATA=j;
  $('title').textContent='game '+j.game_id+'  ('+j.game_type+(j.ranked?', ranked':'')+')';
  $('meta').textContent=j.player_count+' players · '+j.message_count+' messages';
  $('ntot').textContent=j.message_count;
  var h=[]; for(var i=0;i<20;i++) h.push('<i></i>');
  $('hist').innerHTML=h.join('');
  $('th').addEventListener('input',function(){ TH=Number(this.value); $('thv').textContent=TH.toFixed(2); render(); });
  $('onlyflag').addEventListener('change',render);
  render();
});
</script></body></html>`;

http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(PAGE);
  }
  if (req.url === '/data') {
    try {
      const d = fs.readFileSync(JSON_PATH, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(d);
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'could not read ' + JSON_PATH + ': ' + String(e.message) }));
    }
  }
  res.writeHead(404); res.end('nope');
}).listen(PORT, '0.0.0.0', () => console.error('game viewer on http://localhost:' + PORT));
