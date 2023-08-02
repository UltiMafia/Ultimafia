const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class BecomeInsaneRole extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      reroll: function (player) {
        if (player != this.player) return;

        let roles = this.game.excessRoles["Villager"];
        let newRole = Random.randArrayVal(roles);
        this.player.setRole(newRole, undefined, false, true);
        roles.slice(roles.indexOf(newRole), 1);
        this.game.excessRoles["Villager"] = roles;
        this.player.giveEffect("Insanity");
        this.player.giveEffect("PermanentInsanity", true);
      },
    };

    this.reroll = true;
  }
};
