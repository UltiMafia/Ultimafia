const Item = require("../Item");
const { PRIORITY_CONVERT_DEFAULT } = require("../const/Priority");

module.exports = class HostRoleSelection extends Item {
  constructor(player) {
    super("HostRoleSelection");
    this.Contestant = player;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    let meetingName = "Choose " + this.Contestant.name + "’s role ";

    this.meetings[meetingName] = {
      actionName: "Choose " + this.Contestant.name + "’s role ",
      states: ["Hosting"],
      flags: ["voting", "noVeg"],
      inputType: "custom",
      inputType: "AllRoles",
      action: {
        labels: ["investigate", "role", "block"],
        priority: PRIORITY_CONVERT_DEFAULT,
        item: this,
        run: function () {
          if (this.target == "None") {
            return;
          }
          this.item.Contestant.setRole(
            `${this.target}`,
            undefined,
            false,
            true,
            true
          );
          if (this.game.HostRolesChanges == null) {
            this.game.HostRolesChanges = [];
          }
          this.game.HostRolesChanges.push(this.item.Contestant);

          this.item.drop();
        },
      },
    };
  }
};
