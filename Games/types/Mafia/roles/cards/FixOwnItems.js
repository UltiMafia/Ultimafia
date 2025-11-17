const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_ITEM_TAKER_DEFAULT,
  PRIORITY_ITEM_TAKER_EARLY,
} = require("../../const/Priority");

module.exports = class FixOwnItems extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        labels: ["fixItems", "hidden"],
        priority: PRIORITY_ITEM_TAKER_DEFAULT + 2,
        run: function () {
          for (let item of this.actor.items) {
            item.broken = false;
            item.magicCult = false;
            item.mafiaImmune = false;
          }
        },
      },
    ];

    this.passiveActions = [
      {
        ability: ["Item"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_ITEM_TAKER_DEFAULT + 2,
        labels: ["fixItems", "hidden"],
        role: role,
        run: function () {
          for (let item of this.actor.items) {
            item.broken = false;
            item.magicCult = false;
            item.mafiaImmune = false;
          }
        },
      },
      {
        ability: ["Item"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_ITEM_TAKER_EARLY + 2,
        labels: ["fixItems", "hidden"],
        role: role,
        run: function () {
          for (let item of this.actor.items) {
            item.broken = false;
            item.magicCult = false;
            item.mafiaImmune = false;
          }
        },
      },
    ];
  }
};
