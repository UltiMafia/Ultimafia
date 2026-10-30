const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { Readable } = require("node:stream");
const { createRequire } = require("node:module");
const sharp = require("sharp");
const {
  parseCommentForm, normalizeCommentImage, appendCommentImage,
  MAX_IMAGE_BYTES, MAX_BODY_BYTES, MAX_PIXELS,
} = require("../modules/commentImage");

function multipart(parts, headers = {}) {
  const boundary = "comment-test-boundary";
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
    { name: "content", data: "hello" }, { name: "location", data: "All" },
    { name: "image", data, type: "image/png", file: true }, ...extra,
  ]);
}

describe("comment image processing", function () {
  let png;
  before(async () => {
    png = await sharp({ create: { width: 32, height: 16, channels: 4, background: "#abc" } }).png().toBuffer();
  });
  for (const [type, format] of [["image/png", "png"], ["image/jpeg", "jpeg"], ["image/webp", "webp"]]) {
    it(`decodes and reencodes ${type} as bounded WebP`, async () => {
      const data = await sharp(png)[format]().toBuffer();
      const output = await normalizeCommentImage({ data, type });
      const info = await sharp(output).metadata();
      assert.equal(info.format, "webp");
      assert.equal(info.width, 32);
      assert.equal(info.height, 16);
      assert.ok(output.length <= 1024 * 1024);
    });
  }
  it("resizes without exceeding 1024 pixels on either side", async () => {
    const data = await sharp({ create: { width: 1500, height: 750, channels: 3, background: "#abc" } }).png().toBuffer();
    const info = await sharp(await normalizeCommentImage({ data, type: "image/png" })).metadata();
    assert.equal(info.width, 1024);
    assert.equal(info.height, 512);
  });
  it("rejects MIME spoofing", async () => {
    await assert.rejects(normalizeCommentImage({ data: png, type: "image/jpeg" }), /must match/);
  });
  it("rejects SVG and empty, oversized and malformed data", async () => {
    for (const image of [
      { data: Buffer.from("<svg/>"), type: "image/svg+xml" },
      { data: Buffer.alloc(0), type: "image/png" },
      { data: Buffer.alloc(MAX_IMAGE_BYTES + 1), type: "image/png" },
      { data: Buffer.from("not an image"), type: "image/png" },
    ]) await assert.rejects(normalizeCommentImage(image), (error) => error.status === 422);
  });
  it("rejects oversized decoded pixel counts", async () => {
    const data = await sharp({ create: { width: 4001, height: 4000, channels: 3, background: "#abc" } }).png().toBuffer();
    assert.ok(4001 * 4000 > MAX_PIXELS);
    await assert.rejects(normalizeCommentImage({ data, type: "image/png" }), /16 million pixels/);
  });
  it("rejects the APNG animation control chunk", async () => {
    // Valid PNG plus the APNG control chunk before IDAT. CRC does not affect
    // the early animation rejection; no image pixels are accepted from it.
    const chunk = Buffer.alloc(20);
    chunk.writeUInt32BE(8, 0);
    chunk.write("acTL", 4);
    chunk.writeUInt32BE(2, 8);
    const data = Buffer.concat([png.subarray(0, 33), chunk, png.subarray(33)]);
    await assert.rejects(normalizeCommentImage({ data, type: "image/png" }), /animations/);
  });
  it("rejects animated WebP instead of flattening it", async () => {
    const raw = Buffer.from([255, 0, 0, 0, 255, 0]);
    const data = await sharp(raw, { raw: { width: 1, height: 2, channels: 3, pageHeight: 1 } })
      .webp({ loop: 0, delay: [100, 100] }).toBuffer();
    const metadata = await sharp(data, { animated: true }).metadata();
    assert.equal(metadata.pages, 2);
    await assert.rejects(normalizeCommentImage({ data, type: "image/webp" }), /animations/);
  });
  it("parses one image and both fields without temporary files", async () => {
    const parsed = await parseCommentForm(imageForm(png));
    assert.deepEqual(parsed.fields, { content: "hello", location: "All" });
    assert.deepEqual(parsed.image.data, png);
  });
  it("rejects repeated image names rather than silently taking the last file", async () => {
    await assert.rejects(parseCommentForm(imageForm(png, [
      { name: "image", data: png, type: "image/png", file: true },
    ])), /Attach one/);
  });
  it("rejects unknown and duplicate fields", async () => {
    for (const name of ["other", "content"]) {
      await assert.rejects(parseCommentForm(imageForm(png, [{ name, data: "x" }])), /form fields/);
    }
  });
  it("rejects a missing image and unsupported file type", async () => {
    await assert.rejects(parseCommentForm(multipart([{ name: "content", data: "hi" }])), /required/);
    await assert.rejects(parseCommentForm(multipart([{ name: "image", data: png, file: true, type: "image/gif" }])), /Attach one/);
  });
  it("bounds the whole request independently of Content-Length", async () => {
    await assert.rejects(parseCommentForm(imageForm(Buffer.alloc(MAX_BODY_BYTES + 1))), (e) => e.status === 413);
    const req = imageForm(Buffer.alloc(MAX_BODY_BYTES + 1));
    delete req.headers["content-length"];
    req.headers["transfer-encoding"] = "chunked";
    await assert.rejects(parseCommentForm(req), (e) => e.status === 413);
  });
  it("bounds individual fields", async () => {
    await assert.rejects(parseCommentForm(imageForm(png, [{ name: "other", data: "x".repeat(8193) }])), /form fields/);
    await assert.rejects(parseCommentForm(multipart([{ name: "content", data: "x".repeat(8193) }])), (e) => e.status === 413);
  });
  it("rejects aborted and malformed requests", async () => {
    const req = new Readable({ read() { this.emit("aborted"); this.push(null); } });
    req.headers = { "content-type": "multipart/form-data; boundary=missing", "transfer-encoding": "chunked" };
    await assert.rejects(parseCommentForm(req), /Invalid comment upload/);
    const malformed = Readable.from([Buffer.from("broken")]);
    malformed.headers = { "content-type": "multipart/form-data; boundary=x", "content-length": 6 };
    await assert.rejects(parseCommentForm(malformed), /Invalid comment upload/);
  });
  it("appends only a short owned URL, including for image-only comments", () => {
    assert.equal(appendCommentImage("", "abc"), "![Pasted image](/api/comment/abc/image)");
    assert.equal(appendCommentImage("hello", "abc"), "hello\n\n![Pasted image](/api/comment/abc/image)");
  });
});

