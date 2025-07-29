const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");
module.exports = class ConvertToChosenRole extends Card {
  constructor(role) {
    super(role);
    this.meetings = {
      "Select Player": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive", "self"] },
        action: {
          role: this.role,
          priority: PRIORITY_CONVERT_DEFAULT - 1,
          run: function () {
            this.role.data.targetPlayer = this.target;
          },
        },
      },
      "Role to Become": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "AllRoles",
        AllRolesFilters: ["aligned", "NoDemonic"],
        action: {
          role: this.role,
          labels: ["convert", "role"],
          priority: PRIORITY_CONVERT_DEFAULT,
          run: function () {
            let targetPlayer = this.role.data.targetPlayer;
            if (targetPlayer) {
              if (this.dominates(targetPlayer)) {
                targetPlayer.giveEffect(
                  "BecomeRoleOnDeath",
                  this.actor,
                  this.target
                );
              }

              delete this.role.data.targetPlayer;
            }
          },
        },
      },
    };
  }
};
