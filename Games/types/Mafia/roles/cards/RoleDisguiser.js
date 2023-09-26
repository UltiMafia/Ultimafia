const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class RoleDisguiser extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_NIGHT_ROLE_BLOCKER,
        labels: ["investigate", "role"],
        run: function () {
          let role = this.target.getAppearance("investigate", true);
          this.actor.holdItem("Suit", role);
          this.actor.queueAlert(alert);
        },
      },
    ];
  }
};
