const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinByGuessingKira extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount) {
        if (this.player.alive && this.player.role.data.guessed >= 2) {
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
          "It seems you have dropped your notebook into the mortal realm... you must retrieve it."
        );
      },

      start: function () {
        if (this.game.notebooksSpawned) {
          return;
        }

        let eligiblePlayers = this.game.players.filter(
          (p) => p.role.name !== "Shinigami"
        );

        // only 1 notebook
        let numNotebooksToSpawn = 1

        if (eligiblePlayers.length < numNotebooksToSpawn) {
          eligiblePlayers = this.game.players.array();
        }

        eligiblePlayers = Random.randomizeArray(eligiblePlayers);
        for (let i = 0; i < numNotebooksToSpawn; i++) {
          eligiblePlayers[i].holdItem("Notebook");
          eligiblePlayers[i].queueAlert("You possess a mysterious notebook...");
        }
        this.game.notebooksSpawned = true;
      },
    };
  }
};
