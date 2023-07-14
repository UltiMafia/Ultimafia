const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const Math2 = require("../../../../../lib/Math2");

module.exports = class WinByStealingClovers extends Card {
  constructor(role) {
    super(role);

    role.data.cloverTarget = 3;
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount) {
        if (
          !winners.groups[this.name] &&
          this.player.alive &&
          this.player.getItems("Clover").length >= this.data.cloverTarget
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
    this.listeners = {
      start: function () {
        if (this.game.cloversSpawned) {
          return;
        }
        let eligiblePlayers = this.game.players.filter(
          (p) => p.role.name !== "Leprechaun"
        );

        let numCloversToSpawn = this.data.CloverTarget + eligiblePlayers.length

        if (eligiblePlayers.length < numCloversToSpawn) {
          eligiblePlayers = this.game.players.array();
        }

        eligiblePlayers = Random.randomizeArray(eligiblePlayers);
        for (let i = 0; i < numCloversToSpawn; i++) {
          eligiblePlayers[i].holdItem("Clover");
          eligiblePlayers[i].queueAlert("You possess a four-leaf clover!");
        }
        this.game.cloversSpawned = true;
      },
    };
  }
};
