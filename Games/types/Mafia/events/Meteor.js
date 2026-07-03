const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_EFFECT_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class Meteor extends Event {
  constructor(modifiers, game) {
    super("Meteor", modifiers, game);
  }

  getNormalRequirements() {
    return true;
  }

  doEvent() {
    super.doEvent();
    let victim = Random.randArrayVal(this.game.alivePlayers());
    const game = this.game;
    this.action = new Action({
      actor: victim,
      target: victim,
      game: this.game,
      priority: PRIORITY_EFFECT_GIVER_DEFAULT,
      labels: ["hidden", "absolute"],
      run: function () {
        if (game.SilentEvents != false) {
          const phrase = game.getStateName() === "Night"
            ? "A giant meteor will destroy the town and no one will win if no one dies tonight."
            : "A giant meteor will destroy the town and no one will win if no one dies today.";
          game.queueAlert(phrase);
        }

        this.actor.giveEffect("Meteor", 1);
      },
    });
    if (this.game.getStateName() === "Night") {
      this.game.queueAction(this.action);
    } else {
      this.action.do();
    }
  }
};