function loadRouter(state) {
  const filename = path.join(__dirname, "../routes/comment.js");
  const nativeRequire = createRequire(filename);
  const query = (value) => ({ select() { return this; }, populate() { return this; }, then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } });
  class Comment {
    constructor(value) { Object.assign(this, value); }
    async save() {
      if (state.saveError) throw new Error("database unavailable");
      state.saved.push(this);
    }
  }
  Comment.findOne = (filter) => {
    state.imageFilter = filter;
    const value = state.doc && (!("deleted" in filter) || state.doc.deleted === filter.deleted) &&
      (!("pending" in filter) || state.doc.pending === filter.pending) ? state.doc : null;
    return query(value);
  };
  Comment.updateOne = (filter, update) => ({ exec: async () => Object.assign(state.doc, update.$set) });
  const mocks = {
    "../db/models": { Comment, User: { findOne: () => ({ select() { return this; }, lean: async () => state.profile }) } },
    "../routes/utils": {},
    "./utils": {
      verifyLoggedIn: async () => { if (!state.loggedIn) throw new Error("not logged in"); return "owner"; },
      verifyPermission: async (...args) => { const allowed = state.permissions ? state.permissions[args[args.length - 1]] : state.permission; if (!allowed && args[0]?.status) args[0].status(403).send("Forbidden"); return allowed; },
      rateLimit: async (id, key, res) => { state.rates.push(key); if (!state.rate) res.status(429).send("Rate limited"); return state.rate; },
      createModAction() {},
    },
    "../modules/redis": {},
    "../modules/reactions": {},
    "../modules/blocks": { usersBlockEachOther: async () => state.blocked },
    "../modules/logging": () => ({ error() {} }),
    "shortid": { generate: () => "comment123" },
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
    set(key, value) { this.headers[key] = value; return this; },
    type(value) { this.headers["Content-Type"] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; return this; },
    sendStatus(code) { this.statusCode = code; return this; },
  };
}
function handler(router, method, url) {
  return router.stack.find((layer) => layer.route?.path === url && layer.route.methods[method]).route.stack[0].handle;
}

