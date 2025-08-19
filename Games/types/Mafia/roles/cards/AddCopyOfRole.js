const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class AddCopyOfRole extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      addRequiredRole: function (player) {
        if (player != this.player) return;
        if (this.player.role.data.hasCopied) return;
        this.player.role.data.reroll = true;
        this.player.role.data.hasCopied = true;

        if (this.player.role.name == "Baphomet") {
          let players = this.game.players.filter(
            (p) =>
              p.role.alignment == "Village" || p.role.alignment == "Independent"
          );
          let shuffledPlayers = Random.randomizeArray(players);
          for (let x = 0; x < shuffledPlayers.length; x++) {
            if (shuffledPlayers[x].role.name == "Templar") {
              return;
            }
          }
          shuffledPlayers = shuffledPlayers.filter((p) => !p.role.data.reroll);
          if (shuffledPlayers.length <= 0) return;
          for (let item of shuffledPlayers[0].items) {
            item.drop();
          }
          shuffledPlayers[0].setRole("Templar", undefined, false, true);
          shuffledPlayers[0].role.data.reroll = true;
          shuffledPlayers[0].role.data.hasCopied = true;
        } else if (
          this.player.role.name == "Vice President" ||
          this.player.role.name == "Assassin"
        ) {
          let players = this.game.players.filter(
            (p) =>
              p.role.alignment == "Village" || p.role.alignment == "Independent"
          );
          let shuffledPlayers = Random.randomizeArray(players);
          for (let x = 0; x < shuffledPlayers.length; x++) {
            if (shuffledPlayers[x].role.name == "President") {
              return;
            }
          }
          shuffledPlayers = shuffledPlayers.filter((p) => !p.role.data.reroll);
          if (shuffledPlayers.length <= 0) return;
          for (let item of shuffledPlayers[0].items) {
            item.drop();
          }
          shuffledPlayers[0].setRole("President", undefined, false, true);
          shuffledPlayers[0].role.data.reroll = true;
          shuffledPlayers[0].role.data.hasCopied = true;
        } else {
          let players = this.game.players.filter(
            (p) =>
              p.role.alignment == "Village" || p.role.alignment == "Independent"
          );
          let shuffledPlayers = Random.randomizeArray(players);

          shuffledPlayers = shuffledPlayers.filter((p) => !p.role.data.reroll);
          if (shuffledPlayers.length <= 0) return;
          for (let item of shuffledPlayers[0].items) {
            item.drop();
          }
          shuffledPlayers[0].setRole(
            `${this.player.role.name}:${this.player.role.modifier}`,
            this.player.role.data,
            false,
            true,
            null,
            null,
            "RemoveStartingItems"
          );
          shuffledPlayers[0].role.data.reroll = true;
          shuffledPlayers[0].role.data.hasCopied = true;
        }
      },
    };
  }
};
