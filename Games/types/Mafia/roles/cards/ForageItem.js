const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class ForageItem extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        labels: ["giveItem"],
        priority: PRIORITY_ITEM_GIVER_DEFAULT,
        run: function () {
          if (!this.actor.alive) return;

          if (this.game.getStateName() != "Night") return;

          if (this.getVisitors().length > 0) {
            return;
          }

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
        ];
          var itemToGet = Random.randArrayVal(items);

          this.actor.holdItem(itemToGet);
          this.actor.queueGetItemAlert(itemToGet);
        },
      },
    ];
    this.listeners = {
      death: function (player, killer, deathType) {
        if (player === this.player && killer && deathType != "condemn") {
          killer.queueAlert(
            ":gun2: You find a gun in your victim's workshop..."
          );
          killer.holdItem("Gun", { reveal: true });
        }
      },
    };
  }
};
