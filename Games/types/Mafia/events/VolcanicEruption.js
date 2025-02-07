const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_EFFECT_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class VolcanicEruption extends Event {
  constructor(modifiers, game) {
    super("Volcanic Eruption", modifiers, game);
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
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Volcano, A RANDOM PLAYER WILL DIE EVERY 30 SECONDS UNTIL THE DAY ENDS!`
          );
        }

        this.actor.giveEffect("Volcanic", 1);
      },
    });
    this.game.queueAction(this.action);
  }
};
