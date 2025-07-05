const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_ITEM_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class Airdrop extends Event {
  constructor(modifiers, game) {
    super("Airdrop", modifiers, game);
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
            `Event: Airdrop! A cargo plane just dumped a crate containing a gun on someone's lawn!`
          );
        }
        this.target.holdItem("Gun");
        this.target.queueGetItemAlert("Gun");
      },
    });
    this.game.queueAction(this.action);
  }
};
