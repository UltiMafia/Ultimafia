const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Utils = require("../../../../core/Utils");

module.exports = class SeeRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      See: {
        states: ["Night"],
        flags: ["voting"],
        inputType: "select",
        targets: ["2 Excess Roles", "1 Player Role"],
        action: {
          priority: -50,
          run() {
            if (this.target == "2 Excess Roles") {
              const roleIndexes = this.game.excessRoles.map((r, i) => i);

              const roleIndex1 = Random.randArrayVal(roleIndexes, true);
              const roleIndex2 = Random.randArrayVal(roleIndexes, true);

              const role1 = this.game.excessRoles[roleIndex1];
              const role2 = this.game.excessRoles[roleIndex2];

              this.actor.queueAlert(
                `The ${Utils.numToPos(
                  roleIndex1
                )} excess role is ${role1} and the ${Utils.numToPos(
                  roleIndex2
                )} excess role is ${role2}.`
              );
            } else if (this.target == "1 Player Role") {
              const players = this.game.players
                .array()
                .filter((p) => p != this.actor);
              const player = Random.randArrayVal(players);

              this.actor.queueAlert(
                `${player.name}'s role is ${player.role.name}.`
              );
            }
          },
        },
      },
    };
  }
};
