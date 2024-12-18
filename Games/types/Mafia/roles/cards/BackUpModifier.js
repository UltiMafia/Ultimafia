const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class Retired extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      SwitchRoleBefore: function (player) {
        if (player != this.player) return;
        this.player.role.data.reroll = true;

        for (let item of this.player.items) {
          item.drop();
        }

        //this.player.holdItem("Retirement", this.player.role.name);

        let newRole = "Conspirator";
        let currRole = this.player.role.name;

        if (this.player.role.alignment == "Village") {
          newRole = "Student";
        } else if (this.player.role.alignment == "Mafia") {
          newRole = "Understudy";
        } else if (this.player.role.alignment == "Cult") {
          newRole = "Devotee";
        }

        this.player.queueAlert(
            `Backup: You are the Backup for ${currRole}. If a ${currRole} is killed or Converted you become ${currRole}.`
          );

        this.player.setRole(
          newRole,
          undefined,
          false,
          true,
          false,
          "No Change"
        );
          this.player.role.data.FromBackUpModifier = currRole;
      },
    };
  }
};
