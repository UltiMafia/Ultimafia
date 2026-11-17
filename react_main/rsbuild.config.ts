import { defineConfig, loadEnv } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

const { publicVars, rawPublicVars } = loadEnv({ prefixes: ["REACT_APP_"] });

const isProduction = process.env.NODE_ENV === "production";

// Set REACT_APP_REMOTE_BACKEND to a live site (for example
// https://ultimafia.com) to develop this client against that site's real
// backend instead of the local one. The browser keeps talking to this dev
// server only: the API, uploads and WebSocket ports are proxied, so the session
// cookie, CSRF header and socket tokens work exactly as they do on the live
// site. See docs/setup-remote-backend.md.
//
// Development only: a deployed build has no dev-server proxy to forward to, so
// the setting is ignored there and can never ship as a real bundle.
const remoteBackend = isProduction
  ? ""
  : (rawPublicVars.REACT_APP_REMOTE_BACKEND || "").trim().replace(/\/+$/, "");

// nginx routes /chatSocket to the chat server and /30xx to the game servers.
// Keep this range in step with react_main/nginx.conf.
const FIRST_GAME_PORT = 3010;
const LAST_GAME_PORT = 3020;

function envOverride(name, value) {
  return {
    [`process.env.${name}`]: JSON.stringify(value),
    [`import.meta.env.${name}`]: JSON.stringify(value),
  };
}

// In remote mode the game and chat sockets must also stay on the dev server's
// origin, so the client uses the page host with the port in the path.
const clientVars = remoteBackend
  ? {
      ...publicVars,
      ...envOverride("REACT_APP_USE_PORT", "false"),
      ...envOverride("REACT_APP_SOCKET_URI", ""),
    }
  : isProduction
    ? { ...publicVars, ...envOverride("REACT_APP_REMOTE_BACKEND", "") }
    : publicVars;

function remoteProxy() {
  // One entry keeps a single websocket upgrade handler on the dev server; one
  // handler per port trips Node's listener limit and warns at startup.
  const contexts = ["/api", "/uploads", "/chatSocket"];
  for (let port = FIRST_GAME_PORT; port <= LAST_GAME_PORT; port++) {
    contexts.push(`/${port}`);
  }

  return [{ context: contexts, target: remoteBackend, changeOrigin: true, ws: true }];
}

const localProxy = {
  "/api": "http://backend:3000",
  "/uploads": "http://backend:3000",
};

if (remoteBackend) {
  console.log(
    `[dev] API, uploads and sockets are proxied to the remote backend ${remoteBackend}. ` +
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
    define: clientVars,
    tsconfigPath: "./jsconfig.json",
  },
  server: {
    port: 3001,
    proxy: remoteBackend ? remoteProxy() : localProxy,
  },
});
