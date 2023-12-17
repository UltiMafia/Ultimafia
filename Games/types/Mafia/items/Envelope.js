const Item = require("../Item");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../const/Priority");

module.exports = class Envelope extends Item {
  constructor(options) {
    super("Envelope");

    this.meetings = {
      "Write Letter": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: 1,
          maxLength: 280,
          alphaOnly: false,
          toLowerCase: false,
          submit: "Write",
        },
        action: {
          labels: ["hidden", "absolute"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          item: this,
          run: function () {
            this.actor.role.data.message = this.target;
          },
        },
      },

      "Send Letter": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          labels: ["hidden", "absolute", "message"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          item: this,
          run: function () {
            if (this.actor.role.data.message != undefined) {
              var alert = `:will2: You receive a message that reads: ${this.actor.role.data.message}.`;
              this.target.queueAlert(alert);
            }
            delete this.actor.role.data.message;
            this.item.drop();
          },
        },
      },
    };
  }
};
