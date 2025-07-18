const Effect = require("../Effect");
const Action = require("../Action");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../const/Priority");


module.exports = class BackUp extends Effect {
  constructor(role) {
    super("BackUp");
    this.BackupRole = role;

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (player.role.name != this.BackupRole) return;
        if(player.hasEffect("BackUp")) return;
        this.player.role.data.RoleTargetBackup = null;
        this.remove();
      },
    };
  }

  
};
