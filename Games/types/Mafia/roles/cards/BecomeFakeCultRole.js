const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { CULT_FACTIONS } = require("../../const/FactionList");

module.exports = class BecomeFakeCultRole extends Card {
  constructor(role) {
    super(role);

    //this.startItems = ["IsTheTelevangelist"];
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

    this.player.factionFake = "Cult";

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
        this.player.holdItem("IsTheTelevangelist");

        let newRole = Random.randArrayVal(roles);
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
        this.player.holdItem("IsTheTelevangelist");
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
