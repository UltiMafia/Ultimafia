import test from "node:test";
import assert from "node:assert/strict";
import { startSiteBootstrap, requiredSiteInfo, optionalSiteInfo } from "../src/lib/siteBootstrap.js";
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function fixture() {
  const pending = new Map([...requiredSiteInfo, ...optionalSiteInfo].map(([url]) => [url, deferred()]));
  const published = [], errors = []; let readyCount = 0;
  const bootstrap = startSiteBootstrap({ get: url => pending.get(url).promise, publish: (...value) => published.push(value), onReady: () => readyCount++, onError: (...error) => errors.push(error) });
  return { bootstrap, pending, published, errors, readyCount: () => readyCount };
}
test("stock, achievements and reference metadata cannot hold up the shell/game", async () => {
  const f = fixture();
  for (const [url] of requiredSiteInfo) f.pending.get(url).resolve({ data: url });
  await f.bootstrap.ready;
  assert.equal(f.readyCount(), 1); assert.equal(f.published.length, requiredSiteInfo.length);
  for (const [url] of optionalSiteInfo) f.pending.get(url).resolve({ data: url });
  await f.bootstrap.background;
  assert.equal(f.published.length, requiredSiteInfo.length + optionalSiteInfo.length);
  assert.equal(f.readyCount(), 1);
});
test("one failed essential request does not mount before other essential requests finish", async () => {
  const f = fixture(); f.pending.get(requiredSiteInfo[0][0]).reject(new Error("controlled"));
  await Promise.resolve(); await Promise.resolve(); assert.equal(f.readyCount(), 0);
  for (const [url] of requiredSiteInfo.slice(1)) f.pending.get(url).resolve({ data: {} });
  await f.bootstrap.ready;
  assert.equal(f.errors.length, 1); assert.equal(f.readyCount(), 1);
  f.bootstrap.cancel();
});
test("unmount/cancellation prevents late responses from changing provider state", async () => {
  const f = fixture(); f.bootstrap.cancel();
  for (const pending of f.pending.values()) pending.resolve({ data: {} });
  await Promise.all([f.bootstrap.ready, f.bootstrap.background]);
  assert.deepEqual(f.published, []); assert.equal(f.readyCount(), 0);
});
