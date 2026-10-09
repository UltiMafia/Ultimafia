// cls.js - run the 4-class fine-tuned MiniLM in Node via int8 ONNX.
// Same WordPiece tokenizer as tf.js; this one reports WHICH rule, not just whether.
const fs = require('fs');
const path = require('path');
const ort = require('onnxruntime-node');

const MODEL_DIR = process.env.CLS_MODEL_DIR ||
  '//wsl.localhost/Ubuntu/home/tt/Documents/Ultimafia/rules_ml/finetune_cls3_out';
const MAXLEN = 96;

// index order must match CLASSES in finetune_cls3.py
const CLASSES = ['no_violation', 'abuse', 'outside_game_influence', 'other'];
const LABELS = {
  no_violation: 'no violation',
  abuse: 'abuse / harassment',
  outside_game_influence: 'outside game influence',
  other: 'other (hazing, doxxing, ...)',
};

let VOCAB = null;
let SESS = null;

function loadVocab() {
  const lines = fs.readFileSync(path.join(MODEL_DIR, 'vocab.txt'), 'utf8').split(/\r?\n/);
  const v = new Map();
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i];
    if (t === '' && i === lines.length - 1) continue;
    v.set(t, i);
  }
  return v;
}

function stripAccents(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function cleanText(t) {
  return t.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim();
}
function isPunct(ch) {
  const c = ch.codePointAt(0);
  return ((c >= 33 && c <= 47) || (c >= 58 && c <= 64) ||
          (c >= 91 && c <= 96) || (c >= 123 && c <= 126));
}
function basicTokenize(text) {
  const t = stripAccents(cleanText(text).toLowerCase());
  const out = [];
  for (const chunk of t.split(' ')) {
    if (!chunk) continue;
    let cur = '';
    for (const ch of chunk) {
      if (isPunct(ch)) { if (cur) out.push(cur); cur = ''; out.push(ch); }
      else cur += ch;
    }
    if (cur) out.push(cur);
  }
  return out;
}
function wordpiece(tokens, vocab) {
  const out = [];
  for (const tok of tokens) {
    if (vocab.has(tok)) { out.push(tok); continue; }
    let start = 0, bad = false;
    const sub = [];
    while (start < tok.length) {
      let end = tok.length, cur = null;
      while (start < end) {
        let piece = tok.slice(start, end);
        if (start > 0) piece = '##' + piece;
        if (vocab.has(piece)) { cur = piece; break; }
        end--;
      }
      if (cur === null) { bad = true; break; }
      sub.push(cur); start = end;
    }
    if (bad) out.push('[UNK]'); else out.push(...sub);
  }
  return out;
}
function encode(text) {
  const tps = wordpiece(basicTokenize(text), VOCAB);
  const ids = [VOCAB.get('[CLS]')];
  for (const t of tps) { if (ids.length >= MAXLEN - 1) break; ids.push(VOCAB.get(t)); }
  ids.push(VOCAB.get('[SEP]'));
  const mask = new Array(ids.length).fill(1);
  while (ids.length < MAXLEN) { ids.push(VOCAB.get('[PAD]')); mask.push(0); }
  return { ids, mask, ntok: Math.min(tps.length + 2, MAXLEN) };
}

async function init() {
  if (!VOCAB) VOCAB = loadVocab();
  if (!SESS) SESS = await ort.InferenceSession.create(path.join(MODEL_DIR, 'model.int8.onnx'));
  return true;
}

async function score(text) {
  if (!SESS) await init();
  const { ids, mask, ntok } = encode(text);
  const feeds = {
    input_ids: new ort.Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, MAXLEN]),
    attention_mask: new ort.Tensor('int64', BigInt64Array.from(mask.map(BigInt)), [1, MAXLEN]),
  };
  if (SESS.inputNames.includes('token_type_ids')) {
    feeds.token_type_ids = new ort.Tensor('int64', new BigInt64Array(MAXLEN), [1, MAXLEN]);
  }
  const out = await SESS.run(feeds);
  const lg = Array.from(out.logits.data);
  const m = Math.max(...lg);
  const ex = lg.map((v) => Math.exp(v - m));
  const s = ex.reduce((a, b) => a + b, 0);
  const probs = ex.map((v) => v / s);
  let best = 0;
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[best]) best = i;

  // binary view: anything but no_violation is a violation
  const pViol = 1 - probs[0];
  return {
    prob: pViol,
    category: CLASSES[best],
    categoryLabel: LABELS[CLASSES[best]],
    categoryConf: probs[best],
    probs: CLASSES.map((c, i) => ({ category: c, p: probs[i] })),
    tokens: ntok,
  };
}

module.exports = { init, score, encode, CLASSES, LABELS, MODEL_DIR };

if (require.main === module) {
  (async () => {
    await init();
    const CASES = ["you're great at the game", "that's dumb", "u got a fucking cc",
      "he's not gay lol", "you're gting", "im suing", "you're dumb",
      "can XYZ shut the fuck up?", "bob lives in ohio", "shut up"];
    for (const c of CASES) {
      const r = await score(c);
      console.log(`${c.padEnd(30)} p=${r.prob.toFixed(3)}  ${r.categoryLabel} (${r.categoryConf.toFixed(2)})`);
    }
  })();
}
