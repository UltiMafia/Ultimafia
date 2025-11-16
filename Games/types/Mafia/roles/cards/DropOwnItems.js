const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_ITEM_GIVER_DEFAULT,
  PRIORITY_ITEM_GIVER_EARLY,
  PRIORITY_ITEM_TAKER_DEFAULT,
  PRIORITY_ITEM_TAKER_EARLY,
} = require("../../const/Priority");

module.exports = class DropOwnItems extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        labels: ["dropItems", "hidden"],
        priority: PRIORITY_ITEM_GIVER_EARLY + 1,
        run: function () {
          for (let item of this.actor.items) {
            item.drop();
          }
        },
      },
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

    this.passiveActions = [
      {
        ability: ["Item", "Modifier"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_ITEM_TAKER_DEFAULT + 1,
        labels: ["dropItems", "hidden"],
        role: role,
        run: function () {
          for (let item of this.actor.items) {
            item.drop();
          }
        },
      },
      {
        ability: ["Item", "Modifier"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_ITEM_TAKER_EARLY + 1,
        labels: ["dropItems", "hidden"],
        role: role,
        run: function () {
          for (let item of this.actor.items) {
            item.drop();
          }
        },
      },
    ];
  }
};
