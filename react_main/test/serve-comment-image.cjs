// Serve only the isolated fixture on loopback; never proxy live requests.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const directory = path.resolve(process.argv[2] || path.join(__dirname, "../build_public/comment-image-test"));
const port = Number(process.argv[3] || 4179);
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX1EAAAAASUVORK5CYII=", "base64");
http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (/^\/api\/comment\/fixture[0-9]+\/image$/.test(url.pathname)) {
    res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "no-store" });
    return res.end(png);
  }
  if (req.method !== "GET") {
    res.writeHead(405);
    return res.end("Fixture has no server-side mutation endpoints.");
  }
  const filename = path.resolve(directory, "." + decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname));
  if (!filename.startsWith(directory + path.sep) || !fs.existsSync(filename) || fs.statSync(filename).isDirectory()) {
    res.writeHead(404);
    return res.end("Not found.");
  }
  const type = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".woff2": "font/woff2" }[path.extname(filename)] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
  fs.createReadStream(filename).pipe(res);
}).listen(port, "127.0.0.1", () => console.log(`Comment fixture: http://127.0.0.1:${port}`));
