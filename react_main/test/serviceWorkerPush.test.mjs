import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

// Runs the real public/sw.js in a sandbox with a fake ServiceWorkerGlobalScope,
// so the push and notificationclick handlers are exercised as shipped rather
// than through a copy of their logic.
const ORIGIN = "https://ultimafia.com";
const SOURCE = readFileSync(
  fileURLToPath(new URL("../public/sw.js", import.meta.url)),
  "utf8"
);

function makeClient({ url, focused = false, focusThrows = false }) {
  const record = { url, focused, focusedCalls: 0, navigations: [], messages: [] };
  const client = {
    get url() {
      return record.url;
    },
    get focused() {
      return record.focused;
    },
    async focus() {
      record.focusedCalls += 1;
      if (focusThrows) throw new Error("Not allowed to focus a window.");
      record.focused = true;
      return client;
    },
    async navigate(target) {
      record.navigations.push(target);
      record.url = target;
      return client;
    },
    postMessage(message) {
      record.messages.push(message);
    },
  };

  return { client, record };
}

function loadServiceWorker({ clients = [], focusedIndex = -1 } = {}) {
  const built = clients.map((client, index) =>
    makeClient({ ...client, focused: index === focusedIndex })
  );
  const listeners = new Map();
  const notifications = [];
  const windowsOpened = [];

  const self = {
    location: { origin: ORIGIN },
    addEventListener(name, handler) {
      if (!listeners.has(name)) listeners.set(name, []);
      listeners.get(name).push(handler);
    },
    skipWaiting() {},
    registration: {
      async showNotification(title, options) {
        notifications.push({ title, options });
      },
    },
    clients: {
      async matchAll() {
        return built.map((entry) => entry.client);
      },
      async openWindow(url) {
        windowsOpened.push(url);
        return null;
      },
    },
  };

  vm.runInNewContext(SOURCE, { self, URL, console }, { filename: "public/sw.js" });

  async function dispatch(name, event) {
    const waits = [];
    for (const handler of listeners.get(name) || []) {
      handler({
        ...event,
        waitUntil(promise) {
          waits.push(promise);
        },
      });
    }
    await Promise.all(waits);
  }

  return {
    push(payload) {
      const data =
        typeof payload === "string"
          ? {
              text: () => payload,
              json() {
                throw new Error("not JSON");
              },
            }
          : { text: () => JSON.stringify(payload), json: () => payload };

      return dispatch("push", { data });
    },
    click(data) {
      return dispatch("notificationclick", {
        notification: { close() {}, data },
      });
    },
    notifications,
    windowsOpened,
    clients: built,
  };
}

function kicksPayload(overrides = {}) {
  return {
    kind: "kicks-reminder",
    gameId: "abc123",
    url: `${ORIGIN}/game/abc123`,
    title: "Your game is in kicks",
    body: "You have not taken your action. Vote or you will be vegged.",
    tag: "game-abc123",
    state: 12,
    ...overrides,
  };
}

function readyPayload(overrides = {}) {
  // Exactly what the server sends today, before kinds existed.
  return {
    title: "Your game is ready!",
    body: "Ready up now or you will be removed from the game.",
    url: `${ORIGIN}/game/abc123`,
    tag: "game-abc123",
    ...overrides,
  };
}

test("a kicks reminder is shown with the game's collapse tag and deep link", async (t) => {
  const worker = loadServiceWorker();
  t.after(() => {});

  await worker.push(kicksPayload());

  assert.equal(worker.notifications.length, 1);
  const { title, options } = worker.notifications[0];
  assert.equal(title, "Your game is in kicks");
  assert.equal(options.body, kicksPayload().body);
  assert.equal(options.tag, "game-abc123");
  assert.equal(options.renotify, true);
  assert.equal(options.requireInteraction, false);
  assert.equal(options.icon, "/images/icon-192.png");
  assert.equal(options.badge, "/images/icon-192.png");
  assert.equal(options.data.url, `${ORIGIN}/game/abc123?panel=actions`);
  assert.equal(options.data.kind, "kicks-reminder");
  assert.equal(options.data.gameId, "abc123");
});

test("a second reminder replaces the first instead of stacking", async () => {
  const worker = loadServiceWorker();

  await worker.push(kicksPayload());
  await worker.push(kicksPayload({ body: "Vote or you will be vegged." }));

  assert.equal(worker.notifications.length, 2);
  // Same tag is what makes the browser collapse the second into the first.
  assert.equal(worker.notifications[0].options.tag, worker.notifications[1].options.tag);

  await worker.push(kicksPayload({ gameId: "def456", tag: "game-def456" }));
  assert.equal(worker.notifications[2].options.tag, "game-def456");
});

test("a ready-check payload without a kind behaves exactly as before", async () => {
  const worker = loadServiceWorker({
    clients: [{ url: `${ORIGIN}/game/abc123` }],
  });

  await worker.push(readyPayload());
  assert.equal(worker.notifications.length, 1);
  assert.equal(worker.notifications[0].options.tag, "game-abc123");
  assert.equal(worker.notifications[0].options.data.url, `${ORIGIN}/game/abc123`);
  assert.equal(worker.notifications[0].options.data.kind, null);
  assert.equal(worker.notifications[0].options.data.gameId, "abc123");

  await worker.click(worker.notifications[0].options.data);

  assert.equal(worker.clients[0].record.focusedCalls, 1);
  assert.deepEqual(worker.clients[0].record.navigations, []);
  assert.deepEqual(worker.clients[0].record.messages, []);
  assert.deepEqual(worker.windowsOpened, []);
});

