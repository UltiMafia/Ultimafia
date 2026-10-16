import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Isolated, production-mode browser regressions. This entry never ships with
// the application and uses controlled local transport, not the live database.
export default defineConfig({
  plugins: [pluginReact()],
  source: { entry: { index: "./test/browser.jsx" }, tsconfigPath: "./jsconfig.json" },
  html: { title: "UltiMafia lifecycle regressions" },
  output: { distPath: { root: "/tmp/opencode/ultimafia-lifecycle-browser" }, dataUriLimit: { image: 0, media: 0 } },
  server: { host: "127.0.0.1", port: 3003, strictPort: true },
});
