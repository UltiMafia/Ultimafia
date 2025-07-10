const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnIfEvilWasSelected extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Check for Demon": {
        actionName: "Check players (2)",
        states: ["Night"],
        flags: ["voting", "multi"],
        targets: { include: ["alive"], exclude: ["self"] },
        multiMin: 2,
        multiMax: 2,
        action: {
          labels: ["investigate", "alignment"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            var targetA = this.target[0];
            var targetB = this.target[1];

            let info = this.game.createInformation(
              "IsOneOfTargetsDemonInfo",
              this.actor,
              this.game,
              this.target,
            );
            info.processInfo();
            var alert = `:law: ${info.getInfoFormated()}.`;
            this.actor.queueAlert(alert);
          },
        },
      },
    };
  }
};
