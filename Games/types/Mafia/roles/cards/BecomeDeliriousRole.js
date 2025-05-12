const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class BecomeDeliriousRole extends Card {
  constructor(role) {
    super(role);

    //this.startItems = ["IsTheBraggart"];

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
    roles = roles.filter((r) => this.game.getRoleTags(r).includes("Humble"));
    if (roles.length <= 0) {
      roles = currentRoles;
      roles = roles.filter((r) => this.game.getRoleAlignment(r) == "Village");
      roles = roles.filter((r) => r.split(":")[0] != "Braggart");
    }
    this.newRole = Random.randArrayVal(roles);

    let tempApp = {
      self: this.newRole,
      reveal: this.newRole,
    };
    this.editAppearance(tempApp);

    this.listeners = {
      SwitchRoleBefore: function (player) {
        if (player != this.player) return;
        this.player.role.data.reroll = true;
        this.player.holdItem("IsTheBraggart");

        this.player.setRole(
          this.newRole,
          undefined,
          false,
          true,
          false,
          "No Change"
        );
      },
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.player.holdItem("IsTheBraggart");
        this.player.setRole(
          this.newRole,
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
