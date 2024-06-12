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
        flags: ["voting", "instant", "instantButChangeable", "repeatable", "noVeg"],
        inputType: "text",
        textOptions: {
          minLength: 1,
          maxLength: 5,
          numericOnly: true,
          submit: "Confirm",
        },
        action: {
          item: this,
          run: function () {
            this.actor.howManySelected = true;
            this.actor.role.data.amount = this.target;

            

            if (this.actor.howManySelected && this.actor.whichFaceSelected) {

              if(parseInt(this.target) <= parseInt(this.game.lastAmountBid) && parseInt(this.actor.role.data.face) <= parseInt(this.game.lastFaceBid)) {

                console.log(this.target);  //1000
                console.log(this.game.lastAmountBid); //999
                console.log(this.actor.role.data.face); //4
                console.log(this.game.lastFaceBid); //4

                this.actor.howManySelected = false;

                if (!this.actor.warningSent) {
                  this.actor.warningSent = true;
                  this.game.sendAlert(`You must increase either the amount or the face value of the last turn's bid`);
                }

                this.actor.getMeetings().forEach((meeting) => {
                  if (meeting.name == "Amount") {
                    meeting.unvote(this.actor, true, true);
                  }
                });

                return;
              }

              this.game.lastBidder = this.actor;
              this.game.lastAmountBid = this.target;
              this.game.lastFaceBid = this.actor.role.data.face;
              this.game.sendAlert(`${this.actor.name} guesses ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s`);
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

            if (this.actor.howManySelected && this.actor.whichFaceSelected) {

              if(parseInt(this.actor.role.data.amount) <= parseInt(this.game.lastAmountBid) && parseInt(this.target) <= parseInt(this.game.lastFaceBid)) {
                this.actor.howManySelected = false;

                if (!this.actor.warningSent) {
                  this.actor.warningSent = true;
                  this.game.sendAlert(`You must increase either the amount or the face value of the bid from the last turn!`);
                }

                this.actor.getMeetings().forEach((meeting) => {
                  if (meeting.name == "Amount") {
                    meeting.unvote(this.actor, true, true);
                  }
                });
                return;
              }

              this.game.lastBidder = this.actor;
              this.game.lastAmountBid = this.actor.role.data.amount;
              this.game.lastFaceBid = this.target;
              this.game.sendAlert(`${this.actor.name} guesses ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s`);
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
    player.warningSent = false;
    player.amount = 0;
    player.face = 0;

    this.setupMeetings();

    if (parseInt(player.game.lastAmountBid, 10) == 0) {
      this.meetings.Amount.textOptions.minNumber = 1;
    } else {
      this.meetings.Amount.textOptions.minNumber = parseInt(player.game.lastAmountBid, 10);
    }
  }
};