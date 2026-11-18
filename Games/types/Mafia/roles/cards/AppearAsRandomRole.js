const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { appearanceKey, roleName } = require("../../../../../lib/roleIdentity");

module.exports = class AppearAsRandomRole extends Card {
  constructor(role) {
    super(role);

    let evilRoles = role
      .getAllRoles()
      .filter(
        (r) =>
          roleName(r) != "Villager" &&
          roleName(r) != "Imposter" &&
          roleName(r) != "Impersonator" &&
          roleName(r) != "Skinwalker" &&
          !role.game.getRoleTags(roleName(r)).includes("No Investigate")
      );

    if (evilRoles.length <= 0) {
      evilRoles = ["Cop:"];
    }

    const randomEvilRole = Random.randArrayVal(evilRoles);

    // const roleAppearance = randomEvilRole.split(":")[0];

    const roleAppearance = appearanceKey(randomEvilRole);

    const selfAppearance = role.name == "Miller" ? "Villager" : "real";

    let tempApp = {
      reveal: roleAppearance,
      condemn: roleAppearance,
      investigate: roleAppearance,
      death: roleAppearance,
    };
    this.editAppearance(tempApp);
    this.hideModifier = {
      condemn: true,
      investigate: true,
      reveal: true,
      death: true,
    };
  }
  /*
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        let roles = [];

        for (let player of this.game.players) {
          let roleName = player.role.name;
          if (
            roleName != "Villager" &&
            roleName != "Imposter" &&
            roleName != "Impersonator" &&
            roleName != "Skinwalker"
          ) {
            roles.push(roleName);
          }
        }

        const roleAppearance = Random.randArrayVal(roles);
        this.player.holdItem("Suit", { type: roleAppearance, concealed: true });
        this.player.queueAlert(roleAppearance);
      },
    };
*/
};
