const assert = require("node:assert/strict");
const shortid = require("shortid");
const Game = require("../../../Games/types/Mafia/Game");
const User = require("../../../Games/core/User");
const { TestSocket } = require("../../../lib/sockets");
const { normalizeRole, roleKey, serializeRoleGroups } = require("../../../lib/roleIdentity");

// Use real game/player/role/item classes, but assign synchronously before the
// game clock starts. This avoids the zero-duration vote loops in older tests.
describe("Role object real-engine integration", function () {
  const games = [];
  this.timeout(10000);

  async function makeGame(roles, options = {}) {
    const id = shortid.generate();
    const setup = {
      id: `role-objects-${id}`, name: "Role identity integration", gameType: "Mafia",
      roles, total: 4, closed: false, startState: "Night",
      count: { Village: 3, Mafia: 1 }, ...options,
    };
    const game = new Game({
      id, hostId: `${id}-0`, isTest: true,
      settings: { setup, stateLengths: { Day: 60000, Night: 60000 }, pregameCountdownLength: 60000 },
    });
    await game.init();
    games.push(game);
    game.checkGameStart = () => {};
    for (let i = 0; i < setup.total; i++) {
      await game.userJoin(new User({
        id: `${id}-${i}`, name: `RoleTester${i}`, socket: new TestSocket(),
        settings: {}, isTest: true,
      }));
    }
    game.assignRoles();
    return game;
  }

  afterEach(async function () {
    for (const game of games.splice(0)) {
      for (const timer of Object.values(game.timers || {})) timer.clear();
      await game.cancel();
    }
  });

  const gun = { name: "Villager", modifiers: [], items: [{ type: "Gun", args: [{ reveal: true, shooterMask: "a:b,c" }] }] };
  const armor = { name: "Villager", modifiers: [], items: ["Armor"] };
  const plain = normalizeRole("Villager");
  const mafia = normalizeRole("Mafioso");
  const entries = [gun, armor, plain, mafia].map((role) => ({ role, count: 1 }));

  it("loads structured persisted setups and keeps inventory variants through real assignment", async function () {
    const game = await makeGame(serializeRoleGroups([entries]));
    const players = game.players.array();
    assert.equal(players.length, 4);
    assert.equal(players.filter((p) => p.role.name === "Villager").length, 3);
    assert.deepEqual(new Set(Object.values(game.originalRoles).map(roleKey)), new Set(entries.map((e) => roleKey(e.role))));
    assert(game.StartingRoleset.every((r) => typeof r === "object"));
    assert(game.PossibleRoles.every((r) => typeof r === "object"));
    assert.deepEqual(new Set(game.StartingRoleset.map(roleKey)), new Set(entries.map((e) => roleKey(e.role))));

    const armed = players.find((p) => p.role.toRoleData().items.length && p.role.toRoleData().items[0].type === "Gun");
    const gunItem = armed.items.find((item) => item.name === "Gun");
    assert(gunItem, "custom starting gun is actually held");
    assert.equal(gunItem.reveal, true);
    assert.equal(gunItem.shooterMask, "a:b,c");
    const armored = players.find((p) => p.role.toRoleData().items.includes("Armor"));
    assert(armored.items.some((item) => item.name === "Armor"), "custom starting armor is actually held");

    const original = JSON.stringify(game.originalRoles[armed.id]);
    armed.role.roleItems[0].args[0].shooterMask = "changed";
    assert.equal(JSON.stringify(game.originalRoles[armed.id]), original, "original assignment is a detached snapshot");
  });

  it("keeps legacy map setups playable without adding custom inventory", async function () {
    const game = await makeGame(JSON.stringify([{ "Villager:": 3, "Mafioso:": 1 }]));
    assert.equal(game.players.array().filter((p) => p.role.name === "Villager").length, 3);
    for (const role of Object.values(game.originalRoles)) assert.deepEqual(role.items, []);
  });

  it("selects two same-name inventory variants in a unique closed role group", async function () {
    const groups = [[{ role: gun, count: 1 }, { role: armor, count: 1 }], [{ role: mafia, count: 1 }]];
    const game = await makeGame(serializeRoleGroups(groups), {
      total: 3, closed: true, unique: true, uniqueWithoutModifier: false,
      useRoleGroups: true, roleGroupSizes: [2, 1], count: {},
    });
    const selected = game.players.array().filter((p) => p.role.name === "Villager");
    assert.equal(selected.length, 2);
    assert.deepEqual(new Set(selected.map((p) => roleKey(p.role))), new Set([roleKey(gun), roleKey(armor)]));
  });

  it("records complete true-role identities at the legacy history boundary", async function () {
    const game = await makeGame(serializeRoleGroups([entries]));
    game.history.recordAllRoles();
    for (const player of game.players) {
      const saved = game.history.states[game.currentState].roles[player.id];
      assert.equal(typeof saved, "string", "old review clients retain string role keys");
      assert.deepEqual(normalizeRole(saved), player.role.toRoleData());
    }
  });

  it("continues the existing vanilla-role statistics bucket", async function () {
    const game = await makeGame(JSON.stringify([{ "Villager:": 4, "Mafioso:": 1 }]), { total: 5 });
    const player = game.players.array().find((p) => p.role.name === "Villager");
    player.recordStat("totalGames", true);
    const stats = player.user.stats.Mafia.unranked;
    assert.equal(stats.byRole.Villager?.totalGames, 1);
    assert.equal(stats.byRole["Villager:"], undefined);
  });

  it("suppresses both modifier-granted and descriptor starting items with NoStartingItems", async function () {
    const game = await makeGame(JSON.stringify([{ "Villager:": 4, "Mafioso:": 1 }]), { total: 5 });
    const player = game.players.array().find((p) => p.role.name === "Villager");
    player.setRole({ name: "Villager", modifiers: ["Armed"], items: ["Armor"] },
      undefined, false, false, false, undefined, "NoStartingItems");
    assert.equal(player.items.length, 0);
    assert.deepEqual(player.role.toRoleData().items, ["Armor"]);
  });

  it("keeps mutable initialization arguments separate from the saved role identity", async function () {
    const game = await makeGame(serializeRoleGroups([entries]));
    const player = game.players.array().find((p) => p.role.toRoleData().items[0]?.type === "Gun");
    const before = player.role.toRoleData();
    const startingGun = player.role.startItems.find((item) => item.type === "Gun");
    startingGun.args[0].shooterMask = "runtime mutation";
    assert.deepEqual(player.role.toRoleData(), before);

    const extra = player.addExtraRole(gun);
    extra.startItems.find((item) => item.type === "Gun").args[0].shooterMask = "extra runtime mutation";
    assert.deepEqual(extra.toRoleData(), normalizeRole(gun));
  });

  it("copies real item definitions without copying consumed or unrelated held inventory", async function () {
    const game = await makeGame(serializeRoleGroups([entries]));
    const source = game.players.array().find((p) => p.role.toRoleData().items.includes("Armor"));
    const target = game.players.array().find((p) => p.role.name === "Villager" && !p.role.toRoleData().items.length);
    source.holdItem("Coffee");
    target.setRole(source.role.toRoleData());
    assert(target.items.some((item) => item.name === "Armor"));
    assert(!target.items.some((item) => item.name === "Coffee"));
    assert.notEqual(target.items.find((i) => i.name === "Armor").id, source.items.find((i) => i.name === "Armor").id);
  });
});
