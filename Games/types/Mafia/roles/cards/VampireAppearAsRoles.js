const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { roleKey, roleName } = require("../../../../../lib/roleIdentity");

module.exports = class VampireAppearAsRoles extends Card {
  constructor(role) {
    super(role);

    const evilRoles = role
      .getAllRoles()
      .filter(
        (r) =>
          role.game.getRoleAlignment(roleName(r)) === "Cult" ||
          role.game.getRoleAlignment(roleName(r)) === "Mafia"
      );

    let randomNonVampire = evilRoles.filter(
      (r) => roleName(r) != "Vampire"
    );

    if (randomNonVampire.length <= 0) return;

    const randomEvilRole = Random.randArrayVal(randomNonVampire);

    const roleAppearance = roleKey(randomEvilRole);

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
