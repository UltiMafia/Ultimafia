const assert = require("node:assert/strict");
const {
  applyNameGlowStyle,
  nameGlowStyle,
} = require("../src/utils/nameGlowStyle.js");

// CSSStyleDeclaration surface used by the helper, including priority handling.
const values = new Map();
const style = {
  setProperty(key, value, priority = "") {
    values.set(key, { value: String(value), priority });
  },
  getPropertyValue(key) {
    return values.get(key)?.value || "";
  },
  getPropertyPriority(key) {
    return values.get(key)?.priority || "";
  },
  removeProperty(key) {
    values.delete(key);
  },
};
style.setProperty("--name-glow-rgb", "12 34 56", "important");
style.setProperty("--name-glow-dim-alpha", "0.4");
style.setProperty("--unrelated", "keep");
const original = new Map(values);
const cleanup = applyNameGlowStyle({ style }, nameGlowStyle("#60a5fa"));
assert.equal(style.getPropertyValue("--name-glow-rgb"), "96 165 250");
assert.equal(style.getPropertyPriority("--name-glow-rgb"), "");
cleanup();
assert.deepEqual(
  values,
  original,
  "restore existing values/priorities and remove only newly added keys"
);
assert.deepEqual(nameGlowStyle("inherit"), {});
assert.deepEqual(nameGlowStyle("var(--example)"), {});
assert.equal(
  nameGlowStyle("rgba(96,165,250,.5)")["--name-glow-rgb"],
  "96 165 250"
);
console.log("GLOW_STYLE_RESTORATION_PASS");
