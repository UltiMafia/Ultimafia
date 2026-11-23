import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/stateSwitcher.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: {
    title: "Mobile state switcher experiment — fixture",
    tags: [{ tag: "link", attrs: { rel: "stylesheet", href: "/css/fontawesome.min.css" } }],
  },
  output: { distPath: { root: "build-chat-perf" }, dataUriLimit: { image: 0 } },
});
