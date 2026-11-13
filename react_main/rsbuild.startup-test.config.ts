import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/startup.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
    define: {
      "import.meta.env.REACT_APP_SOCKET_PROTOCOL": JSON.stringify("ws"),
      "import.meta.env.REACT_APP_USE_PORT": JSON.stringify("true"),
    },
  },
  output: { dataUriLimit: { image: 0, media: 0 }, distPath: { root: "/tmp/opencode/ultimafia-startup-browser" } },
});
