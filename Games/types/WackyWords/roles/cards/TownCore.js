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
        whileDead: true,
        passiveDead: true,
      },
    };
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Day/)) {
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
