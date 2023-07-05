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
          alphaOnly: true,
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
  }
};
