const Card = require("../../Card");
const {
  EVIL_FACTIONS,
  NOT_EVIL_FACTIONS,
  CULT_FACTIONS,
  MAFIA_FACTIONS,
  FACTION_LEARN_TEAM,
  FACTION_WIN_WITH_MAJORITY,
  FACTION_WITH_MEETING,
  FACTION_KILL,
} = require("../../const/FactionList");

module.exports = class MeetingFaction extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Faction: {
        meetingName: this.player.faction;
        actionName: "End Meeting?",
        states: ["Night"],
        flags: ["group", "speech", "voting", "mustAct", "noVeg"],
        inputType: "boolean",
        shouldMeet: function (meetingName) {
          //let lunatics = this.game.players.filter((p) => p.hasItem("IsTheLunatic"));
          return !this.player.hasItem("IsTheTelevangelist") && (FACTION_WITH_MEETING.includes(this.player.faction) && !FACTION_KILL.includes(this.player.faction));
        },
      },
      "Faction Fake": {
        meetingName: this.player.factionFake;
        actionName: "End Meeting?",
        states: ["Night"],
        flags: ["group", "speech", "voting", "mustAct", "noVeg"],
        inputType: "boolean",
        shouldMeet: function (meetingName) {
          let lunatics = this.game.players.filter((p) =>
            p.hasItem("IsTheTelevangelist")
          );
          return (
            lunatics.length > 0 &&
            (this.player.hasItem("IsTheTelevangelist") ||
              (!this.game
                .getRoleTags(this.player.role.name)
                .join("")
                .includes("Endangered") &&
                !this.game
                  .getRoleTags(this.player.role.name)
                  .join("")
                  .includes("Kills Cultist")))
          );
        },
      },
      "Faction Kill": {
        meetingName: this.player.faction;
        actionName: "Mafia Kill",
        states: ["Night"],
        flags: ["group", "speech", "voting", "multiActor"],
        targets: {
          include: ["alive"],
          exclude: [excludeMafiaOnlyIfNotAnonymous],
        },
        shouldMeet: function (meetingName) {
          //let lunatics = this.game.players.filter((p) => p.hasItem("IsTheLunatic"));
          return (FACTION_WITH_MEETING.includes(this.player.faction) && FACTION_KILL.includes(this.player.faction));
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
  let mafiaMeeting = player.game.getMeetingByName(player.faction);
  if (mafiaMeeting.anonymous) {
    return false;
  }

  if (player.faction) {
    return true;
  }
}
