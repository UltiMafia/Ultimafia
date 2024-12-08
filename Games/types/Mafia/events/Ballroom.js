const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_ITEM_GIVER_DEFAULT,
} = require("../const/Priority");

module.exports = class Ballroom extends Event {
  constructor(modifiers, game) {
    super("Ballroom", modifiers, game);
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
      priority: PRIORITY_ITEM_GIVER_DEFAULT,
      labels: ["hidden", "absolute"],
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Ballroom! Form pairs before the deadline if you want to remain alive!`
          );
        }
        for (const player of this.game.players) {
          player.holdItem("BallProposal");
          player.giveEffect("BallUnpaired", player);
        }
      },
    });
    this.game.queueAction(this.action);
  }
};
