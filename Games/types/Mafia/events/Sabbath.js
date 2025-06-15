const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_FULL_DISABLE,
} = require("../const/Priority");

module.exports = class Sabbath extends Event {
  constructor(modifiers, game) {
    super("Sabbath", modifiers, game);
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
      priority: PRIORITY_FULL_DISABLE+3,
      labels: ["hidden", "absolute", "protect"],
      event: this,
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Sabbath, All players were protected last night!`
          );
        }
        for (const player of this.event.generatePossibleVictims()) {
              if (this.dominates(player)) {
               _player.setTempImmunity("kill", 10);
            }
        }
      },
    });
    this.game.queueAction(this.action);
  }
};
