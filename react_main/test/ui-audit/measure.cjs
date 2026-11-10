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
    for (let node = element; node && node !== main && parts.length < 5; node = node.parentElement) {
      const siblings = node.parentElement ? [...node.parentElement.children].filter(child => child.tagName === node.tagName) : [node];
      parts.unshift(`${node.tagName.toLowerCase()}${siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(node) + 1})` : ''}`);
    }
    return `${main.id ? `#${CSS.escape(main.id)}` : '.main-content'} ${parts.join(' > ')}`;
  };
  const details = element => {
    const style = getComputedStyle(element);
    return { selector: selector(element), text: (element.getAttribute('aria-label') || element.textContent || '').trim().slice(0, 120), box: rect(element),
      fontSize: parseFloat(style.fontSize), fontWeight: style.fontWeight, lineHeight: style.lineHeight,
      marginTop: parseFloat(style.marginTop), marginBottom: parseFloat(style.marginBottom),
      padding: style.padding, gap: style.gap, maxWidth: style.maxWidth,
      background: style.backgroundColor, border: style.border, radius: style.borderRadius,
      scrollWidth: element.scrollWidth, clientWidth: element.clientWidth };
  };
  const heading = [...main.querySelectorAll('h1, [role="heading"][aria-level="1"], h2')].find(visible);
  const shell = main.querySelector('.ui-page, .inner-content') || main;
  const firstSection = shell.querySelector('.ui-page-content > *, section, .ui-section');
  const roles = {
    primaryAction: '.ui-action--primary, .MuiButton-containedPrimary',
    secondaryAction: '.ui-action--secondary, .MuiButton-outlined',
    textInput: 'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea',
    select: 'select, [role="combobox"]', card: '.ui-card, .MuiCard-root, .MuiPaper-root',
    stat: '.ui-stat', sectionHeading: 'h2, h3', tableHeader: 'th, [role="columnheader"]',
    tab: '[role="tab"]', currency: '.coin-icon', utilityIcon: '.ui-icon',
    emptyState: '[role="status"]', dialog: '[role="dialog"]',
  };
  const samples = Object.entries(roles).flatMap(([role, query]) => [...document.querySelectorAll(query)].filter(element => (main.contains(element) || element.closest('[role="dialog"]')) && visible(element)).map(element => ({ role, ...details(element) })));
  const problems = [];
  if (document.documentElement.scrollWidth > innerWidth + 1) problems.push({ role: 'document', selector: 'html', property: 'horizontalOverflow', observed: document.documentElement.scrollWidth - innerWidth, severity: 'high' });
  for (const element of [...main.querySelectorAll('button, input, select, textarea, [role="button"], h1, h2, h3')].filter(visible)) {
    const box = rect(element), style = getComputedStyle(element);
    // Scrollable lists may intentionally contain off-screen controls. Only flag
    // clipping by a non-scrollable ancestor, not ordinary page/list scrolling.
    for (let ancestor = element.parentElement; ancestor && ancestor !== main; ancestor = ancestor.parentElement) {
      const ancestorStyle = getComputedStyle(ancestor), bounds = rect(ancestor);
      if (['hidden', 'clip'].includes(ancestorStyle.overflowX) && (box.left < bounds.left - 2 || box.right > bounds.right + 2)) {
        problems.push({ role: 'control', selector: selector(element), property: 'clippedByAncestor', observed: box, container: rect(ancestor), severity: 'medium' });
        break;
      }
    }
    if (element.textContent.trim().length > 5 && box.width < parseFloat(style.fontSize) * 1.6 && box.height > parseFloat(style.fontSize) * 3) problems.push({ role: 'text', selector: selector(element), property: 'oneCharacterWrapping', observed: box, severity: 'medium' });
  }
  for (const dialog of [...document.querySelectorAll('[role="dialog"]')].filter(visible)) {
    const box = rect(dialog);
    if (box.left < -1 || box.right > innerWidth + 1 || box.top < -1 || box.bottom > innerHeight + 1) problems.push({ role: 'dialog', selector: selector(dialog), property: 'outsideViewport', observed: box, severity: 'high' });
  }
  return { viewport: { width: innerWidth, height: innerHeight }, heading: heading ? details(heading) : null,
    headingContainer: heading ? details(heading.closest('.ui-page-heading, header') || heading.parentElement) : null,
    shell: { ...details(shell), variant: [...shell.classList].find(name => name.startsWith('ui-page--')) || 'legacy',
      firstSectionOffset: firstSection ? rect(firstSection).top - rect(shell).top : null,
      columns: getComputedStyle(firstSection || shell).gridTemplateColumns }, samples, problems };
}
module.exports = { measureUi };
