// Browser-free chat render bench. Replays a recording from
// scripts/gameSim/recordFrames.js into the real history reducer and chat panel
// under jsdom and prints render work per game action.
//   npm i --no-save esbuild jsdom   (or run from a folder that has them)
//   node react_main/perf/runPhaseBench.js <repoRoot> <recording.json>
const path = require("path");
const fs = require("fs");
const esbuild = require("esbuild");
const { JSDOM } = require("jsdom");
const [tree] = process.argv.slice(2);
const outfile = path.join(require("os").tmpdir(), `ui-checks-${path.basename(tree)}.js`);
(async () => {
  {
    await esbuild.build({
      entryPoints: [path.join(tree, "react_main/perf/checks.jsx")],
      bundle: true, outfile, platform: "browser", format: "iife", globalName: "Checks",
      define: { "process.env.NODE_ENV": "\"development\"", "import.meta.env": "{}" },
      loader: { ".js": "jsx", ".png": "dataurl", ".jpg": "dataurl", ".gif": "dataurl", ".svg": "dataurl", ".webp": "dataurl", ".mp3": "empty", ".ogg": "empty", ".wav": "empty", ".woff": "empty", ".woff2": "empty", ".ttf": "empty", ".css": "empty" },
      nodePaths: [path.join(tree, "react_main/node_modules")],
      absWorkingDir: path.join(tree, "react_main"),
      logLevel: "error", minify: false, jsx: "automatic",
      plugins: [{
        name: "stub-other-games",
        setup(b) {
          b.onLoad({ filter: /pages[\/]Game[\/][A-Za-z]+Game\.jsx$/ }, (args) =>
            /[\/](Game|LiarsDiceGame)\.jsx$/.test(args.path) ? undefined : { contents: "export default function StubGame() { return null; }", loader: "jsx" });
        },
      }],
    });
  }
  const dom = new JSDOM(`<!doctype html><div id="root"></div>`, { url: "http://localhost/", pretendToBeVisual: true, runScripts: "outside-only" });
  const w = dom.window;
  w.matchMedia = w.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
  w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.HTMLElement.prototype.scrollTo = function () {};
  w.Element.prototype.scrollTo = function () {};
  w.IS_REACT_ACT_ENVIRONMENT = true;
  w.require = (p) => Object.assign(new String("/" + p), { default: "/" + p });
  w.console.error = () => {};
  w.eval(fs.readFileSync(outfile, "utf8"));
  const results = w.Checks.runChecks(w.document.getElementById("root"));
  for (const r of results) console.log(`${r.ok ? "ok  " : "FAIL"} ${r.name}${r.ok ? "" : " " + JSON.stringify(r.detail)}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`${results.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
