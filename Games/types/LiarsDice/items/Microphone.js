const Item = require("../Item");

module.exports = class Microphone extends Item {
  constructor() {
    super("Microphone");

    this.meetings = {
      "Amount": {
        actionName: "How many?",
        states: ["Guess Dice"],
        flags: ["voting", "instantAction"],
        inputType: "text",
        textOptions: {
          minLength: 1,
          maxLength: 2,
          numericOnly: true,
          submit: "Confirm",
        },
        action: {
          item: this,
          run: function () {
            this.actor.role.data.amount = this.target;
          },
        },
      },
      "Face": {
        actionName: "Which face?",
        states: ["Guess Dice"],
        flags: ["voting"],
        inputType: "custom",
        targets: ["1","2","3","4","5","6"],
        action: {
          item: this,
          run: function () {
            this.game.lastBidder = this.actor;
            this.game.lastAmountBid = this.actor.role.data.amount;
            this.game.lastFaceBid = this.target;
            this.game.sendAlert(`${this.actor.name} guesses ${this.actor.role.data.amount}x ${this.target}`);
            this.item.drop();
          },
        },
      },
      "CallLie": {
        actionName: "Call A Lie!",
        states: ["Guess Dice"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        action: {
          item: this,
          run: function () {
            if (this.target == "Yes") {
              this.actor.getMeetings().forEach((meeting) => {
                if (meeting.name == "Amount" || meeting.name == "Face" || meeting.name == "CallLie") {
                  meeting.leave(this.actor, true);
                }
              });
    
              this.game.sendAlert(`${this.actor.name} calls a lie!`);
              this.game.callALie(this.actor);
              this.item.drop();
            }
          },
        },
      },
    };
  }

  hold(player) {
    super.hold(player);
    player.game.queueAlert(`${player.name} is guessing dice…`);

    this.meetings.Amount.textOptions.minNumber = parseInt(player.game.lastAmountBid, 10) + 1;
  }
};
