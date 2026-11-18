const assert = require("assert");
const ExcessRolesInfo = require("../../../Games/types/Mafia/information/ExcessRolesInfo");
const TrueAndFalseInfo = require("../../../Games/types/Mafia/information/TrueAndFalseInfo");
const { roleEquals } = require("../../../lib/roleIdentity");

const clone = (value) => JSON.parse(JSON.stringify(value));

function excessGame(possibleRoles, activeRoles) {
  return {
    PossibleRoles: possibleRoles,
    players: activeRoles.map((role) => ({ role: {
      name: role.name,
      modifier: role.modifiers.join("/"),
      toRoleData: () => clone(role),
    } })),
    formatRoleInternal(name, modifier) {
      return modifier ? `${name}:${modifier}` : `${name}:`;
    },
    getRoleAlignment: () => "Village",
  };
}

describe("Mafia excess-role identities", function () {
  it("does not call the sole candidate excess when that full identity is in play", function () {
    const candidate = { name: "Doctor", modifiers: ["Loyal"], items: ["Potion"] };
    const game = excessGame([clone(candidate)], [candidate]);
    const info = new ExcessRolesInfo(null, game, 1, false);

    assert.deepEqual(info.mainInfo, []);
    assert.equal(info.LimtedExcess, true);
  });

  it("matches full modified and item-bearing identities in true/false checks", function () {
    const candidates = [
      { name: "Doctor", modifiers: ["Loyal"], items: ["Potion"] },
      { name: "Guard", modifiers: ["Retired"], items: [{ type: "Armor", args: [{ level: 2 }] }] },
    ];
    const game = excessGame(candidates.map(clone), candidates);
    const info = Object.create(ExcessRolesInfo.prototype);
    info.game = game;
    info.amount = 1;
    info.goodRolesOnly = false;
    info.mainInfo = [clone(candidates[0])];

    assert.equal(info.isTrue(), false);
    assert.equal(info.isFalse(), true);
  });

  it("keeps same-name variants with different modifiers or inventories excess", function () {
    const active = { name: "Doctor", modifiers: ["Loyal"], items: ["Potion"] };
    const variants = [
      { name: "Doctor", modifiers: ["Insane"], items: ["Potion"] },
      { name: "Doctor", modifiers: ["Loyal"], items: ["Gun"] },
    ];
    const info = new ExcessRolesInfo(null, excessGame([clone(active), ...variants.map(clone)], [active]), 2, false);

    assert.equal(info.mainInfo.length, 2);
    for (const variant of variants) {
      assert(info.mainInfo.some((role) => roleEquals(role, variant)));
    }
  });

  it("makeTrue and makeFalse retain descriptor identities including modifiers and items", function () {
    const active = { name: "Doctor", modifiers: ["Loyal"], items: ["Potion"] };
    const inactive = { name: "Guard", modifiers: ["Retired"], items: [{ type: "Armor", args: [{ level: 2 }] }] };
    const game = excessGame([clone(active), clone(inactive)], [active]);
    const info = Object.create(ExcessRolesInfo.prototype);
    info.game = game;
    info.amount = 1;
    info.goodRolesOnly = false;

    info.makeTrue();
    assert.equal(info.mainInfo.length, 1);
    assert(roleEquals(info.mainInfo[0], inactive));

    info.makeFalse();
    assert.equal(info.mainInfo.length, 1);
    assert.equal(typeof info.mainInfo[0], "object");
    assert.deepStrictEqual(info.mainInfo[0], active);
    assert.notStrictEqual(info.mainInfo[0], game.players[0].role);
    assert(roleEquals(info.mainInfo[0], active));
  });

  it("treats semantically equal cloned descriptors as the same identity", function () {
    const active = { name: "Doctor", modifiers: ["Loyal", "Retired"], items: [{ type: "Armor", args: [{ b: 2, a: 1 }] }] };
    const equivalent = { name: "Doctor", modifiers: ["Retired", "Loyal"], items: [{ type: "Armor", args: [{ a: 1, b: 2 }] }] };
    const info = new ExcessRolesInfo(null, excessGame([equivalent], [active]), 1, false);

    assert.deepEqual(info.mainInfo, []);
  });

  it("does not offer ExcessRolesInfo when no full-identity excess role remains", function () {
    const role = { name: "Doctor", modifiers: ["Loyal"], items: ["Potion"] };
    const players = Array.from({ length: 4 }, () => ({ role: clone(role), items: [] }));
    const game = {
      PossibleRoles: [clone(role)],
      players,
      alivePlayers: () => players,
      deadPlayers: () => [],
      isNoReveal: () => false,
      getRoleTags: () => [],
      getRoleAlignment: () => "Village",
      formatRoleInternal: (name, modifier) => `${name}:${modifier}`,
      createInformation(name) {
        return { name, makeTrue() {}, makeFalse() {}, isTrue: () => true, isFalse: () => false,
          isFavorable: () => true, isUnfavorable: () => true, getInfoSpecial: () => "stub" };
      },
    };
    const info = new TrueAndFalseInfo(null, game);

    assert(!info.possibleInfo.includes("ExcessRolesInfo"));
  });
});
