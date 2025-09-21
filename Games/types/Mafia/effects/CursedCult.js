const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class CursedCult extends Effect {
  constructor(actor, word, lifespan) {
    super("CursedCult");
    this.actor = actor;
    this.word = word;
    this.lifespan = lifespan || 1;
  }

  speak(message) {
    if (message.content.replace(" ", "").toLowerCase().includes(this.word)) {
      var action = new Action({
        actor: this.actor,
        target: this.player,
        game: this.game,
        effect: this,
        power: 2,
        labels: ["convert", "curse", "hidden"],
        run: function () {
          if (this.dominates()) this.target.setRole("Cultist");
          this.effect.remove();
        },
      });

      this.game.instantAction(action);
    }
  }

  speakQuote(message) {
    if (message.content.replace(" ", "").toLowerCase().includes(this.word)) {
      var action = new Action({
        actor: this.actor,
        target: this.player,
        game: this.game,
        effect: this,
        power: 2,
        labels: ["convert", "curse", "hidden"],
        run: function () {
          if (this.dominates()) this.target.setRole("Cultist");
          this.effect.remove();
        },
      });

      this.game.instantAction(action);
    }
  }
};
