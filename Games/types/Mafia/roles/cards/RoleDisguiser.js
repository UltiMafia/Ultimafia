const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

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
            let alert = `:mask: After studying ${this.target.name}, you learn to act like ${addArticle(role)}.`;
            this.actor.holdItem("Suit", role);
            this.actor.queueAlert(alert);
          },
        },
      },
    };
  }
};
