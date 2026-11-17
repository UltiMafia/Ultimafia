import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Read the policy literals, never import the database-bearing payment module.
const paymentSource = fs.readFileSync(new URL('../../modules/cryptoPayments.js', import.meta.url), 'utf8');
const fixtureSource = fs.readFileSync(new URL('./routeReviewData.jsx', import.meta.url), 'utf8');
const array = (source, name) => {
  const match = source.match(new RegExp(`const ${name} = (\\[[^;]+\\]);`));
  assert.ok(match, `${name}: explicit status contract must remain discoverable`);
  return JSON.parse(match[1]);
};

test('invoice fixtures preserve server approval/rejection eligibility without accessing payments', () => {
  assert.deepEqual(array(fixtureSource, 'invoiceApproveStatuses'), array(paymentSource, 'APPROVE_STATUSES'));
  assert.deepEqual(array(fixtureSource, 'invoiceRejectStatuses'), array(paymentSource, 'REJECT_STATUSES'));
  assert.deepEqual(array(paymentSource, 'UNPAID_STATUSES'), array(fixtureSource, 'invoiceApproveStatuses'));
});
