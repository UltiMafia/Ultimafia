import test from "node:test";
import assert from "node:assert/strict";
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
