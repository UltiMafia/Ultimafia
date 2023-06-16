const Card = require("../../Card");

module.exports = class TakeTheApple extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (this.player.data.eveTriggered)
          return;

          var alive = this.game.players.filter(
            (p) => p.alive
          );
          var mafia = alive.filter((p) => p.role.alignment == "Mafia");
  
          if (this.player.alive && mafia.length == 1){
            for (let person of this.game.players){
              person.holdItem("Bread");
              if (person.hasEffect("Famished")){
                if (person.items[person.items.indexOf("Famished")].takenApple){
                  break
                }
              }
              if (person.hasEffect("Famished"))
                person.removeEffect("Famished", true);
              if (person == this.player){
                this.player.holdItem("Bread");
              }
              person.holdItem("Bread");
              person.queueAlert("Eve has taken the apple! The famine has started!");
              person.giveEffect("Famished", true);
            }
            this.player.data.eveTriggered = true;
          }
      },
      start: function () {
        var alive = this.game.players.filter(
          (p) => p.alive
        );
        var mafia = alive.filter((p) => p.role.alignment == "Mafia");

        if (this.player.alive && mafia.length == 1){
          for (let person of this.game.players){
            person.holdItem("Bread");
            if (person.hasEffect("Famished")){
              if (person.items[person.items.indexOf("Famished")].takenApple){
                break
              }
            }
            if (person.hasEffect("Famished"))
              person.removeEffect("Famished", true);
            if (person == this.player){
              this.player.holdItem("Bread");
            }
            person.holdItem("Bread");
            person.queueAlert("Eve has taken the apple! The famine has started!");
            person.giveEffect("Famished", true);
          }
          this.player.data.eveTriggered = true;
        }
      },
    };
    this.stealableListeners = {
      death: this,
    };
  }
};
