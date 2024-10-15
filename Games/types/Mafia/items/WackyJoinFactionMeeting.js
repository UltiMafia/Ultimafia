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
const { PRIORITY_MAFIA_KILL } = require("../const/Priority");

module.exports = class WackyJoinFactionMeeting extends Item {
  constructor(reveal) {
    super("WackyJoinFactionMeeting");

    //this.reveal = reveal;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.meetings = {
      "Faction Kill": {
        meetingName: "Mafia",
        states: ["Night"],
        flags: ["group", "speech", "voting", "multiActor", "Important"],
        targets: {
          include: ["alive"],
          exclude: [excludeMafiaOnlyIfNotAnonymous],
        },
        action: {
          labels: ["kill", "mafia"],
          priority: PRIORITY_MAFIA_KILL,
          run: function () {
            if (this.dominates()) {
              this.target.kill("basic", this.actor);
            }
          },
        },
      },
    };
  }
};

function excludeMafiaOnlyIfNotAnonymous(player) {
  let mafiaMeeting = player.game.getMeetingByName("Faction Kill");
  if (
    mafiaMeeting &&
    mafiaMeeting.anonymous &&
    FACTION_KILL.includes(player.faction)
  ) {
    return false;
  }

  if (player.faction && FACTION_KILL.includes(player.faction)) {
    return true;
  }
}
