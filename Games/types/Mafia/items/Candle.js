const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../const/Priority");

module.exports = class Candle extends Item {
  constructor(lifespan, options) {
    super("Candle");

    this.lifespan = lifespan || Infinity;
    this.magicCult = options?.magicCult;
    this.broken = options?.broken;
    this.listeners = {
      state: function (stateInfo) {
        if (this.game.getStateName() != "Night") return;

        if (!this.holder.alive) return;

        this.action = new Action({
          actor: this.holder,
          target: this.holder,
          game: this.game,
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          labels: ["hidden"],
          run: function () {
            let visitorNames = this.getVisitors().map((p) => p.name);

            if (this.broken == true || this.magicCult == true) {
              let players = this.game
                .alivePlayers()
                .filter((p) => p != this.actor);
              let playerNames = players.map((p) => p.name);

              if (visitorNames.length === 0) {
                visitorNames.push(Random.randArrayVal(playerNames));
              } else {
                visitorNames = [];
              }
            }

            if (visitorNames.length === 0) {
              visitorNames.push("no one");
            }

            this.actor.queueAlert(
              `You were visited by ${visitorNames.join(", ")} during the night.`
            );
          },
        });

        this.game.queueAction(this.action);
      },
    };
  }
};
