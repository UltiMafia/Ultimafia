const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../const/Priority");

module.exports = class Meteor extends Event {
  constructor(modifiers, game) {
    super("Meteor", modifiers, game);
  }

  getNormalRequirements() {
    return true;
  }

  getStalemateWarningMessage() {
    if (this.game.meteorWarningPhase === "Day") {
      return "A giant meteor will land and end the game if nobody is condemned today!";
    }

    if (this.game.meteorWarningPhase === "Night") {
      return "A giant meteor will land and end the game if nobody dies tonight!";
    }

    return "A giant meteor will destroy the town and no one will win if no one dies today.";
  }

  doEvent() {
    super.doEvent();
    let victim = Random.randArrayVal(this.game.alivePlayers());

    if (!this.game.meteorWarningPhase) {
      this.game.meteorWarningPhase = "Day";
    }

    const alertMessage = this.getStalemateWarningMessage();

    this.action = new Action({
      actor: victim,
      target: victim,
      game: this.game,
      priority: PRIORITY_EFFECT_GIVER_DEFAULT,
      labels: ["hidden", "absolute"],
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(alertMessage);
        }

        this.actor.giveEffect("Meteor", Infinity);
      },
    });
    this.game.instantAction(this.action);
  }
};
