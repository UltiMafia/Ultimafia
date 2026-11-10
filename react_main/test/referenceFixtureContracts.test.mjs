import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parse } = require('@babel/parser');

test('actual-master bootstrap receives the same populated public reference contracts', () => {
  const source = fs.readFileSync(new URL('./ui-audit/master.browser.jsx', import.meta.url), 'utf8');
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const bootstrap = ast.program.body.flatMap(node => node.declarations || []).find(node => node.id.name === 'bootstrap').init;
  const contracts = {
    '/api/roles/all': 'roles', '/api/roles/raw': 'rolesRaw',
    '/api/roles/modifiers': 'modifiers', '/api/roles/gamesettings': 'gamesettings',
    '/api/roles/roletags': 'tags', '/api/roles/descriptions': 'learnGameDescriptionByType',
    '/api/achievements': 'achievementsRaw', '/api/items': 'items',
  };
  for (const [endpoint, property] of Object.entries(contracts)) {
    const value = bootstrap.properties.find(entry => entry.key.value === endpoint)?.value;
    assert.equal(value?.type, 'MemberExpression', `${endpoint} must not silently become an empty demonstration list`);
    assert.equal(value.object.name, 'site');
    assert.equal(value.property.name, property);
  }
});
