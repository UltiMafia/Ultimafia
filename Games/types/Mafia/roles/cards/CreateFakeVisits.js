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
          role: this.role,
          priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT - 1,
          run: function () {
            this.role.data.victim = this.target;
          },
        },
      },
      "Target (Not a Visit)": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"] },
        action: {
          role: this.role,
          labels: ["hidden"],
          priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
          run: function () {
            if (!this.role.data.victim) {
              return;
            }

            this.role.data.victim.giveEffect("FakeVisit", 1, [this.target]);
            delete this.role.data.victim;
          },
        },
      },
    };
  }
};
