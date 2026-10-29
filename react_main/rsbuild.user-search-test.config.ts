import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Browser regression for UserSearchSelect (test/userSearch.browser.jsx).
// Production build of a test-only entry; it never ships with the application.
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/userSearch.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: { title: "User search regression" },
  output: {
    distPath: { root: "/tmp/ultimafia-user-search-browser" },
    cleanDistPath: true,
  },
});
