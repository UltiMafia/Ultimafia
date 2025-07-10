const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_ITEM_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class CulturalExchange extends Event {
  constructor(modifiers, game) {
    super("Cultural Exchange", modifiers, game);
  }

  doEvent() {
    super.doEvent();
    let victim = Random.randArrayVal(this.generatePossibleVictims());
    this.action = new Action({
      target: victim,
      game: this.game,
      priority: PRIORITY_ITEM_GIVER_DEFAULT,
      labels: ["hidden", "absolute"],
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Cultural Exchange! 1 player wil gain the ability to role share today!`
          );
        }

        this.target.holdItem("RoleSharing", 1, true, false, false, false);
      },
    });
    this.game.queueAction(this.action);
  }
};
