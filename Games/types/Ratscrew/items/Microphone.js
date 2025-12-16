const Item = require("../Item");
const {
  IMPORTANT_MEETINGS,
  ROLE_MEETINGS,
} = require("../const/ImportantMeetings");

module.exports = class Microphone extends Item {
  constructor() {
    super("Microphone");
    this.meetings = {};
  }

  setupMeetings() {
    this.meetings = {
      /*
        separationText: {
        actionName: `The Pot has ${(this.game.ThePot)} Chips.`,
        states: ["Guess Dice"],
        flags: ["voting"],
        inputType: "actionSeparatingText",
      },
      */
      Raise: {
        actionName: "Bet",
        states: ["Place Bets"],
        flags: [
          "voting",
          "instant",
          "instantButChangeable",
          "repeatable",
          "noVeg",
        ],
        inputType: "text",
        textOptions: {
          minNumber: 0,
          minLength: 1,
          maxLength: 5,
          numericOnly: true,
          submit: "Confirm",
        },
        action: {
          item: this,
          run: function () {
            this.target = parseInt(this.target);
            //this.game.lastAmountBid - this.actor.AmountBidding + this.target

            if (this.target + this.actor.AmountBidding < this.game.minimumBet) {
              this.actor.getMeetings().forEach((meeting) => {
                if (meeting.name == "Raise") {
                  this.game.sendAlert(
                    `You must Bid at least ${this.game.minimumBet} Chips.`,
                    [this.actor]
                  );
                  meeting.unvote(this.actor, true, true);
                }
              });
              return;
            }

            if (this.actor.Chips < this.target) {
              this.actor.getMeetings().forEach((meeting) => {
                if (meeting.name == "Raise") {
                  this.game.sendAlert(`You don't have ${this.target} Chips.`, [
                    this.actor,
                  ]);
                  meeting.unvote(this.actor, true, true);
                }
              });
              return;
            }

            if (
              this.target + this.actor.AmountBidding <
              this.game.lastAmountBid
            ) {
              this.actor.getMeetings().forEach((meeting) => {
                if (meeting.name == "Raise") {
                  this.game.sendAlert(
                    `You must Bid more or equal to then the last Bid.`,
                    [this.actor]
                  );
                  meeting.unvote(this.actor, true, true);
                }
              });
              return;
            }

            if (
              parseInt(this.target) + this.actor.AmountBidding ==
              this.game.lastAmountBid
            ) {
              this.game.addToPot(this.actor, "Call");
            } else {
              this.game.addToPot(this.actor, "Bet", this.target);
            }

            this.actor.hasHadTurn = true;
            this.item.drop();

            this.actor.getMeetings().forEach((meeting) => {
              if (IMPORTANT_MEETINGS.includes(meeting.name)) {
                meeting.leave(this.actor, true);
              }
            });
            for (let player of this.game.players) {
              player.getMeetings().forEach((meeting) => {
                if (ROLE_MEETINGS.includes(meeting.name)) {
                  meeting.leave(player, true);
                }
              });
            }
          },
        },
      },
      Move: {
        actionName: "Choose an Action?",
        states: ["Place Bets"],
        flags: ["voting", "instant"],
        inputType: "custom",
        targets: this.MovesOptions,
        canUnvote: false,
        action: {
          item: this,
          run: function () {
            if (this.target == "Call") {
              //this.game.sendAlert(`${this.actor.name} Calls!`);
              this.game.addToPot(this.actor, "Call");
              this.actor.hasHadTurn = true;
            }
            if (this.target == "All-In") {
              this.game.sendAlert(`${this.actor.name} goes All In!`);
              this.game.addToPot(this.actor, "Bet", this.actor.Chips);
              this.actor.hasHadTurn = true;
            }
            if (this.target == "Fold") {
              this.game.sendAlert(`${this.actor.name} Folds!`);
              this.actor.hasFolded = true;
              this.actor.hasHadTurn = true;
            }
            if (this.target == "Check") {
              this.game.sendAlert(`${this.actor.name} Checks!`);
              this.actor.hasHadTurn = true;
            }

            this.item.drop();
            this.actor.getMeetings().forEach((meeting) => {
              if (IMPORTANT_MEETINGS.includes(meeting.name)) {
                meeting.leave(this.actor, true);
              }
            });
            for (let player of this.game.players) {
              player.getMeetings().forEach((meeting) => {
                if (ROLE_MEETINGS.includes(meeting.name)) {
                  meeting.leave(player, true);
                }
              });
            }
          },
        },
      },
    };
  }

  hold(player) {
    super.hold(player);

    player.game.sendAlert(`${player.name} is placing Bets…`);
    this.MovesOptions = ["Check", "Fold"];
    this.MinRaise = 1;
    if (this.game.lastAmountBid > 0) {
      this.MovesOptions = ["Call", "Fold"];
      this.MinRaise = this.game.minimumBet;
    }
    if (player.Chips <= 0) {
      this.MovesOptions = ["Fold"];
    }
    /*
    if (
      this.game.lastAmountBid > player.Chips ||
      this.game.minimumBet > player.Chips
    ) {
      this.MovesOptions.push("All-In");
    }
    */
    this.setupMeetings();
    /*
    this.meetings.Amount.textOptions.maxLength =
      player.game.lastAmountBid.toString().length + 2;

    if (player.game.gameMasterAnnoyedByHighBidsThisRoundYet) {
      this.meetings.Amount.textOptions.maxNumber =
        parseInt(player.game.lastAmountBid) + 1;
    }
    */
  }
};
