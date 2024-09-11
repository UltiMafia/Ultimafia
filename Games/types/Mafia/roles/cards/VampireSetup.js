const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class VampireSetup extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      addRequiredRole: function (player) {
        if (player != this.player) return;
        this.player.role.data.reroll = true;

        let players = this.game.players.filter(
          (p) => p.role.alignment == "Mafia" || p.role.alignment == "Cult"
        );
        let shuffledPlayers = Random.randomizeArray(players);
        for (let x = 0; x < shuffledPlayers.length; x++) {
          for (let item of shuffledPlayers[x].items) {
            item.drop();
          }
          shuffledPlayers[x].setRole(
            `${this.player.role.name}:${this.player.role.modifier}`,
            this.player.role.data
          );
          shuffledPlayers[x].role.data.reroll = true;
        }

        let goodPlayers = this.game.players.filter(
          (p) =>
            p.role.alignment == "Village" || p.role.alignment == "Independent"
        );
        goodPlayers = Random.randomizeArray(goodPlayers);
        let goodCount = Math.ceil((this.game.players.length+0.0) * 0.3);
        if(goodCount < 2) goodCount = 2;

        if (goodPlayers.length <= goodCount) return;

        for (let t = goodCount; t < goodPlayers.length; t++) {
          for (let item of goodPlayers[t].items) {
            item.drop();
          }
          goodPlayers[t].setRole(
            `${this.player.role.name}:${this.player.role.modifier}`,
            this.player.role.data
          );
          goodPlayers[t].role.data.reroll = true;
        }
      },
      roleAssigned: function (player) {
        if (player != this.player) return;
        if(this.player.role.data.reroll) return;
        let players = this.game.players.filter(
          (p) => p.role.alignment == "Mafia" || p.role.alignment == "Cult"
        );
        let shuffledPlayers = Random.randomizeArray(players);
        for (let x = 0; x < shuffledPlayers.length; x++) {
          if (shuffledPlayers[x].role.name != "Vampire") {
            for (let item of shuffledPlayers[x].items) {
              item.drop();
            }
            shuffledPlayers[x].setRole(
              `${this.player.role.name}:${this.player.role.modifier}`,
              this.player.role.data
            );
            shuffledPlayers[x].role.data.reroll = true;
          }
        }

        let goodPlayers = this.game.players.filter(
          (p) =>
            (p.role.alignment == "Village" ||
              p.role.alignment == "Independent") &&
            p.alive
        );
        goodPlayers = Random.randomizeArray(goodPlayers);
        let goodCount = Math.ceil((this.game.alivePlayers().length+0.0)* 0.3);
        if(goodCount < 2) goodCount = 2;

        if (goodPlayers.length <= goodCount) return;

        for (let t = goodCount; t < goodPlayers.length; t++) {
          for (let item of goodPlayers[t].items) {
            item.drop();
          }
          goodPlayers[t].setRole(
            `${this.player.role.name}:${this.player.role.modifier}`,
            this.player.role.data
          );
          goodPlayers[t].role.data.reroll = true;
        }
      },
    };
  }
};
