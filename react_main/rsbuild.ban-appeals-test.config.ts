import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Browser regression for the admins' Ban Appeals page
// (test/banAppeals.browser.jsx). Production build of a test-only entry; it
// never ships with the application.
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/banAppeals.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: { title: "Ban Appeals regression" },
  output: {
    distPath: { root: "/tmp/ultimafia-ban-appeals-browser" },
    cleanDistPath: true,
  },
});
