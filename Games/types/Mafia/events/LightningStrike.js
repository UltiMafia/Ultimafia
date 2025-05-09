const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../const/Priority");

module.exports = class LightningStrike extends Event {
  constructor(modifiers, game) {
    super("Lightning Strike", modifiers, game);
  }

  getNormalRequirements() {
    return true;
  }

  doEvent() {
    super.doEvent();
    let victim = Random.randArrayVal(this.game.alivePlayers());
    this.action = new Action({
      game: this.game,
      priority: PRIORITY_ITEM_GIVER_DEFAULT,
      labels: ["hidden", "absolute"],
      event: this,
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(`Event: Lightning, Fly your kite if you dare!`);
        }
        for (const player of this.event.generatePossibleVictims()) {
          player.holdItem("Kite");
        }
      },
    });
    this.game.queueAction(this.action);
  }
};
