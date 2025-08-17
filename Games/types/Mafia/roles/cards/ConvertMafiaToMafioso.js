const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const { CULT_FACTIONS, MAFIA_FACTIONS } = require("../../const/FactionList");

module.exports = class ConvertMafiaToMafioso extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Strip Power from": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["convert"],
          priority: PRIORITY_CONVERT_DEFAULT + 8,
          run: function () {
            if (
              !MAFIA_FACTIONS.includes(this.target.faction) &&
              !CULT_FACTIONS.includes(this.target.faction)
            ) {
              return;
            }

            if (this.dominates()) {
              if (MAFIA_FACTIONS.includes(this.target.faction)) {
                this.target.setRole(
                  "Mafioso",
                  undefined,
                  false,
                  false,
                  false,
                  "No Change"
                );
              } else {
                this.target.setRole(
                  "Cultist",
                  undefined,
                  false,
                  false,
                  false,
                  "No Change"
                );
              }
              this.actor.queueAlert(
                `You have converted ${this.target.name} into a Vanilla Role!`
              );
            }
          },
        },
      },
    };
  }
};
