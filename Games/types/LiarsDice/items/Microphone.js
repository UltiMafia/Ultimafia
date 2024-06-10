const Item = require("../Item");

module.exports = class Microphone extends Item {
  constructor() {
    super("Microphone");
    this.meetings = {};
  }

  setupMeetings() {
    this.meetings = {
      "Amount": {
        actionName: "How many?",
        states: ["Guess Dice"],
        flags: ["voting", "instant", "instantButChangeable", "repeatable"],
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
            this.actor.howManySelected = true;
            this.actor.role.data.amount = this.target;

            if (this.actor.whichFaceSelected) {

              this.game.lastBidder = this.actor;
              this.game.lastAmountBid = this.actor.role.data.amount;
              this.game.lastFaceBid = this.target;
              this.game.sendAlert(`${this.actor.name} guesses ${this.actor.role.data.amount}x ${this.actor.role.data.face}`);
              this.item.drop();

              this.actor.getMeetings().forEach((meeting) => {
                if (meeting.name == "Amount" || meeting.name == "Face" || meeting.name == "CallLie" || meeting.name == "SpotOn") {
                  meeting.leave(this.actor, true);
                }
              });

            }
          },
        },
      },
      "Face": {
        actionName: "Which face?",
        states: ["Guess Dice"],
        flags: ["voting", "instant", "instantButChangeable", "repeatable"],
        inputType: "custom",
        targets: ["1", "2", "3", "4", "5", "6"],
        canUnvote: false,
        action: {
          item: this,
          run: function () {
            this.actor.whichFaceSelected = true;
            this.actor.role.data.face = this.target;

            if (this.actor.howManySelected) {

              this.game.lastBidder = this.actor;
              this.game.lastAmountBid = this.actor.role.data.amount;
              this.game.lastFaceBid = this.target;
              this.game.sendAlert(`${this.actor.name} guesses ${this.actor.role.data.amount}x ${this.actor.role.data.face}`);
              this.item.drop();

              this.actor.getMeetings().forEach((meeting) => {
                if (meeting.name == "Amount" || meeting.name == "Face" || meeting.name == "CallLie" || meeting.name == "SpotOn") {
                  meeting.leave(this.actor, true);
                }
              });

            }
          },
        },
      },
      "CallLie": {
        actionName: "Call A Lie?",
        states: ["Guess Dice"],
        flags: ["voting", "instant"],
        inputType: "button",
        targets: ["Yes!"], 
        action: {
          item: this,
          run: function () {
            if (this.target == "Yes!") {
              this.actor.getMeetings().forEach((meeting) => {
                if (meeting.name == "Amount" || meeting.name == "Face" || meeting.name == "CallLie" || meeting.name == "SpotOn") {
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

    if (this.game.spotOn) {
      this.meetings["SpotOn"] = {
        actionName: "Call a Spot On?",
        states: ["Guess Dice"],
        flags: ["voting", "instant"],
        inputType: "button",
        targets: ["Yes!"], 
        action: {
          item: this,
          run: function () {
            if (this.target == "Yes!") {

              if (this.game.lastBidder != null) {
                this.actor.getMeetings().forEach((meeting) => {
                  if (meeting.name == "Amount" || meeting.name == "Face" || meeting.name == "CallLie" || meeting.name == "SpotOn") {
                    meeting.leave(this.actor, true);
                  }
                });
                this.item.drop();
              }

              this.game.callASpotOn(this.actor);
            }
          },
        },
      };
    }
  }

  hold(player) {
    super.hold(player);
    player.game.queueAlert(`${player.name} is guessing dice…`);

    player.howManySelected = false;
    player.whichFaceSelected = false;

    this.setupMeetings();

    this.meetings.Amount.textOptions.minNumber = parseInt(player.game.lastAmountBid, 10) + 1;
  }
};