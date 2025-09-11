const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class WatchPlayerBoolean extends Card {
  constructor(role) {
    super(role);
/*
    this.meetings = {
      "Watch (Boolean)": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: [] },
        action: {
          labels: ["investigate"],
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5,
          run: function () {
            let info = this.game.createInformation(
              "BinaryWatcherInfo",
              this.actor,
              this.game,
              this.target
            );
            info.processInfo();
            this.actor.queueAlert(`:watch: ${info.getInfoFormated()}`);
          },
        },
      },
    };
*/
      this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5,
          labels: ["investigate"],
          run: function () {
            let visits = this.getVisits(this.actor);
            for (let v of visits) {
              if (this.dominates(v)) {
              let info = this.game.createInformation(
              "BinaryWatcherInfo",
              this.actor,
              this.game,
              this.target
            );
            info.processInfo();
            this.actor.queueAlert(`:watch: ${info.getInfoFormated()}`);
              }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
    
  }
};
