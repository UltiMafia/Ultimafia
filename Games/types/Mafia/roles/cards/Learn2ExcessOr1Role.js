const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class Learn2ExcessOr1Role extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      See: {
        states: ["Night"],
        flags: ["voting"],
        inputType: "select",
        targets: ["2 Excess Roles", "1 Player Role"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          labels: ["investigate"],
          run: function () {
            if (this.target == "2 Excess Roles") {

              let roles = this.game.PossibleRoles;
              let currentRoles = [];
              for (let x = 0; x < this.game.players.length; x++) {
                currentRoles.push(this.game.players[x].role);
              }
              for (let x = 0; x < roles.length; x++) {
                if (currentRoles.includes(roles[x])) {
                  roles.slice(roles.indexOf(roles[x]), 1);
                }
              }

              if(roles.length == 0){
                this.actor.queueAlert(
                `There are 0 excess roles.`);
              }
              else if(roles.length == 1){
                var role1 = roles [0];
                this.actor.queueAlert(
                `There is only 1 excess role. The Excess role is ${role1}`);
              }
              else{

              
              var roleIndexes = roles.map((r, i) => i);
              var roleIndex1 = Random.randArrayVal(roleIndexes, true);
              var roleIndex2 = Random.randArrayVal(roleIndexes, true);
              var role1 = roles[roleIndex1];
              var role2 = roles[roleIndex2];

              this.actor.queueAlert(
                `The 2 of the excess roles are ${role1} and ${role2}.`
              );
              }
            } else if (this.target == "1 Player Role") {
              var players = this.game.players
                .array()
                .filter((p) => p != this.actor);
              var player = Random.randArrayVal(players);
              var role = player.getRoleAppearance();
              this.actor.queueAlert(
                `${player.name}'s role is ${role}.`
              );
            }
          },
        },
      },
    }
    };
  }
};
