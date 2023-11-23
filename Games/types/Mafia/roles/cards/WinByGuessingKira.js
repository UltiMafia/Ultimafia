const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_ITEM_TAKER_DEFAULT, PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinByGuessingKira extends Card {
  constructor(role) {
    super(role);

    role.guessedKira = 0;

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return; 
        }
        this.player.queueAlert(
          `It seems you have dropped your notebook into the mortal realm...`
        );
      },
      start: function () {
        if (this.game.notebookSpawned) {
          return;
        }
        let alivePlayers = this.game.players.filter(
          (p) => p.alive && p != this.player
        );
        this.notebookTarget = Random.randArrayVal(alivePlayers);
        this.notebookTarget.holdItem("Notebook");
        this.notebookTarget.queueAlert("You possess a mysterious notebook...");
        this.game.cloversSpawned = true;
      },
    };

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

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners) {
        if (this.guessedKira >= 1) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};
