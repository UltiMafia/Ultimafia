const Card = require("../../Card");
const {
  PRIORITY_EFFECT_GIVER_EARLY,
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
        flags: ["voting", "multi", "mustAct"],
        multiMin: 2,
        multiMax: 2,
        action: {
          labels: ["effect", "cannotBeVoted"],
          priority: PRIORITY_EFFECT_GIVER_EARLY,
          role: this.role,
          run: function () {
            this.duelistWasKilled = false;
            this.role.calledDuel = true;
            this.role.duelists = [];
            this.target.forEach((p) => {
              this.role.duelists.push(p);
            });
          },
        },
      },
      "Predict Winner": {
        states: ["Night"],
        flags: ["voting", "mustAct"],
        //targets: { include: [isSelectedByImperialDecree] },
        action: {
          role: this.role,
          priority: PRIORITY_EFFECT_GIVER_EARLY + 1,
          run: function () {
            if (!this.role.duelists.includes(this.target)) {
              this.actor.queueAlert(
                `You inbred FOOL! ${this.target.name} was not one your selected duelists so your duel could not occur! You are a disappointment your Empire.`
              );
              return;
            }
            for (let player of this.game.players) {
              if (!this.role.duelists.includes(player)) {
                player.giveEffect("CannotBeVoted", 1);
              }
            }
            this.role.predictedVote = this.target;
            //delete this.actor.role.duelists;
          },
        },
      },
    };
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners) {
        if (this.player.alive && this.predictedCorrect >= 2) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
    this.listeners = {
      death: function (player, killer, deathType) {
        if (player != this.predictedVote && this.duelists.includes(player)) {
          this.duelistWasKilled = true;
        }
      },
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }
        if (
          stateInfo.name.match(/Day/) &&
          this.predictedVote &&
          this.predictedVote.alive
        ) {
          this.causeDuel = true;
        } else if (stateInfo.name.match(/Dawn/)) {
          delete this.predictedVote;
        }
      },
      afterActions: function () {
        if (
          this.game.getStateName() == "Day" ||
          this.game.getStateName() == "Dusk"
        ) {
          if (
            this.predictedVote &&
            this.predictedVote.alive &&
            this.duelistWasKilled == true
          ) {
            this.predictedCorrect += 1;
            this.player.queueAlert(
              `${this.predictedVote?.name} has survived the duel! They will make an excellent legatus for your Empire.`
            );
            this.calledDuel = false;
          }
          this.duelistWasKilled = false;
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
