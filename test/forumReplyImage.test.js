const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { Readable } = require("node:stream");
const { createRequire } = require("node:module");
const sharp = require("sharp");
const {
  parseForumReplyForm, normalizeForumReplyImage, appendForumReplyImage,
  MAX_IMAGE_BYTES, MAX_BODY_BYTES, MAX_PIXELS,
} = require("../modules/forumReplyImage");

function multipart(parts, headers = {}) {
  const boundary = "forum reply-test-boundary";
  const chunks = [];
  for (const part of parts) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${part.name}"${part.file ? '; filename="paste.png"' : ""}\r\n${part.type ? `Content-Type: ${part.type}\r\n` : ""}\r\n`));
    chunks.push(Buffer.isBuffer(part.data) ? part.data : Buffer.from(part.data || ""));
    chunks.push(Buffer.from("\r\n"));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  const body = Buffer.concat(chunks);
  const req = Readable.from([body]);
  req.headers = { "content-type": `multipart/form-data; boundary=${boundary}`, "content-length": body.length, ...headers };
  return req;
}
function imageForm(data, extra = []) {
  return multipart([
    { name: "content", data: "hello" }, { name: "thread", data: "All" },
    { name: "image", data, type: "image/png", file: true }, ...extra,
  ]);
}

describe("forum reply image processing", function () {
  let png;
  before(async () => {
    png = await sharp({ create: { width: 32, height: 16, channels: 4, background: "#abc" } }).png().toBuffer();
  });
  for (const [type, format] of [["image/png", "png"], ["image/jpeg", "jpeg"], ["image/webp", "webp"]]) {
    it(`decodes and reencodes ${type} as bounded WebP`, async () => {
      const data = await sharp(png)[format]().toBuffer();
      const output = await normalizeForumReplyImage({ data, type });
      const info = await sharp(output).metadata();
      assert.equal(info.format, "webp");
      assert.equal(info.width, 32);
      assert.equal(info.height, 16);
      assert.ok(output.length <= 1024 * 1024);
    });
  }
  it("resizes without exceeding 1024 pixels on either side", async () => {
    const data = await sharp({ create: { width: 1500, height: 750, channels: 3, background: "#abc" } }).png().toBuffer();
    const info = await sharp(await normalizeForumReplyImage({ data, type: "image/png" })).metadata();
    assert.equal(info.width, 1024);
    assert.equal(info.height, 512);
  });
  it("rejects MIME spoofing", async () => {
    await assert.rejects(normalizeForumReplyImage({ data: png, type: "image/jpeg" }), /must match/);
  });
  it("rejects SVG and empty, oversized and malformed data", async () => {
    for (const image of [
      { data: Buffer.from("<svg/>"), type: "image/svg+xml" },
      { data: Buffer.alloc(0), type: "image/png" },
      { data: Buffer.alloc(MAX_IMAGE_BYTES + 1), type: "image/png" },
      { data: Buffer.from("not an image"), type: "image/png" },
    ]) await assert.rejects(normalizeForumReplyImage(image), (error) => error.status === 422);
  });
  it("rejects oversized decoded pixel counts", async () => {
    const data = await sharp({ create: { width: 4001, height: 4000, channels: 3, background: "#abc" } }).png().toBuffer();
    assert.ok(4001 * 4000 > MAX_PIXELS);
    await assert.rejects(normalizeForumReplyImage({ data, type: "image/png" }), /16 million pixels/);
  });
  it("rejects the APNG animation control chunk", async () => {
    // Valid PNG plus the APNG control chunk before IDAT. CRC does not affect
    // the early animation rejection; no image pixels are accepted from it.
    const chunk = Buffer.alloc(20);
    chunk.writeUInt32BE(8, 0);
    chunk.write("acTL", 4);
    chunk.writeUInt32BE(2, 8);
    const data = Buffer.concat([png.subarray(0, 33), chunk, png.subarray(33)]);
    await assert.rejects(normalizeForumReplyImage({ data, type: "image/png" }), /animations/);
  });
  it("rejects animated WebP instead of flattening it", async () => {
    const raw = Buffer.from([255, 0, 0, 0, 255, 0]);
    const data = await sharp(raw, { raw: { width: 1, height: 2, channels: 3, pageHeight: 1 } })
      .webp({ loop: 0, delay: [100, 100] }).toBuffer();
    const metadata = await sharp(data, { animated: true }).metadata();
    assert.equal(metadata.pages, 2);
    await assert.rejects(normalizeForumReplyImage({ data, type: "image/webp" }), /animations/);
  });
  it("parses one image and both fields without temporary files", async () => {
    const parsed = await parseForumReplyForm(imageForm(png));
    assert.deepEqual(parsed.fields, { content: "hello", thread: "All" });
    assert.deepEqual(parsed.image.data, png);
  });
  it("rejects repeated image names rather than silently taking the last file", async () => {
    await assert.rejects(parseForumReplyForm(imageForm(png, [
      { name: "image", data: png, type: "image/png", file: true },
    ])), /Attach one/);
  });
  it("rejects unknown and duplicate fields", async () => {
    for (const name of ["other", "content"]) {
      await assert.rejects(parseForumReplyForm(imageForm(png, [{ name, data: "x" }])), /form fields/);
    }
  });
  it("rejects a missing image and unsupported file type", async () => {
    await assert.rejects(parseForumReplyForm(multipart([{ name: "content", data: "hi" }])), /required/);
    await assert.rejects(parseForumReplyForm(multipart([{ name: "image", data: png, file: true, type: "image/gif" }])), /Attach one/);
  });
  it("bounds the whole request independently of Content-Length", async () => {
    await assert.rejects(parseForumReplyForm(imageForm(Buffer.alloc(MAX_BODY_BYTES + 1))), (e) => e.status === 413);
    const req = imageForm(Buffer.alloc(MAX_BODY_BYTES + 1));
    delete req.headers["content-length"];
    req.headers["transfer-encoding"] = "chunked";
    await assert.rejects(parseForumReplyForm(req), (e) => e.status === 413);
  });
  it("bounds individual fields", async () => {
    await assert.rejects(parseForumReplyForm(imageForm(png, [{ name: "other", data: "x".repeat(81921) }])), /form fields/);
    await assert.rejects(parseForumReplyForm(multipart([{ name: "content", data: "x".repeat(81921) }])), (e) => e.status === 413);
  });
  it("rejects aborted and malformed requests", async () => {
    const req = new Readable({ read() { this.emit("aborted"); this.push(null); } });
    req.headers = { "content-type": "multipart/form-data; boundary=missing", "transfer-encoding": "chunked" };
    await assert.rejects(parseForumReplyForm(req), /Invalid forum reply upload/);
    const malformed = Readable.from([Buffer.from("broken")]);
    malformed.headers = { "content-type": "multipart/form-data; boundary=x", "content-length": 6 };
    await assert.rejects(parseForumReplyForm(malformed), /Invalid forum reply upload/);
  });
  it("appends only a short owned URL, including for image-only forum replys", () => {
    assert.equal(appendForumReplyImage("", "abc"), "![Pasted image](/api/forums/reply/abc/image)");
    assert.equal(appendForumReplyImage("hello", "abc"), "hello\n\n![Pasted image](/api/forums/reply/abc/image)");
  });
});

