const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const masterEquivalents = require('./master-equivalents.json');
const intentionalDifferences = require('./intentional-differences.json');

function classifyDifference(observation, problem, masterValue) {
  const rule = intentionalDifferences.find(rule => rule.surfaces.includes(observation.surface) && rule.property === problem.property);
  const window = problem.tabScrollWindow;
  if (!rule || problem.severity !== 'medium' || !Number.isFinite(masterValue) || problem.target?.role !== 'tab' || !window ||
    !observation.taskChecks?.includes(rule.requiredTaskCheck) || !window.hasEnabledScrollButton ||
    !(window.scrollWidth > window.clientWidth + 2) ||
    (window.selected && (!window.labelWithinWindow || window.visibleHitWidth < 43))) return { status: 'open' };
  return { status: 'intentional', reviewRule: rule.id, reviewReason: rule.reason };
}

const widths = [1440, 390, 320];
const palettes = ['dark', 'light'];
const taskStates = {
  host: ['host-dialog'], 'forum-thread': ['reply'],
  'setup-detail': ['statistics', 'night', 'version'],
  stocks: ['trade-dialog', 'trade-error'], rankings: ['rating-details'],
  'profile-rich': ['games', 'collection', 'statistics'], 'profile-custom': ['games', 'collection', 'statistics'],
  'family-leader': ['bio-editor', 'remove-confirmation', 'role-confirmation'],
  feedback: ['submission-error'], 'admin-intake': ['approve-confirmation', 'ban-confirmation'],
  contributors: ['bio-editor'], donors: ['bio-editor'],
  'donors-management': ['assign-dialog', 'remove-confirmation'],
  developer: ['revoke-confirmation', 'revoke-pending', 'revoke-error', 'create-pending', 'create-error', 'loading', 'read-error', 'empty'],
  'developer-owner': ['revoke-confirmation', 'revoke-pending', 'revoke-error', 'create-pending', 'create-error', 'loading', 'read-error', 'empty'],
  invoices: ['approve-confirmation', 'reject-confirmation', 'review-pending', 'review-error', 'loading', 'read-error', 'empty'],
  rules: ['appeal', 'other-policies', 'loading', 'read-error', 'empty'],
  'learn-games': ['roles-mafia', 'roles-cult', 'roles-independent', 'roles-event', 'roles-search', 'roles-empty', 'modifiers', 'modifiers-visits', 'modifiers-appearance', 'modifiers-chat', 'modifiers-other', 'items', 'mechanics', 'mechanics-voting', 'mechanics-timer', 'mechanics-other', 'achievements'],
};
function inventoryFromSource(source) {
  const literal = source.match(/export const routeCases = (\[[\s\S]*?\n\]);/);
  if (!literal) throw new Error('Cannot locate route registry; refusing an empty coverage matrix');
  // Local, version-controlled literal only. No imports, services or credentials.
  const routes = vm.runInNewContext(`(${literal[1]})`, Object.create(null), { timeout: 1000 });
  return routes.flatMap(route => ['default', ...(taskStates[route.name] || [])].map(state => {
    const equivalent = masterEquivalents[`${route.name}.${state}`] || masterEquivalents[route.name];
    return ({
    id: `${route.name}.${state}`, surface: route.name, route: route.route, mode: route.mode || 'member', state,
    data: 'controlled-production-component-fixture', master: { status: 'required',
      equivalence: equivalent?.equivalence || 'same-route',
      route: equivalent?.route || route.route,
      reason: equivalent?.reason || 'Actual upstream route/state pairing is required; absence of a capture is not an exemption' },
    });
  }));
}
const median = values => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const mostCommon = values => {
  const counts = new Map();
  for (const value of values.filter(value => value != null)) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
};
function compareRoles(observations) {
  const properties = {
    fontSize: value => value.fontSize,
    fontWeight: value => Number(value.fontWeight),
    lineHeight: value => parseFloat(value.lineHeight),
    height: value => value.box?.height,
    padding: value => value.padding,
    background: value => value.background,
    color: value => value.color,
    border: value => value.border,
    radius: value => value.radius,
  };
  const baseline = observations.filter(value => value.state === 'default' && value.measurement.position === 'top');
  return observations.filter(value => value.branch === 'redesign' && value.measurement.position !== 'bottom').flatMap(observation => {
    const roles = [...new Set((observation.measurement.samples || []).map(sample => sample.role))];
    return roles.flatMap(role => Object.entries(properties).flatMap(([property, read]) => {
      const own = (observation.measurement.samples || []).filter(sample => sample.role === role);
      const groups = new Map();
      for (const sample of own) {
        const value = read(sample);
        if (value == null || typeof value === 'number' && !Number.isFinite(value)) continue;
        if (!groups.has(value)) groups.set(value, []);
        groups.get(value).push(sample.selector);
      }
      const master = observations.find(peer => peer.branch === 'master' && peer.surface === observation.surface && peer.state === observation.state && peer.width === observation.width && peer.palette === observation.palette && peer.measurement.position === observation.measurement.position);
      const masterValues = (master?.measurement.samples || []).filter(sample => sample.role === role).map(read).filter(value => value != null && (typeof value !== 'number' || Number.isFinite(value)));
      return [...groups].map(([observed, selectors]) => {
        const numeric = typeof observed === 'number';
        // Each route contributes once, so 443 role rows cannot outweigh another
        // page's single field when computing the cross-page reference value.
        const peers = baseline.filter(peer => peer.branch === 'redesign' && peer.surface !== observation.surface && peer.width === observation.width && peer.palette === observation.palette).map(peer => {
          const values = (peer.measurement.samples || []).filter(sample => sample.role === role).map(read);
          return numeric ? median(values) : mostCommon(values);
        }).filter(value => value != null);
        const peerValue = numeric ? median(peers) : mostCommon(peers);
        const masterValue = numeric ? median(masterValues) : mostCommon(masterValues);
        return { surface: observation.surface, route: observation.route, state: observation.state, width: observation.width, palette: observation.palette, role, property, selectors, observed,
          peerMedian: numeric ? peerValue : null, peerValue, delta: numeric && peerValue !== null ? observed - peerValue : null,
          masterValue, masterDelta: numeric && masterValue !== null ? observed - masterValue : null,
          masterStatus: !master ? 'unverified' : master.masterEquivalent?.equivalence === 'nearest-ancestor' ? 'not-on-master' : masterValue === null ? 'role-not-on-master' : masterValues.every(value => value === observed) ? 'same' : 'changed',
          masterRoute: master?.captureRoute || null, masterReason: master?.masterEquivalent?.reason || null,
          screenshot: observation.screenshot, status: 'requires-review' };
      });
    }));
  });
}
function buildReport(inventory, runs) {
  const observations = [];
  for (const run of runs) for (const item of run.report.cases) {
    if (item.status !== 'captured-baseline-not-accepted' || item.staticFailures?.length || item.fixture?.unresolved?.length || item.runtimeErrors?.length) continue;
    for (const measurement of item.measurements || []) observations.push({
      branch: run.branch, surface: item.name, route: item.route, state: measurement.state,
      width: item.viewport.width, palette: run.report.palette, sourceRevision: run.report.sourceRevision,
      trackedSourceDirty: run.report.trackedSourceDirty,
      taskChecks: item.taskChecks || [],
      captureRoute: item.captureRoute || item.route, masterEquivalent: measurement.masterEquivalent || item.masterEquivalent,
      screenshot: path.join(run.directory, measurement.screenshot), measurement,
    });
  }
  const coverage = inventory.flatMap(item => widths.flatMap(width => palettes.map(palette => {
    const matching = observations.filter(value => value.surface === item.surface && value.state === item.state && value.width === width && value.palette === palette);
    const redesign = matching.filter(value => value.branch === 'redesign');
    const master = matching.filter(value => value.branch === 'master');
    return { id: `${item.id}.${width}.${palette}`, ...item, width, palette, masterComparison: item.master,
      redesign: redesign.map(value => value.screenshot), master: master.map(value => value.screenshot),
      status: !redesign.length ? 'missing-redesign' : !master.length ? 'missing-master' : 'paired',
    };
  })));
  const findings = [];
  const compare = (observation, role, selector, property, observed, severity, problem = {}) => {
    const peerValues = observations.filter(peer => peer.branch === 'redesign' && peer.width === observation.width && peer.palette === observation.palette && peer.measurement.position === 'top' && peer.state === 'default')
      .map(peer => property === 'headingFontSize' ? peer.measurement.heading?.fontSize : property === 'headingTopOffset' ? peer.measurement.heading?.box.top - peer.measurement.shell?.box.top : property === 'clippedByAncestor' && problem.target ? median((peer.measurement.controlTargets || []).filter(target => target.identity.role === problem.target.role).map(target => target.clippingPixels)) : null);
    const peerMedian = median(peerValues);
    const master = observations.find(peer => peer.branch === 'master' && peer.surface === observation.surface && peer.state === observation.state && peer.width === observation.width && peer.palette === observation.palette && peer.measurement.position === observation.measurement.position);
    const masterTargets = property === 'clippedByAncestor' && problem.target ? (master?.measurement.controlTargets || []).filter(target => JSON.stringify(target.identity) === JSON.stringify(problem.target)) : [];
    // Match the actual control, not the first unrelated clipped control anywhere
    // on the master route. Missing/ambiguous target evidence is not a zero.
    const masterValue = (property === 'clippedByAncestor' ? masterTargets.length === 1 ? masterTargets[0].clippingPixels : null : master ? (property === 'headingFontSize' ? master.measurement.heading?.fontSize : property === 'headingTopOffset' ? master.measurement.heading?.box.top - master.measurement.shell?.box.top : master.measurement.problems.find(value => value.property === property)?.observed ?? 0) : null) ?? null;
    const classification = classifyDifference(observation, { ...problem, property, severity }, masterValue);
    findings.push({ id: `UI-${String(findings.length + 1).padStart(5, '0')}`, surface: observation.surface, route: observation.route, state: observation.state, viewport: observation.measurement.viewport, palette: observation.palette,
      role, selector, property, observed, peerMedian, delta: typeof observed === 'number' && peerMedian !== null ? observed - peerMedian : null,
      severity, screenshot: observation.screenshot, masterValue, masterDelta: typeof observed === 'number' && typeof masterValue === 'number' ? observed - masterValue : null,
      masterStatus: !master ? 'unverified' : master.masterEquivalent?.equivalence === 'nearest-ancestor' ? 'not-on-master' : property === 'clippedByAncestor' && masterTargets.length !== 1 ? masterTargets.length ? 'ambiguous-target' : 'unverified-target' : JSON.stringify(observed) === JSON.stringify(masterValue) ? 'same' : 'changed',
      masterRoute: master?.captureRoute || null, masterReason: master?.masterEquivalent?.reason || null, ...classification, ...problem });
  };
  for (const observation of observations.filter(value => value.branch === 'redesign')) {
    for (const problem of observation.measurement.problems) compare(observation, problem.role, problem.selector, problem.property, problem.observed, problem.severity, { container: problem.container, observedBox: problem.observedBox, target: problem.target, tabScrollWindow: problem.tabScrollWindow });
    if (observation.state !== 'default' || observation.measurement.position !== 'top') continue;
    const heading = observation.measurement.heading;
    if (!heading) compare(observation, 'pageHeader', '#main-content', 'missingHeading', null, 'medium');
    else {
      const peers = observations.filter(peer => peer.branch === 'redesign' && peer.width === observation.width && peer.palette === observation.palette && peer.state === 'default' && peer.measurement.position === 'top');
      const sizeMedian = median(peers.map(peer => peer.measurement.heading?.fontSize));
      const offset = heading.box.top - observation.measurement.shell.box.top;
      const offsetMedian = median(peers.map(peer => peer.measurement.heading ? peer.measurement.heading.box.top - peer.measurement.shell.box.top : null));
      if (sizeMedian !== null && Math.abs(heading.fontSize - sizeMedian) > 1) compare(observation, 'pageHeader', heading.selector, 'headingFontSize', heading.fontSize, 'medium');
      if (offsetMedian !== null && Math.abs(offset - offsetMedian) > 8) compare(observation, 'pageHeader', heading.selector, 'headingTopOffset', offset, 'medium');
    }
  }
  return { coverage, findings, observations, roleComparisons: compareRoles(observations), summary: { required: coverage.length, redesignCaptured: coverage.filter(cell => cell.redesign.length).length, masterCaptured: coverage.filter(cell => cell.master.length).length, paired: coverage.filter(cell => cell.status === 'paired').length, gaps: coverage.filter(cell => cell.status !== 'paired').length, totalFindings: findings.length, intentionalFindings: findings.filter(finding => finding.status === 'intentional').length, openFindings: findings.filter(finding => finding.status === 'open').length, visualAcceptance: false } };
}
function writeReport(output, inventory, runs) {
  fs.mkdirSync(output, { recursive: true });
  const result = buildReport(inventory, runs);
  const stringify = value => JSON.stringify(value, null, 2) + '\n';
  for (const [name, value] of Object.entries({ inventory, coverage: { summary: result.summary, cells: result.coverage }, findings: result.findings, measurements: result.observations, 'role-comparisons': result.roleComparisons })) fs.writeFileSync(path.join(output, `${name}.json`), stringify(value));
  fs.writeFileSync(path.join(output, 'intentional-differences.json'), stringify(intentionalDifferences));
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const relative = filename => path.relative(output, filename).split(path.sep).join('/');
  const images = [...new Set(result.observations.map(value => value.screenshot))].filter(filename => fs.existsSync(filename));
  fs.writeFileSync(path.join(output, 'capture-manifest.json'), stringify(images.map(filename => ({ file: relative(filename), sha256: crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex') }))));
  const rows = result.findings.map(finding => `<tr>
    <td>${escape(finding.surface)} ${finding.viewport.width} ${escape(finding.palette)}</td>
    <td>${escape(finding.property)}</td>
    <td><code>${escape(JSON.stringify(finding.observed))} / ${escape(finding.peerMedian)} / ${escape(finding.masterValue)}</code></td>
    <td>${escape(finding.status)}${finding.reviewReason ? `<p>${escape(finding.reviewRule)}: ${escape(finding.reviewReason)}</p>` : ''}</td>
    <td><a href="${escape(relative(finding.screenshot))}">Screenshot</a></td></tr>`).join('');
  fs.writeFileSync(path.join(output, 'report.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>UltiMafia comparative UI audit</title>
    <style>body{font:16px system-ui;max-width:1200px;margin:24px auto;padding:16px}table{border-collapse:collapse;width:100%}td,th{padding:8px;text-align:left;border-bottom:1px solid #888}code{overflow-wrap:anywhere}</style>
    <h1>Comparative UI audit</h1><p>Controlled fixtures; not authenticated journeys or visual acceptance. Missing master evidence is a gap, never an exemption. Intentional findings remain visible with their review rule and reason.</p>
    <pre>${escape(stringify(result.summary))}</pre><h2>Findings</h2><table><tr><th>Surface</th><th>Property</th><th>Observed / peer / master</th><th>Status / reason</th><th>Evidence</th></tr>${rows}</table>
    <h2>Coverage gaps</h2><ul>${result.coverage.filter(cell => cell.status !== 'paired').map(cell => `<li>${escape(cell.id)}: ${escape(cell.status)}</li>`).join('')}</ul></html>`);
  return result.summary;
}
module.exports = { inventoryFromSource, median, compareRoles, classifyDifference, buildReport, writeReport };
