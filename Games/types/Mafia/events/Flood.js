const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_FULL_DISABLE,
} = require("../const/Priority");

module.exports = class Flood extends Event {
  constructor(modifiers, game) {
    super("Flood", modifiers, game);
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
      labels: ["hidden", "absolute", "block"],
      event: this,
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Flood, All players were blocked last night!`
          );
        }
        for (const player of this.event.generatePossibleVictims()) {
              if (this.dominates(player)) {
              this.blockActions(player);
            }
        }
      },
    });
    this.game.queueAction(this.action);
  }
};
