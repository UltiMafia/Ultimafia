const chai = require("chai"),
  should = chai.should();
const {
  TEXT_EFFECT_NAMES,
  parseTextEffect,
  isTextEffect,
} = require("../shared/textEffects");
const Player = require("../Games/core/Player");
const User = require("../Games/core/User");
const Message = require("../Games/core/Message");

// Runs the server-side gate on a stand-in player, without a game.
function gate(content, owner, extra = {}) {
  const alerts = [];
  const player = {
    user: { textEffects: owner },
    sendAlert: (text) => alerts.push(text),
  };
  const message = { content, meetingId: "m", ...extra };
  const blocked = Player.prototype.applyTextEffect.call(player, message);
  return { blocked, message, alerts };
}

describe("Text effects", function () {
  describe("command parsing", function () {
    it("has the six effects", function () {
      TEXT_EFFECT_NAMES.should.deep.equal([
        "wave",
        "shake",
        "glow",
        "rainbow",
        "slide",
        "flash",
      ]);
      for (const name of TEXT_EFFECT_NAMES) isTextEffect(name).should.equal(true);
      isTextEffect("blink").should.equal(false);
      isTextEffect(undefined).should.equal(false);
    });

    it("strips each command and keeps the text", function () {
      for (const name of TEXT_EFFECT_NAMES)
        parseTextEffect(`/${name} hello there`).should.deep.equal({
          effect: name,
          text: "hello there",
        });
    });

    it("ignores case and surrounding spaces", function () {
      parseTextEffect("/WAVE   hi  ").should.deep.equal({ effect: "wave", text: "hi" });
    });

    it("returns empty text for a bare command", function () {
      parseTextEffect("/wave").should.deep.equal({ effect: "wave", text: "" });
      parseTextEffect("/wave    ").should.deep.equal({ effect: "wave", text: "" });
    });

    it("the client copy matches the server", function () {
      const client = require("../react_main/src/shared/textEffects");
      client.TEXT_EFFECTS.should.deep.equal(require("../shared/textEffects").TEXT_EFFECTS);
      for (const input of ["/wave hi", "/WAVE  hi ", "/wave", "/waves x", "/role Cop", "hi"])
        should.equal(JSON.stringify(client.parseTextEffect(input)), JSON.stringify(parseTextEffect(input)));
    });

    it("leaves unknown commands and normal chat alone", function () {
      should.equal(parseTextEffect("/waves hi"), null);
      should.equal(parseTextEffect("/foo hi"), null);
      should.equal(parseTextEffect("/role Cop"), null);
      should.equal(parseTextEffect("/me waves"), null);
      should.equal(parseTextEffect("hello /wave"), null);
      should.equal(parseTextEffect("wave hello"), null);
      should.equal(parseTextEffect(""), null);
      should.equal(parseTextEffect(null), null);
    });
  });

  describe("server gating", function () {
    it("gives an owner the effect and sends plain text", function () {
      const { blocked, message, alerts } = gate("/wave hello", true);
      blocked.should.equal(false);
      message.content.should.equal("hello");
      message.textEffect.should.equal("wave");
      alerts.should.have.lengthOf(0);
    });

    it("refuses a non-owner with a notice and sends nothing", function () {
      const { blocked, message, alerts } = gate("/rainbow hello", false);
      blocked.should.equal(true);
      should.not.exist(message.textEffect);
      alerts.should.have.lengthOf(1);
      alerts[0].should.include("/rainbow requires the Advanced Text Effects shop item");
    });

    it("asks for text when an owner sends a bare command", function () {
      const { blocked, message, alerts } = gate("/wave", true);
      blocked.should.equal(true);
      should.not.exist(message.textEffect);
      alerts.should.have.lengthOf(1);
      alerts[0].should.include("Type a message after /wave");
    });

    it("passes unknown commands on to the normal command handling", function () {
      const { blocked, message, alerts } = gate("/foo hello", true);
      blocked.should.equal(false);
      message.content.should.equal("/foo hello");
      should.not.exist(message.textEffect);
      alerts.should.have.lengthOf(0);
    });

    it("drops an effect a client tries to attach itself", function () {
      const plain = gate("hello", false, { textEffect: "wave" });
      plain.blocked.should.equal(false);
      should.not.exist(plain.message.textEffect);

      const swapped = gate("/glow hi", true, { textEffect: "rainbow" });
      swapped.message.textEffect.should.equal("glow");
    });

    it("only game users who bought the item own it", function () {
      new User({ id: "a", itemsOwned: { textEffects: 1 } }).textEffects.should.equal(true);
      new User({ id: "b", itemsOwned: { textEffects: 0 } }).textEffects.should.equal(false);
      new User({ id: "c", itemsOwned: {} }).textEffects.should.equal(false);
      new User({ id: "d" }).textEffects.should.equal(false);
    });
  });
  describe("what players receive", function () {
    function infoFor(senderExtra, messageExtra = {}) {
      const sender = { id: "p1", alive: true, user: { settings: {} }, ...senderExtra };
      const message = new Message({ sender, content: "hello", textEffect: "wave", ...messageExtra });
      const viewer = { id: "p2", alive: true };
      message.versions["*"] = message;
      message.versions[viewer.id] = message;
      return message.getMessageInfo(viewer);
    }

    it("carries the effect next to the plain content", function () {
      const info = infoFor({});
      info.content.should.equal("hello");
      info.textEffect.should.equal("wave");
    });

    it("drops the effect for anonymous senders so it cannot identify them", function () {
      should.not.exist(infoFor({}, { anonymous: true }).textEffect);
      should.not.exist(infoFor({ anonId: "deck1" }).textEffect);
    });
  });
});
