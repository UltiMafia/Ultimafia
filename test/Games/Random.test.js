const chai = require("chai"),
  assert = chai.assert,
  should = chai.should();
const Random = require("../../lib/Random");

describe("Games/Random", function () {
  describe("Random float", function () {
    it("should generate a random distribution of floats", function () {
      var sum = 0;
      var count = 0;

      for (let i = 0; i < 10000; i++) {
        sum += Random.randFloat();
        count++;
      }

      var average = sum / count;
      average.should.be.greaterThan(0.49);
      average.should.be.lessThan(0.51);
    });
  });

  describe("Random integer", function () {
    it("should generate a random distribution of integers", function () {
      var sum = 0;
      var count = 0;

      for (let i = 0; i < 10000; i++) {
        sum += Random.randInt(1, 9);
        count++;
      }

      var average = sum / count;
      average.should.be.greaterThan(4.9);
      average.should.be.lessThan(5.1);
    });
  });

  describe("Random array value", function () {
    it("should select a value from the array", function () {
      var arr = [1, 2, 3, 4, 5];
      var val = Random.randArrayVal(arr);
      val.should.be.greaterThan(0);
      val.should.be.lessThan(6);
      arr.should.contain(val);
    });

    it("should select a value from the array and remove it", function () {
      var arr = [1, 2, 3, 4, 5];
      val = Random.randArrayVal(arr, true);
      val.should.be.greaterThan(0);
      val.should.be.lessThan(6);
      arr.should.not.contain(val);
    });

    it("should select a random distribution of items from the array", function () {
      var arr = [1, 2, 3, 4, 5];
      var sum = 0;
      var count = 0;

      for (let i = 0; i < 10000; i++) {
        sum += Random.randArrayVal(arr);
        count++;
      }

      var average = sum / count;
      average.should.be.greaterThan(2.9);
      average.should.be.lessThan(3.1);
    });
  });

  describe("Randomize array", function () {
    it("should give each element an equal chance of being placed at any index", function () {
      var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      var sum = 0;
      var count = 0;

      for (let i = 0; i < 10000; i++) {
        let tempArr = Random.randomizeArray(arr);

        if (tempArr[0] == 5) sum++;

        count++;
      }

      var average = sum / count;
      average.should.be.greaterThan(0.09);
      average.should.be.lessThan(0.11);

      var randArr = Random.randomizeArray(arr);
      randArr.should.have.lengthOf(arr.length);
    });
  });
});
