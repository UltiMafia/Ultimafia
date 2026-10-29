import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Browser regression for the site-ban page (test/banned.browser.jsx).
// Production build of a test-only entry; it never ships with the application.
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/banned.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: { title: "Ban page regression" },
  output: {
    distPath: { root: "/tmp/ultimafia-banned-browser" },
    cleanDistPath: true,
  },
});
