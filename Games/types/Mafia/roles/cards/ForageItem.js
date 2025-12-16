const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_ITEM_GIVER_EARLY } = require("../../const/Priority");

module.exports = class ForageItem extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Item", "Modifier"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_ITEM_GIVER_EARLY,
        labels: ["giveItem"],
        role: role,
        run: function () {
          //if (this.game.getStateName() != "Night") return;

          if (this.getVisitors().length > 0) {
            return;
          }

          var items = [
            "Gun",
            "Armor",
            "Bomb",
            "Knife",
            "Whiskey",
            "Crystal Ball",
            "Key",
            "Candle",
            "Falcon",
            "Tract",
            "Syringe",
            "Envelope",
            "Shield",
          ];
          var itemToGet = Random.randArrayVal(items);

          this.actor.holdItem(itemToGet);
          this.actor.queueGetItemAlert(itemToGet);
        },
      },
    ];

    this.listeners = {
      death: function (player, killer, deathType) {
        if (player === this.player && killer && deathType != "condemn") {
          killer.queueAlert(":gun2: You find a gun in your victim's workshop…");
          killer.holdItem("Gun", { reveal: true });
        }
      },
    };
  }
};
