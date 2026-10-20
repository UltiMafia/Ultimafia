import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Browser regression for the pregame seat button (test/seatActions.browser.jsx).
// Production build of a test-only entry; it never ships with the application.
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/seatActions.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: { title: "Seat actions regression" },
  output: {
    distPath: { root: "/tmp/ultimafia-seat-actions-browser" },
    cleanDistPath: true,
  },
});
