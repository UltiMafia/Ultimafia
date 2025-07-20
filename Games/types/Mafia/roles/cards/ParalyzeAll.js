const Card = require("../../Card");
const { PRIORITY_DAY_EFFECT_DEFAULT } = require("../../const/Priority");

module.exports = class ParalyzeAll extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Paralyze Votes": {
        actionName: "Paralyze Votes?",
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        shouldMeet: function () {
          return !this.hasParalyzed;
        },
        action: {
          role: this.role,
          priority: PRIORITY_DAY_EFFECT_DEFAULT,
          run: function () {
            if (this.target === "Yes") {
              this.role.hasParalyzed = true;
              if (!this.actor.hasAbility(["Effect"])) {
                return;
              }
              if (
                this.game.RoomOne.length > 0 &&
                this.game.RoomTwo.length > 0
              ) {
                this.game.queueAlert(
                  ":omg: The whole town can't move… everyone is paralyzed!"
                );
                for (const player of this.game.RoomOne) {
                  player.giveEffect("CannotChangeVote", -1, "Room 1");
                }
                for (const player of this.game.RoomTwo) {
                  player.giveEffect("CannotChangeVote", -1, "Room 2");
                }
                return;
              }

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
