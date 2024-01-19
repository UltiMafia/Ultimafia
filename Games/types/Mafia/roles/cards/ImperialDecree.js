const Card = require("../../Card");
const {
  PRIORITY_EFFECT_GIVER_DEFAULT,
  PRIORITY_WIN_CHECK_DEFAULT,
} = require("../../const/Priority");

module.exports = class ImperialDecree extends Card {
  constructor(role) {
    super(role);

    role.duelists = [];
    role.predictedCorrect = 0;

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
            this.target.forEach((p) => {
              this.duelists.push(p);
            });
            for (let player of this.game.players) {
              if (!this.duelists.includes(player)) {
                player.giveEffect("CannotBeVoted", 1);
              }
            }
          },
        },
      },
      "Predict Winner": {
        states: ["Sunrise"],
        flags: ["voting", "mustAct", "instant"],
        action: {
          run: function () {
            this.actor.role.predictedVote = this.target;
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
        ) {
          this.predictedCorrect += 1;
          this.player.queueAlert(
            `${this.predictedVote.name} has survived the duel! They will make an excellent legatus for your Empire.`
          );
        }
      },
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Sunrise/)) {
          return;
        }

        this.meetings["Predict Winner"].targets = this.duelists;
        delete this.predictedVote;
      },
    };
    
    this.stateMods = {
      Night: {
        type: "delayActions",
        delayActions: true,
      },
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
    };
  }
};
