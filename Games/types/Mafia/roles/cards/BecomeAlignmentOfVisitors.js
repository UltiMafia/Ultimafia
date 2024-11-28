const Card = require("../../Card");
const {
  PRIORITY_BLOCK_VISITORS,
  PRIORITY_WIN_CHECK_DEFAULT,
} = require("../../const/Priority");

module.exports = class BecomeAlignmentOfVisitors extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_BLOCK_VISITORS - 1,
        labels: ["block", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (!this.actor.alive) return;

          for (let visit of this.getVisitors(this.actor)) {
            if (this.dominates(visit)) {
              this.blockWithMindRot(visit);
            }

            this.actor.queueAlert(
              `After Hitchhiking with a player you feel like Supporting the ${visit.faction}.`
            );
            this.actor.faction = visit.faction;
            return;
          }
        },
      },
    ];
    */
    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: this.player,
          target: target,
          game: this.player.game,
          priority: PRIORITY_BLOCK_VISITORS - 1,
          labels: ["block", "hidden"],
          run: function () {
            if (!this.actor.alive) return;

            for (let visit of this.getVisitors(this.actor)) {
              if (this.dominates(visit)) {
                this.blockWithMindRot(visit);
              }

              this.actor.queueAlert(
                `After Hitchhiking with a player you feel like Supporting the ${visit.faction}.`
              );
              this.actor.faction = visit.faction;
              return;
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
