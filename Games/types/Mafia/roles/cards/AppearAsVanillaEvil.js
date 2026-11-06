const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { roleKey, roleName } = require("../../../../../lib/roleIdentity");

module.exports = class AppearAsVanillaEvil extends Card {
  constructor(role) {
    super(role);

    const evilRoles = role
      .getAllRoles()
      .filter(
        (r) =>
          role.game.getRoleAlignment(roleName(r)) === "Cult" ||
          role.game.getRoleAlignment(roleName(r)) === "Mafia"
      );

    let randomEvilRole = Random.randArrayVal(evilRoles);

    if (this.game.getRoleAlignment(roleName(randomEvilRole)) == "Cult") {
      randomEvilRole = roleKey("Cultist");
    } else {
      randomEvilRole = roleKey("Mafioso");
    }

    // const roleAppearance = randomEvilRole.split(":")[0];

    const roleAppearance = roleKey(randomEvilRole);

    const selfAppearance = role.name == "Miller" ? "Villager" : "real";

    let tempApp = {
      reveal: roleAppearance,
      condemn: roleAppearance,
      investigate: roleAppearance,
    };
    this.editAppearance(tempApp);

    this.hideModifier = {
      condemn: true,
      investigate: true,
    };
  }
};
