const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class CurseWithWord extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Write on Talisman (4-10)": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: 4,
          maxLength: 10,
          alphaOnly: true,
          toLowerCase: true,
          submit: "Chant",
        },
        action: {
          priority: PRIORITY_EFFECT_GIVER_DEFAULT - 1,
          run() {
            this.actor.role.data.cursedWord = this.target;
          },
        },
      },

      Curse: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Mafia"] },
        action: {
          labels: ["effect"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run() {
            if (this.dominates())
              this.target.giveEffect(
                "Cursed",
                this.actor,
                this.actor.role.data.cursedWord,
                1
              );
          },
        },
      },
    };
  }
};
