const { expect } = require("chai");
const Game = require("../../Games/core/Game");
const Spectator = require("../../Games/core/Spectator");
const Role = require("../../Games/core/Role");
const roleIdentity = require("../../lib/roleIdentity");

function role(name, modifiers, items) {
  return Object.assign(Object.create(Role.prototype), {
    name,
    modifier: modifiers.join("/"),
    roleItems: items,
  });
}

describe("live omniscient role reveal boundary", function () {
  it("emits canonical string keys preserving modified and starting-item role identity", function () {
    const modified = role("Cop", ["Humble", "Insomniac"], []);
    const equipped = role("Villager", ["Loud"], [
      { type: "Gun", args: [{ reveal: true, shooterMask: "a:b,c" }] },
      "Armor",
    ]);
    const game = Object.create(Game.prototype);
    game.players = [
      { id: "modified-player", role: modified },
      { id: "equipped-player", role: equipped },
    ];

    const emitted = [];
    const spectator = Object.create(Spectator.prototype);
    spectator.game = game;
    spectator.socket = {
      send(event, payload) {
        emitted.push({ event, payload });
      },
    };

    spectator.sendTrueRoles();

    expect(emitted).to.have.length(2);
    expect(emitted.map(({ event }) => event)).to.deep.equal(["reveal", "reveal"]);
    const reveals = Object.fromEntries(
      emitted.map(({ payload }) => [payload.playerId, payload.role])
    );
    const modifiedKey = roleIdentity.roleKey(modified);
    const equippedKey = roleIdentity.roleKey(equipped);
    expect(reveals).to.deep.equal({
      "modified-player": modifiedKey,
      "equipped-player": equippedKey,
    });
    for (const reveal of Object.values(reveals)) expect(reveal).to.be.a("string");
    expect(roleIdentity.normalizeRole(reveals["modified-player"])).to.deep.equal({
      name: "Cop",
      modifiers: ["Humble", "Insomniac"],
      items: [],
    });
    expect(roleIdentity.normalizeRole(reveals["equipped-player"])).to.deep.equal({
      name: "Villager",
      modifiers: ["Loud"],
      items: [
        { type: "Gun", args: [{ reveal: true, shooterMask: "a:b,c" }] },
        "Armor",
      ],
    });
  });
});
