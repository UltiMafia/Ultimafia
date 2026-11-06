const assert = require("assert");
const Desperate = require("../../../Games/types/Mafia/roles/cards/Desperate");

function makeRole(name, modifier = null, items = []) {
  return {
    name,
    modifier,
    toRoleData() {
      return {
        name: this.name,
        modifiers: this.modifier ? [this.modifier] : [],
        items,
      };
    },
  };
}

function runGuessAction(meetingName, roleToGuess, targetRole) {
  const role = {
    game: {},
    roleToGuess,
    data: {},
    meetings: {
      [meetingName]: { action: { run() {} } },
    },
  };
  const kills = [];
  const actor = {
    role: { hasAbility: (abilities) => abilities.includes("Modifier") },
    kill: (...args) => kills.push(args),
  };
  const target = {
    role: targetRole,
    getRoleName: () => targetRole.name,
  };

  new Desperate(role);
  role.meetings[meetingName].action.run.call({
    role,
    actor,
    target,
    dominates: () => true,
  });
  return kills;
}

describe("Desperate base-role guess semantics", function () {
  for (const { meetingName, guessedRole, wrongRole } of [
    {
      meetingName: "Guess Adversary",
      guessedRole: "Seeker",
      wrongRole: "Hider",
    },
    { meetingName: "Guess Statue", guessedRole: "Statue", wrongRole: "Seeker" },
  ]) {
    it(`${meetingName} does not punish an equipped, modified target with a guessed base role`, function () {
      const kills = runGuessAction(
        meetingName,
        [guessedRole],
        makeRole(guessedRole, "Quiet", [{ type: "Knife", args: [] }])
      );

      assert.deepStrictEqual(kills, []);
    });

    it(`${meetingName} still punishes a target whose base role is not guessed`, function () {
      const kills = runGuessAction(
        meetingName,
        [guessedRole],
        makeRole(wrongRole, "Quiet", [{ type: "Knife", args: [] }])
      );

      assert.strictEqual(kills.length, 1);
      assert.strictEqual(kills[0][0], "basic");
    });
  }

  it("keeps full-role equality for the Desperate pursue target", function () {
    const targetDescriptor = {
      name: "Hider",
      modifiers: ["Quiet"],
      items: [{ type: "Knife", args: [] }],
    };
    const role = {
      game: {},
      data: { targetRole: targetDescriptor },
      meetings: {
        "Pursue Player": { action: { run() {} } },
        "Guess Role": { action: { run() {} } },
      },
    };
    const kills = [];
    const actor = {
      role: { hasAbility: (abilities) => abilities.includes("Modifier") },
      kill: (...args) => kills.push(args),
    };
    const targetRole = makeRole("Hider", "Quiet", targetDescriptor.items);
    const action = new Desperate(role);
    action.role.meetings["Pursue Player"].action.run.call({
      role,
      actor,
      target: { role: targetRole, getRoleName: () => targetRole.name },
      dominates: () => true,
    });

    assert.deepStrictEqual(kills, []);
    assert.strictEqual(role.data.targetRole, undefined);
  });
});
