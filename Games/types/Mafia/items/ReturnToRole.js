const Item = require("../Item");

module.exports = class ReturnToRole extends Item {
  constructor(currRole, currModifier, currData, newRole) {
    super("ReturnToRole");

    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.currRole = currRole;
    this.currModifier = currModifier;
    this.currData = currData;
    this.newRole = newRole;

    this.listeners = {
      state: function (stateInfo) {
        if (this.game.getStateName() != "Day") return;
        if (this.holder.role.name != this.currRole) {
          this.drop();
          return;
        }
        this.holder.setRole(
          `${currRole}:${currModifier}`,
          this.currData,
          true,
          true,
          true,
          "No Change"
        );
        this.drop();
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
