import path from "node:path";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Browser regression for text that follows the site's Font size setting
// (test/run-text-size.cjs). Production build of test-only entries; it never
// ships with the application.
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: "./test/dmPanel.browser.jsx",
      decks: "./test/deckLinks.browser.jsx",
      petition: "./test/petition.browser.jsx",
      ratings: "./test/profileRatings.browser.jsx",
    },
    tsconfigPath: "./jsconfig.json",
  },
  html: { title: "Text size regression" },
  server: { publicDir: { name: "public", copyOnBuild: false } },
  output: {
    distPath: { root: "./build_public/text-size-test" },
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
