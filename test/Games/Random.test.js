const chai = require("chai");

const { assert } = chai;
const should = chai.should();
const Random = require("../../lib/Random");

describe("Games/Random", () => {
  describe("Random float", () => {
    it("should generate a random distribution of floats", () => {
      let sum = 0;
      let count = 0;

      for (let i = 0; i < 10000; i++) {
        sum += Random.randFloat();
        count++;
      }

      const average = sum / count;
      average.should.be.greaterThan(0.49);
      average.should.be.lessThan(0.51);
    });
  });

  describe("Random integer", () => {
    it("should generate a random distribution of integers", () => {
      let sum = 0;
      let count = 0;

      for (let i = 0; i < 10000; i++) {
        sum += Random.randInt(1, 9);
        count++;
      }

      const average = sum / count;
      average.should.be.greaterThan(4.9);
      average.should.be.lessThan(5.1);
    });
  });

  describe("Random array value", () => {
    it("should select a value from the array", () => {
      const arr = [1, 2, 3, 4, 5];
      const val = Random.randArrayVal(arr);
      val.should.be.greaterThan(0);
      val.should.be.lessThan(6);
      arr.should.contain(val);
    });

    it("should select a value from the array and remove it", () => {
      const arr = [1, 2, 3, 4, 5];
      val = Random.randArrayVal(arr, true);
      val.should.be.greaterThan(0);
      val.should.be.lessThan(6);
      arr.should.not.contain(val);
    });

    it("should select a random distribution of items from the array", () => {
      const arr = [1, 2, 3, 4, 5];
      let sum = 0;
      let count = 0;

      for (let i = 0; i < 10000; i++) {
        sum += Random.randArrayVal(arr);
        count++;
      }

      const average = sum / count;
      average.should.be.greaterThan(2.9);
      average.should.be.lessThan(3.1);
    });
  });

  describe("Randomize array", () => {
    it("should give each element an equal chance of being placed at any index", () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      let sum = 0;
      let count = 0;

      for (let i = 0; i < 10000; i++) {
        const tempArr = Random.randomizeArray(arr);

        if (tempArr[0] == 5) sum++;

        count++;
      }

      const average = sum / count;
      average.should.be.greaterThan(0.09);
      average.should.be.lessThan(0.11);

      const randArr = Random.randomizeArray(arr);
      randArr.should.have.lengthOf(arr.length);
    });
  });
});
