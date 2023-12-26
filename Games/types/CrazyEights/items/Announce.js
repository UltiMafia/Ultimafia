const Item = require("../Item");

module.exports = class Announce extends Item {
  constructor() {
    super("Announce");
    this.meetings = {
      "Announce Final Card": {
        states: ["Turn"],
        flags: ["voting", "instant"],
        inputType: "customBoolean",
        targets: ["Announce", "Ignore"],
        displayOptions: {
          customBooleanNegativeReply: "Ignore",
        },
        shouldMeet: function () {
          return this.holder.hand.length === 1;
        },
        action: {
          item: this,
          run: function () {
            if (this.target === "Ignore") {
              this.actor.drawCards(2);
              return;
            } else {
              this.game.queueAlert(
                `${this.actor.name} has a single card left…`
              );
            }
            this.actor.dropItem("Announce");
          },
        },
      },
    };
  }

  hold(player) {
    super.hold(player);
  }
};