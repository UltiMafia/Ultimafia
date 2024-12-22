const Card = require("../../Card");
const {
  PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
} = require("../../const/Priority");

module.exports = class CreateFakeVisits extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Victim: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"] },
        action: {
          priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT - 1,
          run: function () {
            this.actor.role.data.victim = this.target;
          },
        },
      },
      "Target (Not a Visit)": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"] },
        action: {
          labels: ["hidden"],
          priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
          run: function () {
            if (!this.actor.role.data.victim) {
              return;
            }

            this.actor.role.data.victim.giveEffect("FakeVisit", 1, [
              this.target,
            ]);
            delete this.actor.role.data.victim;
          },
        },
      },
    };
  }
};
