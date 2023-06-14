const Card = require("../../Card");
const {
  PRIORITY_SWAP_VISITORS_A,
  PRIORITY_SWAP_VISITORS_B_AND_SWAP,
} = require("../../const/Priority");

module.exports = class SwapVisitors extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Destination A": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: [""] },
        action: {
          priority: PRIORITY_SWAP_VISITORS_A,
          run() {
            this.actor.role.data.destinationA = this.target;
          },
        },
      },
      "Destination B": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: [""] },
        action: {
          priority: PRIORITY_SWAP_VISITORS_B_AND_SWAP,
          run() {
            if (this.actor.role.data.destinationA) {
              const { destinationA } = this.actor.role.data;
              const destinationB = this.target;

              for (const action of this.game.actions[0]) {
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

              delete this.actor.role.data.destinationA;
            }
          },
        },
      },
    };
  }
};
