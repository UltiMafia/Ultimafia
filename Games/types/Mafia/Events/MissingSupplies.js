const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class MissingSupplies extends Event {
  constructor(name, game, data) {
    super("MissingSupplies", game);
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
            `Event: Missing Supplies, The Sheriff's Office has reported a Missing Gun!`
          );
        }
        this.target.holdItem("Gun");
      },
    });
    this.game.queueAction(this.action);
  }
};
