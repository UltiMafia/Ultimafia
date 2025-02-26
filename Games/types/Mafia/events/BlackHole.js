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
    this.action = new Action({
      actor: victim,
      target: victim,
      game: this.game,
      priority: PRIORITY_EFFECT_GIVER_DEFAULT,
      labels: ["hidden", "absolute"],
      run: function () {
        for(let player of this.game.players){
            if(player.hasEffect("BlackHole")){
                return;
            }
        }
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `A Black Hole will consume the town and no one will win if no one Wins in the Next 5 Minutes.`
          );
        }

        this.actor.giveEffect("BlackHole", Infinity);
      },
    });
    this.game.queueAction(this.action);
  }
};
