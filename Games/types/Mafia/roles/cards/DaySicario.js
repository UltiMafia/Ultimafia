const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class DaySicario extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Item"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_ITEM_GIVER_DEFAULT,
        labels: ["hidden"],
        role: role,
        run: function () {
            if (!this.hasVisitors()) {
              this.actor.holdItem("Knife", { reveal: false });
              this.actor.queueGetItemAlert("Knife");
            }
          },
      },
    ];


  }
};
