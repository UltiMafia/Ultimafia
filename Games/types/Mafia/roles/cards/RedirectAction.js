const Card = require("../../Card");
const { PRIORITY_REDIRECT_ACTION } = require("../../const/Priority");
const Player = require("../../../../core/Player");

module.exports = class RedirectAction extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Control Actor": {
        actionName: "Control",
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_REDIRECT_ACTION - 1,
          run: function () {
            this.actor.role.data.controlledActor = this.target;
          },
        },
      },
      "Redirect to Target": {
        actionName: "Redirect To",
        states: ["Night"],
        flags: ["voting", "mustAct"],
        targets: { include: ["alive"], exclude: [] },
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
