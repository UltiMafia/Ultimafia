const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class StylePoints extends Effect {
  constructor(actor, player) {
    super("StylePoints");
    this.actor = actor;
    this.player = player;
    this.StylePointsToday = 0;

    this.listeners = {
      state: function () {
        if (this.game.getStateName() == "Day") {
          this.StylePointsToday = 0;
        }
        if (this.game.getStateName() != "Night") return;
        if (!this.player.alive) return;
        this.player.data.StylePoints =
          this.player.data.StylePoints + this.StylePointsToday;
        if (!this.player.role.hasAbility(["WhenDead"])) {
          this.remove();
        }
      },
    };
  }

  speak(message) {
    let players = this.game
      .alivePlayers()
      .filter((p) => p.faction == this.actor.faction);
    if (
      players.length > 1 &&
      this.player.faction == this.actor.faction &&
      message.content
        .replace(" ", "")
        .toLowerCase()
        .includes(this.player.role.name.toLowerCase()) &&
      this.game.getStateName() == "Day"
    ) {
      var action = new Action({
        actor: this.player,
        target: this.player,
        game: this.game,
        effect: this,
        labels: ["hidden"],
        run: function () {
          this.effect.StylePointsToday += 1;
          this.actor.queueAlert(`You gain 1 Style Point!`);
        },
      });

      this.game.instantAction(action);
    }
  }
};
