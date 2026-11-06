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

function multipart(data, extra = []) {
  const boundary = "comment-image-test";
  const chunks = [];
  for (const part of [
    { name: "content", data: "hello" }, { name: "location", data: "owner" },
    { name: "image", data, type: "image/webp" }, ...extra,
  ]) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${part.name}"${part.type ? '; filename="image"' : ""}\r\n${part.type ? `Content-Type: ${part.type}\r\n` : ""}\r\n`));
    chunks.push(Buffer.isBuffer(part.data) ? part.data : Buffer.from(part.data));
    chunks.push(Buffer.from("\r\n"));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  const body = Buffer.concat(chunks);
  const req = Readable.from([body]);
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
  function Form() { const form = new formidable(); form.uploadDir = state.temp; return form; }
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

// Render the production component with controlled hooks and transport, following
// the route tests' isolated-service pattern. No DOM or live account is required.
function composer() {
  const filename = path.join(__dirname, "../react_main/src/pages/Community/Comments.jsx");
  const frontendRequire = createRequire(path.join(__dirname, "../react_main/package.json"));
  const babel = frontendRequire("@babel/core");
  const code = babel.transformSync(source(filename), {
    filename,
    babelrc: false, configFile: false,
    presets: [frontendRequire.resolve("@babel/preset-react")],
    plugins: [frontendRequire.resolve("@babel/plugin-transform-modules-commonjs")],
  }).code;
  const slots = [], effects = [], calls = [], revoked = [], created = [];
  let index = 0, tree;
  const React = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState(initial) {
      const i = index++;
      if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial;
      return [slots[i], (value) => { slots[i] = typeof value === "function" ? value(slots[i]) : value; }];
    },
    useRef(initial) { const i = index++; return slots[i] ||= { current: initial }; },
    useContext: () => ({ loggedIn: true, perms: { postReply: true }, settings: {} }),
    useEffect(fn, deps) {
      const i = index++;
      if (!slots[i] || deps.some((dep, j) => dep !== slots[i].deps[j])) {
        effects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; });
      }
    },
  };
  const axios = {
    get: async () => ({ data: { comments: [], maxPage: 1 } }),
    post: async (...args) => { calls.push(args); if (axios.fail) throw new Error("Post failed"); },
  };
  const mocks = {
    react: React, axios,
    "../../components/Alerts": { useErrorAlert: () => () => {} },
    "../../components/Basic": { filterProfanity: (value) => value },
    "../../components/Nav": { PageNav: "PageNav" },
    "../../components/Form": { TextEditor: "TextEditor" },
    "../../Contexts": {}, "../../components/Loading": { Loading: "Loading" },
    "@mui/material": Object.fromEntries(["Box", "Button", "Paper", "Stack", "Typography"].map((name) => [name, name])),
    "./Comment": { Comment: "Comment" },
  };
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports, FormData,
    URL: { createObjectURL: () => { const url = `blob:${created.length}`; created.push(url); return url; }, revokeObjectURL: (url) => revoked.push(url) },
    require: (name) => mocks[name] || (name.endsWith(".css") ? {} : frontendRequire(name)),
  }, { filename });
  const render = () => { index = 0; tree = module.exports.default({ location: "owner" }); effects.splice(0).forEach((fn) => fn()); };
  const find = (predicate, node = tree) => {
    if (!node || typeof node !== "object") return null;
    if (predicate(node)) return node;
    return (node.props?.children || []).flat(Infinity).map((child) => find(predicate, child)).find(Boolean);
  };
  return {
    calls, revoked, created, axios, render,
    editor: () => find((node) => node.type === "TextEditor"),
    button: (text) => find((node) => node.type === "Button" && node.props.children.flat(Infinity).includes(text)),
    async open() { render(); await new Promise(setImmediate); render(); this.button("Post Comment").props.onClick(); render(); },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
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
    state = { root, upload: path.join(root, "uploads"), temp: path.join(root, "temp"), saved: [], projections: [], errors: [], unlinks: [], busy: 0, uploadBusy: 0, permission: true };
    fs.mkdirSync(state.upload); fs.mkdirSync(state.temp);
    oldUpload = process.env.UPLOAD_PATH; process.env.UPLOAD_PATH = state.upload;
    router = loadRouter(state);
  });
  afterEach(() => {
    if (oldUpload === undefined) delete process.env.UPLOAD_PATH; else process.env.UPLOAD_PATH = oldUpload;
    fs.rmSync(state.root, { recursive: true, force: true });
  });
  async function post(data = webp, extra) {
    const res = response(); await handler(router, "/")(multipart(data, extra), res);
    res.diagnostic = state.errors.map((e) => e.stack || e).join("\n");
    return res;
  }
  it("cancel and Remove image revoke local previews without uploading or creating a file", async () => {
    const ui = composer();
    try {
      await ui.open();
      const file = new Blob([webp], { type: "image/webp" });
      ui.editor().props.onImageSelect(file); ui.render(); ui.render();
      assert.equal(ui.created.length, 1);
      ui.button("Remove image").props.onClick(); ui.render();
      assert.deepEqual(ui.revoked, ui.created);
      ui.editor().props.onImageSelect(file); ui.render(); ui.render();
      ui.button("Cancel").props.onClick(); ui.render();
      assert.deepEqual(ui.revoked, ui.created);
      assert.equal(ui.calls.length, 0);
      assert.deepEqual(fs.readdirSync(state.upload), []);
      assert.deepEqual(fs.readdirSync(state.temp), []);
    } finally { ui.unmount(); }
  });
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
  it("Post sends text and image together, keeps both on failure, and revokes on unmount", async () => {
    const ui = composer();
    try {
      await ui.open();
      ui.editor().props.onChange("my draft"); ui.render();
      ui.editor().props.onImageSelect(new Blob([webp], { type: "image/webp" }));
      ui.render(); ui.render();
      ui.axios.fail = true;
      const post = ui.button("Post").props.onClick;
      post(); post();
      await new Promise(setImmediate); ui.render();
      assert.equal(ui.calls.length, 1, "prevent double Post before rerender");
      assert.equal(ui.calls[0][0], "/api/comment");
      const body = ui.calls[0][1];
      assert.ok(body instanceof FormData);
      assert.equal(body.get("content"), "my draft");
      assert.equal(body.get("location"), "owner");
      assert.equal(body.get("image").size, webp.length);
      assert.equal(ui.editor().props.value, "my draft");
      assert.deepEqual(ui.revoked, []);
      assert.ok(ui.button("Remove image"));
    } finally { ui.unmount(); }
    assert.deepEqual(ui.revoked, ui.created);
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
