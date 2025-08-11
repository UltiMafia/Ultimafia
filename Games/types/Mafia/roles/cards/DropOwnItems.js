const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT, PRIORITY_EFFECT_GIVER_EARLY } = require("../../const/Priority");

module.exports = class DropOwnItems extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        labels: ["dropItems", "hidden"],
        priority: PRIORITY_ITEM_GIVER_DEFAULT + 1,
        run: function () {
          for (let item of this.actor.items) {
            item.drop();
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
          labels: ["dropItems", "hidden"],
          run: function () {
            for (let item of this.actor.items) {
            item.drop();
            }
            
          },
        });

        this.game.queueAction(action);
        var action2 = new Action({
          actor: this.player,
          game: this.player.game,
          role: this,
          priority:PRIORITY_ITEM_TAKER_EARLY+2,
          labels: ["dropItems", "hidden"],
          run: function () {
            for (let item of this.actor.items) {
            item.drop();
            }
            
          },
        });
        this.game.queueAction(action2);
      },
    };
    
  }
};
