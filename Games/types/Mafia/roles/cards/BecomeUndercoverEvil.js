const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class BecomeUndercoverEvil extends Card {
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
    roles = roles.filter((r) => !r.toLowerCase().includes("demonic"));
    roles = roles.filter((r) => !r.toLowerCase().includes("linchpin"));
    roles = roles.filter(
      (r) =>
        this.game.getRoleAlignment(r) != "Village" &&
        this.game.getRoleAlignment(r) != "Independent"
    );
    if (roles.length <= 0) {
      roles = currentRoles;
      roles = roles.filter((r) => !r.toLowerCase().includes("demonic"));
      roles = roles.filter((r) => !r.toLowerCase().includes("linchpin"));
      roles = roles.filter(
        (r) =>
          this.game.getRoleAlignment(r) != "Village" &&
          this.game.getRoleAlignment(r) != "Independent"
      );
    }
    if (roles.length <= 0) {
      roles = ["Mafioso"];
    }
    this.newRole = Random.randArrayVal(roles);

    this.listeners = {
      SwitchRoleBefore: function (player) {
        if (player != this.player) return;
        this.player.role.data.reroll = true;
        this.player.holdItem("IsTheMole", this.player.faction);

        this.player.setRole(this.newRole, undefined, false, true, false);
        let tempApp = {
          self: "Mole",
        };
        this.editAppearance(tempApp);
      },
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.player.holdItem("IsTheMole", this.player.faction);
        this.player.setRole(this.newRole, undefined, false, true, false);
        let tempApp = {
          self: "Mole",
        };
        this.editAppearance(tempApp);
      },
    };
  }
};
