import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Browser regression for the speech filter panel and its effect on the full-DOM
// and windowed transcripts (test/speechFilters.browser.jsx).
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/speechFilters.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: {
    title: "Speech filters regression",
  },
  output: {
    distPath: {
      root:
        process.env.SPEECH_FILTERS_DIST ||
        "/tmp/ultimafia-speech-filters-browser",
    },
    cleanDistPath: true,
  },
});
