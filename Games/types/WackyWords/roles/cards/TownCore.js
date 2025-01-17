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
          priority: -1,
          run: function () {
            this.game.recordVote(this.actor, this.target);
          },
        },
        shouldMeet: function () {
          if (
            this.game.hasNeighbor &&
            this.player.name == this.game.realAnswerer
          ) {
            return false;
          }

          if (this.game.hasGambler && this.player.name != this.game.guessor) {
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
      },
    };
  }
};
