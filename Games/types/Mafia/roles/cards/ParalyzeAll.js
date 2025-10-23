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
              if (!this.role.hasAbility(["Effect"])) {
                return;
              }
              if (this.game.Rooms) {
                this.game.queueAlert(
                  ":omg: The whole town can't move… everyone is paralyzed!"
                );
                for (const player of this.game.alivePlayers()) {
                  for (let item of player.items) {
                    if (item.name == "Room") {
                      this.role.giveEffect(
                        player,
                        "CannotChangeVote",
                        -1,
                        item.Room.name
                      );
                    }
                  }
                }
                return;
              }

              this.game.queueAlert(
                ":omg: The whole town can't move… everyone is paralyzed!"
              );
              for (const player of this.game.alivePlayers()) {
                this.role.giveEffect(player, "CannotChangeVote", -1);
              }
            }
          },
        },
      },
    };
  }
};
