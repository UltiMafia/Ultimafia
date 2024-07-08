const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class CurseWithWordCult extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Write with Sigils (5-15)": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: 5,
          maxLength: 15,
          alphaOnly: true,
          toLowerCase: true,
          submit: "Engrave",
        },
        action: {
          priority: PRIORITY_EFFECT_GIVER_DEFAULT - 1,
          run: function () {
            this.actor.role.cursedWord = this.target;
          },
        },
      },

      Curse: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Cult"] },
        action: {
          labels: ["effect"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            if (this.dominates())
              this.target.giveEffect(
                "CursedCult",
                this.actor,
                this.actor.role.cursedWord,
                1
              );
          },
        },
      },
    };
  }
};
