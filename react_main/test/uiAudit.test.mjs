import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import report from './ui-audit/report.cjs';

test('audit inventory contains stable route/state ids with all master pairs required', () => {
  const items = report.inventoryFromSource(fs.readFileSync(new URL('./routeReviewData.jsx', import.meta.url), 'utf8'));
  assert.ok(items.length > 64);
  assert.equal(new Set(items.map(item => item.id)).size, items.length);
  assert.ok(items.every(item => item.master.status === 'required'));
  assert.ok(items.some(item => item.id === 'forum-thread.reply'));
});
test('missing captures cannot pass and a single palette/width cannot reduce the denominator', () => {
  const result = report.buildReport([{ id: 'players.default', surface: 'players', state: 'default', route: '/community/users' }], []);
  assert.equal(result.summary.required, 6);
  assert.equal(result.summary.gaps, 6);
  assert.equal(result.summary.paired, 0);
  assert.equal(result.summary.visualAcceptance, false);
});
test('failed fixture contracts do not count as coverage', () => {
  const result = report.buildReport([{ id: 'x.default', surface: 'x', state: 'default' }], [{ branch: 'redesign', directory: '/unused', report: { palette: 'dark', cases: [{ name: 'x', status: 'failed-not-accepted', viewport: { width: 1440 }, measurements: [{ state: 'default' }] }] } }]);
  assert.equal(result.summary.redesignCaptured, 0);
});
test('audit medians reject missing values without converting them to zero', () => {
  assert.equal(report.median([null, undefined, 12, 24]), 18);
  assert.equal(report.median([]), null);
});
