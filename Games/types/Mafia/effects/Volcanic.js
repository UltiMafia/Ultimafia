const Effect = require("../Effect");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class Volcanic extends Effect {
  constructor(lifespan, Volcano) {
    super("Volcanic");
    this.lifespan = lifespan;
    this.event = Volcano;

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Day/)) {
          return;
        }
        this.game.events.emit("Volcano");
      },
      Volcano: function () {
        if (this.timer) {
          return;
        }

        let toDetonate = 30000;
        this.timer = setTimeout(() => {
          if (this.game.finished) {
            return;
          }
          let players;
          if (this.event != null) {
            players = this.event.generatePossibleVictims();
          } else {
            players = this.game.alivePlayers();
          }
          if (players.length > 0) {
            this.target = Random.randArrayVal(players);

            let action = new Action({
              target: this.target,
              game: this.target.game,
              labels: ["kill", "bomb"],
              run: function () {
                if (this.game.getStateName() != "Day") {
                  return;
                }
                this.game.queueAlert(
                  `The Volcano erupts, hitting ${this.target.name} with molten rock!`
                );
                if (this.dominates()) this.target.kill("bomb", null, true);
              },
            });

            this.game.instantAction(action);
          }
          this.timer = null;
          this.game.events.emit("Volcano");
        }, toDetonate);

        let toDetonateSound = toDetonate - 1800;
        this.soundTimer = setTimeout(() => {
          this.game.broadcast("explosion");
        }, toDetonateSound);
      },
    };
  }
};
