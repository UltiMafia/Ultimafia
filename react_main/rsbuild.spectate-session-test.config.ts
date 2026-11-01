import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Browser regression for the hosted game session identity
// (test/spectateSession.browser.jsx).
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/spectateSession.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: {
    title: "Spectate session regression",
  },
  output: {
    distPath: { root: "/tmp/ultimafia-spectate-session-browser" },
    cleanDistPath: true,
  },
});
