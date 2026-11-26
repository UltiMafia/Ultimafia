import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/miniprofile-winrates.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  output: { distPath: { root: "/tmp/ultimafia-miniprofile-winrates" }, cleanDistPath: true },
  html: {
    title: "Miniprofile win rates fixture",
    tags: ["main", "user", "fontawesome.min"].map((name) => ({
      tag: "link",
      attrs: { rel: "stylesheet", href: `/css/${name}.css` },
    })),
  },
});
