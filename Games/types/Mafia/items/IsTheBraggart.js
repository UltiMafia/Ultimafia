const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_FULL_DISABLE } = require("../const/Priority");

module.exports = class IsTheBraggart extends Item {
  constructor(modifier) {
    super("IsTheBraggart");

    this.modifier = modifier;

    this.lifespan = lifespan || Infinity;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.listeners = {
      state: function (stateInfo) {
        //if (this.game.getStateName() != "Night") return;
        if (!this.holder.alive) return;

        this.action = new Action({
          actor: this.holder,
          target: this.holder,
          game: this.game,
          item: this,
          priority: PRIORITY_FULL_DISABLE + 1,
          labels: ["hidden", "block"],
          run: function () {
            this.target.role.name = "Braggart";
            this.target.role.appearance.death = "Braggart";
            this.target.role.appearance.reveal = "Braggart";
            this.target.role.appearance.investigate = "Braggart";
            this.target.role.appearance.condemn = "Braggart";
            this.target.role.modifier = this.item.modifier;
              /*
            this.target.role.hideModifier = {
              death: true,
              reveal: true,
              investigate: true,
              condemn: true,
            };
            */

            this.target.role.data.banished = true;

            for (let item of this.target.items) {
              item.broken = true;
            }

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

        if (this.holder.role.alignment != "Village") {
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
            this.target.role.appearance.death = "Braggart";
            this.target.role.appearance.reveal = "Braggart";
            this.target.role.appearance.investigate = "Braggart";
            this.target.role.appearance.condemn = "Braggart";
            this.target.role.modifier = this.item.modifier;
            /*
            this.target.role.hideModifier = {
              death: true,
              reveal: true,
              investigate: true,
              condemn: true,
            };
            */
            this.target.role.data.banished = true;

            for (let item of this.target.items) {
              item.broken = true;
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
