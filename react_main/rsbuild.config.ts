import { defineConfig, loadEnv } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

const { publicVars } = loadEnv({ prefixes: ["REACT_APP_"] });

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    template: "./public/index.html",
  },
  entry: {
    index: "./src/index.jsx",
  },
  output: {
    filename: "[name].bundle.js",
    distPath: {
      root: "build",
    },
    sourceMap: {
      js: isProduction ? "source-map" : "eval-source-map",
    },
  },
  devtool: isProduction ? "source-map" : "eval-source-map",
  source: {
    define: publicVars,
    tsconfigPath: "./jsconfig.json",
  },
  server: {
    port: 3001,
    // Listen on all interfaces so Docker/Codespaces port forwarding works.
    host: "0.0.0.0",
    proxy: {
      "/api": process.env.RSBUILD_API_PROXY || "http://backend:3000",
      "/uploads": process.env.RSBUILD_API_PROXY || "http://backend:3000",
    },
  },
});
