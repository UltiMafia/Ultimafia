const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_ITEM_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class Vaccination extends Event {
  constructor(modifiers, game) {
    super("Vaccination", modifiers, game);
    //this.game.queueAlert(`Supplies ${modifiers}`);
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
          this.game.queueAlert(`Event: Vaccination, Someone gains a Syringe!`);
        }
        this.target.holdItem("Syringe");
        this.target.queueGetItemAlert("Syringe");
      },
    });
    this.game.queueAction(this.action);
  }
};
