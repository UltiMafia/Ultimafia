const { expect } = require("chai");
const { matchesWord } = require("../../../Games/types/DrawIt/wordMatch");

describe("DrawIt word matching", () => {
  it("matches exact lowercase", () => {
    expect(matchesWord("apple", "apple")).to.equal(true);
  });
  it("ignores case", () => {
    expect(matchesWord("Apple", "apple")).to.equal(true);
    expect(matchesWord("APPLE", "apple")).to.equal(true);
  });
  it("strips trailing punctuation", () => {
    expect(matchesWord("apple!", "apple")).to.equal(true);
    expect(matchesWord("apple.", "apple")).to.equal(true);
    expect(matchesWord("Apple?", "apple")).to.equal(true);
  });
  it("strips leading/trailing whitespace", () => {
    expect(matchesWord("  apple  ", "apple")).to.equal(true);
  });
  it("collapses internal whitespace", () => {
    expect(matchesWord("ap  ple", "apple")).to.equal(false);
  });
  it("requires whole-word match (no substring)", () => {
    expect(matchesWord("pineapple", "apple")).to.equal(false);
    expect(matchesWord("I think apple", "apple")).to.equal(false);
  });
  it("doesn't match similar but different words", () => {
    expect(matchesWord("apples", "apple")).to.equal(false);
    expect(matchesWord("aple", "apple")).to.equal(false);
  });
});
