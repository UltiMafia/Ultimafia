import path from "node:path";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Browser regression for the in-game Settings menu (test/settingsMenu.browser.jsx).
// Production build of a test-only entry; it never ships with the application.
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/settingsMenu.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: { title: "Settings menu regression" },
  server: { publicDir: { name: "public", copyOnBuild: false } },
  output: {
    distPath: { root: "./build_public/settings-menu-test" },
    cleanDistPath: true,
  },
  tools: {
    rspack: {
      resolve: {
        modules: [process.env.NODE_PATH || "node_modules", path.resolve("./src"), "node_modules"],
      },
    },
  },
});
