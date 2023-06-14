const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class AlignmentLearner extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Learn Alignment": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["investigate", "alignment"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run() {
            const role = this.target.getAppearance("investigate", true);
            let alignment = this.game.getRoleAlignment(role);

            if (alignment == "Independent")
              alignment = "neither the Village, Mafia, nor Monsters";
            else alignment = `the ${alignment}`;

            const alert = `:sy0d: You learn that ${this.target.name} is sided with ${alignment}.`;
            this.game.queueAlert(alert, 0, this.meeting.getPlayers());
          },
        },
      },
    };
  }
};
