const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_ITEM_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class TimeLoop extends Event {
  constructor(modifiers, game) {
    super("Time Loop", modifiers, game);
  }

  getNormalRequirements() {
    return true;
  }

  doEvent() {
    super.doEvent();
    this.game.PossibleEvents.splice(this.game.PossibleEvents.indexOf(this.fullName),1);
    let victim = Random.randArrayVal(this.game.alivePlayers());
    //this.game.;
    let L = function () {
      if (this.role.data.doTimeLoop == true) {
        this.role.data.doTimeLoop = false;
        return true;
      } else {
        return false;
      }
    };
    L = L.bind(victim);
    victim.role.data.doTimeLoop = true;
    this.game.setStateShouldSkip("Day", L);
    this.action = new Action({
      actor: victim,
      target: victim,
      game: this.game,
      priority: PRIORITY_BECOME_DEAD_ROLE,
      labels: ["hidden", "absolute"],
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(`Event: Time Loop, It's Night Again!`);
        }
      },
    });
    this.game.queueAction(this.action);
  }
};
