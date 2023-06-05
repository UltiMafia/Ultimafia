const chai = require("chai"),
  assert = chai.assert,
  should = chai.should();
const Queue = require("../../Games/core/Queue");

describe("Games/Queue", function () {
  describe("Enqueue/dequeue", function () {
    it("should queue and dequeue items in the proper order", function () {
      var q = new Queue();
      var items = [
        { val: "a", priority: 2 },
        { val: "b", priority: 0 },
        { val: "c", priority: -10 },
        { val: "d", priority: 10 },
      ];

      for (let item of items) q.enqueue(item);

      q.dequeue().should.equal(items[2]);
      q.dequeue().should.equal(items[1]);
      q.dequeue().should.equal(items[0]);
      q.dequeue().should.equal(items[3]);
    });
  });

  describe("Peek", function () {
    it("should peek the next item", function () {
      var q = new Queue();
      var items = [
        { val: "a", priority: 2 },
        { val: "b", priority: 0 },
        { val: "c", priority: -10 },
        { val: "d", priority: 10 },
      ];

      for (let item of items) q.enqueue(item);

      q.peek().should.equal(items[2]);
      q.dequeue();
      q.peek().should.equal(items[1]);
      q.dequeue();
      q.peek().should.equal(items[0]);
      q.dequeue();
      q.peek().should.equal(items[3]);
      q.dequeue();
    });
  });

  describe("Remove", function () {
    it("should peek the given item", function () {
      var q = new Queue();
      var items = [
        { val: "a", priority: 2 },
        { val: "b", priority: 0 },
        { val: "c", priority: -10 },
        { val: "d", priority: 10 },
      ];

      for (let item of items) q.enqueue(item);

      q.remove(items[0]).should.equal(items[0]);
      should.not.exist(q.remove("test"));
      should.not.exist(q.remove(null));

      q.dequeue().should.equal(items[2]);
      q.dequeue().should.equal(items[1]);
      q.dequeue().should.equal(items[3]);
    });
  });

  describe("Empty", function () {
    it("should empty the queue", function () {
      var q = new Queue();
      var items = [
        { val: "a", priority: 2 },
        { val: "b", priority: 0 },
        { val: "c", priority: -10 },
        { val: "d", priority: 10 },
      ];

      for (let item of items) q.enqueue(item);

      q.empty();
      q.items.should.have.lengthOf(0);
    });
  });

  describe("Iterate", function () {
    it("should iterate through the queue in order", function () {
      var q = new Queue();
      var items = [
        { val: "a", priority: 2 },
        { val: "b", priority: 0 },
        { val: "c", priority: -10 },
        { val: "d", priority: 10 },
      ];

      for (let item of items) q.enqueue(item);

      var res = [];

      for (let item of q) res.push(item);

      res[0].should.equal(items[2]);
      res[1].should.equal(items[1]);
      res[2].should.equal(items[0]);
      res[3].should.equal(items[3]);
    });
  });
});
