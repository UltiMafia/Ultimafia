const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class LearnVisitorsAndArm extends Card {
  constructor(role) {
    super(role);

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
          labels: ["giveItem", "gun", "hidden"],
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
