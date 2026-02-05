const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_EFFECT_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class Eclipse extends Event {
  constructor(modifiers, game) {
    super("Eclipse", modifiers, game);
  }

  getNormalRequirements() {
    return true;
  }

  doEvent() {
    super.doEvent();
    let victim = Random.randArrayVal(this.game.alivePlayers());
    this.action = new Action({
      actor: victim,
      target: victim,
      game: this.game,
      priority: PRIORITY_EFFECT_GIVER_DEFAULT,
      event: this,
      labels: ["hidden", "absolute"],
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Eclipse, Everything goes dark as an eclipse begins!`
          );
        }
        for (const player of this.game.players) {
          if (this.event.canTargetPlayer(player)) {
            player.giveEffect("Blind", 1);
          }
        }
      },
    });
    this.game.queueAction(this.action);
  }
};
