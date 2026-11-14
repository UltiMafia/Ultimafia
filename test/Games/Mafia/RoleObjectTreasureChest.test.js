const assert = require("node:assert/strict");
const shortid = require("shortid");
const Game = require("../../../Games/types/Mafia/Game");
const User = require("../../../Games/core/User");
const { TestSocket } = require("../../../lib/sockets");
const { normalizeRole, roleKey, roleEquals } = require("../../../lib/roleIdentity");

// Exercise the real Admiral producer, item meeting definitions/actions and
// Player.setRole, without starting the game clock or touching a live game.
describe("Admiral treasure-chest role identity boundaries", function () {
  this.timeout(10000);
  const games = [];
  const armor = {
    name: "Villager", modifiers: ["Loud"], items: ["Armor"],
  };
  const gun = {
    name: "Villager", modifiers: ["Loud"],
    items: [{ type: "Gun", args: [{ reveal: true, shooterMask: "a:b,c" }] }],
  };
  const evil = {
    name: "Mafioso", modifiers: ["Loud"], items: ["Armor"],
  };

  async function makeChest(holderIndex = 1) {
    const id = shortid.generate();
    const game = new Game({
      id, hostId: `${id}-0`, isTest: true,
      settings: {
        setup: {
          id: `treasure-${id}`, name: "Treasure chest boundary", gameType: "Mafia",
          roles: JSON.stringify([{ "Villager:": 3, "Mafioso:": 1 }]),
          total: 4, closed: false, startState: "Night",
          count: { Village: 3, Mafia: 1 },
        },
        stateLengths: { Day: 60000, Night: 60000 },
        pregameCountdownLength: 60000,
      },
    });
    await game.init();
    games.push(game);
    game.checkGameStart = () => {};
    for (let i = 0; i < 4; i++) {
      await game.userJoin(new User({
        id: `${id}-${i}`, name: `ChestTester${i}`, socket: new TestSocket(),
        settings: {}, isTest: true,
      }));
    }
    game.assignRoles();
    const players = game.players.array();
    const admiral = players[0];
    admiral.setRole("Admiral");
    players[1].setRole(armor);
    players[2].setRole(gun);
    players[3].setRole(evil);
    game.events.emit("ReplaceAlways", admiral);
    assert.deepEqual(game.AdmiralGoodRoles, [armor, gun]);
    assert.deepEqual(game.AdmiralEvilRoles, [evil]);
    assert(players.slice(1).every((player) => player.role.name === "Grouch"));
    admiral.items.find((item) => item.name === "TreasureChest").drop();
    const holder = players[holderIndex];
    const chest = holder.holdItem("TreasureChest", admiral);
    return { game, players, admiral, holder, chest };
  }

  function runMeeting(chest, actionName, target) {
    const meeting = Object.values(chest.meetings).find((entry) => entry.actionName === actionName);
    assert(meeting, `missing ${actionName} meeting`);
    // The browser/socket cannot preserve object references from server targets.
    const wireTargets = JSON.parse(JSON.stringify(meeting.targets));
    const wireTarget = JSON.parse(JSON.stringify(target));
    assert(wireTargets.includes(wireTarget), "selection must be an advertised wire target");
    meeting.action.run.call({ item: chest, actor: chest.holder, game: chest.game, target: wireTarget });
  }

  afterEach(async function () {
    for (const game of games.splice(0)) {
      for (const timer of Object.values(game.timers || {})) timer.clear();
      await game.cancel();
    }
  });

  it("chooses an item-bearing role from JSON-round-tripped string targets without merging loadouts", async function () {
    const { game, holder, chest } = await makeChest();
    const meeting = Object.values(chest.meetings).find((entry) => entry.actionName === "Choose a Role");
    assert(meeting.targets.every((target) => typeof target === "string"));
    assert.deepEqual(new Set(meeting.targets), new Set([roleKey(armor), roleKey(gun)]));
    runMeeting(chest, "Choose a Role", roleKey(gun));
    assert.deepEqual(holder.role.toRoleData(), gun);
    const heldGun = holder.items.find((item) => item.name === "Gun");
    assert(heldGun, "Player.setRole must initialize the selected starting item");
    assert.equal(heldGun.shooterMask, "a:b,c");
    assert.deepEqual(game.AdmiralGoodRoles, [armor]);
    assert(game.AdmiralGoodRoles.every((role) => typeof role === "object"));
  });

  it("discards the selected complete identity after JSON transport, not the last loadout", async function () {
    const { game, chest } = await makeChest();
    const meeting = Object.values(chest.meetings).find((entry) => entry.actionName === "Discard a Role");
    assert.deepEqual(meeting.targets, [roleKey(armor), roleKey(gun), "None"]);
    runMeeting(chest, "Discard a Role", roleKey(armor));
    assert.deepEqual(game.AdmiralGoodRoles, [gun]);
  });

  for (const source of ["captured evil pool", "empty evil pool", "vanilla evil role", "no evil roles anywhere"]) {
    it(`steals gold and assigns a complete role from ${source}`, async function () {
      const { game, holder, chest } = await makeChest();
      let expected = evil;
      if (source === "empty evil pool") {
        game.AdmiralEvilRoles = [];
        game.PossibleRoles = [normalizeRole("Villager"), JSON.parse(JSON.stringify(evil))];
      } else if (source === "vanilla evil role") {
        expected = normalizeRole("Mafioso");
        game.AdmiralEvilRoles = [expected];
      } else if (source === "no evil roles anywhere") {
        game.AdmiralEvilRoles = [];
        game.PossibleRoles = [armor];
        expected = normalizeRole("Mafioso:Lone");
      }
      const oldGold = holder.Gold;
      const chestGold = game.AdmiralGold;
      runMeeting(chest, "Steal Gold (Enter an Amount)?", "2");
      assert.deepEqual(holder.role.toRoleData(), expected);
      assert.equal(holder.Gold, oldGold + 2);
      assert.equal(game.AdmiralGold, chestGold - 2);
      assert.equal(chest.holder, null, "the chest must continue to the next player");
      if (source !== "no evil roles anywhere") {
        assert.deepEqual(game.AdmiralEvilRoles, source === "empty evil pool" ? [] : [expected]);
      }
      if (roleEquals(expected, evil)) assert(holder.items.some((item) => item.name === "Armor"));
    });
  }

  for (const notice of ["opening", "receiving", "choosing", "stealing gold", "becoming Grouch"]) {
    it(`shows readable complete role text when ${notice}`, async function () {
      const { game, admiral, holder, chest } = await makeChest(notice === "opening" ? 0 : 3);
      const alerts = [];
      const recipient = notice === "receiving" ? holder : admiral;
      recipient.sendAlert = (message) => alerts.push(message);
      if (notice === "opening") {
        chest.listeners.roleAssigned(admiral);
      } else if (notice === "receiving") {
        game.getStateName = () => "Treasure Chest";
        chest.listeners.state({ name: "Treasure Chest" });
      } else if (notice === "choosing") {
        runMeeting(chest, "Choose a Role", roleKey(gun));
      } else if (notice === "stealing gold") {
        runMeeting(chest, "Steal Gold (Enter an Amount)?", "2");
      } else {
        runMeeting(chest, "Become Grouch", "Yes");
      }
      const contents = alerts.find((message) => message.startsWith("Inside are "));
      assert(contents, "the chest contents notice must be sent");
      assert(!contents.includes("[object Object]"), contents);
      assert(contents.includes(roleKey(armor)), contents);
      if (notice !== "choosing") assert(contents.includes(roleKey(gun)), contents);
      assert(game.AdmiralGoodRoles.every((role) => typeof role === "object"));
    });
  }

  for (const actionName of ["Choose a Role", "Discard a Role"]) {
    it(`${actionName} ignores an advertised identity that has since left the pool`, async function () {
      const { game, holder, chest } = await makeChest();
      const before = holder.role.toRoleData();
      game.AdmiralGoodRoles.splice(0, 1);
      runMeeting(chest, actionName, roleKey(armor));
      assert.deepEqual(holder.role.toRoleData(), before);
      assert.deepEqual(game.AdmiralGoodRoles, [gun]);
      assert.equal(chest.holder, holder, "stale choices must not advance the chest");
    });
  }

  it("does not discard a role when None is selected", async function () {
    const { game, chest } = await makeChest();
    runMeeting(chest, "Discard a Role", "None");
    assert.deepEqual(game.AdmiralGoodRoles, [armor, gun]);
  });
});
