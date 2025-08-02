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
const { PRIORITY_VILLAGE } = require("../const/Priority");

module.exports = class ExtraCondemn extends Item {
  constructor(meetingName) {
    super("ExtraCondemn");

    //this.reveal = reveal;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.meetings[meetingName] = {
      actionName: "Vote to Condemn",
      states: ["Day"],
      targets: { include: [canBeVoted], exclude: [cannotBeVoted] },
      flags: ["group", "voting", "useVotingPower", "Important"],
      whileDead: true,
      passiveDead: true,
      item: this,
      action: {
        labels: ["kill", "condemn", "hidden"],
        priority: PRIORITY_VILLAGE,
        power: 3,
        run: function () {
          if (this.dominates()) {
            if (!this.target.alive) {
              this.game.exorcisePlayer(this.target);
            }
            this.target.kill("condemn", this.actor);
          }
        },
      },
    };
  }
};

function cannotBeVoted(player) {
  return player.hasEffect("CannotBeVoted");
}
function canBeVoted(player) {
  return (
    player.alive ||
    (!player.alive && !player.exorcised && player.game.ExorciseVillageMeeting)
  );
}
