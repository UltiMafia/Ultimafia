const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class AlignmentLearnerParanoid extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Learn Paranoid Alignment": {
        actionName: "Learn Alignment",
        states: ["Night"],
        flags: ["group", "voting"],
        action: {
          labels: ["investigate", "alignment"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            var alert = `:invest: You learn that ${this.target.name} is not sided with the Village.`;
            if (this.target.role.name === "Alien") {
              alert = `:invest: You learn that ${this.target.name} is an Alien.`;
            }
            this.game.queueAlert(alert, 0, this.meeting.getPlayers());
          },
        },
      },
    };
  }
};
