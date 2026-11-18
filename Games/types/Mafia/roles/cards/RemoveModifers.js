const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const { roleWith } = require("../../../../../lib/roleIdentity");

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

            const roleWithoutModifiers = roleWith(this.target.role, {
              modifiers: [],
            });
            let currRoleData = this.target.role.data;

            this.target.setRole(
              roleWithoutModifiers,
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
