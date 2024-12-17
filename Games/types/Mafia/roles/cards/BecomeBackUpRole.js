const Card = require("../../Card");

module.exports = class BecomeBackUpRole extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
        roleAssigned: function (player) {
        if (this.player == player) {
        let target;
          if (
          this.data.FromBackUpModifier &&
          this.game.players.filter(
            (p) =>
              p.role.name == this.data.FromBackUpModifier &&
              p !== this.player
          ).length > 0
        ) {
          target = Random.randArrayVal(
            this.game.players.filter(
              (p) =>
                p.role.name == this.data.FromBackUpModifier &&
                p !== this.player
            )
          );
        }
        else if(this.player.role.name == "Devotee" && (this.data.FromBackUpModifier == null)){
        return;
        }
        else if(this.player.role.aligment != "Independent"){
          target = Random.randArrayVal(
          this.game.players.filter(
            (p) => p.role.alignment === this.player.role.alignment && this.player.role.name !== p.role.name
          )
        );
        }
        else{
         target = Random.randArrayVal(
            this.game.players.filter(
            (p) => this.player.role.name !== p.role.name
          )
        );
        }

        if(target){
          this.data.RoleTargetBackup = target.role.name;
          this.player.queueAlert(`Your Target is ${target.role.name}, If a ${target.role.name} dies, you will replace them!`);
        }
         else {
          this.player.queueAlert("No possible Targets…");
           let newRole = "Survivor";
           if(this.data.FromBackUpModifier != null){
            newRole = this.data.FromBackUpModifier;
           }
          else if (this.player.role.alignment == "Village") {
          newRole = "Villager";
        } else if (this.player.role.alignment == "Mafia") {
          newRole = "Mafioso";
        } else if (this.player.role.alignment == "Cult") {
          newRole = "Cultist";
        }
      this.player.setRole(
          newRole,
          undefined,
          false,
          true,
          false,
          "No Change"
        );
        }
        }
        else if(this.data.RoleTargetBackup && this.player){
          let playersWithRole = this.game.alivePlayers().filter(
            (p) =>  this.data.RoleTargetBackup !== p.role.name
          );
          if(playersWithRole.length <= 0){
            this.player.setRole(
            `${player.role.name}:${player.role.modifier}`,
            player.role.data
          );
          }
        }
      },
      death: function (player) {
        if (
          player !== this.player &&
          player.role.name === this.data.RoleTargetBackup &&
          this.player.alive
        ) {
          this.player.setRole(
            `${player.role.name}:${player.role.modifier}`,
            player.role.data
          );
        }
      },
    };
  }
};
