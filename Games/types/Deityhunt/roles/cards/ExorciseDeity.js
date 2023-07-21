const Card = require("../../Card");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class ExorciseDeity extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Exorcise: {
        states: ["Night"],
        flags: ["voting"], // add non-consecutive targets
        action: {
          labels: ["block"],
          priority: PRIORITY_NIGHT_ROLE_BLOCKER,
          run: function () {
            if (this.target.role.alignment == "Deity"){
              this.blockActions();
              this.target.queueAlert(`You learn that ${this.actor.name} is the Follower13!`);
            }
          },
        },
      },
    };
  }
};
