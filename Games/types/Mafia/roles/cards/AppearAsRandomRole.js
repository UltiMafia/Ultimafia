const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class AppearAsRandomRole extends Card {
  constructor(role) {
    super(role);


    let evilRoles = role
      .getAllRoles()
      .filter(
        (r) =>  if (
            role.split(":")[0] != "Villager" &&
            role.split(":")[0] != "Imposter" &&
            role.split(":")[0] != "Impersonator" &&
            role.split(":")[0] != "Skinwalker"
          ) {
            roles.push(roleName);
          }
           &&
          !role.game.getRoleTags(r).includes("No Investigate")
      );

    let millers = [];

    let temp = evilRoles.filter((p) => p);
    if(evilRoles.length <= 0){
    evilRoles = ["Cop:"];
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
  }
};
