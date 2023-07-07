const Card = require("../../Card");
const { PRIORITY_REDIRECT_ACTION } = require("../../const/Priority");

module.exports = class MakeTargetsMeet extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Make Targets Meet": {
        actionName: "Make Targets Meet (2)",
        states: ["Night"],
        flags: ["voting", "multi"],
        multiMin: 2,
        multiMax: 2,
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          priority: PRIORITY_REDIRECT_ACTION,
          run: function () {
            let t1 = this.target[0];
            let t2 = this.target[1];
            this.redirectAllActions(t1, t2);
            this.redirectAllActions(t2, t1);
          }
        },
      },
    };
  }
};
