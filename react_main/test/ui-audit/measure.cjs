// Runs inside Playwright's page, with no application dependencies. Keep this
// callable on both the redesign and actual upstream master DOM.
function measureUi() {
  const main = document.querySelector('#main-content') || document.querySelector('.main-content');
  if (!main) throw new Error('Audit requires an explicit production content root');
  const rect = element => {
    const value = element.getBoundingClientRect();
    return Object.fromEntries(['x', 'y', 'top', 'right', 'bottom', 'left', 'width', 'height'].map(key => [key, Math.round(value[key] * 100) / 100]));
  };
  const visible = element => {
    const style = getComputedStyle(element), box = rect(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0 && !element.closest('[aria-hidden="true"]');
  };
  const selector = element => {
    if (element.id) return `#${CSS.escape(element.id)}`;
    const parts = [];
    const root = main.contains(element) ? main : document.body;
    for (let node = element; node && node !== root; node = node.parentElement) {
      const siblings = node.parentElement ? [...node.parentElement.children].filter(child => child.tagName === node.tagName) : [node];
      parts.unshift(`${node.tagName.toLowerCase()}${siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(node) + 1})` : ''}`);
    }
    return `${root === main ? (main.id ? `#${CSS.escape(main.id)}` : '.main-content') : 'body'} > ${parts.join(' > ')}`;
  };
  const details = element => {
    const style = getComputedStyle(element);
    return { selector: selector(element), text: (element.getAttribute('aria-label') || element.textContent || '').trim().slice(0, 120), box: rect(element),
      fontSize: parseFloat(style.fontSize), fontWeight: style.fontWeight, lineHeight: style.lineHeight, color: style.color,
      marginTop: parseFloat(style.marginTop), marginBottom: parseFloat(style.marginBottom),
      padding: style.padding, gap: style.gap, maxWidth: style.maxWidth,
      background: style.backgroundColor, border: style.border, radius: style.borderRadius,
      scrollWidth: element.scrollWidth, clientWidth: element.clientWidth };
  };
  // Prefer the page-level h1. A small h2 label or breadcrumb above the title is
  // not the page heading, and picking it reported every such page as misaligned.
  const heading = [...main.querySelectorAll('h1, [role="heading"][aria-level="1"]')].find(visible)
    || [...main.querySelectorAll('h2, [role="heading"][aria-level="2"]')].find(visible);
  const shell = main.querySelector('.ui-page, .inner-content') || main;
  const firstSection = shell.querySelector('.ui-page-content > *, section, .ui-section');
  const roles = {
    primaryAction: '.ui-action--primary, .MuiButton-containedPrimary',
    secondaryAction: '.ui-action--secondary, .MuiButton-outlined',
    textInput: 'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea',
    select: 'select, [role="combobox"]', card: '.ui-card, .MuiCard-root',
    stat: '.ui-stat', sectionHeading: 'h2, h3', tableHeader: 'th, [role="columnheader"]',
    tab: '[role="tab"]', currency: '.coin-icon', utilityIcon: '.ui-icon',
    emptyState: '[role="status"]', dialog: '[role="dialog"]',
    comment: '.comment-row, .comments-page .post', commentList: '.comments-page',
    declaredFill: '[data-ui-fill], .MuiFormControl-fullWidth, .MuiButton-fullWidth',
    sectionContainer: 'section, article, aside, [role="region"], [role="tabpanel"], [data-ui-section], .ui-page-content, .ui-page-content > :is(div, section, article), :has(> h2), :has(> h3)',
    // Section menus, tab strips and breadcrumb trails only. Pagination and other
    // navs are different contracts and must not be compared as section links.
    sectionNav: 'nav[aria-label*="section" i], nav[aria-label*="breadcrumb" i], [role="navigation"][aria-label*="section" i], [role="tablist"]',
    sectionNavItem: 'nav[aria-label*="section" i] a, nav[aria-label*="section" i] button, nav[aria-label*="breadcrumb" i] a, [role="navigation"][aria-label*="section" i] a, [role="navigation"][aria-label*="section" i] button, [role="tablist"] [role="tab"]',
  };
  // Authored Markdown headings are user content, not UI section headings; grading
  // them against page headings reported every profile with a long bio.
  const authored = element => Boolean(element.closest('.md-content, .paragraph, .bio'));
  const samples = Object.entries(roles).flatMap(([role, query]) => [...document.querySelectorAll(query)]
    .filter(element => (main.contains(element) || element.closest('[role="dialog"]')) && visible(element))
    .filter(element => role !== 'sectionHeading' || !authored(element))
    // declaredFill marks a wrapper that declares full width; its own radius and
    // typography belong to the inner control, so it is a fill target, not a style sample.
    .filter(() => role !== 'declaredFill')
    .map(element => ({ role, ...details(element) })));
  const contentBounds = element => {
    const box = rect(element), style = getComputedStyle(element);
    const left = box.left + element.clientLeft + (parseFloat(style.paddingLeft) || 0);
    const right = box.left + element.clientLeft + element.clientWidth - (parseFloat(style.paddingRight) || 0);
    return { left, right, width: right - left, top: box.top, bottom: box.bottom };
  };
  // Fill rules apply to structural blocks. Label-, icon- and text-sized roles have
  // intrinsic width; a status line is text, not a block, so it never counts as short.
  const intrinsicRoles = new Set(['primaryAction', 'secondaryAction', 'utilityIcon', 'currency', 'tab', 'sectionNavItem', 'sectionHeading', 'tableHeader', 'emptyState']);
  const fillTargets = [];
  for (const [role, query] of Object.entries(roles)) {
    const elements = [...document.querySelectorAll(query)].filter(element => main.contains(element) || element.closest('[role="dialog"]'));
    for (const [index, element] of elements.entries()) {
      const name = element.getAttribute('aria-label') || element.getAttribute('aria-labelledby')?.split(/\s+/).map(id => document.getElementById(id)?.textContent || '').join(' ') ||
        (role === 'commentList' ? 'comments' : role === 'comment' ? element.querySelector('.user-name, .name')?.textContent : element.querySelector('h1, h2, h3, legend')?.textContent) || '';
      const identity = { role, name: name.trim().replace(/^Comment by\s+/i, '').replace(/\s+/g, ' ').toLowerCase(), index };
      // Interactive elements are controls, not containers. A lone button that
      // happens to be a direct child of the page content was graded as a section.
      if (element.matches('button, a, input, select, textarea, [role="button"]') && !element.getAttribute('data-ui-fill')) continue;
      const target = { role, identity, selector: selector(element), box: rect(element), status: 'measured',
        intrinsic: intrinsicRoles.has(role), evidence: [], declaredFullWidth: element.getAttribute('data-ui-fill') === 'full' ||
          element.classList.contains('MuiFormControl-fullWidth') || element.classList.contains('MuiButton-fullWidth') };
      if (!visible(element)) { fillTargets.push({ ...target, status: 'not-visible', reason: 'Hidden in this captured state; no visible-space claim' }); continue; }
      const parent = element.parentElement;
      if (!parent) { fillTargets.push({ ...target, status: 'unmeasurable', reason: 'Missing containing element' }); continue; }
      const parentStyle = getComputedStyle(parent), parentBounds = contentBounds(parent);
      target.containerSelector = selector(parent);
      target.allocation = { ...parentBounds, method: 'parent-content-box' };
      if (parentStyle.display.includes('grid')) {
        const columns = parentStyle.gridTemplateColumns.split(/\s+/).map(value => /^\d+(?:\.\d+)?px$/.test(value) ? parseFloat(value) : NaN);
        if (!columns.length || columns.some(value => !Number.isFinite(value))) {
          target.status = 'unmeasurable'; target.reason = 'Grid track allocation is not a resolved pixel track list';
        } else {
          const gap = parseFloat(parentStyle.columnGap) || 0, style = getComputedStyle(element);
          const start = /^\d+$/.test(style.gridColumnStart) ? Number(style.gridColumnStart) - 1 : columns.findIndex((width, i) => {
            const left = parentBounds.left + columns.slice(0, i).reduce((sum, value) => sum + value, 0) + gap * i;
            return target.box.left >= left - 2 && target.box.left < left + width + 2;
          });
          const span = Number(/span\s+(\d+)/.exec(style.gridColumnEnd)?.[1] || 1);
          if (start < 0) { target.status = 'unmeasurable'; target.reason = 'Cannot identify grid track from element position'; }
          else {
            const left = parentBounds.left + columns.slice(0, start).reduce((sum, value) => sum + value, 0) + gap * start;
            const width = columns.slice(start, start + span).reduce((sum, value) => sum + value, 0) + gap * (span - 1);
            target.allocation = { ...parentBounds, left, right: left + width, width, method: 'grid-track' };
          }
        }
      } else if (parentStyle.display.includes('flex') && parentStyle.flexDirection.startsWith('row') && !target.intrinsic) {
        target.status = 'unmeasurable'; target.reason = 'Flex-row allocation needs an explicit track/width contract';
      }
      const siblings = [...parent.children].filter(sibling => sibling !== element && visible(sibling));
      target.widerSiblings = siblings.filter(sibling => Math.abs(rect(sibling).left - target.box.left) <= 8 && rect(sibling).right > target.box.right + 8).map(sibling => ({ selector: selector(sibling), box: rect(sibling) }));
      if (target.widerSiblings.length) target.evidence.push('wider-aligned-sibling');
      if (!target.intrinsic && target.status === 'measured' && target.allocation.method === 'parent-content-box') {
        // Having a width is not evidence of underfilling. Only a wider aligned
        // sibling, a section rule/divider, or a declared full-width intent counts.
        // Follow aligned wrappers to the semantic section; a narrow wrapper must
        // not conceal the space allocated to every row inside it.
        for (let section = parent; section && section !== main; section = section.parentElement) {
          const style = getComputedStyle(section);
          if (style.display.includes('grid') || style.display.includes('flex') && style.flexDirection.startsWith('row')) break;
          if (!section.matches('section, article, aside, [role="region"], [role="tabpanel"]')) continue;
          const bounds = contentBounds(section);
          if (Math.abs(bounds.left - target.box.left) > 16 || bounds.right <= target.allocation.right) break;
          target.sectionSelector = selector(section);
          target.allocation = { ...bounds, method: 'aligned-section-content-edge' };
          const rule = [section, ...section.querySelectorAll(':scope > hr, :scope > header, :scope > h2, :scope > h3')].find(node => {
            const style = getComputedStyle(node);
            return parseFloat(style.borderTopWidth) > 0 || parseFloat(style.borderBottomWidth) > 0;
          });
          if (rule) { target.divider = { selector: selector(rule), box: rect(rule) }; target.evidence.push('section-rule-or-divider'); }
          break;
        }
      }
      target.rightGap = target.allocation.right - target.box.right;
      target.fillRatio = target.allocation.width > 0 ? target.box.width / target.allocation.width : null;
      if (!(target.allocation.width > 0)) { target.status = 'unmeasurable'; target.reason = 'Container has no measurable content width'; }
      fillTargets.push(target);
    }
  }
  // Attach the normalized allocation ratio to every sampled role, including
  // intentionally intrinsic controls. Width is collected, never silently ignored.
  for (const sample of samples) {
    const fill = fillTargets.find(target => target.role === sample.role && target.selector === sample.selector);
    sample.fillRatio = fill?.fillRatio ?? null;
    const element = document.querySelector(sample.selector);
    // A nested card heading is not a page section heading; compare by depth.
    const sectionDepth = element ? [...function* () { for (let node = element.parentElement; node; node = node.parentElement) yield node; }()]
      .filter(node => node.matches('section, article, [role="region"]')).length : 0;
    // Icon-only actions have no text padding by design; compare them with other
    // icon actions, not with labelled buttons.
    const actionKind = element && ['primaryAction', 'secondaryAction'].includes(sample.role)
      ? (element.textContent.trim() ? 'text' : 'icon') : '';
    // An icon tab is laid out differently by MUI (smaller vertical padding);
    // compare it only with other icon tabs.
    const tabKind = element && sample.role === 'tab' ? (element.querySelector('svg, img') ? 'icon' : 'text') : '';
    const inputKind = element && sample.role === 'textInput'
      ? (element.tagName === 'TEXTAREA' ? 'multiline'
        : element.closest('.MuiInputBase-root')?.querySelector('.MuiInputAdornment-root') ? 'adorned'
        : 'plain')
      : '';
    // A tab strip, a section menu and a breadcrumb trail are different navigation
    // containers with their own padding and borders; compare within each kind.
    const navKind = element && sample.role === 'sectionNav'
      ? (element.matches('[role="tablist"]') || element.querySelector('[role="tab"]') ? 'tabs'
        : /breadcrumb/i.test(element.getAttribute('aria-label') || '') ? 'breadcrumb' : 'menu') : '';
    // A bordered, filled panel is a surface; a bare section is not. Compare the
    // surface treatment of each kind with its own kind.
    const surfaceKind = element && sample.role === 'sectionContainer'
      ? (() => { const style = getComputedStyle(element);
          const filled = !/^rgba?\(0, 0, 0, 0\)$|^transparent$/.test(style.backgroundColor);
          const bordered = parseFloat(style.borderTopWidth) > 0;
          return filled && bordered ? 'surface' : 'plain'; })() : '';
    sample.variant = element?.getAttribute('data-ui-variant') || [element?.matches(':disabled') ? 'disabled' : 'enabled',
      element?.getAttribute('aria-busy') === 'true' ? 'busy' : 'idle',
      element?.matches('[aria-selected="true"], [aria-current="page"], [aria-pressed="true"]') ? 'active' : 'inactive',
      sample.role === 'sectionHeading' ? `depth:${sectionDepth}` : '',
      // A level-3 heading is a sub-heading; compare it with other h3s, not with h2.
      sample.role === 'sectionHeading' ? `level:${element ? element.tagName.toLowerCase() : 'none'}` : '',
      inputKind, tabKind, surfaceKind, actionKind, navKind].filter(Boolean).join(':');
  }
  const fixedBars = [...document.querySelectorAll('body *')].filter(element => {
    if (!visible(element)) return false;
    const style = getComputedStyle(element), box = rect(element);
    return ['fixed', 'sticky'].includes(style.position) && box.width >= innerWidth * 0.6 && box.height <= innerHeight * 0.35 && box.bottom > 0 && box.top < innerHeight;
  });
  const navigationTargets = [...new Set([...main.querySelectorAll(roles.sectionNavItem)])].filter(visible).map((element, index) => {
    const navigation = element.closest('nav, [role="navigation"], [role="tablist"]');
    const windowElement = element.closest('.MuiTabs-scroller') || navigation;
    const bounds = rect(windowElement), box = rect(element), labelBounds = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let text;
    while ((text = walker.nextNode())) {
      if (!text.textContent.trim()) continue;
      const range = document.createRange(); range.selectNodeContents(text);
      labelBounds.push(...[...range.getClientRects()].map(value => ({ left: value.left, right: value.right, top: value.top, bottom: value.bottom })));
    }
    const lines = [...new Set(labelBounds.map(value => Math.round(value.top)))];
    const charactersPerLine = new Map();
    if (lines.length > 1) {
      const characters = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = characters.nextNode())) for (let i = 0; i < node.textContent.length; i++) {
        if (!node.textContent[i].trim()) continue;
        const range = document.createRange(); range.setStart(node, i); range.setEnd(node, i + 1);
        for (const box of range.getClientRects()) if (box.width > 0 && box.height > 0) {
          const key = Math.round(box.top); charactersPerLine.set(key, (charactersPerLine.get(key) || 0) + 1);
        }
      }
    }
    // Breadcrumbs are secondary navigation with a 24px minimum target, not the
    // 44px section-menu contract. A trail inside a nav, or a nav named as one.
    const breadcrumb = element.closest('nav[aria-label*="breadcrumb" i], [role="navigation"][aria-label*="breadcrumb" i]')
      || (navigation && navigation.querySelector(':scope > ol') ? navigation : null);
    return { status: 'measured', selector: selector(element), identity: { role: 'sectionNavItem', name: (element.getAttribute('aria-label') || element.textContent).trim(), index },
      box, kind: element.getAttribute('role') === 'tab' ? 'tab' : breadcrumb ? 'breadcrumb' : 'section-link',
      active: element.matches('[aria-selected="true"], [aria-current="page"], [aria-pressed="true"]'),
      window: bounds, labelBounds, labelWithinWindow: labelBounds.every(value => value.left >= bounds.left - 1 && value.right <= bounds.right + 1 && value.top >= bounds.top - 1 && value.bottom <= bounds.bottom + 1),
      lineCount: lines.length, singleCharacterLine: [...charactersPerLine.values()].some(count => count === 1),
      occludingBars: fixedBars.filter(bar => !bar.contains(element) && box.bottom > 0 && box.top < innerHeight && Math.min(box.right, rect(bar).right) - Math.max(box.left, rect(bar).left) > 1 && Math.min(box.bottom, rect(bar).bottom) - Math.max(box.top, rect(bar).top) > 1).map(bar => ({ selector: selector(bar), box: rect(bar) })) };
  });
  const pageScroller = main.closest('.site-wrapper') || document.scrollingElement;
  const atTop = pageScroller.scrollTop <= 1;
  const atBottom = pageScroller.scrollTop + pageScroller.clientHeight >= pageScroller.scrollHeight - 1;
  const mainBounds = rect(main);
  // Tabs, section links and breadcrumbs are different kinds of navigation; compare
  // them only with their own kind, never with each other.
  const navKinds = new Map(navigationTargets.map(target => [target.selector, target.kind]));
  for (const sample of samples) {
    if (sample.role !== 'sectionNavItem') continue;
    const kind = navKinds.get(sample.selector);
    if (kind) sample.variant = `${kind}:${sample.variant}`;
  }
  const fixedBarClearance = { status: 'measured', atTop, atBottom, content: mainBounds,
    checks: fixedBars.filter(bar => !main.contains(bar)).map(bar => {
      const box = rect(bar), topBar = box.top <= 1 || box.top < innerHeight / 3;
      return { bar: { selector: selector(bar), box }, boundary: topBar ? 'top' : 'bottom',
        applicable: topBar ? atTop : atBottom,
        clearance: topBar ? mainBounds.top - box.bottom : box.top - mainBounds.bottom };
    }) };
  const problems = [];
  const controlTargets = [];
  if (document.documentElement.scrollWidth > innerWidth + 1) problems.push({ role: 'document', selector: 'html', property: 'horizontalOverflow', observed: document.documentElement.scrollWidth - innerWidth, severity: 'high' });
  // Native inputs inside styled controls (switch, checkbox, radio, slider, file)
  // are intentionally hidden; their box is not visible clipping.
  const hiddenControlInput = element => element.matches('input[type="checkbox"], input[type="radio"], input[type="range"], input[type="file"]')
    || Boolean(element.closest('.MuiSwitch-root, .MuiCheckbox-root, .MuiRadio-root, .MuiSlider-root, .MuiRating-root'));
  for (const element of [...document.querySelectorAll('button, input, select, textarea, [role="button"], h1, h2, h3')].filter(element => (main.contains(element) || element.closest('[role="dialog"]')) && visible(element) && !hiddenControlInput(element))) {
    const box = rect(element), style = getComputedStyle(element);
    const tablist = element.closest('[role="tablist"]');
    const identity = { role: element.getAttribute('role') || element.tagName.toLowerCase(),
      name: (element.getAttribute('aria-label') || element.textContent || '').trim().replace(/\s+/g, ' ').toLowerCase(),
      tablistIndex: tablist ? [...main.querySelectorAll('[role="tablist"]')].indexOf(tablist) : null };
    const target = { identity, selector: selector(element), box, clippingPixels: 0 };
    controlTargets.push(target);
    // Scrollable lists may intentionally contain off-screen controls. Only flag
    // clipping by a non-scrollable ancestor, not ordinary page/list scrolling.
    for (let ancestor = element.parentElement; ancestor && ancestor !== main; ancestor = ancestor.parentElement) {
      const ancestorStyle = getComputedStyle(ancestor), bounds = rect(ancestor);
      // A hidden-overflow ancestor that actually scrolls (wider content than its
      // window) is a scroll strip, not clipping. Those items are reachable.
      const scroller = element.closest('.MuiTabs-scroller');
      const scrollStrip = (ancestor.scrollWidth || 0) > (ancestor.clientWidth || 0) + 2
        || Boolean(scroller && scroller.scrollWidth > scroller.clientWidth + 2);
      if (!scrollStrip && ['hidden', 'clip'].includes(ancestorStyle.overflowX) && (box.left < bounds.left - 2 || box.right > bounds.right + 2)) {
        const pixels = Math.round(Math.max(bounds.left - box.left, box.right - bounds.right) * 100) / 100;
        target.clippingPixels = pixels;
        let tabScrollWindow = null;
        const scroller = element.closest('.MuiTabs-scroller');
        const tabs = scroller?.closest('.MuiTabs-root');
        if (identity.role === 'tab' && tablist && scroller && (ancestor === scroller || ancestor === tabs)) {
          const scrollBounds = rect(scroller);
          let labelWithinWindow = true;
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
          let text;
          while ((text = walker.nextNode())) {
            if (!text.textContent.trim()) continue;
            const range = document.createRange(); range.selectNodeContents(text);
            if ([...range.getClientRects()].some(value => value.left < scrollBounds.left - 1 || value.right > scrollBounds.right + 1)) labelWithinWindow = false;
          }
          tabScrollWindow = { selector: selector(scroller), bounds: scrollBounds, clippingAncestor: ancestor.className,
            selected: element.getAttribute('aria-selected') === 'true', scrollWidth: scroller.scrollWidth, clientWidth: scroller.clientWidth,
            // MUI's visual arrow can be aria-hidden because tab keyboard
            // navigation owns accessibility. Check the visual affordance here;
            // classification separately requires the passing keyboard contract.
            hasEnabledScrollButton: [...(tabs?.querySelectorAll('.MuiTabScrollButton-root:not(.Mui-disabled)') || [])].some(button => {
              const style = getComputedStyle(button), box = rect(button);
              return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0 && button.getAttribute('aria-disabled') !== 'true';
            }),
            labelWithinWindow, visibleHitWidth: Math.max(0, Math.min(box.right, scrollBounds.right) - Math.max(box.left, scrollBounds.left)) };
        }
        problems.push({ role: 'control', selector: selector(element), property: 'clippedByAncestor', observed: pixels,
          observedBox: box, target: identity, tabScrollWindow, container: bounds, severity: 'medium' });
        break;
      }
    }
    if (element.textContent.trim().length > 5 && box.width < parseFloat(style.fontSize) * 1.6 && box.height > parseFloat(style.fontSize) * 3) problems.push({ role: 'text', selector: selector(element), property: 'oneCharacterWrapping', observed: box, severity: 'medium' });
  }
  for (const dialog of [...document.querySelectorAll('[role="dialog"]')].filter(visible)) {
    const box = rect(dialog);
    if (box.left < -1 || box.right > innerWidth + 1 || box.top < -1 || box.bottom > innerHeight + 1) problems.push({ role: 'dialog', selector: selector(dialog), property: 'outsideViewport', observed: box, severity: 'high' });
  }
  const pageHeader = main.querySelector('[data-ui-page-header]');
  return { viewport: { width: innerWidth, height: innerHeight }, heading: heading ? details(heading) : null,
    // Header placement differs by page type; only compare within a variant.
    headerVariant: pageHeader?.getAttribute('data-ui-page-header') || null,
    headingContainer: heading ? details(heading.closest('.ui-page-heading, header') || heading.parentElement) : null,
    shell: { ...details(shell), variant: [...shell.classList].find(name => name.startsWith('ui-page--')) || 'legacy',
      firstSectionOffset: firstSection ? rect(firstSection).top - rect(shell).top : null,
       columns: getComputedStyle(firstSection || shell).gridTemplateColumns }, samples, controlTargets, problems,
     fillTargets, fillCoverage: { candidates: fillTargets.length, measured: fillTargets.filter(value => value.status === 'measured').length,
       unmeasurable: fillTargets.filter(value => value.status === 'unmeasurable').length, notVisible: fillTargets.filter(value => value.status === 'not-visible').length },
     navigationTargets, fixedBarClearance, fixedBars: fixedBars.map(element => ({ selector: selector(element), box: rect(element) })) };
}
module.exports = { measureUi };
