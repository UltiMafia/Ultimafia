// Production administrative presentation, with in-memory failed writes only.
// Never create credentials, credit an invoice, or forward a request to a service.
const assert = require('node:assert/strict');

async function reviewAdminTasks(page, item, captureImage, { master = false, evidence = [] } = {}) {
  if (!['developer', 'developer-owner', 'invoices'].includes(item.name)) return [];
  const invoices = item.name === 'invoices';
  const primaryRead = invoices ? '/api/crypto/admin/invoices' : item.name === 'developer-owner' ? '/api/dev/owner/keys' : '/api/dev/keys';
  const table = page.getByRole('table', { name: invoices ? 'Donation invoices' : 'Developer API keys', exact: true });
  const settle = () => page.waitForFunction(() => window.__routeReview.pending === 0 && performance.now() - window.__routeReview.lastRequestAt > 400);
  const capture = async state => {
    await page.mouse.move(0, 0);
    await captureImage(state);
    const snapshot = await page.evaluate(() => ({ requests: window.__routeReview.requests, writes: window.__routeReview.writes, pending: window.__routeReview.pending, simulatedAdminFailures: window.__routeReview.simulatedAdminFailures || 0, unresolved: window.__routeReview.unresolved, errors: window.__routeReview.errors }));
    assert.deepEqual(snapshot.unresolved, [], `${state}: no unresolved contracts before navigating away`);
    assert.deepEqual(snapshot.errors, [], `${state}: no fixture errors before navigating away`);
    evidence.push({ state, ...snapshot });
  };
  const failedWrite = async (pathname, click, checkPending, checkError, pendingState, errorState) => {
    await page.evaluate(pathname => { window.__routeReview.adminFailurePath = pathname; }, pathname);
    await click();
    await page.waitForFunction(() => typeof window.__routeReview.releaseAdminFailure === 'function');
    await checkPending();
    await capture(pendingState);
    await page.evaluate(() => window.__routeReview.releaseAdminFailure());
    await settle();
    await checkError();
    await capture(errorState);
    assert.equal(await page.evaluate(pathname => window.__routeReview.writes.filter(write => write.url === pathname).length, pathname), 1, 'one failed in-memory submission; no duplicate');
  };
  if (!master) {
    await table.waitFor();
    const geometry = await table.evaluate(element => {
      const box = element.getBoundingClientRect();
      return { overflow: element.scrollWidth > element.clientWidth + 1, outside: [...element.querySelectorAll('.ui-table-value')].filter(value => {
        const bounds = value.getBoundingClientRect();
        return bounds.left < box.left - 1 || bounds.right > box.right + 1 || value.scrollWidth > value.clientWidth + 1;
      }).length };
    });
    assert.deepEqual(geometry, { overflow: false, outside: 0 }, 'all labels/values/actions fit the same table on desktop and phones');
    const noMutations = async () => assert.equal(await page.evaluate(() => window.__routeReview.writes.filter(write => write.type === 'axios' && write.url !== '/api/notifs/read').length), 0);
    const validateDialog = async dialog => {
      const bounds = await dialog.evaluate(element => {
        const box = element.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: innerWidth, height: innerHeight };
      });
      assert(bounds.left >= 0 && bounds.right <= bounds.width && bounds.top >= 0 && bounds.bottom <= bounds.height, 'dialog stays inside the viewport');
    };
    if (!invoices) {
      const open = () => table.getByRole('button', { name: 'Revoke', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Revoke key', exact: true });
      await open(); await dialog.waitFor(); await validateDialog(dialog); await capture('revoke-confirmation');
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' }); await noMutations();
      await open(); await dialog.waitFor();
      await failedWrite('/api/dev/keys/fixture-client-1/revoke', () => dialog.getByRole('button', { name: 'Revoke key', exact: true }).click(), async () => {
        assert(await dialog.getByRole('button', { name: 'Cancel', exact: true }).isDisabled());
        assert(await dialog.getByRole('button', { name: 'Revoke key', exact: true }).isDisabled());
        await page.keyboard.press('Escape'); assert(await dialog.isVisible());
      }, async () => { await dialog.getByRole('alert').waitFor(); }, 'revoke-pending', 'revoke-error');
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click(); await dialog.waitFor({ state: 'hidden' });
      const name = page.getByRole('textbox', { name: 'Key name', exact: true });
      await name.fill('Unsubmitted local integration');
      await failedWrite('/api/dev/keys', () => page.getByRole('button', { name: 'Create key', exact: true }).click(), async () => {
        assert(await name.isDisabled()); assert(await page.getByRole('button', { name: 'Create key', exact: true }).isDisabled());
      }, async () => {
        await page.getByRole('alert').filter({ hasText: 'Could not create key' }).waitFor();
        assert.equal(await name.inputValue(), 'Unsubmitted local integration');
      }, 'create-pending', 'create-error');
    } else {
      for (const [label, state] of [['Approve', 'approve-confirmation'], ['Reject', 'reject-confirmation']]) {
        await table.getByRole('button', { name: label, exact: true }).first().click();
        const dialog = page.getByRole('dialog', { name: `${label} invoice`, exact: true });
        await dialog.waitFor(); await validateDialog(dialog); await capture(state);
        await dialog.getByRole('button', { name: 'Cancel', exact: true }).click(); await dialog.waitFor({ state: 'hidden' });
      }
      await noMutations();
      await table.getByRole('button', { name: 'Approve', exact: true }).first().click();
      const dialog = page.getByRole('dialog', { name: 'Approve invoice', exact: true });
      await dialog.waitFor();
      await failedWrite('/api/crypto/admin/invoices/fixture-invoice-0/approve', () => dialog.getByRole('button', { name: 'Approve and credit', exact: true }).click(), async () => {
        assert(await dialog.getByRole('button', { name: 'Cancel', exact: true }).isDisabled());
        assert(await dialog.getByRole('button', { name: 'Approve and credit', exact: true }).isDisabled());
        await page.keyboard.press('Escape'); assert(await dialog.isVisible());
      }, async () => { await dialog.getByRole('alert').waitFor(); }, 'review-pending', 'review-error');
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click(); await dialog.waitFor({ state: 'hidden' });
      await page.evaluate(pathname => { window.__routeReview.deferRead = pathname; }, primaryRead);
      // MUI includes the selected value in the combobox's accessible name.
      const filter = page.getByRole('combobox', { name: /^Status(?: |$)/ });
      const choose = async label => { await filter.click(); await page.getByRole('option', { name: label, exact: true }).click(); };
      await choose('Expired'); await page.waitForFunction(() => typeof window.__routeReview.releaseRead === 'function');
      await choose('Rejected'); await table.getByText('rejected', { exact: true }).waitFor();
      await page.evaluate(() => window.__routeReview.releaseRead()); await settle();
      assert.equal(await table.getByText('expired', { exact: true }).count(), 0, 'late first response cannot replace the latest filter');
      assert.equal(await table.getByText('rejected', { exact: true }).count(), 1);
    }
  } else {
    // Master revokes immediately and invoices use native confirmation. Capture
    // the actual ancestors; do not click immediate mutations to fabricate dialogs.
    if (invoices) {
      const prompts = [];
      const record = dialog => prompts.push({ type: dialog.type(), message: dialog.message(), response: 'dismissed' });
      page.on('dialog', record); // The main runner dismisses native prompts.
      try {
        for (const [label, state] of [['Approve', 'approve-confirmation'], ['Reject', 'reject-confirmation']]) {
          const count = prompts.length;
          await page.locator('#main-content').getByRole('button', { name: label, exact: true }).first().click();
          assert.equal(prompts.length, count + 1, 'actual native confirmation was recorded and dismissed');
          await capture(state);
        }
      } finally { page.off('dialog', record); }
      evidence.push({ state: 'native-confirmations', prompts });
      assert.equal(await page.evaluate(() => window.__routeReview.writes.filter(write => write.url?.startsWith('/api/crypto/')).length), 0);
      for (const state of ['review-pending', 'review-error']) await capture(state);
    } else {
      for (const state of ['revoke-confirmation', 'revoke-pending', 'revoke-error', 'create-pending', 'create-error']) await capture(state);
    }
  }
  // Real pending/empty/failed primary reads, in separate page loads. The same
  // injection is consumed by untouched master, even if it has no recovery UI.
  const base = new URL(page.url());
  const reload = async (parameter, value) => {
    const url = new URL(base);
    for (const key of ['fixtureDeferRead', 'fixtureFailRead', 'fixtureEmptyRead']) url.searchParams.delete(key);
    url.searchParams.set(parameter, value);
    await page.goto(String(url));
    await page.waitForFunction(() => window.__routeReview?.ready);
  };
  await reload('fixtureDeferRead', primaryRead);
  await page.waitForFunction(() => typeof window.__routeReview.releaseRead === 'function');
  if (!master) await page.getByRole('status').getByText(invoices ? 'Loading invoices' : 'Loading keys', { exact: true }).waitFor();
  await capture('loading');
  await page.evaluate(() => window.__routeReview.releaseRead()); await settle();
  await reload('fixtureFailRead', primaryRead); await settle();
  assert.equal(await page.evaluate(() => window.__routeReview.simulatedReadFailures), 1);
  if (!master) await page.getByRole('alert').filter({ hasText: invoices ? 'Could not load invoices' : 'Could not load keys' }).waitFor();
  await capture('read-error');
  if (!master) { await page.getByRole('button', { name: 'Retry', exact: true }).click(); await settle(); await table.waitFor(); }
  await reload('fixtureEmptyRead', primaryRead); await settle();
  if (!master) { await table.waitFor(); await table.getByText(invoices ? 'No invoices.' : 'No keys.', { exact: true }).waitFor(); }
  await capture('empty');
  return [master ? 'actual-master-admin-read-states-and-explicit-new-dialog-ancestors' : 'responsive-admin-records-cancel-pending-failure-draft-retention-and-read-recovery'];
}

module.exports = { reviewAdminTasks };
