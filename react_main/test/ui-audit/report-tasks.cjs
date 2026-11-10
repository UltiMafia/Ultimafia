// Report presentation and recovery; no report is delivered to a service.
const assert = require('node:assert/strict');

async function reviewReportTasks(page, item, capture, { master = false, after = false } = {}) {
  if (item.name !== 'profile-default') return [];
  const open = async () => {
    const button = after && !master ? page.getByRole('button', { name: 'Report user', exact: true })
      : page.locator('button').filter({ has: page.locator('.fa-flag') });
    await button.click(); await page.getByRole('dialog').waitFor();
  };
  const dialog = () => page.getByRole('dialog');
  const settle = () => page.waitForFunction(() => window.__routeReview.pending === 0);
  const close = async () => {
    await dialog().getByRole('button', { name: 'Cancel', exact: true }).click();
    await dialog().waitFor({ state: 'hidden' });
  };
  const snapshot = async state => {
    if (after && !master) {
      assert.equal(await page.getByRole('dialog', { name: 'Report user', exact: true }).count(), 1);
      const geometry = await dialog().evaluate(element => {
        const box = element.getBoundingClientRect();
        const controls = [...element.querySelectorAll('button, input, textarea, [role="combobox"]')].filter(control => !control.closest('[aria-hidden="true"]'));
        return { outside: box.left < 0 || box.top < 0 || box.right > innerWidth || box.bottom > innerHeight,
          clipped: controls.filter(control => { const bounds = control.getBoundingClientRect(); return bounds.width > 0 && (bounds.left < box.left || bounds.right > box.right + 1); }).length };
      });
      assert.deepEqual(geometry, { outside: false, clipped: 0 }, `${state}: report controls remain within the shared dialog`);
    }
    const content = dialog().locator('.MuiDialogContent-root');
    await content.evaluate(element => { element.scrollTop = 0; });
    await capture(state, 'top');
    await content.evaluate(element => { element.scrollTop = element.scrollHeight; });
    await capture(state, 'bottom');
    const fixture = await page.evaluate(() => window.__routeReview);
    assert.deepEqual(fixture.unresolved, [], `${state}: no unresolved fixture contracts`);
    assert.deepEqual(fixture.errors, []);
  };
  const chooseRule = async () => {
    await dialog().getByRole('combobox', { name: /^Rule Broken/ }).click();
    await page.getByRole('option', { name: 'Personal Attacks & Harassment (PA)', exact: true }).click();
  };
  await open(); await settle(); await chooseRule();
  await dialog().getByRole('textbox', { name: 'Game', exact: true }).fill('fixture-report-game');
  await dialog().getByRole('textbox', { name: /^Description/ }).fill('Local report draft, never delivered');
  await snapshot('report-form');
  // Upstream has no guarded pending surface. Its same populated form is the
  // explicitly documented ancestor; do not submit to fabricate master evidence.
  if (master) {
    await snapshot('report-pending'); await snapshot('report-error');
  }
  if (after && !master) {
    const selection = dialog().getByRole('combobox', { name: /^Rule Broken/ });
    const selectedText = await selection.evaluate(element => ({ overflow: element.scrollWidth > element.clientWidth + 1,
      whiteSpace: getComputedStyle(element).whiteSpace, textOverflow: getComputedStyle(element).textOverflow,
      fieldClass: element.closest('.MuiFormControl-root').className }));
    assert.equal(selectedText.overflow, false, `Complete selected rule remains readable: ${JSON.stringify(selectedText)}`);
    await page.evaluate(() => { window.__routeReview.allowReportFailure = true; });
    await dialog().getByRole('button', { name: 'Submit Report', exact: true }).click();
    await page.waitForFunction(() => typeof window.__routeReview.releaseReportFailure === 'function');
    assert.ok(await dialog().getByRole('button', { name: 'Cancel', exact: true }).isDisabled());
    assert.ok(await dialog().getByRole('button', { name: 'Submit Report', exact: true }).isDisabled());
    assert.ok(await dialog().getByRole('textbox', { name: 'Game', exact: true }).isDisabled());
    assert.ok(await dialog().getByRole('textbox', { name: /^Description/ }).isDisabled());
    assert.ok(await selection.isDisabled());
    assert.equal(await dialog().getByRole('button', { name: 'Close', exact: true }).count(), 0);
    await page.keyboard.press('Escape'); assert.ok(await dialog().isVisible());
    // Deliberate duplicate form events bypass native disabled buttons; the
    // synchronous request guard must still prevent additional submissions.
    await dialog().locator('form').evaluate(form => {
      for (let index = 0; index < 2; index++) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await snapshot('report-pending');
    await page.evaluate(() => window.__routeReview.releaseReportFailure()); await settle();
    await dialog().getByRole('alert').getByText('Simulated report failure. No report was delivered.', { exact: true }).waitFor();
    assert.equal(await dialog().getByRole('textbox', { name: /^Description/ }).inputValue(), 'Local report draft, never delivered');
    assert.equal(await dialog().getByRole('textbox', { name: 'Game', exact: true }).inputValue(), 'fixture-report-game');
    await snapshot('report-error');
    const writes = await page.evaluate(() => window.__routeReview.writes.filter(write => write.url === '/api/report/send'));
    assert.equal(writes.length, 1, 'Only one deliberately failed in-memory report attempt');
    assert.deepEqual(JSON.parse(writes[0].data), { game: 'fixture-report-game', user: 'fixture-default', rule: 'Personal Attacks & Harassment (PA)', description: 'Local report draft, never delivered' });
  }
  await close();
  assert.equal(await page.evaluate(() => window.__routeReview.writes.filter(write => write.url === '/api/report/send').length), after && !master ? 1 : 0);

  await page.evaluate(() => { window.__routeReview.deferRead = '/api/site/violations'; });
  await open();
  await page.waitForFunction(() => typeof window.__routeReview.releaseRead === 'function');
  assert.ok(await dialog().getByRole('combobox', { name: /^Rule Broken/ }).isDisabled());
  if (after && !master) await dialog().getByRole('status').getByText('Loading rules', { exact: true }).waitFor();
  await snapshot('report-loading');
  await close();
  await page.evaluate(() => window.__routeReview.releaseRead()); await settle();

  await page.evaluate(() => { window.__routeReview.failNextRead = '/api/site/violations'; });
  await open(); await settle();
  if (after && !master) await dialog().getByRole('alert').filter({ hasText: 'Could not load rules' }).waitFor();
  await snapshot('report-read-error');
  if (after && !master) {
    await dialog().getByRole('button', { name: 'Retry', exact: true }).click(); await settle();
    await chooseRule();
  }
  await close();

  const base = new URL(page.url());
  base.searchParams.set('fixtureEmptyRead', '/api/site/violations');
  await page.goto(String(base)); await page.waitForFunction(() => window.__routeReview?.ready); await settle();
  // The actual master DOM is untouched; reload only loses the audit root marker.
  if (master) await page.locator('.inner-container').evaluate(element => { element.id = 'main-content'; });
  await open(); await settle();
  if (after && !master) {
    await dialog().getByRole('status').getByText('No report rules are available.', { exact: true }).waitFor();
    assert.ok(await dialog().getByRole('button', { name: 'Submit Report', exact: true }).isDisabled());
  }
  await snapshot('report-empty'); await close();
  assert.equal(await page.evaluate(() => window.__routeReview.writes.filter(write => write.url === '/api/report/send').length), 0);
  if (after && !master && process.env.ROUTE_REPORT_SESSION_REVIEW === '1') {
    base.searchParams.delete('fixtureEmptyRead');
    await page.goto(String(base)); await page.waitForFunction(() => window.__routeReview?.ready);
    await open(); await chooseRule();
    await dialog().getByRole('textbox', { name: /^Description/ }).fill('Old unmounted report draft');
    await page.evaluate(() => { window.__routeReview.allowReportFailure = true; });
    await dialog().getByRole('button', { name: 'Submit Report', exact: true }).click();
    await page.waitForFunction(() => typeof window.__routeReview.releaseReportFailure === 'function');
    await page.waitForFunction(() => !history.state?.__overlay);
    // A programmatic same-app navigation models an owner being unmounted while
    // its POST is in flight. It is not a physical Back/phone interaction claim.
    await page.locator('a[href="/community/forums"], .mobile-nav button').filter({ hasText: 'Community' }).first().evaluate(element => element.click());
    await page.waitForURL('**/community/forums');
    await page.goBack(); await page.waitForURL('**/user/fixture-default*');
    await open(); await chooseRule();
    await dialog().getByRole('textbox', { name: /^Description/ }).fill('New report draft stays intact');
    await page.evaluate(() => window.__routeReview.releaseReportFailure()); await settle();
    assert.ok(await dialog().isVisible());
    assert.equal(await dialog().getByRole('alert').count(), 0, 'Old submission failure cannot appear in the new session');
    assert.equal(await dialog().getByRole('textbox', { name: /^Description/ }).inputValue(), 'New report draft stays intact');
    assert.ok(await dialog().getByRole('button', { name: 'Submit Report', exact: true }).isEnabled());
    await close();
    assert.equal(await page.evaluate(() => window.__routeReview.simulatedReportFailures), 1);
    assert.equal(await page.evaluate(() => window.__routeReview.writes.filter(write => write.url === '/api/report/send').length), 1);
  }
  return ['report-form-loading-failure-empty-and-cancel-without-delivery',
    ...(after && !master && process.env.ROUTE_REPORT_SESSION_REVIEW === '1'
      ? ['pending-report-owner-unmount-late-failure-does-not-change-new-draft'] : [])];
}

module.exports = { reviewReportTasks };
