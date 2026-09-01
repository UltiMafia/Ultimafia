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
    // roles.css alone references ~780 role/modifier images. At rsbuild's
    // default 4KB threshold they were all base64-inlined into the
    // render-blocking index.css, which made it 906KB (87% data: URIs).
    // Emit them as separate files instead so the browser only fetches the
    // ones a page actually uses, and can cache them independently.
    dataUriLimit: {
      image: 0,
      media: 0,
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
    proxy: {
      "/api": "http://backend:3000",
      "/uploads": "http://backend:3000",
    },
  },
});
