// Prevent new alternate UI systems while existing interfaces migrate. The
// baseline is explicit debt, not permission for additional legacy controls.
const fs = require("node:fs");
const path = require("node:path");
const { parse } = require("@babel/parser");
const root = path.resolve(__dirname, "../src");
const baselinePath = path.resolve(__dirname, "../test/ui-architecture-baseline.json");
const controls = new Set(["Button", "IconButton", "TextField", "Typography", "Dialog", "DialogTitle", "DialogContent", "DialogActions", "Modal", "Select", "Menu", "MenuItem", "Tabs", "Tab", "Checkbox", "Radio", "RadioGroup", "Switch", "Slider", "CircularProgress", "LinearProgress", "Skeleton", "Card", "Paper"]);
const legacyHeaders = /(?:^|\s)(?:page-heading|forum-directory-heading|moderation-heading|setup-editor-heading|deck-editor-heading)(?:\s|$)/;
// This is an in-game information panel, not a site page title. Preserving its
// competitive-workspace geometry is intentional; no site page is exempt.
const headingAllowlist = { "pages/Game/Game.jsx": { "title:h1": 1, reason: "Existing mobile Game info panel; not site navigation or a page shell" } };
const headingCssAllowlist = {
  "css/redesign.css": { ".game-mobile-info h1": "Existing competitive mobile information-panel hierarchy" },
  "css/markdown.css": { ".md-content h1, .md-content h2, .md-content h3, .md-content h4, .md-content h5, .md-content h6": "Authored Markdown, not a product page header" },
  "css/user.css": { ".family-profile-panel .bio :is(h1, h2, h3, h4)": "Authored family bio typography within user media" },
};
function literalStrings(node) {
  if (!node || typeof node !== "object") return [];
  if (node.type === "StringLiteral") return [node.value];
  if (node.type === "TemplateElement") return [node.value.cooked || node.value.raw];
  return Object.entries(node).filter(([key]) => !["loc", "start", "end", "extra"].includes(key)).flatMap(([, value]) => Array.isArray(value) ? value.flatMap(literalStrings) : literalStrings(value));
}
function attributeValues(node) {
  if (!node) return [];
  if (node.type === "JSXExpressionContainer") return attributeValues(node.expression);
  if (node.type === "ConditionalExpression") return [...attributeValues(node.consequent), ...attributeValues(node.alternate)];
  if (node.type === "LogicalExpression") return [...attributeValues(node.left), ...attributeValues(node.right)];
  if (node.type === "StringLiteral") return [node.value];
  // Computed values are validated by the primitive at runtime. In particular,
  // a string inside a predicate (pathname.endsWith('/faq')) is not its value.
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) return [node.quasis.map(part => part.value.cooked).join("")];
  return [];
}

