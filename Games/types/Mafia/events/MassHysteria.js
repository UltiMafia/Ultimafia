const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_EFFECT_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class MassHysteria extends Event {
  constructor(modifiers, game) {
    super("Mass Hysteria", modifiers, game);
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
      labels: ["hidden", "absolute"],
      event: this,
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Mass Hysteria, All players have Frustrated Modifier today!`
          );
        }
        for (const player of this.event.generatePossibleVictims()) {
          player.giveEffect("Frustrated", 1);
        }
      },
    });
    this.game.queueAction(this.action);
  }
};
