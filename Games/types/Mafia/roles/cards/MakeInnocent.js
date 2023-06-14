const Card = require("../../Card");
const {
  PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
} = require("../../const/Priority");

module.exports = class MakeInnocent extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Make Innocent": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["Mafia"], exclude: ["dead", "self"] },
        action: {
          priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
          run() {
            this.target.setTempAppearance("investigate", "Villager");
          },
        },
      },
    };
  }
};
