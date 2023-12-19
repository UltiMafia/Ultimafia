const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class LearnVisitorsAndArm extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_ITEM_GIVER_DEFAULT,
        labels: ["investigate", "role", "giveItem", "gun", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          let visitors = this.getVisitors(this.actor);
          for (let visitor of visitors) {
            this.actor.queueAlert(`:gun2: You still feel apprehensive about ${visitor.name} after their visit last night but with this new gun, you feel more safe.`);
            this.actor.holdItem("Gun", { reveal: false });
          }
        },
      },
    ];
  }
};
