const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../const/Priority");

module.exports = class Revelation extends Event {
  constructor(modifiers, game) {
    super("Revelation", modifiers, game);
  }

  doEvent() {
    super.doEvent();
    let victim = Random.randArrayVal(this.game.alivePlayers());
    this.action = new Action({
      actor: victim,
      target: victim,
      game: this.game,
      event: this,
      priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5,
      labels: ["hidden", "absolute"],
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Revelation! Each players learn 3 excess roles!`
          );
        }
        for (const player of this.event.generatePossibleVictims()) {
          let info = this.game.createInformation(
            "ExcessRolesInfo",
            player,
            this.game,
            3
          );
          info.processInfo();
          var alert = `:invest: Revelation: ${info.getInfoFormated()}.`;
          player.queueAlert(alert);
        }
      },
    });
    this.action.do();
  }
};
