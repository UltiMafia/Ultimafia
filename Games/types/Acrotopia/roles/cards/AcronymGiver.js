const Card = require("../../Card");

module.exports = class AcronymGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Acronym": {
        actionName: "Give Acronym (1-200)",
        states: ["Night"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: 1,
          maxLength: 200,
          enforceAcronym: "",
          submit: "Confirm",
        },
        action: {
          item: this,
          run: function () {
            this.game.recordExpandedAcronym(this.actor, this.target);
          },
        },
      },
    };

    this.listeners = {
      start: function() {
        if (!this.game.enablePunctuation) {
          this.meetings["Give Acronym"].textOptions.alphaOnlyWithSpaces = true;
        }
      },
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        this.meetings["Give Acronym"].textOptions.enforceAcronym =
          this.game.currentAcronym;
      },
    };
  }
};
