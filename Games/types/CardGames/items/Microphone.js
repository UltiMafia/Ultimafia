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
        actionName: "Raise?",
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
          minNumber: 1,
          minLength: 1,
          maxLength: 5,
          numericOnly: true,
          submit: "Confirm",
        },
        action: {
          item: this,
          run: function () {
            this.target = parseInt(this.target);

            if (
              this.actor.Chips <
              this.game.lastAmountBid - this.actor.AmountBidding + this.target
            ) {
              this.actor.getMeetings().forEach((meeting) => {
                if (meeting.name == "Amount") {
                  this.game.sendAlert(
                    `You don't have ${
                      this.game.lastAmountBid -
                      this.actor.AmountBidding +
                      this.target
                    } Chips.`,
                    [this.actor]
                  );
                  meeting.unvote(this.actor, true, true);
                }
              });
              return;
            }

            this.game.addToPot(this.actor, "Raise", this.target);
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
        states: ["Guess Dice"],
        flags: ["voting", "instant", "instantButChangeable", "repeatable"],
        inputType: "custom",
        targets: this.MovesOptions,
        canUnvote: false,
        action: {
          item: this,
          run: function () {
            if (this.target == "Call") {
              this.game.addToPot(this.actor, "Call", 0);
              this.actor.hasHadTurn = true;
            }
            if (this.target == "Fold") {
              this.game.sendAlert(`${this.actor.name} Folds!`);
              this.actor.hasFolded = true;
              this.actor.hasHadTurn = true;
            }
            if (this.target == "Check") {
              this.game.sendAlert(`${this.actor.name} Checks!`);
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
