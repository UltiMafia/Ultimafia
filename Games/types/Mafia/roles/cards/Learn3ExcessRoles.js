const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class Learn3ExcessRoles extends Card {
  constructor(role) {
    super(role);
/*
    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        run: function () {
          if (!this.actor.alive) return;
          if (this.game.getStateName() != "Night") return;
          if (this.actor.role.data.hasExcessRoles) return;
          this.actor.role.data.hasExcessRoles = true;

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

          if (
            this.actor.role.alignment == "Mafia" ||
            this.actor.role.alignment == "Cult"
          ) {
            roles = roles.filter(
              (r) => this.game.getRoleAlignment(r) == "Village"
            );
            /*
              for (let x = 0; x < roles.length; x++) {
                if (this.game.getRoleAlignment(roles[x]) != "Village") {
                  roles.slice(roles.indexOf(roles[x]), 1);
                }
              }
                
          }

          if (roles.length <= 0) {
            this.actor.queueAlert(`There are 0 excess roles.`);
          } else if (roles.length == 1) {
            var role1 = roles[0];
            this.actor.queueAlert(
              `There is only 1 excess role. The Excess role is ${role1}`
            );
          } else if (roles.length == 2) {
            var role1 = roles[0];
            var role2 = roles[1];
            this.actor.queueAlert(
              `There is only 2 excess roles. The Excess roles are ${role1} and ${role2}`
            );
          } else {
            var roleIndexes = roles.map((r, i) => i);
            var roleIndex1 = Random.randArrayVal(roleIndexes, true);
            var roleIndex2 = Random.randArrayVal(roleIndexes, true);
            var roleIndex3 = Random.randArrayVal(roleIndexes, true);
            var role1 = roles[roleIndex1];
            var role2 = roles[roleIndex2];
            var role3 = roles[roleIndex3];

            this.actor.queueAlert(
              `3 excess roles are ${role1}, ${role2}, and ${role3}.`
            );
          }
        },
      },
    ];
*/
    this.listeners = {
    roleAssigned: function (player) {
      if (player !== this.player) {
        return;
      }
      if (this.player.role.data.hasExcessRoles != false && this.player.role.data.hasExcessRoles != null) return;
        if (!this.player.alive) return;
        if (this.player.role.data.hasExcessRoles == true) return;
        this.player.role.data.hasExcessRoles = true;

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

        if (this.player.hasEffect("FalseMode")) {
          roles = currentRoles.map((r) => r.name);
        }

        if (
          this.player.role.alignment == "Mafia" ||
          this.player.role.alignment == "Cult"
        ) {
          roles = roles.filter(
            (r) => this.game.getRoleAlignment(r) == "Village"
          );
        }

        if (roles.length <= 0) {
          this.player.queueAlert(`There are 0 excess roles.`);
        } else if (roles.length == 1) {
          var role1 = roles[0];
          this.player.queueAlert(
            `There is only 1 excess role. The Excess role is ${role1}`
          );
        } else if (roles.length == 2) {
          var role1 = roles[0];
          var role2 = roles[1];
          this.player.queueAlert(
            `There is only 2 excess roles. The Excess roles are ${role1} and ${role2}`
          );
        } else {
          var roleIndexes = roles.map((r, i) => i);
          var roleIndex1 = Random.randArrayVal(roleIndexes, true);
          var roleIndex2 = Random.randArrayVal(roleIndexes, true);
          var roleIndex3 = Random.randArrayVal(roleIndexes, true);
          var role1 = roles[roleIndex1];
          var role2 = roles[roleIndex2];
          var role3 = roles[roleIndex3];

          this.player.queueAlert(
            `3 excess roles are ${role1}, ${role2}, and ${role3}.`
          );
        }
    },
  }


  }
};
