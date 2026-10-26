// Browser regression: the chat reply button and reply rows, with the real
// stylesheets and Font Awesome.
//
//   npx rsbuild build --config rsbuild.chat-reply-test.config.ts
//   PLAYWRIGHT_MODULE=/path/to/playwright node test/run-chat-reply.cjs
//
// For every row in each message layout it hovers the row and checks that:
// the pin sits exactly where it does without the reply feature (top-right),
// the reply button sits below it (bottom-right) with a clear gap, both stay
// inside their own row and can be clicked there, and hovering does not change
// any row's height. A reply that can find the line it answers shows the
// Discord-style reference above its header: one line, no timestamp, cut off
// when long, inside its row, with the curved line starting over the avatar.
// Every row's timestamp sits the same distance from the name, with the same
// style, as on plain rows. A reply that cannot find it shows the reply arrow.
// SCREENSHOT_DIR, if set, receives a screenshot per layout.
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const LAYOUTS = ["default", "defaultLarge", "compactInline", "compactAligned"];
// Extra variants, each checked in every layout on Day 1.
const VARIANTS = ["anon=1", "spec=1", "dead=1", "ts=0"];
const MIN_GAP = 3;

async function main() {
  if (!process.env.PLAYWRIGHT_MODULE)
    throw new Error(
      "Set PLAYWRIGHT_MODULE to an isolated Playwright installation.",
    );
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const directory = path.resolve(
    process.argv[2] || "/tmp/ultimafia-chat-reply-browser",
  );
  if (!fs.existsSync(path.join(directory, "index.html")))
    throw new Error("Build the chat reply fixture first.");
  const shots = process.env.SCREENSHOT_DIR;
  const mime = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
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
  let passes = 0;
  const check = (ok, name) => {
    if (ok) passes++;
    else failures.push(name);
  };

  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
  );
  try {
    const page = await browser.newPage({
      viewport: { width: 700, height: 900 },
    });
    page.on("pageerror", (e) => failures.push("page error: " + e.message));
    await page.route("**/*", (route) =>
      route.request().url().startsWith(url) ? route.continue() : route.abort(),
    );

    // Pin box per row, hovered, with the reply feature off.
    async function hoverRows(query) {
      await page.goto(url + "?" + query);
      await page.waitForFunction(() => window.__ready, null, {
        timeout: 15000,
      });
      await page.evaluate(() => document.fonts.ready);
      const heights = () =>
        page.evaluate(() =>
          [...document.querySelectorAll(".game .message")].map(
            (m) => m.getBoundingClientRect().height,
          ),
        );
      const before = await heights();
      const rows = [];
      for (let i = 0; i < before.length; i++) {
        const row = (await page.$$(".game .message"))[i];
        await row.scrollIntoViewIfNeeded();
        await row.hover();
        rows.push(
          await page.evaluate((i) => {
            const m = document.querySelectorAll(".game .message")[i];
            const box = (e) => {
              if (!e) return null;
              const r = e.getBoundingClientRect();
              return { x: r.x, y: r.y, w: r.width, h: r.height };
            };
            const hit = (e) => {
              if (!e) return null;
              const r = e.getBoundingClientRect();
              const at = document.elementFromPoint(
                r.x + r.width / 2,
                r.y + r.height / 2,
              );
              return !!at && (at === e || e.contains(at));
            };
            const pin = m.querySelector(".pin-button-wrapper .fa-thumbtack");
            const reply = m.querySelector(".reply-button");
            const offset = (b) =>
              b && {
                ...b,
                x: b.x - m.getBoundingClientRect().x,
                y: b.y - m.getBoundingClientRect().y,
              };
            return {
              text: m.innerText.replace(/\s+/g, " ").trim().slice(0, 40),
              spectator: m.classList.contains("spectator-chat"),
              merged: m.classList.contains("reply-merged"),
              fallback: m.classList.contains("reply-message"),
              arrow: !!m.querySelector(".reply-marker"),
              ref: (() => {
                const ref = m.querySelector(".reply-reference");
                if (!ref) return null;
                const spine = ref.querySelector(".reply-spine");
                const text = ref.querySelector(".reply-reference-text");
                const avatar = m.querySelector(
                  ":scope > div > .nameplate .avatar, :scope > div > .nameplate-aligned .avatar",
                );
                const firstChild = ref.parentElement.firstElementChild === ref;
                return {
                  box: box(ref),
                  firstChild,
                  spine: box(spine),
                  tinyAvatar: !!ref.querySelector(".avatar"),
                  name: ref.querySelector(".user-name")?.innerText.trim(),
                  hasTime: !!ref.querySelector(".time"),
                  text: text.innerText,
                  cut: text.scrollWidth > text.clientWidth + 0.5,
                  avatar: box(avatar),
                };
              })(),
              time: (() => {
                const np = m.querySelector(
                  ":scope > div > .nameplate, :scope > div > .nameplate-aligned",
                );
                const t = np && np.querySelector(".time");
                const n = np && np.querySelector(".user-name");
                if (!t || !n) return null;
                const tr = t.getBoundingClientRect();
                const nr = n.getBoundingClientRect();
                const cs = getComputedStyle(t);
                return {
                  dx: Math.round((tr.x - nr.x) * 100) / 100,
                  dy: Math.round((tr.y + tr.height / 2 - (nr.y + nr.height / 2)) * 100) / 100,
                  x: Math.round((tr.x - m.getBoundingClientRect().x) * 100) / 100,
                  style: [cs.fontSize, cs.opacity, cs.color, cs.fontWeight].join("|"),
                  name: n.innerText.trim(),
                };
              })(),
              row: box(m),
              pin: box(pin),
              pinInRow: offset(box(pin)),
              reply: box(reply),
              pinHit: pin ? hit(pin.parentElement) : null,
              replyHit: hit(reply),
            };
          }, i),
        );
      }
      const after = await heights();
      return { rows, before, after };
    }

    const queries = [];
    for (const layout of LAYOUTS) {
      for (const st of [1, -1]) queries.push(`layout=${layout}&st=${st}`);
      for (const v of VARIANTS) queries.push(`layout=${layout}&st=1&${v}`);
    }
    for (const query of queries) {
      {
        const layout = new URLSearchParams(query).get("layout");
        const st = Number(new URLSearchParams(query).get("st"));
        const dense = layout.startsWith("compact");
        const off = await hoverRows(query + "&noreply=1");
        const on = await hoverRows(query);
        check(
          on.before.every((h, i) => Math.abs(h - on.after[i]) < 0.01),
          `${query}: hovering changes no row height`,
        );
        check(
          on.rows.length === off.rows.length,
          `${query}: same rows with and without replies`,
        );
        on.rows.forEach((r, i) => {
          const name = `${query} row ${i} (${r.text})`;
          const o = off.rows[i];
          // The pin shows on the same rows and in the same place in its row
          // as without the reply feature.
          check(!!r.pin === !!o.pin, `${name}: pin shown as without replies`);
          if (r.pin && o.pin) {
            check(
              Math.abs(r.pinInRow.x - o.pinInRow.x) < 0.5 &&
                Math.abs(r.pinInRow.y - o.pinInRow.y) < 0.5 &&
                r.pin.w === o.pin.w &&
                r.pin.h === o.pin.h,
              `${name}: pin at the top-right as without replies`,
            );
            check(r.pinHit, `${name}: pin clickable`);
          }
          if (r.merged) check(!!r.ref, `${name}: reply shows its reference`);
          if (r.ref) {
            const f = r.ref;
            check(f.firstChild, `${name}: reference above the header`);
            check(!r.arrow, `${name}: no old reply arrow with a reference`);
            check(f.tinyAvatar && !!f.name, `${name}: reference has avatar and name`);
            check(!f.hasTime, `${name}: no timestamp on the reference`);
            check(!/on (Day|Night|Pregame)/.test(f.text), `${name}: no state on the reference`);
            check(f.box.h <= 20, `${name}: reference is one line`);
            check(
              f.box.x + f.box.w <= r.row.x + r.row.w + 0.5 &&
                f.box.y >= r.row.y - 0.5,
              `${name}: reference inside its row`,
            );
            if (/long line/.test(f.text))
              check(f.cut, `${name}: long reference is cut off`);
            if (query.includes("anon=1"))
              check(f.name === "Anonymous", `${name}: anonymous original`);
            if (f.avatar) {
              const centre = f.avatar.x + f.avatar.w / 2;
              check(
                Math.abs(f.spine.x + 1 - centre) < 1.5,
                `${name}: curved line starts over the avatar`,
              );
              check(
                f.spine.y + f.spine.h <= f.avatar.y + 0.5 &&
                  f.avatar.y - (f.spine.y + f.spine.h) < 4,
                `${name}: curved line ends just above the avatar`,
              );
            }
          }
          if (r.fallback) check(r.arrow, `${name}: reply arrow`);
          for (const k of ["pin", "reply"]) {
            const b = r[k];
            if (!b) continue;
            check(
              b.y >= r.row.y - 0.5 &&
                b.y + b.h <= r.row.y + r.row.h + 0.5 &&
                b.x + b.w <= r.row.x + r.row.w + 0.5,
              `${name}: ${k} inside its row`,
            );
          }
          if (r.reply) {
            check(r.replyHit, `${name}: reply clickable`);
            check(
              Math.abs(r.reply.y + r.reply.h - (r.row.y + r.row.h)) < 1.5,
              `${name}: reply at the bottom of the row`,
            );
          }
          if (r.pin && r.reply)
            check(
              r.reply.y - (r.pin.y + r.pin.h) >= MIN_GAP &&
                Math.abs(r.reply.x + r.reply.w / 2 - (r.pin.x + r.pin.w / 2)) <
                  1,
              `${name}: reply under the pin with a ${MIN_GAP}px gap`,
            );
        });
        // Timestamps: same place next to the name, same vertical centre and
        // same style on reply rows as on plain rows, and the same x in the
        // row whenever the name is the same (dense layouts: always).
        const plain = on.rows.filter((r) => r.time && !r.ref);
        const timed = on.rows.filter((r) => r.time);
        if (query.includes("ts=0"))
          check(timed.length === 0, `${query}: no timestamps when off`);
        else {
          check(
            on.rows.some((r) => r.ref && r.time),
            `${query}: a reply row shows its timestamp`,
          );
          for (const r of timed) {
            const ref = plain.find((p) => p.time.name === r.time.name) || plain[0];
            check(
              Math.abs(r.time.dx - ref.time.dx) < 0.5 &&
                Math.abs(r.time.dy - ref.time.dy) < 0.5 &&
                r.time.style === ref.time.style,
              `${query} (${r.text}): timestamp placed and styled as on plain rows`,
            );
            // Spectator chat rows are drawn 2px in for their side bar, with
            // or without replies.
            if (
              r.spectator === ref.spectator &&
              (dense || ref.time.name === r.time.name)
            )
              check(
                Math.abs(r.time.x - ref.time.x) < 0.5,
                `${query} (${r.text}): timestamp at the same x as plain rows`,
              );
          }
        }
        check(
          on.rows.some((r) => r.reply),
          `${query}: some row offers a reply`,
        );
        check(
          on.rows.filter((r) => r.ref).length >= 3,
          `${query}: replies show their reference`,
        );
        if (st === 1)
          check(
            on.rows.some((r) => r.pin && r.reply),
            `${query}: some row shows pin and reply`,
          );
        if (shots) {
          fs.mkdirSync(shots, { recursive: true });
          await page.screenshot({
            path: path.join(shots, `${query.replace(/[=&]/g, "_")}.png`),
          });
        }
      }
    }
    // Clicking a reference highlights the original line; it does not quote.
    {
      await page.goto(url + "?layout=default&st=1");
      await page.waitForFunction(() => window.__ready, null, { timeout: 15000 });
      await page.click(".message.reply-merged .reply-reference");
      const jumped = await page.evaluate(
        () =>
          document
            .querySelector('.message[data-message-id="m1aaaaaa"]')
            ?.classList.contains("reply-jump-highlight") ?? false,
      );
      check(jumped, "clicking a reference highlights the original line");
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`${passes} checks passed`);
  if (failures.length) {
    for (const f of failures) console.log("FAIL " + f);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
