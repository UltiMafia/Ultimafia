const Item = require("../Item");

module.exports = class LegislativePower extends Item {
  constructor() {
    super("Legislative Power");

    this.meetings = {
      "Pass On Policy": {
        states: ["Legislative Session"],
        flags: ["voting", "exclusive", "instant"],
        priority: 1,
        inputType: "custom",
        targets: this.game.policyList,
        shouldMeet: function (player) {
          if (player.name == this.game.electedPresident.name) {
            return true;
          } else {
            return false;
          }
        },
        action: {
          labels: ["hidden"],
          run: function () {
            this.game.discardPolicy(drawPile.indexOf(this.target));
            if (this.game.vetoUnlocked == false) {
              this.item.drop();
            }
          },
        },
      },
      "Enact Policy": {
        states: ["Legislative Session"],
        flags: ["voting", "exclusive", "instant"],
        priority: 1,
        inputType: "custom",
        targets: this.game.policyList,
        shouldMeet: function (player) {
          if (player.name == this.game.electedChancellor.name) {
            return true;
          } else {
            return false;
          }
        },
        action: {
          labels: ["hidden"],
          run: function () {
            this.game.enactPolicy(drawPile.indexOf(this.target));
            if (this.game.vetoUnlocked == false) {
              this.item.drop();
            }
          },
        },
        "Initiate Veto": {
          states: ["Legislative Session"],
          flags: ["voting", "exclusive", "instant"],
          priority: 2,
          inputType: "boolean",
          shouldMeet: function (player) {
            if (player.name == this.game.electedChancellor.name && this.game.vetoUnlocked == true) {
              return true;
            } else {
              return false;
            }
          },
          action: {
            labels: ["hidden"],
            run: function () {
              if (this.target == "Yes") {
                this.game.vetoInitiated = true;
              } else {
                this.game.vetoInitiated = false;
              }
              this.item.drop();
            },
          },
        },
        "Assent Veto": {
          states: ["Legislative Session"],
          flags: ["voting", "exclusive", "instant"],
          priority: 1,
          inputType: "boolean",
          shouldMeet: function (player) {
            if (player.name == this.game.electedPresident.name && this.game.vetoInitiated == true) {
              return true;
            } else {
              return false;
            }
          },
          action: {
            labels: ["hidden"],
            run: function () {
              if (this.target == "Yes") {
                for (policy in this.game.policyList) {
                  this.game.discardPolicy(drawPile.indexOf(policy));
                }
                this.game.electionTracker = this.game.electionTracker + 1;
              }
              this.item.drop();
              this.game.vetoInitiated = false;
            },
          },
        },
      },
    };
  }
};
