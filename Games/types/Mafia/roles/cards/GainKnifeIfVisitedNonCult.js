const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GainKnifeIfVisitedNonCult extends Card {
  constructor(role) {
    super(role);
    /*
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
          this.actor.queueGetItemAlert("Knife");
        },
      },
    ];
*/
    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Item"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          labels: ["hidden", "absolute"],
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
        });

        this.game.queueAction(action);
      },
    };
  }
};
