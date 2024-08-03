const Effect = require("../Effect");
const Action = require("../Action");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class ChoirSong extends Effect {
  constructor(actor, word, lifespan) {
    super("ChoirSong");
    this.actor = actor;
    this.word = word;
    this.lifespan = lifespan || 1;

      this.listeners = {
      state: function () {
        if (this.game.getStateName() != "Day") return;
        if (!this.player.alive) return;

        var action = new Action({
          labels: ["hidden", "absolute", "condemn", "overthrow"],
          actor: this.actor,
          target: this.player,
          game: this.player.game,
          priority: PRIORITY_OVERTHROW_VOTE -2,
          run: function () {
            if(this.word != "Complete"){
            for (let action of this.game.actions[0]) {
            if (action.hasLabel("condemn") && !action.hasLabel("overthrow")) {
              // Only one village vote can be overthrown
              action.cancel(true);
              break;
            }
          }

          if (this.dominates(this.actor.role.data.playerVoter)) {
            this.actor.role.data.playerVoter.kill("condemn", this.actor);
          }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }

  speak(message) {
    if (message.content.replace(" ", "").toLowerCase().includes(this.word)) {
      var action = new Action({
        actor: this.actor,
        target: this.player,
        game: this.game,
        effect: this,
        labels: ["hidden"],
        run: function () {
          this.word = "Complete"
          victim.queueAlert(`You have spoken the role so your safe unless the Choirmaster guesses you as the Singer!`);
          //this.effect.remove();
        },
      });

      this.game.instantAction(action);
    }
  }
};
