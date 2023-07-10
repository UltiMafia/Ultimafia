const Card = require("../../Card");

module.exports = class TownCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Village: {
        states: ["Day"],
        flags: ["group", "speech"],
      },
      "Pick Favorite Acronym": {
        actionName: "Pick Favorite Acronym",
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
      },
    };
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Day/)) {
          return;
        }

        let eligibleVotes = [];
        for (let expandedAcronym in this.game.currentExpandedAcronyms) {
          let acronymObj = this.game.currentExpandedAcronyms[expandedAcronym];
          if (acronymObj.player != this.player) {
            eligibleVotes.push(expandedAcronym);
          }
        }

        this.meetings["Pick Favorite Acronym"].targets = eligibleVotes;
      },
    };
  }
};
