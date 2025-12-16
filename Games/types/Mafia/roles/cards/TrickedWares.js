const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");
const { PRIORITY_ITEM_GIVER_EARLY } = require("../../const/Priority");

module.exports = class TrickedWares extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Item"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_ITEM_GIVER_EARLY - 1,
        labels: ["giveItem"],
        run: function () {
          var items = [
            "Gun",
            "Armor",
            "Bomb",
            "Knife",
            "Whiskey",
            "Crystal Ball",
            "Key",
            "Candle",
            "Falcon",
            "Tract",
            "Syringe",
            "Envelope",
            "Rifle",
            "Shaving Cream",
            "Snowball",
            "Shield",
          ];
          var itemToGive = Random.randArrayVal(items);
          var isItemBroken = Random.randArrayVal([true, false]);
          var isItemMagic = Random.randArrayVal([true, false, false, false]);

          let player = Random.randArrayVal(
            this.game.alivePlayers().filter((p) => p != this.actor)
          );

          player.holdItem(itemToGive, {
            broken: isItemBroken,
            magicCult: isItemMagic,
          });
          player.queueGetItemAlert(itemToGive);
        },
      },
    ];
  }
};
