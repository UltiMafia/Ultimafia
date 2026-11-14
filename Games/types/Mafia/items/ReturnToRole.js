const Item = require("../Item");
const Action = require("../Action");
const { normalizeRole, roleName, roleWith } = require("../../../../lib/roleIdentity");

module.exports = class ReturnToRole extends Item {
  constructor(currRole, currModifier, currData, newRole) {
    super("ReturnToRole");

    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.roleData =
      currRole && typeof currRole === "object"
        ? normalizeRole(currRole)
        : roleWith(`${currRole}:${currModifier || ""}`, {});
    this.currRole = roleName(this.roleData);
    this.currModifier = this.roleData.modifiers.join("/");
    this.currData = currData;
    this.newRole = newRole;

    this.listeners = {
      afterActions: function () {
        if (this.hasBeenDay != true) return;
        if (this.holder.role.name != this.currRole) {
          this.drop();
          return;
        }
        this.holder.setRole(
          this.roleData,
          this.currData,
          true,
          true,
          true,
          "No Change"
        );
        this.drop();
      },
      state: function (stateInfo) {
        if (this.game.getStateName() == "Day") {
          this.hasBeenDay = true;
        }
        if (this.holder.role.name != this.currRole) {
          this.drop();
          return;
        }

        /*
        this.holder.setRole(
          this.roleData,
          this.currData,
          true,
          true,
          true,
          "No Change"
        );
        this.drop();
        */
      },
    };

    this.meetingMods = {
      "*": {
        actionName: "Visit",
      },
      "Faction Kill": {
        actionName: "Mafia Kill",
      },
      Village: {
        actionName: "Vote to Condemn",
      },
    };
  }
};
