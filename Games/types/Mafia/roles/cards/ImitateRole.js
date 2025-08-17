const Card = require("../../Card");
const {
  PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
} = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");
const roleBlacklist = ["Villager", "Imposter", "Impersonator", "Mole"];

module.exports = class ImitateRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Imitate Role": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        inputType: "AllRoles",
        AllRolesFilters: ["blacklist"],
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
          run: function () {
            // if (this.target === "Villager" || this.target === "Impersonator" || this.target === "Imposter") {
            //   let alert = `:mask: In spite of your studies, you could not do a good enough job.`;
            //   this.actor.queueAlert(alert);
            //   return;
            // }
            let alert = `:mask: After much studying, you learn to act like ${addArticle(
              this.target
            )}.`;
            this.actor.holdItem("Suit", { type: this.target, concealed: true });
            this.actor.queueAlert(alert);
          },
        },
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.roleBlacklist = roleBlacklist.filter((r) => r);
        this.data.roleBlacklist2 = [];
      },
    };
  }
};
