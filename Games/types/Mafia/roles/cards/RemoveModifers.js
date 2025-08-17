const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");

module.exports = class RemoveModifers extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Purge Modifers": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["convert"],
          priority: PRIORITY_CONVERT_DEFAULT + 7,
          run: function () {
            if (!this.dominates()) {
              return;
            }

            let currRoleName = this.target.role.name;
            let currRoleModifier = this.target.role.modifier;
            let currRoleData = this.target.role.data;

            this.target.setRole(
              `${currRoleName}`,
              currRoleData,
              false,
              false,
              false,
              "No Change",
              "NoStartingItems"
            );
          },
        },
      },
    };
  }
};
