const assert = require("assert");
const { normalizeRole } = require("../../../lib/roleIdentity");
const ModifierInfo = require("../../../Games/types/Mafia/information/ModifierInfo");
const BecomeRoleOnDeath = require("../../../Games/types/Mafia/effects/BecomeRoleOnDeath");
const Information = require("../../../Games/types/Mafia/Information");

describe("object-compatible Mafia information", function () {
  it("samples descriptor roles while keeping revealed appearances strings", function () {
    const game = {
      setup: { closed: true },
      PossibleRoles: [
        { name: "Villager", modifiers: [], items: [] },
        { name: "Doctor", modifiers: ["Transcendent"], items: ["Potion"] },
      ],
      getRoleTags(role) {
        assert.equal(typeof role, "object");
        return [];
      },
      getRoleAlignment(role) {
        return role.name === "Villager" ? "Village" : "Village";
      },
      formatRole(role) {
        const normalized = normalizeRole(role);
        return `${normalized.name}${normalized.modifiers.length ? ` (${normalized.modifiers.join("/")})` : ""}`;
      },
    };
    const info = Object.create(Information.prototype);
    info.game = game;
    info.target = null;

    const result = info.getFakeRole(null, 1, false, "investigate", null);

    assert.equal(result.length, 1);
    assert.equal(typeof result[0], "string");
    assert.match(result[0], /^(Villager|Doctor)/);
  });

  it("reads modifier candidates from getAllRoles descriptors", function () {
    const info = Object.create(ModifierInfo.prototype);
    info.role = {
      getAllRoles: () => [
        { name: "Doctor", modifiers: ["Insane"], items: [] },
        { name: "Doctor", modifiers: ["Loyal"], items: [] },
      ],
    };
    info.game = { getRoleTags: () => ["No Investigate"] };
    info.mainInfo = "Loyal";
    info.trueModifier = "Sane";

    info.makeFalse();

    assert.equal(info.mainInfo, "Insane");
  });

  it("preserves every modifier and custom item when converting after condemnation", function () {
    const descriptor = {
      name: "Doctor",
      modifiers: ["Loyal"],
      items: [{ type: "Potion", args: [{ dose: 2 }] }],
    };
    let assigned;
    const player = {
      getImmunity: () => 0,
      getCancelImmunity: () => 0,
      setRole(role) { assigned = role; },
    };
    const infector = { hasAbility: () => true, faction: "Mafia" };
    const game = { events: { emit() {} } };
    const effect = new BecomeRoleOnDeath(infector, descriptor);
    effect.player = player;
    effect.game = game;

    effect.listeners.death.call(effect, player, null, "condemn", false);

    assert.deepEqual(assigned, {
      name: "Doctor",
      modifiers: ["Loyal", "Transcendent"],
      items: [{ type: "Potion", args: [{ dose: 2 }] }],
    });
  });
});
