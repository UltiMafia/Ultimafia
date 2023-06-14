const chai = require("chai");

const { assert } = chai;
const should = chai.should();
const Utils = require("../../Games/core/Utils");

describe("Games/Utils", () => {
  describe("Remove spaces", () => {
    it("should remove spaces from a string", () => {
      const str = "this Is a Test";
      const res = Utils.removeSpaces(str);
      str.should.equal("this Is a Test");
      res.should.equal("thisIsaTest");
    });
  });

  describe("Snake case", () => {
    it("should convert a string to snake case", () => {
      const str = "this Is a Test";
      const res = Utils.snakeCase(str);
      str.should.equal("this Is a Test");
      res.should.equal("this_Is_a_Test");
    });
  });

  describe("Camel case", () => {
    it("should convert a string to camel case", () => {
      const str = "this Is a Test";
      const res = Utils.camelCase(str);
      str.should.equal("this Is a Test");
      res.should.equal("thisIsATest");
    });
  });

  describe("Pascal case", () => {
    it("should convert a string to pascal case", () => {
      const str = "this Is a Test";
      const res = Utils.pascalCase(str);
      str.should.equal("this Is a Test");
      res.should.equal("ThisIsATest");
    });
  });

  describe("Valid props", () => {
    it("should detect all valid object props", () => {
      Utils.validProp("test").should.be.true;
      Utils.validProp("constructor").should.be.false;
      Utils.validProp("__proto__").should.be.false;
    });
  });
});
