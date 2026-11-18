const Card = require("../../Card");
const { roleKey } = require("../../../../../lib/roleIdentity");
const {
  PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
} = require("../../const/Priority");
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
          priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
          role: this.role,
          run: function () {
            let role = roleKey(this.target.role.toRoleData());
            let info = this.game.createInformation(
              "RoleInfo",
              this.actor,
              this.game,
              this.target
            );
            info.processInfo();
            let alert = `:mask: After studying ${
              this.target.name
            }, you learn to act like ${addArticle(info.getInfoRaw())}.`;
            this.actor.holdItem("Suit", {
              // Name and modifiers only: the Suit's type becomes the
              // disguiser's appearance and snoop name.
              type: `${this.target.getRoleName()}:${this.target.role.modifier}`,
            });
            this.actor.queueAlert(alert);
          },
        },
      },
    };
  }
};
