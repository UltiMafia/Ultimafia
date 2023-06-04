const Card = require("../../Card");
const {
  PRIORITY_MODIFY_ALIGNMENT,
  PRIORITY_WIN_CHECK_DEFAULT,
} = require("../../const/Priority");

module.exports = class RoamingAlignment extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Align With": {
        actionName: "Follow the ways of",
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_MODIFY_ALIGNMENT,
          run: function () {
            let alignment = this.target.role.alignment;
            if (alignment == "Independent") {
              this.actor.queueAlert(
                `You follow ${this.target.name} but could not find somewhere that you could call your own.`
              );
              delete this.actor.role.data.alignment;
              return;
            }

            this.actor.role.data.alignment = alignment;
            this.actor.queueAlert(
              `You follow ${this.target.name} and learn the ways of the ${alignment}.`
            );
          },
        },
      },
    };

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (!this.player.alive || !this.data.alignment) {
          return;
        }

        if (
          confirmedFinished &&
          winners.groups[this.data.alignment] &&
          !winners.groups[this.name]
        ) {
          winners.addPlayer(this.player, this.name);
        }

        if (
          aliveCount <= 2 &&
          this.data.alignment != "Village" &&
          !winners.groups[this.name]
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};
