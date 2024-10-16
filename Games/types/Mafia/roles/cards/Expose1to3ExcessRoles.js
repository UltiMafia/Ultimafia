const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT } = require("../../const/Priority");

module.exports = class Expose1to3ExcessRoles extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      See: {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        targets: [1, 2, 3],
        action: {
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT-10,
          labels: ["investigate"],
          run: function () {
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
            roles = Random.randomizeArray(roles);

              if (roles.length <= 0) {
                this.actor.queueAlert(`There are 0 excess roles.`);
              } 
              else if (roles.length == 1 || this.target == 1) {
                var role1 = roles[0];
                if(roles.length == 1){
                this.actor.queueAlert(
                  `There is only 1 excess role.`
                );
                }
                  this.game.queueAlert(`${this.actor.role.name} reveals that 1 of the Excess roles is ${role1}`);
                
              } 
            else if (roles.length == 2 || this.target == 2) {
                var role1 = roles[0];
                var role2 = roles[1];
                if(roles.length == 2){
                this.game.queueAlert(
                  `There are only 2 excess roles and the Excess roles is ${role1}`
                );
                }
                  this.game.queueAlert(`${this.actor.role.name} reveals that 2 of the Excess roles are ${role1} and ${role2}`);
              }
            else {
                var role1 = roles[0];
                var role2 = roles[1];
                var role3 = roles[2];
                  this.game.queueAlert(`${this.actor.role.name} reveals that 2 of the Excess roles are ${role1}, ${role2}, and ${role3}`);
              }

              return;
            

            //End If/else
          },
        },
      },
    };
  }
};
//};
