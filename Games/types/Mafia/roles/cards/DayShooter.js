const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class DayShooter extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_ITEM_GIVER_DEFAULT,
        labels: ["hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() !== "Night") return;

          if (!this.actor.alive) return;

          let visitors = this.actor.role.data.visitors;

          if (!visitors?.length) {
            this.actor.holdItem("Gun");
            this.queueGetItemAlert("Gun", this.actor);
          }
        },
      },
    ];

    this.listeners = {
      death: function (player, killer, deathType) {
        if (player === this.player && killer && deathType != "condemn") {
          killer.queueAlert(
            ":sy2h: You find a gun in your victim's workshop..."
          );
          killer.holdItem("Gun", { reveal: true });
        }
      },
    };
  }
};
