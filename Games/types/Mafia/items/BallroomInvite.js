const Item = require("../Item");
const Random = require("../../../../lib/Random");

module.exports = class BallroomInvite extends Item {
  constructor(options) {
    super("Ballroom Invite");

    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      "Propose Ballroom Pairing": {
        actionName: "Propose Pairing",
        states: ["Reception"],
        flags: ["voting", "instant"],
        item: this,
        action: {
          labels: ["hidden", "absolute"],
          item: this,
          run: function () {
            this.game.queueAlert(`Someone proposes to ${this.target.name}.`);
            let proposal = this.target.holdItem("Ballroom Proposal", {proposer: this.actor});
            this.game.instantMeeting(proposal.meetings, [this.target]);
            if (!this.holder.hasEffect("Ballroom Unpaired")) {
              this.item.drop();
            }
          },
        },
      },
    };
    this.listeners = {
      extraStateCheck: function (stateName) {
        if (this.game.ExtraStates == null) {
          this.game.ExtraStates = [];
        }
        if (
          stateName == "Reception" &&
          !this.game.ExtraStates.includes("Reception")
        ) {
          this.game.ExtraStates.push("Reception");
        }
      },
      state: function (stateInfo) {
        if (stateInfo.name.match(/Reception/)) {
          this.game.HaveReceptionState = false;
          if (this.game.isDayStart()) {
            this.game.HaveReceptionStateBlock = "Day";
          } else {
            this.game.HaveReceptionStateBlock = "Night";
          }
        }
        if (
          stateInfo.name.match(/Night/) &&
          this.game.HaveReceptionStateBlock == "Night"
        ) {
          this.game.HaveReceptionStateBlock = null;
        }
        if (
          stateInfo.name.match(/Day/) &&
          this.game.HaveReceptionStateBlock == "Day"
        ) {
          this.game.HaveReceptionStateBlock = null;
        }
      },
    };
    this.stateMods = {
      Day: {
        type: "shouldSkip",
        shouldSkip: function () {
          return this.game.shouldSkipState("Day");
        },
      },
      Night: {
        type: "shouldSkip",
        shouldSkip: function () {
          return this.game.shouldSkipState("Night");
        },
      },
    };
  }
};