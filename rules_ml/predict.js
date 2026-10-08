/**
 * Dependency-free runtime for the distilled Ultimafia rule-violation model.
 *
 *   const { loadModel, predict } = require('./predict');
 *   const model = loadModel();               // cached
 *   predict(targetText, contextArray, model) // -> probability in [0,1]
 *
 * Mirrors sklearn TfidfVectorizer(sublinear_tf, smooth_idf, l2) per block,
 * hstack, then logistic regression. Verified against scikit-learn.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const WORD_RE = /[\p{L}\p{N}_]{2,}/gu;

function tokWord(text, minN, maxN) {
  const toks = text.toLowerCase().match(WORD_RE) || [];
  const out = [];
  for (let n = minN; n <= maxN; n++) {
    if (n === 1) {
      for (const t of toks) out.push(t);
    } else {
      for (let i = 0; i + n <= toks.length; i++) out.push(toks.slice(i, i + n).join(' '));
    }
  }
  return out;
}

function tokCharWb(text, minN, maxN) {
  const out = [];
  const words = text.toLowerCase().replace(/\s\s+/g, ' ').split(/\s+/).filter((w) => w.length > 0);
  for (const w0 of words) {
    const w = ' ' + w0 + ' ';
    const L = w.length;
    for (let n = minN; n <= maxN; n++) {
      let off = 0;
      out.push(w.slice(off, off + n));
      while (off + n < L) {
        off += 1;
        out.push(w.slice(off, off + n));
      }
      if (off === 0) break; // sklearn counts a word shorter than n only once
    }
  }
  return out;
}

function loadModel(file) {
  const p = file || path.join(__dirname, 'model.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/** Build the "target + recent context" string the model was trained on. */
function buildText(target, context, model) {
  if (!model.use_context) return target;
  const n = model.n_ctx || 3;
  const ctx = (context || []).slice(-n);
  return ctx.join(' \n ') + ' \n ' + target;
}

function vectorize(text, model) {
  const coef = model.coef;
  const vec = new Float64Array(coef.length);
  for (const a of model.analyzers) {
    const toks = a.kind === 'word'
      ? tokWord(text, a.ngram_range[0], a.ngram_range[1])
      : tokCharWb(text, a.ngram_range[0], a.ngram_range[1]);
    const counts = new Map();
    for (const t of toks) counts.set(t, (counts.get(t) || 0) + 1);
    const off = a.offset, idf = a.idf, vocab = a.vocab;
    let norm = 0;
    const tmp = [];
    for (const [t, c] of counts) {
      const idx = vocab[t];
      if (idx === undefined) continue;
      const tf = a.sublinear_tf ? 1 + Math.log(c) : c;
      const v = tf * idf[idx];
      tmp.push([idx, v]);
      norm += v * v;
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (const [idx, v] of tmp) vec[off + idx] = v / norm;
    }
  }
  return vec;
}

function predict(target, context, model) {
  const text = buildText(target, context, model);
  const vec = vectorize(text, model);
  let z = model.intercept;
  for (let i = 0; i < vec.length; i++) z += vec[i] * model.coef[i];
  return 1 / (1 + Math.exp(-z));
}

module.exports = { loadModel, predict, buildText, vectorize };

if (require.main === module) {
  const m = loadModel();
  const cases = [
    ['im suing', ['alice: vote bob', 'bob: nvm']],
    ['i can report you and u can get reported for ogi', []],
    ['who would like retrained', []],
    ['gg wp', ['alice: gg']],
  ];
  for (const [t, c] of cases) {
    console.log(predict(t, c, m).toFixed(4), '|', t);
  }
}
