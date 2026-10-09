'use strict';
const fs = require('fs');
const path = require('path');
const { loadModel, predict } = require('./predict');

const DIR = '/home/tt/Documents/Ultimafia/rules_ml';

function bench(modelFile, label) {
  const t0 = process.hrtime.bigint();
  const model = loadModel(path.join(DIR, modelFile));
  const loadMs = Number(process.hrtime.bigint() - t0) / 1e6;

  // real messages from the archive
  const texts = [];
  const p = path.join(DIR, 'decisions_all.jsonl');
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      if (!line) continue;
      try { texts.push(JSON.parse(line).target); } catch (e) {}
    }
  }
  // warm up
  for (let i = 0; i < 2000; i++) predict(texts[i % texts.length], [], model);

  const N = 100000;
  const lat = new Float64Array(N);
  const start = process.hrtime.bigint();
  for (let i = 0; i < N; i++) {
    const t = process.hrtime.bigint();
    predict(texts[i % texts.length], [], model);
    lat[i] = Number(process.hrtime.bigint() - t) / 1e6;
  }
  const totalMs = Number(process.hrtime.bigint() - start) / 1e6;
  const sorted = Array.from(lat).sort((a, b) => a - b);
  const pick = (q) => sorted[Math.min(N - 1, Math.floor(q * N))];

  // longest message in the archive set
  const longest = texts.reduce((a, b) => (b.length > a.length ? b : a), '');
  const t2 = process.hrtime.bigint();
  for (let i = 0; i < 20000; i++) predict(longest, [], model);
  const longAvg = Number(process.hrtime.bigint() - t2) / 1e6 / 20000;

  const mean = sorted.reduce((a, b) => a + b, 0) / N;
  console.log('--- ' + label + ' (' + modelFile + ') ---');
  console.log('  load + JSON.parse : ' + loadMs.toFixed(1) + ' ms  (once, at boot)');
  console.log('  messages benchmarked: ' + N + ' over ' + texts.length + ' distinct archive messages');
  console.log('  mean   : ' + mean.toFixed(4) + ' ms');
  console.log('  p50    : ' + pick(0.50).toFixed(4) + ' ms');
  console.log('  p95    : ' + pick(0.95).toFixed(4) + ' ms');
  console.log('  p99    : ' + pick(0.99).toFixed(4) + ' ms');
  console.log('  max    : ' + sorted[N - 1].toFixed(4) + ' ms');
  console.log('  throughput (1 core): ' + (N / (totalMs / 1000)).toFixed(0) + ' msg/s');
  console.log('  longest msg (' + longest.length + ' chars): ' + longAvg.toFixed(4) + ' ms/msg');
  const mu = process.memoryUsage();
  console.log('  heapUsed: ' + (mu.heapUsed / 1048576).toFixed(1) + ' MB  rss: ' + (mu.rss / 1048576).toFixed(1) + ' MB');
  console.log('');
}

bench('model.json', 'primary');
bench('model_char.json', 'high-recall');
