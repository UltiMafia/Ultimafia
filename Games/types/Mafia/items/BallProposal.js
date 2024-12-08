const Item = require("../Item");
const {
  EVIL_FACTIONS,
  NOT_EVIL_FACTIONS,
  CULT_FACTIONS,
  MAFIA_FACTIONS,
  FACTION_LEARN_TEAM,
  FACTION_WIN_WITH_MAJORITY,
  FACTION_WITH_MEETING,
  FACTION_KILL,
} = require("../const/FactionList");

module.exports = class BallProposal extends Item {
  constructor() {
    super("Ball Proposal");

    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      "Dance Pair Proposal": {
        actionName: "Form Pair With",
        states: ["Day"],
        flags: ["voting", "instant"],
        shouldMeet: function () {
          return !this.holder.role.pairFormed;
        },
        action: {
          labels: ["marriage"],
          run: function () {
            this.game.queueAlert(`${this.holder.name} proposes to form a pair with ${this.target.name}.`);

            let invite = this.target.holdItem("BallInvite", { proposer: this.actor, proposal: this.item });
            this.game.instantMeeting(invite.meetings, [this.target]);
          },
        },
      },
    };
  }

  hold(player) {
    super.hold(player);
    this.game.queueAlert(`${player.name} is proposing to form a pair with someone…`);
  }

  shouldDisableMeeting(name) {
    // do not disable jailing, gov actions
    for (let x = 0; x < FACTION_WITH_MEETING.length; x++) {
      if (name == `Fake ${FACTION_WITH_MEETING[x]}`) {
        return true;
      }
      if (name == `${FACTION_WITH_MEETING[x]} Meeting`) {
        return true;
      }
      if (name == `${FACTION_WITH_MEETING[x]} Kill`) {
        return true;
      }
    }

    if (name == "Village") {
      return true;
    }

    if (name == "Magus Game") {
      return true;
    }

    return false;
  }
};
