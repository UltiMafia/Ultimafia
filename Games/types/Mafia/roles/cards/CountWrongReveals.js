const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class CountWrongReveals extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 2,
          labels: ["investigate", "Forensicist"],
          run: function () {
            if (!this.actor.alive) return;
            let info = this.game.createInformation(
              "CountFalseInfoInfo",
              this.actor,
              this.game
            );
            info.processInfo();

            this.actor.queueAlert(`:journ: ${info.getInfoRaw()}`);
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
