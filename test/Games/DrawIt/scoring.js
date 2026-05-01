const { expect } = require("chai");
const { guesserScore, drawerScore } = require("../../../Games/types/DrawIt/scoring");

describe("DrawIt scoring", () => {
  it("guesser gets 10/8/6/4/2/1 by rank", () => {
    expect(guesserScore(0)).to.equal(10);
    expect(guesserScore(1)).to.equal(8);
    expect(guesserScore(2)).to.equal(6);
    expect(guesserScore(3)).to.equal(4);
    expect(guesserScore(4)).to.equal(2);
    expect(guesserScore(5)).to.equal(1);
    expect(guesserScore(10)).to.equal(1);
  });
  it("drawer scores zero when no one guesses", () => {
    expect(drawerScore([])).to.equal(0);
  });
  it("drawer scores average rounded", () => {
    // ranks 0,1 -> 10, 8 -> avg 9
    expect(drawerScore([0, 1])).to.equal(9);
    // ranks 0,1,2,3,4,5 -> 10,8,6,4,2,1 -> avg 5.166 -> 5
    expect(drawerScore([0, 1, 2, 3, 4, 5])).to.equal(5);
  });
  it("drawer with single fastest guesser earns the full 10", () => {
    expect(drawerScore([0])).to.equal(10);
  });
});
