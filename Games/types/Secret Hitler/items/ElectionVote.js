const Item = require("../Item");

module.exports = class ElectionVote extends Item {
  constructor(options) {
    super("Election Vote");

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
              if (this.target == "Ja!") {
                this.game.queueAlert(`${this.presidentNominee.name} and ${this.chancellorNominee.name} has been elected as the Government.`);
                if (this.chancellorNominee.role == "Hitler" && this.game.facistPolicies > 3) {
                  this.game.hitlerChancellor = true;
                }
              }
            },
          },
        },
      };
  }

  hold(player) {
    super.hold(player);
    player.game.queueAlert(`${player.name} is nominsting a candidate for Chancellorship…`);
  }
};
