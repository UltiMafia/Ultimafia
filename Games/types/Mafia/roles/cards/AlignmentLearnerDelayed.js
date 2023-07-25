const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class AlignmentLearnerDelayed extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Learn Alignment Delayed": {
        actionName: "Learn Alignment",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["investigate", "alignment"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            var role = this.target.getAppearance("investigate", true);
            var alignment = this.game.getRoleAlignment(role);

            if (alignment == "Independent")
              alignment = "neither the Village, Mafia, nor Monsters";
            else alignment = `the ${alignment}`;

            var alert = `:invest: You learn that ${this.target.name} is sided with ${alignment}.`;
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

          this.actor.queueAlert(this.actor.role.savedAlert)
        },
      },
    ];
  }
};
