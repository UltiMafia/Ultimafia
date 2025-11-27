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

    if (role.isExtraRole == true) {
      return;
    }

    let meetingName = `${role.player.faction} Meeting`;
    let meetingAction = `${role.player.faction} Action`;
    let meetingNameKill = `${role.player.faction} Kill`;
    if (role.player.factionFake == null) {
      role.player.factionFake = role.player.faction;
    }
    let meetingNameFake = `Fake ${role.player.factionFake}`;


    //All Factions
    if (
      role.game.getRoleTags(role.name).join("").includes("Faction Meeting Interaction")
    ) {
      //Chat
      for(let faction of FACTION_WITH_MEETING){
      this.meetings[`${faction} Meeting`] = {
      states: ["Night"],
      flags: ["group", "speech","noVeg"],
      shouldMeet: function (meetingName) {
        //let lunatics = this.game.players.filter((p) => p.hasItem("IsTheLunatic"));

        if((this.game.isSilentCult() && CULT_FACTIONS.includes(this.player.faction)) || 
          (this.game.isSilentMafia() && MAFIA_FACTIONS.includes(this.player.faction))){
          return false;
        }
        
        let meetingPlayers = this.game.players.filter((p) =>
          FACTION_WITH_MEETING.includes(p.faction) && ((this.game.isSilentCult() && CULT_FACTIONS.includes(this.player.faction)) || 
          (this.game.isSilentMafia() && MAFIA_FACTIONS.includes(this.player.faction)))
        );

        if (
          this.game
            .getRoleTags(this.player.role.name)
            .join("")
            .includes("Faction Meeting Interaction") &&
          meetingPlayers.length > 0
        ) {
          return true;
        }

        return (
          FACTION_WITH_MEETING.includes(this.player.faction)
        );
      },
    };
    //Action
    this.meetings[`${faction} Action`] = {
      actionName: "End Meeting?",
      states: ["Night"],
      flags: ["group", "voting", "mustAct", "noVeg", "Important"],
      inputType: "boolean",
      shouldMeet: function (meetingName) {
        //let lunatics = this.game.players.filter((p) => p.hasItem("IsTheLunatic"));
        let meetingPlayers = this.game.players.filter((p) =>
          FACTION_WITH_MEETING.includes(p.faction) && !FACTION_KILL.includes(this.player.faction)
            && ((this.game.isSilentCult() && CULT_FACTIONS.includes(p.faction)) || 
          (this.game.isSilentMafia() && MAFIA_FACTIONS.includes(p.faction)))
        );

        if (
          this.game
            .getRoleTags(this.player.role.name)
            .join("")
            .includes("Faction Meeting Interaction") &&
          meetingPlayers.length > 0
        ) {
          return true;
        }

        return (
          FACTION_WITH_MEETING.includes(this.player.faction) &&
          !FACTION_KILL.includes(this.player.faction)
        );
      },
    };  
      }//End Loop
for(let faction of FACTION_KILL){
    this.meetings[`${faction} Kill`] = {
      actionName: `${this.role.player.faction} Kill`,
      states: ["Night"],
      flags: ["group", "voting", "multiActor", "Important"],
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
            .includes("Faction Meeting Interaction") &&
          meetingPlayers.length > 0
        ) {
          return true;
        }

        return (
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
}//End Loop
      
      
    }


  //Chat Meeting
      this.meetings[meetingName] = {
      states: ["Night"],
      flags: ["group", "speech","noVeg"],
      shouldMeet: function (meetingName) {
        //let lunatics = this.game.players.filter((p) => p.hasItem("IsTheLunatic"));
         if((this.game.isSilentCult() && CULT_FACTIONS.includes(this.player.faction)) || 
          (this.game.isSilentMafia() && MAFIA_FACTIONS.includes(this.player.faction))){
          return false;
        }
        
        let meetingPlayers = this.game.players.filter((p) =>
          FACTION_WITH_MEETING.includes(p.faction) && ((this.game.isSilentCult() && CULT_FACTIONS.includes(p.faction)) || 
          (this.game.isSilentMafia() && MAFIA_FACTIONS.includes(p.faction)))
        );

        if (
          this.game
            .getRoleTags(this.player.role.name)
            .join("")
            .includes("Faction Meeting Interaction") &&
          meetingPlayers.length > 0
        ) {
          return true;
        }

        return (
          FACTION_WITH_MEETING.includes(this.player.faction)
        );
      },
    };

    //Action Meeting
      this.meetings[meetingAction] = {
      actionName: "End Meeting?",
      states: ["Night"],
      flags: ["group", "voting", "mustAct", "noVeg", "Important"],
      inputType: "boolean",
      shouldMeet: function (meetingName) {
        //let lunatics = this.game.players.filter((p) => p.hasItem("IsTheLunatic"));
        let meetingPlayers = this.game.players.filter((p) =>
          FACTION_WITH_MEETING.includes(p.faction) && !FACTION_KILL.includes(this.player.faction)
            && ((this.game.isSilentCult() && CULT_FACTIONS.includes(p.faction)) || 
          (this.game.isSilentMafia() && MAFIA_FACTIONS.includes(p.faction)))
        );

        if (
          this.game
            .getRoleTags(this.player.role.name)
            .join("")
            .includes("Faction Meeting Interaction") &&
          meetingPlayers.length > 0
        ) {
          return true;
        }

        return (
          FACTION_WITH_MEETING.includes(this.player.faction) &&
          !FACTION_KILL.includes(this.player.faction)
        );
      },
    };


    //Kill Action
      this.meetings[meetingNameKill] = {
      actionName: `${this.role.player.faction} Kill`,
      states: ["Night"],
      flags: ["group", "voting", "multiActor", "Important"],
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
            .includes("Faction Meeting Interaction") &&
          meetingPlayers.length > 0
        ) {
          return true;
        }

        return (
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


    
    

    

    
/*
    if (
      role.game.getRoleTags(role.name).join("").includes("AnonymizeMeeting")
    ) {
      for (let faction of FACTION_WITH_MEETING) {
        if (!FACTION_KILL.includes(faction)) {
          this.meetings[`${faction} Meeting`] = {
            actionName: "End Meeting?",
            states: ["Night"],
            flags: [
              "group",
              "speech",
              "voting",
              "mustAct",
              "noVeg",
              "Important",
            ],
            inputType: "boolean",
            shouldMeet: function (meetingName) {
              //let lunatics = this.game.players.filter((p) => p.hasItem("IsTheLunatic"));
              let meetingPlayers = this.game.players.filter(
                (p) =>
                  meetingName.split(" Meeting")[0].includes(p.faction) &&
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
          this.meetings[`Fake ${faction}`] = {
            meetingName: `${this.role.player.factionFake} Meeting`,
            actionName: "End Meeting?",
            states: ["Night"],
            flags: [
              "group",
              "speech",
              "voting",
              "mustAct",
              "noVeg",
              "Important",
            ],
            inputType: "boolean",
            shouldMeet: function (meetingName) {
              let lunatics = this.game.players.filter((p) =>
                p.hasItem("IsTheTelevangelist")
              );

              let meetingPlayers = this.game.players.filter(
                (p) =>
                  FACTION_WITH_MEETING.includes(p.faction) &&
                  meetingName.includes(p.faction)
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
                    !this.game
                      .getRoleTags(
                        `${this.player.role.name}:${this.player.role.modifier}`
                      )
                      .join("")
                      .includes("Demonic") &&
                    FACTION_WITH_MEETING.includes(this.player.faction)))
              );
            },
          };
        } else {
          this.meetings[`${faction} Kill`] = {
            actionName: `${this.role.player.faction} Kill`,
            states: ["Night"],
            flags: ["group", "speech", "voting", "multiActor", "Important"],
            targets: {
              include: ["alive"],
              exclude: [excludeMafiaOnlyIfNotAnonymous],
            },
            shouldMeet: function (meetingName) {
              //let lunatics = this.game.players.filter((p) => p.hasItem("IsTheLunatic"));

              let meetingPlayers = this.game.players.filter(
                (p) =>
                  meetingName.split(" Kill")[0] == p.faction &&
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
        }
      }
      return;
    }

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

    this.meetings[meetingAction] = {
      actionName: "End Meeting?",
      states: ["Night"],
      flags: ["group", "voting", "mustAct", "noVeg", "Important"],
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

    this.meetings[meetingNameFake] = {
      meetingName: `${this.role.player.factionFake} Meeting`,
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
              !this.game
                .getRoleTags(
                  `${this.player.role.name}:${this.player.role.modifier}`
                )
                .join("")
                .includes("Demonic") &&
              FACTION_WITH_MEETING.includes(this.player.faction)))
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
      
    };
    */
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

  for (let person of player.game.alivePlayers()) {
    if (
      player.game.getRoleTags(person.role.name).includes("Faction Meeting Interaction")
    ) {
      return false;
    }
  }
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
