import assert from "node:assert/strict";
import { test } from "node:test";
import { appendForumQuote, canComposeForumReply } from "../src/pages/Community/Forums/forumReplyComposer.mjs";

const thread = { id: "topic", author: { id: "author" } };
const user = { id: "reader", perms: { postReply: true } };
test("ordinary permitted forum readers can compose", () => {
  assert.equal(canComposeForumReply(thread, user), true);
});
test("postReply is required even for the thread author", () => {
  assert.equal(canComposeForumReply(thread, { id: "author", perms: {} }), false);
});
test("locked threads require postInLocked", () => {
  assert.equal(canComposeForumReply({ ...thread, locked: true }, user), false);
  assert.equal(canComposeForumReply({ ...thread, locked: true }, {
    ...user, perms: { postReply: true, postInLocked: true },
  }), true);
});
test("muting still refuses a reader with locked-thread permission", () => {
  assert.equal(canComposeForumReply({ ...thread, isMuted: true }, {
    ...user, perms: { postReply: true, postInLocked: true },
  }), false);
});
test("restricted threads permit only their author or an allowed poster", () => {
  const restricted = { ...thread, restricted: true };
  assert.equal(canComposeForumReply(restricted, user), false);
  assert.equal(canComposeForumReply(restricted, { ...user, id: "author" }), true);
  assert.equal(canComposeForumReply({ ...restricted, isAllowedPoster: true }, user), true);
});
test("restriction and mute checks do not bypass postReply", () => {
  assert.equal(canComposeForumReply({ ...thread, restricted: true, isAllowedPoster: true }, {
    id: "reader", perms: {},
  }), false);
  assert.equal(canComposeForumReply({ ...thread, restricted: true, isMuted: true }, {
    ...user, id: "author",
  }), false);
});

const reply = { id: "original", author: { id: "alice", name: "Alice" }, content: "First line\n\nThird line" };
test("quote serialization preserves profile link, circular-arrow permalink and multiline blockquote", () => {
  assert.equal(appendForumQuote("My draft", reply, "topic"),
    "My draft\n\n> ##### [Alice](/user/alice) said: [↻](/community/forums/thread/topic?reply=original)\n> First line\n> \n> Third line\n\n");
});
test("vanity profiles remain preferred when quoting", () => {
  assert.match(appendForumQuote("", { ...reply, author: { ...reply.author, vanityUrl: "alice-page" } }, "topic"),
    /\[Alice\]\(\/user\/alice-page\)/);
});
test("thread and footer Reply keep the existing draft without adding a quote", () => {
  assert.equal(appendForumQuote("Existing draft", null, "topic"), "Existing draft");
});
test("switching quote targets retains typed draft and prior quote", () => {
  const first = appendForumQuote("Keep this", reply, "topic");
  const second = appendForumQuote(first + "My answer", { ...reply, id: "other" }, "topic");
  assert.ok(second.startsWith(first + "My answer"));
  assert.ok(second.includes("?reply=original"));
  assert.ok(second.includes("?reply=other"));
});
test("repeated Reply retains the existing append-another-quote policy", () => {
  const repeated = appendForumQuote(appendForumQuote("", reply, "topic"), reply, "topic");
  assert.equal(repeated.split("?reply=original").length - 1, 2);
});

test("clipboard selection preserves text and selects the actual image after unrelated items", async () => {
  const { pastedForumReplyImage } = await import("../src/pages/Community/Forums/forumReplyImagePaste.mjs");
  const image = { type: "image/png", size: 20 };
  const item = { kind: "file", type: "image/png", getAsFile: () => image };
  assert.equal(pastedForumReplyImage([{ kind: "string", type: "text/plain" }]), null);
  assert.equal(pastedForumReplyImage([
    { kind: "string", type: "text/plain" },
    { kind: "file", type: "application/pdf", getAsFile: () => ({}) }, item,
  ]), image);
  assert.throws(() => pastedForumReplyImage([item, item]), /one image/);
  assert.throws(() => pastedForumReplyImage([{ ...item, getAsFile: () => null }]), /PNG/);
  assert.throws(() => pastedForumReplyImage([{ ...item, getAsFile: () => ({ type: "image/svg+xml", size: 1 }) }]), /PNG/);
  assert.throws(() => pastedForumReplyImage([{ ...item, getAsFile: () => ({ type: "image/png", size: 5 * 1024 * 1024 + 1 }) }]), /5 MiB/);
});
