const Card = require("../../Card");
const { PRIORITY_MESSAGE_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Storyteller extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Compose Story": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: 1,
          maxLength: 100,
          alphaOnly: false,
          toLowerCase: false,
          submit: "Compose",
        },
        action: {
          priority: PRIORITY_MESSAGE_GIVER_DEFAULT - 1,
          run: function () {
            this.actor.role.data.message = this.target;
          },
        },
      },

      "Tell Story": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          labels: ["message"],
          priority: PRIORITY_MESSAGE_GIVER_DEFAULT,
          run: function () {
            if (!this.actor.role.data.message) {
              return;
            }

            this.target.queueAlert(this.actor.role.data.message);
            delete this.actor.role.data.message;
          },
        },
      },
    };
  }
};
