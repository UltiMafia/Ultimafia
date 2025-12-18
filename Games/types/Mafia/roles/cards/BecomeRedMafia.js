const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { CULT_FACTIONS } = require("../../const/FactionList");

module.exports = class BecomeRedMafia extends Card {
  constructor(role) {
    super(role);

    //this.startItems = ["IsTheTelevangelist"];

    if (role.alignment != "Mafia") {
      return;
    }

    this.listeners = {
      SwitchRoleBefore: function (player) {
        if (player != this.player) return;
        //this.player.role.data.reroll = true;
        //this.player.holdItem("IsTheTelevangelist");

        let currRoleName = this.player.role.name;
        let currRoleModifier = this.player.role.modifier;
        let currRoleData = this.player.role.data;
        let currFaction = "Red Mafia";

        //let newRole = Random.randArrayVal(roles);
        this.player.setRole(
          `${currRoleName}:${currRoleModifier}`,
          currRoleData,
          true,
          true,
          true,
          "Red Mafia"
        );
      },
      roleAssigned: function (player) {
        if (player != this.player) return;
        if (this.player.faction == "Red Mafia") return;
        let currRoleName = this.player.role.name;
        let currRoleModifier = this.player.role.modifier;
        let currRoleData = this.player.role.data;
        let currFaction = "Red Mafia";

        //let newRole = Random.randArrayVal(roles);
        this.player.setRole(
          `${currRoleName}:${currRoleModifier}`,
          currRoleData,
          true,
          true,
          true,
          "Red Mafia"
        );
      },
    };
  }
};
