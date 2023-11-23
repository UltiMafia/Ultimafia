const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT } = require("../../const/Priority");

module.exports = class GuessKira extends Card {
  constructor(role) {
    super(role);
    this.notebookTarget = "";

    this.meetings = {
      "Guess Kira": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive", "dead"], exclude: ["self"] },
        action: {
          labels: ["kill"],
          priority: PRIORITY_ITEM_TAKER_DEFAULT,
          run: function () {
            if (this.target.hasItem("Notebook")) {
                this.guessedKira += 1;
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
  
          const alivePlayers = this.game.players.filter(
            (p) => p.alive && p != this.player
          );
          this.notebookTarget = Random.randArrayVal(alivePlayers);
          this.notebookTarget.holdItem("Notebook");
          this.notebookTarget.queueAlert("You possess a mysterious notebook...");
          this.player.queueAlert(
            `It seems you have dropped your notebook into the mortal realm...`
          );
        },
      };
  }
};
