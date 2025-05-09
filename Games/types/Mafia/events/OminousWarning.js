const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_ITEM_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class OminousWarning extends Event {
  constructor(modifiers, game) {
    super("Ominous Warning", modifiers, game);
    //this.game.queueAlert(`Supplies ${modifiers}`);
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
            `Event: Ominous Warning, Someone finds a Knife on their doorstep!`
          );
        }
        this.target.holdItem("Knife");
        this.target.queueGetItemAlert("Knife");
      },
    });
    this.game.queueAction(this.action);
  }
};
