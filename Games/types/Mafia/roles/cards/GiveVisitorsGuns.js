const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveVisitorsGuns extends Card {
  constructor(role) {
    super(role);
    /*
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
            p.queueGetItemAlert("Gun");
          });
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
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          labels: ["giveItem", "gun"],
          run: function () {
            let visitors = this.getVisitors();
            visitors.map((p) => {
              p.holdItem("Gun");
              p.queueGetItemAlert("Gun");
            });
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
