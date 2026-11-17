import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import architecture from "../scripts/check-ui-architecture.cjs";

test("production UI cannot add to the explicit legacy-control inventory", () => {
  assert.deepEqual(architecture.check(), []);
});
test("new views reject direct MUI controls, alternate loaders and browser dialogs", () => {
  const counts = architecture.countLegacyUi('import { Button as Action } from "@mui/material"; import Loading from "react-loading"; const view = <button onClick={() => window.confirm("Really?")}>OK</button>;');
  assert.equal(counts["mui:Button"], 1);
  assert.equal(counts["alternate:react-loading"], 1);
  assert.equal(counts["native:button"], 1);
  assert.equal(counts["native:confirm"], 1);
  assert.equal(architecture.violationsFor({ "new.jsx": counts }, {}).length, 4);
});
test("shared controls and MUI layout helpers remain supported", () => {
  assert.deepEqual(architecture.countLegacyUi('import { UiAction, UiDialog, UiField } from "components/ui"; import { Box, Stack } from "@mui/material"; const view = <UiAction>Join</UiAction>;'), {});
});
test("new page implementations cannot reintroduce raw Card/Paper wrappers", () => {
  const counts = architecture.countLegacyUi('import { Card, Paper } from "@mui/material"; const page = <Card><Paper>Content</Paper></Card>;');
  assert.deepEqual(counts, { "mui:Card": 1, "mui:Paper": 1 });
  assert.equal(architecture.violationsFor({ "new-page.jsx": counts }, {}).length, 2);
});
test("legacy exceptions cannot grow, but reductions require no new exemption", () => {
  assert.equal(architecture.violationsFor({ "old.jsx": { "native:button": 3 } }, { "old.jsx": { "native:button": 2 } }).length, 1);
  assert.deepEqual(architecture.violationsFor({ "old.jsx": { "native:button": 1 } }, { "old.jsx": { "native:button": 2 } }), []);
});
test("page titles must use the shared page-header implementation", () => {
  const counts = architecture.countLegacyUi('const page = <><h1>Players</h1><UiText component="h1">Shop</UiText><header className="page-heading">Old</header></>;');
  assert.deepEqual(counts, { "title:h1": 2, "header:legacy": 1 });
  assert.equal(architecture.violationsFor({ "new-page.jsx": counts }, {}).length, 2);
});
test("section primitives cannot be used to bypass the page-title contract", () => {
  assert.deepEqual(architecture.countLegacyUi('const page = <UiSection headingLevel={1} title="Players" />;'), { "title:h1": 1 });
});
test("removed header CSS and external shared-shell overrides are rejected", () => {
  assert.equal(architecture.cssViolations('.page-heading h1 {font-size:40px}.ui-page-heading {margin:0}', 'page.css').length, 3);
  assert.equal(architecture.cssViolations('/* .page-heading {} */ .roster { display:grid }', 'game.css').length, 0);
  assert.equal(architecture.cssViolations('@media(max-width:600px){.ui-page--reading {max-width:300px}}', 'page.css').length, 1);
});
test("page-specific h1 overrides cannot recreate another typography scale", () => {
  assert.equal(architecture.cssViolations('.new-page h1 {font-size:50px}', 'new-page.css').length, 1);
  assert.deepEqual(architecture.cssViolations('.game-mobile-info h1 {font-size:20px}', 'css/redesign.css'), []);
  assert.equal(architecture.cssViolations('.game-mobile-info h1 {font-size:20px}', 'new-page.css').length, 1);
});
test("direct alternate icon families are unsupported even when renamed", () => {
  const counts = architecture.countLegacyUi('import { Icon as Glyph } from "@iconify/react"; import { Coins } from "lucide-react";');
  assert.deepEqual(counts, { "alternate:@iconify/react": 1, "alternate:lucide-react": 1 });
});
test("computed legacy class names and inline header overrides cannot evade the contract", () => {
  const counts = architecture.countLegacyUi('const page = <><header className={`page-heading ${extra}`} /><div className={active ? "moderation-heading" : "other"} /><UiPageHeader title="People" sx={{fontSize:80}} /></>;');
  assert.deepEqual(counts, { "header:legacy": 2, "header:inline-override": 1 });
});
test("page widths and header variants must be explicitly supported by the primitive", () => {
  assert.deepEqual(architecture.countLegacyUi('const page = <UiPage width="custom-narrow" variant="hero" />;'), { "page:unsupported-width": 1, "header:unsupported-variant": 1 });
  assert.deepEqual(architecture.countLegacyUi('const page = <UiPage width={wide ? "full" : "wide"} variant="identity" />;'), {});
  assert.deepEqual(architecture.countLegacyUi('const page = <UiPage width={pathname.endsWith("/faq") ? "prose" : "wide"} />;'), {});
});
test("removed baseline expansion commands fail without modifying the baseline", () => {
  const baseline = new URL('./ui-architecture-baseline.json', import.meta.url);
  const before = fs.readFileSync(baseline, 'utf8');
  for (const flag of ['--write-baseline', '--extend-surface-baseline']) {
    const child = spawnSync(process.execPath, [new URL('../scripts/check-ui-architecture.cjs', import.meta.url).pathname, flag]);
    assert.equal(child.status, 1);
  }
  assert.equal(fs.readFileSync(baseline, 'utf8'), before);
});
test("stat density is named and shared surfaces reject page-specific inline overrides", () => {
  assert.deepEqual(architecture.countLegacyUi('const page = <><UiCard sx={{padding:80}} /><UiStatRow variant="custom" style={{marginTop:19}} /></>;'), { "surface:inline-override": 2, "stat:unsupported-variant": 1 });
  assert.deepEqual(architecture.countLegacyUi('const page = <UiStatRow variant="compact" />;'), {});
});
test("shared tables reject alternate variants and page-specific presentation overrides", () => {
  assert.deepEqual(architecture.countLegacyUi('const page = <UiTable variant="custom" sx={{padding:80}} />;'), { 'table:unsupported-variant': 1, 'surface:inline-override': 1 });
  assert.deepEqual(architecture.countLegacyUi('const page = <UiTable variant="comparison" />;'), {});
  assert.equal(architecture.cssViolations('.ui-table td {font-size:40px}', 'policy.css').length, 1);
});
test("reference directories and setup pickers use named variants without legacy galleries", () => {
  assert.deepEqual(architecture.countLegacyUi('const page = <UiReferenceList variant="cards" style={{gap:80}} />;'), { 'reference:unsupported-variant': 1, 'surface:inline-override': 1 });
  assert.deepEqual(architecture.countLegacyUi('const page = <UiReferenceList variant={editing ? "picker" : "directory"} />;'), {});
  assert.deepEqual(architecture.countLegacyUi('const page = <div className="role-cell" />;'), { 'reference:legacy': 1 });
  assert.equal(architecture.cssViolations('.cell-search-grid {display:grid}', 'learn.css').length, 1);
  assert.equal(architecture.cssViolations('.ui-reference-entry {background:red}', 'learn.css').length, 1);
});
test("long select text uses the shared wrap variant instead of external clipping overrides", () => {
  assert.deepEqual(architecture.countLegacyUi('const field = <UiField select selectText="wrap" />;'), {});
  assert.deepEqual(architecture.countLegacyUi('const field = <UiField select selectText="custom" />;'), { 'field:unsupported-select-text': 1 });
  assert.equal(architecture.cssViolations('.ui-field--wrap-select .MuiSelect-select {white-space:nowrap}', 'report.css').length, 1);
  const source = fs.readFileSync(new URL('../src/components/ReportDialog.jsx', import.meta.url), 'utf8');
  assert.deepEqual(architecture.countLegacyUi(source, 'components/ReportDialog.jsx'), {}, 'migrated report dialog has no alternate frame or controls');
});
test("step navigation has one shared geometry path, not a setup-specific footer", () => {
  assert.deepEqual(architecture.countLegacyUi('const view = <UiStepNavigation currentStep={0} stepCount={3} sticky />;'), {});
  assert.deepEqual(architecture.countLegacyUi('const view = <UiStepNavigation sx={{padding:40}} />;'), { 'step-navigation:inline-override': 1 });
  assert.deepEqual(architecture.countLegacyUi('const view = <div className="setup-step-navigation" />;'), { 'step-navigation:legacy': 1 });
  assert.equal(architecture.cssViolations('.setup-step-navigation {position:sticky}', 'setup.css').length, 1);
  assert.equal(architecture.cssViolations('.ui-step-navigation {padding:40px}', 'setup.css').length, 1);
});
