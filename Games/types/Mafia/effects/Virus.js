const Effect = require("../Effect");
const Action = require("../Action");
const { PRIORITY_KILL_DEFAULT } = require("../const/Priority");

module.exports = class Virus extends Effect {
  constructor() {
    super("Virus");
    this.isMalicious = true;

    this.InfectionTime = 0;

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          this.game.HasDonePlagueVirusAction = false;
          return;
        }
        if (this.game.HasDonePlagueVirusAction == true) {
          return;
        }
        this.game.HasDonePlagueVirusAction = true;
        var action = new Action({
          actor: null,
          game: this.player.game,
          priority: PRIORITY_KILL_DEFAULT,
          labels: ["kill", "hidden", "absolute"],
          run: function () {
            let infectedPlayers = this.game.players.filter((p) =>
              p.hasEffect("Virus")
            );

            for (let player of infectedPlayers) {
              for (let effect of player.effects) {
                if (effect.name == "Virus") {
                  effect.InfectionTime++;
                  if (effect.InfectionTime >= 2) {
                    if (this.dominates(player)) {
                      player.kill("basic", null);
                    }
                  }
                }
              }
              for (let neighbor of player.getNeighbors()) {
                if (neighbor.hasEffect("Virus")) {
                  continue;
                }

                let effect = neighbor.giveEffect("Virus");
                effect.source = this.source;
              }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
