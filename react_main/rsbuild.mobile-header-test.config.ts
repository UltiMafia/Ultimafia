import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Browser regression for the phone header row (test/mobileHeader.browser.jsx).
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/mobileHeader.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: {
    title: "Mobile header regression",
    tags: [
      {
        tag: "link",
        attrs: { rel: "stylesheet", href: "/css/fontawesome.min.css" },
        head: true,
        append: false,
      },
    ],
  },
  output: {
    distPath: { root: "/tmp/ultimafia-mobile-header-browser" },
    cleanDistPath: true,
  },
});
