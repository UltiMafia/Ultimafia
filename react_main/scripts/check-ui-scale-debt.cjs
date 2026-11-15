// Burn-down queue for the real UI debt: MUI controls that set their own scale
// values, native form controls, and browser confirm/alert/prompt calls.
// The import-level baseline in ui-architecture-baseline.json is a different
// guard; this file counts actual call sites and must only go down.
const fs = require("node:fs");
const path = require("node:path");
const { parse } = require("@babel/parser");

const root = path.resolve(__dirname, "../..");
const sourceRoot = path.join(root, "react_main/src");
const baselinePath = path.join(root, "react_main/test/ui-scale-debt.json");
const queueDir = path.join(root, "docs/frontend-redesign/debt");

const controls = new Set([
  "Button", "IconButton", "TextField", "Typography", "Dialog", "DialogTitle",
  "DialogContent", "DialogActions", "Modal", "Select", "Menu", "MenuItem",
  "Tabs", "Tab", "Checkbox", "Radio", "RadioGroup", "Switch", "Slider",
  "CircularProgress", "LinearProgress", "Skeleton", "Card", "Paper",
]);
const scalePattern = /fontSize|fontWeight|lineHeight|borderRadius|padding|height|minHeight|maxHeight|width|minWidth|gap/;
const nativeNames = new Set(["button", "input", "select", "textarea", "dialog"]);
// The confirmation service is the single sanctioned native fallback when no
// React host is mounted. It is infrastructure, not a call site to migrate.
const sanctioned = new Set([
  "components/ui/confirm.jsx",
  // The segmented control's option and the tag chip's remove control are native
  // buttons by design; these are the shared primitives, not page-level controls.
  "components/ui/UiSegmentedControl.jsx",
  "components/ui/UiChip.jsx",
]);

function sourceFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...sourceFiles(full));
    else if (/\.jsx?$/.test(entry.name)) files.push(full);
  }
  return files;
}

function scan(file) {
  const text = fs.readFileSync(file, "utf8");
  let ast;
  try {
    ast = parse(text, { sourceType: "unambiguous", plugins: ["jsx", "typescript", "decorators-legacy"] });
  } catch (error) {
    return [{ file, line: 1, kind: "parse-error", name: error.message }];
  }
  const relative = path.relative(sourceRoot, file);
  const imported = new Set();
  const entries = [];
  const snippet = (node) => text.slice(node.start, Math.min(node.end, node.start + 120)).replace(/\s+/g, " ");

  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "ImportDeclaration" && node.source.value === "@mui/material") {
      for (const specifier of node.specifiers) if (controls.has(specifier.imported?.name)) imported.add(specifier.imported.name);
    }
    if (node.type === "ImportDeclaration" && node.source.value.startsWith("@mui/material/")) {
      const name = node.source.value.split("/")[2];
      if (controls.has(name)) imported.add(name);
    }
    if (node.type === "JSXOpeningElement" && imported.has(node.name?.name)) {
      const scaleAttribute = (node.attributes || []).find(
        (attribute) => (attribute.name?.name === "sx" || attribute.name?.name === "style") &&
          scalePattern.test(text.slice(attribute.start, attribute.end)),
      );
      if (scaleAttribute) entries.push({ file: relative, line: node.loc.start.line, kind: "mui-inline-scale", name: node.name.name, snippet: snippet(node) });
    }
    if (node.type === "JSXOpeningElement" && nativeNames.has(node.name?.name)) {
      const attribute = (name) => (node.attributes || []).find((item) => item.name?.name === name);
      const typeAttribute = attribute("type");
      const type = typeAttribute?.value?.value || "";
      const hidden = Boolean(attribute("hidden")) || type === "hidden";
      const customClass = Boolean(attribute("className"));
      const kind = type === "file" ? "native-file"
        : hidden ? "native-hidden"
          : node.name.name === "button" && customClass ? "native-widget"
            : "native-form";
      const scope = /^(?:pages\/Game|components\/gameComponents)\//.test(relative) ? "game" : "site";
      entries.push({ file: relative, line: node.loc.start.line, kind, scope, name: node.name.name, snippet: snippet(node) });
    }
    if (node.type === "CallExpression" && node.callee?.type === "MemberExpression" &&
      node.callee.object?.name === "window" && ["confirm", "alert", "prompt"].includes(node.callee.property?.name)) {
      entries.push({ file: relative, line: node.loc.start.line, kind: "native-confirm", name: `window.${node.callee.property.name}`, snippet: snippet(node) });
    }
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end", "extra", "comments", "tokens"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  };
  visit(ast);
  return entries;
}

