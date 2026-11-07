const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { appearanceKey, roleName } = require("../../../../../lib/roleIdentity");

module.exports = class AppearAsVillagePRrOnDeath extends Card {
  constructor(role) {
    super(role);

    let villageRoles = role
      .getAllRoles()
      .filter(
        (r) =>
          role.game.getRoleAlignment(roleName(r)) === "Village" &&
          roleName(r) != "Villager" &&
          !role.game.getRoleTags(roleName(r)).includes("No Investigate")
      );

    let temp = villageRoles.filter((p) => p);
    if (temp.length <= 0) {
      villageRoles = ["Cop"];
    }

    const randomVillageRole = Random.randArrayVal(villageRoles);

    // const roleAppearance = randomEvilRole.split(":")[0];

    const roleAppearance = appearanceKey(randomVillageRole);

    let tempApp = {
      condemn: roleAppearance,
      death: roleAppearance,
    };
    this.editAppearance(tempApp);

    this.hideModifier = {
      condemn: true,
      death: true,
    };
  }
};
