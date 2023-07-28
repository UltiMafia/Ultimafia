const Card = require("../../Card");

module.exports = class EvilWinsAllHexed extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (this.player.hasEffect("Insanity")) return;

        var hexCount = 0;

        for (let player of this.game.players) {
          let isHexed = player.hasItem("Hex");

          if (player.alive && (isHexed || player.role.alignment === "Follower" || player.role.alignment === "Leader"))
            hexCount++;
        }

        let aliveCount = this.game.players.filter((p) => p.alive).length;

        if (hexCount === aliveCount){
          this.game.queueAlert("The Hexologist has cast a hex on the entire town!");
          this.game.evilWin = true;
        }
      },
      death: function (player, killer, deathType) {
        if (this.player.hasEffect("Insanity")) return;

        var hexCount = 0;

        for (let player of this.game.players) {
          let isHexed = player.hasItem("Hex");

          if (player.alive && (isHexed || player.role.alignment === "Follower" || player.role.alignment === "Leader"))
            hexCount++;
        }

        let aliveCount = this.game.players.filter((p) => p.alive).length;

        if (hexCount === aliveCount){
          this.game.queueAlert("The Hexologist has cast a hex on the entire town!");
          this.game.evilWin = true;
        }
      },
    };
  }
};
