const chai = require("chai"),
  should = chai.should(),
  expect = chai.expect;
const Game = require("../../Games/core/Game");
const Message = require("../../Games/core/Message");
const Spectator = require("../../Games/core/Spectator");
const routeUtils = require("../../routes/utils");

function makeSpectator(omniscient) {
  return {
    omniscient,
    heard: [],
    omniHeard: [],
    votes: [],
    hear(m) {
      this.heard.push(m);
    },
    hearOmniscient(m) {
      this.omniHeard.push(m);
    },
    seeVote(v) {
      this.votes.push(v);
    },
  };
}

function makePlayer(id, name) {
  return { id, name, hear() {}, speak: (m) => m, user: { settings: {} } };
}

function makeGame(overrides = {}) {
  const alice = makePlayer("a", "Alice");
  const bob = makePlayer("b", "Bob");
  const carl = makePlayer("c", "Carl");
  const players = [alice, bob, carl];
  players.array = () => players;
  const game = Object.create(Game.prototype);
  Object.assign(game, {
    lobby: "Testing",
    players,
    spectators: [makeSpectator(false), makeSpectator(true)],
    spectatorMeetFilter: { Village: true },
    history: { addAlert() {} },
    events: { emit() {} },
    alice,
    bob,
    carl,
    ...overrides,
  });
  return game;
}

function makeMeeting(game, name, members, extra = {}) {
  const list = members.map((p) => ({ id: p.id, player: p }));
  const memberMap = {};
  for (const m of list) memberMap[m.id] = m;
  return {
    id: name + "-id",
    name,
    game,
    group: extra.group || false,
    messages: [],
    members: Object.assign(memberMap, {
      length: list.length,
      array: () => list,
    }),
    getMeetingInfo() {
      return { id: this.id, name: this.name, itemId: "item1", messages: [] };
    },
  };
}

describe("Omniscient spectating (Developer, Testing lobby)", function () {
  describe("who gets it", function () {
    let original;
    beforeEach(() => {
      original = routeUtils.verifyPermission;
    });
    afterEach(() => {
      routeUtils.verifyPermission = original;
    });

    it("allows a devApi user in the Testing lobby", async function () {
      routeUtils.verifyPermission = async (id, perm) => perm == "devApi";
      const game = makeGame();
      (await game.canSpectateOmnisciently({ id: "dev" })).should.equal(true);
    });

    it("refuses a user without the Developer permission", async function () {
      routeUtils.verifyPermission = async () => false;
      const game = makeGame();
      (await game.canSpectateOmnisciently({ id: "u" })).should.equal(false);
    });

    it("refuses outside the Testing lobby, even for developers", async function () {
      routeUtils.verifyPermission = async () => true;
      for (const lobby of ["Main", "Sandbox", "Competitive", undefined]) {
        const game = makeGame({ lobby });
        (await game.canSpectateOmnisciently({ id: "dev" })).should.equal(
          false
        );
      }
    });
  });

  describe("what they see", function () {
    it("sends a Mafia meeting message to the omniscient spectator only", function () {
      const game = makeGame();
      const mafia = makeMeeting(game, "Mafia", [game.alice, game.bob]);
      const msg = new Message({
        sender: game.alice,
        content: "kill Carl",
        game,
        meeting: mafia,
        recipients: [game.alice, game.bob],
      });
      msg.send();

      const [normal, omni] = game.spectators;
      normal.heard.should.have.lengthOf(0);
      omni.omniHeard.should.have.lengthOf(1);
      omni.omniHeard[0].content.should.equal("kill Carl");
    });

    it("keeps public Village messages flowing to normal spectators once", function () {
      const game = makeGame();
      const village = makeMeeting(game, "Village", [game.alice, game.bob, game.carl], {
        group: true,
      });
      const msg = new Message({
        sender: game.alice,
        content: "hi",
        game,
        meeting: village,
        recipients: [game.alice, game.bob, game.carl],
      });
      msg.send();

      const [normal, omni] = game.spectators;
      normal.heard.should.have.lengthOf(1);
      omni.heard.should.have.lengthOf(0);
      omni.omniHeard.should.have.lengthOf(1);
    });

    it("labels a private alert with who received it", function () {
      const game = makeGame();
      const msg = new Message({
        content: "Carl is guilty",
        game,
        isServer: true,
        recipients: [game.bob],
      });
      msg.send();
      const info = game.getOmniscientMessageInfo(msg);
      info.content.should.equal("Carl is guilty");
      info.prefix.should.equal("to Bob");
      game.spectators[0].heard.should.have.lengthOf(0);
    });

    it("shows votes in hidden meetings only to the omniscient spectator", function () {
      const game = makeGame();
      game.spectatorsSeeVote({ voter: game.alice });
      game.omniscientSpectatorsSee("seeVote", { voter: game.alice });
      const [normal, omni] = game.spectators;
      normal.votes.should.have.lengthOf(1);
      omni.votes.should.have.lengthOf(1);
    });

    it("names the owner of a personal action and lists item actions inline", function () {
      const game = makeGame();
      const cop = makeMeeting(game, "Cop", [game.carl]);
      const info = game.getOmniscientMeetingInfo(cop);
      info.name.should.equal("Cop (Carl)");
      expect(info.itemId).to.equal(null);
      info.omniscient.should.equal(true);
    });

    it("reports true roles for every player", function () {
      const game = makeGame();
      game.alice.role = { name: "Mafioso", modifier: "" };
      game.carl.role = { name: "Cop", modifier: "Humble" };
      game.getTrueRoles().should.deep.equal({
        a: "Mafioso:",
        c: "Cop:Humble",
      });
    });
  });

  describe("normal spectators", function () {
    it("never get the omniscient view", function () {
      const spec = Object.create(Spectator.prototype);
      expect(spec.omniscient).to.equal(undefined);
    });
  });
});
