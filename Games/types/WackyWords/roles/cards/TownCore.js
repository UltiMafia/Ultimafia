const Card = require("../../Card");

module.exports = class TownCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Village: {
        states: ["*"],
        flags: ["group", "speech"],
        whileDead: true,
        speakDead: true,
      },
      "Pick Favorite Response": {
        actionName: "Pick Favorite Response",
        states: ["Day"],
        flags: ["voting", "noVeg"],
        inputType: "custom",
        targets: [],
        action: {
          priority: -3,
          run: function () {
            if (this.game.hasGambler) {
              //this.game.recordResponse(this.actor, this.target);
              this.game.Decisions[
                this.game.currentQuestion.indexOf(this.target)
              ]++;
              this.game.DecisionLog[
                this.game.currentQuestion.indexOf(this.target)
              ].push(this.actor.name);
              return;
            }
            if (
              !this.game.isRankedChoice ||
              this.game.hasGambler ||
              this.game.hasNeighbor
            ) {
              this.game.recordVote(this.actor, this.target);
            } else {
              this.game.recordVote(this.actor, this.target, 3);
            }
          },
        },
        shouldMeet: function () {
          if (
            this.game.hasNeighbor &&
            this.player.name == this.game.realAnswerer
          ) {
            return false;
          }

          if (this.game.hasGambler && this.player == this.game.guesser) {
            return false;
          }

          return true;
        },
        whileDead: true,
        passiveDead: true,
      },
      "Pick 2nd Favorite Response": {
        actionName: "Pick 2nd Favorite Response",
        states: ["Day"],
        flags: ["voting", "noVeg"],
        inputType: "custom",
        targets: [],
        action: {
          priority: -2,
          run: function () {
            this.game.recordVote(this.actor, this.target, 2);
          },
        },
        shouldMeet: function () {
          if (this.game.hasNeighbor || this.game.hasGambler) {
            return false;
          }
          if (!this.game.isRankedChoice) {
            return false;
          }

          return true;
        },
        whileDead: true,
        passiveDead: true,
      },
      "Pick 3rd Favorite Response": {
        actionName: "Pick 3rd Favorite Response",
        states: ["Day"],
        flags: ["voting", "noVeg"],
        inputType: "custom",
        targets: [],
        action: {
          priority: -1,
          run: function () {
            this.game.recordVote(this.actor, this.target, 1);
          },
        },
        shouldMeet: function () {
          if (this.game.hasNeighbor || this.game.hasGambler) {
            return false;
          }
          if (!this.game.isRankedChoice) {
            return false;
          }

          return true;
        },
        whileDead: true,
        passiveDead: true,
      },
    };
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Day/)) {
          return;
        }

        if (this.game.hasGambler) {
          this.meetings["Pick Favorite Response"].targets =
            this.game.currentQuestion;
          return;
        }

        let eligibleVotes = [];

        for (let response in this.game.currentResponses) {
          let acronymObj = this.game.currentResponses[response];
          if (acronymObj.player != this.player) {
            eligibleVotes.push(response);
          }
        }

        this.meetings["Pick Favorite Response"].targets = eligibleVotes;
        this.meetings["Pick 2nd Favorite Response"].targets = eligibleVotes;
        this.meetings["Pick 3rd Favorite Response"].targets = eligibleVotes;
      },
    };
  }
};
