import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import report from './ui-audit/report.cjs';

test('audit inventory contains stable, unique route/state ids', () => {
  const items = report.inventoryFromSource(fs.readFileSync(new URL('./routeReviewData.jsx', import.meta.url), 'utf8'));
  assert.ok(items.length > 64);
  assert.equal(new Set(items.map(item => item.id)).size, items.length);
  assert.ok(items.some(item => item.id === 'forum-thread.reply'));
  assert.ok(items.some(item => item.id === 'developer.revoke-confirmation'));
  assert.ok(items.some(item => item.id === 'invoices.loading'));
  assert.ok(items.some(item => item.id === 'new-page-contract.default'));
  // Upstream master is not a reference: matching it is not a goal of the
  // redesign, so the inventory carries no master pairing requirement.
  assert.ok(items.every(item => !('master' in item)));
});
test('missing captures cannot pass and a single palette/width cannot reduce the denominator', () => {
  const result = report.buildReport([{ id: 'players.default', surface: 'players', state: 'default', route: '/community/users' }], []);
  assert.equal(result.summary.required, 6);
  assert.equal(result.summary.missing, 6);
  assert.equal(result.summary.captured, 0);
  assert.equal(result.summary.visualAcceptance, false);
});
test('failed fixture contracts do not count as coverage', () => {
  const result = report.buildReport([{ id: 'x.default', surface: 'x', state: 'default' }], [{ directory: '/unused', report: { palette: 'dark', cases: [{ name: 'x', status: 'failed-not-accepted', viewport: { width: 1440 }, measurements: [{ state: 'default' }] }] } }]);
  assert.equal(result.summary.captured, 0);
});
test('audit medians reject missing values without converting them to zero', () => {
  assert.equal(report.median([null, undefined, 12, 24]), 18);
  assert.equal(report.median([]), null);
});
test('role comparisons weight routes equally and retain every outlier selector', () => {
  const observation = (surface, sizes) => ({ surface, state: 'default', width: 320, palette: 'dark', measurement: { position: 'top', samples: sizes.map((fontSize, index) => ({ role: 'textInput', selector: `${surface}-${index}`, fontSize })) } });
  const result = report.compareRoles([observation('target', [16, 24]), observation('many-rows', Array(443).fill(12)), observation('one-field', [20])]).filter(value => value.surface === 'target' && value.property === 'fontSize');
  assert.equal(result.length, 2);
  assert.ok(result.every(value => value.peerMedian === 16));
  assert.deepEqual(result.map(value => value.selectors), [['target-0'], ['target-1']]);
  assert.equal(result[1].delta, 8);
  assert.ok(result.every(value => !('masterValue' in value)));
});
test('reviewed tab windows require keyboard checks, complete labels and usable targets', () => {
  const observation = { surface: 'learn-games', taskChecks: ['selected-tabs-fit-scroll-window-and-keyboard-reaches-first-and-last-sections'] };
  const problem = { property: 'clippedByAncestor', severity: 'medium', target: { role: 'tab' }, tabScrollWindow: {
    scrollWidth: 500, clientWidth: 200, hasEnabledScrollButton: true,
    selected: true, labelWithinWindow: true, visibleHitWidth: 70,
  } };
  assert.equal(report.classifyDifference(observation, problem).status, 'intentional');
  assert.equal(report.classifyDifference({ ...observation, surface: 'shop' }, problem).status, 'open');
  assert.equal(report.classifyDifference({ ...observation, taskChecks: [] }, problem).status, 'open');
  assert.equal(report.classifyDifference(observation, { ...problem, severity: 'high' }).status, 'open');
  assert.equal(report.classifyDifference(observation, { ...problem, target: { role: 'button' } }).status, 'open');
  for (const change of [{ labelWithinWindow: false }, { visibleHitWidth: 20 }, { hasEnabledScrollButton: false }, { scrollWidth: 200 }]) {
    assert.equal(report.classifyDifference(observation, { ...problem, tabScrollWindow: { ...problem.tabScrollWindow, ...change } }).status, 'open');
  }
});
test('clipping is compared with the same named control across routes, not the first clipped control', () => {
  const identity = { role: 'tab', name: 'event', tablistIndex: 1 };
  const problem = { role: 'control', selector: '#event', property: 'clippedByAncestor', observed: 12, target: identity, severity: 'high' };
  const measurement = (clipping, extra = []) => ({ state: 'default', position: 'top', screenshot: 'example.png', viewport: { width: 320, height: 844 },
    heading: { selector: '#heading', fontSize: 24, box: { top: 0 } }, shell: { box: { top: 0 } }, samples: [], problems: [problem],
    controlTargets: [{ identity, clippingPixels: clipping }, ...extra] });
  const run = (surface, clipping, extra) => ({ directory: '/unused', report: { palette: 'dark', cases: [{ name: surface, route: `/x/${surface}`,
    status: 'captured-baseline-not-accepted', viewport: { width: 320 }, measurements: [measurement(clipping, extra)] }] } });
  const inventory = [['learn-games', '/x/learn-games'], ['shop', '/x/shop']].map(([surface, route]) => ({ id: `${surface}.default`, surface, state: 'default', route }));
  const findings = report.buildReport(inventory, [run('learn-games', 12), run('shop', 5, [{ identity: { role: 'button', name: 'other' }, clippingPixels: 90 }])]).findings;
  const clipping = findings.find(finding => finding.property === 'clippedByAncestor');
  assert.equal(clipping.surface, 'learn-games');
  assert.equal(clipping.observed, 12);
  assert.equal(clipping.peerMedian, 8.5);
  assert.ok(!('masterValue' in clipping) && !('masterStatus' in clipping));
});
test('title offset is graded within a header variant and ignored without a shared header', () => {
  const run = (surface, variant, top) => ({ directory: '/unused', report: { palette: 'dark', cases: [{
    name: surface, route: `/x/${surface}`, status: 'captured-baseline-not-accepted', viewport: { width: 1440 },
    measurements: [{ state: 'default', position: 'top', screenshot: `${surface}.png`, viewport: { width: 1440, height: 900 },
      headerVariant: variant, pageShell: surface !== 'thread', heading: { selector: '#title', fontSize: 32, box: { top } }, shell: { box: { top: 0 } },
      samples: [], controlTargets: [], problems: [] }] }] } });
  const inventory = ['standard-a', 'standard-b', 'forum-a', 'thread']
    .map(surface => ({ id: `${surface}.default`, surface, state: 'default', route: `/x/${surface}` }));
  const runs = [run('standard-a', 'standard', 0), run('standard-b', 'standard', 60),
    run('forum-a', 'forum', 60), run('thread', null, 300)];
  const report0 = report.buildReport(inventory, runs);
  const offsets = report0.findings.filter(finding => finding.property === 'headingTopOffset').map(finding => finding.surface).sort();
  assert.deepEqual(offsets, ['standard-a', 'standard-b']);
});
