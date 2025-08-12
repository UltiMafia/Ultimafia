const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_ITEM_GIVER_EARLY } = require("../../const/Priority");

module.exports = class ForageItem extends Card {
  constructor(role) {
    super(role);
 
    this.listeners = {
      death: function (player, killer, deathType) {
        if (player === this.player && killer && deathType != "condemn") {
          killer.queueAlert(":gun2: You find a gun in your victim's workshop…");
          killer.holdItem("Gun", { reveal: true });
        }
      },
      state: function (stateInfo) {
        if (!this.hasAbility(["Item", "Modifier"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          labels: ["giveItem"],
          priority: PRIORITY_ITEM_GIVER_EARLY,
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
              "Crystal",
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
        });

        this.game.queueAction(action);
      },
    };
  }
};
