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
          role: this.role,
          priority: PRIORITY_REDIRECT_ACTION,
          run: function () {
            this.role.data.deflectedFrom = this.target;
          },
        },
      },
      "Redirect Action To": {
        actionName: "Deflect To",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: [] },
        action: {
          role: this.role,
          priority: PRIORITY_REDIRECT_ACTION+3,
          run: function () {
            let deflectFrom = this.role.data.deflectedFrom;
            if (!deflectFrom) {
              return;
            }

            this.redirectAllActionsOnTarget(deflectFrom, this.target);
            delete this.role.data.deflectedFrom;
          },
        },
      },
    };
  }
};
