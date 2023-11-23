const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const {PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinByGuessingKira extends Card {
  constructor(role) {
    super(role);

    role.data.notebookTarget = 1;
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

        let eligiblePlayers = this.game.players.filter(
          (p) => p.role.name !== "Shinigami"
        );

        // 1 notebook
        let numNotebookToSpawn = this.data.notebookTarget;
        // at most game size
        numNotebookToSpawn = Math.min(
          numNotebookToSpawn,
          this.game.players.length
        );

        if (eligiblePlayers.length < numNotebookToSpawn) {
          eligiblePlayers = this.game.players.array();
        }

        eligiblePlayers = Random.randomizeArray(eligiblePlayers);
        for (let i = 0; i < numNotebookToSpawn; i++) {
          eligiblePlayers[i].holdItem("Notebook");
          eligiblePlayers[i].queueAlert("You possess a mysterious notebook...");
        }
        this.game.notebookSpawned = true;
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
