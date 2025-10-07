const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");
const { PRIORITY_PREKILL_ACTION } = require("../../const/Priority");

module.exports = class ChangeRandomAlignment extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Win-Con"])) {
          return;
        }
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_PREKILL_ACTION,
          labels: ["hidden"],
          run: function () {
            let factions = [];
            let players = this.game.alivePlayers().filter((p) => p.faction != this.actor.faction);
            for (let x = 0; x < players.length; x++) {
              if (!factions.includes(players[x].faction)) {
                factions.push(players[x].faction);
              }
            }
            factions = Random.randomizeArray(factions);

            for (let x = 0; x < factions.length; x++) {
              if (
                factions[x] != this.actor.faction &&
                factions[x] != "Independent"
              ) {
                this.actor.faction = factions[x];
              }
            }
            this.actor.queueAlert(
              `:anon: You believe that siding with the ${this.actor.faction} will help your career!`
            );
          },
        });
        this.game.queueAction(action);
      },
    };
  }
};
