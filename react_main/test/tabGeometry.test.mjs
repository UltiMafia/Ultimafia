import test from 'node:test';
import assert from 'node:assert/strict';
import { selectedTabScrollDelta } from '../src/components/ui/tabGeometry.js';

test('selected tabs are brought inside a resized strip, not an old pre-arrow viewport', () => {
  assert.equal(selectedTabScrollDelta(52, 338, 296, 418), 80);
  assert.equal(selectedTabScrollDelta(52, 268, 226, 348), 80);
  assert.equal(selectedTabScrollDelta(52, 268, -28, 62), -80);
});
test('visible tabs need no adjustment and oversized tabs align their start', () => {
  assert.equal(selectedTabScrollDelta(52, 338, 216, 338), 0);
  assert.equal(selectedTabScrollDelta(52, 338, 52, 142), 0);
  assert.equal(selectedTabScrollDelta(52, 338, 100, 500), 48);
  assert.equal(selectedTabScrollDelta(52, 52, 100, 200), 0);
  assert.equal(selectedTabScrollDelta(52, 338, 100, 100), 0);
});
