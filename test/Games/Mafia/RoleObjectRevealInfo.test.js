const assert = require("node:assert/strict");
const Random = require("../../../lib/Random");
const MafiaPlayer = require("../../../Games/types/Mafia/Player");
const Meeting = require("../../../Games/core/Meeting");
const { normalizeRole, roleKey, roleName } = require("../../../lib/roleIdentity");
const Information = require("../../../Games/types/Mafia/Information");
const RevealInfo = require("../../../Games/types/Mafia/information/RevealInfo");
const RevealEvilPlayersInfo = require("../../../Games/types/Mafia/information/RevealEvilPlayersInfo");
const RevealPlayersWithRoleInfo = require("../../../Games/types/Mafia/information/RevealPlayersWithRoleInfo");
const Remove1Banished = require("../../../Games/types/Mafia/roles/cards/Remove1Banished");
const AddOrRemove1Banished = require("../../../Games/types/Mafia/roles/cards/AddOrRemove1Banished");
const BecomeBanishedRoleFor1Phase = require("../../../Games/types/Mafia/roles/cards/BecomeBanishedRoleFor1Phase");

const ALIGNMENT = { Villager: "Village", Doctor: "Village", Mafioso: "Mafia", Cultist: "Cult" };

// Deterministic sampling: the first candidate is always chosen, so a filter
// that fails to remove a role is caught instead of being sampled away.
function withFixedRandom(run) {
  const randomize = Random.randomizeArray;
  const pick = Random.randArrayVal;
  const randInt = Random.randInt;
  Random.randomizeArray = (values) => values.slice();
  Random.randArrayVal = (values) => values[0];
  Random.randInt = () => 1;
  try {
    return run();
  } finally {
    Random.randomizeArray = randomize;
    Random.randArrayVal = pick;
    Random.randInt = randInt;
  }
}

function makeGame(possibleRoles) {
  const game = {
    PossibleRoles: possibleRoles.map((role) => normalizeRole(role)),
    setup: { closed: true },
    events: { emit() {} },
    infoLog: [],
    meetings: [],
    getRoleTags: () => [],
    getRoleAlignment: (role) => ALIGNMENT[roleName(role)],
    formatRoleInternal: (name, modifier) =>
      `${name}${modifier ? `:${modifier}` : ""}`,
    formatRole: (role) => {
      const identity = normalizeRole(role);
      return `${identity.name}${
        identity.modifiers.length ? ` (${identity.modifiers.join("/")})` : ""
      }`;
    },
  };
  return game;
}

function makePlayer(descriptor, game) {
  const player = Object.create(MafiaPlayer.prototype);
  const role = normalizeRole(descriptor);
  player.game = game;
  player.tempAppearance = {};
  player.tempAppearanceMods = {};
  player.role = {
    name: role.name,
    modifier: role.modifiers.join("/"),
    data: {},
    hideModifier: {},
    appearance: { investigate: role.name, reveal: role.name },
    appearanceMods: { investigate: role.modifiers.join("/"), reveal: role.modifiers.join("/") },
    revealToAll() {},
    revealToPlayer() {},
  };
  player.role.toRoleData = () =>
    normalizeRole({ name: role.name, modifiers: role.modifiers, items: [] });
  return player;
}

