const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class OnDeathOutcast3 extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Choose Player": {
        states: ["Night"],
        flags: ["voting"],
        shouldMeet: function() {
          return this.data.outcast3;
        },
        action: {
          labels: ["block"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            if (this.target.role.alignment == "Follower" 
              || this.target.role.alignment == "Deity"){
              for (let player in this.game.players){
                if (this.target.role.alignment == "Villager" ||
                this.target.role.alignment == "Outcast"){
                  player.kill("default", this.actor);
                }
              }
            }
            this.data.outcast3 = false;
          },
        },
      },
    };

    this.listeners = {
      death: function (player, killer, killType, instant) {
        if (player !== this.player) {
          return;
        }
        
        this.data.outcast3 = true;
      }
    };
  }
}
