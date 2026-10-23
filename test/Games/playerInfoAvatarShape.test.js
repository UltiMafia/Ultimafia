const chai = require("chai");
chai.should();

const User = require("../../Games/core/User");
const Player = require("../../Games/core/Player");

function makePlayer(anonymousGame, itemsOwned, gameAvatarShape) {
  const user = new User({
    id: "user1",
    socket: { send() {}, terminate() {} },
    name: "Ada",
    avatar: true,
    settings: {
      gameAvatarShape: gameAvatarShape,
      nameFont: "slab",
    },
    itemsOwned: itemsOwned,
  });
  const game = {
    anonymousGame: anonymousGame,
    players: [],
  };
  const player = new Player(user, game, false);
  game.players.push(player);
  return player;
}

describe("Player.getPlayerInfo avatar shape", function () {
  this.timeout(20000);

  it("sends square when the player owns Square and set in-game shape to square", function () {
    const info = makePlayer(false, { avatarShape: 1 }, "square").getPlayerInfo();
    info.avatarShape.should.equal("square");
  });

  it("sends circle in an anonymous game even when in-game shape is square", function () {
    const info = makePlayer(true, { avatarShape: 1 }, "square").getPlayerInfo();
    info.avatarShape.should.equal("circle");
  });

  it("sends circle when in-game shape is square but Square is not owned", function () {
    const info = makePlayer(false, { avatarShape: 0 }, "square").getPlayerInfo();
    info.avatarShape.should.equal("circle");
  });
});
