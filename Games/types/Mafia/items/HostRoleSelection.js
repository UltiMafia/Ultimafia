const Item = require("../Item");
const { PRIORITY_CONVERT_DEFAULT } = require("../const/Priority");

module.exports = class HostRoleSelection extends Item {
  constructor(player) {
    super("HostRoleSelection");
    this.Contestant = player;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      "Host Pick Role": {
        actionName: "Choose "+this.Contestant.name+"’s role ",
        states: ["Hosting"],
        flags: ["voting", "noVeg"],
        inputType: "custom",
        inputType: "AllRoles",
        action: {
          labels: ["investigate", "role", "block"],
          priority: PRIORITY_CONVERT_DEFAULT,
          item: this,
          run: function () {
            this.item.Contestant.setRole(
              `${this.target}`,
              undefined,
              false,
              true,
              true);
            
            this.item.drop();
          },
        },
      },
    };
  }
};
