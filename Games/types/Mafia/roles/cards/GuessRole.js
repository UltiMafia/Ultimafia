const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class GuessRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Pursue Player": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            this.actor.role.data.targetRole = this.target.role.name;
          },
        },
      },
      "Guess Role": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "role",
        targets: { include: ["all"] },
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            let targetRole = this.actor.role.data.targetRole;
            if (targetRole) {
              if (this.target === targetRole) {
                this.actor.queueAlert(`:invest: You were not mistaken in pursuing {this.target} for they turned out to be {addArticle(targetRole)}.`);
              } else {
                this.actor.queueAlert(`:invest: You were mistaken in pursuing {this.target} for they turned out not to be {addArticle(targetRole)}.`);
              }
              delete this.actor.role.data.targetRole;
            }
          },
        },
      },
    };
  }
};
