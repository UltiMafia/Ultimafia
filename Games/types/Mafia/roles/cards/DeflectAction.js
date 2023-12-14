const Card = require("../../Card");
const { PRIORITY_REDIRECT_ACTION } = require("../../const/Priority");
const Player = require("../../../../core/Player");

module.exports = class DeflectAction extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Redirect Action From": {
        actionName: "Deflect From",
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_REDIRECT_ACTION - 1,
          run: function () {
            this.actor.role.data.deflectedFrom = this.target;
          },
        },
      },
      "Redirect Action To": {
        actionName: "Deflect To",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: [] },
        action: {
          priority: PRIORITY_REDIRECT_ACTION,
          run: function () {
            let deflectFrom = this.actor.role.data.deflectedFrom;
            if (!deflectFrom) {
              return;
            }

            this.redirectAllActionsOnTarget(deflectFrom, this.target);
            delete this.actor.role.data.deflectedFrom;
          },
        },
      },
    };
  }
};
