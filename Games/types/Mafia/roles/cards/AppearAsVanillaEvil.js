const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class AppearAsVanillaEvil extends Card {
  constructor(role) {
    super(role);

    const evilRoles = role.game.PossibleRoles.filter(
      (r) =>
        role.game.getRoleAlignment(r) === "Cult" ||
        role.game.getRoleAlignment(r) === "Mafia"
    );

    const randomEvilRole = Random.randArrayVal(evilRoles);

    if(this.game.getRoleAlignment(randomEvilRole) == "Cult"){
      randomEvilRole = "Cultist";
    }
    else{
      randomEvilRole = "Mafioso";
    }

    // const roleAppearance = randomEvilRole.split(":")[0];

    const roleAppearance = randomEvilRole;

    const selfAppearance = role.name == "Miller" ? "Villager" : "real";
    
    this.appearance = {
      self: selfAppearance,
      reveal: roleAppearance,
      condemn: roleAppearance,
      death: "real",
      investigate: roleAppearance,
    };

    this.hideModifier = {
      condemn: true,
      investigate: true,
    };
  }
};
