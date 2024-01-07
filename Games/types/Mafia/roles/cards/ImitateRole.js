const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");
const { ReactionUserManager } = require("discord.js");

module.exports = class ImitateRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Imitate Role": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "role",
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            if (
              this.target === "Villager" ||
              this.target === "Impersonator" ||
              this.target === "Imposter"
            ) {
              let alert = `:mask: In spite of your studies, you could not do a good enough job.`;
              this.actor.queueAlert(alert);
              return;
            }
            let alert = `:mask: After much studying, you learn to act like ${addArticle(
              this.target
            )}.`;
            this.actor.holdItem("Suit", { type: this.target });
            this.actor.queueAlert(alert);
          },
        },
      },
    };
  }
};
