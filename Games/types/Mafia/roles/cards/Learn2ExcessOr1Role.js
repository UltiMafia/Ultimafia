const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class Learn2ExcessOr1Role extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      See: {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        targets: ["2 Excess Roles", "1 Player Role"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          labels: ["investigate"],
          run: function () {
            if (this.target == "2 Excess Roles") {
              let info = this.game.createInformation(
                "ExcessRolesInfo",
                this.actor,
                this.game,
                2,
                false
              );
              info.processInfo();
              var alert = `:invest: ${info.getInfoFormated()}.`;
              this.actor.queueAlert(alert);
              /*
              let roles = this.game.PossibleRoles.filter((r) => r);
              let players = this.game.players.filter((p) => p.role);
              let currentRoles = [];

              for (let x = 0; x < players.length; x++) {
                currentRoles.push(players[x].role);
              }
              for (let y = 0; y < currentRoles.length; y++) {
                roles = roles.filter(
                  (r) => r.split(":")[0] != currentRoles[y].name
                );
              }

              if (this.actor.hasEffect("FalseMode")) {
                roles = currentRoles.map((r) => r.name);
              }

              if (roles.length <= 0) {
                this.actor.queueAlert(`There are 0 excess roles.`);
              } else if (roles.length == 1) {
                var role1 = roles[0];
                this.actor.queueAlert(
                  `There is only 1 excess role. The Excess role is ${role1}`
                );
              } else {
                var roleIndexes = roles.map((r, i) => i);
                var roleIndex1 = Random.randArrayVal(roleIndexes, true);
                var roleIndex2 = Random.randArrayVal(roleIndexes, true);
                var role1 = roles[roleIndex1];
                var role2 = roles[roleIndex2];

                this.actor.queueAlert(
                  `2 of the excess roles are ${role1} and ${role2}.`
                );
              }
*/
              return;
            } else if (this.target == "1 Player Role") {
              let info = this.game.createInformation(
                "RoleInfo",
                this.actor,
                this.game
              );
              info.processInfo();
              var alert = `:invest: ${info.getInfoFormated()}.`;
              this.actor.queueAlert(alert);
            }

            //End If/else
          },
        },
      },
    };
  }
};
//};
