const Item = require("../Item");
const Message = require("../../../core/Message");
const { rlyehianify } = require("../../../../lib/TranslatorRlyehian");

module.exports = class Sockpuppet extends Item {
  constructor(options) {
    super("Sockpuppet");

    this.magicCult = options?.magicCult;
    this.broken = options?.broken;

    this.meetings = {
      "Sockpuppet message": {
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

            const puppet = this.item.trollboxTarget;
            this.item.trollboxMessage = trollboxMessage;

            let villageMeeting = this.game.getMeetingByName("Village");
            for (let item of this.actor.items) {
                    if (item.name == "Room") {
                      villageMeeting = this.game.getMeetingByName(item.Room.name);
                    }
                  }

            if (!villageMeeting || !puppet) {
              return;
            }

            if (this.item.broken) {
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
            this.item.trollboxTarget = this.target;
            const trollboxMessage = this.item.trollboxMessage;


            
          let villageMeeting = this.game.getMeetingByName("Village");
            for (let item of this.actor.items) {
                    if (item.name == "Room") {
                      villageMeeting = this.game.getMeetingByName(item.Room.name);
                    }
                  }

            if (!villageMeeting || !trollboxMessage) {
              return;
            }

            if (this.item.broken) {
              this.item.drop();
              return;
            }

              if (this.target != undefined) {
              let message = new Message({
                sender: this.target,
                content: trollboxMessage,
                game: this.game,
                meeting: villageMeeting,
                recipients: [],
              });

              for (let player of message.game.players)
                if (player != this.target) message.recipients.push(player);

              message.send();
            }

            this.item.drop();



          },
        },
      },
    };
  }
};
