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
  constructor(meetingName, actionName, game) {
    super("FakeCultMeeting");

    this.cannotBeSnooped = true;

    let flagsMeeting = ["group", "speech","noVeg"];
    let flagsAction = ["group", "voting", "mustAct", "noVeg", "Important"];

    for (let p of game.alivePlayers()){
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
            if (this.game.isSilentCult()) {
              return false;
            }
            if (
              (this.game.isSilentCult() &&
                CULT_FACTIONS.includes(meetingName.split(" Meeting")[0])) ||
              (this.game.isSilentMafia() &&
                MAFIA_FACTIONS.includes(meetingName.split(" Meeting")[0]))
            ) {
              return false;
            }

            let meetingPlayers = this.game.players.filter(
              (p) =>
                "Cult" == p.faction || p.hasEffect("TelevangelistEffect")
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

            return "Cult" == this.player.faction || this.player.hasEffect("TelevangelistEffect");
          },
    };

    this.meetings[actionName] = {
      actionName: "End Meeting?",
      states: ["Night"],
      flags: ["group", "voting", "mustAct", "noVeg", "Important"],
      inputType: "boolean",
      shouldMeet: function (meetingName) {
                  //let lunatics = this.game.players.filter((p) => p.hasItem("IsTheLunatic"));
              if (this.game.isSilentCult()) {
              return false;
            }
                  let meetingPlayers = this.game.players.filter(
                    (p) =>
                      "Cult" == p.faction || p.hasEffect("TelevangelistEffect")
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
                    "Cult" == this.player.faction || this.player.hasEffect("TelevangelistEffect")
                  );
      },
    };

    
  }
};
