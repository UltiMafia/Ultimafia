const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");

module.exports = class GuessRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Pursue Player": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          role: this.role,
          run: function () {
            //this.actor.role.data.targetPlayer = this.target;
            let targetRole = this.role.data.targetRole;
            if (targetRole) {
              let info = this.game.createInformation(
                "GuessRoleInfo",
                this.actor,
                this.game,
                [this.target],
                [targetRole]
              );
              info.processInfo();

              this.actor.queueAlert(`:invest: ${info.getInfoFormated()}`);
              delete this.role.data.targetRole;
            }
          },
        },
      },
      "Guess Role": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "AllRoles",
        AllRolesFilters: ["addedRoles"],
        action: {
          role: this.role,
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            this.role.data.targetRole = this.target;
          },
        },
      },
    };
  }
};
