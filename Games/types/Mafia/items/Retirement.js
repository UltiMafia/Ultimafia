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
        /*
        let players = this.game.players.filter(
          (p) => p.role.name == this.currRole
        );

        if (players.length <= 0) {
          this.holder.queueAlert(
            `You are a retired ${this.currRole}. You know that no one in this town is a ${this.currRole}`
          );
        } else {
          this.holder.queueAlert(
            `You are a retired ${this.currRole}. You remember a few people you worked with!`
          );
        }
        */

        let info = this.game.createInformation(
          "RevealPlayersWithRoleInfo",
          this.holder,
          this.game,
          null,
          this.currRole
        );
        info.processInfo();
        info.getInfoRaw();

        if (info.mainInfo.length <= 0) {
          this.holder.queueAlert(
            `You are a retired ${this.currRole}. You know that no one in this town is a ${this.currRole}`
          );
        } else {
          this.holder.queueAlert(
            `You are a retired ${this.currRole}. You remember a few people you worked with!`
          );
        }

        /*
        for (const player of this.game.players) {
          if (player.role.name == this.currRole) {
            player.role.revealToPlayer(this.holder);
          }
        }
        */
        this.drop();
      },
    };
  }
};
