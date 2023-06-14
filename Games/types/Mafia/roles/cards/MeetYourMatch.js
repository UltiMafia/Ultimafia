const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class MeetYourMatch extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Lovebird A": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_ITEM_GIVER_DEFAULT - 1,
          run() {
            this.actor.role.data.lovebirdA = this.target;
          },
        },
      },
      "Lovebird B": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["effect", "love"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run() {
            if (!this.actor.role.data.lovebirdA) return;
            const { lovebirdA } = this.actor.role.data;
            const lovebirdB = this.target;

            const alignmentA = lovebirdA.role.winCount
              ? lovebirdA.role.winCount
              : lovebirdA.role.alignment;
            const alignmentB = lovebirdB.role.winCount
              ? lovebirdB.role.winCount
              : lovebirdB.role.alignment;
            let alert;
            if (alignmentA === alignmentB) {
              lovebirdA.giveEffect("Love", this.actor);
              lovebirdB.giveEffect("Love", this.actor);
              alert = `:sy0c: ${lovebirdA.name} and ${lovebirdB.name}'s date went well. They are now in love.`;
            } else {
              alert = `:sy8g: ${lovebirdA.name} and ${lovebirdB.name}'s date went poorly. Better luck next time.`;
            }
            this.actor.queueAlert(alert);
            delete this.actor.role.data.lovebirdA;
          },
        },
      },
    };
  }
};
