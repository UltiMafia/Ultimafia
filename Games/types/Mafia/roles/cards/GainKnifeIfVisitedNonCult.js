const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GainKnifeIfVisitedNonCult extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Item"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_ITEM_GIVER_DEFAULT,
        labels: ["hidden", "absolute"],
        role: role,
        run: function () {
          let visitors = this.getVisitors(this.actor);
          let hasNonCultVisitors =
            visitors.filter((v) => v.role.alignment !== "Cult")?.length > 0;

          if (!hasNonCultVisitors) {
            return;
          }

          this.actor.holdItem("Knife");
          this.actor.queueGetItemAlert("Knife");
        },
      },
    ];
  }
};
