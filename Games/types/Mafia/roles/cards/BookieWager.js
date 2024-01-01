const Card = require("../../Card");
const { PRIORITY_MAFIA_KILL } = require("../../const/Priority");

module.exports = class BookieWager extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      Mafia: {
        actionName: "Wager Kill",
        flags: ["group", "speech", "voting"],
        targets: { include: ["alive"], exclude: [] },
        shouldMeet: function () {
          return this.predictedCorrect;
        },
      },
    };

    role.makeWager = true;
    role.toRevertWager = [];

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        for (let player of this.game.players) {
          if (player.role.alignment === "Mafia") {
            player.holdItem("Wager", { bookie: this.player });
          }
          if (!player.role.oblivious["Mafia"] && player !== this.player) {
            player.role.oblivious["Mafia"] = true;
            this.toRevertWager.push(player.role);
          }
        }
      },
      death: function (player) {
        if (player !== this.player) {
          return;
        }

        for (let p of this.game.alivePlayers()) {
          // another role still controlling wager
          if (p.role.makeWager) {
            return;
          }
        }

        for (let r of this.toRevertWager) {
          r.oblivious["Mafia"] = false;
        }
      },
    };
  }
};
