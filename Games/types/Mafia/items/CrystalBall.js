const Item = require("../Item");
const { PRIORITY_REVEAL_DEFAULT } = require("../const/Priority");

module.exports = class CrystalBall extends Item {
  constructor(options) {
    super("Crystal Ball");

    this.broken = options?.broken;
    this.magicCult = options?.magicCult;
    this.playerToReveal = null;
    this.meetings = {
      "Reveal on Death": {
        actionName: "Reveal on Death",
        states: ["Night"],
        flags: ["voting", "noVeg"],
        item: this,
        action: {
          labels: ["hidden", "absolute"],
          priority: PRIORITY_REVEAL_DEFAULT,
          item: this,
          run: function () {
            this.item.playerToReveal = this.target;
          },
        },
      },
    };

    this.listeners = {
      death: function (player, killer, deathType) {
        /*
        if (this.broken) {
          return;
        }

        if (this.magicCult) {
          this.playerToReveal.setTempAppearance("reveal", "Cultist");
        }
*/

        if (player == this.holder && this.playerToReveal) {
          let info = this.game.createInformation(
            "RevealInfo",
            this.holder,
            this.game,
            this.playerToReveal,
            null,
            "All"
          );
          info.processInfoItem(this);
          info.getInfoRaw();
          //this.playerToReveal.role.revealToAll();
          this.drop();
        }
      },
    };
  }
};
