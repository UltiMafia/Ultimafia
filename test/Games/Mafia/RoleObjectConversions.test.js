const assert = require("assert");
const MafiaRole = require("../../../Games/types/Mafia/Role");
const { setupUsesPhase } = require("../../../Games/types/Mafia/const/ConversionPhases");
const ShavingCream = require("../../../Games/types/Mafia/items/ShavingCream");

describe("Mafia role object conversions", function () {
  it("detects conversion phases from role descriptors with modifiers and item metadata", function () {
    const game = {
      PossibleRoles: [
        {
          name: "Snake Charmer",
          modifiers: ["Quiet"],
          items: [{ type: "Knife", args: [{ sharpened: true }] }],
        },
      ],
      setup: { roles: [] },
    };

    assert.strictEqual(setupUsesPhase(game, "Night (Swapping)"), true);
  });

  it("detects conversion phases from descriptor-based setup selection groups", function () {
    const game = {
      PossibleRoles: [],
      setup: {
        roles: [
          [
            {
              role: {
                name: "Mi-Go",
                modifiers: ["Elder"],
                items: ["Crystal Ball"],
              },
              count: 1,
            },
          ],
        ],
      },
    };

    assert.strictEqual(setupUsesPhase(game, "Night (Converting)"), true);
  });

  it("returns descriptor objects consistently for Excessive role pools", function () {
    const game = {
      PossibleRoles: [{ name: "Villager", modifiers: ["Quiet"], items: ["Knife"] }],
    };
    const roles = MafiaRole.prototype.getAllRoles.call({
      modifier: "Excessive",
      player: { hasEffect: () => false },
      game,
    });

    assert(roles.every((role) => role && typeof role === "object"));
    const { roleEquals } = require("../../../lib/roleIdentity");
    assert(roles.some((role) => roleEquals(role, game.PossibleRoles[0])));
  });

  it("preserves custom inventory while adding a modifier to a role descriptor", function () {
    const { roleWith } = require("../../../lib/roleIdentity");
    const descriptor = {
      name: "Villager",
      modifiers: ["Quiet"],
      items: [{ type: "Knife", args: [{ quality: "silver" }] }],
    };
    const converted = roleWith(descriptor, {
      modifiers: [...descriptor.modifiers, "Brave"],
    });

    assert.deepStrictEqual(converted, {
      name: "Villager",
      modifiers: ["Quiet", "Brave"],
      items: [{ type: "Knife", args: [{ quality: "silver" }] }],
    });
    converted.items[0].args[0].quality = "rusty";
    assert.strictEqual(descriptor.items[0].args[0].quality, "silver");
  });

  it("swaps full role descriptors rather than rebuilding identities from names", function () {
    const roleA = {
      toRoleData: () => ({
        name: "Villager",
        modifiers: ["Quiet"],
        items: [{ type: "Knife", args: [{ source: "role" }] }],
      }),
      data: { marker: "a" },
    };
    const roleB = {
      toRoleData: () => ({
        name: "Doctor",
        modifiers: ["Brave"],
        items: ["Crystal Ball"],
      }),
      data: { marker: "b" },
    };
    const assignmentsA = [];
    const assignmentsB = [];
    const targetA = {
      role: roleA,
      setRole: (...args) => assignmentsA.push(args),
    };
    const targetB = {
      role: roleB,
      setRole: (...args) => assignmentsB.push(args),
    };
    const item = new ShavingCream({});
    const action = item.meetings["Swap Players"].action;
    action.run.call({
      item: { broken: false, drop() {} },
      target: [targetA, targetB],
      dominates: () => true,
    });

    assert.deepStrictEqual(assignmentsA[0][0], roleB.toRoleData());
    assert.deepStrictEqual(assignmentsB[0][0], roleA.toRoleData());
    assert.notStrictEqual(assignmentsB[0][0].items[0], roleA.toRoleData().items[0]);
  });
});
