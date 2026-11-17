import test from 'node:test';
import assert from 'node:assert/strict';
import layout from '../scripts/check-ui-layout-changes.cjs';

test('new hard-coded CSS widths and navigation paths fail without expanding an exception file', () => {
  const previous = layout.layoutSignatures('.old {max-width:760px}', 'page.css');
  assert.deepEqual(layout.newLayoutPatterns(previous, previous), []);
  assert.equal(layout.newLayoutPatterns(layout.layoutSignatures('.new {max-width:760px}', 'page.css'), previous).length, 1);
  assert.equal(layout.layoutSignatures('.new-section-nav {display:flex}', 'page.css').length, 1);
  assert.deepEqual(layout.layoutSignatures('.list {width:100%;min-width:0;max-width:none}', 'page.css'), []);
});
test('JSX one-off nav and literal/computed widths cannot bypass the shared path', () => {
  assert.equal(layout.layoutSignatures('const a=<nav aria-label="Sections"/>;', 'x.jsx').length, 1);
  assert.equal(layout.layoutSignatures('const a=<Box component="nav"/>;', 'x.jsx').length, 1);
  assert.equal(layout.layoutSignatures('const a=<Box sx={{maxWidth:760}}/>;', 'x.jsx').length, 1);
  assert.equal(layout.layoutSignatures('const a=<Box sx={{width:available/2}}/>;', 'x.jsx').length, 1);
  assert.deepEqual(layout.layoutSignatures('const a=<UiPage width="wide"/>;', 'x.jsx'), []);
});
