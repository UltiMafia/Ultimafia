const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Utils = require("../../../../core/Utils");

module.exports = class BecomeExcessRole extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: 25,
        run() {
          if (this.game.getStateName() != "Night") return;

          if (this.game.excessRoles.length == 0) return;

          const oldRoleName = this.actor.role.name;
          const excessRoleIndex = Random.randInt(
            0,
            this.game.excessRoles.length - 1
          );

          this.actor.setRole(
            this.game.excessRoles[excessRoleIndex],
            null,
            true
          );
          this.game.excessRoles[excessRoleIndex] = oldRoleName;

          this.actor.queueAlert(
            `You became the ${Utils.numToPos(excessRoleIndex + 1)} excess role.`
          );
        },
      },
    ];
  }
};
