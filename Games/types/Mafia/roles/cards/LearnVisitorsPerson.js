const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnVisitorsPerson extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate", "role", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          let visitors = this.getVisitors(this.actor);
          let visitorNames = visitors.map((v) => v.name);

          if (this.actor.hasEffect("FalseMode")) {
            let players = this.game
              .alivePlayers()
              .filter((p) => p != this.actor);
            let playerNames = players.map((p) => p.name);
            if (visitorNames.length == 0) {
              visitorNames.push(Random.randArrayVal(playerNames));
            } else {
              visitorNames = [];
            }
          }

          if (visitors.length === 0) {
            visitorNames = ["no one"];
          }

          this.actor.queueAlert(
            `:watch: You were visited by ${visitorNames.join(
              ", "
            )} during the night.`
          );
        },
      },
    ];
*/

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Information"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          labels: ["investigate", "role", "hidden"],
          run: function () {
            let info = this.game.createInformation(
              "WatcherInfo",
              this.actor,
              this.game,
              this.actor,
              false,
              true
            );
            info.processInfo();

            this.actor.queueAlert(`:watch: ${info.getInfoFormated()}`);
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
