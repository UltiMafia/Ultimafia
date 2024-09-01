const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class BecomeFakeCultRole extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["IsTheLunatic"];

    this.listeners = {
      SwitchRoleBefore: function (player) {
        if (player != this.player) return;
        this.player.role.data.reroll = true;
        this.player.holdItem("IsTheLunatic");

        let banishedRoles = this.game.banishedRoles;
        let roles = this.game.PossibleRoles.filter((r) => r);
        let currentRoles = [];
        let playersAll = this.game.players.filter((p) => p.role);
        for (let x = 0; x < playersAll.length; x++) {
          //currentRoles.push(playersAll[x].role);
          let tempName = playersAll[x].role.name;
          let tempModifier = playersAll[x].role.modifier;
          currentRoles.push(`${tempName}:${tempModifier}`);
        }
        for (let y = 0; y < currentRoles.length; y++) {
          roles = roles.filter(
            (r) => r != currentRoles[y] && !currentRoles[y].includes(r)
          );
        }
        roles = roles.filter((r) => !r.toLowerCase().includes("banished"));
        roles = roles.filter((r) => this.game.getRoleAlignment(r) == "Village");

        if (roles.length <= 0) {
          roles = currentRoles;
          roles = roles.filter(
            (r) => this.game.getRoleAlignment(r) == "Cult"
          );
          roles = roles.filter((r) => this.game.getRoleTags(r).includes("Endangered") || this.game.getRoleTags(r).includes("Kills Cultist"));
          roles = roles.filter((r) => r.split(":")[0] != "Lunatic");
        }

        let newRole = Random.randArrayVal(roles);
        this.player.setRole(newRole, undefined, false, true);
      },
    };
  }
};
