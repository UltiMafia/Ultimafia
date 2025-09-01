const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../const/Priority");

module.exports = class Opera extends Event {
  constructor(modifiers, game) {
    super("Opera", modifiers, game);
  }

  getNormalRequirements() {
    return true;
  }

  doEvent() {
    super.doEvent();
    let victim = Random.randArrayVal(this.game.alivePlayers());
    this.action = new Action({
      game: this.game,
      priority: PRIORITY_ITEM_GIVER_DEFAULT,
      labels: ["hidden", "absolute"],
      event: this,
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Opera, 3 players may attend a night at the Opera!`
          );
        }

        if (this.event.modifiers && this.event.modifiers.includes("Random")) {
          Random.randArrayVal(this.game.alivePlayers()).giveEffect("MovieNight", true);
          return;
        }

        for (const player of this.event.generatePossibleVictims()) {
          player.holdItem("MovieTicket");
        }
      },
    });
    this.game.queueAction(this.action);
  }
};
