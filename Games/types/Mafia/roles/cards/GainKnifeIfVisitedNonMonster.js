const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GainKnifeIfVisitedNonMonster extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_ITEM_GIVER_DEFAULT,
        labels: ["hidden", "absolute"],
        run() {
          if (this.game.getStateName() !== "Night") return;

          if (!this.actor.alive) return;

          const visitors = this.getVisitors(this.actor);
          const hasNonMonsterVisitors =
            visitors.filter((v) => v.role.alignment !== "Monsters")?.length > 0;

          if (!hasNonMonsterVisitors) {
            return;
          }

          this.actor.holdItem("Knife");
          this.queueGetItemAlert("Knife", this.actor);
        },
      },
    ];
  }
};
