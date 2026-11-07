const assert = require("node:assert/strict");
const {
  normalizeRole,
  roleKey,
  roleName,
  appearanceKey,
} = require("../../../lib/roleIdentity");
const AppearAsRandomEvil = require("../../../Games/types/Mafia/roles/cards/AppearAsRandomEvil");
const AppearAsVanillaEvil = require("../../../Games/types/Mafia/roles/cards/AppearAsVanillaEvil");
const VampireAppearAsRoles = require("../../../Games/types/Mafia/roles/cards/VampireAppearAsRoles");
const RoleDisguiser = require("../../../Games/types/Mafia/roles/cards/RoleDisguiser");
const DeliriateRoleFor3Nights = require("../../../Games/types/Mafia/roles/cards/DeliriateRoleFor3Nights");

const ALIGNMENT = { Villager: "Village", Cop: "Village", Doctor: "Village", Mafioso: "Mafia", Cultist: "Cult", Vampire: "Cult" };

function makeGame(possibleRoles) {
  return {
    PossibleRoles: possibleRoles.map((role) => normalizeRole(role)),
    players: [],
    getRoleTags: () => [],
    getRoleAlignment: (role) => ALIGNMENT[roleName(role)],
    createInformation: () => ({
      processInfo() {},
      getInfoRaw: () => "Cop",
    }),
  };
}

function makeRole(game, descriptor) {
  const identity = normalizeRole(descriptor);
  return {
    game,
    name: identity.name,
    modifier: identity.modifiers.join("/"),
    data: {},
    cards: [],
    appearance: {
      self: identity.name, reveal: identity.name, condemn: identity.name,
      death: identity.name, investigate: identity.name,
    },
    appearanceMods: { self: "", reveal: "", condemn: "", death: "", investigate: "" },
    hideModifier: {},
    getAllRoles: () => game.PossibleRoles,
    getRoleName: () => identity.name,
    getModifierName: () => identity.modifiers.join("/"),
    toRoleData: () => normalizeRole(descriptor),
    editAppearance(newAppearance, newAppearanceMods) {
      for (const key of Object.keys(newAppearance || {})) {
        this.appearance[key] = newAppearance[key];
      }
    },
  };
}

const gunnedCop = { name: "Cop", modifiers: [], items: ["Gun"] };
const gunnedMafioso = { name: "Mafioso", modifiers: [], items: ["Gun"] };

describe("appearance strings ignore starting items", function () {
  it("appearanceKey keeps name and modifiers but never items", function () {
    assert.equal(appearanceKey({ name: "Cop", modifiers: [], items: ["Gun"] }), "Cop");
    assert.equal(
      appearanceKey({ name: "Cop", modifiers: ["Loud", "Humble"], items: ["Gun"] }),
      "Cop:Loud/Humble"
    );
    assert.equal(appearanceKey("Villager"), "Villager");
  });

  it("AppearAsRandomEvil writes a disguise without the item suffix", function () {
    const game = makeGame([gunnedMafioso]);
    const role = makeRole(game, "Villager");
    new AppearAsRandomEvil(role);
    // Master stored the bare name; getAppearance renders the trailing colon.
    assert.equal(role.appearance.reveal, "Mafioso");
    assert.equal(role.appearance.investigate, "Mafioso");
  });

  it("AppearAsVanillaEvil writes a disguise without the item suffix", function () {
    const game = makeGame([gunnedMafioso]);
    const role = makeRole(game, "Villager");
    new AppearAsVanillaEvil(role);
    assert.equal(role.appearance.reveal, "Mafioso");
  });

  it("VampireAppearAsRoles writes a disguise without the item suffix", function () {
    const game = makeGame([gunnedMafioso]);
    const role = makeRole(game, "Vampire");
    new VampireAppearAsRoles(role);
    assert.equal(role.appearance.death, "Mafioso");
  });

  it("a death appearance still resolves to an alignment once rendered", function () {
    const game = makeGame([gunnedMafioso]);
    const role = makeRole(game, "Vampire");
    new VampireAppearAsRoles(role);
    // revealAlignmentToAll renders appearance:appearanceMods before reading it.
    const rendered = `${role.appearance.death}:${role.appearanceMods.death}`;
    assert.equal(ALIGNMENT[roleName(rendered)], "Mafia");
  });
});

describe("disguise consumers", function () {
  it("RoleDisguiser's Suit type carries no item suffix", function () {
    const game = makeGame([gunnedCop]);
    const role = makeRole(game, "RoleDisguiser");
    const card = new RoleDisguiser(role);
    const held = [];
    const actor = { holdItem: (name, data) => held.push({ name, data }), queueAlert() {} };
    const targetRole = makeRole(game, gunnedCop);
    const target = { name: "Bob", role: targetRole, getRoleName: () => "Cop" };

    card.meetings["Act Role"].action.run.call({
      role,
      actor,
      target,
      game,
    });

    assert.equal(held.length, 1);
    assert.equal(held[0].name, "Suit");
    assert.equal(held[0].data.type, "Cop:");
  });

  it("DeliriateRoleFor3Nights blocks the holder of a role that has items", function () {
    const game = makeGame([gunnedCop]);
    const role = makeRole(game, "Flapper");
    const card = new DeliriateRoleFor3Nights(role);
    const blocked = [];
    const actor = { id: "actor" };
    const victim = makeRole(game, gunnedCop);
    victim.giveEffect = () => blocked.push("effect");
    game.players = [{ role: victim, getRoleName: () => "Cop", getModifierName: () => "" }];
    role.giveEffect = () => blocked.push("role-effect");

    card.meetings["Block Role"].action.run.call({
      role,
      actor,
      game,
      target: roleKey(gunnedCop),
      blockWithDelirium: () => blocked.push("block"),
    });

    assert.deepEqual(blocked, ["role-effect", "block"]);
    assert.deepEqual(role.playersToBlock, [game.players[0]]);
  });
});
