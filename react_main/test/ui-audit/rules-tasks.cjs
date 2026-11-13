const assert = require('node:assert/strict');

async function reviewRulesTasks(page, item, capture, { master = false, after = false } = {}) {
  if (item.name !== 'rules') return [];
  const primaryRead = '/api/site/violations';
  const root = () => page.locator(master ? '.inner-container' : '#main-content');
  const scroller = () => page.locator('.site-wrapper');
  const scroll = async bottom => {
    if (await scroller().count()) await scroller().evaluate((element, bottom) => { element.scrollTop = bottom ? element.scrollHeight : 0; }, bottom);
    if (master) await page.evaluate(bottom => scrollTo(0, bottom ? document.documentElement.scrollHeight : 0), bottom);
  };
  const settle = () => page.waitForFunction(() => window.__routeReview.pending === 0 && performance.now() - window.__routeReview.lastRequestAt > 400);
  for (const [label, state] of [['Filing an Appeal', 'appeal'], ['Other Policies', 'other-policies']]) {
    await scroll(false);
    await root().getByRole('tab', { name: label, exact: true }).click();
    await root().getByRole('heading', { name: label, exact: true }).waitFor();
    await scroll(false); await capture(state, 'top');
    await scroll(true); await capture(state, 'bottom');
  }
  const base = new URL(page.url());
  const reload = async parameter => {
    const url = new URL(base);
    url.searchParams.set(parameter, primaryRead);
    await page.goto(String(url));
    await page.waitForFunction(() => window.__routeReview?.ready);
  };
  await reload('fixtureDeferRead');
  await page.waitForFunction(() => typeof window.__routeReview.releaseRead === 'function');
  if (after && !master) await page.getByRole('status').getByText('Loading penalty lengths', { exact: true }).waitFor();
  await capture('loading', 'top');
  await page.evaluate(() => window.__routeReview.releaseRead()); await settle();
  await reload('fixtureFailRead'); await settle();
  assert.equal(await page.evaluate(() => window.__routeReview.simulatedReadFailures), 1);
  if (after && !master) {
    await page.getByRole('alert').filter({ hasText: 'Could not load penalty lengths' }).waitFor();
    await page.getByText('When you choose to spend your time on Ultimafia', { exact: false }).waitFor();
  }
  await capture('read-error', 'top');
  if (after && !master) { await page.getByRole('button', { name: 'Retry', exact: true }).click(); await settle(); }
  await reload('fixtureEmptyRead'); await settle();
  if (after && !master) await page.getByRole('status').getByText('Penalty lengths are not available.', { exact: true }).waitFor();
  await capture('empty', 'top');
  const state = await page.evaluate(() => window.__routeReview);
  assert.deepEqual(state.unresolved, []);
  assert.deepEqual(state.errors, []);
  assert.equal(state.writes.filter(write => write.url && !['/api/notifs/read', '/api/user/online'].includes(write.url)).length, 0, 'policy browsing/retry sends no mutation');
  return ['policy-tabs-and-real-loading-failure-empty-reads-with-no-writes'];
}

module.exports = { reviewRulesTasks };