describe("comment attachment route", function () {
  let state, router, png;
  before(async () => { png = await sharp({ create: { width: 1, height: 1, channels: 3, background: "#abc" } }).png().toBuffer(); });
  beforeEach(() => {
    state = { loggedIn: true, permission: true, rate: true, blocked: false, saved: [], rates: [] };
    router = loadRouter(state);
  });
  async function post(content = "hello", location = "All", data = png) {
    const req = multipart([
      { name: "content", data: content }, { name: "location", data: location },
      { name: "image", data, type: "image/png", file: true },
    ]);
    req.session = { user: { _id: "owner-object-id" } };
    const res = response();
    await handler(router, "post", "/")(req, res);
    return res;
  }
  it("passes image and Markdown to the same save with authenticated author ownership", async () => {
    const res = await post();
    assert.equal(res.statusCode, 200);
    assert.equal(state.saved.length, 1);
    assert.equal(state.saved[0].author, "owner-object-id");
    assert.ok(Buffer.isBuffer(state.saved[0].image));
    assert.equal(state.saved[0].content, appendCommentImage("hello", "comment123"));
    assert.deepEqual(state.rates, ["postComment", "postCommentImage"]);
    assert.equal(res.body, null); // Never serialize the newly created binary doc.
  });
  it("supports an image-only comment", async () => {
    assert.equal((await post("")).statusCode, 200);
    assert.equal(state.saved[0].content, appendCommentImage("", "comment123"));
  });
  it("keeps 500 and 2000 character limits including generated Markdown", async () => {
    for (const [limit, location] of [[500, "All"], [2000, "setup123"]]) {
      const overhead = appendCommentImage("x", "comment123").length - 1;
      assert.equal((await post("x".repeat(limit - overhead), location)).statusCode, 200);
      assert.equal((await post("x".repeat(limit - overhead + 1), location)).statusCode, 422);
    }
    assert.equal(state.saved.length, 2);
  });
  it("rejects permission and rate failures before parsing images", async () => {
    state.permission = false;
    assert.equal((await post()).statusCode, 403);
    state.permission = true; state.rate = false;
    assert.equal((await post()).statusCode, 429);
    assert.equal(state.saved.length, 0);
  });
  it("never saves for logged-out or profile-blocked users", async () => {
    state.loggedIn = false;
    await post();
    state.loggedIn = true; state.profile = { id: "profile-owner" }; state.blocked = true;
    assert.equal((await post("hello", "profile-owner")).statusCode, 403);
    assert.equal(state.saved.length, 0);
  });
  it("rejects invalid image data and database failure without a separate upload", async () => {
    assert.equal((await post("hello", "All", Buffer.from("bad"))).statusCode, 422);
    state.saveError = true;
    assert.equal((await post()).statusCode, 500);
    assert.equal(state.saved.length, 0);
  });
  it("serves existing images with no-store and hides deleted and pending comments", async () => {
    state.doc = { image: Buffer.from("webp"), deleted: false, pending: false };
    const get = handler(router, "get", "/:id/image");
    const res = response();
    await get({ params: { id: "comment123" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["Cache-Control"], "private, no-store");
    assert.equal(res.headers["X-Content-Type-Options"], "nosniff");
    assert.equal(res.headers["Content-Type"], "image/webp");
    assert.ok(Buffer.isBuffer(res.body));
    state.doc.deleted = true;
    const hidden = response();
    await get({ params: { id: "comment123" } }, hidden);
    assert.equal(hidden.statusCode, 404);
    assert.equal(hidden.headers["Cache-Control"], "private, no-store");
    state.doc.deleted = false; state.doc.pending = true;
    const pending = response();
    await get({ params: { id: "comment123" } }, pending);
    assert.equal(pending.statusCode, 404);
    state.doc.pending = false;
    const restored = response();
    await get({ params: { id: "comment123" } }, restored);
    assert.equal(restored.statusCode, 200);
  });
  it("uses owning comment permissions for deletion and restoration", async () => {
    state.doc = { author: { id: "owner" }, location: "All", image: png, deleted: false, pending: false };
    state.permissions = { deleteOwnPost: true, deleteAnyPost: false, restoreDeleted: false };
    const req = { body: { comment: "comment123" } };
    const deleted = response();
    await handler(router, "post", "/delete")(req, deleted);
    assert.equal(deleted.statusCode, 200);
    assert.equal(state.doc.deleted, true);
    const refused = response();
    await handler(router, "post", "/restore")(req, refused);
    assert.equal(refused.statusCode, 403);
    assert.equal(state.doc.deleted, true);
    state.permissions.restoreDeleted = true;
    const restored = response();
    await handler(router, "post", "/restore")(req, restored);
    assert.equal(restored.statusCode, 200);
    assert.equal(state.doc.deleted, false);
    assert.deepEqual(state.doc.image, png);
  });
  it("cannot delete another user's attachment without comment moderation permission", async () => {
    state.doc = { author: { id: "someone-else" }, location: "All", image: png, deleted: false };
    state.permissions = { deleteOwnPost: true, deleteAnyPost: false };
    const res = response();
    await handler(router, "post", "/delete")({ body: { comment: "comment123" } }, res);
    assert.equal(res.statusCode, 403);
    assert.equal(state.doc.deleted, false);
  });
  it("returns a no-store 404 for malformed IDs and comments without images", async () => {
    for (const id of ["../private", "comment123"]) {
      const res = response();
      await handler(router, "get", "/:id/image")({ params: { id } }, res);
      assert.equal(res.statusCode, 404);
      assert.equal(res.headers["Cache-Control"], "private, no-store");
    }
  });
});

describe("comment clipboard selection", function () {
  let pastedCommentImage;
  before(async () => {
    ({ pastedCommentImage } = await import("../react_main/src/pages/Community/commentImagePaste.mjs"));
  });
  const item = (type, file) => ({ kind: "file", type, getAsFile: () => file });
  it("leaves plain text and URLs alone", () => {
    assert.equal(pastedCommentImage([{ kind: "string", type: "text/plain" }]), null);
  });
  it("selects the actual image after text or an unrelated file", () => {
    const image = { type: "image/png", size: 10 };
    assert.equal(pastedCommentImage([
      { kind: "string", type: "text/plain" }, item("application/pdf", {}),
      item("image/png", image),
    ]), image);
  });
  it("rejects multiple images, null files, unsupported types and oversized files", () => {
    const image = { type: "image/png", size: 10 };
    assert.throws(() => pastedCommentImage([item("image/png", image), item("image/png", image)]), /one image/);
    assert.throws(() => pastedCommentImage([item("image/png", null)]), /PNG/);
    assert.throws(() => pastedCommentImage([item("image/png", { type: "image/svg+xml", size: 1 })]), /PNG/);
    assert.throws(() => pastedCommentImage([item("image/png", { type: "image/png", size: MAX_IMAGE_BYTES + 1 })]), /5 MiB/);
  });
});
