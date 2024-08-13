const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class LearnVisitorsAndArm extends Card {
  constructor(role) {
    super(role);

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
  }
};
