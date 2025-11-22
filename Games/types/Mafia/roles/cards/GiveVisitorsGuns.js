const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveVisitorsGuns extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Item"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_ITEM_GIVER_DEFAULT,
        labels: ["giveItem", "gun"],
        role: role,
        run: function () {
          let visitors = this.getVisitors();
          visitors.map((p) => {
            p.holdItem("Gun");
            p.queueGetItemAlert("Gun");
          });
        },
      },
    ];
  }
};