describe("forum text budget", function () {
  it("accepts a multibyte 20,000-character field before final URL validation", async () => {
    const content = "界".repeat(20000);
    const parsed = await parseForumReplyForm(multipart([
      { name: "content", data: content }, { name: "thread", data: "thread1" },
      { name: "image", data: Buffer.from("bounded"), type: "image/png", file: true },
    ]));
    assert.equal(parsed.fields.content, content);
  });
});

function loadForumRouter(state) {
  const filename = path.join(__dirname, "../routes/forums.js");
  const nativeRequire = createRequire(filename);
  const query = (value) => ({
    select(projection) { state.projections.push(projection); return this; },
    populate() { return this; },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  });
  class ForumReply {
    constructor(value) { Object.assign(this, value); }
    async save() {
      if (state.saveError) throw new Error("DB unavailable");
      state.saved.push(this);
      state.doc = { ...this, deleted: false, pending: false, thread: state.thread };
    }
  }
  ForumReply.findOne = (filter) => query(state.doc && state.doc.id === filter.id &&
    state.doc.deleted === filter.deleted && state.doc.pending === filter.pending ? state.doc : null);
  const update = () => ({ exec: async () => {} });
  const models = {
    ForumReply,
    ForumThread: { findOne: () => query(state.thread), updateOne: update },
    ForumBoard: { updateOne: update },
  };
  const mocks = {
    "../db/models": models,
    "./utils": {
      verifyLoggedIn: async (req, optional) => {
        if (!state.loggedIn && !optional) throw new Error("Not logged in");
        return state.loggedIn ? "owner" : undefined;
      },
      verifyPermission: async (...args) => {
        const perm = typeof args[0] === "string" ? args[1] : args[2];
        const allowed = state.permission && (perm !== "postInLocked" || state.lockedPermission);
        if (!allowed && args[0]?.status) args[0].status(403).send("Forbidden");
        return allowed;
      },
      rateLimit: async (id, key, res) => {
        state.rates.push(key);
        if (!state.rate) res.status(429).send("Rate limited");
        return state.rate;
      },
      createNotification() {},
    },
    "../modules/redis": { getUserName: async () => "Owner", getUserRank: async () => state.rank },
    "../modules/reactions": {},
    "../modules/logging": () => ({ error() {} }),
    shortid: { generate: () => "reply123" },
  };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(filename, "utf8"), {
    module, exports: module.exports, Buffer,
    require: (name) => Object.prototype.hasOwnProperty.call(mocks, name) ? mocks[name] : nativeRequire(name),
  }, { filename });
  return module.exports;
}
function response() {
  return {
    statusCode: 200, headers: {}, body: null,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; return this; },
    sendStatus(code) { this.statusCode = code; return this; },
  };
}
function handler(router, method, url) {
  return router.stack.find((layer) => layer.route?.path === url && layer.route.methods[method]).route.stack[0].handle;
}
describe("forum image routes (mocked database and permission provider)", function () {
  let state, router, png;
  before(async () => { png = await sharp({ create: { width: 1, height: 1, channels: 3, background: "#abc" } }).png().toBuffer(); });
  beforeEach(() => {
    state = {
      loggedIn: true, permission: true, lockedPermission: false, rate: true, rank: 0,
      saved: [], rates: [], projections: [],
      thread: {
        _id: "thread-object", id: "thread1", deleted: false, pending: false,
        author: { id: "someone" }, board: { id: "board1", rank: 0, category: { rank: 0 } },
        roster: [], mutedTags: [], subscribers: [], replyCount: 0,
      },
    };
    router = loadForumRouter(state);
  });
  async function post(content = "hello", data = png, json = false) {
    const req = json ? { body: { thread: "thread1", content } } : multipart([
      { name: "content", data: content }, { name: "thread", data: "thread1" },
      { name: "image", data, type: "image/png", file: true },
    ]);
    req.is = () => !json;
    req.session = { user: { _id: "owner-object" } };
    const res = response();
    await handler(router, "post", "/reply")(req, res);
    return res;
  }
  async function get(id = "reply123") {
    const res = response();
    await handler(router, "get", "/reply/:id/image")({ params: { id } }, res);
    return res;
  }
  it("parses, normalizes, saves owned image+URL once and serves decoded bytes on a fresh route read", async () => {
    assert.equal((await post()).body, "1");
    assert.equal(state.saved.length, 1);
    const saved = state.saved[0];
    assert.equal(saved.author, "owner-object");
    assert.equal(saved.content, appendForumReplyImage("hello", "reply123"));
    assert.ok(Buffer.isBuffer(saved.image));
    assert.equal((await sharp(saved.image).metadata()).format, "webp");
    assert.deepEqual(state.rates, ["postReply"]);
    const image = await get();
    assert.equal(image.statusCode, 200);
    assert.deepEqual(image.body, saved.image);
    assert.equal(image.headers["Content-Type"], "image/webp");
    assert.equal(image.headers["Cache-Control"], "no-store");
    assert.equal(image.headers["X-Content-Type-Options"], "nosniff");
    assert.ok(state.projections.some((p) => p.includes("mutedTags")));
    assert.ok(state.projections.includes("+image content thread"));
  });
  it("preserves JSON text-only creation and the 20,000-character final-content limit", async () => {
    assert.equal((await post("界".repeat(20000), png, true)).statusCode, 200);
    assert.equal(state.saved[0].image, undefined);
    const overhead = appendForumReplyImage("x", "reply123").length - 1;
    assert.equal((await post("界".repeat(20000 - overhead))).statusCode, 200);
    assert.equal((await post("x".repeat(20001 - overhead))).statusCode, 422);
    assert.equal(state.saved.length, 2);
  });
  it("supports image-only replies", async () => {
    assert.equal((await post("")).statusCode, 200);
    assert.equal(state.saved[0].content, appendForumReplyImage("", "reply123"));
  });
  it("rejects authentication, permissions, cooldown and malformed images without saving", async () => {
    state.loggedIn = false; assert.equal((await post()).statusCode, 500);
    state.loggedIn = true; state.permission = false; assert.equal((await post()).statusCode, 403);
    state.permission = true; state.rate = false; assert.equal((await post()).statusCode, 429);
    state.rate = true; assert.equal((await post("hello", Buffer.from("bad"))).statusCode, 422);
    state.saveError = true; assert.equal((await post()).statusCode, 500);
    assert.equal(state.saved.length, 0);
  });
  it("enforces locked, restricted, and actually-selected muted-tag write gates", async () => {
    state.thread.locked = true; assert.equal((await post()).statusCode, 403);
    state.lockedPermission = true; state.thread.restricted = true;
    assert.equal((await post()).statusCode, 403);
    state.thread.roster = [{ userId: "owner", tags: [{ text: "muted" }] }];
    state.thread.mutedTags = ["muted"];
    assert.equal((await post()).statusCode, 403);
    assert.ok(state.projections.every((p) => p.includes("mutedTags")));
    state.thread.mutedTags = [];
    assert.equal((await post()).statusCode, 200);
  });
  it("uses category viewing rank, including anonymous public access, not board posting rank", async () => {
    await post(); state.loggedIn = false;
    state.thread.board.rank = 99;
    assert.equal((await get()).statusCode, 200);
    state.thread.board.category.rank = 1;
    assert.equal((await get()).statusCode, 404);
    state.loggedIn = true; state.rank = 1;
    assert.equal((await get()).statusCode, 200);
  });
  it("hides missing, deleted, pending reply/parent or missing board/category; restoration re-enables", async () => {
    await post();
    for (const object of [state.doc, state.thread]) {
      for (const flag of ["deleted", "pending"]) {
        object[flag] = true;
        const res = await get();
        assert.equal(res.statusCode, 404); assert.equal(res.headers["Cache-Control"], "no-store");
        object[flag] = false; assert.equal((await get()).statusCode, 200);
      }
    }
    const board = state.thread.board; state.thread.board = null;
    assert.equal((await get()).statusCode, 404);
    state.thread.board = board; const category = board.category; board.category = null;
    assert.equal((await get()).statusCode, 404);
    board.category = category; state.doc.thread = null;
    assert.equal((await get()).statusCode, 404);
    state.doc = null; assert.equal((await get()).statusCode, 404);
  });
  it("revokes access when edit removes owned token, and restores only with exact token", async () => {
    await post(); const content = state.doc.content;
    state.doc.content = "removed"; assert.equal((await get()).statusCode, 404);
    state.doc.content = content.replace("reply123", "other");
    assert.equal((await get()).statusCode, 404);
    state.doc.content = content; assert.equal((await get()).statusCode, 200);
    assert.equal((await get("other")).statusCode, 404);
  });
});

describe("pre-buffer upload gates", function () {
  it("does not begin reading multipart for missing permission or cooldown", async () => {
    for (const denied of ["permission", "rate"]) {
      const state = { loggedIn: true, permission: true, rate: true, projections: [], rates: [] };
      state[denied] = false;
      const router = loadForumRouter(state);
      let reads = 0;
      const req = new Readable({ read() { reads += 1; this.destroy(new Error("must not read")); } });
      req.is = () => true;
      req.session = { user: { _id: "owner-object" } };
      req.headers = { "content-type": "multipart/form-data; boundary=broken", "content-length": MAX_BODY_BYTES + 1 };
      const res = response();
      await handler(router, "post", "/reply")(req, res);
      assert.equal(res.statusCode, denied === "permission" ? 403 : 429);
      assert.equal(reads, 0);
      assert.equal(state.projections.length, 0);
    }
  });
});
