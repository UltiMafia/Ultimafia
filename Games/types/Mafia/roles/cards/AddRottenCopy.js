const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class AddRottenCopy extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      addRequiredRole: function (player) {
        if (player != this.player) return;
        if (this.player.role.data.hasRottenCopied) return;
        this.player.role.data.reroll = true;
        this.player.role.data.hasRottenCopied = true;

        let players = this.game.players.filter(
          (p) =>
            p.role.alignment == "Village" || p.role.alignment == "Independent"
        );
        let shuffledPlayers = Random.randomizeArray(players);
        shuffledPlayers = shuffledPlayers.filter((p) => !p.role.data.reroll);
        if (shuffledPlayers.length <= 0) return;
        let copyCount = Random.randInt(0, 2);
        if (copyCount > shuffledPlayers.length)
          copyCount = shuffledPlayers.length;
        if (copyCount == 0) return;

        for (let x = 0; x < copyCount; x++) {
          for (let item of shuffledPlayers[x].items) {
            item.drop();
          }
          shuffledPlayers[x].setRole(
            `${this.player.role.name}:${this.player.role.modifier}`,
            this.player.role.data,
            false,
            true,
            null,
            null,
            "RemoveStartingItems"
          );
          if (x == 0) {
            shuffledPlayers[x].holdItem("PermaDelirium");
          }
          shuffledPlayers[x].role.data.reroll = true;
          shuffledPlayers[x].role.data.hasRottenCopied = true;
        }
      },
    };
  }
};
