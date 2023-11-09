const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class AlignmentLearnerDelayed extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Investigate Delayed": {
        actionName: "Investigate",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["investigate", "alignment"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            var role = this.target.getAppearance("investigate", true);
            var alignment = this.game.getRoleAlignment(role);

            if (alignment == "Village" || alignment == "Independent") alignment = "innocent";
            else alignment = `guilty`;

            var alert = `:invest: After investigating, you learn that ${this.target.name} is ${alignment}!`;
            this.actor.role.savedAlert = alert;
          },
        },
      },
    };

    this.actions = [
      {
        labels: ["hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Day") return;

          this.actor.queueAlert(this.actor.role.savedAlert);
        },
      },
    ];
  }
};
