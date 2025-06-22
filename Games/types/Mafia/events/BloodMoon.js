const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_ITEM_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class BloodMoon extends Event {
  constructor(modifiers, game) {
    super("Blood Moon", modifiers, game);
  }

  doEvent() {
    super.doEvent();

    let victim = Random.randArrayVal(this.generatePossibleVictims());
    this.action = new Action({
      actor: victim,
      target: victim,
      game: this.game,
      priority: PRIORITY_ITEM_GIVER_DEFAULT,
      labels: ["hidden", "absolute"],
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Blood Moon! The game will end the following day! Village must kill a member of each Evil faction to win!`
          );
        }
        this.game.IsBloodMoon = true;
        
      },
    });
    this.action.do();
    //this.game.queueAction(this.action);
  }
};
