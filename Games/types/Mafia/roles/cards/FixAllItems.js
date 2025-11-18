const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_ITEM_TAKER_DEFAULT,
  PRIORITY_ITEM_TAKER_EARLY,
} = require("../../const/Priority");

module.exports = class FixAllItems extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Fix Items": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["fixItems"],
          priority: PRIORITY_ITEM_TAKER_EARLY + 2,
          run: function () {
            this.role.PlayerToFixItems = this.target;
            for (let item of this.target.items) {
              item.broken = false;
              item.mafiaImmune = false;
              item.magicCult = false;
            }
          },
        },
      },
    };

    this.passiveActions = [
      {
        ability: ["Item"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_ITEM_TAKER_DEFAULT + 2,
        labels: ["fixItems"],
        role: role,
        run: function () {
          if (this.role.PlayerToFixItems != null) {
            for (let item of this.role.PlayerToFixItems.items) {
              item.broken = false;
              item.mafiaImmune = false;
              item.magicCult = false;
            }
          }
          this.role.PlayerToFixItems = null;
        },
      },
    ];
  }
};
