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

module.exports = class FakeCultMeeting extends Item {
  constructor(meetingName, actionName) {
    super("FakeCultMeeting");

    this.cannotBeSnooped = true;

    let flagsMeeting = ["group", "speech","noVeg"];
    let flagsAction = ["group", "voting", "mustAct", "noVeg", "Important"];

    for (let p of this.game.alivePlayers()){
      if(p.role.makeAnonymousFaction){
        flagsMeeting.push("anonymous");
        flagsAction.push("anonymous");
      }
    }

    //this.reveal = reveal;
    this.lifespan = 1;
    this.cannotBeStolen = true;
      this.meetings[meetingName] = {
      meetingName: "Cult Meeting",
      states: ["Night"],
      flags: ["group", "speech","noVeg"],
      shouldMeet: function (meetingName) {
        //let lunatics = this.game.players.filter((p) => p.hasItem("IsTheLunatic"));
         if((this.game.isSilentCult() && CULT_FACTIONS.includes(this.holder.faction)) )){
          return false;
        }
        
        let meetingPlayers = this.game.players.filter((p) =>
          FACTION_WITH_MEETING.includes(p.faction) && ((this.game.isSilentCult() && CULT_FACTIONS.includes(p.faction)) || 
          (this.game.isSilentMafia() && MAFIA_FACTIONS.includes(p.faction)))
        );

        if (
          this.game
            .getRoleTags(this.holder.role.name)
            .join("")
            .includes("Faction Meeting Interaction") &&
          meetingPlayers.length > 0
        ) {
          return true;
        }

        return (
          FACTION_WITH_MEETING.includes(this.holder.faction)
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
            && ((this.game.isSilentCult() && CULT_FACTIONS.includes(p.faction)))
        );

        if (
          this.game
            .getRoleTags(this.holder.role.name)
            .join("")
            .includes("Faction Meeting Interaction") &&
          meetingPlayers.length > 0
        ) {
          return true;
        }

        return (
          FACTION_WITH_MEETING.includes(this.holder.faction) &&
          !FACTION_KILL.includes(this.holder.faction)
        );
      },
    };

    
  }
};
