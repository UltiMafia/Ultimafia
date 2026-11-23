// Browser regression: reading and input text must follow the site's Font size
// setting, which sets the root (html) font size, and stay usable in small
// windows. Checked at root sizes 16, 20, 24 and 32px.
//
//   npx rsbuild build --config rsbuild.text-size-test.config.ts
//   PLAYWRIGHT_MODULE=/path/to/playwright node test/run-text-size.cjs
//
// Uses an isolated Playwright install (PLAYWRIGHT_MODULE; CHROMIUM_PATH is
// optional), serves the build on loopback and blocks every external request.
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const ROOT_SIZES = [16, 20, 24, 32];

// A thread whose author is the test user, with a petition.
const petitionThread = {
  id: "t1",
  title: "Bring back the weekly themed games",
  content: "Opening post.",
  author: { id: "me", name: "Tester" },
  board: { id: "b1", name: "General" },
  postDate: Date.now() - 3600000,
  replies: [],
  page: 1,
  pageCount: 1,
  voteCount: 0,
  petition: {
    title: "Weekly themed games",
    body: "Run one themed game every weekend, with the setup announced on Friday so people can plan around it.",
    signers: [],
    signCount: 0,
    hasSigned: false,
  },
  rosterUsers: [],
  tagPresets: [],
  mutedTags: [],
  restricted: false,
  isAllowedPoster: true,
  locked: false,
};

