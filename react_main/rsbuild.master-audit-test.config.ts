import path from "node:path";
import { defineConfig } from "@rsbuild/core";
import fixture from "./rsbuild.route-review-test.config";

// The application source is the untouched upstream worktree, NOT this branch.
// The entry only supplies explicit controlled records and blocks real writes.
const master = process.env.UI_AUDIT_MASTER || "/tmp/opencode/ultimafia-master";
export default defineConfig({
  ...fixture,
  source: {
    ...fixture.source,
    entry: { index: "./test/ui-audit/master.browser.jsx" },
    tsconfigPath: path.join(master, "react_main/jsconfig.json"),
    alias: { "audit-master": path.join(master, "react_main/src") },
  },
  html: { ...fixture.html, title: "Actual upstream master — controlled audit records" },
  output: { ...fixture.output, distPath: { root: "/tmp/opencode/ultimafia-master-audit-browser" } },
});
