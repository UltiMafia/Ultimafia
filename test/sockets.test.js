const chai = require("chai");

const should = chai.should();
const db = require("../db/db");
const sockets = require("../lib/sockets");

describe("Sockets", () => {
  describe("Message stringify", () => {
    it("should properly stringify the message", async () => {
      let message = sockets.stringifyMessage("test", "data");
      message.should.equal("test:string:data");

      message = sockets.stringifyMessage("test", 1);
      message.should.equal("test:number:1");

      message = sockets.stringifyMessage("test", true);
      message.should.equal("test:boolean:true");

      message = sockets.stringifyMessage("test", { a: 1 });
      message.should.equal('test:object:{"a":1}');

      message = sockets.stringifyMessage("test", [1, 2, 3]);
      message.should.equal("test:object:[1,2,3]");

      message = sockets.stringifyMessage("test", null);
      message.should.equal("test:object:null");
    });
  });

  describe("Message parse", () => {
    it("should properly parse a stringified message", async () => {
      let message = "test:string:data";
      let [eventName, data] = sockets.parseMessage(message);
      eventName.should.equal("test");
      data.should.equal("data");

      message = "test:number:1";
      [eventName, data] = sockets.parseMessage(message);
      eventName.should.equal("test");
      data.should.equal(1);

      message = "test:boolean:true";
      [eventName, data] = sockets.parseMessage(message);
      eventName.should.equal("test");
      data.should.equal(true);

      message = 'test:object:{"a":1}';
      [eventName, data] = sockets.parseMessage(message);
      eventName.should.equal("test");
      should.exist(data);
      data.a.should.equal(1);

      message = "test:object:[1,2,3]";
      [eventName, data] = sockets.parseMessage(message);
      eventName.should.equal("test");
      should.exist(data);
      data.should.have.lengthOf(3);
      data[0].should.equal(1);
      data[1].should.equal(2);
      data[2].should.equal(3);

      message = "test:object:null";
      [eventName, data] = sockets.parseMessage(message);
      eventName.should.equal("test");
      should.not.exist(data);
    });
  });
});
