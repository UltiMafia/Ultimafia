const Card = require("../../Card");
const {
  IMPORTANT_MEETINGS,
  ROLE_MEETINGS,
} = require("../../const/ImportantMeetings");

module.exports = class PlayRatscrew extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Play Card": {
        actionName: "Play Card",
        states: ["Play Cards"],
        flags: ["voting", "mustAct"],
        inputType: "boolean",
        action: {
          item: this,
          run: function () {
            let card = this.actor.CardsInHand[0];
            let readCard = this.game.readCard(this.actor.CardsInHand[0]);
            this.game.TheStack.push(card);
            this.actor.CardsInHand.splice(0, 1);
            this.game.sendAlert(`${this.actor.name} plays ${card}!`);
            if (readCard[0] == 1 || readCard[0] > 10) {
              this.game.FacePlayer = this.actor;
              this.game.FaceCardPlayed = true;
              this.game.FaceCardBlock = false;
              if (readCard[0] == 1) {
                this.game.FaceCardNumber = 4;
              } else if (readCard[0] == 13) {
                this.game.FaceCardNumber = 3;
              } else if (readCard[0] == 12) {
                this.game.FaceCardNumber = 2;
              } else {
                this.game.FaceCardNumber = 1;
              }
            } else if (this.game.FaceCardPlayed == true) {
              this.game.FaceCardNumber -= 1;
              if (this.game.FaceCardNumber == 0) {
                this.game.FacePlayer.CardsInHand.push(...this.game.TheStack);
                this.game.sendAlert(
                  `${this.game.FacePlayer.name} gains the stack!`
                );
                this.game.TheStack = [];
                this.game.FacePlayer = null;
                this.game.FaceCardNumber = 9;
                this.game.FaceCardPlayed = false;
                this.game.FaceCardBlock = false;
              }
            }
          },
        },
        shouldMeet: function () {
          return (
            this.player.name ==
            this.game.randomizedPlayersCopy[this.game.currentIndex].name
          );
        },
      },
      Slap: {
        actionName: "Slap",
        states: ["Call Lie"],
        flags: ["voting", "instant", "noVeg"],
        inputType: "custom",
        targets: ["Slap", "Don't Slap"],
        action: {
          run: function () {
            if (this.target == "Don't Slap") {
              return;
            }
            this.game.sendAlert(`${this.actor.name} Slaps!`);
            this.actor.hasSlapped = true;
            if (this.game.TheStack.length <= 1) {
              this.actor.hasLied = true;
            } else if (
              this.game.readCard(
                this.game.TheStack[this.game.TheStack.length - 1]
              )[0] !=
              this.game.readCard(
                this.game.TheStack[this.game.TheStack.length - 2]
              )[0]
            ) {
              this.actor.hasLied = true;
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
      },
      "Call Lie": {
        actionName: "Call Lie",
        states: ["Call Lie"],
        flags: ["voting", "instant", "noVeg"],
        inputType: "custom",
        targets: ["Challenge Slap", "Don't Challenge Slap"],
        action: {
          run: function () {
            if (this.target == "Don't Challenge Slap") {
              return;
            }

            let slappers = this.game.players.filter(
              (p) => p.hasSlapped == true
            );

            this.game.sendAlert(
              `${this.actor.name} challenges ${slappers[0].name} slap!`
            );
            if (
              slappers[0].hasLied == true &&
              slappers[0].CardsInHand.length > 0
            ) {
              this.game.sendAlert(
                `${this.actor.name} was correct! ${slappers[0].name} must give ${this.actor.name} a card!`
              );
              this.actor.CardsInHand.push(slappers[0].CardsInHand[0]);
              slappers[0].CardsInHand.splice(0, 1);
            } else if (slappers[0].CardsInHand.length <= 0) {
              this.game.sendAlert(
                `${this.actor.name} was Correct! ${slappers[0].name} dies for having no cards!`
              );
              this.actor.kill("Basic", this.actor, true);
            } else if (this.actor.CardsInHand.length <= 0) {
              this.game.sendAlert(
                `${this.actor.name} was incorrect! They die for having no cards!`
              );
              this.actor.kill("Basic", slappers[0], true);
            } else {
              this.game.sendAlert(
                `${this.actor.name} was incorrect! They must give ${slappers[0].name} a card!`
              );
              slappers[0].CardsInHand.push(this.actor.CardsInHand[0]);
              this.actor.CardsInHand.splice(0, 1);
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
          let slappers = this.game.players.filter((p) => p.hasSlapped == true);
          return this.player.hasSlapped != true && slappers.length > 0;
        },
      },
    };
  }
};
