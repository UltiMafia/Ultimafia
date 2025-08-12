const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_ITEM_GIVER_EARLY,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class Feast extends Event {
  constructor(modifiers, game) {
    super("Feast", modifiers, game);
    //this.game.queueAlert(`Supplies ${modifiers}`);
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
      priority: PRIORITY_ITEM_GIVER_EARLY,
      labels: ["hidden", "absolute"],
      event: this,
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Feast, The Town discovered hidden rations a Grand Feast will be Held!`
          );
        }
        for (let person of this.event.generatePossibleVictims()) {
          if (person.alive && person.role.name !== "Turkey") {
            person.holdItem("Food", "Bread");
            person.queueGetItemAlert("Bread");
          }
        }
      },
    });
    this.game.queueAction(this.action);
  }
};
