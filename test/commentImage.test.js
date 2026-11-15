const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { Readable } = require("node:stream");
const { createRequire } = require("node:module");
const sharp = require("sharp");
const { execFileSync } = require("node:child_process");

function source(filename) {
  const root = path.join(__dirname, "..");
  return process.env.COMMENT_IMAGE_BASELINE
    ? execFileSync("git", ["show", `${process.env.COMMENT_IMAGE_BASELINE}:${path.relative(root, filename).replaceAll(path.sep, "/")}`], { cwd: root, encoding: "utf8" })
    : fs.readFileSync(filename, "utf8");
}

function multipart(data, extra = [], { before = [], split } = {}) {
  const boundary = "comment-image-test";
  const chunks = [];
  for (const part of [
    { name: "content", data: "hello" }, { name: "location", data: "owner" },
    ...before, { name: "image", data, type: "image/webp" }, ...extra,
  ]) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${part.name}"${part.type ? '; filename="image"' : ""}\r\n${part.type ? `Content-Type: ${part.type}\r\n` : ""}\r\n`));
    chunks.push(Buffer.isBuffer(part.data) ? part.data : Buffer.from(part.data));
    chunks.push(Buffer.from("\r\n"));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  const body = Buffer.concat(chunks);
  // split cuts the body into two chunks at the offset it returns.
  const req = Readable.from(split ? [body.subarray(0, split(body)), body.subarray(split(body))] : [body]);
  req.headers = { "content-type": `multipart/form-data; boundary=${boundary}`, "content-length": body.length };
  req.is = () => true;
  req.body = {};
  req.session = { user: { _id: "owner-object" } };
  return req;
}

function loadRouter(state) {
  const filename = path.join(__dirname, "../routes/comment.js");
  const nativeRequire = createRequire(filename);
  const query = (value) => ({
    select(projection) { state.projections.push(projection); return this; },
    populate() { return this; }, lean() { return this; },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  });
  class Comment {
    constructor(value) { Object.assign(this, value); }
    async save() {
      state.filesAtSave = fs.readdirSync(state.upload);
      if (state.saveError) throw new Error("Database unavailable");
      state.saved.push(this);
    }
  }
  Comment.findOne = () => query(state.doc);
  Comment.updateOne = (filter, update) => ({ exec: async () => {
    if (state.updateError) throw new Error("Database unavailable");
    Object.assign(state.doc, update.$set);
  } });
  const formidable = require("formidable");
  function Form() {
    const form = new formidable(); form.uploadDir = state.temp;
    form.on("fileBegin", () => { state.fileBegins++; });
    return form;
  }
  Form.prototype = formidable.prototype;
  Form.IncomingForm = Form;
  const fileSystem = { ...fs, promises: { ...fs.promises, unlink: async (file) => {
    state.unlinks.push(file);
    if (path.dirname(file) === state.temp && state.busy > 0) {
      state.busy--;
      throw Object.assign(new Error("File busy"), { code: "EBUSY" });
    }
    if (path.dirname(file) === state.upload && state.uploadBusy > 0) {
      state.uploadBusy--;
      throw Object.assign(new Error("File busy"), { code: "EBUSY" });
    }
    return fs.promises.unlink(file);
  } } };
  const mocks = {
    formidable: Form, fs: fileSystem,
    "../db/models": { Comment, User: { findOne: () => query(null) } },
    "./utils": {
      verifyLoggedIn: async () => "owner",
      verifyPermission: async () => state.permission,
      rateLimit: async () => true, createModAction() {},
    },
    "../modules/redis": {}, "../modules/blocks": { usersBlockEachOther: async () => false },
    "../modules/reactions": {},
    "../modules/logging": () => ({ error(e) { state.errors.push(e); }, warn(e) { state.errors.push(e); } }),
  };
  const module = { exports: {} };
  vm.runInNewContext(source(filename), {
    module, exports: module.exports, process, Buffer, setTimeout,
    require: (name) => Object.hasOwn(mocks, name) ? mocks[name] : nativeRequire(name),
  }, { filename });
  return module.exports;
}
function handler(router, url) {
  return router.stack.find((layer) => layer.route?.path === url && layer.route.methods.post).route.stack[0].handle;
}
function response() {
  return {
    statusCode: 200, status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; return this; }, sendStatus(code) { this.statusCode = code; },
  };
}

