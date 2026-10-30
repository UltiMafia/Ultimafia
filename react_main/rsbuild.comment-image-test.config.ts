import path from "node:path";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Isolated comment composer fixture; never part of the application entry.
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/commentImage.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: { title: "Comment image paste regression" },
  server: { publicDir: { name: "public", copyOnBuild: false } },
  output: {
    distPath: { root: "./build_public/comment-image-test" },
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
