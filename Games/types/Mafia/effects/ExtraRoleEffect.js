const Effect = require("../Effect");
const Action = require("../Action");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../const/Priority");

module.exports = class ExtraRoleEffect extends Effect {
  constructor(role, lifespan) {
    super("ExtraRoleEffect");
    this.CopyingRole = role;
    this.lifespan = lifespan || Infinity;
  }

  apply(player) {
    super.apply(player);

    this.ExtraRole = player.addExtraRole(this.CopyingRole, null, false, false, false, "NoStartingItems");

  }

   remove() {
          var index = this.player.ExtraRoles.indexOf(this.ExtraRole);
          if (index != -1) {
            this.player.ExtraRoles.splice(index, 1);
          }
    this.ExtraRole.remove();
    super.remove();
  }

  
};
