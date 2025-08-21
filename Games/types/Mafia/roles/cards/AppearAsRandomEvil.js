const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class AppearAsRandomEvil extends Card {
  constructor(role) {
    super(role);

    //role.game.sendAlert(`${role.getAllRoles().join(", ")}`);

    let evilRoles = role
      .getAllRoles()
      .filter(
        (r) =>
          (role.game.getRoleAlignment(r) === "Cult" ||
            role.game.getRoleAlignment(r) === "Mafia") &&
          !role.game.getRoleTags(r).includes("No Investigate")
      );

    let millers = [];

    let temp = evilRoles.filter((p) => p);
    if (role.name == "Miller") {
      for (let player of this.game.players) {
        if (player.role && player.role.name == "Miller") {
          temp = evilRoles.filter(
            (p) => p != player.role.appearance["condemn"]
          );
        }
      }
    }
    if (temp.length > 0) {
      evilRoles = temp;
    }

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
