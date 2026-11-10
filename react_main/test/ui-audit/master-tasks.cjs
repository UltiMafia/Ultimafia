// Compare actual upstream interactions. No action is forwarded to a service.
// Only the two deliberately opted-in failed writes are allowed by its adapter.
const assert = require('node:assert/strict');

async function reviewMasterTasks(page, item, capture) {
  const checks = [];
  const content = page.locator('#main-content');
  const settle = () => page.waitForFunction(() => window.__routeReview.pending === 0 && performance.now() - window.__routeReview.lastRequestAt > 400);
  if (item.name === 'host') {
    await content.getByRole('button', { name: 'Host', exact: true }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    for (const name of ['Advanced Hosting', 'Configure Duration']) {
      const option = dialog.getByRole('checkbox', { name, exact: true });
      if (await option.count() && !(await option.isDisabled())) await option.check();
    }
    await capture('host-dialog', 'top');
    await dialog.locator('.MuiDialogContent-root').evaluate(element => { element.scrollTop = element.scrollHeight; });
    await capture('host-dialog', 'bottom');
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    checks.push('actual-master-host-dialog-cancel-no-host-request');
  }
  if (item.name === 'forum-thread') {
    await content.getByRole('button', { name: 'Reply', exact: true }).first().click();
    const composer = content.getByRole('group', { name: 'Forum reply composer' });
    await composer.locator('textarea').fill('Local reply draft, not submitted');
    await composer.scrollIntoViewIfNeeded();
    await capture('reply');
    await composer.getByRole('button', { name: 'Cancel', exact: true }).click();
    checks.push('actual-master-reply-editor-cancel-no-post');
  }
  if (item.name === 'setup-detail') {
    for (const [label, state] of [['Statistics', 'statistics'], ['Night Order', 'night'], ['Version History', 'version']]) {
      await content.getByRole('tab', { name: label, exact: true }).click();
      await settle();
      await capture(state);
    }
    checks.push('actual-master-setup-secondary-tabs');
  }
  if (['profile-rich', 'profile-custom'].includes(item.name)) {
    for (const [state, selector] of [['games', '.profile .recent-games'], ['collection', '.profile .trophies-content'], ['statistics', '.profile .ratings']]) {
      await content.locator(selector).scrollIntoViewIfNeeded();
      await capture(state);
    }
    checks.push('actual-master-profile-sections-preserve-two-column-structure');
  }
  if (item.name === 'rankings') {
    await content.getByRole('button', { name: 'skill rating about', exact: true }).click();
    await page.getByRole('dialog').waitFor();
    await capture('rating-details');
    await page.keyboard.press('Escape');
    checks.push('actual-master-rating-dialog');
  }
  if (item.name === 'stocks') {
    await content.getByRole('button', { name: 'Buy', exact: true }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    // Do not reproduce master's unbounded pricing loop with a huge share count.
    await dialog.locator('input[type="number"]').fill('1');
    await capture('trade-dialog');
    await page.evaluate(() => { window.__routeReview.allowMasterFailure = '/api/stocks/buy'; });
    await dialog.getByRole('button', { name: 'Buy', exact: true }).click();
    await settle();
    await page.getByText('Simulated trade failure. No trade was made.', { exact: false }).first().waitFor();
    await capture('trade-error');
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    checks.push('actual-master-trade-dialog-and-explicit-in-memory-failure-only');
  }
  if (item.name === 'feedback') {
    await content.getByRole('textbox', { name: 'Title', exact: true }).fill('Local feedback draft');
    await content.getByRole('textbox', { name: 'Describe your feedback', exact: true }).fill('This is a controlled failure. No issue is created.');
    await page.evaluate(() => { window.__routeReview.allowMasterFailure = '/api/feedback/submit'; });
    await content.getByRole('button', { name: /Submit feedback/i }).click();
    await settle();
    await page.getByText('Simulated feedback failure. No issue was created.', { exact: false }).first().waitFor();
    await capture('submission-error');
    checks.push('actual-master-feedback-error-without-creating-an-issue');
  }
  if (item.name === 'admin-intake') {
    // Upstream posts immediately; it has no confirmation dialog. Do NOT click
    // the destructive buttons to manufacture an equivalent. Capture the actual
    // ancestor with an explicit not-on-master reason from the mapping registry.
    await capture('approve-confirmation');
    await capture('ban-confirmation');
    checks.push('new-confirmations-paired-to-actual-master-ancestor-with-no-destructive-click');
  }
  if (item.name === 'family-leader') {
    const prompts = [];
    const recordPrompt = dialog => prompts.push({ type: dialog.type(), message: dialog.message(), response: 'dismissed' });
    page.on('dialog', recordPrompt); // The runner's existing handler dismisses it.
    try {
      for (const [member, label, state] of [['Juniper', 'Demote to Member', 'role-confirmation'], ['Moth', 'Remove Member', 'remove-confirmation']]) {
        const members = content.locator('.MuiPaper-root').filter({ has: page.getByRole('heading', { name: 'Members', exact: true }) }).first();
        const name = members.getByText(member, { exact: true }).first();
        const row = name.locator('xpath=ancestor::*[.//button][1]');
        await row.getByRole('button').last().click();
        const count = prompts.length;
        await page.getByRole('menuitem', { name: label, exact: true }).click();
        assert.equal(prompts.length, count + 1, 'Actual master must open its native confirmation');
        await page.keyboard.press('Escape');
        await capture(state, 'nearest-ancestor', { nativeDialog: prompts.at(-1) });
      }
      await content.locator('.bio.edit').click();
      await content.locator('.bio textarea').fill('Local family draft, never submitted');
      await content.locator('.bio textarea').scrollIntoViewIfNeeded();
      await capture('bio-editor');
      await content.locator('.bio .buttons').getByText('Cancel', { exact: true }).click();
    } finally { page.off('dialog', recordPrompt); }
    checks.push('actual-master-family-native-confirmations-dismissed-and-bio-not-saved');
  }
  const writes = await page.evaluate(() => window.__routeReview.writes);
  const unexpected = writes.filter(write => !['/api/user/online', '/api/notifs/read', '/api/stocks/buy', '/api/feedback/submit'].includes(write.url));
  assert.deepEqual(unexpected, [], 'No unapproved master mutation was attempted');
  return checks;
}
module.exports = { reviewMasterTasks };
