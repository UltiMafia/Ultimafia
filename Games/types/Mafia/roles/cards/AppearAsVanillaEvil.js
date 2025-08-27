const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class AppearAsVanillaEvil extends Card {
  constructor(role) {
    super(role);

    const evilRoles = role
      .getAllRoles()
      .filter(
        (r) =>
          role.game.getRoleAlignment(r) === "Cult" ||
          role.game.getRoleAlignment(r) === "Mafia"
      );

    let randomEvilRole = Random.randArrayVal(evilRoles);

    if (this.game.getRoleAlignment(randomEvilRole) == "Cult") {
      randomEvilRole = "Cultist";
    } else {
      randomEvilRole = "Mafioso";
    }

    // const roleAppearance = randomEvilRole.split(":")[0];

    const roleAppearance = randomEvilRole;

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
      reveal: true,
    };
  }
};
