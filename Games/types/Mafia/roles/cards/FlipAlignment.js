const Card = require("../../Card");
const {
  PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
} = require("../../const/Priority");

module.exports = class FlipAlignment extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Litigate": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["dead", "self"] },
        action: {
          priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
          run: function () {
            if (this.target.alignment == "Mafia")
              this.target.setTempAppearance("investigate", "Villager");
            else this.target.setTempAppearance("investigate", "Mafioso");
          },
        },
      },
    };
  }
};
