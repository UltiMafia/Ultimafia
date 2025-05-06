const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_ITEM_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class HauntedHouse extends Event {
  constructor(modifiers, game) {
    super("Haunted House", modifiers, game);
  }

  getNormalRequirements() {
    return true;
  }

  doEvent() {
    super.doEvent();
    let victim = Random.randArrayVal(this.game.alivePlayers());
    this.action = new Action({
      target: victim,
      game: this.game,
      priority: PRIORITY_ITEM_GIVER_DEFAULT,
      labels: ["hidden", "absolute"],
      run: function () {
        if (this.game.SilentEvents != false) {
          this.target.queueAlert(
            `Event: Haunted House, You enter a Haunted House and find a Mask!`
          );
        }
        this.target.holdItem("Haunted Mask");
        this.target.queueGetItemAlert("Haunted Mask");
      },
    });
    this.game.queueAction(this.action);
  }
};
