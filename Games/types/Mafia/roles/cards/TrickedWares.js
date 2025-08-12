const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");
const { PRIORITY_ITEM_GIVER_EARLY } = require("../../const/Priority");

module.exports = class TrickedWares extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        if (!this.hasAbility(["Item"])) {
          return;
        }

        const players = this.game.players.filter(
          (p) => p.alive && p != this.player
        );
        const target = Random.randArrayVal(players);

        var action = new Action({
          labels: ["giveItem"],
          priority: PRIORITY_ITEM_GIVER_EARLY - 1,
          actor: this.player,
          target: target,
          game: this.player.game,
          run: function () {
            var items = [
              "Gun",
              "Armor",
              "Bomb",
              "Knife",
              "Whiskey",
              "Crystal",
              "Key",
              "Candle",
              "Falcon",
              "Tract",
              "Syringe",
              "Envelope",
              "Rifle",
              "Stake",
              "Shaving Cream",
              "Snowball",
              "Shield",
            ];
            var itemToGive = Random.randArrayVal(items);
            var isItemBroken = Random.randArrayVal([true, false]);
            var isItemMagic = Random.randArrayVal([true, false, false, false]);

            this.target.holdItem(itemToGive, {
              broken: isItemBroken,
              magicCult: isItemMagic,
            });
            this.target.queueGetItemAlert(itemToGive);
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
