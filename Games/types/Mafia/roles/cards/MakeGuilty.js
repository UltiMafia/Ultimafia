const Card = require("../../Card");
const {
  PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
} = require("../../const/Priority");

module.exports = class MakeGuilty extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Make Guilty": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
          run() {
            this.target.setTempAppearance("investigate", "Mafioso");
          },
        },
      },
    };
  }
};
