import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Browser regression for lobby Join/Spectate navigation
// (test/lobbySpectate.browser.jsx).
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/lobbySpectate.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: {
    title: "Lobby spectate navigation regression",
  },
  output: {
    distPath: { root: "/tmp/ultimafia-lobby-spectate-browser" },
    cleanDistPath: true,
  },
});
