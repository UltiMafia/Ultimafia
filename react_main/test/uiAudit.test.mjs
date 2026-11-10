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
  assert.ok(items.some(item => item.id === 'developer.revoke-confirmation' && item.master.equivalence === 'nearest-ancestor'));
  assert.ok(items.some(item => item.id === 'invoices.loading' && item.master.equivalence === 'same-route'));
  const example = items.find(item => item.id === 'new-page-contract.default');
  assert.equal(example.master.equivalence, 'nearest-ancestor');
  assert.equal(example.master.route, '/community/feedback');
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
test('role comparisons weight routes equally and retain every outlier selector', () => {
  const observation = (branch, surface, sizes) => ({ branch, surface, state: 'default', width: 320, palette: 'dark', measurement: { position: 'top', samples: sizes.map((fontSize, index) => ({ role: 'textInput', selector: `${surface}-${index}`, fontSize })) } });
  const result = report.compareRoles([observation('redesign', 'target', [16, 24]), observation('redesign', 'many-rows', Array(443).fill(12)), observation('redesign', 'one-field', [20]), observation('master', 'target', [14])]).filter(value => value.surface === 'target' && value.property === 'fontSize');
  assert.equal(result.length, 2);
  assert.ok(result.every(value => value.peerMedian === 16 && value.masterValue === 14 && value.masterStatus === 'changed'));
  assert.deepEqual(result.map(value => value.selectors), [['target-0'], ['target-1']]);
  assert.equal(result[1].masterDelta, 10);
});
