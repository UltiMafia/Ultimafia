const Card = require("../../Card");
const roles = require("../../../../../data/roles");
const Random = require("../../../../../lib/Random");

module.exports = class AppearAsRandomRole extends Card {
  constructor(role) {
    super(role);

    const randomRole = Random.randArrayVal(
      Object.entries(roles.Mafia)
        .filter((roleData) => roleData[0] !== "Villager" || roleData[0] !== "Impersonator" || roleData[0] !== "Impersonator")
        .map((roleData) => roleData[0])
    );

    this.appearance = {
      reveal: randomRole,
      condemn: randomRole,
      death: randomRole,
      investigate: randomRole,
    };

    this.hideModifier = {
      reveal: true,
      condemn: true,
      death: true,
      investigate: true,
    };
  }
};
