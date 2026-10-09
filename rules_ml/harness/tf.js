// tf.js - run the fine-tuned MiniLM in Node via int8 ONNX.
// Includes a WordPiece tokenizer, since the harness has no transformers dep.
// Verified against HuggingFace BertTokenizer; see tf_test.js.
const fs = require('fs');
const path = require('path');
const ort = require('onnxruntime-node');

const MODEL_DIR = process.env.TF_MODEL_DIR ||
  '//wsl.localhost/Ubuntu/home/tt/Documents/Ultimafia/rules_ml/finetune2_out';
const MAXLEN = 96;

let VOCAB = null;
let SESS = null;

function loadVocab() {
  const lines = fs.readFileSync(path.join(MODEL_DIR, 'vocab.txt'), 'utf8').split(/\r?\n/);
  const v = new Map();
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i];
    if (t === '' && i === lines.length - 1) continue;   // trailing newline
    v.set(t, i);
  }
  return v;
}

function stripAccents(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// HF cleans control chars, collapses whitespace, lowercases.
function cleanText(text) {
  let t = text.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

// HF: whitespace split, then split each chunk on punctuation, punctuation as its own token.
function isPunct(ch) {
  const c = ch.codePointAt(0);
  return (
    (c >= 33 && c <= 47) || (c >= 58 && c <= 64) ||
    (c >= 91 && c <= 96) || (c >= 123 && c <= 126)
  );
}

function basicTokenize(text) {
  const t = stripAccents(cleanText(text).toLowerCase());
  const out = [];
  for (const chunk of t.split(' ')) {
    if (!chunk) continue;
    let cur = '';
    for (const ch of chunk) {
      if (isPunct(ch)) {
        if (cur) out.push(cur);
        cur = '';
        out.push(ch);
      } else {
        cur += ch;
      }
    }
    if (cur) out.push(cur);
  }
  return out;
}

function wordpiece(tokens, vocab) {
  const out = [];
  for (const tok of tokens) {
    if (vocab.has(tok)) { out.push(tok); continue; }
    let start = 0;
    const sub = [];
    let bad = false;
    while (start < tok.length) {
      let end = tok.length;
      let cur = null;
      while (start < end) {
        let piece = tok.slice(start, end);
        if (start > 0) piece = '##' + piece;
        if (vocab.has(piece)) { cur = piece; break; }
        end--;
      }
      if (cur === null) { bad = true; break; }
      sub.push(cur);
      start = end;
    }
    if (bad) out.push('[UNK]'); else out.push(...sub);
  }
  return out;
}

function encode(text) {
  const tps = wordpiece(basicTokenize(text), VOCAB);
  const ids = [VOCAB.get('[CLS]')];
  for (const t of tps) {
    if (ids.length >= MAXLEN - 1) break;
    ids.push(VOCAB.get(t));
  }
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
  const { ids, mask } = encode(text);
  const feeds = {
    input_ids: new ort.Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, MAXLEN]),
    attention_mask: new ort.Tensor('int64', BigInt64Array.from(mask.map(BigInt)), [1, MAXLEN]),
  };
  if (SESS.inputNames.includes('token_type_ids')) {
    feeds.token_type_ids = new ort.Tensor('int64', new BigInt64Array(MAXLEN), [1, MAXLEN]);
  }
  const out = await SESS.run(feeds);
  const lg = out.logits.data;
  const m = Math.max(lg[0], lg[1]);
  const e0 = Math.exp(lg[0] - m), e1 = Math.exp(lg[1] - m);
  return { prob: e1 / (e0 + e1), tokens: encode(text).ntok };
}

module.exports = { init, score, encode, MODEL_DIR };

if (require.main === module) {
  (async () => {
    await init();
    const CASES = ["you're great at the game", "unvote me or you're gting", "you're gting",
      "that's dumb", "you're dumb", "shut up", "can XYZ shut the fuck up?",
      "STFU let gov hammer", "bob lives in ohio", "you are a moron", "Z dumbtell", "im suing"];
    for (const c of CASES) {
      const r = await score(c);
      console.log(`${c.padEnd(30)} p=${r.prob.toFixed(4)}`);
    }
  })();
}
