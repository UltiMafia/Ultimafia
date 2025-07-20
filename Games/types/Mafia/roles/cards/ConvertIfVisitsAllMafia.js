const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_KILL_DEFAULT, PRIORITY_BECOME_DEAD_ROLE } = require("../../const/Priority");
const roles = require("../../../../../data/roles");
const Random = require("../../../../../lib/Random");

module.exports = class ConvertIfVisitsAllMafia extends Card {
  constructor(role) {
    super(role);

    this.methods.excludeAlreadyVisited = function (player) {
      if (player === this) {
        return true;
      }
      return this.role.visitedMentors.has(player);
    };

    this.meetings = {
      "Visit Mentor": {
        states: ["Night"],
        flags: ["voting"],
        targets: {
          include: ["alive"],
          exclude: [this.methods.excludeAlreadyVisited, "self"],
        },
        action: {
          role: this.role,
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            // record already visited
            if (this.role.visitedMentors.has(this.target)) {
              return;
            }
            this.role.visitedMentors.add(this.target);

            if (this.target.role.alignment == "Mafia") {
              this.actor.queueAlert(
                "You successfully trained with a member of the Mafia…"
              );
            }
            /*
            const aliveVisitedMafiosos = Array.from(
              this.actor.role.visitedMentors
            ).filter((p) => p.role.alignment === "Mafia" && p.alive);
            const aliveMafiosos = this.game
              .alivePlayers()
              .filter((p) => p.role.alignment === "Mafia");

            if (aliveVisitedMafiosos.length !== aliveMafiosos.length) {
              return;
            }

            const randomMafiaRole = Random.randArrayVal(
              this.game.PossibleRoles.filter((r) => this.game.getRoleAlignment(r) == "Mafia")
            );
            this.actor.setRole(randomMafiaRole);
            */
          },
        },
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.visitedMentors = new Set();
      },
      state: function (stateInfo){
        if (!this.player.hasAbility(["Convert"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          role: this,
          priority: PRIORITY_BECOME_DEAD_ROLE,
          labels: ["convert"],
          run: function () {
            const aliveVisitedMafiosos = Array.from(
              this.role.visitedMentors
            ).filter((p) => p.role.alignment === "Mafia" && p.alive);
            const aliveMafiosos = this.game
              .alivePlayers()
              .filter((p) => p.role.alignment === "Mafia");

            if (aliveVisitedMafiosos.length !== aliveMafiosos.length) {
              return;
            }

            const randomMafiaRole = Random.randArrayVal(
              this.game.PossibleRoles.filter((r) => this.game.getRoleAlignment(r) == "Mafia")
            );
            this.actor.setRole(randomMafiaRole);
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
