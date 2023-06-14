const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class TrickedWares extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state(stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        if (!this.player.alive) {
          return;
        }

        const players = this.game.players.filter(
          (p) => p.alive && p != this.player
        );
        const target = Random.randArrayVal(players);

        const action = new Action({
          labels: ["giveItem"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT - 1,
          actor: this.player,
          target,
          game: this.player.game,
          run() {
            const items = ["Gun", "Armor", "Knife", "Snowball", "Crystal"];
            const itemToGive = Random.randArrayVal(items);
            const isItemCursed = Random.randArrayVal([true, false]);

            this.target.holdItem(itemToGive, { cursed: isItemCursed });
            this.queueGetItemAlert(itemToGive);
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
