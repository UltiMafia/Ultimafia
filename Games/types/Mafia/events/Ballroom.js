const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_EFFECT_GIVER_DEFAULT,
  PRIORITY_ITEM_GIVER_DEFAULT,
} = require("../const/Priority");

module.exports = class Ballroom extends Event {
  constructor(modifiers, game) {
    super("Ballroom", modifiers, game);
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
      priority: PRIORITY_ITEM_GIVER_DEFAULT,
      event: this,
      labels: ["hidden", "absolute"],
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Ballroom, Everybody is invited to the UltiMafia Ball!`
          );
        }
        this.game.HaveReceptionState = true;
        for (const player of this.game.players) {
          if (this.event.canTargetPlayer(player)) {
            player.holdItem("Ballroom Invite");
            player.giveEffect("Ballroom Unpaired");
          }
        }
      },
    });
    this.game.queueAction(this.action);
  }
};