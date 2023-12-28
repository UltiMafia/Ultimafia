const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Coronation extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      Mafia: {
        actionName: "Coronation",
        flags: ["group", "speech", "voting"],
        targets: { include: ["alive"], exclude: [isPrevTarget] },
        action: {
          labels: ["effect", "crown"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.target.giveEffect("Crown");
            this.target.queueAlert(
              "You have been chosen to wear the crown... You are king for a day!"
            );
            this.actor.role.data.prevTarget = this.target;
          },
        },
      },
    };

    role.makeCoronation = true;
    role.toRevertCoronation = [];

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        for (let player of this.game.players) {
          if (!player.role.oblivious["Mafia"] && player !== this.player) {
            player.role.oblivious["Mafia"] = true;
            this.toRevertCoronation.push(player.role);
          }
        }
      },
      death: function (player) {
        if (player !== this.player) {
          return;
        }

        for (let p of this.game.alivePlayers()) {
          // another role still controlling coronation
          if (p.role.makeCoronation) {
            return;
          }
        }

        for (let r of this.toRevertCoronation) {
          r.oblivious["Mafia"] = false;
        }
      },
    };
  }
};

function isPrevTarget(player) {
  return this.role && player == this.role.data.prevTarget;
}
