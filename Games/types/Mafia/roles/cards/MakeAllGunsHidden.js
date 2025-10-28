const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_ITEM_TAKER_DEFAULT,
  PRIORITY_ITEM_TAKER_EARLY,
} = require("../../const/Priority");

module.exports = class MakeAllGunsHidden extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Item"],
        actor: role.player,
        game: role.game,
        role: role,
        priority: PRIORITY_ITEM_TAKER_DEFAULT + 2,
        labels: ["investigate"],
        run: function () {
          for (let item of this.actor.items) {
            item.reveal = false;
          }
        },
      },
    ];

    this.listeners = {
      instantAction: function (action) {
        if (!this.hasAbility(["Item"])) {
          return;
        }
        for (let item of this.player.items) {
          item.reveal = false;
        }
      },
      roleAssigned: function (player){
        if(player != this.player){
          return;
        }
        if (!this.hasAbility(["Item"])) {
          return;
        }
        for (let item of this.player.items) {
          item.reveal = false;
        }
      },
    };
  }
};
