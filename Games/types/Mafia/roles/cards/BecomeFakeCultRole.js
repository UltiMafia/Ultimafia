const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { CULT_FACTIONS } = require("../../const/FactionList");

module.exports = class BecomeFakeCultRole extends Card {
  constructor(role) {
    super(role);

    //this.startItems = ["IsTheTelevangelist"];
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
    roles = roles.filter((r) => this.game.getRoleAlignment(r) == "Cult");
    roles = roles.filter(
      (r) =>
        this.game.getRoleTags(r).includes("Endangered") ||
        this.game.getRoleTags(r).includes("Kills Cultist") ||
        this.game.getRoleTags(r).includes("Demonic")
    );
    let excessEndangered = roles;

    roles = currentRoles;
    roles = roles.filter((r) => this.game.getRoleAlignment(r) == "Cult");
    roles = roles.filter(
      (r) =>
        this.game.getRoleTags(r).includes("Endangered") ||
        this.game.getRoleTags(r).includes("Kills Cultist") ||
        this.game.getRoleTags(r).includes("Demonic")
    );
    roles = roles.filter((r) => r.split(":")[0] != "Televangelist");

    if (roles.length <= 0) {
      roles = excessEndangered;
      roles = roles.filter((r) => this.game.getRoleAlignment(r) == "Cult");
      roles = roles.filter(
        (r) =>
          this.game.getRoleTags(r).includes("Endangered") ||
          this.game.getRoleTags(r).includes("Kills Cultist") ||
          this.game.getRoleTags(r).includes("Demonic")
      );
      roles = roles.filter((r) => r.split(":")[0] != "Televangelist");
    }
    if (roles.length <= 0) {
      roles = [`Imp:Demonic`];
    }

    role.player.factionFake = "Cult";

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
        this.player.holdItem("IsTheTelevangelist", this.player.role.modifier);

        let tempModifier = this.player.role.modifier;
        this.player.setRole(
          this.player.role.newRole,
          undefined,
          false,
          true,
          false,
          "No Change"
        );
        this.player.role.name = "Televangelist";
        let tempApp = {
          self: this.newRole,
        };
        this.player.role.editAppearance(tempApp);

        let role = this.player.addExtraRole(`${"Villager"}:${tempModifier}`);
        this.player.passiveExtraRoles.push(role);
      },
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.player.holdItem("IsTheTelevangelist", this.player.role.modifier);
        let tempModifier = this.player.role.modifier;
        this.player.setRole(
          this.newRole,
          undefined,
          false,
          true,
          false,
          "No Change",
          "RemoveStartingItems"
        );
        this.player.role.name = "Televangelist";
        let tempApp = {
          self: this.newRole,
        };
        this.player.role.editAppearance(tempApp);

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
  roles = roles.filter((r) => role.game.getRoleAlignment(r) == "Cult");
  roles = roles.filter(
    (r) =>
      role.game.getRoleTags(r).includes("Endangered") ||
      role.game.getRoleTags(r).includes("Kills Cultist") ||
      role.game.getRoleTags(r).includes("Demonic")
  );
  let excessEndangered = roles;

  roles = currentRoles;
  roles = roles.filter((r) => role.game.getRoleAlignment(r) == "Cult");
  roles = roles.filter(
    (r) =>
      role.game.getRoleTags(r).includes("Endangered") ||
      role.game.getRoleTags(r).includes("Kills Cultist") ||
      role.game.getRoleTags(r).includes("Demonic")
  );
  roles = roles.filter((r) => r.split(":")[0] != "Televangelist");

  if (roles.length <= 0) {
    roles = excessEndangered;
    roles = roles.filter((r) => role.game.getRoleAlignment(r) == "Cult");
    roles = roles.filter(
      (r) =>
        role.game.getRoleTags(r).includes("Endangered") ||
        role.game.getRoleTags(r).includes("Kills Cultist") ||
        role.game.getRoleTags(r).includes("Demonic")
    );
    roles = roles.filter((r) => r.split(":")[0] != "Televangelist");
  }
  if (roles.length <= 0) {
    roles = [`Imp:Demonic`];
  }

  role.player.factionFake = "Cult";

  role.newRole = Random.randArrayVal(roles);
  let tempApp = {
    self: role.newRole,
    reveal: role.newRole,
  };
  role.editAppearance(tempApp);
}
