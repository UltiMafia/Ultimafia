const Card = require("../../Card");
const { PRIORITY_SWAP_VISITORS } = require("../../const/Priority");

module.exports = class SwapVisitors extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Destination A": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: [""] },
        action: {
          role: this.role,
          priority: PRIORITY_SWAP_VISITORS - 1,
          run: function () {
            this.role.data.destinationA = this.target;
          },
        },
      },
      "Destination B": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: [""] },
        action: {
          role: this.role,
          priority: PRIORITY_SWAP_VISITORS,
          run: function () {
            if (this.role.data.destinationA) {
              var destinationA = this.role.data.destinationA;
              var destinationB = this.target;

              for (let action of this.game.actions[0]) {
                if (
                  action.priority > this.priority &&
                  !action.hasLabel("uncontrollable")
                ) {
                  if (action.target == destinationA)
                    action.target = destinationB;
                  else if (action.target == destinationB)
                    action.target = destinationA;
                }
              }

              delete this.role.data.destinationA;
            }
          },
        },
      },
    };
  }
};
