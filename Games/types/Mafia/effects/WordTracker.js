const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class WordTracker extends Effect {
  constructor(lifespan, actor, player, phrase) {
    super("WordTracker");
    this.actor = actor;
    this.player = player;
    this.phrase = phrase;
    this.lifespan = lifespan;
  }

  speak(message) {
    if (
      message.content
        .replace(" ", "")
        .toLowerCase()
        .includes(this.phrase.toLowerCase()) &&
      this.game.getStateName() == "Day"
    ) {
      var action = new Action({
        actor: this.player,
        target: this.player,
        game: this.game,
        effect: this,
        labels: ["hidden"],
        run: function () {
          this.effect.actor.role.data.PlayersWhoSaidPhrase.push(this.actor);
          this.effect.remove();
        },
      });

      this.game.instantAction(action);
    }
  }

    speakQuote(quote) {
    if (
      quote.messageContent
        .replace(" ", "")
        .toLowerCase()
        .includes(this.phrase.toLowerCase()) &&
      this.game.getStateName() == "Day"
    ) {
      var action = new Action({
        actor: this.player,
        target: this.player,
        game: this.game,
        effect: this,
        labels: ["hidden"],
        run: function () {
          this.effect.actor.role.data.PlayersWhoSaidPhrase.push(this.actor);
          this.effect.remove();
        },
      });

      this.game.instantAction(action);
    }
  }



};
