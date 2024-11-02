const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class Brainblast extends Event {
  constructor(name, game, data) {
    super("Brainblast", game);
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
      item: this,
      labels: ["hidden", "absolute"],
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Brainblast, A player got a brainblast and can learn another player's role!`
          );
        }
        let targetTypes = ["neighbors", "even", "odd"];
        let targetType = Random.randArrayVal(targetTypes);
        this.target.holdItem("WackyRoleLearner", targetType, "Day");
      },
    });
    this.game.queueAction(this.action);
  }
};
