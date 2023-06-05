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

          var items = ["Gun", "Armor", "Knife", "Snowball", "Crystal"];
          var itemToGet = Random.randArrayVal(items);

          this.actor.holdItem(itemToGet);
          this.queueGetItemAlert(itemToGet, this.actor);
        },
      },
    ];
  }
};
