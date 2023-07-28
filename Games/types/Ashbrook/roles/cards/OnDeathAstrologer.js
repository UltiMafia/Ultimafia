const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class OnDeathAstrologer extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Choose Player": {
        states: ["Sunset", "Dawn"],
        flags: ["voting", "mustAct"],
        whileDead: true,
        shouldMeet: function() {
          return this.data.astrologer;
        },
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            if (this.isInsane()) return;
            
            if (this.target.role.alignment == "Villager" 
              || this.target.role.alignment == "Outcast"){
              if (this.dominates()) this.target.kill();
            }
            this.actor.role.data.astrologer = false;
          },
        },
      },
    };

    this.listeners = {
      death: function (player, killer, killType, instant) {
        if (player !== this.player) {
          return;
        }
        
        this.data.astrologer = true;
      }
    };

    this.stateMods = {
      Day: {
        type: "delayActions",
        delayActions: true,
      },
      Sunset: {
        type: "add",
        index: 5,
        length: 1000 * 30,
        shouldSkip: function () {
          return !this.data.astrologer;
        }
      },
      Night: {
        type: "delayActions",
        delayActions: true,
      },
      Dawn: {
        type: "add",
        index: 3,
        length: 1000 * 30,
        shouldSkip: function () {
          return !this.data.astrologer;
        },
      },
    };
  }
}
