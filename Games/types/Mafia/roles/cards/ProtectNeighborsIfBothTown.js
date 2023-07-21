const Card = require("../../Card");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");

module.exports = class ProtectNeighborsIfBothTown extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function () {
        if (!this.player.alive) return;

        let alive = this.game.alivePlayers();
        let index = alive.indexOf(this.player);

        var left = alive[index-1]
        if (index == (alive.length - 1)){
          var right = alive[0];
        } else {
          var right = alive[index+1];
        }

        this.player.role.data.left = left;
        this.player.role.data.left = right;

        if (left.role.alignment == "Village" &&
          right.role.alignment == "Village"){
          left.giveEffect("Immortal", this.player, this.player.role.data.right);
          right.giveEffect("Immortal", this.player, this.player.role.data.left);
        }
      },
      roleAssigned: function (player) {
        if (!this.player.alive) return;

        let alive = this.game.alivePlayers();
        let index = alive.indexOf(this.player);

        var left = alive[index-1]
        if (index == (alive.length - 1)){
          var right = alive[0];
        } else {
          var right = alive[index+1];
        }

        this.player.role.data.left = left;
        this.player.role.data.left = right;

        if (left.role.alignment == "Village" &&
          right.role.alignment == "Village"){
          left.giveEffect("Immortal", this.player, this.player.role.data.right);
          right.giveEffect("Immortal", this.player, this.player.role.data.left);
        }
      },
      start: function () {
        if (!this.player.alive) return;

        let alive = this.game.alivePlayers();
        let index = alive.indexOf(this.player);

        var left = alive[index-1]
        if (index == (alive.length - 1)){
          var right = alive[0];
        } else {
          var right = alive[index+1];
        }

        this.player.role.data.left = left;
        this.player.role.data.left = right;

        if (left.role.alignment == "Village" &&
          right.role.alignment == "Village"){
          left.giveEffect("Immortal", this.player, this.player.role.data.right);
          right.giveEffect("Immortal", this.player, this.player.role.data.left);
        }
      }
    };
  }
}