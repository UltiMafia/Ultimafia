import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Separate entry and output: the fixture is never included in the site build.
// Use a production build so React's development checks do not skew phone tests.
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./perf/chat.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: { title: "Ultimafia chat performance test" },
  output: {
    distPath: { root: "build-chat-perf" },
    dataUriLimit: { image: 0, media: 0 },
  },
  server: { host: "0.0.0.0", port: 3002, strictPort: true },
});
