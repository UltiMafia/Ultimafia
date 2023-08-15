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
            this.game.queueAlert(alert, 0, this.meeting.getPlayers());
            if (this.target.role.name === "Alien") {
              alert = `:invest: You learn that ${this.target.name} is an Alien.`;
            }
            else alert = `:invest: You learn that ${this.target.name} is sided with the Mafia.`;
          },
        },
      },
    };
  }
};
