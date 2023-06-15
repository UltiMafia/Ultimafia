const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GainKnifeIfVisitedNonCult extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_ITEM_GIVER_DEFAULT,
        labels: ["hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() !== "Night") return;

          if (!this.actor.alive) return;

          let visitors = this.getVisitors(this.actor);
          let hasNonCultVisitors =
            visitors.filter((v) => v.role.alignment !== "Cult")?.length > 0;

          if (!hasNonCultVisitors) {
            return;
          }

          this.actor.holdItem("Knife");
          this.queueGetItemAlert("Knife", this.actor);
        },
      },
    ];
  }
};