describe("role-object information consumers", function () {
  it("setTempAppearance accepts a role descriptor and keeps modifiers", function () {
    const game = makeGame(["Villager"]);
    const player = makePlayer("Villager", game);

    player.setTempAppearance("investigate", {
      name: "Villager",
      modifiers: ["Loud", "Humble"],
      items: ["Armor"],
    });

    assert.equal(player.tempAppearance.investigate, "Villager");
    assert.equal(player.tempAppearanceMods.investigate, "Loud/Humble");
  });

  it("setTempAppearance still accepts legacy strings and 'real'", function () {
    const game = makeGame(["Villager"]);
    const player = makePlayer("Villager", game);

    player.setTempAppearance("investigate", "Doctor:Loud");
    assert.equal(player.tempAppearance.investigate, "Doctor");
    assert.equal(player.tempAppearanceMods.investigate, "Loud");

    player.setTempAppearance("investigate", "real");
    assert.equal(player.tempAppearance.investigate, "Villager");
    assert.equal(player.tempAppearanceMods.investigate, null);
  });

  it("RevealInfo Favorable reveals a village role without throwing", function () {
    const game = makeGame(["Mafioso", "Doctor", "Villager"]);
    const target = makePlayer("Mafioso", game);
    const info = new RevealInfo(null, game, target, "investigate", "Self");
    const calls = recordTempAppearance([target]);
    info.makeFavorable();

    withFixedRandom(() => info.getInfoRaw());

    assert.equal(ALIGNMENT[calls[0].name], "Village");
  });

  it("RevealInfo Unfavorable reveals a non-village role without throwing", function () {
    const game = makeGame(["Villager", "Doctor", "Mafioso"]);
    const target = makePlayer("Villager", game);
    const info = new RevealInfo(null, game, target, "investigate", "Self");
    const calls = recordTempAppearance([target]);
    info.makeUnfavorable();

    withFixedRandom(() => info.getInfoRaw());

    assert.notEqual(ALIGNMENT[calls[0].name], "Village");
  });

  it("RevealInfo False never reveals the target's own role", function () {
    const game = makeGame(["Villager", "Doctor", "Mafioso"]);
    const target = makePlayer("Villager", game);
    const info = new RevealInfo(null, game, target, "investigate", "Self");
    const calls = recordTempAppearance([target]);
    info.makeFalse();

    withFixedRandom(() => info.getInfoRaw());

    assert.notEqual(calls[0].name, "Villager");
  });

  // Reveal always restores tempAppearance afterwards, so record what the
  // information actually set and delegate to the real implementation.
  function recordTempAppearance(players) {
    const calls = [];
    for (const player of players) {
      const original = player.setTempAppearance;
      player.setTempAppearance = function (type, value) {
        const result = original.call(this, type, value);
        calls.push({
          player,
          type,
          value,
          name: this.tempAppearance[type],
          mods: this.tempAppearanceMods[type],
        });
        return result;
      };
    }
    return calls;
  }

  it("RevealInfo False ignores a same-role entry that differs only by items", function () {
    // Appearances never carry items, so Cop with a Gun would reveal as the
    // target's own "Cop" even though the identity keys differ.
    const game = makeGame(["Cop", "Mafioso", "Villager"]);
    game.PossibleRoles[0] = { name: "Cop", modifiers: [], items: ["Gun"] };
    const target = makePlayer("Cop", game);
    const info = new RevealInfo(null, game, target, "investigate", "Self");
    const calls = recordTempAppearance([target]);
    info.makeFalse();

    withFixedRandom(() => info.getInfoRaw());

    assert.notEqual(calls[0].name, "Cop");
    assert.equal(calls[0].name, "Mafioso");
  });

  it("getFakeRole never fakes the target's own role through an item-only variant", function () {
    const game = makeGame(["Cop", "Doctor"]);
    game.PossibleRoles[0] = { name: "Cop", modifiers: [], items: ["Gun"] };
    const target = makePlayer("Cop", game);
    const info = Object.create(Information.prototype);
    info.game = game;
    info.target = target;

    const picked = withFixedRandom(() => info.getFakeRole(target, 1, false, "investigate", null));

    assert.deepEqual(picked, ["Doctor"]);
  });

  it("RevealEvilPlayersInfo False falls back to possible roles without throwing", function () {
    const game = makeGame(["Villager", "Doctor", "Mafioso", "Cultist"]);
    const evil = makePlayer("Mafioso", game);
    const goodOne = makePlayer("Villager", game);
    const goodTwo = makePlayer("Doctor", game);
    evil.faction = "Mafia";
    goodOne.faction = "Village";
    goodTwo.faction = "Village";
    game.players = [evil, goodOne, goodTwo];
    const info = new RevealEvilPlayersInfo(null, game, "Self");
    const calls = recordTempAppearance([goodOne, goodTwo]);
    // A false report names more players than currently look evil, which is
    // the documented condition for the PossibleRoles fallback.
    info.mainInfo = [goodOne, goodTwo];
    info.truthValue = "False";

    withFixedRandom(() => info.getInfoRaw());

    assert.equal(calls.length, 2);
    for (const call of calls) assert.equal(typeof call.name, "string");
  });

  it("RevealPlayersWithRoleInfo False falls back to possible roles without throwing", function () {
    const game = makeGame(["Villager", "Villager:Loud", "Mafioso"]);
    const villager = makePlayer("Villager", game);
    const doctor = makePlayer("Doctor", game);
    const mafioso = makePlayer("Mafioso", game);
    game.players = [villager, doctor, mafioso];
    const info = new RevealPlayersWithRoleInfo(null, game, "Self", "Villager");
    const calls = recordTempAppearance([doctor, mafioso]);
    info.mainInfo = [doctor, mafioso];
    info.truthValue = "False";

    withFixedRandom(() => info.getInfoRaw());

    assert.equal(calls.length, 2);
    for (const call of calls) assert.equal(typeof call.name, "string");
  });
});

