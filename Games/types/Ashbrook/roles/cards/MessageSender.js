const Card = require("../../Card");
const { PRIORITY_MESSAGE_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class MessageSender extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Write Message": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: 1,
          maxLength: 100,
          alphaOnly: false,
          toLowerCase: false,
          submit: "Write",
        },
        action: {
          priority: PRIORITY_MESSAGE_GIVER_DEFAULT - 1,
          run: function () {
            if (this.isInsane()) return;

            this.actor.role.data.message = this.target;
          },
        },
      },

      "Send Message": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          labels: ["message"],
          priority: PRIORITY_MESSAGE_GIVER_DEFAULT,
          run: function () {
            if (this.actor.role.data.message != undefined) {
              var alert = `:sy5h: You receive a message that reads: ${this.actor.role.data.message}.`;
              this.target.queueAlert(alert);
            }
            delete this.actor.role.data.message;
          },
        },
      },
    };
  }
};
