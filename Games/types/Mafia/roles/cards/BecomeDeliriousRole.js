const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class BecomeDeliriousRole extends Card {
  constructor(role) {
    super(role);

    //this.startItems = ["IsTheBraggart"];

    let banishedRoles = this.game.banishedRoles;
    let roles = this.role.getAllRoles().filter((r) => r);
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
    roles = roles.filter((r) => !r.toLowerCase().includes("humble"));
    if (roles.length <= 0) {
      roles = currentRoles;
      roles = roles.filter((r) => this.game.getRoleAlignment(r) == "Village");
      roles = roles.filter((r) => r.split(":")[0] != "Braggart");
    }
    if (roles.length <= 0) {
      roles = ["Cop"];
    }
    role.newRole = Random.randArrayVal(roles);

    let tempApp = {
      self: role.newRole,
      reveal: role.newRole,
    };
    this.editAppearance(tempApp);

    this.listeners = {
      SwitchRoleBefore: function (player) {
        if (player != this.player) return;
        switchRoleBefore(this.player.role);
        this.player.role.data.reroll = true;
        this.player.holdItem("IsTheBraggart", this.player.role.modifier);
        let tempModifier = this.player.role.modifier;

        this.player.setRole(
          this.player.role.newRole,
          undefined,
          false,
          true,
          false,
          "No Change",
          "RemoveStartingItems"
        );

        let role = this.player.addExtraRole(`${"Villager"}:${tempModifier}`);
        this.player.passiveExtraRoles.push(role);
      },
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.player.holdItem("IsTheBraggart", this.player.role.modifier);

        let tempModifier = this.player.role.modifier;
        this.player.setRole(
          this.player.role.newRole,
          undefined,
          false,
          true,
          false,
          "No Change"
        );

        let role = this.player.addExtraRole(`${"Villager"}:${tempModifier}`);
        this.player.passiveExtraRoles.push(role);
      },
    };
  }
};

function switchRoleBefore(role) {
  let roles = role.getAllRoles().filter((r) => r);
  let currentRoles = [];
  let playersAll = role.game.players.filter((p) => p.role);
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
  roles = roles.filter((r) => role.game.getRoleAlignment(r) == "Village");
  roles = roles.filter((r) => !r.toLowerCase().includes("humble"));
  if (roles.length <= 0) {
    roles = currentRoles;
    roles = roles.filter((r) => role.game.getRoleAlignment(r) == "Village");
    roles = roles.filter((r) => r.split(":")[0] != "Braggart");
  }
  if (roles.length <= 0) {
    roles = ["Cop"];
  }
  role.newRole = Random.randArrayVal(roles);

  let tempApp = {
    self: role.newRole,
    reveal: role.newRole,
  };
  role.editAppearance(tempApp);
}
