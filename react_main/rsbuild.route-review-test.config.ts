import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Build with --no-env. No production environment or credentials are needed.
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/routeReview.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
    define: {
      "import.meta.env.REACT_APP_FIREBASE_API_KEY": JSON.stringify("fake-route-review-public-key"),
      "import.meta.env.REACT_APP_FIREBASE_AUTH_DOMAIN": JSON.stringify("route-review.invalid"),
      "import.meta.env.REACT_APP_FIREBASE_PROJECT_ID": JSON.stringify("fake-route-review"),
      "import.meta.env.REACT_APP_FIREBASE_STORAGE_BUCKET": JSON.stringify("route-review.invalid"),
      "import.meta.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID": JSON.stringify("000000000000"),
      "import.meta.env.REACT_APP_FIREBASE_APP_ID": JSON.stringify("1:000000000000:web:fake-route-review"),
      "import.meta.env.REACT_APP_FIREBASE_MEASUREMENT_ID": JSON.stringify("G-FAKEREVIEW"),
      "import.meta.env.REACT_APP_RECAP_SKIP": JSON.stringify("[]"),
      "import.meta.env.REACT_APP_URL": JSON.stringify("http://127.0.0.1"),
    },
  },
  html: {
    title: "UltiMafia route BEFORE review — synthetic local data",
    tags: [{ tag: "link", attrs: { rel: "stylesheet", href: "/css/fontawesome.min.css" }, head: true }],
  },
  performance: { buildCache: false },
  output: {
    dataUriLimit: { image: 0 },
    distPath: { root: process.env.ROUTE_BUNDLE_DIR || "/tmp/opencode/ultimafia-route-review-browser" },
    sourceMap: false,
  },
});
