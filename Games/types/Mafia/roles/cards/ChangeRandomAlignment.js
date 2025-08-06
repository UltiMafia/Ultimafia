const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class ChangeRandomAlignment extends Card {
  constructor(role) {
    super(role);

    role.methods.changeAlignment = function () {
      let factions = [];
      let players = this.game
        .alivePlayers()
        .filter((p) => p.faction != this.player.faction);
      for (let x = 0; x < players.length; x++) {
        if (!factions.includes(players[x].faction)) {
          factions.push(players[x].faction);
        }
      }
      factions = Random.randomizeArray(factions);

      for (let x = 0; x < factions.length; x++) {
        if (
          factions[x] != this.player.faction &&
          factions[x] != "Independent"
        ) {
          this.player.faction = factions[x];
        }
        //this.player.queueAlert(`${factions[x]}`);
      }
      /*
      const alignment = {
        Independent: Random.randArrayVal(["Village", "Mafia", "Cult"]),
        Mafia: "Village",
        Cult: "Village",
        Village: ["Mafia" || "Cult"],
      };
      this.player.role.alignment = alignment[this.player.role.alignment];
      */
      this.player.queueAlert(
        `:anon: You believe that siding with the ${this.player.faction} will help your career!`
      );
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) return;
        this.methods.changeAlignment();
      },
      state: function (stateInfo) {
        if (
          this.hasAbility(["Alignment"]) &&
          stateInfo.name.match(/Day/) &&
          stateInfo.dayCount > 0
        ) {
          this.methods.changeAlignment();
        }
      },
    };
  }
};
