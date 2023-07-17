const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT } = require("../../const/Priority");

module.exports = class FixOwnItems extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        labels: ["fixItems", "hidden"],
        priority: PRIORITY_ITEM_TAKER_DEFAULT + 2,
        run: function () {
          for (let item of this.actor.items) {
            item.cursed = false;
          }
        },
      },
    ];
  }
};
