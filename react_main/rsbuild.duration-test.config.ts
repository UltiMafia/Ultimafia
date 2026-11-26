import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
export default defineConfig({
  plugins: [pluginReact()],
  source: { entry: { index: "./test/duration.browser.jsx" }, tsconfigPath: "./jsconfig.json" },
  html: { title: "Duration settings regression" },
  output: { distPath: { root: "/tmp/ultimafia-duration-browser" }, cleanDistPath: true },
});
