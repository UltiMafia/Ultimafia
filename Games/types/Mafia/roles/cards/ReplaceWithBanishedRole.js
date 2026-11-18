const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { roleEquals, roleName, roleModifiers, normalizeRole } = require("../../../../../lib/roleIdentity");

module.exports = class ReplaceWithBanishedRole extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      replaceWithBanished: function (player) {
        let banishedRoles = this.game.banishedRoles;
        let currentRoles = this.game.players.map((p) => p.role.toRoleData());
        let currentBanished = currentRoles.filter(
          (r) => roleModifiers(r).split("/").includes("Banished")
        );
        let tempBanished = banishedRoles.filter(
          (b) => !currentBanished.some((current) => roleEquals(current, b))
        );
        if (tempBanished.length <= 0) {
          if (banishedRoles.length <= 0) {
            banishedRoles = [
              "Villager:Banished",
              "Mafioso:Banished",
              "Cultist:Banished",
              "Grouch:Banished",
            ];
          }
          tempBanished = banishedRoles;
        }
        if (this.name != "Banished Any") {
          tempBanished = tempBanished.filter(
            (r) => this.game.getRoleAlignment(roleName(r)) == this.alignment
          );
          if (tempBanished.length <= 0) {
            tempBanished = [
              "Villager:Banished",
              "Mafioso:Banished",
              "Cultist:Banished",
              "Grouch:Banished",
            ].filter(
              (r) =>
                this.game.getRoleAlignment(roleName(r)) == this.alignment
            );
          }
        }
        let newRole = normalizeRole(Random.randArrayVal(tempBanished));
        this.player.setRole(
          newRole,
          undefined,
          false,
          true,
          null,
          null,
          "RemoveStartingItems"
        );
      },
    };
  }
};
