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
              `You are a retired ${currRole}. You remember a few people you worked with!`
        );

          for (const player of this.game.players) {
          if (player.role.name == currRole) {
            player.role.revealToPlayer(this.player);
          }
          }
        this.drop();
      },
    };
  }
};
