const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Provocative extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Modifier", "Item"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_ITEM_GIVER_DEFAULT,
        labels: ["hidden"],
        run: function () {
          // Prevent sockpuppet stacking across multiple days
          for (let item of this.actor.items) {
            if (item.name === "Sockpuppet") {
              item.drop();
            }
          }

          this.actor.holdItem("Sockpuppet", { reveal: false });
          this.actor.queueGetItemAlert("Sockpuppet");
        },
      },
    ];
  }
};
