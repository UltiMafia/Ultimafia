const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_EFFECT_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class MailInBallots extends Event {
  constructor(modifiers, game) {
    super("Mail-In Ballots", modifiers, game);
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
      event: this,
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Mail-In Ballots, No players can switch votes!`
          );
        }
        for (const player of this.event.generatePossibleVictims()) {
          player.giveEffect("CannotChangeVotesAtDay", 1);
        }
        if (
                this.game.RoomOne.length > 0 &&
                this.game.RoomTwo.length > 0
              ) {
                for (const player of this.game.RoomOne) {
                  player.giveEffect("CannotChangeVotesAtDay", 1, "Room 1");
                }
                for (const player of this.game.RoomTwo) {
                  player.giveEffect("CannotChangeVotesAtDay", 1, "Room 2");
                }
                return;
              }
      },
    });
    this.game.queueAction(this.action);
  }
};
