const Item = require("../Item");
const {
  IMPORTANT_MEETINGS,
  ROLE_MEETINGS,
} = require("../const/ImportantMeetings");

// UHH and GENIUS variants are now rendered on the client (game board) — see
// LiarsDiceGame.jsx LD_UHH_VARIANTS / LD_GENIUS_VARIANTS. The server only
// picks an index and stores it in bidInfo. Counts must match the client.
const UHH_VARIANT_COUNT = 6;
const GENIUS_VARIANT_COUNT = 20;

module.exports = class Microphone extends Item {
  constructor() {
    super("Microphone");
    this.meetings = {};
  }

  // Decides what reaction (if any) accompanies a completed bid. All commentary
  // is rendered on the game board via bidInfo; this function never chat-alerts.
  sendBidAlert(actor) {
    const game = actor.game;
    const amount = actor.role.data.amount;
    const parsed = parseInt(amount);
    const allDice = game.allDice;

    // Reset all per-bid commentary; only the matching branch sets one.
    game.lastBidUhhVariant = null;
    game.lastBidGeniusVariant = null;
    game.lastBidAnnoyedJustTriggered = false;

    if (parsed <= allDice) return; // Normal bid — visual UI handles it.

    if (parsed > allDice && parsed < allDice + 100) {
      game.lastBidUhhVariant = Math.floor(Math.random() * UHH_VARIANT_COUNT);
      return;
    }

    if (
      parsed >= parseInt("9".repeat((allDice * 100).toString().length)) &&
      !game.gameMasterAnnoyedByHighBidsThisRoundYet
    ) {
      game.lastBidAnnoyedJustTriggered = true;
      game.gameMasterAnnoyedByHighBidsThisRoundYet = true;
      return;
    }

    if (parsed >= allDice + 100) {
      game.lastBidGeniusVariant = Math.floor(
        Math.random() * GENIUS_VARIANT_COUNT
      );
    }
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
              this.item.sendBidAlert(this.actor);
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
            }
          },
        },
      },
      Face: {
        actionName: "Which face?",
        states: ["Guess Dice"],
        flags: ["voting", "instant", "instantButChangeable", "repeatable"],
        inputType: "imageButtons",
        targets: ["dice1", "dice2", "dice3", "dice4", "dice5", "dice6"],
        canUnvote: false,
        action: {
          item: this,
          run: function () {
            this.actor.whichFaceSelected = true;
            this.actor.role.data.face = this.target.substring(
              this.target.length - 1
            );

            if (this.actor.howManySelected && this.actor.whichFaceSelected) {
              if (
                parseInt(this.actor.role.data.amount) <=
                  parseInt(this.game.lastAmountBid) &&
                parseInt(this.target.substring(this.target.length - 1)) <=
                  parseInt(this.game.lastFaceBid)
              ) {
                this.actor.howManySelected = false;

                this.actor.getMeetings().forEach((meeting) => {
                  if (meeting.name == "Amount") {
                    meeting.unvote(this.actor, true, true);
                  }
                });
                return;
              }

              this.game.lastBidder = this.actor;
              this.game.lastAmountBid = this.actor.role.data.amount;
              this.game.lastFaceBid = this.target.substring(
                this.target.length - 1
              );
              this.item.sendBidAlert(this.actor);
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
