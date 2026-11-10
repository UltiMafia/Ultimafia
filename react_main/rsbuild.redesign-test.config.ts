import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/redesign.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: {
    title: "UltiMafia design review · controlled data",
    tags: [{ tag: "link", attrs: { rel: "stylesheet", href: "/css/fontawesome.min.css" }, head: true }],
  },
  output: {
    dataUriLimit: { image: 0 },
    distPath: { root: "/tmp/opencode/ultimafia-redesign-browser" },
  },
});
