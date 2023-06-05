const Item = require("../Item");
const { PRIORITY_REVEAL_TARGET_ON_DEATH } = require("../const/Priority");

module.exports = class Crystal extends Item {
  constructor(options) {
    super("Crystal");

    this.cursed = options?.cursed;
    this.playerToReveal = null;
    this.meetings = {
      "Reveal on Death": {
        actionName: "Reveal on Death",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["hidden", "absolute"],
          priority: PRIORITY_REVEAL_TARGET_ON_DEATH,
          item: this,
          run: function () {
            this.item.playerToReveal = this.target;
          },
        },
      },
    };

    this.listeners = {
      death: function (player, killer, deathType) {
        if (this.cursed) {
          return;
        }

        if (player == this.holder && this.playerToReveal) {
          this.playerToReveal.role.revealToAll();
          this.drop();
        }
      },
    };
  }
};
