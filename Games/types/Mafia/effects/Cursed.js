const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class Cursed extends Effect {
  constructor(actor, word, lifespan) {
    super("Cursed");
    this.actor = actor;
    this.word = word;
    this.lifespan = lifespan || 1;
  }

  speak(message) {
    if (message.content.replace(" ", "").toLowerCase().includes(this.word)) {
      const action = new Action({
        actor: this.actor,
        target: this.player,
        game: this.game,
        effect: this,
        power: 2,
        labels: ["kill", "curse", "hidden"],
        run() {
          if (this.dominates()) this.target.kill("curse", this.actor, true);
          this.effect.remove();
        },
      });

      this.game.instantAction(action);
    }
  }
};
