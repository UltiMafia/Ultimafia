import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Browser regression for the chat emote picker (test/emotePicker.browser.jsx).
// Production build of a test-only entry; it never ships with the application.
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/emotePicker.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: { title: "Emote picker regression" },
  output: {
    distPath: { root: "/tmp/ultimafia-emote-picker-browser" },
    cleanDistPath: true,
  },
});
