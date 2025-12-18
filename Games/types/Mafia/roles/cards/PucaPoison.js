const Card = require("../../Card");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class PucaPoison extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Poison and Make Delirious": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Cult"] },
        action: {
          role: role,
          labels: ["effect", "poison", "block"],
          priority: PRIORITY_NIGHT_ROLE_BLOCKER + 3,
          run: function () {
            if (this.dominates()) {
              this.role.giveEffect(this.target, "Poison", this.actor);
              this.blockWithDelirium(this.target);
            }
          },
        },
      },
    };
  }
};
