const Card = require("../../Card");
const { PRIORITY_PARTY_MEETING } = require("../../const/Priority");

module.exports = class ParalyzeAll extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Paralyze Votes?": {
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        shouldMeet: function () {
          return !this.hasParalyzed;
        },
        action: {
          priority: PRIORITY_PARTY_MEETING,
          run: function () {
            if (this.target === "Yes") {
              this.actor.role.hasParalyzed = true;
              this.game.queueAlert(
                ":omg: The whole town can't move… everyone is paralyzed!"
              );
              for (const player of this.game.alivePlayers()) {
                player.giveEffect("CannotChangeVote", -1);
              }
            }
          },
        },
      },
    };
  }
};
