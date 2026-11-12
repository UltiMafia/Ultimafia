// Guard only new one-off paths while the existing legacy layout is migrated.
// The reference is the verified setup/tab repair, not a regenerated allowlist.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { parse } = require('@babel/parser');
const postcss = require('postcss');
const root = path.resolve(__dirname, '../..');
const migrationReference = 'd2999dd6436ae412b6cbbd898d0266b0b786ace7';
const migrationDescription = 'verified setup/tab repair before fill/navigation detectors';
const widths = new Set(['width', 'minWidth', 'maxWidth', 'inlineSize', 'minInlineSize', 'maxInlineSize', 'flexBasis', 'gridTemplateColumns']);
const safeWidth = value => /^(?:0|100%|auto|none|inherit|initial|unset|revert(?:-layer)?|var\(--ui-[\w-]+\))$/.test(String(value).trim());
function layoutSignatures(source, filename) {
  const result = [];
  if (filename.endsWith('.css')) {
    postcss.parse(source).walkRules(rule => {
      const context = []; for (let p = rule.parent; p?.type === 'atrule'; p = p.parent) context.unshift(`@${p.name} ${p.params}`);
      rule.walkDecls(decl => {
        const property = decl.prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        if (widths.has(property) && !safeWidth(decl.value)) result.push(`width:${context.join('|')}:${rule.selector}:${decl.prop}:${decl.value.replace(/\s+/g, ' ')}`);
        if (/(?:^|[.\s#-])(?:nav(?:igation)?|tabs)(?:$|[\s._:#>-])/.test(rule.selector)) result.push(`navigation-css:${context.join('|')}:${rule.selector}:${decl.prop}:${decl.value.replace(/\s+/g, ' ')}`);
      });
    });
  } else if (/\.[jt]sx?$/.test(filename)) {
    const ast = parse(source, { sourceType: 'unambiguous', plugins: ['jsx', 'typescript', 'decorators-legacy'] });
    const text = node => source.slice(node.start, node.end).replace(/\s+/g, ' ');
    const visit = node => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'ObjectProperty' && widths.has(node.key.name || node.key.value) && !safeWidth(node.value.value)) result.push(`width-object:${text(node)}`);
      if (node.type === 'JSXOpeningElement') {
        const name = node.name.name;
        const nav = name === 'nav' || node.attributes.some(attribute => ['role', 'component', 'as'].includes(attribute.name?.name) && ['nav', 'navigation', 'tablist'].includes(attribute.value?.value));
        if (nav) result.push(`navigation-jsx:${text(node)}`);
        for (const attribute of node.attributes) {
          const value = attribute.value?.value ?? attribute.value?.expression?.value;
          const sharedWidth = name === 'UiPage' && attribute.name?.name === 'width';
          if (widths.has(attribute.name?.name) && !sharedWidth && !safeWidth(value)) result.push(`width-jsx:${name}:${text(attribute)}`);
        }
      }
      for (const [key, value] of Object.entries(node)) {
        if (['loc', 'start', 'end', 'extra', 'comments', 'tokens'].includes(key)) continue;
        if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === 'object') visit(value);
      }
    };
    visit(ast);
  }
  return result;
}
function newLayoutPatterns(current, previous) {
  const budget = new Map();
  for (const value of previous) budget.set(value, (budget.get(value) || 0) + 1);
  return current.filter(value => { const count = budget.get(value) || 0; if (count) { budget.set(value, count - 1); return false; } return true; });
}
function checkLayoutChanges() {
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  try { git(['cat-file', '-e', `${migrationReference}^{commit}`]); }
  catch (_) { return [`Layout guard requires history containing the ${migrationDescription}; fetch full Git history rather than bypassing the guard.`]; }
  const changed = git(['diff', '--name-only', migrationReference, '--', 'react_main/src']).trim().split('\n');
  const untracked = git(['ls-files', '--others', '--exclude-standard', '--', 'react_main/src']).trim().split('\n');
  const violations = [];
  for (const file of new Set([...changed, ...untracked])) {
    if (!file || file.startsWith('react_main/src/components/ui/') || !/\.(?:css|[jt]sx?)$/.test(file) || !fs.existsSync(path.join(root, file))) continue;
    let previous = ''; try { previous = git(['show', `${migrationReference}:${file}`]); } catch (_) { /* New files have no legacy budget. */ }
    for (const signature of newLayoutPatterns(layoutSignatures(fs.readFileSync(path.join(root, file), 'utf8'), file), layoutSignatures(previous, file))) violations.push(`${file}: new one-off ${signature}; use shared navigation/width variants, not another legacy path`);
  }
  return violations;
}
module.exports = { layoutSignatures, newLayoutPatterns, checkLayoutChanges, migrationReference, migrationDescription };
if (require.main === module) { const violations = checkLayoutChanges(); if (violations.length) { console.error(violations.join('\n')); process.exitCode = 1; } else console.log('No new one-off navigation or widths. Existing migration debt is not accepted layout.'); }
