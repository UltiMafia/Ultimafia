const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_REDIRECT_ACTION } = require("../../const/Priority");

module.exports = class RedirectVisitors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_REDIRECT_ACTION - 1,
        labels: ["hidden", "absolute"],
        run: function () {
          let visitors = this.getVisitors();

          for (let visitor of visitors)
            if (this.dominates(visitor)) this.actor.role.data.controlledActor = this.visitor;
        },
      },
    ];

    this.meetings = {
      Redirect: {
        actionName: "Redirect to",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          priority: PRIORITY_REDIRECT_ACTION,
          run: function () {
            let toControl = this.actor.role.data.controlledActor;
            if (!toControl) {
              return;
            }

            this.redirectAllActions(toControl, this.target);
            delete this.actor.role.data.controlledActor;
          },
        },
      },
    };
  }
};
