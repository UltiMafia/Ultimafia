const Item = require("../Item");
const Action = require("../Action");
const Player = require("../../../core/Player");
const Random = require("../../../../lib/Random");
const { PRIORITY_FULL_DISABLE } = require("../const/Priority");

module.exports = class IsTheTelevangelist extends Item {
  constructor(modifier) {
    super("IsTheTelevangelist");

    this.modifier = modifier;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.roleAssignedCounter = 0;
    this.listeners = {
      state: function (stateInfo) {
        //if (this.game.getStateName() != "Night") return;
        if (!this.holder.alive) return;

        this.action = new Action({
          actor: this.holder,
          target: this.holder,
          game: this.game,
          priority: PRIORITY_FULL_DISABLE + 1,
          labels: ["hidden", "block"],
          item: this,
          run: function () {
            if (this.roleAssignedCounter > 1) {
              return;
            }
            this.target.role.alignment = "Village";
            this.target.role.name = "Televangelist";
            this.target.role.appearance.death = "Televangelist";
            this.target.role.appearance.reveal = "Televangelist";
            this.target.role.appearance.investigate = "Televangelist";
            this.target.role.appearance.condemn = "Televangelist";
             this.target.role.appearanceMods.death = this.item.modifier;
            this.target.role.appearanceMods.reveal = this.item.modifier;
            this.target.role.appearanceMods.investigate = this.item.modifier;
            this.target.role.appearanceMods.condemn = this.item.modifier;
            //this.target.role.modifier = this.item.modifier;
            /*
            this.target.role.hideModifier = {
              death: true,
              reveal: true,
              investigate: true,
              condemn: true,
            };
            */
            this.target.role.data.banished = true;

            if (this.dominates(this.target)) {
              this.blockWithDelirium(this.target);
            }
          },
        });

        this.game.queueAction(this.action);
      },
      roleAssigned: function (player) {
        //if (this.game.getStateName() != "Night") return;
        if (!this.holder.alive) return;
        if (player !== this.player) {
          return;
        }

        this.roleAssignedCounter = this.roleAssignedCounter + 1;
        if (this.roleAssignedCounter > 1) {
          this.drop();
          return;
        }

        if (this.holder.faction != "Village") {
          this.drop();
          return;
        }

        this.action = new Action({
          actor: this.holder,
          target: this.holder,
          game: this.game,
          item: this,
          priority: PRIORITY_FULL_DISABLE + 1,
          labels: ["hidden", "block"],
          run: function () {
            this.target.role.alignment = "Village";
            this.target.role.appearance.death = "Televangelist";
            this.target.role.appearance.reveal = "Televangelist";
            this.target.role.appearance.investigate = "Televangelist";
            this.target.role.appearance.condemn = "Televangelist";
             this.target.role.appearanceMods.death = this.item.modifier;
            this.target.role.appearanceMods.reveal = this.item.modifier;
            this.target.role.appearanceMods.investigate = this.item.modifier;
            this.target.role.appearanceMods.condemn = this.item.modifier;
            //this.target.role.modifier = this.item.modifier;
            /*
            this.target.role.hideModifier = {
              death: true,
              reveal: true,
              investigate: true,
              condemn: true,
            };
            */
            this.target.role.data.banished = true;

            let cultPlayers = this.game.players.filter(
              (p) => p.role.alignment == "Cult"
            );

            for (let x = 0; x < cultPlayers.length; x++) {
              cultPlayers[x].queueAlert(
                `You learn that ${this.target.name} is the ${this.target.role.name} !`
              );
            }

            if (this.dominates(this.target)) {
              this.blockWithDelirium(this.target);
            }
          },
        });

        this.game.queueAction(this.action);
      },
    };
  }
};
