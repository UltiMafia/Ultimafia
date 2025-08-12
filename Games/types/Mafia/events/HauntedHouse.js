const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_ITEM_GIVER_EARLY,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class HauntedHouse extends Event {
  constructor(modifiers, game) {
    super("Haunted House", modifiers, game);
  }

  doEvent() {
    super.doEvent();

    this.action = new Action({
      game: this.game,
      priority: PRIORITY_ITEM_GIVER_EARLY,
      labels: ["hidden", "absolute"],
      event: this,
      run: function () {
        let possibleVictims = [];
        for (let action of this.game.actions[0]) {
          if (
            action.hasLabels(["kill"]) &&
            action.target &&
            action.target.alive
          ) {
            possibleVictims.push(action.target);
          }
        }
        possibleVictims = possibleVictims.filter((p) =>
          this.event.canTargetPlayer(p)
        );
        if (possibleVictims.length <= 0) {
          possibleVictims = this.event.generatePossibleVictims();
        }
        this.target = Random.randArrayVal(possibleVictims);

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
