const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinByGuessingKira extends Card {
  constructor(role) {
    super(role);

    role.data.notebookTarget = 3;
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount) {
        if (
          !winners.groups[this.name] &&
          this.player.alive &&
          this.player.getItems("Notebook").length >= this.data.notebookTarget
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
          "Before you can escape this accursed town, you must retrieve your four-leaf notebooks!"
        );
      },

      start: function () {
        if (this.game.notebooksSpawned) {
          return;
        }

        let eligiblePlayers = this.game.players.filter(
          (p) => p.role.name !== "Shinigami"
        );

        // 3 + numLeprechaun
        let numNotebooksToSpawn =
          this.data.notebookTarget +
          (this.game.players.length - eligiblePlayers.length);
        // at most game size
        numNotebooksToSpawn = Math.min(
          numNotebooksToSpawn,
          this.game.players.length
        );

        if (eligiblePlayers.length < numNotebooksToSpawn) {
          eligiblePlayers = this.game.players.array();
        }

        eligiblePlayers = Random.randomizeArray(eligiblePlayers);
        for (let i = 0; i < numNotebooksToSpawn; i++) {
          eligiblePlayers[i].holdItem("Notebook");
          eligiblePlayers[i].queueAlert("You possess a four-leaf notebook!");
        }
        this.game.notebooksSpawned = true;
      },
    };
  }
};
