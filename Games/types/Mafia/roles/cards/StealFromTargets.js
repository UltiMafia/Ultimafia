const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_ITEM_TAKER_DEFAULT,
  PRIORITY_ITEM_TAKER_EARLY,
} = require("../../const/Priority");

module.exports = class StealFromTargets extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Item", "Modifier"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_ITEM_TAKER_EARLY,
        labels: ["stealItem"],
        run: function () {
          let visits = this.getVisits(this.actor);
          visits.map((v) => this.stealAllItems(v));
        },
      },
      {
        ability: ["Item", "Modifier"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_ITEM_TAKER_DEFAULT,
        labels: ["stealItem"],
        run: function () {
          let visits = this.getVisits(this.actor);
          visits.map((v) => this.stealAllItems(v));
        },
      },
    ];
  }
};
