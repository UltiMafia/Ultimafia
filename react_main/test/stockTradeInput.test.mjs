import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boundedShareCount, MAX_SHARES_PER_TRADE } from "../src/utils/stockTradeInput.mjs";

test("stock trade preview input cannot cause an unbounded pricing loop", () => {
  for (const value of [0, -1, "", "invalid", Infinity, -Infinity, NaN]) assert.equal(boundedShareCount(value), 1);
  assert.equal(boundedShareCount(4.9), 4);
  assert.equal(boundedShareCount("100000000000"), 1000);
  assert.equal(boundedShareCount(1000), 1000);
});
test("client share limit matches the existing server limit without importing database code", () => {
  const source = readFileSync(new URL("../../lib/StockMarket.js", import.meta.url), "utf8");
  assert.equal(Number(source.match(/const MAX_SHARES_PER_TRADE = (\d+);/)[1]), MAX_SHARES_PER_TRADE);
});
