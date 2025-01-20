const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_ITEM_GIVER_DEFAULT
} = require("../const/Priority");

module.exports = class Lightning extends Event {
  constructor(modifiers, game) {
    super("Lightning", modifiers, game);
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
      run: function () {
        for (const player of this.game.players) {
          player.holdItem("Kite");
        }
      },
    });
    this.game.queueAction(this.action);
  }
};
