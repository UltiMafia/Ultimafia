const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");
const { addArticle } = require("../../../../core/Utils");

module.exports = class RoleDisguiser extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Act Role": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            let role = this.target.getAppearance("investigate", true);
            let alert = `:mask: After studying ${
              this.target.name
            }, you learn to act like ${addArticle(role)}.`;
            this.actor.holdItem("Suit", { type: role });

            if(this.player.hasEffect("FalseMode")){
            let wrongPlayers = this.game.alivePlayers().filter((p) => p.getRoleAppearance("investigate").split(" (")[0] != this.target.role.name);
            let wrongRole = Random.randArrayVal(wrongPlayers).getRoleAppearance("investigate");
              alert = `:mask: After studying ${this.target.name}, you learn to act like ${addArticle(wrongRole)}.`;
          }
            
            this.actor.queueAlert(alert);
          },
        },
      },
    };
  }
};
