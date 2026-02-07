const Item = require("../Item");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../const/Priority");
const { rlyehianify } = require("../../../../lib/TranslatorRlyehian");

module.exports = class Envelope extends Item {
  constructor(options) {
    super("Envelope");

    this.magicCult = options?.magicCult;
    this.broken = options?.broken;

    this.meetings = {
      "Write Letter": {
        states: ["*"],
        flags: ["voting", "instant", "noVeg"],
        inputType: "text",
        textOptions: {
          minLength: 1,
          maxLength: 280,
          alphaOnly: false,
          toLowerCase: false,
          submit: "Write",
        },
        item: this,
        action: {
          labels: ["hidden", "absolute"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          item: this,
          run: function () {
            this.actor.role.data.message = this.target;
            if(!this.actor.role.data.PlayerToSendTo){
              return;
            }
            if (this.item.broken) {
              delete this.actor.role.data.message;
              delete this.actor.role.data.PlayerToSendTo;
              this.item.drop();
              return;
            }

            if (this.item.magicCult) {
              this.actor.role.data.message = rlyehianify(
                this.actor.role.data.message
              );
            }

            if (this.actor.role.data.message != undefined) {
              var alert = `:will: You receive a message in an Envelope that reads: ${this.actor.role.data.message}.`;

              this.actor.role.data.PlayerToSendTo.queueAlert(alert);
            }
            delete this.actor.role.data.message;
            delete this.actor.role.data.PlayerToSendTo;
            this.item.drop();

            
            
          },
        },
      },

      "Send Letter": {
        states: ["*"],
        flags: ["voting", "instant", "noVeg"],
        item: this,
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          labels: ["hidden", "absolute", "message"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          item: this,
          run: function () {
            this.actor.role.data.PlayerToSendTo = this.target;
            if(!this.actor.role.data.message){
              return;
            }
            if (this.item.broken) {
              delete this.actor.role.data.message;
              delete this.actor.role.data.PlayerToSendTo;
              this.item.drop();
              return;
            }

            if (this.item.magicCult) {
              this.actor.role.data.message = rlyehianify(
                this.actor.role.data.message
              );
            }

            if (this.actor.role.data.message != undefined) {
              var alert = `:will: You receive a message in an Envelope that reads: ${this.actor.role.data.message}.`;

              this.actor.role.data.PlayerToSendTo.queueAlert(alert);
            }
            delete this.actor.role.data.message;
            delete this.actor.role.data.PlayerToSendTo;
            this.item.drop();
          },
        },
      },
    };
  }
};
