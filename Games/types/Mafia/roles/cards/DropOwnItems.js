const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class DropOwnItems extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        labels: ["dropItems", "hidden"],
        priority: PRIORITY_ITEM_GIVER_DEFAULT + 1,
        run: function () {
          for (let item of this.actor.items) {
            item.drop();
          }
        },
      },
    ];
  }
};
