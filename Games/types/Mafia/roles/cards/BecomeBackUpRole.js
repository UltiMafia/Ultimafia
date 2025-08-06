const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class BecomeBackUpRole extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (this.player == player) {
          let target;
          if (this.data.FromBackUpModifier) {
            target = this.data.FromBackUpModifier;
            this.data.RoleTargetBackup = this.data.FromBackUpModifier;
          } else if (
            this.player.role.name == "Devotee" &&
            this.data.FromBackUpModifier == null
          ) {
            return;
          } else if (this.player.role.aligment != "Independent") {
            target = Random.randArrayVal(
              this.game.players.filter(
                (p) =>
                  p.role.alignment === this.player.role.alignment &&
                  this.player.role.name !== p.role.name
              )
            );
          } else {
            target = Random.randArrayVal(
              this.game.players.filter(
                (p) => this.player.role.name !== p.role.name
              )
            );
          }

          if (target) {
            if (this.data.FromBackUpModifier == null) {
              this.data.RoleTargetBackup = target.role.name;
            }
            this.player.queueAlert(
              `Your Target is ${this.data.RoleTargetBackup}, If a ${this.data.RoleTargetBackup} dies, you will replace them!`
            );
            this.game.events.emit("AbilityToggle", this.player);
          } else {
            this.player.queueAlert("No possible Targets…");
            let newRole = "Survivor";
            if (this.data.FromBackUpModifier != null) {
              newRole = this.data.FromBackUpModifier;
            } else if (this.player.role.alignment == "Village") {
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

        if (
          this.data.RoleTargetBackup != null &&
          this.hasAbility(["Convert"])
        ) {
          let playersWithRole = this.game
            .alivePlayers()
            .filter((p) => this.data.RoleTargetBackup == p.role.name);
          if (playersWithRole.length <= 0) {
            this.player.setRole(
              `${this.data.RoleTargetBackup}`,
              undefined,
              false,
              false,
              false,
              "No Change"
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
            player.role.data,
            false,
            false,
            false,
            "No Change"
          );
        }
      },
    };
  }
};
