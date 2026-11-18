const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Random = require("../../../lib/Random");
const identity = require("../../../lib/roleIdentity");
const ConvertSelfToChosenRole = require("../../../Games/types/Mafia/roles/cards/ConvertSelfToChosenRole");
const BecomeExcessRole = require("../../../Games/types/Mafia/roles/cards/BecomeExcessRole");
const ConvertToChosenRole = require("../../../Games/types/Mafia/roles/cards/ConvertToChosenRole");

const { normalizeRole, roleName } = identity;
const ALIGNMENT = { Villager: "Village", Cop: "Village", Doctor: "Village", Mafioso: "Mafia", Chaotic: "Village" };

function withFirstChoice(run) {
  const pick = Random.randArrayVal;
  Random.randArrayVal = (values) => values[0];
  try {
    return run();
  } finally {
    Random.randArrayVal = pick;
  }
}

function makeGame(possibleRoles) {
  return {
    PossibleRoles: possibleRoles.map((role) => normalizeRole(role)),
    players: [],
    getRoleTags: () => [],
    getRoleAlignment: (role) => ALIGNMENT[roleName(role)],
  };
}

function makeCardRole(game, name, modifier = "") {
  return {
    game,
    name,
    modifier,
    data: {},
    player: { game },
    appearance: { self: name, reveal: name, condemn: name, death: name, investigate: name },
    appearanceMods: { self: "", reveal: "", condemn: "", death: "", investigate: "" },
    hideModifier: {},
    getAllRoles: () => game.PossibleRoles,
    getRoleName: () => name,
    editAppearance(newAppearance) {
      for (const key of Object.keys(newAppearance || {})) this.appearance[key] = newAppearance[key];
    },
  };
}

// switchRoleBefore is module-private, so run the real function body with the
// real identity helpers.
function loadSwitchRoleBefore() {
  const filename = path.join(__dirname, "../../../Games/types/Mafia/roles/cards/BecomeDeliriousRole.js");
  const source = fs.readFileSync(filename, "utf8");
  const start = source.indexOf("function switchRoleBefore");
  assert.notEqual(start, -1, "switchRoleBefore exists");
  const end = source.indexOf("\n}", start);
  return vm.runInNewContext(`(${source.slice(start, end + 2)})`, { Random, ...identity });
}

