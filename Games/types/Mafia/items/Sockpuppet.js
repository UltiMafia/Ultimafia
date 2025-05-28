const Item = require("../Item");
const Message = require("../../../core/Message");
const { rlyehianify } = require("../../../../lib/TranslatorRlyehian");

module.exports = class Trollbox extends Item {
  constructor(options) {
    super("Trollbox");

    this.magicCult = options?.magicCult;
    this.broken = options?.broken;

    this.meetings = {
      "Trollbox message": {
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        inputType: "text",
        textOptions: {
          minLength: 1,
          maxLength: 280,
          alphaOnly: false,
          toLowerCase: false,
          submit: "Send message",
        },
        action: {
          labels: ["hidden", "absolute"],
          item: this,
          run: function () {
            var trollboxMessage = this.target;
            const puppet = this.actor.role.data.trollboxTarget;

            let villageMeeting = this.game.getMeetingByName("Village");
            if (this.game.RoomOne.includes(this.actor)) {
              villageMeeting = this.game.getMeetingByName("Room 1");
            } else if (this.game.RoomTwo.includes(this.actor)) {
              villageMeeting = this.game.getMeetingByName("Room 2");
            }

            if (!villageMeeting || !puppet) {
              return;
            }

            if (this.item.broken) {
              delete this.actor.role.data.trollboxTarget;
              this.item.drop();
              return;
            }

            if (this.item.magicCult) {
              trollboxMessage = rlyehianify(trollboxMessage);
            }

            if (puppet != undefined) {
              let message = new Message({
                sender: puppet,
                content: trollboxMessage,
                game: this.game,
                meeting: villageMeeting,
                recipients: [],
              });

              for (let player of message.game.players)
                if (player != puppet) message.recipients.push(player);

              message.send();
            }

            delete this.actor.role.data.trollboxTarget;
            this.item.drop();
          },
        },
      },

      "Trollbox target": {
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        targets: { include: ["alive"], exclude: ["self"] },
        item: this,
        action: {
          labels: ["hidden", "absolute", "message"],
          item: this,
          run: function () {
            this.actor.role.data.trollboxTarget = this.target;
          },
        },
      },
    };
  }
};
