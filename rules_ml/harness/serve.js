'use strict';
/**
 * Test harness with the fine-tuned transformer (int8 ONNX) plus the linear models.
 * Runs on the Windows node; model files are read from the WSL repo over UNC.
 *   node serve.js   ->  http://localhost:8899
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const WSL_DIR = process.env.MODEL_DIR ||
  '//wsl.localhost/Ubuntu/home/tt/Documents/Ultimafia/rules_ml';
const PORT = Number(process.env.PORT || 8899);

const { loadModel, vectorize, buildText } = require(path.join(WSL_DIR, 'predict.js'));
const tf = require('./tf.js');
const cls = require('./cls.js');

// id, file (relative to WSL_DIR, null for the onnx model), label
const MODELS = [
  ['cls', null, 'MiniLM-L6 int8 - 4-class: WHICH rule'],
  ['tf', null, 'MiniLM-L6 int8 (transformer)'],
  ['v3', 'model.json', 'word(1,2)+logreg (linear)'],
  ['char', 'model_char.json', 'char_wb(2,5) linear'],
  ['v1', 'model_prev.json', 'v1 word (old)'],
];
const DEFAULT = 'cls';
const cache = {};
const revcache = {};

function entry(id) { return MODELS.find((m) => m[0] === id) || MODELS[0]; }

function getModel(id) {
  const [mid, file] = entry(id);
  if (!file) return null;
  if (!cache[mid]) {
    if (!fs.existsSync(path.join(WSL_DIR, file))) return null;
    cache[mid] = loadModel(path.join(WSL_DIR, file));
    const rev = new Map();
    for (const a of cache[mid].analyzers) {
      for (const [term, idx] of Object.entries(a.vocab)) rev.set(a.offset + idx, term);
    }
    revcache[mid] = rev;
  }
  return cache[mid];
}

function scoreLinear(text, id) {
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

async function scoreOne(text, id) {
  if (id === 'cls') {
    try {
      const r = await cls.score(text);
      return {
        id, probability: r.prob, logit: null, intercept: null, features: r.tokens,
        model: 'MiniLM-L6 int8 - 4-class', modelFile: 'finetune_cls3_out/model.int8.onnx',
        category: r.category, categoryLabel: r.categoryLabel, categoryConf: r.categoryConf,
        probs: r.probs, stopwords: 0, topPositive: [], topNegative: [],
      };
    } catch (e) {
      return { id, probability: 0, logit: null, intercept: null, features: 0,
               model: '4-class (failed: ' + String(e).slice(0, 60) + ')',
               modelFile: '', stopwords: 0, topPositive: [], topNegative: [] };
    }
  }
  if (id === 'tf') {
    try {
      const r = await tf.score(text);
      return {
        id, probability: r.prob, logit: null, intercept: null, features: r.tokens,
        model: 'MiniLM-L6 int8 (transformer)', modelFile: 'finetune2_out/model.int8.onnx',
        stopwords: 0, topPositive: [], topNegative: [],
      };
    } catch (e) {
      return { id, probability: 0, logit: null, intercept: null, features: 0,
               model: 'transformer (failed: ' + String(e).slice(0, 60) + ')',
               modelFile: '', stopwords: 0, topPositive: [], topNegative: [] };
    }
  }
  return scoreLinear(text, id);
}

const CASES = [
  ["you're great at the game", 0], ["that's dumb", 0], ["STFU let gov hammer", 0],
  ['shut up', 0], ['bob lives in ohio', 0], ['Z dumbtell', 0], ['gg wp', 0],
  ['nice one lol', 0], ['vote Bob he is mafia', 0], ['that was a great play', 0],
  ['im in LA now', 0], ["what's your report?", 0], ["Clark is also Z's alt", 0],
  ["you're gting", 1], ["you're gamethrowing", 1], ['stop gamethrowing', 1],
  ['unvote me or you\'re gting', 1], ['im suing', 1], ['you are a moron', 1],
  ['can XYZ shut the fuck up?', 1], ['you are gamethrowing', 1],
  ['i can report you and u can get reported for ogi', 1],
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
.ok{color:var(--ok)} .bad{color:var(--bad)} .err{color:var(--bad)}
</style></head><body><div class="wrap">
<h1>Ultimafia rule classifier - test harness</h1>
<div class="sub">Transformer = MiniLM-L6 int8 onnx (~13 ms/msg). Threshold default 0.70.</div>
<div class="card">
  <label for="msg">Message</label>
  <textarea id="msg" rows="3">you're gamethrowing</textarea>
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
  <label>Cases - click to load ([viol] = should flag)</label>
  <div id="presets"></div>
</div>
<div class="card">
  <label>Why - top contributing n-grams (linear models only)</label>
  <div style="display:flex;gap:22px;flex-wrap:wrap">
    <div style="flex:1;min-width:250px"><div class="meta" style="margin-bottom:4px">toward VIOLATION</div><table id="pos"></table></div>
    <div style="flex:1;min-width:250px"><div class="meta" style="margin-bottom:4px">toward OK</div><table id="neg"></table></div>
  </div>
</div>
</div>
<script>
var MODELS = ${JSON.stringify(MODELS.map((m) => [m[0], m[2]]))};
var CASES = ${JSON.stringify(CASES)};
var $ = function (id) { return document.getElementById(id); };
$('model').innerHTML = MODELS.map(function (m) { return '<option value="' + m[0] + '">' + m[1] + '</option>'; }).join('');
$('presets').innerHTML = CASES.map(function (c, i) {
  return '<button class="ghost" data-i="' + i + '">' + (c[1] ? '[viol] ' : '[ok] ') + c[0].slice(0, 32).replace(/</g, '&lt;') + '</button>';
}).join('');
$('presets').addEventListener('click', function (e) {
  var i = e.target.getAttribute('data-i'); if (i === null) return;
  $('msg').value = CASES[i][0]; run();
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
  $(el).innerHTML = (list || []).map(function (f) {
    return '<tr class="' + (f.contribution > 0 ? 'pos' : 'neg') + '"><td>' + f.term.replace(/</g, '&lt;') +
      '</td><td class="n">' + (f.contribution > 0 ? '+' : '') + f.contribution.toFixed(3) + '</td></tr>';
  }).join('') || '<tr><td class="meta">none</td><td></td></tr>';
}
function render() {
  if (!last) return;
  var sel = $('model').value, th = Number($('th').value);
  var cur = (last.compare || []).filter(function (c) { return c.id === sel; })[0] || last;
  var p = cur.probability, flag = p >= th;
  $('verdict').innerHTML = flag
    ? '<span style="color:var(--bad)">FLAGGED</span> - ask the author to reconsider'
    : '<span style="color:var(--ok)">not flagged</span> - would send silently';
  var extra = '';
  if (cur.categoryLabel) {
    extra = '  |  says: ' + cur.categoryLabel + ' (' + cur.categoryConf.toFixed(2) + ')  [' +
      (cur.probs || []).map(function (x) {
        return x.category.replace('outside_game_influence', 'ogi')
          .replace('no_violation', 'ok').replace('personal_attacks_harassment', 'abuse')
          .replace(/_/g, ' ') + ' ' + x.p.toFixed(2);
      }).join('  ') + ']';
  }
  $('detail').textContent = 'p = ' + p.toFixed(4) +
    (cur.logit == null ? '' : '  logit = ' + cur.logit.toFixed(4)) +
    '  ' + (cur.logit == null ? 'tokens' : 'features hit') + ' = ' + cur.features +
    '  model = ' + cur.model + extra;
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

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(PAGE);
  }
  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, models: MODELS.map((m) => m[0]), default: DEFAULT }));
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
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const text = parsed.text || '';
        const model = parsed.model || DEFAULT;
        const t0 = process.hrtime.bigint();
        const compare = [];
        for (const m of MODELS) {
          const r = await scoreOne(text, m[0]);
          if (r) compare.push(r);
        }
        const sel = compare.find((c) => c.id === model) || compare[0];
        const out = Object.assign({}, sel);   // copy: assigning compare onto a
        out.compare = compare;                // member of compare makes a cycle
        out.latencyMs = Number(process.hrtime.bigint() - t0) / 1e6;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(out));
      } catch (e) {
        console.error('score error:', (e && e.stack) || e);
        if (!res.headersSent) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: String(e.message || e) }));
        } else {
          res.end();
        }
      }
    });
    return;
  }
  res.writeHead(404); res.end('not found');
});

server.listen(PORT, '0.0.0.0', async () => {
  try { await tf.init(); console.error('transformer ready'); } catch (e) { console.error('transformer init failed: ' + e); }
  console.error('test harness on http://localhost:' + PORT);
});