describe("comment image lifecycle (real Formidable, Sharp and files; mocked database)", function () {
  this.timeout(10000);
  let state, router, webp, oldUpload;
  before(async () => { webp = await sharp({ create: { width: 16, height: 8, channels: 3, background: "#abc" } }).webp().toBuffer(); });
  beforeEach(() => {
    // Keep all runtime files within this checkout, separate from concurrent tests.
    fs.mkdirSync(path.join(__dirname, "../node_modules/.cache"), { recursive: true });
    const root = fs.mkdtempSync(path.join(__dirname, "../node_modules/.cache/comment-image-"));
    state = { root, upload: path.join(root, "uploads"), temp: path.join(root, "temp"), saved: [], fileBegins: 0, projections: [], errors: [], unlinks: [], busy: 0, uploadBusy: 0, permission: true };
    fs.mkdirSync(state.upload); fs.mkdirSync(state.temp);
    oldUpload = process.env.UPLOAD_PATH; process.env.UPLOAD_PATH = state.upload;
    router = loadRouter(state);
  });
  afterEach(() => {
    if (oldUpload === undefined) delete process.env.UPLOAD_PATH; else process.env.UPLOAD_PATH = oldUpload;
    fs.rmSync(state.root, { recursive: true, force: true });
  });
  async function post(data = webp, extra, options) {
    const res = response();
    let timer;
    await Promise.race([
      handler(router, "/")(multipart(data, extra, options), res),
      new Promise((resolve, reject) => { timer = setTimeout(reject, 5000, new Error("post() did not resolve")); }),
    ]).finally(() => clearTimeout(timer));
    res.diagnostic = state.errors.map((e) => e.stack || e).join("\n");
    return res;
  }
  it("removes the written public image and parser file if saving the comment fails", async () => {
    state.saveError = true;
    const res = await post();
    assert.equal(res.statusCode, 500, res.diagnostic);
    assert.equal(state.filesAtSave.length, 1, "must exercise a failure after output was written");
    assert.deepEqual(fs.readdirSync(state.upload), []);
    assert.deepEqual(fs.readdirSync(state.temp), []);
  });
  it("stores the attachment reference and deletes its file with the comment", async () => {
    const posted = await post();
    assert.equal(posted.statusCode, 200, posted.diagnostic);
    assert.equal(state.saved.length, 1);
    const comment = state.saved[0];
    assert.match(comment.imagePath, /^pasted_.*\.webp$/);
    assert.ok(comment.content.includes(`/uploads/${comment.imagePath}`));
    assert.ok(fs.existsSync(path.join(state.upload, comment.imagePath)));
    state.doc = { ...comment, author: { id: "owner" } };
    const res = response();
    await handler(router, "/delete")({ body: { comment: comment.id } }, res);
    assert.equal(res.statusCode, 200);
    assert.ok(state.projections.some((projection) => projection.includes("imagePath")));
    assert.equal(state.doc.deleted, true);
    assert.deepEqual(fs.readdirSync(state.upload), []);
  });
  it("keeps the comment visible and deletable when removing its picture fails", async () => {
    const posted = await post();
    assert.equal(posted.statusCode, 200, posted.diagnostic);
    const comment = state.saved[0];
    const file = path.join(state.upload, comment.imagePath);
    state.doc = { ...comment, author: { id: "owner" } };
    state.uploadBusy = 100;
    const failed = response();
    await handler(router, "/delete")({ body: { comment: comment.id } }, failed);
    assert.notEqual(failed.statusCode, 200);
    assert.notEqual(state.doc.deleted, true);
    assert.ok(fs.existsSync(file));
    state.uploadBusy = 0;
    const retried = response();
    await handler(router, "/delete")({ body: { comment: comment.id } }, retried);
    assert.equal(retried.statusCode, 200);
    assert.equal(state.doc.deleted, true);
    assert.deepEqual(fs.readdirSync(state.upload), []);
  });
  it("repeated WebP posts remove all temporary files, retrying transient EBUSY", async () => {
    for (let i = 0; i < 4; i++) {
      state.busy = 2;
      const posted = await post();
      assert.equal(posted.statusCode, 200, posted.diagnostic);
      assert.equal(state.busy, 0);
      assert.deepEqual(fs.readdirSync(state.temp), []);
    }
    assert.equal(fs.readdirSync(state.upload).length, 4);
    assert.equal(state.unlinks.filter((file) => path.dirname(file) === state.temp).length, 12);
  });
  for (const format of ["png", "jpeg", "webp"]) {
    it(`preserves decoded ${format} acceptance and removes temporary sources`, async () => {
      // The old route decides by decoded format, not the supplied WebP label.
      const data = await sharp(webp)[format]().toBuffer();
      const res = await post(data);
      assert.equal(res.statusCode, 200, res.diagnostic);
      const file = path.join(state.upload, state.saved[0].imagePath);
      const metadata = await sharp(await fs.promises.readFile(file)).metadata();
      assert.equal(metadata.format, "webp");
      assert.ok(metadata.width <= 1024 && metadata.height <= 1024);
      assert.deepEqual(fs.readdirSync(state.temp), []);
    });
  }
  it("keeps the format, 5 MiB file, 8192-byte fields and 16-million-pixel checks", async () => {
    const pixels = await sharp({ create: { width: 4001, height: 4000, channels: 3, background: "#abc" } }).png().toBuffer();
    const gif = await sharp(webp).gif().toBuffer();
    for (const [data, extra] of [
      [Buffer.from("not an image")], [gif], [pixels], [Buffer.alloc(5 * 1024 * 1024 + 1)],
      [webp, [{ name: "content", data: "x".repeat(8193) }]],
    ]) {
      assert.equal((await post(data, extra)).statusCode, 422);
      assert.equal(state.saved.length, 0);
      assert.deepEqual(fs.readdirSync(state.upload), []);
      assert.deepEqual(fs.readdirSync(state.temp), []);
    }
  });
  it("stops parsing at a second file part or one not named image", async () => {
    const empty = { name: "image", data: "", type: "image/png" };
    const other = { name: "other", data: webp, type: "image/webp" };
    // The image after a rejected part is still in the received chunk; the last
    // case cuts that chunk inside its data, so the part never ends.
    const cut = (body) => body.lastIndexOf(webp) + 4;
    for (const [extra, options, fileBegins] of [
      [Array(1000).fill(empty), {}, 1],
      [[{ name: "image", data: webp, type: "image/webp" }], {}, 1],
      [[other], {}, 1],
      [[], { before: [other] }, 0],
      [[], { before: [other], split: cut }, 0],
    ]) {
      state.fileBegins = 0;
      assert.equal((await post(webp, extra, options)).statusCode, 422);
      assert.equal(state.fileBegins, fileBegins);
      assert.equal(state.saved.length, 0);
      assert.deepEqual(fs.readdirSync(state.upload), []);
      assert.deepEqual(fs.readdirSync(state.temp), []);
    }
  });
  it("keeps JSON text-only posts working without an upload", async () => {
    const res = response();
    await handler(router, "/")({ body: { content: "text", location: "owner" }, session: { user: { _id: "owner-object" } } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(state.saved[0].content, "text");
    assert.equal(state.saved[0].imagePath, undefined);
    assert.deepEqual(fs.readdirSync(state.upload), []);
  });
  it("bounds EBUSY cleanup at four attempts and reports an exhausted retry", async () => {
    state.busy = 100;
    const res = await post();
    assert.equal(res.statusCode, 200);
    assert.equal(state.unlinks.filter((file) => path.dirname(file) === state.temp).length, 4);
    assert.equal(state.busy, 96);
    assert.ok(state.errors.includes("Could not remove comment image:"));
  });
});
