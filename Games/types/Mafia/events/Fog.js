const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_EFFECT_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class Fog extends Event {
  constructor(modifiers, game) {
    super("Fog", modifiers, game);
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
          this.game.queueAlert(`Event: Fog, You can only see your neighbors!`);
        }
        for (const player of this.event.generatePossibleVictims()) {
          player.giveEffect("Fog", 1);
        }
      },
    });
    this.game.queueAction(this.action);
  }
};
