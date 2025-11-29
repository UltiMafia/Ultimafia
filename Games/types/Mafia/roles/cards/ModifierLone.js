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
//const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");

module.exports = class ModifierLone extends Card {
  constructor(role) {
    super(role);

    // this.meetings = {
    //   "Become Mafioso": {
    //     states: ["Night"],
    //     flags: ["voting"],
    //     inputType: "boolean",
    //     action: {
    //       labels: ["convert"],
    //       priority: PRIORITY_CONVERT_DEFAULT,
    //       run: function () {
    //         if (this.target === "No") return;
    //         this.actor.setRole("Mafioso");
    //         this.actor.queueAlert(
    //           "You forgo your mission and return to the jazz lounge…"
    //         );
    //       },
    //     },
    //     shouldMeet: function () {
    //       return this.alignment == "Mafia";
    //     },
    //   },
    // };

    // this.meetings = {
    //   "Become Cultist": {
    //     states: ["Night"],
    //     flags: ["voting"],
    //     inputType: "boolean",
    //     action: {
    //       labels: ["convert"],
    //       priority: PRIORITY_CONVERT_DEFAULT,
    //       run: function () {
    //         if (this.target === "No") return;
    //         this.actor.setRole("Cultist");
    //         this.actor.queueAlert(
    //           "You forgo your mission and become a regular cultist…"
    //         );
    //       },
    //     },
    //     shouldMeet: function () {
    //       return this.alignment == "Cult";
    //     },
    //   },
    // };

    for (let faction of FACTION_WITH_MEETING) {
      this.meetingMods[`${faction} Meeting`] = {
        disabled: true,
      };
      this.meetingMods[`${faction} Action`] = {
        disabled: true,
      };
      this.meetingMods[`Fake ${faction}`] = {
        disabled: true,
      };
      this.meetingMods[`${faction} Kill`] = {
        disabled: true,
      };
    }
    for (let player of this.game.players) {
      this.meetingMods[`Fake Cult Meeting with ${player.name}`] = {
        disabled: true,
      };
      this.meetingMods[`Fake Cult Action with ${player.name}`] = {
        disabled: true,
      };
    }
    this.meetingMods["Templar Meeting"] = {
      disabled: true,
    };
    this.meetingMods["Superhero"] = {
      disabled: true,
    };
    /*
    this.meetingMods = {
      Mafia: {
        disabled: true,
      },
      Cult: {
        disabled: true,
      },
      "Templar Meeting": {
        disabled: true,
      },
      Faction: {
        disabled: true,
      },
      "Faction Fake": {
        disabled: true,
      },
      "Faction Kill": {
        disabled: true,
      },
    };
    */
    this.oblivious = {
      self: true,
      Mafia: true,
      Cult: true,
      Faction: true,
    };
  }
};
