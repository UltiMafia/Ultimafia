const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_BLOCK_VISITORS,
  PRIORITY_WIN_CHECK_DEFAULT,
} = require("../../const/Priority");

module.exports = class BecomeAlignmentOfVisitors extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Delirium"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_BLOCK_VISITORS - 1,
        labels: ["block", "hidden"],
        role: role,
        run: function () {
          for (let visit of this.getVisitors(this.actor)) {
            if (this.dominates(visit)) {
              this.blockWithDelirium(visit);
            }
            if (visit.getFaction() == "Independent") {
              this.actor.queueAlert(
                `After Hitchhiking with a player you feel like Supporting a ${visit.getRoleName()}.`
              );
              this.actor.faction = visit.getRoleName();
              return;
            } else {
              this.actor.queueAlert(
                `After Hitchhiking with a player you feel like Supporting the ${visit.getFaction()}.`
              );
              this.actor.faction = visit.getFaction();
              return;
            }
          }
        },
      },
    ];

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        if (this.player.faction == "Independent") {
          this.player.faction = "Village";
        }
      },
    };
  }
};
