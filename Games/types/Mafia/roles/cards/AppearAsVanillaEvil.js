const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { appearanceKey, roleName } = require("../../../../../lib/roleIdentity");

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
      randomEvilRole = appearanceKey("Cultist");
    } else {
      randomEvilRole = appearanceKey("Mafioso");
    }

    // const roleAppearance = randomEvilRole.split(":")[0];

    const roleAppearance = appearanceKey(randomEvilRole);

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
