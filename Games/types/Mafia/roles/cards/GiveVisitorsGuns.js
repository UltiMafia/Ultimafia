const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveVisitorsGuns extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        labels: ["giveItem", "gun"],
        run: function () {
          if (this.game.getStateName() !== "Night") {
            return;
          }

          if (!this.actor.alive) {
            return;
          }

          let visitors = this.getVisitors();
          visitors.map((p) => {
            p.holdItem("Gun");
            this.queueGetItemAlert("Gun", p);
          });
        },
      },
    ];
  }
};