describe("banished role selection", function () {
  function banishedFixture(cardClass) {
    const game = makeGame(["Villager:Banished", "Doctor", "Mafioso"]);
    // The card owner is never a candidate; the banished player is replaced.
    const owner = makePlayer("Cultist", game);
    owner.alive = true;
    owner.items = [];
    const target = makePlayer("Villager", game);
    target.alive = true;
    target.items = [];
    target.role.alignment = "Village";
    target.role.data = { banished: true };
    target.role.toRoleData = () => normalizeRole("Villager");
    game.players = [owner, target];
    const role = { game, name: "Banisher", player: owner, data: {} };
    const card = new cardClass(role);
    card.player = owner;
    return { game, target, owner, card };
  }

  it("Remove1Banished never replaces a player with a Banished-modifier role", function () {
    const { target, owner, card } = banishedFixture(Remove1Banished);
    const assigned = [];

    withFixedRandom(() => {
      target.setRole = (value) => assigned.push(normalizeRole(value));
      card.listeners.removeBanished.call(card, owner);
    });

    assert.equal(assigned.length, 1);
    assert.equal(assigned[0].name, "Doctor");
    assert.ok(!assigned[0].modifiers.includes("Banished"));
  });

  it("AddOrRemove1Banished replacement never picks a Banished-modifier role", function () {
    const { target, owner, card } = banishedFixture(AddOrRemove1Banished);
    const assigned = [];

    withFixedRandom(() => {
      target.setRole = (value) => assigned.push(normalizeRole(value));
      card.listeners.BanishedAddOrRemove.call(card, owner);
    });

    assert.equal(assigned.length, 1);
    assert.ok(!assigned[0].modifiers.includes("Banished"));
  });
});

describe("banished blacklist choices", function () {
  const possibleRoles = ["Villager", "Doctor", "Mafioso"];

  function chooseRoleWithModifier(modifier, target) {
    const game = makeGame(possibleRoles);
    const role = {
      game,
      name: "Blacklister",
      modifier,
      data: { roleBlacklist: [], roleSelectedEver: [], roleSelectedLastNight: [] },
      getAllRoles: () => game.PossibleRoles.slice(),
    };
    const card = new BecomeBanishedRoleFor1Phase(role);
    const actor = {
      giveEffect: () => ({ ExtraRole: { meetings: {} } }),
      joinMeetings() {},
      sendMeetings() {},
    };
    card.meetings["Use Power"].action.run.call({ role, actor, game, target });
    return role;
  }

  function offeredRoles(role) {
    const meeting = Object.create(Meeting.prototype);
    meeting.game = role.game;
    meeting.AllRolesFilters = ["blacklist"];
    meeting.mustAct = true;
    meeting.role = role;
    return meeting.getAllRolesTargets("AllRoles", null);
  }

  // Fair and Nonconsecutive block the roles already picked.
  for (const modifier of ["Fair", "Nonconsecutive"]) {
    it(`${modifier} blacklist blocks the role chosen last time`, function () {
      const role = chooseRoleWithModifier(modifier, "Villager");
      assert.ok(role.data.roleBlacklist2.length > 0, "blacklist must be written");

      const targets = offeredRoles(role);
      assert.ok(
        !targets.includes("Villager"),
        `Villager must be blocked, got ${JSON.stringify(targets)}`
      );
      assert.ok(targets.includes("Doctor"), "other roles stay selectable");
    });
  }

  // Consecutive blocks everything except the role chosen last time, so only
  // that role stays offered.
  it("Consecutive blacklist leaves only the role chosen last time", function () {
    const role = chooseRoleWithModifier("Consecutive", "Villager");
    assert.ok(role.data.roleBlacklist2.length > 0, "blacklist must be written");

    const targets = offeredRoles(role);
    assert.deepEqual(targets, ["Villager"]);
  });

  it("Consecutive blacklist is stored as canonical identity keys", function () {
    const role = chooseRoleWithModifier("Consecutive", "Doctor");
    assert.deepEqual(
      role.data.roleBlacklist2.map((entry) => roleKey(entry)).sort(),
      ["Mafioso:", "Villager:"]
    );
  });
});
