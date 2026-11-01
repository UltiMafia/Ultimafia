// Browser regression for hosted game session identity: entering the same game
// again from a lobby row with the other join intent must remount the game
// session, while ordinary links to that game keep the retained session. Also
// proves the route change stays client-side.
//
//   npx rsbuild build --config rsbuild.spectate-session-test.config.ts
//   PLAYWRIGHT_MODULE=/path/to/playwright node test/run-spectate-session.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

async function main() {
  assert.ok(process.env.PLAYWRIGHT_MODULE, "Set PLAYWRIGHT_MODULE");
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(
    process.argv[2] || "/tmp/ultimafia-spectate-session-browser",
  );
  if (!fs.existsSync(path.join(directory, "index.html")))
    throw new Error("Build the spectate session fixture first.");

  const mime = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
  };
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (pathname === "/favicon.ico") {
      res.writeHead(204);
      return res.end();
    }
    let filename = path.resolve(directory, "." + pathname);
    if (
      !filename.startsWith(directory + path.sep) ||
      !fs.existsSync(filename) ||
      fs.statSync(filename).isDirectory()
    ) {
      if (path.extname(pathname)) {
        res.writeHead(404);
        return res.end();
      }
      filename = path.join(directory, "index.html");
    }
    res.writeHead(200, {
      "Content-Type": mime[path.extname(filename)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(filename).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;

  const passed = [];
  const failed = [];
  const check = (ok, name, detail) => {
    (ok ? passed : failed).push(
      `${name}${detail !== undefined ? " " + JSON.stringify(detail) : ""}`,
    );
  };

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.CHROMIUM_PATH
        ? { executablePath: process.env.CHROMIUM_PATH }
        : {}),
    });
    const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    const click = (name) => page.getByRole("button", { name }).click();
    const waitForUrl = (suffix) =>
      page.waitForFunction(
        (expected) => window.location.pathname + window.location.search === expected,
        suffix,
      );
    const session = () =>
      page.evaluate(() => {
        const el = document.querySelector('[data-testid="game-session"]');
        return {
          text: el ? el.textContent : null,
          mounts: window.__sessionMounts || 0,
          url: window.location.pathname + window.location.search,
          inGame: document.querySelector('[data-testid="in-game"]').textContent,
          membership: document.querySelector('[data-testid="membership"]').textContent,
          request: document.querySelector('[data-testid="request"]').textContent,
        };
      });
    const waitForSession = (text, mounts) =>
      page.waitForFunction(
        ({ text, mounts }) => {
          const el = document.querySelector('[data-testid="game-session"]');
          return (
            el &&
            el.textContent === text &&
            (window.__sessionMounts || 0) === mounts
          );
        },
        { text, mounts },
      );

    await page.goto(origin + "/play");
    await page.waitForFunction(() => window.__sessionReady);
    let state = await session();
    check(state.text === null, "no session while browsing the lobby", state);

    await click("Join g1");
    await waitForUrl("/game/g1?join=true");
    await waitForSession("g1|?join=true|1", 1);
    state = await session();
    check(
      state.inGame === "true" &&
        state.membership === "player" &&
        state.request === "",
      "Join mounts the game session as a player",
      state,
    );

    await click("Play");
    await waitForUrl("/play");
    state = await session();
    check(
      state.text === "g1|?join=true|1" && state.mounts === 1,
      "leaving the game keeps the session mounted",
      state,
    );

    await click("Join g1");
    await waitForUrl("/game/g1?join=true");
    await waitForSession("g1|?join=true|1", 1);
    state = await session();
    check(
      state.mounts === 1 && state.request === "",
      "Join again while already seated does not remount or request a switch",
      state,
    );

    await click("Play");
    await click("Spectate g1");
    await waitForUrl("/game/g1?spectate=true");
    await waitForSession("g1|?spectate=true|1", 1);
    state = await session();
    check(
      state.mounts === 1 && state.request.startsWith("spectator:"),
      "Spectate requests an in-place socket switch without remounting",
      state,
    );

    await click("Apply request");
    await waitForUrl("/game/g1?spectate=true");
    state = await session();
    check(
      state.mounts === 1 &&
        state.membership === "spectator" &&
        state.request === "",
      "confirmed spectator updates the URL without remounting",
      state,
    );

    await click("Play");
    await click("Spectate g1");
    await waitForUrl("/game/g1?spectate=true");
    state = await session();
    check(
      state.mounts === 1 && state.request === "",
      "Spectate again while spectating does nothing",
      state,
    );

    await click("Play");
    await click("Join g1");
    await waitForUrl("/game/g1?join=true");
    await waitForSession("g1|?join=true|1", 1);
    state = await session();
    check(
      state.mounts === 1 && state.request.startsWith("player:"),
      "Join requests an in-place socket switch without remounting",
      state,
    );

    await click("Apply request");
    await waitForUrl("/game/g1");
    state = await session();
    check(
      state.mounts === 1 &&
        state.membership === "player" &&
        state.request === "",
      "confirmed player updates the URL without remounting",
      state,
    );

    await click("Play");
    await click("Plain spectate link g1");
    await waitForUrl("/game/g1?spectate=true");
    state = await session();
    check(
      state.text === "g1||1" && state.mounts === 1 && state.request === "",
      "an ordinary link to the same game keeps the session",
      state,
    );

    await click("Play");
    await click("Join g2");
    await waitForUrl("/game/g2");
    await waitForSession("g2||2", 2);
    check(true, "a different game replaces the session");

    await click("Play");
    await page.goBack();
    await waitForUrl("/game/g2");
    state = await session();
    check(
      state.text === "g2||2" && state.mounts === 2,
      "Back to the same game entry does not replace it again",
      state,
    );

    check(errors.length === 0, "no page errors", errors);
    await page.close();
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  for (const p of passed) console.log("ok   " + p);
  for (const f of failed) console.log("FAIL " + f);
  console.log(`${passed.length} passed, ${failed.length} failed`);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
