const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT, PRIORITY_ITEM_TAKER_EARLY } = require("../../const/Priority");

module.exports = class FixOwnItems extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        labels: ["fixItems", "hidden"],
        priority: PRIORITY_ITEM_TAKER_DEFAULT + 2,
        run: function () {
          for (let item of this.actor.items) {
            item.broken = false;
            item.magicCult = false;
            item.mafiaImmune = false;
          }
        },
      },
    ];
    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Item"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          role: this,
          priority: PRIORITY_ITEM_TAKER_DEFAULT+2,
          labels: ["fixItems", "hidden"],
          run: function () {
            for (let item of this.actor.items) {
            item.broken = false;
            item.magicCult = false;
            item.mafiaImmune = false;
            }
            
          },
        });

        this.game.queueAction(action);
        var action2 = new Action({
          actor: this.player,
          game: this.player.game,
          role: this,
          priority:PRIORITY_ITEM_TAKER_EARLY+2,
          labels: ["fixItems", "hidden"],
          run: function () {
            for (let item of this.actor.items) {
            item.broken = false;
            item.magicCult = false;
            item.mafiaImmune = false;
            }
            
          },
        });

        this.game.queueAction(action2);
      },
    };
  }
};
