const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class MeetYourMatch extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Lovebird A": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          priority: PRIORITY_ITEM_GIVER_DEFAULT - 1,
          role: this.role,
          run: function () {
            this.role.data.lovebirdA = this.target;
          },
        },
      },
      "Lovebird B": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          labels: ["effect", "love"],
          role: this.role,
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            if (!this.role.data.lovebirdA) return;
            let lovebirdA = this.role.data.lovebirdA;
            let lovebirdB = this.target;

            let alignmentA = lovebirdA.role.winCount
              ? lovebirdA.role.winCount
              : lovebirdA.role.alignment;
            let alignmentB = lovebirdB.role.winCount
              ? lovebirdB.role.winCount
              : lovebirdB.role.alignment;
            let alert;
            if (alignmentA === alignmentB) {
              lovebirdA.giveEffect("Love", this.actor);
              lovebirdB.giveEffect("Love", this.actor);
              alert = `:love: ${lovebirdA.name} and ${lovebirdB.name}'s date went well. They are now in love.`;
            } else {
              alert = `:hb: ${lovebirdA.name} and ${lovebirdB.name}'s date went poorly. Better luck next time.`;
            }
            this.actor.queueAlert(alert);
            delete this.role.data.lovebirdA;
          },
        },
      },
    };
  }
};
