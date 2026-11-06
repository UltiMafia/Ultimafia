const { expect } = require("chai");
const {
  normalizeRoles,
  toCountMaps,
  formatRoleKey,
  canonicalizeRoles,
  attachItems,
  hashSetup,
} = require("../lib/roleset");

describe("Roleset records", function () {
  it("turns a legacy count map into slots and back into the same keys", function () {
    const legacy = [
      {
        "Villager:": 2,
        "Villager:Armed/Bulletproof": 1,
        "Mafioso:": 1,
        "Liberal:1:0": 3,
      },
    ];

    const records = normalizeRoles(legacy);
    expect(records).to.deep.equal([
      [
        { name: "Villager", modifiers: [], items: [], count: 2 },
        { name: "Villager", modifiers: ["Armed", "Bulletproof"], items: [], count: 1 },
        { name: "Mafioso", modifiers: [], items: [], count: 1 },
        { name: "Liberal", modifiers: ["1:0"], items: [], count: 3 },
      ],
    ]);

    expect(toCountMaps(records)).to.deep.equal(legacy);
    expect(toCountMaps(JSON.stringify(legacy))).to.deep.equal(legacy);
  });

  it("keeps a trailing colon on roles with no modifiers", function () {
    expect(formatRoleKey({ name: "Host", modifiers: [] })).to.equal("Host:");
    expect(formatRoleKey({ name: "Villager", modifiers: ["Loud"] })).to.equal(
      "Villager:Loud"
    );
  });

  it("preserves starting items across a count-map round trip", function () {
    const stored = [
      [
        {
          name: "Villager",
          modifiers: ["Bulletproof"],
          items: ["Gun", "Armor"],
          count: 1,
        },
      ],
    ];
    const edited = toCountMaps(stored);
    const saved = attachItems(edited, stored);
    expect(saved[0][0].items).to.deep.equal(["Gun", "Armor"]);
    expect(formatRoleKey(saved[0][0])).to.equal("Villager:Bulletproof");
  });

  it("hashes a legacy map and its records as the same setup", function () {
    const legacy = {
      gameType: "Mafia",
      name: "Test",
      roles: [{ "Villager:": 2, "Mafioso:": 1 }],
      closed: false,
      total: 3,
      count: null,
    };
    const records = {
      ...legacy,
      roles: canonicalizeRoles(legacy.roles, "Mafia"),
    };
    expect(hashSetup(legacy)).to.equal(hashSetup(records));
  });
});
