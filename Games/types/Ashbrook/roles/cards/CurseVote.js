const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class CurseVote extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Choose Cursed Vote": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            if (this.isInsane()) return;

            this.target.giveEffect("CursedVote", this.actor, 1);
          },
        },
      },
    };
  };
}
