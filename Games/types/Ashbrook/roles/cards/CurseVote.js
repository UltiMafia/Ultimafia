const Card = require("../../Card");
const { PRIORITY_LEADER } = require("../../const/Priority");

module.exports = class CurseVote extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Choose Cursed Vote": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          priority: PRIORITY_LEADER,
          run: function () {
            if (this.isInsane()) return;

            this.target.giveEffect("CursedVote", this.actor, 1);
          },
        },
      },
    };
  };
}
