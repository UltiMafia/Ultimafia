import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Browser regression for the "Ban Appeals" conversation in the DM window
// (test/dmPanelSite.browser.jsx). Production build of a test-only entry; it
// never ships with the application. Font Awesome is linked first, as in
// public/index.html.
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/dmPanelSite.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: {
    title: "DM panel site conversation regression",
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
    distPath: { root: "/tmp/ultimafia-dm-panel-site-browser" },
    cleanDistPath: true,
  },
});
