const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class VampireAppearAsRoles extends Card {
  constructor(role) {
    super(role);

    const evilRoles = role
      .getAllRoles()
      .filter(
        (r) =>
          role.game.getRoleAlignment(r) === "Cult" ||
          role.game.getRoleAlignment(r) === "Mafia"
      );

    let randomNonVampire = evilRoles.filter(
      (r) => r.split(":")[0] != "Vampire"
    );

    if (randomNonVampire.length <= 0) return;

    const randomEvilRole = Random.randArrayVal(randomNonVampire);

    const roleAppearance = randomEvilRole;

    //const selfAppearance = role.name == "Miller" ? "Villager" : "real";

    let tempApp = {
      condemn: roleAppearance,
      death: roleAppearance,
      investigate: roleAppearance,
    };
    this.editAppearance(tempApp);

    this.hideModifier = {
      condemn: true,
      investigate: true,
    };
  }
};
