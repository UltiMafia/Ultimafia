// Compare actual upstream interactions. No action is forwarded to a service.
// Only the two deliberately opted-in failed writes are allowed by its adapter.
const assert = require('node:assert/strict');
const { reviewReportTasks } = require('./report-tasks.cjs');

async function reviewMasterTasks(page, item, capture) {
  const checks = [];
  checks.push(...await reviewReportTasks(page, item, capture, { master: true }));
  const content = page.locator('#main-content');
  const settle = () => page.waitForFunction(() => window.__routeReview.pending === 0 && performance.now() - window.__routeReview.lastRequestAt > 400);
  if (item.name === 'lobby') {
    // The user menu is a transient surface; both branches open it for the same
    // captured state so the menu itself is compared, not just the page behind it.
    const trigger = page.getByRole('button', { name: 'User menu', exact: true });
    if (await trigger.count()) {
      await trigger.click();
      await page.getByText('Log Out', { exact: true }).waitFor({ timeout: 5000 });
      await page.waitForTimeout(250);
      await capture('user-menu');
      await page.keyboard.press('Escape');
    }
  }
  if (item.name === 'new-page-contract') {
    await capture('steps-final');
    await capture('tabs-last');
    checks.push('actual-master-feedback-form-ancestor-for-test-only-step-controls');
  }
  if (item.name === 'create-setup') {
    const captureStep = async state => {
      await page.mouse.move(0, 0);
      await page.evaluate(() => scrollTo(0, 0)); await capture(state, 'top');
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await capture(state, 'bottom');
    };
    // Master's role icon opens a modal hover popover while the row is clicked.
    // Dismiss the real overlay before locating background modifier controls;
    // otherwise MUI marks that content aria-hidden, despite pointer pass-through.
    const dismissRolePopover = async () => {
      await page.mouse.move(0, 0);
      if (await page.locator('.MuiPopover-root').count()) await page.keyboard.press('Escape');
      await page.waitForFunction(() => ![...document.querySelectorAll('.MuiPopover-root')].some(element => getComputedStyle(element).visibility !== 'hidden'));
    };
    const add = label => content.locator('.role-cell').filter({ has: page.getByText(label, { exact: true }) }).getByRole('button').filter({ has: page.locator('.fa-plus') }).click();
    await add('Villager');
    await content.getByRole('button', { name: 'Next: Role modifiers', exact: true }).click();
    await content.getByRole('button', { name: 'Edit modifiers for Cop', exact: true }).click();
    await dismissRolePopover();
    await add('Armed'); await dismissRolePopover(); await captureStep('modifiers');
    await content.getByRole('button', { name: 'Next: Game settings', exact: true }).click();
    // Upstream renders this as a separate Typography label, without an input
    // association. Locate that exact field from its real FormField structure.
    await content.getByText('Setup Name', { exact: true }).locator('..').locator('..').getByRole('textbox').fill('Local creator review');
    // Upstream includes each nested info-tooltip's text in the checkbox name.
    await content.getByRole('checkbox', { name: /^Closed Roles(?: |$)/ }).check();
    await content.getByRole('checkbox', { name: /^Role Groups(?: |$)/ }).check();
    await captureStep('settings');
    assert.equal(await page.evaluate(() => window.__routeReview.writes.filter(write => write.url === '/api/setup/create').length), 0);
    checks.push('actual-master-setup-modifier-and-final-step-without-save');
  }
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
  if (['contributors', 'donors'].includes(item.name)) {
    // Upstream's own-card click is not an accessible Edit button. Do not replace
    // that DOM with redesign components merely to obtain a matching selector.
    const card = content.locator('.MuiCard-root').filter({ has: page.getByText('NightOwl', { exact: true }) }).first();
    // The center of the card may hit a profile/GitHub link, which deliberately
    // stops bubbling. The existing edit glyph is the intended own-card target.
    await card.locator('.fa-pencil-alt').click();
    const editor = card.locator('textarea').first();
    await editor.fill('Local unsubmitted bio draft');
    await editor.scrollIntoViewIfNeeded();
    await capture('bio-editor');
    await card.getByRole('button', { name: 'Cancel', exact: true }).click();
    checks.push('actual-master-own-bio-edit-and-cancel-without-saving');
  }
  if (item.name === 'donors-management') {
    await content.getByRole('button', { name: 'Assign donor status', exact: true }).click();
    await page.getByRole('combobox', { name: /Search user/ }).waitFor();
    await capture('assign-dialog');
    await page.keyboard.press('Escape');
    await page.getByRole('combobox', { name: /Search user/ }).waitFor({ state: 'hidden' });
    await capture('remove-confirmation');
    checks.push('master-assignment-popover-and-removal-ancestor-with-no-mutation');
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
