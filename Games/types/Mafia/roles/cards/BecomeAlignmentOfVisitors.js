const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_BLOCK_VISITORS,
  PRIORITY_WIN_CHECK_DEFAULT,
} = require("../../const/Priority");

module.exports = class BecomeAlignmentOfVisitors extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.player.faction = "Village";
      },
      state: function (stateInfo) {
        if (!this.hasAbility(["Delirium"])) {
          return;
        }
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_BLOCK_VISITORS - 1,
          labels: ["block", "hidden"],
          role: this,
          run: function () {
            for (let visit of this.getVisitors(this.actor)) {
              if (this.dominates(visit)) {
                this.blockWithDelirium(visit);
              }
              if (visit.faction == "Independent") {
                this.actor.queueAlert(
                  `After Hitchhiking with a player you feel like Supporting a ${visit.role.name}.`
                );
                this.actor.faction = visit.role.name;
                return;
              } else {
                this.actor.queueAlert(
                  `After Hitchhiking with a player you feel like Supporting the ${visit.faction}.`
                );
                this.actor.faction = visit.faction;
                return;
              }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
