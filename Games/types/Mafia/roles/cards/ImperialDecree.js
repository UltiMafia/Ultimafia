const Card = require("../../Card");
const {
  PRIORITY_EFFECT_GIVER_DEFAULT,
  PRIORITY_WIN_CHECK_DEFAULT,
} = require("../../const/Priority");

function isSelectedByImperialDecree(player) {
  return this.role.meetings["Declare Duelists (2)"].action.target.includes(
    player
  );
}

module.exports = class ImperialDecree extends Card {
  constructor(role) {
    super(role);
    role.duelists = [];
    role.predictedCorrect = 0;
    role.calledDuel = false;

    this.meetings = {
      "Declare Duelists (2)": {
        states: ["Night"],
        flags: ["voting", "multi"],
        multiMin: 2,
        multiMax: 2,
        action: {
          labels: ["effect", "cannotBeVoted"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.actor.role.calledDuel = true;
            this.actor.role.duelists = [];
            this.target.forEach((p) => {
              this.actor.role.duelists.push(p);
            });
            for (let player of this.game.players) {
              if (!this.actor.role.duelists.includes(player)) {
                player.giveEffect("CannotBeVoted", 1);
              }
            }
          },
        },
      },
      "Predict Winner": {
        states: ["Dawn"],
        flags: ["voting", "mustAct", "instant"],
        targets: { include: [isSelectedByImperialDecree] },
        action: {
          run: function () {
            this.actor.role.predictedVote = this.target;
            delete this.actor.role.duelists;
          },
        },
      },
    };
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners) {
        if (
          this.player.alive &&
          !winners.groups[this.name] &&
          this.predictedCorrect >= 2
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
    this.listeners = {
      death: function (player, killer, deathType) {
        if (
          player === this.predictedVote &&
          deathType === "condemn" &&
          this.player.alive
        )
          return;
        else {
          this.predictedCorrect += 1;
          this.player.queueAlert(
            `${this.predictedVote?.name} has survived the duel! They will make an excellent legatus for your Empire.`
          );
          this.player.role.calledDuel = false;
        }
      },
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }
        if (stateInfo.name.match(/Day/) && this.predictedVote.alive) {
          this.causeDuel = true;
        } else if (stateInfo.name.match(/Dawn/)) {
          delete this.predictedVote;
        }
      },
    };

    this.stateMods = {
      Night: {
        type: "delayActions",
        delayActions: true,
      },
      /*
      Sunrise: {
        type: "add",
        index: 3,
        length: 1000 * 60,
        shouldSkip: function () {
          for (let player of this.game.players) {
            if (player.role.name === "Emperor") {
              return false;
            }
          }
          return true;
        },
      },
      */
    };
  }
};
