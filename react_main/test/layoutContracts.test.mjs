import test from 'node:test';
import assert from 'node:assert/strict';
import contracts from './ui-audit/layout-contracts.cjs';
const target = (width = 760) => ({ identity: { role: 'comment', name: 'comment-1' }, status: 'measured',
  box: { left: 0, right: width, width, height: 80 }, allocation: { left: 0, right: 870, width: 870 }, evidence: ['section-divider'] });
test('fill detectors catch narrow blocks even though they have no clipping or overflow', () => {
  const problem = contracts.fillProblems(target())[0];
  assert.equal(problem.property, 'contentEdgeShortfall'); assert.equal(problem.observed, 110);
  assert.equal(contracts.fillProblems({ ...target(), declaredFullWidth: true, evidence: [] })[0].property, 'declaredFullWidthShortfall');
  assert.deepEqual(contracts.fillProblems(target(870)), []);
  assert.deepEqual(contracts.fillProblems({ ...target(), intrinsic: true }), []);
});
test('unmeasurable blocks and missing master targets stay explicit, never become zero', () => {
  assert.deepEqual(contracts.fillProblems({ status: 'unmeasurable', reason: 'flex-row allocation unknown' }), []);
  assert.deepEqual(contracts.fillProblems({ status: 'unmeasurable', reason: 'flex-row allocation unknown', declaredFullWidth: true }), []);
  assert.equal(contracts.matchFillTarget(target(), []).status, 'unverified-target');
  assert.equal(contracts.matchFillTarget(target(), [target(), target()]).status, 'ambiguous-target');
  assert.equal(contracts.widthRegression(target(), null), null);
});
test('paired fill regression uses allocated-space ratios, not unrelated master widths', () => {
  const comparison = contracts.widthRegression(target(), target(870));
  assert.equal(comparison.property, 'pairedFillWidthRegression');
  assert.ok(comparison.masterDelta < -0.12);
  assert.equal(contracts.widthRegression(target(870), { ...target(760), allocation: { width: 760 } }), null);
});
test('phone navigation contracts measure touch size, active label, wrapping and fixed bars', () => {
  const item = { status: 'measured', box: { width: 80, height: 32 }, active: true, labelWithinWindow: false,
    kind: 'tab', lineCount: 3, occludingBars: [{ selector: '.bottom-bar' }] };
  assert.deepEqual(contracts.navigationProblems(item, { width: 390 }).map(p => p.property), [
    'navigationTouchTarget', 'activeNavigationItemClipped', 'navigationLabelWrapping', 'navigationCoveredByFixedBar']);
  assert.deepEqual(contracts.navigationProblems(item, { width: 1440 }), []);
});
test('cross-page divergence is graded; intrinsic width never excuses small touch targets', () => {
  assert.equal(contracts.gradeRoleComparison({ role: 'sectionNavItem', property: 'height', observed: 32, peerValue: 44 }).status, 'open');
  assert.equal(contracts.gradeRoleComparison({ role: 'secondaryAction', property: 'width', observed: 80, peerValue: 120 }).reviewRule, 'intrinsic-role-width');
  assert.equal(contracts.gradeRoleComparison({ role: 'card', property: 'width', observed: 760, peerValue: 870 }).status, 'not-graded');
  assert.equal(contracts.gradeRoleComparison({ role: 'card', property: 'padding', observed: '8px', peerValue: '16px' }).status, 'open');
  assert.equal(contracts.gradeRoleComparison({ role: 'currency', property: 'fontWeight', observed: 700, peerValue: 400 }).status, 'not-graded');
  assert.equal(contracts.gradeRoleComparison({ role: 'utilityIcon', property: 'fontSize', observed: 16, peerValue: 24 }).status, 'not-graded');
});
