'use strict';
/**
 * Local test harness for the distilled rule-violation models.
 * Zero dependencies. Run:  node serve.js   then open http://localhost:8899
 *
 * Not part of the PR - a scratch tool for eyeballing decisions.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { loadModel, vectorize, buildText } = require('./predict');

const DIR = __dirname;
const PORT = Number(process.env.PORT || 8899);

const MODELS = [
  ['v3', 'model.json', 'v3 word (glossary + stopwords) - NEW'],
  ['v1', 'model_prev.json', 'v1 word (as previously shipped)'],
  ['char', 'model_char.json', 'char_wb (2,5)'],
];
const DEFAULT = 'v3';
const cache = {};
const revcache = {};

function entry(id) { return MODELS.find((m) => m[0] === id) || MODELS[0]; }

function getModel(id) {
  const [mid, file] = entry(id);
  if (!cache[mid]) {
    if (!fs.existsSync(path.join(DIR, file))) return null;
    cache[mid] = loadModel(path.join(DIR, file));
    const rev = new Map();
    for (const a of cache[mid].analyzers) {
      for (const [term, idx] of Object.entries(a.vocab)) rev.set(a.offset + idx, term);
    }
    revcache[mid] = rev;
  }
  return cache[mid];
}

function scoreOne(text, id) {
  const model = getModel(id);
  if (!model) return null;
  const built = buildText(text, [], model);
  const v = vectorize(built, model);
  let z = model.intercept;
  const parts = [];
  for (let i = 0; i < v.length; i++) {
    if (v[i] !== 0) {
      const c = v[i] * model.coef[i];
      z += c;
      parts.push({ term: revcache[entry(id)[0]].get(i) || ('#' + i), contribution: c });
    }
  }
  const p = 1 / (1 + Math.exp(-z));
  parts.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  return {
    id, probability: p, logit: z, intercept: model.intercept, features: parts.length,
    model: model.name, modelFile: entry(id)[1], stopwords: (model.stop_words || []).length,
    topPositive: parts.filter((x) => x.contribution > 0).slice(0, 10),
    topNegative: parts.filter((x) => x.contribution < 0).slice(0, 10),
  };
}

const CASES = [
  ['Z dumbtell', 0], ['that awkward pause feels like a dumbtell', 0],
  ['hc blue, no gun no carol no knife no rifle', 0], ['fos on bob for that vote', 0],
  ['gt is possible here but not locked', 0], ['meta says she pushes early as town', 0],
  ['could be wifom to leave that slot alive', 0], ["you're great at the game", 0],
  ["you're really good at this", 0], ['that was a great play', 0], ['gg wp', 0],
  ['good job', 0], ['vote Bob he is mafia', 0], ['who would like retrained', 0],
  ['im suing', 1], ['you are a moron', 1],
  ['i can report you and u can get reported for ogi', 1], ['shut the fuck up', 1],
  ['u gt btw', 1], ['yes link a game so i can report u >:3', 1],
];

const PAGE = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Ultimafia rule classifier - test harness</title>
<style>
:root{--bg:#12141a;--card:#1b1e26;--line:#2c313d;--fg:#e8eaf0;--mut:#9aa3b5;--acc:#6ea8fe;--bad:#ff6b6b;--ok:#4ade80}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{max-width:920px;margin:0 auto;padding:26px 20px 60px}
h1{font-size:18px;margin:0 0 4px}
.sub{color:var(--mut);font-size:13px;margin-bottom:18px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px;margin-bottom:16px}
label{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--mut);margin-bottom:6px}
textarea{width:100%;background:#0e1015;color:var(--fg);border:1px solid var(--line);border-radius:7px;padding:10px;font:inherit;resize:vertical}
textarea:focus{outline:none;border-color:var(--acc)}
.row{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-top:12px}
button{background:var(--acc);color:#08101f;border:0;border-radius:7px;padding:9px 16px;font:600 14px inherit;cursor:pointer}
button.ghost{background:transparent;color:var(--fg);border:1px solid var(--line);font-weight:500;padding:6px 10px;font-size:12px}
button:hover{opacity:.9}
select,input[type=range]{background:#0e1015;color:var(--fg);border:1px solid var(--line);border-radius:6px;padding:6px}
#bar{height:10px;background:#0e1015;border-radius:6px;overflow:hidden;border:1px solid var(--line)}
#barfill{height:100%;width:0;background:var(--bad);transition:width .18s}
.verdict{font-size:25px;font-weight:700;margin:10px 0 2px}
.meta{color:var(--mut);font-size:12px}
table{width:100%;border-collapse:collapse;font-size:13px}
td,th{padding:4px 6px;border-bottom:1px solid #22262f;text-align:left}
th{color:var(--mut);font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
td.n{text-align:right;width:80px;font-family:ui-monospace,Menlo,Consolas,monospace}
.pos td.n{color:var(--bad)} .neg td.n{color:var(--ok)}
code{font-family:ui-monospace,Menlo,Consolas,monospace}
.presets button{margin:0 6px 6px 0}
.ok{color:var(--ok)} .bad{color:var(--bad)}
.err{color:var(--bad)}
</style></head><body><div class="wrap">
<h1>Ultimafia rule classifier - test harness</h1>
<div class="sub">Local, zero-dependency. Same <code>predict.js</code> a server would run. Threshold default 0.70.</div>

<div class="card">
  <label for="msg">Message</label>
  <textarea id="msg" rows="3">Z dumbtell</textarea>
  <div class="row">
    <button id="go">Score</button>
    <span class="meta">model</span>
    <select id="model"></select>
    <span class="meta">threshold <b id="thv">0.70</b></span>
    <input type="range" id="th" min="0.05" max="0.95" step="0.05" value="0.7">
  </div>
</div>

<div class="card">
  <div class="verdict" id="verdict">-</div>
  <div class="meta" id="detail"></div>
  <div id="bar" style="margin:12px 0 4px"><div id="barfill"></div></div>
  <div class="meta" id="thline"></div>
  <div style="margin-top:14px">
    <label>All models on this message</label>
    <table id="cmp"></table>
  </div>
</div>

<div class="card presets">
  <label>Sanity cases - click to load (expected verdict in brackets)</label>
  <div id="presets"></div>
</div>

<div class="card">
  <label>Why - top contributing n-grams for the selected model</label>
  <div style="display:flex;gap:22px;flex-wrap:wrap">
    <div style="flex:1;min-width:250px"><div class="meta" style="margin-bottom:4px">pushes toward VIOLATION</div><table id="pos"></table></div>
    <div style="flex:1;min-width:250px"><div class="meta" style="margin-bottom:4px">pushes toward OK</div><table id="neg"></table></div>
  </div>
</div>
</div>
<script>
var MODELS = ${JSON.stringify(MODELS.map(function (m) { return [m[0], m[2]]; }))};
var CASES = ${JSON.stringify(CASES)};
var $ = function (id) { return document.getElementById(id); };
$('model').innerHTML = MODELS.map(function (m) {
  return '<option value="' + m[0] + '">' + m[1] + '</option>';
}).join('');
$('presets').innerHTML = CASES.map(function (c, i) {
  return '<button class="ghost" data-i="' + i + '">' + (c[1] ? '[viol] ' : '[ok] ') + c[0].slice(0, 30).replace(/</g, '&lt;') + '</button>';
}).join('');
$('presets').addEventListener('click', function (e) {
  var i = e.target.getAttribute('data-i');
  if (i === null) return;
  $('msg').value = CASES[i][0];
  run();
});
$('th').addEventListener('input', function () { $('thv').textContent = Number($('th').value).toFixed(2); render(); });
$('model').addEventListener('change', render);
$('go').addEventListener('click', run);
var last = null;

function run() {
  var body = JSON.stringify({ text: $('msg').value, context: [], model: $('model').value });
  fetch('/api/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (j.error) { $('verdict').innerHTML = '<span class="err">' + j.error + '</span>'; return; }
      last = j; render();
    })
    .catch(function (e) { $('verdict').innerHTML = '<span class="err">' + e + '</span>'; });
}

function rows(el, list) {
  $(el).innerHTML = list.map(function (f) {
    return '<tr class="' + (f.contribution > 0 ? 'pos' : 'neg') + '"><td>' + f.term.replace(/</g, '&lt;') +
      '</td><td class="n">' + (f.contribution > 0 ? '+' : '') + f.contribution.toFixed(3) + '</td></tr>';
  }).join('') || '<tr><td class="meta">none</td><td></td></tr>';
}

function render() {
  if (!last) return;
  var sel = $('model').value;
  var th = Number($('th').value);
  var cur = (last.compare || []).filter(function (c) { return c.id === sel; })[0] || last;
  var p = cur.probability, flag = p >= th;
  $('verdict').innerHTML = flag
    ? '<span style="color:var(--bad)">FLAGGED</span> - ask the author to reconsider'
    : '<span style="color:var(--ok)">not flagged</span> - would send silently';
  $('detail').textContent = 'p = ' + p.toFixed(4) + '  logit = ' + cur.logit.toFixed(4) +
    '  features hit = ' + cur.features + '  model = ' + cur.model;
  $('barfill').style.width = Math.min(100, p * 100) + '%';
  $('barfill').style.background = flag ? 'var(--bad)' : 'var(--ok)';
  $('thline').textContent = 'threshold ' + th.toFixed(2) + (flag ? ' (p is above it)' : ' (p is below it)');
  $('cmp').innerHTML = '<tr><th>model</th><th>p</th><th>verdict at ' + th.toFixed(2) + '</th></tr>' +
    (last.compare || []).map(function (c) {
      var f2 = c.probability >= th;
      return '<tr><td>' + c.model + '</td><td class="n">' + c.probability.toFixed(4) +
        '</td><td class="' + (f2 ? 'bad' : 'ok') + '">' + (f2 ? 'FLAG' : 'ok') + '</td></tr>';
    }).join('');
  rows('pos', cur.topPositive); rows('neg', cur.topNegative);
}
run();
</script></body></html>`;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(PAGE);
  }
  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, models: MODELS.filter((m) => fs.existsSync(path.join(DIR, m[1]))).map((m) => m[0]) }));
  }
  if (req.method === 'POST' && req.url === '/api/reload') {
    for (const k of Object.keys(cache)) delete cache[k];
    for (const k of Object.keys(revcache)) delete revcache[k];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, reloaded: Object.keys(cache).length === 0 }));
  }
  if (req.method === 'POST' && req.url === '/api/score') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const text = parsed.text || '';
        const model = parsed.model || DEFAULT;
        const t0 = process.hrtime.bigint();
        const compare = MODELS.map((m) => scoreOne(text, m[0])).filter(Boolean);
        const out = scoreOne(text, model) || compare[0];
        out.compare = compare;
        out.latencyMs = Number(process.hrtime.bigint() - t0) / 1e6;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(out));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: String(e.message || e) }));
      }
    });
    return;
  }
  res.writeHead(404); res.end('not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.error('test harness on http://localhost:' + PORT);
});
