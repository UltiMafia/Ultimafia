const Card = require("../../Card");
const {
  PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
  PRIORITY_WIN_CHECK_DEFAULT,
} = require("../../const/Priority");

module.exports = class BecomeAlignmentOfVisitors extends Card {
  constructor(role) {
    super(role);

     this.actions = [
      {
        priority: PRIORITY_BLOCK_VISITORS,
        labels: ["block", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          for (let action of this.game.actions[0]) {
            if (action.target == this.actor && !action.hasLabel("hidden")) {

              if (
                   action.priority > this.priority
                ) {
                if (this.dominates(action.actor)) {
                  this.blockWithMindRot(action.actor);
                }
              }
                this.actor.queueAlert(`After Hitchhiking with a player you feel like Supporting the ${action.actor.role.alignment}.`);
                this.actor.role.alignment = action.actor.role.alignment;     
                return;
            }
          }
        },
      },
    ];
  }
};
