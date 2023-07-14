const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const Math2 = require("../../../../../lib/Math2");

module.exports = class WinByStealingClovers extends Card {
  constructor(role) {
    super(role);

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
        this.data.cloverTarget = 3;

        let numCloversToSpawn = Math.round(
          Math2.lerp(this.data.cloverTarget, this.game.players.length, 0.8)
        );

        // TODO golb - more leps = fewer spawns?
        const numLeprechauns = this.game.players.filter(
          (p) => p.role.name == "Leprechaun"
        ).length;
        // min clover spawn = 3
        numCloversToSpawn = Math.max(3, numCloversToSpawn - numLeprechauns);

        const numCloversInGame = this.game.players
          .map((p) => p.getItems("Clover").length)
          .reduce((a, b) => a + b);
        numCloversToSpawn = Math.max(0, numCloversToSpawn - numCloversInGame);

        if (numCloversToSpawn == 0) {
          return;
        }

        let eligiblePlayers = this.game.players.filter(
          (p) => p.role.name == "Leprechaun"
        );
        if (eligiblePlayers.length == 0) {
          eligiblePlayers = this.game.players.array();
        }

        eligiblePlayers = Random.randomizeArray(eligiblePlayers);
        for (let i = 0; i < numCloversToSpawn; i++) {
          eligiblePlayers[i].holdItem("Clover");
          eligiblePlayers[i].queueGetItemAlert("Clover");
        }
      },
    };
  }
};
