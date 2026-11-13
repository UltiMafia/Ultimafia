import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('..', import.meta.url));
test('interim audit refuses an unscoped full-site capture before building', () => {
  const result = spawnSync(process.execPath, ['test/run-ui-audit.cjs'], {
    cwd, encoding: 'utf8', env: { ...process.env, ROUTE_CASES: '', UI_AUDIT_FINAL: '0', UI_AUDIT_CAPTURE_LIMIT: '120' },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Interim audits require ROUTE_CASES/);
  assert.doesNotMatch(result.stdout, /build started/);
});
test('slice evidence budget must be a positive bounded integer', () => {
  for (const value of ['0', '-1', 'NaN', '1.5']) {
    const result = spawnSync(process.execPath, ['test/run-ui-audit.cjs'], {
      cwd, encoding: 'utf8', env: { ...process.env, ROUTE_CASES: 'create-setup', UI_AUDIT_FINAL: '0', UI_AUDIT_CAPTURE_LIMIT: value },
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /UI_AUDIT_CAPTURE_LIMIT must be a positive integer/);
    assert.doesNotMatch(result.stdout, /build started/);
  }
});