function summarise(entries) {
  const byKind = {};
  const byFile = new Map();
  for (const entry of entries) {
    byKind[entry.kind] = (byKind[entry.kind] || 0) + 1;
    byFile.set(entry.file, (byFile.get(entry.file) || 0) + 1);
  }
  const actionable = entries.filter((entry) => !["native-file", "native-hidden"].includes(entry.kind) && entry.scope !== "game").length;
  return {
    byKind,
    actionable,
    sanctioned: entries.filter((entry) => ["native-file", "native-hidden"].includes(entry.kind)).length,
    game: entries.filter((entry) => entry.scope === "game").length,
    files: byFile.size,
    topFiles: [...byFile.entries()].sort((left, right) => right[1] - left[1]).slice(0, 12),
  };
}

function writeQueue(entries, summary) {
  fs.mkdirSync(queueDir, { recursive: true });
  fs.writeFileSync(path.join(queueDir, "queue.json"), JSON.stringify({ generatedAt: new Date().toISOString(), count: entries.length, ...summary, entries }, null, 2));
  const lines = [];
  lines.push("# UI scale debt queue", "");
  lines.push(`Generated ${new Date().toISOString()}. **${entries.length}** sites across **${summary.files}** files.`);
  lines.push("");
  for (const [kind, count] of Object.entries(summary.byKind).sort((left, right) => right[1] - left[1])) lines.push(`- \`${kind}\`: ${count}`);
  lines.push("", "## By file", "", "| File | Sites |", "|---|---|");
  for (const [file, count] of summary.topFiles) lines.push(`| \`${file}\` | ${count} |`);
  lines.push("", "## Sites", "");
  for (const entry of [...entries].sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line)) {
    lines.push(`- \`${entry.file}:${entry.line}\` — ${entry.kind} \`${entry.name}\` — \`${entry.snippet.replace(/`/g, "'")}\``);
  }
  lines.push("");
  fs.writeFileSync(path.join(queueDir, "queue.json"), lines.join("\n"));
}

function main() {
  const entries = sourceFiles(sourceRoot).flatMap(scan).filter((entry) => !sanctioned.has(entry.file));
  const summary = summarise(entries);
  // Lint is read-only; refresh the queue only when explicitly asked.
  if (process.argv.includes("--queue") || process.argv.includes("--update") || !fs.existsSync(path.join(queueDir, "queue.json"))) {
    writeQueue(entries, summary);
  }

  const baseline = fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath, "utf8")) : null;
  const update = process.argv.includes("--update");
  console.log(`UI scale debt: ${entries.length} sites, ${summary.actionable} actionable on site routes`);
  console.log(`  ${Object.entries(summary.byKind).map(([kind, count]) => `${kind} ${count}`).join(", ")}`);
  console.log(`  sanctioned native file/hidden inputs: ${summary.sanctioned}; game-workspace sites: ${summary.game}`);
  console.log(`Queue: ${path.relative(root, path.join(queueDir, "queue.json"))}`);

  if (update) {
    if (baseline && entries.length > baseline.count) {
      console.error(`Refusing to raise the baseline from ${baseline.count} to ${entries.length}. Reduce the queue first.`);
      process.exitCode = 1;
      return;
    }
    fs.writeFileSync(baselinePath, JSON.stringify({ count: entries.length, byKind: summary.byKind, updatedAt: new Date().toISOString() }, null, 2));
    console.log(`Baseline recorded: ${baseline ? `${baseline.count} -> ` : ""}${entries.length}`);
    return;
  }
  if (!baseline) {
    console.error(`No baseline at ${path.relative(root, baselinePath)}. Run npm run ui:debt:update to record the current count.`);
    process.exitCode = 1;
    return;
  }
  if (entries.length > baseline.count) {
    console.error(`UI scale debt grew: ${baseline.count} -> ${entries.length}. Inspect the queue before adding another raw control.`);
    for (const [file, count] of summary.topFiles.slice(0, 8)) console.error(`  ${file}: ${count}`);
    process.exitCode = 1;
    return;
  }
  if (entries.length < baseline.count) {
    console.log(`UI scale debt is down: ${baseline.count} -> ${entries.length}. Run npm run ui:debt:update to lock it in.`);
    return;
  }
  console.log(`Baseline unchanged at ${baseline.count}.`);
}

if (require.main === module) main();
module.exports = { scan, summarise };
