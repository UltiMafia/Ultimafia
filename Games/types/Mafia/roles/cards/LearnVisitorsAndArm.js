const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class LearnVisitorsAndArm extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_ITEM_GIVER_DEFAULT,
        labels: ["giveItem", "gun", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          let visitors = this.getVisitors(this.actor);

          for (let visitor of visitors) {
            if (this.actor.hasEffect("FalseMode")) {
              let players = this.game
                .alivePlayers()
                .filter((p) => p != this.actor);
              for (let v of visitors) {
                players = players.filter((p) => p != v);
              }
              let ranPlayer = Random.randArrayVal(players);
              this.actor.queueAlert(
                `:gun2: You still feel apprehensive about ${ranPlayer.name} after their visit last night but with this new gun, you feel more safe.`
              );
            } else {
              this.actor.queueAlert(
                `:gun2: You still feel apprehensive about ${visitor.name} after their visit last night but with this new gun, you feel more safe.`
              );
            }
            this.actor.holdItem("Gun", { reveal: false });
          }
        },
      },
    ];
*/

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Information", "Item"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          labels: ["giveItem", "gun", "hidden", "absolute"],
          run: function () {
            if (!this.actor.alive) return;

            let info = this.game.createInformation(
              "WatcherInfo",
              this.actor,
              this.game,
              this.actor,
              false,
              true
            );
            info.processInfo();

            let visitors = info.getInfoRaw();

            for (let visitor of visitors) {
              this.actor.queueAlert(
                `:gun2: You still feel apprehensive about ${visitor.name} after their visit last night but with this new gun, you feel more safe.`
              );
              this.actor.holdItem("Gun", { reveal: false });
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
