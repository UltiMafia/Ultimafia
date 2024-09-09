const Item = require("../Item");
const Action = require("../Action");
const Player = require("../../../core/Player");
const Random = require("../../../../lib/Random");
const { PRIORITY_FULL_DISABLE } = require("../const/Priority");

module.exports = class IsTheHierophant extends Item {
  constructor(lifespan) {
    super("IsTheHierophant");

    this.lifespan = lifespan || Infinity;
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
          run: function () {
            if (this.roleAssignedCounter > 1) {
              return;
            }
            this.target.role.alignment = "Village";
            this.target.role.name = "Hierophant";
            this.target.role.appearance.death = "Hierophant";
            this.target.role.appearance.reveal = "Hierophant";
            this.target.role.appearance.investigate = "Hierophant";
            this.target.role.appearance.condemn = "Hierophant";
            this.target.role.hideModifier = {
              death: true,
              reveal: true,
              investigate: true,
              condemn: true,
            };

            this.target.role.data.banished = true;

            if (this.dominates(this.target)) {
              this.blockWithMindRot(this.target);
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

        if (this.holder.role.alignment == "Mafia") {
          this.drop();
          return;
        }

        this.action = new Action({
          actor: this.holder,
          target: this.holder,
          game: this.game,
          priority: PRIORITY_FULL_DISABLE + 1,
          labels: ["hidden", "block"],
          run: function () {
            this.target.role.alignment = "Village";
            this.target.role.appearance.death = "Hierophant";
            this.target.role.appearance.reveal = "Hierophant";
            this.target.role.appearance.investigate = "Hierophant";
            this.target.role.appearance.condemn = "Hierophant";
            this.target.role.hideModifier = {
              death: true,
              reveal: true,
              investigate: true,
              condemn: true,
            };

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
              this.blockWithMindRot(this.target);
            }
          },
        });

        this.game.queueAction(this.action);
      },
    };
  }
};
