const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class RevealNameToTarget extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
        labels: ["investigate", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          var alert = `:mask: You learn that you were visited by ${this.actor.name}.`;

          if (this.actor.hasEffect("FalseMode")) {
            let players = this.game
              .alivePlayers()
              .filter((p) => p != this.actor);
            alert = `:mask: You learn that you were visited by ${
              Random.randArrayVal(players).name
            }.`;
          }

          let visits = this.getVisits(this.actor);
          visits.map((v) => v.queueAlert(alert));
        },
      },
    ];
*/

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
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
          labels: ["investigate", "hidden"],
          run: function () {
              let info = this.game.createInformation(
              "LearnTargetInfo",
              this.actor,
              this.game,
              this.actor
            );
            info.processInfo();
            var alert = `:mask: You learn that you were visited by ${info.getInfoRaw()}.`;

            let visits = this.getVisits(this.actor);
            visits.map((v) => v.queueAlert(alert));
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
