const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class MeetYourMatch extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Lovebirds: {
        states: ["Night"],
        flags: ["voting", "multi"],
        multiMin: 2,
        multiMax: 2,
        action: {
          labels: ["effect", "love"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            var lovebirdA = this.target[0];
            var lovebirdB = this.target[1];

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
              alert = `:sy0c: ${lovebirdA.name} and ${lovebirdB.name}'s date went well. They are now in love.`;
            } else {
              alert = `:sy8g: ${lovebirdA.name} and ${lovebirdB.name}'s date went poorly. Better luck next time.`;
            }
            this.actor.queueAlert(alert);
          },
        },
      },
    };
  }
};
