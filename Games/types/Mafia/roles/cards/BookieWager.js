const Card = require("../../Card");
const { PRIORITY_MAFIA_KILL } = require("../../const/Priority");

module.exports = class BookieWager extends Card {
  constructor(role) {
    super(role);

    role.predictedCorrect = false;
    role.makeBookieKill = true;
    role.toRevertBookieKill = [];
    
    this.meetingMods = {
      Mafia: {
        flags: ["group", "speech", "voting"],
        targets: { include: ["alive"], exclude: [] },
        shouldMeet: function () {
          return this.predictedCorrect;
        },
        action: {
          labels: ["kill"],
          priority: PRIORITY_MAFIA_KILL,
          shouldMeet
          run: function () {
            if (this.dominates()) this.target.kill("basic", this.actor);
          },
        },
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        for (let player of this.game.players) {
          if (player.role.alignment == "Mafia") {
            player.holdItem("Wager", this.player);
          }
          if (!player.role.oblivious["Mafia"] && player !== this.player) {
            player.role.oblivious["Mafia"] = true;
            this.toRevertBookieKill.push(player.role);
          }
        }
      },
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        delete this.predictedVote;
      },
      death: function (player, killer, deathType) {
        if (player !== this.player) {
          return;
        }

        for (let p of this.game.alivePlayers()) {
          // another role still controlling bookie kill
          if (p.role.makeBookieKill) {
            return;
          }
        }

        for (let r of this.toRevertBookieKill) {
          r.oblivious["Mafia"] = false;
        }
        
        if (
          player === this.predictedVote &&
          deathType === "condemn" &&
          this.player.alive
        ) {
          this.predictedCorrect = true;
        }
      },
    };
  }
};
