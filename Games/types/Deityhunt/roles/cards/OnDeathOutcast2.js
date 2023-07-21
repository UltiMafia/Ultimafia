const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class OnDeathOutcast2 extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Choose Player": {
        states: ["Night"],
        flags: ["voting"],
        shouldMeet: function() {
          return this.data.outcast2;
        },
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            if (this.target.role.alignment == "Villager" 
              || this.target.role.alignment == "Outcast"){
              if (this.dominates()) this.target.kill();
            }
            this.data.outcast2 = false;
          },
        },
      },
    };

    this.listeners = {
      death: function (player, killer, killType, instant) {
        if (player !== this.player) {
          return;
        }
        
        this.data.outcast2 = true;
      }
    };
  }
}
