const { addArticle } = require("../../../../core/Utils");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnVisitorsRole extends Card {
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

          if (this.actor.hasEffect("FalseMode")) {
            let players = this.game
              .alivePlayers()
              .filter((p) => p != this.actor);
            if (visitors.length == 0) {
              visitors.push(Random.randArrayVal(players));
            } else {
              visitors = [];
            }
          }

          for (let visitor of visitors) {
            this.actor.queueAlert(
              `Last night, ${addArticle(
                visitor.getRoleAppearance()
              )} visited you and confessed their sins.`
            );
          }
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
              "WatcherRoleInfo",
              this.actor,
              this.game,
              this.actor
            );
            info.processInfo();
            let visitors = info.getInfoRaw();
            for (let visitor of visitors) {
              this.actor.queueAlert(
                `Last night, ${addArticle(
                  visitor
                )} visited you and confessed their sins.`
              );
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
