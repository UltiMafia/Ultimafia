import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Test-only entry, never included in the application build.
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/lobbyCount.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: { title: "Lobby count regression" },
  output: {
    distPath: { root: "/tmp/opencode/ultimafia-lobby-count-browser" },
    cleanDistPath: true,
  },
});
