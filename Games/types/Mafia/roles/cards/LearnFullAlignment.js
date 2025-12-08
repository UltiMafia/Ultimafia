const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");

module.exports = class LearnFullAlignment extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Investigate: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["investigate", "alignment"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            let info = this.game.createInformation(
              "AlignmentInfo",
              this.actor,
              this.game,
              this.target
            );
            info.processInfo();
            var alignment = info.getInfoRaw();
            //this.actor.queueAlert(alert);

            var alert = `:invest: After investigating, you learn that ${this.target.name} is ${alignment}!`;
            this.game.queueAlert(alert, 0, this.meeting.getPlayers());
          },
        },
      },
    };
  }
};
