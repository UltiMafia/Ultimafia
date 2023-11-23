const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinByGuessingKira extends Card {
  constructor(role) {
    super(role);

    role.data.notebookTarget = 1;
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount) {
        if (
          !winners.groups[this.name] &&
          this.player.alive &&
          this.player.getItems("Notebook")
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.player.queueAlert(
          "It seems you have dropped your notebook into the mortal realm..."
        );
      },

      start: function () {
        if (this.game.notebookSpawned) {
          return;
        }

        let eligiblePlayers = this.game.players.filter(
          (p) => p.role.name !== "Shinigami"
        );

        const randomPlayer = eligiblePlayers.Math.floor(Math.random() * eligiblePlayers.length);

        randomPlayer.holdItem("Notebook");
        randomPlayer.queueAlert("You possess a mysterious notebook...");
        this.game.notebookSpawned = true;
      },
    };
  }
};
