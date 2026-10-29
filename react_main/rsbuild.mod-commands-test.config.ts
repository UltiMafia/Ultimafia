import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Regression for the mod command definitions (test/modCommands.browser.jsx).
// Production build of a test-only entry; it never ships with the application.
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/modCommands.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: { title: "Mod commands regression" },
  output: {
    distPath: { root: "/tmp/ultimafia-mod-commands-browser" },
    cleanDistPath: true,
  },
});
