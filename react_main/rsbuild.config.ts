import { defineConfig, loadEnv } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

const { publicVars, rawPublicVars } = loadEnv({ prefixes: ["REACT_APP_"] });

const isProduction = process.env.NODE_ENV === "production";

// Development only: proxy API, uploads and sockets to the site that owns the
// Firebase project in react_main/.env. A deployed build has no dev proxy, so
// this can never ship in a production bundle.
const remoteBackend = isProduction
  ? ""
  : (rawPublicVars.REACT_APP_REMOTE_BACKEND || "").trim().replace(/\/+$/, "");

// The tailnet/local server routes sockets under /ws/*. A live backend owns the
// /chatSocket and /<game-port> paths, so remote mode uses PR #3204's contract.
const sameOriginSockets =
  !isProduction && !remoteBackend && process.env.UM_DEV_SAME_ORIGIN_SOCKETS === "true";

const FIRST_GAME_PORT = 3010;
const LAST_GAME_PORT = 3020;

function envOverride(name, value) {
  return {
    [`process.env.${name}`]: JSON.stringify(value),
    [`import.meta.env.${name}`]: JSON.stringify(value),
  };
}

const clientVars = remoteBackend
  ? {
      ...publicVars,
      ...envOverride("REACT_APP_USE_PORT", "false"),
      ...envOverride("REACT_APP_SOCKET_URI", ""),
    }
  : publicVars;

const sameOriginDefine = {
  "import.meta.env.REACT_APP_SAME_ORIGIN_SOCKETS": JSON.stringify(sameOriginSockets ? "true" : "false"),
};

function remoteProxy() {
  const contexts = ["/api", "/uploads", "/chatSocket"];
  for (let port = FIRST_GAME_PORT; port <= LAST_GAME_PORT; port++) {
    contexts.push(`/${port}`);
  }
  return [{ context: contexts, target: remoteBackend, changeOrigin: true, ws: true }];
}

const localProxy = {
  "/api": "http://backend:3000",
  "/uploads": "http://backend:3000",
  ...(sameOriginSockets ? {
    "/ws/chat": { target: "http://backend:2999", ws: true },
    "/ws/game/3010": { target: "http://backend:3010", ws: true },
  } : {}),
};

if (remoteBackend) {
  console.log(
    "[dev] API, uploads and sockets are proxied to the configured remote backend. " +
      "Actions taken in this client affect that live site."
  );
}

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
    define: { ...clientVars, ...sameOriginDefine },
    tsconfigPath: "./jsconfig.json",
  },
  server: {
    port: 3001,
    proxy: remoteBackend ? remoteProxy() : localProxy,
  },
});
