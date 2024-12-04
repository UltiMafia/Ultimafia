const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_ITEM_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class CultureExchange extends Event {
  constructor(modifiers, game) {
    super("Culture Exchange", modifiers, game);
  }

  getNormalRequirements() {
    return true;
  }

  doEvent() {
    super.doEvent();
    let victim = Random.randArrayVal(this.game.alivePlayers());
    let victim2 = Random.randArrayVal(
      this.game.alivePlayers().filter((p) => p != victim)
    );
    this.action = new Action({
      actor: victim2,
      target: victim,
      game: this.game,
      priority: PRIORITY_ITEM_GIVER_DEFAULT,
      labels: ["hidden", "absolute"],
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Culture Exchange! 2 players wil gain the ability to role share today!`
          );
        }

        this.target.holdItem("RoleSharing", 1, true, false, false, false);
        this.actor.holdItem("RoleSharing", 1, true, false, false, false);
      },
    });
    this.game.queueAction(this.action);
  }
};
