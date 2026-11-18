const { expect } = require("chai");
const {
  toValidatorRoleMaps,
  serializeSetupRoles,
  setupRolesForApi,
  gameHistoryForApi,
} = require("../lib/setupRoleCompatibility");
const { getMafiaFactionsFromSetup } = require("../modules/fortunePoints");

describe("setup role object compatibility", function () {
  it("normalizes new descriptor groups to validator maps without dropping custom items", function () {
    const incoming = [[
      { role: { name: "Doctor", modifiers: ["Trusted"], items: [{ type: "Coffee", args: [] }] }, count: 2 },
    ]];
    expect(toValidatorRoleMaps(incoming)).to.deep.equal([
      { "Doctor:Trusted:[{\"args\":[],\"type\":\"Coffee\"}]": 2 },
    ]);
  });

  it("accepts legacy map groups and emits new descriptor arrays for persistence", function () {
    const legacy = [{ "Doctor:Trusted": 2 }];
    expect(serializeSetupRoles(legacy)).to.equal(
      '[ [{"role":{"name":"Doctor","modifiers":["Trusted"],"items":[]},"count":2}] ]'.replaceAll(" ", "")
    );
  });

  it("serializes stored descriptors as legacy map JSON at API boundaries", function () {
    const stored = '[[{"role":{"name":"Doctor","modifiers":["Trusted"],"items":[]},"count":2}]]';
    expect(setupRolesForApi(stored)).to.equal('[{"Doctor:Trusted":2}]');
  });

  it("rejects unsafe/non-JSON custom item args rather than leaking arbitrary values", function () {
    const input = [[{ role: { name: "Doctor", modifiers: [], items: [{ type: "Coffee", args: [() => 1] }] }, count: 1 }]];
    expect(() => toValidatorRoleMaps(input)).to.throw();
  });

  it("accepts whitelisted plain starting-item names and descriptor item types", function () {
    const plain = [[{ role: { name: "Doctor", modifiers: [], items: ["Gun"] }, count: 1 }]];
    const descriptor = [[{ role: { name: "Doctor", modifiers: [], items: [{ type: "Gun", args: [] }] }, count: 1 }]];
    expect(toValidatorRoleMaps(plain, "Mafia")).to.deep.equal([{ "Doctor::[\"Gun\"]": 1 }]);
    expect(toValidatorRoleMaps(descriptor, "Mafia")).to.deep.equal([{ "Doctor::[{\"args\":[],\"type\":\"Gun\"}]": 1 }]);
  });

  it("rejects a known item name when its game import class does not exist", function () {
    const input = [[{ role: { name: "Doctor", modifiers: [], items: ["NotAClass"] }, count: 1 }]];
    expect(() => toValidatorRoleMaps(input, "Mafia")).to.throw(/Unknown custom item type/);
  });

  it("normalizes every importable public and internal item label to its import type", function () {
    const itemData = require("../data/items");
    const fs = require("fs");
    const path = require("path");
    const cases = Object.entries(itemData).flatMap(([gameType, items]) =>
      Object.entries(items).flatMap(([label, definition]) =>
        definition.internal.flatMap((internal) => {
          const classPath = path.join(__dirname, "..", "Games", "types", gameType.replace(/ /g, ""), "items", `${internal}.js`);
          if (!fs.existsSync(classPath)) return [];
          return [
            { gameType, input: label, expected: internal, form: "plain" },
            { gameType, input: { type: label, args: [] }, expected: internal, form: "descriptor" },
            ...(internal === label ? [] : [
              { gameType, input: internal, expected: internal, form: "plain alias" },
              { gameType, input: { type: internal, args: [] }, expected: internal, form: "descriptor alias" },
            ]),
          ];
        })
      )
    );

    for (const { gameType, input, expected, form } of cases) {
      const item = typeof input === "string" ? input : { ...input };
      const result = toValidatorRoleMaps([[
        { role: { name: "Doctor", modifiers: [], items: [item] }, count: 1 },
      ]], gameType);
      const canonicalItem = typeof item === "string" ? expected : { args: [], type: expected };
      expect(result, `${gameType} ${form} ${typeof input === "string" ? input : input.type}`).to.deep.equal([
        { [`Doctor::${JSON.stringify([canonicalItem])}`]: 1 },
      ]);
    }
    expect(cases.length).to.be.greaterThan(0);
  });

  it("preserves item args, duplicate order, and caller input while canonicalizing aliases", function () {
    const input = [[{
      role: {
        name: "Doctor",
        modifiers: [],
        items: ["Crystal Ball", { type: "Yuzu Orange", args: ["ripe"] }, "CrystalBall"],
      },
      count: 1,
    }]];
    const before = JSON.stringify(input);
    expect(toValidatorRoleMaps(input, "Mafia")).to.deep.equal([{
      'Doctor::["CrystalBall",{"args":["ripe"],"type":"Orange"},"CrystalBall"]': 1,
    }]);
    expect(JSON.stringify(input)).to.equal(before);
  });

  it("merges alias-equivalent role counts only within their original group", function () {
    const publicRole = { name: "Villager", items: ["Crystal Ball"] };
    const internalRole = { name: "Villager", items: ["CrystalBall"] };
    expect(toValidatorRoleMaps([
      [{ role: publicRole, count: 1 }, { role: internalRole, count: 2 }],
      [{ role: publicRole, count: 4 }],
    ], "Mafia")).to.deep.equal([
      { 'Villager::["CrystalBall"]': 3 },
      { 'Villager::["CrystalBall"]': 4 },
    ]);
  });

  it("rejects a whitelisted display item whose internal import class is missing", function () {
    const input = [[{ role: { name: "Doctor", modifiers: [], items: ["Poll Ballot"] }, count: 1 }]];
    expect(() => toValidatorRoleMaps(input, "Mafia")).to.throw(/Unknown custom item type: Poll Ballot/);
  });

  it("rejects custom item types absent from the selected game data", function () {
    const input = [[
      { role: { name: "Doctor", modifiers: [], items: [{ type: "NotAnItem", args: [] }] }, count: 1 },
    ]];
    expect(() => toValidatorRoleMaps(input, "Mafia")).to.throw(/Unknown custom item type/);
  });

  it("reads factions from persisted descriptor groups", function () {
    const stored = '[[{"role":{"name":"Godfather","modifiers":[],"items":[]},"count":1}]]';
    expect(getMafiaFactionsFromSetup(stored)).to.deep.equal(["Mafia"]);
  });

  it("serializes descriptor originalRoles back to legacy identity strings", function () {
    const history = JSON.stringify({
      originalRoles: { player1: { name: "Doctor", modifiers: ["Trusted"], items: [] } },
    });
    expect(JSON.parse(gameHistoryForApi(history)).originalRoles.player1).to.equal(
      "Doctor:Trusted"
    );
  });
});
