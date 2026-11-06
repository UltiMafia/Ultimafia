const assert = require("assert");
const Role = require("../../Games/core/Role");
const Player = require("../../Games/core/Player");
const Game = require("../../Games/core/Game");

describe("Role object identity", function () {
  it("exports a detached role descriptor with current identity and custom item definitions", function () {
    const player = {
      game: { events: { on() {} }, type: "Mafia" },
    };
    const role = new Role("Villager", player);
    role.modifier = "Quiet/Brave";
    role.roleItems.push("Knife", { type: "Potion", args: [{ strength: 2 }] });

    const data = role.toRoleData();

    assert.deepStrictEqual(data, {
      name: "Villager",
      modifiers: ["Quiet", "Brave"],
      items: ["Knife", { type: "Potion", args: [{ strength: 2 }] }],
    });
    data.items[1].args[0].strength = 99;
    assert.strictEqual(role.roleItems[1].args[0].strength, 2);
  });

  it("keeps true-role snapshots as plain descriptors", function () {
    const game = Object.create(Game.prototype);
    game.players = [{ id: "player-1", role: {
      toRoleData: () => ({ name: "Villager", modifiers: ["Quiet"], items: ["Charm"] }),
    } }];

    assert.deepStrictEqual(game.getTrueRoles(), {
      "player-1": { name: "Villager", modifiers: ["Quiet"], items: ["Charm"] },
    });
  });

  it("resolves role metadata from descriptor identities", function () {
    const game = Object.create(Game.prototype);
    game.type = "Mafia";

    assert.strictEqual(game.getRoleAlignment({ name: "Villager", modifiers: [] }), "Village");
  });

  it("accepts a role descriptor and grants its items without replacing class defaults", function () {
    class StubRole extends Role {
      constructor(player, data) {
        super("Villager", player, data);
        this.startItems = ["ClassDefault"];
      }
      init(modifiers) {
        this.modifier = modifiers || "";
      }
    }
    const events = { emit() {} };
    const game = {
      events,
      started: false,
      type: "Mafia",
      getRoleClass: () => StubRole,
      getRoleAlignment: () => "Village",
      achievementsAllowed: () => false,
      dailyChallengesAllowed: () => false,
    };
    const player = Object.create(Player.prototype);
    Object.assign(player, {
      game,
      user: { achievements: [] },
      passiveExtraRoles: [],
      ExtraRoles: [],
      passiveEffects: [],
      effects: [],
      startingItems: [],
      removeRole() {},
    });

    player.setRole({ name: "Villager", modifiers: ["Quiet"], items: ["Custom"] });

    assert.deepStrictEqual(player.role.toRoleData(), {
      name: "Villager",
      modifiers: ["Quiet"],
      items: ["Custom"],
    });
    assert.deepStrictEqual(player.role.startItems, ["ClassDefault", "Custom"]);
  });

  it("accepts descriptors for extra roles and retains their custom item identity", function () {
    class StubRole extends Role {
      constructor(player, data) { super("Oracle", player, data); }
      init(modifiers) { this.modifier = modifiers || ""; }
    }
    const game = {
      events: { emit() {} }, started: false, type: "Mafia",
      getRoleClass: () => StubRole,
    };
    const player = Object.assign(Object.create(Player.prototype), {
      game, role: null, user: { achievements: [] }, passiveEffects: [],
      ExtraRoles: [], passiveExtraRoles: [], startingItems: [],
    });

    const extra = player.addExtraRole({ name: "Oracle", modifiers: ["Quiet"], items: ["Charm"] });

    assert.deepStrictEqual(extra.toRoleData(), {
      name: "Oracle", modifiers: ["Quiet"], items: ["Charm"],
    });
    assert.deepStrictEqual(extra.startItems, ["Charm"]);
  });

  it("suppresses descriptor item grants when NoStartingItems is requested", function () {
    class StubRole extends Role {
      constructor(player, data) {
        super("Villager", player, data);
        this.startItems = ["ClassDefault"];
      }
      init(modifiers) {
        this.modifier = modifiers || "";
      }
    }
    const game = {
      events: { emit() {} },
      started: false,
      type: "Mafia",
      getRoleClass: () => StubRole,
      getRoleAlignment: () => "Village",
      achievementsAllowed: () => false,
      dailyChallengesAllowed: () => false,
    };
    const player = Object.assign(Object.create(Player.prototype), {
      game,
      user: { achievements: [] },
      passiveExtraRoles: [],
      ExtraRoles: [],
      passiveEffects: [],
      effects: [],
      startingItems: [],
      removeRole() {},
    });

    player.setRole({ name: "Villager", items: ["Custom"] }, undefined, false, false, false, undefined, "NoStartingItems");

    assert.deepStrictEqual(player.role.startItems, []);
    assert.deepStrictEqual(player.role.toRoleData().items, ["Custom"]);
  });
});
