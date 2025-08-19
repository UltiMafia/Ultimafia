const Effect = require("../Effect");
const Action = require("../Action");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../const/Priority");

module.exports = class BackUp extends Effect {
  constructor(role, CurrentRole) {
    super("BackUp");
    this.BackupRole = role;
    this.CurrentRole = CurrentRole;

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (player == this.player) {
          return;
        }
        if (player.role.name != this.BackupRole) return;
        if (
          !this.CurrentRole.hasAbility(["Convert", "OnlyWhenAlive", "Modifier"])
        )
          return;
        this.CurrentRole.data.RoleTargetBackup = null;
        this.remove();
      },
    };
  }
};
