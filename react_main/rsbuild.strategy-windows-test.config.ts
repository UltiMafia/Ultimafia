import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Test-only entry, never included in the application build.
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/strategyWindows.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: {
    title: "Floating strategy windows",
    // The icon font the real app links from public/index.html; the runner
    // serves public/ under /public-assets so the header buttons show glyphs.
    tags: [
      {
        tag: "link",
        attrs: { rel: "stylesheet", href: "/public-assets/css/fontawesome.min.css" },
      },
    ],
  },
  output: {
    distPath: { root: "/tmp/opencode/ultimafia-strategy-windows-browser" },
    cleanDistPath: true,
  },
});
