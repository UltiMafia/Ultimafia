const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class CursedVote extends Effect {
  constructor(curser, lifespan) {
    super("CursedVote");
    this.curser = curser;
    this.lifespan = lifespan;

    this.listeners = {
      vote: function (vote) {
        if (
          vote.meeting.name === "Village" &&
          vote.target === this.player.id &&
          (vote.voter.role.alignment != "Follower" && 
          vote.voter.role.alignment != "Leader")
        ) {
          let action = new Action({
            actor: this.curser,
            target: vote.voter,
            game: this.game,
            labels: ["kill", "curse", "hidden"],
            effect: this,
            power: 2,
            run: function () {
              if (this.dominates()) {
                this.actor.giveEffect("Insanity", 1);
                this.target.giveEffect("Insanity", 1);
                this.effect.remove();
              }
            },
          });

          this.game.instantAction(action);
        }
      },
    };
  }
};
