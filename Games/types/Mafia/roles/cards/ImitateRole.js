const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");

module.exports = class ImitateRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Imitate Role": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            // if (this.target === "Villager" || this.target === "Impersonator" || this.target === "Imposter") {
            //   let alert = `:mask: In spite of your studies, you could not do a good enough job.`;
            //   this.actor.queueAlert(alert);
            //   return;
            // }
            let alert = `:mask: After much studying, you learn to act like ${addArticle(this.target)}.`;
            this.actor.holdItem("Suit", {type: this.target, concealed: true});
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

        let roles = [];

        for (let player of this.game.players) {
          let roleName = player.role.name;
          if (roleName != "Villager" && roleName != "Imposter" && roleName != "Impersonator") {
            roles.push(roleName);
          }
        }

        this.meetings["Imitate Role"].targets = roles;
      },
    };
  }
};
