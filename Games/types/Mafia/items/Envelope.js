const Item = require("../Item");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../const/Priority");

module.exports = class Envelope extends Item {
  constructor(owner) {
    super("Envelope");
    this.owner = owner;
    this.lifespan = Infinity;

    this.meetings = {
      "Write Letter": {
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
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            this.actor.role.data.message = this.target;
            this.item.drop();
          },
        },
      },

      "Send Letter": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          labels: ["message"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            if (this.actor.role.data.message != undefined) {
              var alert = `:sy5h: You receive a letter that reads: ${this.actor.role.data.message}.`;
              this.target.queueAlert(alert);
            }
            delete this.actor.role.data.message;
          },
        },
      },
    };
  }
};
