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
          if (item.name == "Room" && item.Room && item.Room.name){
             item.meetings[item.Room.name].canVote = false;
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
