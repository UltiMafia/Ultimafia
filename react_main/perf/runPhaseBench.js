// Browser-free chat render bench. Replays a recording from
// scripts/gameSim/recordFrames.js into the real history reducer and chat panel
// under jsdom and prints render work per game action.
//   npm i --no-save esbuild jsdom   (or run from a folder that has them)
//   node react_main/perf/runPhaseBench.js <repoRoot> <recording.json>
const path = require("path");
const fs = require("fs");
const esbuild = require("esbuild");
const { JSDOM } = require("jsdom");
const [tree, recFile] = process.argv.slice(2);
const outfile = path.join(require("os").tmpdir(), `phase-bench-${path.basename(tree)}.js`);
(async () => {
  if (!fs.existsSync(outfile) || process.env.REBUILD) {
    await esbuild.build({
      entryPoints: [path.join(tree, "react_main/perf/phaseBenchEntry.jsx")],
      bundle: true, outfile, platform: "browser", format: "iife", globalName: "PhaseBench",
      define: { "process.env.NODE_ENV": "\"development\"", "import.meta.env": "{}" },
      loader: { ".js": "jsx", ".png": "dataurl", ".jpg": "dataurl", ".gif": "dataurl", ".svg": "dataurl", ".webp": "dataurl", ".mp3": "empty", ".ogg": "empty", ".wav": "empty", ".woff": "empty", ".woff2": "empty", ".ttf": "empty", ".css": "empty" },
      nodePaths: [path.join(tree, "react_main/node_modules")],
      absWorkingDir: path.join(tree, "react_main"),
      logLevel: "error", minify: false, jsx: "automatic",
      plugins: [{
        name: "stub-other-games",
        setup(b) {
          b.onLoad({ filter: /pages[\/]Game[\/][A-Za-z]+Game\.jsx$/ }, (args) =>
            /[\/]Game\.jsx$/.test(args.path) ? undefined : { contents: "export default function StubGame() { return null; }", loader: "jsx" });
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
  const rec = JSON.parse(fs.readFileSync(recFile, "utf8"));
  const res = w.PhaseBench.runBench(rec, w.document.getElementById("root"), global.__hooks);
  const sum = (k) => res.reduce((s, r) => s + r[k], 0);
  console.log(JSON.stringify({
    tree: path.basename(tree), kind: rec.kind, N: rec.N, actions: res.length,
    rowsAfter: res[res.length - 1]?.rows,
    commitsPerAction: +(sum("commits") / res.length).toFixed(1),
    renderMsPerAction: +(sum("renderMs") / res.length).toFixed(2),
    wallMsPerAction: +(sum("wallMs") / res.length).toFixed(2),
    firstRowKeptEveryAction: res.every((r) => r.firstRowKept !== false),
  }));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
