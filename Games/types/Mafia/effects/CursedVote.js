const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class CursedVote extends Effect {
  constructor(curser, target, lifespan) {
    super("CursedVote");
    this.curser = curser;
    this.target = target;
    this.lifespan = lifespan;

    this.listeners = {
      vote: function (vote) {
        if (
          vote.meeting.name === "Village" &&
          vote.voter === this.player &&
          vote.target === this.target.id
        ) {
          let action = new Action({
            actor: this.curser,
            target: this.player,
            game: this.game,
            labels: ["kill", "curse", "hidden"],
            effect: this,
            power: 2,
            run: function () {
              if (this.dominates()) this.target.kill("curse", this.actor, true);
              this.effect.remove();
            },
          });

          this.game.instantAction(action);
        }
      },
    };
  }
};
