const Card = require("../../Card");
const {
  PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
} = require("../../const/Priority");

module.exports = class FlipAlignment extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Litigate: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["dead", "self"] },
        action: {
          priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
          run: function () {
            var appearanceToSet =
              this.target.role.alignment == "Mafia" ? "Villager" : "Mafioso";
            this.target.setTempAppearance("investigate", appearanceToSet);
          },
        },
      },
    };
  }
};
