import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [pluginReact()],
  source: { entry: { index: "./test/forumReply.browser.jsx" }, tsconfigPath: "./jsconfig.json" },
  html: { title: "Forum inline reply and image fixture" },
  output: {
    distPath: { root: process.env.FORUM_FIXTURE_OUT || "/tmp/ultimafia-forum-reply-browser" },
    cleanDistPath: true,
    copy: [],
    sourceMap: { js: false, css: false },
  },
  server: { publicDir: { copyOnBuild: false } },
  tools: { rspack: { resolve: {
    modules: [process.env.NODE_PATH || "node_modules", path.resolve("./src"), "node_modules"],
  } } },
});
