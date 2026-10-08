/* Verify predict.js reproduces the Python portable implementation exactly. */
'use strict';
const fs = require('fs');
const path = require('path');
const { loadModel, predict } = require('./predict');

const DIR = '/home/tt/Documents/Ultimafia/rules_ml';
const model = loadModel(path.join(DIR, 'model.json'));
const vals = JSON.parse(fs.readFileSync(path.join(DIR, 'val_preds.json'), 'utf8'));

let maxd = 0, sum = 0, worst = null;
for (const v of vals) {
  const p = predict(v.target, v.context, model);
  const d = Math.abs(p - v.prob);
  sum += d;
  if (d > maxd) { maxd = d; worst = [v.target, v.prob, p]; }
}
console.log('n=' + vals.length + '  max|diff|=' + maxd.toExponential(3) + '  mean=' + (sum / vals.length).toExponential(3));
if (worst) console.log('worst:', JSON.stringify(worst[0]).slice(0, 80), 'py=' + worst[1].toFixed(6), 'js=' + worst[2].toFixed(6));

// latency
const t0 = process.hrtime.bigint();
const N = 2000;
for (let i = 0; i < N; i++) {
  const v = vals[i % vals.length];
  predict(v.target, v.context, model);
}
const ms = Number(process.hrtime.bigint() - t0) / 1e6;
console.log('latency: ' + (ms / N).toFixed(3) + ' ms/message (' + N + ' calls in ' + ms.toFixed(0) + ' ms)');
console.log('model.json size: ' + (fs.statSync(path.join(DIR, 'model.json')).size / 1024).toFixed(0) + ' KB');

// sanity cases
const cases = [
  ['im suing', ['alice: vote bob', 'bob: nvm']],
  ['i can report you and u can get reported for ogi', []],
  ['you are a moron', []],
  ['who would like retrained', []],
  ['my meta on XYZ tells me they are mafia, vote them out', []],
  ['Kai is only forgiven since he\'s a pillar of UM', []],
];
console.log('\nname                            prob');
for (const [t, c] of cases) console.log(('  ' + t).slice(0, 42).padEnd(44) + predict(t, c, model).toFixed(4));
