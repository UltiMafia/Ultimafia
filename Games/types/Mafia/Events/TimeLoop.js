const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class TimeLoop extends Event {
  constructor(name, game) {
    super("Time Loop", game);
  }

  getNormalRequirements() {
    return true;
  }

  doEvent() {
    super.doEvent();
    let victim = Random.randArrayVal(this.game.alivePlayers());
    let L = function () {
      if (this.role.data.doTimeLoop == true) {
        this.role.data.doTimeLoop = false;
        return true;
      } else {
        return false;
      }
    };
    L = L.bind(this.holder);
    this.holder.role.data.doTimeLoop = true;
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
