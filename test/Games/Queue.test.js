const chai = require("chai");

const { assert } = chai;
const should = chai.should();
const Queue = require("../../Games/core/Queue");

describe("Games/Queue", () => {
  describe("Enqueue/dequeue", () => {
    it("should queue and dequeue items in the proper order", () => {
      const q = new Queue();
      const items = [
        { val: "a", priority: 2 },
        { val: "b", priority: 0 },
        { val: "c", priority: -10 },
        { val: "d", priority: 10 },
      ];

      for (const item of items) q.enqueue(item);

      q.dequeue().should.equal(items[2]);
      q.dequeue().should.equal(items[1]);
      q.dequeue().should.equal(items[0]);
      q.dequeue().should.equal(items[3]);
    });
  });

  describe("Peek", () => {
    it("should peek the next item", () => {
      const q = new Queue();
      const items = [
        { val: "a", priority: 2 },
        { val: "b", priority: 0 },
        { val: "c", priority: -10 },
        { val: "d", priority: 10 },
      ];

      for (const item of items) q.enqueue(item);

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

  describe("Remove", () => {
    it("should peek the given item", () => {
      const q = new Queue();
      const items = [
        { val: "a", priority: 2 },
        { val: "b", priority: 0 },
        { val: "c", priority: -10 },
        { val: "d", priority: 10 },
      ];

      for (const item of items) q.enqueue(item);

      q.remove(items[0]).should.equal(items[0]);
      should.not.exist(q.remove("test"));
      should.not.exist(q.remove(null));

      q.dequeue().should.equal(items[2]);
      q.dequeue().should.equal(items[1]);
      q.dequeue().should.equal(items[3]);
    });
  });

  describe("Empty", () => {
    it("should empty the queue", () => {
      const q = new Queue();
      const items = [
        { val: "a", priority: 2 },
        { val: "b", priority: 0 },
        { val: "c", priority: -10 },
        { val: "d", priority: 10 },
      ];

      for (const item of items) q.enqueue(item);

      q.empty();
      q.items.should.have.lengthOf(0);
    });
  });

  describe("Iterate", () => {
    it("should iterate through the queue in order", () => {
      const q = new Queue();
      const items = [
        { val: "a", priority: 2 },
        { val: "b", priority: 0 },
        { val: "c", priority: -10 },
        { val: "d", priority: 10 },
      ];

      for (const item of items) q.enqueue(item);

      const res = [];

      for (const item of q) res.push(item);

      res[0].should.equal(items[2]);
      res[1].should.equal(items[1]);
      res[2].should.equal(items[0]);
      res[3].should.equal(items[3]);
    });
  });
});