describe("role filters use base names and modifiers like master", function () {
  // Master compared the chosen role's base name with the holder's rendered
  // "Name:Modifier" string, so a plain holder blocked any same-base choice.
  function migoConversion(targetChoice, holderRole) {
    const game = makeGame(["Cop", "Doctor"]);
    const card = new ConvertToChosenRole(makeCardRole(game, "Mi-Go"));
    const conversions = [];
    game.players = [{ role: { toRoleData: () => normalizeRole(holderRole) } }];
    game.isDemonPlayer = () => false;
    game.noteMigoNewDemon = () => {};
    const targetPlayer = { role: { alignment: "Village" }, setRole: (v) => conversions.push(v) };
    card.role.data.targetPlayer = targetPlayer;
    card.meetings["Convert To"].action.run.call({
      role: card.role,
      actor: { getRoleName: () => "Mi-Go" },
      game,
      target: targetChoice,
      dominates: () => true,
    });
    return conversions;
  }

  it("Mi-Go won't convert to a modified role while a plain same-name holder is in play", function () {
    assert.deepEqual(migoConversion("Cop:Loud", "Cop"), []);
  });

  it("Mi-Go won't convert to a plain role already in play", function () {
    assert.deepEqual(migoConversion("Cop", "Cop"), []);
  });

  it("Mi-Go still converts when the same-name holder has a modifier, as master did", function () {
    assert.equal(migoConversion("Cop", "Cop:Loud").length, 1);
  });

  it("Braggart never picks a Humble-modified role", function () {
    const game = makeGame(["Cop:Humble", "Doctor"]);
    const role = makeCardRole(game, "Braggart");
    const switchRoleBefore = loadSwitchRoleBefore();

    withFirstChoice(() => switchRoleBefore(role));

    assert.equal(roleName(role.newRole), "Doctor");
  });

  // Mechanics ruling: a different modifier is a different role, so the
  // Braggart may take the other variant in either direction.
  function braggartChoice(holderRole, possibleRoles) {
    const game = makeGame(possibleRoles);
    game.players = [{ role: { toRoleData: () => normalizeRole(holderRole) } }];
    const role = makeCardRole(game, "Braggart");
    withFirstChoice(() => loadSwitchRoleBefore()(role));
    return role.newRole;
  }

  it("Braggart may become vanilla Cop while a modified Cop is in play", function () {
    const picked = braggartChoice("Cop:Loud", ["Cop", "Doctor"]);
    assert.equal(roleName(picked), "Cop");
    assert.deepEqual(normalizeRole(picked).modifiers, []);
  });

  it("Braggart may become a modified Cop while a vanilla Cop is in play", function () {
    const picked = braggartChoice("Cop", ["Cop:Loud", "Doctor"]);
    assert.equal(roleName(picked), "Cop");
    assert.deepEqual(normalizeRole(picked).modifiers, ["Loud"]);
  });

  it("Braggart still avoids Banished-modified roles", function () {
    const game = makeGame(["Cop:Banished", "Doctor"]);
    const role = makeCardRole(game, "Braggart");
    const switchRoleBefore = loadSwitchRoleBefore();

    withFirstChoice(() => switchRoleBefore(role));

    assert.equal(roleName(role.newRole), "Doctor");
  });

  it("Philosopher conversion penalty matches a holder with other modifiers", function () {
    const game = makeGame(["Cop", "Doctor"]);
    const card = new ConvertSelfToChosenRole(makeCardRole(game, "Philosopher"));
    const applied = [];
    const other = {
      role: { toRoleData: () => normalizeRole("Cop:Loud") },
      giveEffect: () => applied.push("delirious"),
    };
    game.players = [other];
    const actor = { role: { alignment: "Mafia", data: {} }, setRole: () => {} };

    card.meetings["Become Role"].action.run.call({
      role: card.role,
      actor,
      game,
      target: "Cop",
      dominates: () => true,
      blockWithDelirium: () => applied.push("block"),
    });

    assert.deepEqual(applied, ["delirious", "block"]);
  });

  it("Philosopher conversion penalty matches a holder with the same role but other items", function () {
    const game = makeGame(["Cop", "Doctor"]);
    const card = new ConvertSelfToChosenRole(makeCardRole(game, "Philosopher"));
    const applied = [];
    const other = {
      role: { toRoleData: () => normalizeRole({ name: "Cop", modifiers: [], items: ["Gun"] }) },
      giveEffect: () => applied.push("delirious"),
    };
    game.players = [other];
    const actor = { role: { alignment: "Mafia", data: {} }, setRole: () => {} };

    card.meetings["Become Role"].action.run.call({
      role: card.role,
      actor,
      game,
      target: "Cop",
      dominates: () => true,
      blockWithDelirium: () => applied.push("block"),
    });

    assert.deepEqual(applied, ["delirious", "block"]);
  });

  it("Chaotic never converts to a role whose base name is already in play", function () {
    const game = makeGame(["Cop", "Cop:Loud", "Doctor"]);
    const card = new BecomeExcessRole(makeCardRole(game, "Chaotic"));
    const assigned = [];
    game.players = [{ role: { toRoleData: () => normalizeRole("Cop") } }];
    const actor = {
      getRoleName: () => "Chaotic",
      role: { name: "Chaotic", alignment: "Village" },
      setRole: (value) => assigned.push(normalizeRole(value)),
    };

    withFirstChoice(() =>
      card.passiveActions[0].run.call({ role: card.role, actor, game })
    );

    assert.equal(assigned.length, 1);
    assert.equal(assigned[0].name, "Doctor");
  });
});
