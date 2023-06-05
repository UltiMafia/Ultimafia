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
          run: function () {
            if (this.target == "2 Excess Roles") {
              var roleIndexes = this.game.excessRoles.map((r, i) => i);

              var roleIndex1 = Random.randArrayVal(roleIndexes, true);
              var roleIndex2 = Random.randArrayVal(roleIndexes, true);

              var role1 = this.game.excessRoles[roleIndex1];
              var role2 = this.game.excessRoles[roleIndex2];

              this.actor.queueAlert(
                `The ${Utils.numToPos(
                  roleIndex1
                )} excess role is ${role1} and the ${Utils.numToPos(
                  roleIndex2
                )} excess role is ${role2}.`
              );
            } else if (this.target == "1 Player Role") {
              var players = this.game.players
                .array()
                .filter((p) => p != this.actor);
              var player = Random.randArrayVal(players);

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
