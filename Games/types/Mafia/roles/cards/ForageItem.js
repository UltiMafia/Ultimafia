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
        run() {
          if (!this.actor.alive) return;

          if (this.game.getStateName() != "Night") return;

          if (this.getVisitors().length > 0) {
            return;
          }

          const items = ["Gun", "Armor", "Knife", "Snowball", "Crystal"];
          const itemToGet = Random.randArrayVal(items);

          this.actor.holdItem(itemToGet);
          this.queueGetItemAlert(itemToGet, this.actor);
        },
      },
    ];
  }
};
