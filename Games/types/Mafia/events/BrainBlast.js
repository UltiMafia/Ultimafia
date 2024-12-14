const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_ITEM_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class Brainblast extends Event {
  constructor(modifiers, game) {
    super("Brain Blast", modifiers, game);
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
            `Event: Brain Blast! A player got a brainblast and can learn another player's role!`
          );
        }
        let targetTypes = ["alive"];
        let targetType = Random.randArrayVal(targetTypes);
        this.target.holdItem("WackyRoleLearner", targetType, "Day");
      },
    });
    this.game.queueAction(this.action);
  }
};