function countLegacyUi(source, filename = "example.jsx") {
  const ast = parse(source, { sourceType: "unambiguous", plugins: ["jsx", "typescript", "decorators-legacy"] });
  const counts = {};
  const add = key => { counts[key] = (counts[key] || 0) + 1; };
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "ImportDeclaration") {
      const name = node.source.value;
      if (name === "@mui/material") {
        for (const specifier of node.specifiers) {
          const imported = specifier.imported?.name;
          if (controls.has(imported)) add(`mui:${imported}`);
          if (specifier.type === "ImportNamespaceSpecifier") add("mui:namespace");
        }
      } else if (name.startsWith("@mui/material/") && controls.has(name.split("/")[2])) add(`mui:${name.split("/")[2]}`);
      else if (name.startsWith("@mui/icons-material") || name === "react-loading" || name === "react-dropdown") add(`alternate:${name}`);
      else if (name === "@iconify/react" || /^(?:lucide|react-icons|@fortawesome)(?:[-/]|$)/.test(name)) add(`alternate:${name}`);
    }
    if (node.type === "JSXOpeningElement") {
      if (["button", "input", "select", "textarea", "dialog"].includes(node.name?.name)) add(`native:${node.name.name}`);
      if (node.name?.name === "h1") add("title:h1");
      for (const attribute of node.attributes || []) {
        const value = attribute.value?.value;
        if (["component", "variant", "as"].includes(attribute.name?.name) && value === "h1") add("title:h1");
        if (attribute.name?.name === "headingLevel" && (value === "1" || attribute.value?.expression?.value === 1)) add("title:h1");
        if (attribute.name?.name === "className" && literalStrings(attribute.value).some(value => legacyHeaders.test(value))) add("header:legacy");
        if (["UiPage", "UiPageHeader"].includes(node.name?.name) && ["style", "sx"].includes(attribute.name?.name)) add("header:inline-override");
        if (["UiCard", "UiStatRow", "UiTable"].includes(node.name?.name) && ["style", "sx"].includes(attribute.name?.name)) add("surface:inline-override");
        if (node.name?.name === "UiTable" && attribute.name?.name === "variant" && attributeValues(attribute.value).some(value => !["records", "comparison"].includes(value))) add("table:unsupported-variant");
        if (node.name?.name === "UiField" && attribute.name?.name === "selectText" && attributeValues(attribute.value).some(value => value !== "wrap")) add("field:unsupported-select-text");
        if (node.name?.name === "UiReferenceList" && attribute.name?.name === "variant" && attributeValues(attribute.value).some(value => !["directory", "picker"].includes(value))) add("reference:unsupported-variant");
        if (["UiReferenceList", "UiReferenceEntry", "UiReferenceToolbar"].includes(node.name?.name) && ["style", "sx"].includes(attribute.name?.name)) add("surface:inline-override");
        if (attribute.name?.name === "className" && literalStrings(attribute.value).some(value => /\b(?:cell-search-grid|cell-search-item|role-cell(?:-[\w-]+)?)\b/.test(value))) add("reference:legacy");
        if (node.name?.name === "UiStatRow" && attribute.name?.name === "variant" && attributeValues(attribute.value).some(value => !["standard", "compact"].includes(value))) add("stat:unsupported-variant");
        if (node.name?.name === "UiPage" && attribute.name?.name === "width" && attributeValues(attribute.value).some(value => !["reading", "wide", "prose", "full"].includes(value))) add("page:unsupported-width");
        if (["UiPage", "UiPageHeader"].includes(node.name?.name) && attribute.name?.name === "variant" && attributeValues(attribute.value).some(value => !["standard", "editor", "moderation", "forum", "detail", "identity"].includes(value))) add("header:unsupported-variant");
      }
    }
    if (node.type === "CallExpression" && node.callee?.type === "MemberExpression" && node.callee.object?.name === "window" && ["confirm", "alert", "prompt"].includes(node.callee.property?.name)) add(`native:${node.callee.property.name}`);
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end", "extra", "comments", "tokens"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  }
  try { visit(ast); } catch (error) { throw new Error(`${filename}: ${error.message}`); }
  return counts;
}
function violationsFor(actual, baseline) {
  const violations = [];
  for (const [file, counts] of Object.entries(actual)) for (const [kind, count] of Object.entries(counts)) {
    const allowed = headingAllowlist[file]?.[kind] || baseline[file]?.[kind] || 0;
    if (count > allowed) violations.push(`${file}: ${kind} ${count} > ${allowed}; use components/ui or explicitly review a game-content exception`);
  }
  return violations;
}
function cssViolations(source, filename) {
  const violations = [];
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const match of withoutComments.matchAll(/([^{}]+)\{/g)) {
    const selector = match[1].trim();
    if (/\.(?:page-heading|forum-directory-heading|moderation-heading|setup-editor-heading|deck-editor-heading)(?![\w-])/.test(selector)) violations.push(`${filename}: removed legacy header selector ${selector}`);
    if (/\.ui-page(?:\b|--)/.test(selector)) violations.push(`${filename}: page geometry belongs in components/ui/ui.css, not ${selector}`);
    if (/\.ui-table(?:\b|--)/.test(selector)) violations.push(`${filename}: shared table presentation belongs in components/ui/ui.css, not ${selector}`);
    if (/\.ui-reference(?:\b|--|-)/.test(selector)) violations.push(`${filename}: reference layout belongs in components/ui/ui.css, not ${selector}`);
    if (/\.(?:ui-field--wrap-select|ui-select-options--wrap)\b/.test(selector)) violations.push(`${filename}: select text presentation belongs in components/ui/ui.css, not ${selector}`);
    if (/\.(?:cell-search-grid|cell-search-item|role-cell)(?:\b|-)/.test(selector)) violations.push(`${filename}: removed legacy reference selector ${selector}`);
    if (/\bh1\b/.test(selector) && !headingCssAllowlist[filename]?.[selector.replace(/\s+/g, " ")]) violations.push(`${filename}: page-title CSS belongs in components/ui/ui.css; authored-content exceptions require review: ${selector}`);
  }
  return violations;
}
function checkCss(directory = root) {
  const violations = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (absolute !== path.join(root, "components/ui")) violations.push(...checkCss(absolute));
    } else if (entry.name.endsWith(".css")) violations.push(...cssViolations(fs.readFileSync(absolute, "utf8"), path.relative(root, absolute)));
  }
  return violations;
}
function inventory(directory = root) {
  const result = {};
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (absolute === path.join(root, "components/ui")) continue;
      Object.assign(result, inventory(absolute));
    } else if (/\.[jt]sx?$/.test(entry.name)) {
      const relative = path.relative(root, absolute);
      const counts = countLegacyUi(fs.readFileSync(absolute, "utf8"), relative);
      if (Object.keys(counts).length) result[relative] = counts;
    }
  }
  return result;
}
function check() {
  return [...violationsFor(inventory(), JSON.parse(fs.readFileSync(baselinePath, "utf8"))), ...checkCss()];
}
module.exports = { countLegacyUi, violationsFor, cssViolations, check };
if (require.main === module) {
  if (process.argv.includes("--write-baseline") || process.argv.includes("--extend-surface-baseline")) {
    console.error("Baseline expansion is unsupported. Migrate the offending interface; only --reduce-baseline is available.");
    process.exitCode = 1;
  } else if (process.argv.includes("--reduce-baseline")) {
    const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
    const actual = inventory();
    for (const [file, counts] of Object.entries(baseline)) {
      for (const kind of Object.keys(counts)) {
        if (!actual[file]?.[kind]) delete counts[kind];
        else counts[kind] = Math.min(counts[kind], actual[file][kind]);
      }
      if (!Object.keys(counts).length) delete baseline[file];
    }
    fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + "\n");
    console.log("Reduced legacy budgets to current counts. This operation cannot add exceptions.");
  } else {
    const violations = check();
    if (violations.length) { console.error(violations.join("\n")); process.exitCode = 1; }
    else console.log("UI architecture check passed: no new direct controls, raw page titles, removed header paths or page-geometry CSS overrides outside components/ui.");
  }
}
