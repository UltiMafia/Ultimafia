const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_ITEM_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class Moonshine extends Event {
  constructor(modifiers, game) {
    super("Moonshine", modifiers, game);
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
            `Event: Moonshine, Someone has been Illegaly brewing liquor!`
          );
        }
        this.target.holdItem("Whiskey");
        this.target.queueGetItemAlert("Whiskey");
      },
    });
    this.game.queueAction(this.action);
  }
};
