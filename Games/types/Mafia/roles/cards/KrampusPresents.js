const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class KrampusPresents extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        if (!this.player.alive) {
          return;
        }

        const players = this.game.players.filter(
          (p) => p.alive && p != this.player
        );
        const target = Random.randArrayVal(players);

        var action = new Action({
          labels: ["giveItem"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT - 1,
          actor: this.player,
          target: target,
          game: this.player.game,
          run: function () {
            var items = ["Gun", "Armor", "Knife", "Whiskey", "Crystal", "Key", "Candle", "Falcon", "Syringe"];
            var itemToGive = Random.randArrayVal(items);
            var isItemCursed = Random.randArrayVal([true, false]);

            this.target.holdItem(itemToGive, { cursed: isItemCursed });
            this.target.queueGetItemAlert(itemToGive);
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