test("clicking with the game already open focuses that tab and asks for actions", async () => {
  const worker = loadServiceWorker({
    clients: [{ url: `${ORIGIN}/play` }, { url: `${ORIGIN}/game/abc123` }],
  });

  await worker.push(kicksPayload());
  await worker.click(worker.notifications[0].options.data);

  const game = worker.clients[1].record;
  assert.equal(game.focusedCalls, 1);
  // No reload of a game in progress: the panel travels as a message.
  assert.deepEqual(game.navigations, []);
  // The message object was built inside the sandbox realm, so compare it as data.
  assert.deepEqual(JSON.parse(JSON.stringify(game.messages)), [
    {
      type: "push-deep-link",
      kind: "kicks-reminder",
      gameId: "abc123",
      panel: "actions",
    },
  ]);
  assert.deepEqual(worker.clients[0].record.navigations, []);
  assert.deepEqual(worker.windowsOpened, []);
});

test("a tab anywhere in that game is reused, not just the exact path", async () => {
  const worker = loadServiceWorker({
    clients: [{ url: `${ORIGIN}/game/abc123/board` }],
  });

  await worker.push(kicksPayload());
  await worker.click(worker.notifications[0].options.data);

  assert.equal(worker.clients[0].record.focusedCalls, 1);
  assert.deepEqual(worker.clients[0].record.navigations, []);
  assert.equal(worker.clients[0].record.messages.length, 1);
});

test("clicking with the app open on another page navigates it to the game", async () => {
  const worker = loadServiceWorker({ clients: [{ url: `${ORIGIN}/play` }] });

  await worker.push(kicksPayload());
  await worker.click(worker.notifications[0].options.data);

  assert.deepEqual(worker.clients[0].record.navigations, [
    `${ORIGIN}/game/abc123?panel=actions`,
  ]);
  assert.equal(worker.clients[0].record.focusedCalls, 1);
  assert.deepEqual(worker.windowsOpened, []);
});

test("clicking with the app closed opens the game window", async () => {
  const worker = loadServiceWorker();

  await worker.push(kicksPayload());
  await worker.click(worker.notifications[0].options.data);

  assert.deepEqual(worker.windowsOpened, [`${ORIGIN}/game/abc123?panel=actions`]);
});

test("a focused page is not also notified", async () => {
  const worker = loadServiceWorker({
    clients: [{ url: `${ORIGIN}/game/abc123` }],
    focusedIndex: 0,
  });

  await worker.push(kicksPayload());

  assert.deepEqual(worker.notifications, []);
});

test("a refused focus does not swallow the deep link", async () => {
  // Chrome raises the window only for a real notification click; when it
  // refuses, the destination still has to be reached.
  const open = loadServiceWorker({
    clients: [{ url: `${ORIGIN}/game/abc123`, focusThrows: true }],
  });
  await open.push(kicksPayload());
  await open.click(open.notifications[0].options.data);
  assert.equal(open.clients[0].record.messages.length, 1);

  const elsewhere = loadServiceWorker({
    clients: [{ url: `${ORIGIN}/play`, focusThrows: true }],
  });
  await elsewhere.push(kicksPayload());
  await elsewhere.click(elsewhere.notifications[0].options.data);
  assert.deepEqual(elsewhere.clients[0].record.navigations, [
    `${ORIGIN}/game/abc123?panel=actions`,
  ]);
});

test("an unknown kind keeps the plain deep link", async () => {
  const worker = loadServiceWorker({ clients: [{ url: `${ORIGIN}/play` }] });

  await worker.push(kicksPayload({ kind: "something-new" }));
  await worker.click(worker.notifications[0].options.data);

  assert.deepEqual(worker.clients[0].record.navigations, [
    `${ORIGIN}/game/abc123`,
  ]);
});

test("a payload with no url falls back to the game id, then to the site root", async () => {
  const withGame = loadServiceWorker({ clients: [{ url: `${ORIGIN}/play` }] });
  await withGame.push(kicksPayload({ url: undefined }));
  await withGame.click(withGame.notifications[0].options.data);
  assert.deepEqual(withGame.clients[0].record.navigations, [
    `${ORIGIN}/game/abc123?panel=actions`,
  ]);

  const bare = loadServiceWorker({ clients: [{ url: `${ORIGIN}/play` }] });
  await bare.push({ title: "UltiMafia" });
  assert.equal(bare.notifications[0].options.tag, "ultimafia");
  await bare.click(bare.notifications[0].options.data);
  assert.deepEqual(bare.clients[0].record.navigations, [ORIGIN + "/"]);
});

test("a push delivered as plain text still shows the default notification", async () => {
  const worker = loadServiceWorker();

  await worker.push("hello");

  assert.equal(worker.notifications.length, 1);
  assert.equal(worker.notifications[0].title, "UltiMafia");
  assert.equal(worker.notifications[0].options.body, "hello");
});
