// Numeric grading stays separate from browser collection so every detector can
// be tested without producing screenshots or importing application components.
const tolerance = 8;
function fillProblems(target) {
  // Unmeasurable candidates are coverage, not defects: they are counted in
  // fillCoverage and written to measurement-coverage.json. Reporting them as
  // findings buried real shortfalls under hundreds of "could not measure" rows.
  if (target.status !== 'measured' || !target.allocation || !Number.isFinite(target.box?.right)) return [];
  if (target.intrinsic) return [];
  const gap = target.allocation.right - target.box.right;
  const leftGap = target.box.left - target.allocation.left;
  const evidence = target.evidence || [];
  if (gap <= tolerance || !(target.declaredFullWidth || evidence.length)) return [];
  return [{ property: target.declaredFullWidth ? 'declaredFullWidthShortfall' : 'contentEdgeShortfall',
    observed: gap, severity: 'medium', leftGap, tolerance, evidence,
    observedBox: target.box, container: target.allocation, target: target.identity }];
}
function matchFillTarget(target, candidates) {
  if (!target.identity?.name) return { target: null, status: 'unverified-target', reason: 'Unnamed structural target requires an explicit master pairing' };
  const key = JSON.stringify(target.identity);
  const matches = candidates.filter(candidate => JSON.stringify(candidate.identity) === key);
  return { target: matches.length === 1 ? matches[0] : null,
    status: matches.length === 1 ? 'matched' : matches.length ? 'ambiguous-target' : 'unverified-target' };
}
function widthRegression(target, master) {
  if (target.status !== 'measured' || master?.status !== 'measured' || target.intrinsic || !target.allocation?.width || !master.allocation?.width) return null;
  const ratio = target.box.width / target.allocation.width;
  const masterRatio = master.box.width / master.allocation.width;
  const loss = masterRatio - ratio;
  return loss > 0.03 && masterRatio >= 0.95 ? {
    property: 'pairedFillWidthRegression', observed: ratio, masterValue: masterRatio,
    masterDelta: ratio - masterRatio, severity: 'medium', tolerance: 0.03,
    observedBox: target.box, container: target.allocation, masterBox: master.box,
    masterContainer: master.allocation, target: target.identity,
  } : null;
}
function navigationProblems(item, viewport) {
  const problems = [];
  if (viewport.width > 700 || item.status !== 'measured') return problems;
  // Breadcrumb trails keep the minimum target size; section menus keep the full one.
  const minimum = item.kind === 'breadcrumb' ? 24 : 44;
  if (item.box.width < minimum - 1 || item.box.height < minimum - 1) problems.push({ property: 'navigationTouchTarget', observed: { width: item.box.width, height: item.box.height }, minimum, tolerance: 1, severity: 'medium' });
  if (item.active && !item.labelWithinWindow) problems.push({ property: 'activeNavigationItemClipped', observed: item.labelBounds, container: item.window, severity: 'high' });
  if (item.lineCount > (item.kind === 'tab' ? 1 : 2) || item.singleCharacterLine) problems.push({ property: 'navigationLabelWrapping', observed: { lines: item.lineCount, singleCharacterLine: item.singleCharacterLine }, maximumLines: item.kind === 'tab' ? 1 : 2, severity: 'medium' });
  if (item.occludingBars?.length) problems.push({ property: 'navigationCoveredByFixedBar', observed: item.occludingBars, observedBox: item.box, severity: 'high' });
  return problems;
}
function navigationMetric(item, property) {
  if (!item || item.status !== 'measured') return null;
  if (property === 'navigationTouchTarget') return { width: item.box.width, height: item.box.height };
  if (property === 'activeNavigationItemClipped') return item.labelWithinWindow;
  if (property === 'navigationLabelWrapping') return { lines: item.lineCount, singleCharacterLine: item.singleCharacterLine };
  if (property === 'navigationCoveredByFixedBar') return item.occludingBars;
  return null;
}
const roleReviewRules = {
  numeric: { fontSize: 1, fontWeight: 1, lineHeight: 1, height: 2, width: 8, fillRatio: 0.03 },
  intrinsicRoles: ['primaryAction', 'secondaryAction', 'utilityIcon', 'currency', 'tab', 'sectionNavItem', 'sectionHeading', 'tableHeader'],
  // A container's height and width follow its content. Comparing them across
  // pages grades content, not presentation, so these are recorded but not graded.
  contentSizedRoles: ['sectionContainer', 'sectionHeading', 'card', 'comment', 'commentList', 'declaredFill', 'emptyState', 'stat', 'sectionNav', 'tableHeader'],
  // Form controls fill the column their layout gives them. Width is a property of
  // the form grid, not of the control; height and surface treatment stay graded.
  layoutSizedRoles: ['textInput', 'select'],
};
function gradeRoleComparison(comparison) {
  const peer = comparison.peerValue;
  if (peer == null || comparison.observed === peer) return null;
  if (['fontSize', 'fontWeight', 'lineHeight'].includes(comparison.property) && ['currency', 'utilityIcon'].includes(comparison.role)) return {
    status: 'not-graded', reviewRule: 'icon-inherited-typography',
    reviewReason: 'An icon contains no text; typography properties are inherited from surrounding content.',
  };
  if ((roleReviewRules.contentSizedRoles.includes(comparison.role) || (comparison.role === 'textInput' && (comparison.variant?.includes('multiline') || comparison.variant?.includes('editor')))) && ['height', 'width', 'fillRatio'].includes(comparison.property)) return {
    status: 'not-graded', reviewRule: 'content-dependent-size',
    reviewReason: 'Container size follows its content; fill and alignment are graded by the allocation contracts instead.',
  };
  const numeric = typeof comparison.observed === 'number';
  if (numeric && Math.abs(comparison.observed - peer) <= (roleReviewRules.numeric[comparison.property] ?? 0)) return null;
  // Intrinsic controls are sized by their label or icon. Their width and fill
  // ratio are not contracts; height, typography and surface treatment still are.
  if (['width', 'fillRatio'].includes(comparison.property) && roleReviewRules.layoutSizedRoles.includes(comparison.role)) return {
    status: 'not-graded', reviewRule: 'layout-sized-control',
    reviewReason: 'A field fills the column its form layout gives it; control height, typography and surface treatment remain graded.',
  };
  if (['width', 'fillRatio'].includes(comparison.property) && roleReviewRules.intrinsicRoles.includes(comparison.role)) return {
    status: 'intentional', severity: 'low', reviewRule: 'intrinsic-role-width',
    reviewReason: 'Label/icon-sized controls have intrinsic width; touch-target, label-visibility and allocation/fill contracts are graded separately.',
  };
  return { status: 'open', severity: comparison.property === 'height' && ['card', 'comment', 'emptyState'].includes(comparison.role) ? 'low' : 'medium',
    reviewRule: 'cross-page-shared-role-divergence',
    reviewReason: 'Same-role, same-state presentation differs from the cross-route reference. Requires a named variant or an evidenced review rule; master values remain explicit.' };
}
module.exports = { fillProblems, matchFillTarget, widthRegression, navigationProblems, navigationMetric, gradeRoleComparison, roleReviewRules };
