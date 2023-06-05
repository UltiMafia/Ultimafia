const chai = require("chai"),
  assert = chai.assert,
  should = chai.should();
const Utils = require("../../Games/core/Utils");

describe("Games/Utils", function () {
  describe("Remove spaces", function () {
    it("should remove spaces from a string", function () {
      var str = "this Is a Test";
      var res = Utils.removeSpaces(str);
      str.should.equal("this Is a Test");
      res.should.equal("thisIsaTest");
    });
  });

  describe("Snake case", function () {
    it("should convert a string to snake case", function () {
      var str = "this Is a Test";
      var res = Utils.snakeCase(str);
      str.should.equal("this Is a Test");
      res.should.equal("this_Is_a_Test");
    });
  });

  describe("Camel case", function () {
    it("should convert a string to camel case", function () {
      var str = "this Is a Test";
      var res = Utils.camelCase(str);
      str.should.equal("this Is a Test");
      res.should.equal("thisIsATest");
    });
  });

  describe("Pascal case", function () {
    it("should convert a string to pascal case", function () {
      var str = "this Is a Test";
      var res = Utils.pascalCase(str);
      str.should.equal("this Is a Test");
      res.should.equal("ThisIsATest");
    });
  });

  describe("Valid props", function () {
    it("should detect all valid object props", function () {
      Utils.validProp("test").should.be.true;
      Utils.validProp("constructor").should.be.false;
      Utils.validProp("__proto__").should.be.false;
    });
  });
});
