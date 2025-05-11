const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class AppearAsRandomEvil extends Card {
  constructor(role) {
    super(role);

    const evilRoles = role.game.PossibleRoles.filter(
      (r) =>
        role.game.getRoleAlignment(r) === "Cult" ||
        role.game.getRoleAlignment(r) === "Mafia"
    );

    const randomEvilRole = Random.randArrayVal(evilRoles);

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
