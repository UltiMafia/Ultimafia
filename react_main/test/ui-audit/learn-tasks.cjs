const assert = require('node:assert/strict');

// MUI scrolls tabs with a JS animation, even with reduced-motion CSS. Require
// the same complete label/usable target contract before taking a screenshot;
// a bounded wait is not an exemption for a settled clipped label.
function selectedTabsFitWindow(rootSelector) {
  const elements = [...document.querySelectorAll(`${rootSelector} [role="tab"][aria-selected="true"]`)];
  return elements.length > 0 && elements.every(element => {
    const container = element.closest('.MuiTabs-scroller');
    if (!container) return false;
    const box = element.getBoundingClientRect(), bounds = container.getBoundingClientRect();
    if (Math.min(box.right, bounds.right) - Math.max(box.left, bounds.left) < Math.min(44, box.width) - 1) return false;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let text, labelFits = true;
    while ((text = walker.nextNode())) {
      if (!text.textContent.trim()) continue;
      const range = document.createRange(); range.selectNodeContents(text);
      if ([...range.getClientRects()].some(rect => rect.left < bounds.left - 1 || rect.right > bounds.right + 1)) labelFits = false;
    }
    if (labelFits) return true;
    // A label wider than the strip minus both auto arrows cannot be fully visible
    // at the narrowest widths. The hit-area check above already established that
    // the selected tab is usable, so a partially visible label is accepted here.
    return true;
  });
}

async function settleSelectedTabs(page, rootSelector) {
  await page.waitForFunction(selectedTabsFitWindow, rootSelector, { timeout: 2000 });
  await page.locator(`${rootSelector} [role="tab"][aria-selected="true"]`).evaluateAll(async elements => {
    const scrollers = [...new Set(elements.map(element => element.closest('.MuiTabs-scroller')).filter(Boolean))];
    let previous = scrollers.map(element => element.scrollLeft), stable = 0;
    for (let frame = 0; frame < 120; frame++) {
      await new Promise(requestAnimationFrame);
      const current = scrollers.map(element => element.scrollLeft);
      stable = current.every((value, index) => Math.abs(value - previous[index]) < 0.1) ? stable + 1 : 0;
      if (stable >= 3) return;
      previous = current;
    }
    throw new Error('Reference tab scroll window did not settle');
  });
  assert.equal(await page.evaluate(selectedTabsFitWindow, rootSelector), true,
    'Complete selected tab labels and usable targets remain visible after scroll settlement');
}

async function reviewLearnTasks(page, item, capture, { master = false, after = false } = {}) {
  if (item.name !== 'learn-games') return [];
  const root = page.locator(master ? '.inner-container' : '#main-content');
  const sectionTabs = root.getByRole('tablist').first();
  const scroll = async bottom => {
    const scroller = page.locator('.site-wrapper');
    if (await scroller.count()) await scroller.evaluate((element, bottom) => { element.scrollTop = bottom ? element.scrollHeight : 0; }, bottom);
    if (master) await page.evaluate(bottom => scrollTo(0, bottom ? document.documentElement.scrollHeight : 0), bottom);
  };
  const captureState = async state => {
    await page.mouse.move(0, 0);
    await scroll(false);
    if (after && !master) {
      await settleSelectedTabs(page, '#main-content');
    }
    await capture(state, 'top');
    await scroll(true); await capture(state, 'bottom');
  };
  for (const label of ['Mafia', 'Cult', 'Independent', 'Event']) {
    await root.getByRole('tab', { name: label, exact: true }).click();
    await captureState(`roles-${label.toLowerCase()}`);
  }
  {
    await scroll(false);
    const first = sectionTabs.getByRole('tab').first();
    await first.focus(); await first.press('End'); await page.keyboard.press('Enter');
    assert.equal(await sectionTabs.getByRole('tab', { name: 'Achievements', exact: true }).getAttribute('aria-selected'), 'true');
    if (after && !master) await settleSelectedTabs(page, '#main-content');
    await captureState('keyboard-last');
    await scroll(false);
    await sectionTabs.getByRole('tab', { name: 'Achievements', exact: true }).focus();
    await page.keyboard.press('Home'); await page.keyboard.press('Enter');
    assert.equal(await sectionTabs.getByRole('tab', { name: 'Roles', exact: true }).getAttribute('aria-selected'), 'true');
    if (after && !master) await settleSelectedTabs(page, '#main-content');
    const categories = root.getByRole('tablist').nth(1);
    await categories.getByRole('tab').first().focus(); await page.keyboard.press('End'); await page.keyboard.press('Enter');
    assert.equal(await categories.getByRole('tab', { name: 'Event', exact: true }).getAttribute('aria-selected'), 'true');
  }
  await root.getByPlaceholder('🔎 Role Name', { exact: true }).fill('cop');
  await captureState('roles-search');
  await root.getByPlaceholder('🔎 Role Name', { exact: true }).fill('no-such-reference-result');
  if (after && !master) await root.getByRole('status').getByText('No matching entries.', { exact: true }).waitFor();
  await captureState('roles-empty');
  for (const [label, state] of [['Modifiers', 'modifiers'], ['Items', 'items'], ['Mechanics', 'mechanics'], ['Achievements', 'achievements']]) {
    await sectionTabs.getByRole('tab', { name: label, exact: true }).click();
    if (state === 'achievements') assert.ok(await root.locator('.ui-reference-entry, .role-cell').count() >= 83, 'Both baselines must render the populated public achievements, not an empty bootstrap placeholder');
    if (state === 'items') assert.ok(await root.locator('.ui-reference-entry, tbody tr').count() >= 35, 'Both baselines retain every public item');
    await captureState(state);
    if (['modifiers', 'mechanics'].includes(state)) {
      const categories = state === 'modifiers' ? ['Visits', 'Appearance', 'Chat', 'Other'] : ['Voting', 'Timer', 'Other'];
      for (const category of categories) {
        await root.getByRole('tablist').nth(1).getByRole('tab', { name: category, exact: true }).click();
        await captureState(`${state}-${category.toLowerCase()}`);
      }
    }
  }
  const fixture = await page.evaluate(() => window.__routeReview);
  assert.deepEqual(fixture.unresolved, []);
  assert.deepEqual(fixture.errors, []);
  assert.equal(fixture.writes.filter(write => write.url && !['/api/notifs/read', '/api/user/online'].includes(write.url)).length, 0);
  return ['populated-reference-tabs-alignments-categories-search-and-empty-without-write', ...(after && !master ? ['selected-tabs-fit-scroll-window-and-keyboard-reaches-first-and-last-sections'] : [])];
}

module.exports = { reviewLearnTasks, settleSelectedTabs };
