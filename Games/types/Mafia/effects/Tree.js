const Effect = require("../Effect");

module.exports = class Tree extends Effect {
  constructor(power, lifespan) {
    super("Tree");

    this.immunity["condemn"] = power || 3;
    this.immunity["convert"] = 1;
    this.immunity["kill"] = 5;
    this.cancelImmunity["ignite"] = Infinity;
    this.cancelImmunity["bomb"] = Infinity;
    this.listeners = {
      state: function (stateInfo) {
        for (let item of this.player.items) {
          if (item.name == "Room" && this.game.RoomOne.includes(this.player)) {
            item.meetings["Room 1"].canVote = false;
          }
          if (item.name == "Room" && this.game.RoomTwo.includes(this.player)) {
            item.meetings["Room 2"].canVote = false;
          }
        }
      },
    };
  }
  apply(player) {
    super.apply(player);

    player.queueAlert(":tree: You grow into a tree!");

    player.role.meetings["Village"].canVote = false;
  }
};
