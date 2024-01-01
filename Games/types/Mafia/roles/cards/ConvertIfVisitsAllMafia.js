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
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            // record already visited
            if (this.actor.role.visitedMentors.has(this.target)) {
              return;
            }
            this.actor.role.visitedMentors.add(this.target);

            if (this.target.role.alignment == "Mafia") {
              this.actor.queueAlert(
                "You successfully trained with a member of the Mafia…"
              );
            }

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
              Object.entries(roles.Mafia)
                .filter((roleData) => roleData[1].alignment === "Mafia")
                .map((roleData) => roleData[0])
            );
            this.actor.setRole(randomMafiaRole);
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
    };
  }
};
