const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class CurseWithWordCult extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Write with Sigils (4-15)": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: 4,
          maxLength: 15,
          alphaOnly: true,
          toLowerCase: true,
          submit: "Engrave",
        },
        action: {
          role: this.role,
          priority: PRIORITY_EFFECT_GIVER_DEFAULT - 1,
          run: function () {
            this.role.cursedWord = this.target;
          },
        },
      },

      Curse: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Cult"] },
        action: {
          role: this.role,
          labels: ["effect"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            if (this.dominates())
              this.role.giveEffect(
                this.target,
                "CursedCult",
                this.actor,
                this.role.cursedWord,
                1
              );
          },
        },
      },
    };
  }
};
