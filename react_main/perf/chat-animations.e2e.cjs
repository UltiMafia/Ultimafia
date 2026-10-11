const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
if (process.platform === "win32")
  throw new Error(
    "Run this browser test in Linux/macOS, not fresh-profile Windows Chrome."
  );
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(process.argv[2] || "build-chat-perf");
const results = [];
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};
const server = http.createServer((req, res) => {
  const name = decodeURIComponent(
    new URL(req.url, "http://localhost").pathname
  );
  const file = path.resolve(root, "." + (name === "/" ? "/index.html" : name));
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(file, (error, data) => {
    res.writeHead(error ? 404 : 200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
    });
    res.end(error ? "not found" : data);
  });
});
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function metrics(cdp) {
  return Object.fromEntries(
    (await cdp.send("Performance.getMetrics")).metrics.map((x) => [
      x.name,
      x.value,
    ])
  );
}
async function settled(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      )
  );
}
async function animationState(page) {
  return page.evaluate(async () => {
    const chat = document.querySelector(".speech-display");
    const nodes = [...chat.querySelectorAll(".user-name-text")];
    const visible = await new Promise((resolve) => {
      const areas = new Map();
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries)
            areas.set(
              entry.target,
              entry.intersectionRect.width > 0 &&
                entry.intersectionRect.height > 0
            );
          if (areas.size === nodes.length) {
            observer.disconnect();
            resolve(areas);
          }
        },
        { root: chat, threshold: [0, Number.EPSILON] }
      );
      if (!nodes.length) {
        observer.disconnect();
        resolve(areas);
      } else for (const node of nodes) observer.observe(node);
    });
    let running = 0,
      offscreenRunning = 0,
      visibleAnimated = 0;
    for (const node of nodes) {
      const style = getComputedStyle(node);
      const active =
        style.animationName !== "none" &&
        style.animationPlayState === "running";
      if (active) running++;
      if (active && !visible.get(node)) offscreenRunning++;
      if (active && visible.get(node)) visibleAnimated++;
    }
    return {
      rows: chat.querySelectorAll(":scope > .message").length,
      names: nodes.length,
      running,
      offscreenRunning,
      visibleAnimated,
    };
  });
}
async function clippingRegression(page) {
  const name = await page.evaluateHandle(() =>
    [...document.querySelectorAll(".speech-display .user-name-text")].find(
      (n) => {
        const r = n.getBoundingClientRect();
        const b = document
          .querySelector(".speech-display")
          .getBoundingClientRect();
        return (
          getComputedStyle(n).animationName !== "none" &&
          r.top > b.top + 20 &&
          r.bottom < b.bottom - 20
        );
      }
    )
  );
  assert(
    await name.evaluate((n) => Boolean(n)),
    "need a visible animated name for clipping regression"
  );
  await name.evaluate((n) => {
    const parent = n.parentElement.parentElement;
    const width = n.getBoundingClientRect().width;
    n.__clipSaved = {
      parentStyle: parent.getAttribute("style"),
      width: n.style.width,
    };
    n.style.width = width + "px";
    parent.style.display = "block";
    parent.style.width = "0px";
    parent.style.overflow = "hidden";
  });
  try {
    await wait(250);
    await settled(page);
    const state = await animationState(page);
    assert.equal(
      state.offscreenRunning,
      0,
      "ancestor-clipped names must not animate"
    );
    const clipped = await name.evaluate((n) => {
      const r = n.getBoundingClientRect();
      const b = document
        .querySelector(".speech-display")
        .getBoundingClientRect();
      return {
        boxOverlaps:
          r.width > 0 &&
          r.height > 0 &&
          r.right > b.left &&
          r.left < b.right &&
          r.bottom > b.top &&
          r.top < b.bottom,
        active: getComputedStyle(n).animationName !== "none",
      };
    });
    assert(
      clipped.boxOverlaps,
      "regression must clip a name whose own box still overlaps the transcript"
    );
    assert.equal(clipped.active, false, "fully clipped name stops");
  } finally {
    await name.evaluate((n) => {
      const saved = n.__clipSaved;
      const parent = n.parentElement.parentElement;
      if (saved.parentStyle === null) parent.removeAttribute("style");
      else parent.setAttribute("style", saved.parentStyle);
      if (saved.width) n.style.width = saved.width;
      else n.style.removeProperty("width");
      delete n.__clipSaved;
    });
  }
  await wait(250);
  await settled(page);
  assert.equal(
    await name.evaluate((n) => getComputedStyle(n).animationName !== "none"),
    true,
    "animation resumes after unclipping"
  );
  await name.dispose();
  console.log("ANCESTOR_CLIPPING_PASS");
}
(async () => {
  let browser;
  let context;
  const errors = [];
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(3048, "127.0.0.1", resolve);
  });
  try {
    const headed = process.env.CHAT_TEST_HEADED === "1";
    browser = await chromium.launch({
      channel: "chromium",
      headless: !headed,
      args:
        process.env.CHAT_TEST_GL === "1"
          ? ["--use-gl=angle", "--use-angle=gl"]
          : [],
    });
    context = await browser.newContext({
      viewport: { width: 1280, height: 945 },
    });
    await context.route("**/*", (r) =>
      new URL(r.request().url()).hostname === "127.0.0.1"
        ? r.continue()
        : r.abort()
    );
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(
      "http://127.0.0.1:3048/?cosmetic=mixed&count=2214&nameplates=1717"
    );
    await page.waitForFunction(
      () =>
        document.querySelectorAll(".speech-display > .message").length === 2214
    );
    await page.evaluate(() => document.fonts.ready);
    await wait(900);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Performance.enable");
    await cdp.send("LayerTree.enable");
    let layers = [];
    cdp.on("LayerTree.layerTreeDidChange", (e) => (layers = e.layers || []));
    if (process.env.CHAT_TEST_REQUIRE_GPU === "1") {
      await page.bringToFront();
      await page.screenshot();
      await settled(page);
      const bc = await browser.newBrowserCDPSession();
      const gpu = (await bc.send("SystemInfo.getInfo")).gpu;
      assert.equal(gpu.featureStatus.gpu_compositing, "enabled");
      assert(layers.length > 0, "page compositor layer tree must be active");
      console.log(
        "ENVIRONMENT",
        JSON.stringify({
          browser: browser.version(),
          renderer: gpu.auxAttributes.glRenderer,
          layers: layers.length,
        })
      );
    }
    const before = await metrics(cdp);
    await wait(2000);
    const after = await metrics(cdp);
    const idle = {
      layoutMs: (after.LayoutDuration - before.LayoutDuration) * 1000,
      styleMs: (after.RecalcStyleDuration - before.RecalcStyleDuration) * 1000,
      ...(await animationState(page)),
    };
    results.push({ phase: "idle", ...idle });
    console.log("IDLE", JSON.stringify(idle));
    assert.equal(idle.rows, 2214);
    assert.equal(idle.names, 1717);
    assert(
      idle.layoutMs < 25,
      "idle animated names must not repeatedly lay out the transcript"
    );
    assert(
      idle.offscreenRunning === 0,
      "offscreen chat names must not animate"
    );
    assert(idle.visibleAnimated > 0, "visible names must keep their cosmetics");
    await clippingRegression(page);
    const input = page.locator(".speech-input-area input[type=text]").first();
    await input.focus();
    await settled(page);
    const b = await metrics(cdp);
    await page.keyboard.type("the quick brown fox jumps over the lazy dog", {
      delay: 10,
    });
    const a = await metrics(cdp);
    const typing = {
      layoutMs: (a.LayoutDuration - b.LayoutDuration) * 1000,
      scriptMs: (a.ScriptDuration - b.ScriptDuration) * 1000,
    };
    results.push({ phase: "typing", ...typing });
    console.log("TYPING", JSON.stringify(typing));
    assert(
      typing.layoutMs < 100,
      "typing layout must remain bounded with 1717 names"
    );
    await input.fill("");
    await wait(1100);
    const append = [];
    for (let i = 0; i < 3; i++) {
      const n = await page.locator(".speech-display > .message").count();
      const b = await metrics(cdp);
      const t = performance.now();
      await input.fill(`echo regression ${i}`);
      await input.press("Enter");
      await page.waitForFunction(
        (n) =>
          document.querySelectorAll(".speech-display > .message").length === n,
        n + 1
      );
      await page.waitForFunction(
        () =>
          document.querySelector(".speech-input-area input[type=text]")
            .value === ""
      );
      await settled(page);
      const a = await metrics(cdp);
      append.push({
        elapsedMs: performance.now() - t,
        scriptMs: (a.ScriptDuration - b.ScriptDuration) * 1000,
        layoutMs: (a.LayoutDuration - b.LayoutDuration) * 1000,
      });
      const bottom = await page.evaluate(() => {
        const e = document.querySelector(".speech-display");
        return e.scrollHeight - e.scrollTop - e.clientHeight;
      });
      assert(bottom < 12, "new echoes must follow to the bottom");
    }
    results.push({ phase: "append", samples: append });
    console.log("APPEND", JSON.stringify(append));
    assert(
      Math.max(...append.map((x) => x.scriptMs)) < 150,
      "appends must not rerender every nameplate"
    );
    await page.mouse.move(500, 450);
    await page.evaluate(() => {
      document.querySelector(".speech-display").scrollTop = 1500;
    });
    await settled(page);
    await wait(200);
    const oldTop = await page
      .locator(".speech-display")
      .evaluate((e) => e.scrollTop);
    await page.getByRole("button", { name: "Add one", exact: true }).click();
    await settled(page);
    const newTop = await page
      .locator(".speech-display")
      .evaluate((e) => e.scrollTop);
    assert(
      Math.abs(newTop - oldTop) < 3,
      "arrivals must not pull a reader away from older messages"
    );
    const oldAnimation = await animationState(page);
    assert.equal(oldAnimation.offscreenRunning, 0);
    assert(
      oldAnimation.visibleAnimated > 0,
      "animations must resume when older rows enter view"
    );
    for (const layout of [
      "default",
      "defaultLarge",
      "compactInline",
      "compactAligned",
    ]) {
      await page.locator(".perf-controls select").selectOption(layout);
      await page.evaluate(() => {
        const e = document.querySelector(".speech-display");
        e.scrollTop = e.scrollHeight;
      });
      await settled(page);
      await wait(150);
      const state = await animationState(page);
      assert.equal(state.rows, 2218);
      assert.equal(state.offscreenRunning, 0);
      const geometry = await input.evaluate((e) => {
        const r = e.getBoundingClientRect();
        return { bottom: r.bottom, top: r.top, height: r.height };
      });
      assert(
        geometry.height > 10 && geometry.bottom <= 945,
        "input must stay visible"
      );
    }
    const row = page.locator(".speech-display > .message").last();
    await row.hover();
    await row.locator(".pin-button-wrapper").click();
    await page.getByText("1 pinned", { exact: false }).waitFor();
    await row.dblclick();
    await page.waitForFunction(
      () =>
        document.querySelectorAll(".speech-display > .message").length === 2219
    );
    assert(
      (await page.locator(".quote-content").count()) > 0,
      "quotes must still show their source text"
    );
    await context.close();
    context = null;
    const phone = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    context = phone;
    await phone.route("**/*", (r) =>
      new URL(r.request().url()).hostname === "127.0.0.1"
        ? r.continue()
        : r.abort()
    );
    const mobile = await phone.newPage();
    mobile.setDefaultTimeout(8000);
    mobile.on("pageerror", (e) => errors.push(e.message));
    await mobile.goto(
      "http://127.0.0.1:3048/?cosmetic=mixed&count=2214&nameplates=1717"
    );
    await mobile.waitForFunction(
      () =>
        document.querySelectorAll(".speech-display > .message").length === 2214
    );
    await wait(500);
    const pi = mobile.locator(".speech-input-area input[type=text]").first();
    const pg = await pi.boundingBox();
    assert(pg && pg.y + pg.height <= 844, "phone input must stay visible");
    const pa = await animationState(mobile);
    assert.equal(pa.offscreenRunning, 0);
    await pi.fill("phone echo");
    await pi.press("Enter");
    await mobile.waitForFunction(
      () =>
        document.querySelectorAll(".speech-display > .message").length === 2215
    );
    await mobile.waitForFunction(
      () =>
        document.querySelector(".speech-input-area input[type=text]").value ===
        ""
    );
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(
      "CHAT_ANIMATION_E2E_PASS",
      JSON.stringify({
        results,
        desktopLayouts: 4,
        phone: true,
        historyRetained: true,
        errors,
      })
    );
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
