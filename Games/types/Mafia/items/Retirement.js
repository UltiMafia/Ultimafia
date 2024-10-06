const Item = require("../Item");

module.exports = class Retirement extends Item {
  constructor(currRole) {
    super("Retirement");

    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.currRole = currRole;

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.holder) {
          return;
        }

         this.holder.queueAlert(
              `You are a retired ${this.currRole}. You remember a few people you worked with!`
        );

          for (const player of this.game.players) {
          if (player.role.name == this.currRole) {
            player.role.revealToPlayer(this.holder);
          }
          }
        this.drop();
      },
    };
  }
};
