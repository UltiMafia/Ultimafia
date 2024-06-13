const Item = require("../Item");

module.exports = class Microphone extends Item {
  constructor() {
    super("Microphone");
    this.meetings = {};
  }

  setupMeetings() {
    this.meetings = {
      Amount: {
        actionName: "How many?",
        states: ["Guess Dice"],
        flags: [
          "voting",
          "instant",
          "instantButChangeable",
          "repeatable",
          "noVeg",
        ],
        inputType: "text",
        textOptions: {
          minNumber: 1,
          minLength: 1,
          maxLength: 5,
          numericOnly: true,
          submit: "Confirm",
        },
        action: {
          item: this,
          run: function () {
            if (parseInt(this.target) < parseInt(this.game.lastAmountBid)) {
              this.actor.getMeetings().forEach((meeting) => {
                if (meeting.name == "Amount") {
                  this.game.sendAlert(
                    "You can't bid lower than previous player.",
                    [this.actor]
                  );
                  meeting.unvote(this.actor, true, true);
                }
              });
              return;
            }

            this.actor.howManySelected = true;
            this.actor.role.data.amount = this.target;

            if (this.actor.howManySelected && this.actor.whichFaceSelected) {
              if (
                parseInt(this.target) <= parseInt(this.game.lastAmountBid) &&
                parseInt(this.actor.role.data.face) <=
                  parseInt(this.game.lastFaceBid)
              ) {
                this.actor.howManySelected = false;

                this.game.sendAlert(
                  `You must increase either the amount or the face value of the last turn's bid`,
                  [this.actor]
                );

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
              this.parsedAmount = parseInt(this.actor.role.data.amount);
              if (this.parsedAmount <= this.game.allDice) {
                this.game.sendAlert(
                  `${this.actor.name} guesses ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s`
                );
              } else if (
                this.parsedAmount <= this.game.allDice &&
                this.parsedAmount < this.game.allDice + 100
              ) {
                this.randomResponse = Math.floor(Math.random() * 6);
                switch (this.randomResponse) {
                  case 0:
                    this.game.sendAlert(
                      `${this.actor.name} guesses uhh.. ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s?`
                    );
                    break;
                  case 1:
                    this.game.sendAlert(
                      `${this.actor.name} guesses... ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s? Huh?`
                    );
                    break;
                  case 2:
                    this.game.sendAlert(
                      `${this.actor.name} guesses... ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s? Sorry, did I hear that right?`
                    );
                    break;
                  case 3:
                    this.game.sendAlert(
                      `${this.actor.role.data.amount}x ${this.actor.role.data.face}'s from ${this.actor.name}? Could you repeat that bid?`
                    );
                    break;
                  case 4:
                    this.game.sendAlert(
                      `"${this.actor.role.data.amount}x ${this.actor.role.data.face}'s?" ${this.actor.name}, I just want to confirm I have that correct.`
                    );
                    break;
                  case 5:
                    this.game.sendAlert(
                      `${this.actor.name}, I think I missed your bid - was it ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s you said?`
                    );
                    break;
                }
              } else if (
                this.parsedAmount >=
                  parseInt(
                    "9".repeat((this.game.allDice * 100).toString().length)
                  ) &&
                !this.game.gameMasterAnnoyedByHighBidsThisRoundYet
              ) {
                this.game.sendAlert(
                  `${this.actor.role.data.amount}x ${this.actor.role.data.face}'s??? There are only ${this.game.allDice} dice!!`
                );
                this.game.sendAlert(
                  `That's it, for the rest of the round you all can only increase amount by 1.`
                );
                this.game.gameMasterAnnoyedByHighBidsThisRoundYet = true;
              } else if (this.parsedAmount >= this.game.allDice + 100) {
                this.randomResponse = Math.floor(Math.random() * 20);
                switch (this.randomResponse) {
                  case 0:
                    this.game.sendAlert(
                      `We have a genius in here! ${this.actor.name} thinks there are ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s omong these ${this.game.allDice}.`
                    );
                    break;
                  case 1:
                    this.game.sendAlert(
                      `Putting the 'liar' in Liar's Dice - ${this.actor.name} thinks there are ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s.`
                    );
                    break;
                  case 2:
                    this.game.sendAlert(
                      `${this.actor.name} would like us all to believe there are ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s among these ${this.game.allDice} dice!`
                    );
                    break;
                  case 3:
                    this.game.sendAlert(
                      `${this.actor.name} bids ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s! I'm sure nobody would think of calling a lie on this one.`
                    );
                    break;
                  case 4:
                    this.game.sendAlert(
                      `${this.actor.name} bids ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s. Seems legit to me!`
                    );
                    break;
                  case 5:
                    this.game.sendAlert(
                      `${this.actor.name} says there are ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s. I believe them!`
                    );
                    break;
                  case 6:
                    this.game.sendAlert(
                      `${this.actor.role.data.amount}x ${this.actor.role.data.face}'s? If ${this.actor.name} says so, it must be true!`
                    );
                    break;
                  case 7:
                    this.game.sendAlert(
                      `${this.actor.name} bids ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s. I have no reason to doubt them.`
                    );
                    break;
                  case 8:
                    this.game.sendAlert(
                      `If ${this.actor.name} says there are ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s, who are we to question such wisdom?`
                    );
                    break;
                  case 9:
                    this.game.sendAlert(
                      `${this.actor.name} bids ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s. The confidence is truly inspiring.`
                    );
                    break;
                  case 10:
                    this.game.sendAlert(
                      `${this.actor.name} believes there are ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s. And I thought I'd seen it all!`
                    );
                    break;
                  case 11:
                    this.game.sendAlert(
                      `Ladies and gentlemen, behold: ${this.actor.name} and their astonishing bid of ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s!`
                    );
                    break;
                  case 12:
                    this.game.sendAlert(
                      `Apparently, ${this.actor.name} knows something we don't with a bid of ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s.`
                    );
                    break;
                  case 13:
                    this.game.sendAlert(
                      `Wow, ${this.actor.name} just redefined optimism with a bid of ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s.`
                    );
                    break;
                  case 14:
                    this.game.sendAlert(
                      `If confidence were dice, ${this.actor.name} would definitely have ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s.`
                    );
                    break;
                  case 15:
                    this.game.sendAlert(
                      `Did ${this.actor.name} say ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s? That's... ambitious.`
                    );
                    break;
                  case 16:
                    this.game.sendAlert(
                      `${this.actor.name} bids ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s. I guess we're all in for a surprise.`
                    );
                    break;
                  case 17:
                    this.game.sendAlert(
                      `${this.actor.name}, are you sure you meant ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s? That's quite a number.`
                    );
                    break;
                  case 18:
                    this.game.sendAlert(
                      `According to ${this.actor.name}, there are ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s. Any challengers?`
                    );
                    break;
                  case 19:
                    this.game.sendAlert(
                      `${this.actor.name} claims there are ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s. I guess we'll see.`
                    );
                    break;
                }
              }
              this.item.drop();

              this.actor.getMeetings().forEach((meeting) => {
                if (
                  meeting.name == "Amount" ||
                  meeting.name == "Face" ||
                  meeting.name == "CallLie" ||
                  meeting.name == "SpotOn" ||
                  meeting.name == "separationText"
                ) {
                  meeting.leave(this.actor, true);
                }
              });
            }
          },
        },
      },
      Face: {
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
              if (
                parseInt(this.actor.role.data.amount) <=
                  parseInt(this.game.lastAmountBid) &&
                parseInt(this.target) <= parseInt(this.game.lastFaceBid)
              ) {
                this.actor.howManySelected = false;

                this.game.sendAlert(
                  `You must increase either the amount or the face value of the bid from the last turn!`,
                  [this.actor]
                );

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
              this.parsedAmount = parseInt(this.actor.role.data.amount);
              if (this.parsedAmount <= this.game.allDice) {
                this.game.sendAlert(
                  `${this.actor.name} guesses ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s`
                );
              } else if (
                this.parsedAmount >= this.game.allDice &&
                this.parsedAmount < this.game.allDice + 100
              ) {
                this.randomResponse = Math.floor(Math.random() * 6);
                switch (this.randomResponse) {
                  case 0:
                    this.game.sendAlert(
                      `${this.actor.name} guesses uhh.. ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s?`
                    );
                    break;
                  case 1:
                    this.game.sendAlert(
                      `${this.actor.name} guesses... ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s? Huh?`
                    );
                    break;
                  case 2:
                    this.game.sendAlert(
                      `${this.actor.name} guesses... ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s? Sorry, did I hear that right?`
                    );
                    break;
                  case 3:
                    this.game.sendAlert(
                      `${this.actor.role.data.amount}x ${this.actor.role.data.face}'s from ${this.actor.name}? Could you repeat that bid?`
                    );
                    break;
                  case 4:
                    this.game.sendAlert(
                      `"${this.actor.role.data.amount}x ${this.actor.role.data.face}'s?" ${this.actor.name}, I just want to confirm I have that correct.`
                    );
                    break;
                  case 5:
                    this.game.sendAlert(
                      `${this.actor.name}, I think I missed your bid - was it ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s you said?`
                    );
                    break;
                }
              } else if (
                this.parsedAmount >=
                  parseInt(
                    "9".repeat((this.game.allDice * 100).toString().length)
                  ) &&
                !this.game.gameMasterAnnoyedByHighBidsThisRoundYet
              ) {
                this.game.sendAlert(
                  `${this.actor.role.data.amount}x ${this.actor.role.data.face}'s??? There are only ${this.game.allDice} dice!!`
                );
                this.game.sendAlert(
                  `That's it, for the rest of the round you all can only increase amount by 1.`
                );
                this.game.gameMasterAnnoyedByHighBidsThisRoundYet = true;
              } else if (this.parsedAmount >= this.game.allDice + 100) {
                this.randomResponse = Math.floor(Math.random() * 20);
                switch (this.randomResponse) {
                  case 0:
                    this.game.sendAlert(
                      `We have a genius in here! ${this.actor.name} thinks there are ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s omong these ${this.game.allDice}.`
                    );
                    break;
                  case 1:
                    this.game.sendAlert(
                      `Putting the 'liar' in Liar's Dice - ${this.actor.name} thinks there are ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s.`
                    );
                    break;
                  case 2:
                    this.game.sendAlert(
                      `${this.actor.name} would like us all to believe there are ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s among these ${this.game.allDice} dice!`
                    );
                    break;
                  case 3:
                    this.game.sendAlert(
                      `${this.actor.name} bids ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s! I'm sure nobody would think of calling a lie on this one.`
                    );
                    break;
                  case 4:
                    this.game.sendAlert(
                      `${this.actor.name} bids ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s. Seems legit to me!`
                    );
                    break;
                  case 5:
                    this.game.sendAlert(
                      `${this.actor.name} says there are ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s. I believe them!`
                    );
                    break;
                  case 6:
                    this.game.sendAlert(
                      `${this.actor.role.data.amount}x ${this.actor.role.data.face}'s? If ${this.actor.name} says so, it must be true!`
                    );
                    break;
                  case 7:
                    this.game.sendAlert(
                      `${this.actor.name} bids ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s. I have no reason to doubt them.`
                    );
                    break;
                  case 8:
                    this.game.sendAlert(
                      `If ${this.actor.name} says there are ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s, who are we to question such wisdom?`
                    );
                    break;
                  case 9:
                    this.game.sendAlert(
                      `${this.actor.name} bids ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s. The confidence is truly inspiring.`
                    );
                    break;
                  case 10:
                    this.game.sendAlert(
                      `${this.actor.name} believes there are ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s. And I thought I'd seen it all!`
                    );
                    break;
                  case 11:
                    this.game.sendAlert(
                      `Ladies and gentlemen, behold: ${this.actor.name} and their astonishing bid of ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s!`
                    );
                    break;
                  case 12:
                    this.game.sendAlert(
                      `Apparently, ${this.actor.name} knows something we don't with a bid of ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s.`
                    );
                    break;
                  case 13:
                    this.game.sendAlert(
                      `Wow, ${this.actor.name} just redefined optimism with a bid of ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s.`
                    );
                    break;
                  case 14:
                    this.game.sendAlert(
                      `If confidence were dice, ${this.actor.name} would definitely have ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s.`
                    );
                    break;
                  case 15:
                    this.game.sendAlert(
                      `Did ${this.actor.name} say ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s? That's... ambitious.`
                    );
                    break;
                  case 16:
                    this.game.sendAlert(
                      `${this.actor.name} bids ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s. I guess we're all in for a surprise.`
                    );
                    break;
                  case 17:
                    this.game.sendAlert(
                      `${this.actor.name}, are you sure you meant ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s? That's quite a number.`
                    );
                    break;
                  case 18:
                    this.game.sendAlert(
                      `According to ${this.actor.name}, there are ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s. Any challengers?`
                    );
                    break;
                  case 19:
                    this.game.sendAlert(
                      `${this.actor.name} claims there are ${this.actor.role.data.amount}x ${this.actor.role.data.face}'s. I guess we'll see.`
                    );
                    break;
                }
              }
              this.item.drop();

              this.actor.getMeetings().forEach((meeting) => {
                if (
                  meeting.name == "Amount" ||
                  meeting.name == "Face" ||
                  meeting.name == "CallLie" ||
                  meeting.name == "SpotOn" ||
                  meeting.name == "separationText"
                ) {
                  meeting.leave(this.actor, true);
                }
              });
            }
          },
        },
      },
      separationText: {
        actionName: "OR",
        states: ["Guess Dice"],
        flags: ["voting"],
        inputType: "actionSeparatingText",
      },
      CallLie: {
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
                if (
                  meeting.name == "Amount" ||
                  meeting.name == "Face" ||
                  meeting.name == "CallLie" ||
                  meeting.name == "SpotOn" ||
                  meeting.name == "separationText"
                ) {
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
                  if (
                    meeting.name == "Amount" ||
                    meeting.name == "Face" ||
                    meeting.name == "CallLie" ||
                    meeting.name == "SpotOn"
                  ) {
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

    player.game.sendAlert(`${player.name} is guessing dice…`);

    player.howManySelected = false;
    player.whichFaceSelected = false;
    player.amount = 0;
    player.face = 0;

    this.setupMeetings();

    this.meetings.Amount.textOptions.maxLength =
      player.game.lastAmountBid.toString().length + 2;

    if (player.game.gameMasterAnnoyedByHighBidsThisRoundYet) {
      this.meetings.Amount.textOptions.maxNumber =
        parseInt(player.game.lastAmountBid) + 1;
    }
  }
};
