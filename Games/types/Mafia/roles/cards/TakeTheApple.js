const Card = require("../../Card");
const { PRIORITY_REVEAL_TARGET_ON_DEATH } = require("../../const/Priority");

module.exports = class TakeTheApple extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType) {
        var mafia = alive.filter((p) => p.role.alignment == "Mafia");
        if (this.player.alive && mafia.length == 1)
          for (let player in this.game.players)
            player.holdItem("Bread");
            player.holdItem("Bread");
            if (player != this.player){
              if (!player.hasEffect("Famished")) player.giveEffect("Famished");
            } else {
              player.holdItem("Bread");
            }
          this.game.events.emit("takenApple");
      },
    };
    this.stealableListeners = {
      death: this,
    };
  }
};
