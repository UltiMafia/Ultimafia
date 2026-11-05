import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Browser regression for the login fingerprint gate
// (test/fingerprintGate.browser.jsx). Production build of a test-only entry;
// it never ships with the application.
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/fingerprintGate.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: {
    title: "Fingerprint gate",
  },
  output: {
    distPath: { root: "/tmp/ultimafia-fingerprint-gate-browser" },
    cleanDistPath: true,
  },
});
