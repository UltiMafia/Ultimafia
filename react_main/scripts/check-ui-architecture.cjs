// Prevent new alternate UI systems while existing interfaces migrate. The
// baseline is explicit debt, not permission for additional legacy controls.
const fs = require("node:fs");
const path = require("node:path");
const { parse } = require("@babel/parser");
const root = path.resolve(__dirname, "../src");
const baselinePath = path.resolve(__dirname, "../test/ui-architecture-baseline.json");
const controls = new Set(["Button", "IconButton", "TextField", "Typography", "Dialog", "DialogTitle", "DialogContent", "DialogActions", "Modal", "Select", "Menu", "MenuItem", "Tabs", "Tab", "Checkbox", "Radio", "RadioGroup", "Switch", "Slider", "CircularProgress", "LinearProgress", "Skeleton", "Card", "Paper"]);

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
    }
    if (node.type === "JSXOpeningElement" && ["button", "input", "select", "textarea", "dialog"].includes(node.name?.name)) add(`native:${node.name.name}`);
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
    const allowed = baseline[file]?.[kind] || 0;
    if (count > allowed) violations.push(`${file}: ${kind} ${count} > ${allowed}; use components/ui or explicitly review a game-content exception`);
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
  return violationsFor(inventory(), JSON.parse(fs.readFileSync(baselinePath, "utf8")));
}
module.exports = { countLegacyUi, violationsFor, check };
if (require.main === module) {
  if (process.argv.includes("--write-baseline")) {
    fs.writeFileSync(baselinePath, JSON.stringify(inventory(), null, 2) + "\n");
    console.log("Wrote explicit legacy inventory. Review baseline additions; never regenerate it to hide violations.");
  } else if (process.argv.includes("--extend-surface-baseline")) {
    const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
    for (const [file, counts] of Object.entries(inventory())) for (const kind of ["mui:Card", "mui:Paper"]) {
      if (counts[kind] && baseline[file]?.[kind] === undefined) (baseline[file] ||= {})[kind] = counts[kind];
    }
    fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + "\n");
    console.log("Added reviewed pre-existing Card/Paper import debt only; no other exception budget changed.");
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
    else console.log("UI architecture check passed: no new direct controls, browser dialogs or alternate icon/loading imports outside components/ui.");
  }
}
