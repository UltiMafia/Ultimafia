import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Browser regression for the ready check dialog (test/readyCheck.browser.jsx).
// Production build of a test-only entry; it never ships with the application.
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/readyCheck.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: { title: "Ready check regression" },
  output: {
    distPath: { root: "/tmp/ultimafia-ready-check-browser" },
    cleanDistPath: true,
  },
});
