const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");
const { roleEquals } = require("../../../../../lib/roleIdentity");

function playerRole(player) {
  return player.role.toRoleData();
}

function matchesRoleList(roleToGuess, player) {
  if (!roleToGuess) return false;
  for (let name of roleToGuess) {
    if (
      (typeof name === "string" && player.getRoleName() == name) ||
      (typeof name !== "string" && roleEquals(player.role.toRoleData(), name))
    ) {
      return true;
    }
  }
  return false;
}

module.exports = class Desperate extends Card {
  constructor(role) {
    super(role);

    const pursue = this.role.meetings["Pursue Player"];
    const guess = this.role.meetings["Guess Role"];
    if (pursue && guess && pursue.action && guess.action) {
      const originalPursue = pursue.action.run;
      pursue.flags = ["voting", "mustAct"];
      pursue.targets = { include: ["alive", "self", "dead"] };
      pursue.action.labels = ["kill", "role"];
      pursue.action.priority = PRIORITY_KILL_DEFAULT;
      pursue.action.run = function () {
        if (!this.actor.role.hasAbility(["Modifier"])) {
          return originalPursue.call(this);
        }

        let targetRole = this.role.data.targetRole;
        if (!targetRole) return;

        if (!roleEquals(targetRole, playerRole(this.target)) && this.dominates(this.actor)) {
          this.actor.kill("basic", this.actor);
        }
        delete this.role.data.targetRole;
      };

      guess.flags = ["voting", "mustAct"];
      guess.action.labels = ["kill", "role"];
      guess.action.priority = PRIORITY_KILL_DEFAULT - 1;
    }

    punishMiss(this.role.meetings["Guess Adversary"]);
    punishMiss(this.role.meetings["Guess Statue"]);
  }
};

function punishMiss(meeting) {
  if (!meeting || !meeting.action) return;

  const original = meeting.action.run;
  meeting.action.run = function () {
    const canJudge = this.role.roleToGuess != null;
    const matched = matchesRoleList(this.role.roleToGuess, this.target);
    original.call(this);
    if (
      canJudge &&
      !matched &&
      this.actor.role.hasAbility(["Modifier"]) &&
      this.dominates(this.actor)
    ) {
      this.actor.kill("basic", this.actor);
    }
  };
}
