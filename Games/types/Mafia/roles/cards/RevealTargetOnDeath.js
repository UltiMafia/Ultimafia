const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_REVEAL_DEFAULT } = require("../../const/Priority");

module.exports = class RevealTargetOnDeath extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Reveal on Death": {
        actionName: "Reveal on Death",
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_REVEAL_DEFAULT,
          role: this.role,
          run: function () {
            this.role.data.playerToReveal = this.target;
          },
        },
      },
    };
    this.listeners = {
      state: function (stateInfo) {
        if (stateInfo.name.match(/Night/)) {
          this.data.playerToReveal = null;
        }
      },
      death: function (player, killer, deathType) {
        if (player == this.player && this.data.playerToReveal) {
          if (!this.hasAbility(["Reveal", "WhenDead"])) {
            return;
          }
          let info = this.game.createInformation(
            "RevealInfo",
            this.player,
            this.game,
            this.data.playerToReveal,
            null,
            "All"
          );
          info.processInfo();
          info.getInfoRaw();

          //this.data.playerToReveal.role.revealToAll();
        }
      },
    };
    this.copyableListeners = {
      death: this,
    };
  }
};
