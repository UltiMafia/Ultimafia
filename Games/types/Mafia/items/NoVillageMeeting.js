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

// TODO this should semantically be an effect "SnowedIn" not item
module.exports = class NoVillageMeeting extends Item {
  constructor() {
    super("NoVillageMeeting");

    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.lifespan = 1;
    /*
    this.meetings = {
      NoVillageMeeting: {
        actionName: "Done Waiting?",
        states: ["Day"],
        //flags: ["group", "speech", "voting", "mustAct", "noVeg"],
        //inputType: "boolean",
        passiveDead: true,
        whileDead: true,
        speakDead: true,
      },
    };
*/
    /*
    this.listeners = {
      state: function () {
        const state = this.game.getStateName();
        if (state == "Day") {
          this.drop();
          return;
        }

        if (state != "Night") {
          return;
        }

        if (this.holder.role.alignment != "Cult") {
          this.holder.queueAlert(
            ":snowball: You're snowed in for the night… you cannot take any action!"
          );
        }
      },
    };
    */
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
      if (name == `${FACTION_WITH_MEETING[x]} Action`) {
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
