const Card = require("../../Card");
const { PRIORITY_MAFIA_KILL } = require("../../const/Priority");
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

    let meetingName = this.player.faction;
    let meetingNameKill = `${this.role.player.faction} Kill`;

    this.meetings[meetingName] = {
      actionName: "End Meeting?",
      states: ["Night"],
      flags: ["group", "speech", "voting", "mustAct", "noVeg", "Important"],
      inputType: "boolean",
      shouldMeet: function (meetingName) {
        //let lunatics = this.game.players.filter((p) => p.hasItem("IsTheLunatic"));
        let meetingPlayers = this.game.players.filter((p) =>
          FACTION_WITH_MEETING.includes(p.faction)
        );

        if (
          this.game
            .getRoleTags(this.player.role.name)
            .join("")
            .includes("AnonymizeMeeting") &&
          meetingPlayers.length > 0
        ) {
          return true;
        }

        return (
          !this.player.hasItem("IsTheTelevangelist") &&
          FACTION_WITH_MEETING.includes(this.player.faction) &&
          !FACTION_KILL.includes(this.player.faction)
        );
      },
    };

    this.meetings[meetingNameKill] = {
      actionName: `${this.role.player.faction} Kill`,
      states: ["Night"],
      flags: ["group", "speech", "voting", "multiActor", "Important"],
      targets: {
        include: ["alive"],
        exclude: [excludeMafiaOnlyIfNotAnonymous],
      },
      shouldMeet: function (meetingName) {
        //let lunatics = this.game.players.filter((p) => p.hasItem("IsTheLunatic"));

        let meetingPlayers = this.game.players.filter((p) =>
          FACTION_KILL.includes(p.faction)
        );
        if (
          this.game
            .getRoleTags(this.player.role.name)
            .join("")
            .includes("AnonymizeMeeting") &&
          meetingPlayers.length > 0
        ) {
          return true;
        }

        return (
          FACTION_WITH_MEETING.includes(this.player.faction) &&
          FACTION_KILL.includes(this.player.faction)
        );
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
    };

    this.meetings = {
      /*
      Faction: {
        actionName: "End Meeting?",
        states: ["Night"],
        flags: ["group", "speech", "voting", "mustAct", "noVeg", "Important"],
        inputType: "boolean",
        shouldMeet: function (meetingName) {
          //let lunatics = this.game.players.filter((p) => p.hasItem("IsTheLunatic"));
          let meetingPlayers = this.game.players.filter((p) =>
            FACTION_WITH_MEETING.includes(p.faction)
          );

          if (
            this.game
              .getRoleTags(this.player.role.name)
              .join("")
              .includes("AnonymizeMeeting") &&
            meetingPlayers.length > 0
          ) {
            return true;
          }

          return (
            !this.player.hasItem("IsTheTelevangelist") &&
            FACTION_WITH_MEETING.includes(this.player.faction) &&
            !FACTION_KILL.includes(this.player.faction)
          );
        },
      },
      */
      "Faction Fake": {
        actionName: "End Meeting?",
        states: ["Night"],
        flags: ["group", "speech", "voting", "mustAct", "noVeg", "Important"],
        inputType: "boolean",
        shouldMeet: function (meetingName) {
          let lunatics = this.game.players.filter((p) =>
            p.hasItem("IsTheTelevangelist")
          );

          let meetingPlayers = this.game.players.filter((p) =>
            FACTION_WITH_MEETING.includes(p.faction)
          );
          if (
            this.game
              .getRoleTags(this.player.role.name)
              .join("")
              .includes("AnonymizeMeeting") &&
            meetingPlayers.length > 0 &&
            lunatics.length > 0
          ) {
            return true;
          }

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
                  .includes("Kills Cultist") &&
                FACTION_WITH_MEETING.includes(this.player.faction)))
          );
        },
      },
      /*
      "Faction Kill": {
        actionName: "Mafia Kill",
        states: ["Night"],
        flags: ["group", "speech", "voting", "multiActor", "Important"],
        targets: {
          include: ["alive"],
          exclude: [excludeMafiaOnlyIfNotAnonymous],
        },
        shouldMeet: function (meetingName) {
          //let lunatics = this.game.players.filter((p) => p.hasItem("IsTheLunatic"));

          let meetingPlayers = this.game.players.filter((p) =>
            FACTION_KILL.includes(p.faction)
          );
          if (
            this.game
              .getRoleTags(this.player.role.name)
              .join("")
              .includes("AnonymizeMeeting") &&
            meetingPlayers.length > 0
          ) {
            return true;
          }

          return (
            FACTION_WITH_MEETING.includes(this.player.faction) &&
            FACTION_KILL.includes(this.player.faction)
          );
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
      */
    };
    this.meetingMods = {
      "Faction Fake": {
        meetingName: `${this.role.player.factionFake}`,
      },
      Faction: {
        meetingName: `${this.role.player.faction}`,
      },
      "Faction Kill": {
        meetingName: `${this.role.player.faction}`,
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
