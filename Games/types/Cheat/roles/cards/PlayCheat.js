const Card = require("../../Card");
const {
  IMPORTANT_MEETINGS,
  ROLE_MEETINGS,
} = require("../../const/ImportantMeetings");

module.exports = class PlayCheat extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Play Card": {
        actionName: "Choose Cards",
        states: ["Play Cards"],
        flags: ["voting", "multi"],
        inputType: "playingCardButtons",
        multiMin: 1,
        multiMax: 4,
        targets: role.player.CardsInHand,
        action: {
          item: this,
          run: function () {
            this.game.sendAlert(
              `${this.actor.name} plays ${this.target.length} Cards!`
            );
            for (let card of this.target) {
              let readCard = this.game.readCard(card);
              if (readCard[0] != this.game.RankNumber) {
                this.actor.hasLied = true;
              }
              this.actor.CardsInHand.splice(
                this.actor.CardsInHand.indexOf(card),
                1
              );
            }
            this.game.TheStack.push(...this.target);
          },
        },
        shouldMeet: function () {
          return (
            this.player.name ==
            this.game.randomizedPlayersCopy[this.game.currentIndex].name
          );
        },
      },
      Submit: {
        actionName: "Submit",
        states: ["Play Cards"],
        flags: ["voting", "instant", "mustAct"],
        inputType: "boolean",
        action: {
          run: function () {},
        },
        shouldMeet: function () {
          return (
            this.player.name ==
            this.game.randomizedPlayersCopy[this.game.currentIndex].name
          );
        },
      },
      "Call Lie": {
        actionName: "Call Lie",
        states: ["Call Lie"],
        flags: ["voting", "instant", "noVeg"],
        inputType: "custom",
        targets: ["Call Lie", "Don't Call Lie"],
        action: {
          run: function () {
            if (this.target == "Don't Call Lie") {
              return;
            }
            this.game.sendAlert(
              `${this.actor.name} calls ${
                this.game.randomizedPlayersCopy[this.game.currentIndex].name
              } a Liar!`
            );
            if (
              this.game.randomizedPlayersCopy[this.game.currentIndex].hasLied ==
              true
            ) {
              this.game.randomizedPlayersCopy[
                this.game.currentIndex
              ].CardsInHand.push(...this.game.TheStack);
              this.game.TheStack = [];
              this.game.sendAlert(
                `${this.actor.name} was correct! ${
                  this.game.randomizedPlayersCopy[this.game.currentIndex].name
                } gains the Stack!`
              );
            } else {
              this.actor.CardsInHand.push(...this.game.TheStack);
              this.game.TheStack = [];
              this.game.sendAlert(
                `${this.actor.name} was incorrect! They gain the Stack!`
              );
            }

            for (let player of this.game.players) {
              player.getMeetings().forEach((meeting) => {
                if (IMPORTANT_MEETINGS.includes(meeting.name)) {
                  meeting.leave(player, true);
                } else if (ROLE_MEETINGS.includes(meeting.name)) {
                  meeting.leave(player, true);
                }
              });
            }
          },
        },
        shouldMeet: function () {
          return (
            this.player.name !=
            this.game.randomizedPlayersCopy[this.game.currentIndex].name
          );
        },
      },
    };
    /*
    this.listeners = {
      start: function () {
        if (!this.game.hasGovernor) return;
        if (!this.game.enablePunctuation) {
          this.meetings["Give Response"].textOptions.alphaOnlyWithSpaces = true;
        }
      },
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        if (this.game.hasGambler) {
          this.meetings["Make Your Decision"].targets =
            this.game.currentQuestion;
          return;
        }

        if (!this.game.hasGovernor) return;

        this.meetings["Give Response"].textOptions.enforceAcronym =
          this.game.currentQuestion;
      },
    };
    */
  }
};
