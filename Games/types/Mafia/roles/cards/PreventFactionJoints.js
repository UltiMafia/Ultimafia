const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const { CULT_FACTIONS, MAFIA_FACTIONS } = require("../../const/FactionList");

module.exports = class PreventFactionJoints extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      handleWinBlockers: function (winners) {
        if (this.player.role.alignment != "Independent") {
          return;
        }

        for (let group in winners.groups) {
          for (let player of winners.groups[group]) {
            if (player == this.player) {
              for (let x = 0; x < MAFIA_FACTIONS.length; x++) {
                if (winners.groups[MAFIA_FACTIONS[x]]) {
                  winners.removeGroup(MAFIA_FACTIONS[x]);
                }
              }
              for (let x = 0; x < CULT_FACTIONS.length; x++) {
                if (winners.groups[CULT_FACTIONS[x]]) {
                  winners.removeGroup(CULT_FACTIONS[x]);
                }
              }

              if (winners.groups["Village"]) {
                winners.removeGroup("Village");
              }
            }
          }
        }
      },
    };
  }
};
