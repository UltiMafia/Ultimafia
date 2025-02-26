const Effect = require("../Effect");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class BlackHole extends Effect {
  constructor(lifespan) {
    super("BlackHole");
    this.lifespan = lifespan;

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Day/)) {
          return;
        }
        if (this.timer) {
          return;
        }

        let toDetonate = 300000;
        this.timer = setTimeout(() => {
          if (this.game.finished) {
            return;
          }

          let players = this.game.alivePlayers();
          this.target = Random.randArrayVal(players);

          let action = new Action({
            target: this.target,
            game: this.target.game,
            labels: ["kill", "bomb"],
            run: function () {
              this.game.queueAlert(`The Black Hole Consumes the Town`);
              for (let player of this.game.alivePlayers()) {
                player.kill("basic");
              }
              this.game.MeteorLanded = true;
            },
          });

          this.game.instantAction(action);
          this.timer = null;
        }, toDetonate);
      },
    };
  }
};
