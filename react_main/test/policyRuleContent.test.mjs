import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const { parse } = createRequire(import.meta.url)('@babel/parser');

test('policy presentation migrations preserve the approved rule wording', () => {
  const source = fs.readFileSync(new URL('../src/pages/Policy/Rules.jsx', import.meta.url), 'utf8');
  const declaration = parse(source, { sourceType: 'module', plugins: ['jsx'] }).program.body.flatMap(node => node.declarations || []).find(node => node.id.name === 'RULES_SECTIONS');
  assert.equal(declaration.init.type, 'ArrayExpression');
  const sections = vm.runInNewContext(`(${source.slice(declaration.init.start, declaration.init.end)})`, Object.create(null), { timeout: 1000 });
  // Canonical data, not formatting. Update only for an explicitly reviewed policy
  // wording change, never to accommodate a layout migration.
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(sections)).digest('hex'), '84553fdf4993291a6d91965723e2c8790ebf9e2f1f408d299524af3d00c641c2');
});
