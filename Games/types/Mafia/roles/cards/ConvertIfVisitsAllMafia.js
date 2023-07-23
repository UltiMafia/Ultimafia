const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");
const roles = require("../../../../../data/roles");
const Random = require("../../../../../lib/Random");

module.exports = class ConvertIfVisitsAllMafia extends Card {
  constructor(role) {
    super(role);

    this.methods.excludeAlreadyVisited = function (player) {
      if (player === this) {
        return true;
      }
      return this.role.data.visitedMentors.includes(player);
    };

    this.meetings = {
      "Visit Mentor": {
        states: ["Night"],
        flags: ["voting"],
        targets: {
          include: ["alive"],
          exclude: [this.methods.excludeAlreadyVisited, "Self"],
        },
        action: {
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            if (!this.actor.role.data.visitedMentors) {
              this.actor.role.data.visitedMentors = [];
            }
            if (!this.actor.role.data.visitedMentors.includes(this.target)) {
              this.actor.role.data.visitedMentors.push(this.target);
              if (this.target.role.alignment === "Mafia") {
                this.actor.queueAlert(
                  "You successfully trained with a Mafioso..."
                );
              }
            }

            const aliveVisitedMafiosos =
              this.actor.role.data.visitedMentors.filter(
                (e) => e.role.alignment === "Mafia" && e.alive
              );
            const aliveMafiosos = this.game
              .alivePlayers()
              .filter((e) => e.role.alignment === "Mafia");
            if (aliveVisitedMafiosos.length === aliveMafiosos.length) {
              this.actor.setRole(
                Random.randArrayVal(
                  Object.entries(roles.Mafia)
                    .filter((e) => e[1].alignment === "Mafia")
                    .map((e) => e[0])
                )
              );
            }
          },
        },
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        if (!this.player.role.data.visitedMentors) {
          this.player.role.data.visitedMentors = [];
        }
      },
    };
  }
};
