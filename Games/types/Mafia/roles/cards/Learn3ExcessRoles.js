const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class Learn3ExcessRoles extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        run: function () {
          if (!this.actor.alive) return;
          if (this.game.getStateName() != "Night") return;
          if (this.actor.role.hasInfo) return;


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

            if(this.player.role.alignment == "Mafia" || this.player.role.alignment == "Cult"){
              for (let x = 0; x < roles.length; x++) {
                if (this.game.getRoleAlignment(roles[x]) != "Village") {
                  roles.slice(roles.indexOf(roles[x]), 1);
                }
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
              else if(roles.length == 2){
                var role1 = roles [0];
                var role2 = roles [1];
                this.actor.queueAlert(
                `There is only 2 excess roles. The Excess roles are ${role1} and ${role2}`);
              }
              else{

              
              var roleIndexes = roles.map((r, i) => i);
              var roleIndex1 = Random.randArrayVal(roleIndexes, true);
              var roleIndex2 = Random.randArrayVal(roleIndexes, true);
              var roleIndex3 = Random.randArrayVal(roleIndexes, true);
              var role1 = this.game.ExcessRoles[roleIndex1];
              var role2 = this.game.ExcessRoles[roleIndex2];
              var role3 = this.game.ExcessRoles[roleIndex3];

              this.actor.queueAlert(
                `The ${Utils.numToPos(
                  roleIndex1
                )} excess role is ${role1}, the ${Utils.numToPos(
                  roleIndex2
                )} excess role is ${role2}, and ${Utils.numToPos(
                  roleIndex1
                )} excess role is ${role3}.`
              );
              }


          
          this.actor.role.hasInfo = true;
        },
      },
    ];
  }
};
