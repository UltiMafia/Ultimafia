const Item = require("../Item");

module.exports = class SpecialElectionVote extends Item {
  constructor(options) {
    super("Special Election Vote");

    this.chancellorNominee = options?.chancellorNominee;
    this.presidentNominee = options?.presidentNominee;

    this.meetings = {
      "Election Vote": {
        states: ["Election"],
        flags: ["group", "voting"],
        inputType: "custom",
        targets: ["Ja!", "Nein!"],
        action: {
          labels: ["hidden"],
          run: function () {
            this.game.specialElection = false;
            this.game.normalElection = true;
            if (this.target == "Ja!") {
              this.game.electedGovernment = true;
              this.game.queueAlert(
                `${this.presidentNominee.name} and ${this.chancellorNominee.name} has been elected as the Government.`
              );
              this.game.electedPresident = this.item.presidentNominee;
              this.game.electedChancellor = this.item.chancellorNominee;
              this.game.electedPresident.holdItem("Legislative Power");
              this.game.electedChancellor.holdItem("Legislative Power");
              if (
                this.game.electedChancellor.role == "Hitler" &&
                this.game.fascistPolicyEnacted > 3
              ) {
                this.game.hitlerChancellor = true;
              }
              this.item.drop();
            } else {
              this.game.electionTracker = this.game.electionTracker + 1;
            }
          },
        },
      },
    };
  }
};
