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
test('reviewed tab windows require matching master evidence, keyboard checks, complete labels and usable targets', () => {
  const observation = { surface: 'learn-games', taskChecks: ['selected-tabs-fit-scroll-window-and-keyboard-reaches-first-and-last-sections'] };
  const problem = { property: 'clippedByAncestor', severity: 'medium', target: { role: 'tab' }, tabScrollWindow: {
    scrollWidth: 500, clientWidth: 200, hasEnabledScrollButton: true,
    selected: true, labelWithinWindow: true, visibleHitWidth: 70,
  } };
  assert.equal(report.classifyDifference(observation, problem, 0).status, 'intentional');
  assert.equal(report.classifyDifference({ ...observation, surface: 'shop' }, problem, 0).status, 'open');
  assert.equal(report.classifyDifference({ ...observation, taskChecks: [] }, problem, 0).status, 'open');
  assert.equal(report.classifyDifference(observation, problem, null).status, 'open');
  assert.equal(report.classifyDifference(observation, { ...problem, severity: 'high' }, 0).status, 'open');
  assert.equal(report.classifyDifference(observation, { ...problem, target: { role: 'button' } }, 0).status, 'open');
  for (const change of [{ labelWithinWindow: false }, { visibleHitWidth: 20 }, { hasEnabledScrollButton: false }, { scrollWidth: 200 }]) {
    assert.equal(report.classifyDifference(observation, { ...problem, tabScrollWindow: { ...problem.tabScrollWindow, ...change } }, 0).status, 'open');
  }
});
test('clipping comparisons match the same named control and tablist, never an unrelated first master finding', () => {
  const identity = { role: 'tab', name: 'event', tablistIndex: 1 };
  const problem = { role: 'control', selector: '#event', property: 'clippedByAncestor', observed: 12, target: identity, severity: 'medium' };
  const measurement = targets => ({ state: 'default', position: 'top', screenshot: 'example.png', viewport: { width: 320, height: 844 },
    heading: { selector: '#heading', fontSize: 24, box: { top: 0 } }, shell: { box: { top: 0 } }, samples: [], controlTargets: targets, problems: [problem] });
  const run = (branch, targets) => ({ branch, directory: '/unused', report: { palette: 'dark', cases: [{ name: 'learn-games', route: '/learn/games',
    status: 'captured-baseline-not-accepted', viewport: { width: 320 }, measurements: [measurement(targets)] }] } });
  const target = { identity, clippingPixels: 5 };
  const runs = [run('redesign', [{ ...target, clippingPixels: 12 }]), run('master', [{ identity: { ...identity, name: 'roles', tablistIndex: 0 }, clippingPixels: 90 }, target])];
  const compare = runs => report.buildReport([{ id: 'learn-games.default', surface: 'learn-games', state: 'default' }], runs).findings[0];
  assert.equal(compare(runs).masterValue, 5);
  assert.equal(compare(runs).masterDelta, 7);
  assert.equal(compare([runs[0], run('master', [])]).masterValue, null);
  assert.equal(compare([runs[0], run('master', [target, target])]).masterStatus, 'ambiguous-target');
});