async function main() {
  if (!process.env.PLAYWRIGHT_MODULE)
    throw new Error(
      "Set PLAYWRIGHT_MODULE to an isolated Playwright installation.",
    );
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(
    process.argv[2] || "build_public/text-size-test",
  );
  if (!fs.existsSync(path.join(directory, "index.html")))
    throw new Error("Build the text size fixture first.");
  const mime = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
  };
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    let filename = path.resolve(directory, "." + pathname);
    if (
      !filename.startsWith(directory + path.sep) ||
      !fs.existsSync(filename) ||
      fs.statSync(filename).isDirectory()
    ) {
      if (path.extname(pathname)) {
        res.writeHead(404);
        res.end();
        return;
      }
      filename = path.join(directory, "index.html");
    }
    res.writeHead(200, {
      "Content-Type":
        mime[path.extname(filename)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(filename).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const failures = [];
  const passes = [];
  const check = (ok, name, detail) =>
    (ok ? passes : failures).push(
      `${name}${detail ? " " + JSON.stringify(detail) : ""}`,
    );
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.CHROMIUM_PATH
        ? { executablePath: process.env.CHROMIUM_PATH }
        : {}),
    });
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
    });
    const errors = [];
    const open = async (query) => {
      const page = await context.newPage();
      page.on("pageerror", (e) => errors.push(e.message));
      await page.route("**/*", (route) => {
        const u = new URL(route.request().url());
        if (u.hostname === "127.0.0.1" && u.pathname.startsWith("/api/deck/"))
          return route.fulfill({
            contentType: "application/json",
            body: JSON.stringify({ decks: [], pages: 1 }),
          });
        if (u.hostname === "127.0.0.1" && u.pathname.startsWith("/api/forums/thread/"))
          return route.fulfill({
            contentType: "application/json",
            body: JSON.stringify(petitionThread),
          });
        if (u.hostname === "127.0.0.1" && u.pathname.startsWith("/api/setup/"))
          return route.fulfill({
            contentType: "application/json",
            body: JSON.stringify({ name: "Classic twelve-player Mafia" }),
          });
        if (u.hostname === "127.0.0.1" && u.pathname.startsWith("/api/"))
          return route.fulfill({ contentType: "application/json", body: "{}" });
        if (u.protocol === "data:" || u.hostname === "127.0.0.1")
          return route.continue();
        return route.abort();
      });
      await page.goto(url + query);
      await page.waitForFunction(() => window.__fixtureReady);
      return page;
    };
    const setRoot = (page, px) =>
      page.evaluate((v) => (document.documentElement.style.fontSize = `${v}px`), px);
    const near = (a, b) => Math.abs(a - b) <= 0.5;

    // DM conversation list: the conversation name.
    const list = await open("?view=list");
    for (const root of ROOT_SIZES) {
      await setRoot(list, root);
      const m = await list.evaluate(() => {
        const name = [...document.querySelectorAll("p")].find((p) =>
          p.textContent.startsWith("A friend with"),
        );
        return { name: parseFloat(getComputedStyle(name).fontSize) };
      });
      check(near(m.name, root * 0.9375), `DM list, root ${root}px: conversation name ${root * 0.9375}px`, m);
    }

    // DM conversation: title, message bubbles and the composer.
    const convo = await open("?view=conversation");
    for (const [width, height] of [[375, 667], [375, 480]]) {
      await convo.setViewportSize({ width, height });
      for (const root of ROOT_SIZES) {
        await setRoot(convo, root);
        await convo.waitForTimeout(50);
        const m = await convo.evaluate(() => {
          const size = (el) => parseFloat(getComputedStyle(el).fontSize);
          const bubbles = [...document.querySelectorAll('[data-testid="dm-bubble"]')];
          const input = document.querySelector('[data-testid="dm-input"]');
          const chat = document.querySelector('[data-testid="dm-chat"]').getBoundingClientRect();
          const box = input.getBoundingClientRect();
          return {
            title: size(document.querySelector('[data-testid="dm-conversation-title"]')),
            bubble: size(bubbles[0]),
            input: size(input),
            bubblesFit: bubbles.every((b) => b.scrollWidth <= b.clientWidth + 1),
            composerInside: box.bottom <= chat.bottom + 1 && chat.bottom <= window.innerHeight + 1 && box.height > 0,
          };
        });
        check(
          near(m.title, root * 0.9375) && near(m.bubble, root * 0.875) && near(m.input, root * 0.875),
          `DM conversation ${width}x${height}, root ${root}px: title, bubbles and composer follow the root`,
          m,
        );
        check(m.bubblesFit && m.composerInside, `DM conversation ${width}x${height}, root ${root}px: bubbles wrap, composer in view`, m);
      }
    }

    // Deck list (Play > Decks): the Featured / Popular / Yours links.
    const decks = await open("decks.html");
    await decks.waitForSelector(".top-link");
    for (const [width, height] of [[375, 667], [1280, 720]]) {
      await decks.setViewportSize({ width, height });
      for (const root of ROOT_SIZES) {
        await setRoot(decks, root);
        await decks.waitForTimeout(50);
        const m = await decks.evaluate(() => {
          // .top-link transitions every property (--hoverTransition), font
          // size included; read the settled size.
          document.getAnimations().forEach((a) => a.finish());
          const links = [...document.querySelectorAll(".bot-bar .top-link")];
          return {
            sizes: links.map((l) => parseFloat(getComputedStyle(l).fontSize)),
            widths: links.map((l) => Math.round(l.getBoundingClientRect().width)),
            textFits: links.every((l) => l.scrollWidth <= l.clientWidth + 1),
            pageFits: document.documentElement.scrollWidth <= window.innerWidth + 1,
          };
        });
        check(
          m.sizes.length === 3 && m.sizes.every((s) => near(s, root)),
          `Deck links ${width}x${height}, root ${root}px: links ${root}px`,
          m,
        );
        check(m.textFits && m.pageFits, `Deck links ${width}x${height}, root ${root}px: text inside each link, no sideways scroll`, m);
        if (width === 1280 && root === 16)
          // 120px of content plus 5px padding each side, as before.
          check(m.widths.every((w) => w === 130), "Deck links 1280x720, root 16px: links keep their 130px width", m);
      }
    }

    // Forum petition: title, body and Sign button, then the author's edit form.
    const petition = await open("petition.html");
    await petition.waitForSelector(".petition-body", { timeout: 10000 }).catch(async (e) => {
      throw new Error(`${e.message}\npage errors: ${JSON.stringify(errors)}\nalerts: ${JSON.stringify(await petition.evaluate(() => window.__alerts))}
at ${petition.url()}: ${(await petition.innerHTML("body")).slice(0, 400)}`);
    });
    const petitionSizes = () =>
      petition.evaluate(() => {
        document.getAnimations().forEach((a) => a.finish());
        const size = (sel) => {
          const el = document.querySelector(`.thread-wrapper ${sel}`);
          return el && parseFloat(getComputedStyle(el).fontSize);
        };
        const panel = document.querySelector(".petition-panel");
        return {
          title: size(".petition-title"),
          body: size(".petition-body"),
          sign: size(".petition-sign-btn"),
          input: size(".petition-edit-form input"),
          textarea: size(".petition-edit-form textarea"),
          panelFits: !panel || panel.scrollWidth <= panel.clientWidth + 1,
          pageFits: document.documentElement.scrollWidth <= window.innerWidth + 1,
        };
      });
    for (const [width, height] of [[375, 667], [1280, 720]]) {
      await petition.setViewportSize({ width, height });
      for (const root of ROOT_SIZES) {
        await setRoot(petition, root);
        const m = await petitionSizes();
        check(
          near(m.title, root * 0.875) && near(m.body, root * 0.8125) && near(m.sign, root * 0.8125),
          `Petition ${width}x${height}, root ${root}px: title ${root * 0.875}px, body and Sign ${root * 0.8125}px`,
          m,
        );
        check(m.panelFits && m.pageFits, `Petition ${width}x${height}, root ${root}px: no sideways scroll`, m);
      }
    }
    // The icon font is not loaded here, so the icon has no box to click.
    await petition.$eval(".petition-action-btn.fa-pencil-alt", (el) => el.click());
    await petition.waitForSelector(".petition-edit-form textarea");
    for (const root of ROOT_SIZES) {
      await setRoot(petition, root);
      const m = await petitionSizes();
      check(
        near(m.input, root * 0.8125) && near(m.textarea, root * 0.8125),
        `Petition edit form, root ${root}px: fields ${root * 0.8125}px`,
        m,
      );
    }

    // Profile ratings panel: query tabs, setup picker and the four stats.
    const ratings = await open("ratings.html");
    await ratings.waitForSelector(".query-stat-value");
    for (const [width, height] of [[375, 667], [1280, 720]]) {
      await ratings.setViewportSize({ width, height });
      for (const root of ROOT_SIZES) {
        await setRoot(ratings, root);
        const m = await ratings.evaluate(() => {
          document.getAnimations().forEach((a) => a.finish());
          const size = (sel) => parseFloat(getComputedStyle(document.querySelector(`.stats-query ${sel}`)).fontSize);
          const stats = [...document.querySelectorAll(".query-stat")];
          return {
            tab: size(".query-type-tab"),
            select: size(".query-select"),
            label: size(".query-stat-label"),
            value: size(".query-stat-value"),
            statsFit: stats.every((s) => s.scrollWidth <= s.clientWidth + 1),
            oneRow: stats.every((s) => s.offsetTop === stats[0].offsetTop),
            pageFits: document.documentElement.scrollWidth <= window.innerWidth + 1,
          };
        });
        check(
          near(m.tab, root * 0.75) && near(m.select, root * 0.8125) && near(m.label, root * 0.6875) && near(m.value, root * 1.125),
          `Profile ratings ${width}x${height}, root ${root}px: tabs, picker, labels and values follow the root`,
          m,
        );
        check(m.statsFit && m.pageFits, `Profile ratings ${width}x${height}, root ${root}px: stats fit, no sideways scroll`, m);
        if (root === 16)
          check(m.oneRow, `Profile ratings ${width}x${height}, root 16px: the four stats stay on one row`, m);
      }
    }

    check(errors.length === 0, "no page errors", errors);
    await context.close();
  } finally {
    if (browser) await browser.close();
    server.close();
  }
  for (const p of passes) console.log("PASS", p);
  for (const f of failures) console.log("FAIL", f);
  console.log(`${passes.length} passed, ${failures.length} failed`);
  process.exitCode = failures.length ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
