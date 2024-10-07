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

        this.player.holdItem("Retirement", this.player.role.name);

        let newRole = "Grouch";

        if (this.player.role.alignment == "Village") {
          newRole = "Villager";
        } else if (this.player.role.alignment == "Mafia") {
          newRole = "Mafioso";
        } else if (this.player.role.alignment == "Cult") {
          newRole = "Cultist";
        }

        this.player.setRole(
          newRole,
          undefined,
          false,
          true,
          false,
          "No Change"
        );
      },
    };
  }
};
